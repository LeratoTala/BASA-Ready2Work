import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { verifyJobCreationLimits } from './jobLimit';

describe('Server-Side Job Creation Limits Enforcement (Section 39 / Requirement 1)', () => {
  it('blocks unverified employers from creating jobs', () => {
    const res = verifyJobCreationLimits({
      employerUid: 'emp_unverified',
      employerVerificationStatus: 'unverified',
      employerPlan: 'free',
      currentActiveJobCount: 0,
    });

    assert.equal(res.allowed, false);
    assert.equal(res.statusCode, 403);
    assert.match(res.error || '', /Only verified registered employers/i);
  });

  it('enforces Free tier limit of 1 active job on the server', () => {
    // 0 active jobs: allowed
    const firstJob = verifyJobCreationLimits({
      employerUid: 'emp_free',
      employerVerificationStatus: 'verified',
      employerPlan: 'free',
      currentActiveJobCount: 0,
    });
    assert.equal(firstJob.allowed, true);
    assert.equal(firstJob.limit, 1);

    // 1 active job: blocked from 2nd
    const secondJob = verifyJobCreationLimits({
      employerUid: 'emp_free',
      employerVerificationStatus: 'verified',
      employerPlan: 'free',
      currentActiveJobCount: 1,
    });
    assert.equal(secondJob.allowed, false);
    assert.equal(secondJob.statusCode, 403);
    assert.match(secondJob.error || '', /limit of 1 active job/i);
  });

  it('enforces Starter tier limit of 5 active jobs on the server', () => {
    const underLimit = verifyJobCreationLimits({
      employerUid: 'emp_starter',
      employerVerificationStatus: 'verified',
      employerPlan: 'starter',
      currentActiveJobCount: 4,
    });
    assert.equal(underLimit.allowed, true);

    const atLimit = verifyJobCreationLimits({
      employerUid: 'emp_starter',
      employerVerificationStatus: 'verified',
      employerPlan: 'starter',
      currentActiveJobCount: 5,
    });
    assert.equal(atLimit.allowed, false);
    assert.equal(atLimit.statusCode, 403);
    assert.match(atLimit.error || '', /limit of 5 active jobs/i);
  });

  it('enforces Business tier limit of 20 active jobs on the server', () => {
    const atLimit = verifyJobCreationLimits({
      employerUid: 'emp_biz',
      employerVerificationStatus: 'verified',
      employerPlan: 'business',
      currentActiveJobCount: 20,
    });
    assert.equal(atLimit.allowed, false);
    assert.equal(atLimit.statusCode, 403);
  });
});
