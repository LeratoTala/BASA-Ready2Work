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
});
