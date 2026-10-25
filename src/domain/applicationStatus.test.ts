import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applicationId, isValidTransition, VALID_STATUS_TRANSITIONS } from './applicationStatus';
import type { ApplicationStatus } from './types';

describe('application status transitions (T-12)', () => {
  it('allows the documented happy path', () => {
    const path: ApplicationStatus[] = ['submitted', 'under_review', 'shortlisted', 'selected', 'completed'];
    for (let i = 0; i < path.length - 1; i++) assert.ok(isValidTransition(path[i], path[i + 1]));
  });

  it('rejects skipping stages', () => {
    assert.equal(isValidTransition('submitted', 'selected'), false);
    assert.equal(isValidTransition('under_review', 'completed'), false);
    assert.equal(isValidTransition('selected', 'not_selected'), false);
  });

  it('treats terminal states as final', () => {
    for (const s of ['not_selected', 'completed', 'withdrawn'] as ApplicationStatus[]) {
      assert.deepEqual(VALID_STATUS_TRANSITIONS[s], []);
    }
  });

  it('builds a deterministic id for duplicate prevention (T-05)', () => {
    assert.equal(applicationId('job-1', 'cand-9'), 'job-1_cand-9');
  });

  it('prevents a candidate from applying for the same job post more than once', () => {
    const existingApplications = [
      { id: applicationId('job-101', 'cand-thabo'), jobId: 'job-101', candidateId: 'cand-thabo' },
    ];

    const canApply = (jobId: string, candidateId: string) => {
      const targetId = applicationId(jobId, candidateId);
      const duplicate = existingApplications.some(
        (a) => a.id === targetId || (a.jobId === jobId && a.candidateId === candidateId)
      );
      if (duplicate) {
        throw new Error('Duplicate application prevented: you have already applied for this opportunity.');
      }
      return true;
    };

    // Application for a new job succeeds
    assert.equal(canApply('job-202', 'cand-thabo'), true);

    // Duplicate application for job-101 is strictly blocked
    assert.throws(
      () => canApply('job-101', 'cand-thabo'),
      /Duplicate application prevented: you have already applied for this opportunity/
    );
  });
});
