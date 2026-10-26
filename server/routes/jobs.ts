import { Router } from 'express';
import { getAdminFirestore, verifyIdToken } from '../middleware/verifyIdToken';
import { verifyJobCreationLimits } from '../jobLimit';
import type { EmployerProfile, Job, User } from '../../src/domain/types';

export const jobsRouter = Router();

jobsRouter.post('/jobs/create', verifyIdToken, async (req, res) => {
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return res.status(403).json({ error: 'Production job creation is unavailable in fictional demo mode.' });
  }

  const { uid } = req as typeof req & { uid?: string };
  const body = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';

  if (!uid || !title) {
    return res.status(400).json({ error: 'Opportunity title is required.' });
  }

  try {
    const db = getAdminFirestore();

    const userRef = db.doc(`users/${uid}`);
    const employerRef = db.doc(`employerProfiles/${uid}`);
    const [userSnap, employerSnap] = await Promise.all([userRef.get(), employerRef.get()]);

    if (!userSnap.exists || (userSnap.data() as User).role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can post opportunities.' });
    }

    if (!employerSnap.exists) {
      return res.status(404).json({ error: 'Employer profile not found.' });
    }

    const employer = employerSnap.data() as EmployerProfile;

    // Count open active jobs for this employer
    const activeJobsSnap = await db
      .collection('jobs')
      .where('employerId', '==', uid)
      .where('status', '==', 'open')
      .get();

    const activeJobCount = activeJobsSnap.size;

    // Server-side limit verification (with expiry check)
    const limitCheck = verifyJobCreationLimits({
      employerUid: uid,
      employerVerificationStatus: employer.verificationStatus,
      employerPlan: employer.plan || 'free',
      planExpiresAt: employer.planExpiresAt,
      currentActiveJobCount: activeJobCount,
    });

    if (!limitCheck.allowed) {
      return res.status(limitCheck.statusCode).json({ error: limitCheck.error });
    }

    // Build and save job record
    const jobId = `job_${Date.now()}`;
    const newJob: Partial<Job> = {
      id: jobId,
      employerId: uid,
      employerName: employer.businessName,
      employerVerified: employer.verificationStatus === 'verified',
      title,
      description: typeof body.description === 'string' ? body.description.trim() : '',
      responsibilities: Array.isArray(body.responsibilities) ? body.responsibilities : [],
      requiredSkillIds: Array.isArray(body.requiredSkillIds) ? body.requiredSkillIds : [],
      requiredSkillNames: Array.isArray(body.requiredSkillNames) ? body.requiredSkillNames : [],
      locationArea: typeof body.locationArea === 'string' ? body.locationArea : employer.locationArea,
      workMode: (body.workMode as any) || 'In-person',
      compensationAmount: Number(body.compensationAmount) || 0,
      compensationCurrency: 'ZAR',
      compensationUnit: (body.compensationUnit as any) || 'daily',
      engagementType: (body.engagementType as any) || 'casual',
      startDate: typeof body.startDate === 'string' ? body.startDate : new Date().toISOString().split('T')[0],
      endDate: typeof body.endDate === 'string' ? body.endDate : undefined,
      applicationDeadline: typeof body.applicationDeadline === 'string' ? body.applicationDeadline : '',
      status: 'open',
      reportCount: 0,
      createdAt: new Date().toISOString(),
    };

    await db.doc(`jobs/${jobId}`).set(newJob);

    return res.status(201).json({ success: true, job: newJob });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to publish opportunity';
    return res.status(500).json({ error: message });
  }
});
