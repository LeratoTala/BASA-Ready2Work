import { Router } from 'express';
import { getAdminFirestore, verifyIdToken } from '../middleware/verifyIdToken';
import { buildRegistrationData } from '../registration';

export const registerRouter = Router();

registerRouter.post('/register', verifyIdToken, async (req, res) => {
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return res.status(403).json({ error: 'Account registration is unavailable in fictional demo mode.' });
  }

  const { uid, tokenEmail } = req as typeof req & { uid?: string; tokenEmail?: string };
  let data;
  try {
    data = buildRegistrationData(uid ?? '', tokenEmail ?? '', req.body, new Date().toISOString());
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid registration.' });
  }

  try {
    const db = getAdminFirestore();
    let alreadyRegistered = false;
    let existingRole = '';

    await db.runTransaction(async (transaction) => {
      const userRef = db.doc(`users/${data.user.uid}`);
      const userSnap = await transaction.get(userRef);
      if (userSnap.exists) {
        alreadyRegistered = true;
        existingRole = (userSnap.data() as any)?.role ?? data.user.role;
        return;
      }
      transaction.create(userRef, data.user);
      if (data.candidateProfile && data.candidatePrivateProfile) {
        transaction.create(db.doc(`candidateProfiles/${data.user.uid}`), data.candidateProfile);
        transaction.create(db.doc(`candidatePrivateProfiles/${data.user.uid}`), data.candidatePrivateProfile);
      }
      if (data.employerProfile) {
        transaction.create(db.doc(`employerProfiles/${data.user.uid}`), data.employerProfile);
      }
    });

    if (alreadyRegistered) {
      return res.status(200).json({ uid: data.user.uid, role: existingRole || data.user.role, alreadyRegistered: true });
    }
    return res.status(201).json({ uid: data.user.uid, role: data.user.role });
  } catch (error) {
    console.error('Account registration failed:', error);
    return res.status(500).json({ error: 'Could not create your account. Please try again.' });
  }
});