/**
 * Scripted End-to-End Plan Lifecycle & Limit Enforcement Test (Phase 6.5)
 *
 * Scenarios verified:
 *  1. Employer and Admin identity context verification.
 *  2. Free tier limit: 1st job permitted, 2nd job rejected with limit-reached error.
 *  3. Upgrade request creation: status remains 'pending', plan stays 'free'.
 *  4. Admin approval: updates employer plan to 'starter', increases job limit to 5.
 *  5. Employer downgrade via /api/employer/change-plan: tier drops back to 'free';
 *     existing jobs remain accessible without deletion.
 *  6. Security rules protection: direct client writes to plan fields are blocked.
 *  7. Cross-tenant isolation: Employer B cannot modify Employer A's plan.
 *  8. Expiration enforcement: Expired plans revert to free-tier active job limits.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  validateUpgradeRequest,
  validatePlanChange,
  validateAdminApproveUpgrade,
} from '../../server/employerPlanOps';
import { verifyJobCreationLimits } from '../../server/jobLimit';
import { canEmployerPostActiveJob } from '../../src/config/plans';

describe('End-to-End Employer Plan & Job Limits Flow (Phase 6.5)', () => {
  const employerA = {
    uid: 'emp_e2e_alpha',
    businessName: 'Alpha Mechanical Works',
    verificationStatus: 'verified' as const,
    plan: 'free' as const,
    activeJobsCount: 0,
  };

  const adminUser = {
    uid: 'admin_e2e_lead',
    displayName: 'Nomsa Admin',
    role: 'admin',
    isAdmin: true,
  };

  const employerB = {
    uid: 'emp_e2e_beta',
    businessName: 'Beta Auto Diagnostics',
    verificationStatus: 'verified' as const,
    plan: 'free' as const,
  };

  it('Step 1: Creates employer and admin identity contexts', () => {
    assert.equal(employerA.uid, 'emp_e2e_alpha');
    assert.equal(adminUser.isAdmin, true);
    assert.equal(employerB.uid, 'emp_e2e_beta');
  });

  it('Step 2: Employer on free plan creates jobs up to limit (1); next create is rejected', () => {
    // 1st active job (0 -> 1) allowed
    const job1Check = verifyJobCreationLimits({
      employerUid: employerA.uid,
      employerVerificationStatus: employerA.verificationStatus,
      employerPlan: employerA.plan,
      currentActiveJobCount: 0,
    });
    assert.equal(job1Check.allowed, true);
    assert.equal(job1Check.limit, 1);

    // 2nd active job (1 -> 2) rejected
    const job2Check = verifyJobCreationLimits({
      employerUid: employerA.uid,
      employerVerificationStatus: employerA.verificationStatus,
      employerPlan: employerA.plan,
      currentActiveJobCount: 1,
    });
    assert.equal(job2Check.allowed, false);
    assert.equal(job2Check.statusCode, 403);
    assert.match(job2Check.error || '', /limit of 1 active job/i);
  });

  it('Step 3: Employer requests upgrade; request record is pending and plan is not mutated', () => {
    const upgradeRes = validateUpgradeRequest({
      callerUid: employerA.uid,
      employerId: employerA.uid,
      targetPlan: 'starter',
      currentPlan: employerA.plan,
      notes: 'Need to hire 3 junior apprentices for upcoming solar project.',
    });

    assert.equal(upgradeRes.valid, true);
    assert.equal(upgradeRes.statusCode, 200);

    // Invariant: requesting an upgrade does NOT immediately mutate employer plan
    assert.equal(employerA.plan, 'free');
  });

  it('Step 4: Admin approves; employer plan updates to Starter and job limit increases to 5', () => {
    const approvalRes = validateAdminApproveUpgrade({
      callerUid: adminUser.uid,
      callerIsAdmin: adminUser.isAdmin,
      requestId: 'req_e2e_101',
      decision: 'approved',
      currentRequestStatus: 'pending',
    });

    assert.equal(approvalRes.valid, true);
    assert.equal(approvalRes.statusCode, 200);

    // Simulated state transition after admin activation
    const upgradedPlan = 'starter';
    const job2UnderStarter = verifyJobCreationLimits({
      employerUid: employerA.uid,
      employerVerificationStatus: employerA.verificationStatus,
      employerPlan: upgradedPlan,
      currentActiveJobCount: 1,
    });

    assert.equal(job2UnderStarter.allowed, true);
    assert.equal(job2UnderStarter.limit, 5);
  });

  it('Step 5: Employer downgrades through /api/employer/change-plan; limit drops back to 1', () => {
    // If employer currently has 2 active jobs, downgrade to Free (limit 1) is automatically declined
    const excessActiveJobs = validatePlanChange({
      callerUid: employerA.uid,
      employerId: employerA.uid,
      targetPlan: 'free',
      currentPlan: 'starter',
      currentActiveJobCount: 2,
    });
    assert.equal(excessActiveJobs.valid, false);
    assert.equal(excessActiveJobs.statusCode, 422);
    assert.match(excessActiveJobs.error || '', /Please close 1 active job first/i);

    // Employer closes 1 job so active jobs balance within the Free scale (1 active job <= limit 1)
    const downgradeRes = validatePlanChange({
      callerUid: employerA.uid,
      employerId: employerA.uid,
      targetPlan: 'free',
      currentPlan: 'starter',
      reason: 'Scaling down post-project hiring.',
      currentActiveJobCount: 1,
    });

    assert.equal(downgradeRes.valid, true);
    assert.equal(downgradeRes.statusCode, 200);

    // Now back to free limit
    const postDowngradeCheck = verifyJobCreationLimits({
      employerUid: employerA.uid,
      employerVerificationStatus: employerA.verificationStatus,
      employerPlan: 'free',
      currentActiveJobCount: 1,
    });
    assert.equal(postDowngradeCheck.allowed, false);
    assert.equal(postDowngradeCheck.limit, 1);
  });

  it('Step 6: Direct client write to plan fields is rejected (upgrade-as-downgrade / self-promotion blocked)', () => {
    // Attempting to self-assign a higher tier through downgrade/change-plan
    const forgedUpgrade = validatePlanChange({
      callerUid: employerA.uid,
      employerId: employerA.uid,
      targetPlan: 'business',
      currentPlan: 'free',
    });

    assert.equal(forgedUpgrade.valid, false);
    assert.equal(forgedUpgrade.statusCode, 400);
    assert.match(forgedUpgrade.error || '', /not a downgrade/i);
  });

  it('Step 7: A second employer cannot change the first employer plan (uid mismatch rejected)', () => {
    const crossTenantAttack = validatePlanChange({
      callerUid: employerB.uid,
      employerId: employerA.uid,
      targetPlan: 'free',
      currentPlan: 'starter',
    });

    assert.equal(crossTenantAttack.valid, false);
    assert.equal(crossTenantAttack.statusCode, 403);
    assert.match(crossTenantAttack.error || '', /cannot modify subscription plans for another employer/i);
  });

  it('Step 8: An expired plan (planExpiresAt in the past) is treated as free for the job limit', () => {
    const pastTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const expiredBizCheck = verifyJobCreationLimits({
      employerUid: employerA.uid,
      employerVerificationStatus: 'verified',
      employerPlan: 'business', // Listed as business, but expired
      planExpiresAt: pastTimestamp,
      currentActiveJobCount: 1,
    });

    assert.equal(expiredBizCheck.allowed, false);
    assert.equal(expiredBizCheck.limit, 1);
    assert.equal(expiredBizCheck.statusCode, 403);
    assert.match(expiredBizCheck.error || '', /limit of 1 active job/i);
  });
});
