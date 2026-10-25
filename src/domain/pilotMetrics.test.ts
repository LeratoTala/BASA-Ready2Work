import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculatePilotMetrics } from './pilotMetrics';

describe('pilot outcome metrics', () => {
  it('counts current funnel stages without treating unconfirmed work as paid', () => {
    const metrics = calculatePilotMetrics(
      [
        { status: 'submitted',   candidateId: 'c1' },
        { status: 'shortlisted', candidateId: 'c2' },
        { status: 'completed',   candidateId: 'c3' },
      ],
      [
        { completionStatus: 'completed', payoutConfirmed: false, candidateId: 'c1' },
        { completionStatus: 'completed', payoutConfirmed: true,  candidateId: 'c2' },
        { completionStatus: 'disputed',  payoutConfirmed: true,  candidateId: 'c3' },
      ]
    );

    assert.equal(metrics.applicationRecords, 3);
    assert.equal(metrics.currentlyShortlisted, 1);
    assert.equal(metrics.completedWorkRecords, 2);
    assert.equal(metrics.employerReportedPayouts, 1);
    // Two distinct candidates with completed work
    assert.equal(metrics.candidatesWithCompletedWork, 2);
    // Neither has repeat engagements
    assert.equal(metrics.candidatesWithRepeatEngagements, 0);
    // No skill claims passed → all zeros
    assert.deepEqual(metrics.verifiedSkillsBreakdown, {
      peerEndorsed: 0, taskAssessed: 0, mentorReviewed: 0, total: 0,
    });
  });

  it('counts verified skills breakdown correctly', () => {
    const metrics = calculatePilotMetrics(
      [{ status: 'submitted', candidateId: 'c1' }],
      [],
      [
        { verificationStatus: 'Self-reported' },
        { verificationStatus: 'Peer-endorsed' },
        { verificationStatus: 'Task-assessed' },
        { verificationStatus: 'Task-assessed' },
        { verificationStatus: 'Mentor-reviewed' },
      ]
    );

    assert.deepEqual(metrics.verifiedSkillsBreakdown, {
      peerEndorsed: 1,
      taskAssessed: 2,
      mentorReviewed: 1,
      total: 4,
    });
  });

  it('detects repeat engagements as a sustained income proxy', () => {
    const metrics = calculatePilotMetrics(
      [],
      [
        // c1 has two completed engagements → repeat
        { completionStatus: 'completed', payoutConfirmed: true, candidateId: 'c1' },
        { completionStatus: 'completed', payoutConfirmed: false, candidateId: 'c1' },
        // c2 has one
        { completionStatus: 'completed', payoutConfirmed: true, candidateId: 'c2' },
      ]
    );

    assert.equal(metrics.candidatesWithCompletedWork, 2);
    assert.equal(metrics.candidatesWithRepeatEngagements, 1);
    assert.equal(metrics.completedWorkRecords, 3);
  });

  it('returns zero counts for an empty pilot', () => {
    const metrics = calculatePilotMetrics([], []);
    assert.equal(metrics.applicationRecords, 0);
    assert.equal(metrics.currentlyShortlisted, 0);
    assert.equal(metrics.completedWorkRecords, 0);
    assert.equal(metrics.employerReportedPayouts, 0);
    assert.equal(metrics.candidatesWithCompletedWork, 0);
    assert.equal(metrics.candidatesWithRepeatEngagements, 0);
    assert.deepEqual(metrics.verifiedSkillsBreakdown, {
      peerEndorsed: 0, taskAssessed: 0, mentorReviewed: 0, total: 0,
    });
  });
});
