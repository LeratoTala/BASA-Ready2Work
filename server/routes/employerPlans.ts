import { Router } from 'express';
import { getAdminFirestore, verifyIdToken } from '../middleware/verifyIdToken';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';
import {
  validateUpgradeRequest,
  validatePlanChange,
  validateAdminApproveUpgrade,
} from '../employerPlanOps';
import type { EmployerProfile, EmployerUpgradeRequest } from '../../src/domain/types';
import type { EmployerPlanId } from '../../src/config/plans';

export const employerPlansRouter = Router();

/**
 * POST /api/employer/upgrade-request
 *
 * Creates a pending upgrade request document in /upgradeRequests.
 * Updates employer planStatus to 'upgrade_pending' while preserving current plan.
 * Reference: Section 39 (Honest Upgrade Flow & Server Security Rules Plan Lock).
 */
employerPlansRouter.post('/employer/upgrade-request', verifyIdToken, async (req, res) => {
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return res.status(403).json({ error: 'Firestore upgrade requests are disabled in fictional demo mode.' });
  }

  const { uid: callerUid } = req as typeof req & { uid?: string };
  const body = (req.body ?? {}) as Record<string, unknown>;
  const employerId = typeof body.employerId === 'string' ? body.employerId.trim() : '';
  const targetPlan = body.targetPlan as EmployerPlanId;
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : '';
  const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : '';
  const billingEmail = typeof body.billingEmail === 'string' ? body.billingEmail.trim() : '';
  const poNumber = typeof body.poNumber === 'string' ? body.poNumber.trim() : undefined;

  if (!employerId) {
    return res.status(400).json({ error: 'employerId is required.' });
  }

  try {
    const db = getAdminFirestore();
    const employerRef = db.doc(`employerProfiles/${employerId}`);
    const employerSnap = await employerRef.get();

    if (!employerSnap.exists) {
      return res.status(404).json({ error: 'Employer profile not found.' });
    }

    const employerData = employerSnap.data() as EmployerProfile;
    const currentPlan = (employerData.plan || 'free') as EmployerPlanId;

    const validation = validateUpgradeRequest({
      callerUid,
      employerId,
      targetPlan,
      currentPlan,
      notes,
    });

    if (!validation.valid) {
      return res.status(validation.statusCode).json({ error: validation.error });
    }

    const now = new Date().toISOString();
    const reqRef = db.collection('upgradeRequests').doc();
    const newReq: EmployerUpgradeRequest = {
      id: reqRef.id,
      employerUid: employerId,
      businessName: businessName || employerData.companyName || 'Registered Employer',
      targetPlan,
      contactName: contactName || employerData.contactName || '',
      billingEmail: billingEmail || employerData.contactEmail || '',
      poNumber,
      status: 'pending',
      requestedAt: now,
    };

    await reqRef.set(newReq);

    // Section 39 Honest Flow: update planStatus to upgrade_pending without changing plan
    await employerRef.update({
      planStatus: 'upgrade_pending',
      updatedAt: now,
    });

    return res.status(201).json({
      success: true,
      request: newReq,
      message: 'Upgrade request submitted. A BASA administrator will invoice and activate manually during the pilot.',
    });
  } catch (err: any) {
    console.error('[EmployerPlans] Error creating upgrade request:', err);
    return res.status(500).json({ error: 'Failed to process upgrade request. Please try again.' });
  }
});

/**
 * POST /api/employer/change-plan
 *
 * Downgrades or cancels an employer's subscription back to Free (or lower tier).
 * Validates that it is a genuine downgrade (not an upgrade bypass).
 * Records an immutable audit log entry.
 * Invariant: Existing jobs and applicants are never deleted.
 */
