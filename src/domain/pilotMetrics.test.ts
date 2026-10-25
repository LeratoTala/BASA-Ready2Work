import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculatePilotMetrics } from './pilotMetrics';

describe('pilot outcome metrics', () => {
  it('counts current funnel stages without treating unconfirmed work as paid', () => {
    const metrics = calculatePilotMetrics(
      [
        { status: 'submitted' },
        { status: 'shortlisted' },
        { status: 'completed' },
      ],
      [
        { completionStatus: 'completed', payoutConfirmed: false },
        { completionStatus: 'completed', payoutConfirmed: true },
        { completionStatus: 'disputed', payoutConfirmed: true },
      ]
    );

    assert.deepEqual(metrics, {
      applicationRecords: 3,
      currentlyShortlisted: 1,
      completedWorkRecords: 2,
      employerReportedPayouts: 1,
    });
  });

  it('returns zero counts for an empty pilot', () => {
    assert.deepEqual(calculatePilotMetrics([], []), {
      applicationRecords: 0,
      currentlyShortlisted: 0,
      completedWorkRecords: 0,
      employerReportedPayouts: 0,
    });
  });
});
