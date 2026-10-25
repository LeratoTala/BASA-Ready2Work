import { Router } from 'express';
import { getAdminFirestore, verifyIdToken } from '../middleware/verifyIdToken';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

export const deleteAccountRouter = Router();

/**
 * DELETE /api/delete-account
 *
 * POPIA deletion completion route (FR-03 launch blocker).
 * The candidate must have an existing deletion request in `in_review` status
 * (an admin must have reviewed it first). This endpoint then:
 *   1. Verifies the request is in `in_review` state.
 *   2. Deletes all Firestore documents belonging to the UID.
 *   3. Deletes all Storage objects under evidence/{uid}/.
 *   4. Deletes the Firebase Auth account.
 *
 * The Admin SDK bypasses Firestore rules, so the `allow delete: if false`
 * rule on privacyDeletionRequests is not a blocker here.
 */
deleteAccountRouter.delete('/delete-account', verifyIdToken, async (req, res) => {
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return res.status(403).json({ error: 'Account deletion is unavailable in demo mode.' });
  }

  const { uid: adminUid } = req as typeof req & { uid?: string };
  if (!adminUid) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Admins call this on behalf of a candidate; the target UID is passed in the header.
  const targetUid = (req.headers['x-target-uid'] as string | undefined)?.trim();
  if (!targetUid) {
    return res.status(400).json({ error: 'Missing X-Target-Uid header specifying the account to delete.' });
  }
  const uid = targetUid;

  try {
    const db = getAdminFirestore();

    // Verify the caller is an admin via their custom claim
    const callerToken = await getAuth(getApps()[0]).getUser(adminUid);
    const customClaims = callerToken.customClaims ?? {};
    if (customClaims['admin'] !== true) {
      return res.status(403).json({ error: 'Admin authorization required to complete account deletion.' });
    }

    // 1. Confirm a deletion request exists and is in_review
    const requestRef = db.doc(`privacyDeletionRequests/${uid}`);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
      return res.status(400).json({
        error: 'No deletion request found. Please submit a deletion request from your profile page first.',
      });
    }
    const requestData = requestSnap.data() as { status: string };
    if (requestData.status !== 'in_review') {
      return res.status(400).json({
        error: `Deletion request is currently "${requestData.status}". An admin must mark it "in_review" before it can be completed.`,
      });
    }

    // 2. Delete all Firestore collections that contain candidate data
    const collectionsToDelete = [
      `users/${uid}`,
      `candidateProfiles/${uid}`,
      `candidatePrivateProfiles/${uid}`,
      `privacyDeletionRequests/${uid}`,
      `notificationPreferences/${uid}`,
    ];

    // Sub-collections and query-based deletions
    const queryCollections = [
      db.collection('skillClaims').where('candidateId', '==', uid),
      db.collection('assessments').where('candidateId', '==', uid),
      db.collection('applications').where('candidateId', '==', uid),
      db.collection('workRecords').where('candidateId', '==', uid),
      db.collection('reports').where('reporterId', '==', uid),
      db.collection('notifications').where('userId', '==', uid),
      db.collection('endorsements').where('candidateId', '==', uid),
      db.collection('mentorReviews').where('candidateId', '==', uid),
    ];

    // Resolve all queries in parallel
    const queryResults = await Promise.all(queryCollections.map((q) => q.get()));

    // Write deletes in batches of 500 (Firestore batch limit)
    const allDocRefs = [
      ...collectionsToDelete.map((path) => db.doc(path)),
      ...queryResults.flatMap((snap) => snap.docs.map((d) => d.ref)),
    ];

    const BATCH_SIZE = 400;
    for (let i = 0; i < allDocRefs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      allDocRefs.slice(i, i + BATCH_SIZE).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    // 3. Delete Firebase Storage evidence objects.
    // Path must match the prefix used by uploadCandidateEvidence in src/services/evidenceStorage.ts.
    try {
      const storageBucket = getStorage(getApps()[0]).bucket();
      const [files] = await storageBucket.getFiles({ prefix: `candidate-evidence/${uid}/` });
      await Promise.all(files.map((f) => f.delete()));
    } catch (storageError) {
      // Storage may not be configured (e.g. VITE_FIREBASE_STORAGE_BUCKET empty). Log but don't fail.
      console.warn(`POPIA deletion: could not delete Storage objects for ${uid}:`, storageError);
    }

    // 4. Delete the Firebase Auth account last (so recovery is still possible if steps above fail)
    await getAuth(getApps()[0]).deleteUser(uid);

    console.log(`POPIA deletion completed for uid=${uid}`);
    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('POPIA account deletion failed:', error);
    return res.status(500).json({ error: 'Account deletion failed. Please try again or contact support.' });
  }
});
