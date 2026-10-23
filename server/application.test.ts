import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeCandidate, makeClaim, makeJob } from '../src/domain/testFixtures';
import { buildApplicationRecord } from './application';

describe('server-created applications', () => {
  it('uses persisted candidate facts and calculates its own explainable score', () => {
    const job = makeJob({ id: 'job-7', employerId: 'employer-3' });
    const candidate = makeCandidate({ uid: 'candidate-8', fullName: 'Fictional Applicant' });
    const record = buildApplicationRecord(job, candidate, [makeClaim('Skill A')], '2026-10-23T00:00:00.000Z');

    assert.equal(record.id, 'job-7_candidate-8');
    assert.equal(record.candidateName, 'Fictional Applicant');
    assert.equal(record.status, 'submitted');
    assert.equal(record.matchScore, record.matchBreakdown.totalScore);
    assert.equal(record.employerId, 'employer-3');
  });
});