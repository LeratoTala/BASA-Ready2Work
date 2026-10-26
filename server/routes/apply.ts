import { Router } from 'express';
import type { Application, CandidateProfile, Job, SkillClaim, User } from '../../src/domain/types';
import { getAdminFirestore, verifyIdToken } from '../middleware/verifyIdToken';
import { buildApplicationRecord } from '../application';

export const applyRouter = Router();

applyRouter.post('/apply', verifyIdToken, async (req, res) => {
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return res.status(403).json({ error: 'Applications are unavailable in fictional demo mode.' });
  }

  const { uid } = req as typeof req & { uid?: string };
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const jobId = typeof body.jobId === 'string' ? body.jobId : '';
  if (!uid || !jobId || jobId.includes('/')) {
    return res.status(400).json({ error: 'Choose an available opportunity and try again.' });
  }

  try {
    const db = getAdminFirestore();
    const applicationRef = db.doc(`applications/${jobId}_${uid}`);
    const now = new Date().toISOString();

    const application = await db.runTransaction(async (transaction) => {
      const userRef = db.doc(`users/${uid}`);
      const profileRef = db.doc(`candidateProfiles/${uid}`);
      const jobRef = db.doc(`jobs/${jobId}`);
      const [userSnap, profileSnap, jobSnap, existingApp] = await Promise.all([
        transaction.get(userRef),
        transaction.get(profileRef),
        transaction.get(jobRef),
        transaction.get(applicationRef),
      ]);

      if (existingApp.exists) throw new Error('You have already applied for this opportunity.');
      if (!userSnap.exists || (userSnap.data() as User).role !== 'candidate'
        || (userSnap.data() as User).accountStatus !== 'active') {
        throw new Error('Only active candidate accounts can apply.');
      }
      if (!profileSnap.exists) throw new Error('Please complete your profile before applying.');
      if (!jobSnap.exists) throw new Error('This opportunity is no longer available.');

      const candidate = profileSnap.data() as CandidateProfile;
      const job = jobSnap.data() as Job;
      if (job.status !== 'open') throw new Error('This opportunity is closed or suspended.');
      const deadline = Date.parse(job.applicationDeadline);
      if (Number.isFinite(deadline) && Date.now() > deadline) {
        throw new Error('The application deadline has passed.');
      }

      const claimsQuery = db.collection('skillClaims').where('candidateId', '==', uid);
      const claimsSnap = await transaction.get(claimsQuery);
      const claims = claimsSnap.docs.map((claim) => claim.data() as SkillClaim);
      const record: Application = buildApplicationRecord(job, candidate, claims, now);
      const candidateAccessRef = db.doc(`employerCandidateAccess/${job.employerId}/candidates/${uid}`);
      const accessSnap = await transaction.get(candidateAccessRef);
      const existingIds = accessSnap.exists ? accessSnap.get('applicationIds') as string[] : [];

      transaction.create(applicationRef, record);
      transaction.set(candidateAccessRef, {
        candidateId: uid,
        employerId: job.employerId,
        applicationIds: [...new Set([...existingIds, record.id])],
        latestApplicationId: record.id,
        updatedAt: now,
      });
      return record;
    });

    return res.status(201).json({ application });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'You have already applied for this opportunity.') return res.status(409).json({ error: message });
    if (message === 'Only active candidate accounts can apply.') return res.status(403).json({ error: message });
    if (message === 'Please complete your profile before applying.'
      || message === 'This opportunity is no longer available.'
      || message === 'This opportunity is closed or suspended.'
      || message === 'The application deadline has passed.') {
      return res.status(400).json({ error: message });
    }
    console.error('Application submission failed.');
    return res.status(500).json({ error: 'Could not submit your application. Please try again.' });
  }
});