employerPlansRouter.post('/employer/change-plan', verifyIdToken, async (req, res) => {
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return res.status(403).json({ error: 'Firestore plan changes are disabled in fictional demo mode.' });
  }

  const { uid: callerUid } = req as typeof req & { uid?: string };
  const body = (req.body ?? {}) as Record<string, unknown>;
  const employerId = typeof body.employerId === 'string' ? body.employerId.trim() : '';
  const targetPlan = body.targetPlan as EmployerPlanId;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!employerId) {
    return res.status(400).json({ error: 'employerId is required.' });
  }

  try {
    const db = getAdminFirestore();
    const employerRef = db.doc(`employerProfiles/${employerId}`);
    const employerSnap = await employerRef.get();

    if (!employerSnap.exists) {
      return res.status(404).json({ error: 'Employer profile not found.' });
    }

    const employerData = employerSnap.data() as EmployerProfile;
    const currentPlan = (employerData.plan || 'free') as EmployerPlanId;

    const validation = validatePlanChange({
      callerUid,
      employerId,
      targetPlan,
      currentPlan,
      reason,
    });

    if (!validation.valid) {
      return res.status(validation.statusCode).json({ error: validation.error });
    }

    const now = new Date().toISOString();

    // Security Rules plan lock: Admin SDK updates plan & planStatus
    await employerRef.update({
      plan: targetPlan,
      planStatus: 'active',
      planSince: now,
      updatedAt: now,
    });

    // Write audit log entry
    await db.collection('auditLogs').add({
      action: 'employer_plan_downgrade',
      employerId,
      previousPlan: currentPlan,
      newPlan: targetPlan,
      reason: reason || 'Employer self-service downgrade or cancellation to free tier',
      timestamp: now,
      performedBy: callerUid,
    });

    return res.json({
      success: true,
      plan: targetPlan,
      planStatus: 'active',
      message: `Plan changed to ${targetPlan}. Existing jobs and applicants remain accessible.`,
    });
  } catch (err: any) {
    console.error('[EmployerPlans] Error changing plan:', err);
    return res.status(500).json({ error: 'Failed to update plan. Please try again.' });
  }
});

/**
 * POST /api/admin/approve-upgrade
 *
 * Administrator-only action to approve or decline a pending upgrade request.
 * Sets request status to approved/declined and activates employer plan.
 */
employerPlansRouter.post('/admin/approve-upgrade', verifyIdToken, async (req, res) => {
  if (process.env.VITE_ENABLE_DEMO_DATA === 'true') {
    return res.status(403).json({ error: 'Admin plan actions are disabled in fictional demo mode.' });
  }

  const { uid: callerUid } = req as typeof req & { uid?: string };
  if (!callerUid) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Check admin privileges via custom claim
  let callerIsAdmin = false;
  try {
    const callerRecord = await getAuth(getApps()[0]).getUser(callerUid);
    callerIsAdmin = (callerRecord.customClaims ?? {})['admin'] === true;
  } catch {
    return res.status(403).json({ error: 'Could not verify admin credentials.' });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const requestId = typeof body.requestId === 'string' ? body.requestId.trim() : '';
  const decision = body.decision as 'approved' | 'declined';
  const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() : '';

  try {
    const db = getAdminFirestore();
    const reqRef = db.doc(`upgradeRequests/${requestId}`);
    const reqSnap = await reqRef.get();

    if (!reqSnap.exists) {
      return res.status(404).json({ error: 'Upgrade request not found.' });
    }

    const reqData = reqSnap.data() as EmployerUpgradeRequest;

    const validation = validateAdminApproveUpgrade({
      callerUid,
      callerIsAdmin,
      requestId,
      decision,
      currentRequestStatus: reqData.status,
    });

    if (!validation.valid) {
      return res.status(validation.statusCode).json({ error: validation.error });
    }

    const now = new Date().toISOString();
    const employerRef = db.doc(`employerProfiles/${reqData.employerUid}`);

    if (decision === 'approved') {
      await reqRef.update({
        status: 'approved',
        reviewedBy: callerUid,
        reviewedAt: now,
        adminNote: adminNote || 'Approved and activated by admin.',
      });

      await employerRef.update({
        plan: reqData.targetPlan,
        planStatus: 'active',
        planSince: now,
        updatedAt: now,
      });

      await db.collection('auditLogs').add({
        action: 'admin_approve_upgrade',
        requestId,
        employerUid: reqData.employerUid,
        targetPlan: reqData.targetPlan,
        adminUid: callerUid,
        timestamp: now,
      });
    } else {
      await reqRef.update({
        status: 'declined',
        reviewedBy: callerUid,
        reviewedAt: now,
        adminNote: adminNote || 'Declined during administrative review.',
      });

      await employerRef.update({
        planStatus: 'declined',
        updatedAt: now,
      });

      await db.collection('auditLogs').add({
        action: 'admin_decline_upgrade',
        requestId,
        employerUid: reqData.employerUid,
        targetPlan: reqData.targetPlan,
        adminUid: callerUid,
        adminNote,
        timestamp: now,
      });
    }

    return res.json({
      success: true,
      decision,
      status: decision,
    });
  } catch (err: any) {
    console.error('[EmployerPlans] Error processing upgrade decision:', err);
    return res.status(500).json({ error: 'Failed to process upgrade decision.' });
  }
});
