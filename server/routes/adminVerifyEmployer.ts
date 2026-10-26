import { Router } from 'express';
import { getAdminFirestore, verifyIdToken } from '../middleware/verifyIdToken';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';

export const adminVerifyEmployerRouter = Router();

/**
 * POST /api/admin/verify-employer
 *
 * Admin-only route to set an employer's verificationStatus to 'verified' or 'unverified'.
 * Firestore rules prevent clients from writing verificationStatus (it's admin-controlled),
 * so this Admin SDK route is the authorised path.
 *
 * Body: { employerUid: string, status: 'verified' | 'unverified' }
 */
adminVerifyEmployerRouter.post('/admin/verify-employer', verifyIdToken, async (req, res) => {
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return res.status(403).json({ error: 'Admin actions are unavailable in demo mode.' });
  }

  const { uid: callerUid } = req as typeof req & { uid?: string };
  if (!callerUid) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Verify the caller has the admin custom claim
  try {
    const callerRecord = await getAuth(getApps()[0]).getUser(callerUid);
    if ((callerRecord.customClaims ?? {})['admin'] !== true) {
      return res.status(403).json({ error: 'Admin authorization required.' });
    }
  } catch {
    return res.status(403).json({ error: 'Could not verify admin credentials.' });
  }

  const body = req.body as Record<string, unknown>;
  const employerUid = typeof body.employerUid === 'string' ? body.employerUid.trim() : '';
  const status = body.status;

  if (!employerUid) {
    return res.status(400).json({ error: 'employerUid is required.' });
  }
  if (status !== 'verified' && status !== 'unverified') {
    return res.status(400).json({ error: 'status must be "verified" or "unverified".' });
  }

  try {
    const db = getAdminFirestore();
    const employerRef = db.doc(`employerProfiles/${employerUid}`);
    const snap = await employerRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Employer profile not found.' });
    }

    await employerRef.update({ verificationStatus: status });
    return res.status(200).json({ updated: true, employerUid, status });
  } catch (error) {
    console.error('Employer verification update failed:', error);
    return res.status(500).json({ error: 'Could not update employer verification status.' });
  }
});
