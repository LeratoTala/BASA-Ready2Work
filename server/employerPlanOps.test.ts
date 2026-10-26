import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  validateUpgradeRequest,
  validatePlanChange,
  validateAdminApproveUpgrade,
  PLAN_RANK,
} from './employerPlanOps';

describe('Server-Side Employer Plan Operations (Section 39 / Phase 3)', () => {
  describe('validateUpgradeRequest', () => {
    it('rejects unauthenticated caller (auth failure)', () => {
      const res = validateUpgradeRequest({
        callerUid: undefined,
        employerId: 'emp_123',
        targetPlan: 'starter',
        currentPlan: 'free',
      });

      assert.equal(res.valid, false);
      assert.equal(res.statusCode, 401);
      assert.match(res.error || '', /Authentication required/i);
    });

    it('rejects caller trying to submit upgrade for another employer (wrong uid)', () => {
      const res = validateUpgradeRequest({
        callerUid: 'attacker_456',
        employerId: 'victim_emp_123',
        targetPlan: 'business',
        currentPlan: 'free',
      });

      assert.equal(res.valid, false);
      assert.equal(res.statusCode, 403);
      assert.match(res.error || '', /cannot submit upgrade requests for another employer/i);
    });

    it('rejects invalid or downgrade target plan as an upgrade', () => {
      // Starter trying to "upgrade" to starter (same)
      const sameTier = validateUpgradeRequest({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'starter',
        currentPlan: 'starter',
      });
      assert.equal(sameTier.valid, false);
      assert.equal(sameTier.statusCode, 400);

      // Business trying to "upgrade" to starter (lower)
      const lowerTier = validateUpgradeRequest({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'starter',
        currentPlan: 'business',
      });
      assert.equal(lowerTier.valid, false);
      assert.equal(lowerTier.statusCode, 400);
      assert.match(lowerTier.error || '', /not higher than current plan/i);
    });

    it('allows valid upgrade request from free to starter or business', () => {
      const validReq = validateUpgradeRequest({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'starter',
        currentPlan: 'free',
      });

      assert.equal(validReq.valid, true);
      assert.equal(validReq.statusCode, 200);

      const validBusiness = validateUpgradeRequest({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'business',
        currentPlan: 'starter',
      });
      assert.equal(validBusiness.valid, true);
    });
  });

  describe('validatePlanChange (Downgrade / Cancellation)', () => {
    it('rejects unauthenticated caller (auth failure)', () => {
      const res = validatePlanChange({
        callerUid: undefined,
        employerId: 'emp_123',
        targetPlan: 'free',
        currentPlan: 'starter',
      });

      assert.equal(res.valid, false);
      assert.equal(res.statusCode, 401);
      assert.match(res.error || '', /Authentication required/i);
    });

    it('rejects caller modifying plan for another employer (wrong uid)', () => {
      const res = validatePlanChange({
        callerUid: 'attacker_999',
        employerId: 'emp_123',
        targetPlan: 'free',
        currentPlan: 'starter',
      });

      assert.equal(res.valid, false);
      assert.equal(res.statusCode, 403);
      assert.match(res.error || '', /cannot modify subscription plans for another employer/i);
    });

    it('rejects invalid upgrade-as-downgrade (e.g. Free -> Starter or Starter -> Business)', () => {
      const invalidUpgrade = validatePlanChange({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'starter',
        currentPlan: 'free',
      });

      assert.equal(invalidUpgrade.valid, false);
      assert.equal(invalidUpgrade.statusCode, 400);
      assert.match(invalidUpgrade.error || '', /not a downgrade/i);

      const samePlan = validatePlanChange({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'starter',
        currentPlan: 'starter',
      });
      assert.equal(samePlan.valid, false);
      assert.equal(samePlan.statusCode, 400);
    });

    it('allows valid downgrade (Business -> Starter, Starter -> Free, Business -> Free)', () => {
      const toStarter = validatePlanChange({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'starter',
        currentPlan: 'business',
      });
      assert.equal(toStarter.valid, true);
      assert.equal(toStarter.statusCode, 200);

      const toFree = validatePlanChange({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'free',
        currentPlan: 'starter',
      });
      assert.equal(toFree.valid, true);
      assert.equal(toFree.statusCode, 200);

      const cancelFromBusiness = validatePlanChange({
        callerUid: 'emp_123',
        employerId: 'emp_123',
        targetPlan: 'free',
        currentPlan: 'business',
      });
      assert.equal(cancelFromBusiness.valid, true);
      assert.equal(cancelFromBusiness.statusCode, 200);
    });
  });

  describe('validateAdminApproveUpgrade', () => {
    it('rejects non-admin caller (forbidden)', () => {
      const res = validateAdminApproveUpgrade({
        callerUid: 'normal_user_123',
        callerIsAdmin: false,
        requestId: 'req_001',
        decision: 'approved',
        currentRequestStatus: 'pending',
      });

      assert.equal(res.valid, false);
      assert.equal(res.statusCode, 403);
      assert.match(res.error || '', /Administrator privileges required/i);
    });

    it('rejects missing requestId or invalid decision string', () => {
      const missingId = validateAdminApproveUpgrade({
        callerUid: 'admin_1',
        callerIsAdmin: true,
        requestId: '',
        decision: 'approved',
      });
      assert.equal(missingId.valid, false);
      assert.equal(missingId.statusCode, 400);

      const badDecision = validateAdminApproveUpgrade({
        callerUid: 'admin_1',
        callerIsAdmin: true,
        requestId: 'req_001',
        decision: 'invalid_choice' as any,
      });
      assert.equal(badDecision.valid, false);
      assert.equal(badDecision.statusCode, 400);
    });

    it('rejects already processed requests (not pending)', () => {
      const alreadyApproved = validateAdminApproveUpgrade({
        callerUid: 'admin_1',
        callerIsAdmin: true,
        requestId: 'req_001',
        decision: 'approved',
        currentRequestStatus: 'approved',
      });

      assert.equal(alreadyApproved.valid, false);
      assert.equal(alreadyApproved.statusCode, 400);
      assert.match(alreadyApproved.error || '', /already been processed/i);
    });

    it('allows valid approval and decline by admin', () => {
      const approveRes = validateAdminApproveUpgrade({
        callerUid: 'admin_1',
        callerIsAdmin: true,
        requestId: 'req_001',
        decision: 'approved',
        currentRequestStatus: 'pending',
      });
      assert.equal(approveRes.valid, true);
      assert.equal(approveRes.statusCode, 200);

      const declineRes = validateAdminApproveUpgrade({
        callerUid: 'admin_1',
        callerIsAdmin: true,
        requestId: 'req_001',
        decision: 'declined',
        currentRequestStatus: 'pending',
      });
      assert.equal(declineRes.valid, true);
      assert.equal(declineRes.statusCode, 200);
    });
  });
});
