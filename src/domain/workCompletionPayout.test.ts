import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Application, WorkRecord } from './types';
import { calculatePilotMetrics } from './pilotMetrics';

describe('Work Completion and Payout Decoupling', () => {
  it('does not mark payout confirmed when work is marked completed without explicit payment confirmation', () => {
    const app: Application = {
      id: 'app-test-1',
      jobId: 'job-1',
      jobTitle: 'Assistant Barista',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      candidateId: 'cand-1',
      candidateName: 'Thabo Ndlovu',
      candidateHeadline: 'Barista',
      candidateLocation: 'Soweto',
      candidateAvailability: 'immediate',
      status: 'completed',
      matchScore: 90,
      matchBreakdown: {
        totalScore: 90,
        skillAlignment: 100,
        evidenceStrength: 85,
        availabilityFit: 100,
        locationFit: 75,
        matchedSkills: ['Barista'],
        missingSkills: [],
        reasons: [],
        improvementTips: [],
      },
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payoutConfirmed: false,
    };

    const record: WorkRecord = {
      id: 'work-test-1',
      applicationId: app.id,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      candidateId: app.candidateId,
      candidateName: app.candidateName,
      employerId: app.employerId,
      employerName: app.employerName,
      completionStatus: 'completed',
      employerConfirmed: true,
      payoutConfirmed: false,
      amountZAR: 650,
      feedback: 'Great shift, handled espresso machine well.',
      confirmedAt: new Date().toISOString(),
    };

    assert.equal(record.completionStatus, 'completed');
    assert.equal(record.payoutConfirmed, false);
    assert.equal(app.payoutConfirmed, false);

    // Verify pilot metrics count work as completed, but NOT as employer-reported payouts
    const metrics = calculatePilotMetrics([app], [record]);
    assert.equal(metrics.completedWorkRecords, 1);
    assert.equal(metrics.employerReportedPayouts, 0);
  });

  it('updates payout status to true and increments metrics when employer confirms payout', () => {
    const record: WorkRecord = {
      id: 'work-test-1',
      applicationId: 'app-test-1',
      jobId: 'job-1',
      jobTitle: 'Assistant Barista',
      candidateId: 'cand-1',
      candidateName: 'Thabo Ndlovu',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      completionStatus: 'completed',
      employerConfirmed: true,
      payoutConfirmed: true,
      amountZAR: 650,
      feedback: 'Paid via EFT.',
      confirmedAt: new Date().toISOString(),
    };

    const metrics = calculatePilotMetrics([{ status: 'completed', candidateId: 'cand-1' }], [record]);
    assert.equal(metrics.completedWorkRecords, 1);
    assert.equal(metrics.employerReportedPayouts, 1);
  });

  it('separates active candidate pipeline from completed work engagements', () => {
    const apps: Application[] = [
      {
        id: 'app-1',
        jobId: 'job-1',
        jobTitle: 'Barista',
        employerId: 'emp-1',
        employerName: 'Zola Café',
        candidateId: 'cand-1',
        candidateName: 'Nomvula Khumalo',
        candidateHeadline: 'Retail Assistant',
        candidateLocation: 'Khayelitsha',
        candidateAvailability: 'immediate',
        status: 'submitted',
        matchScore: 85,
        matchBreakdown: {} as any,
        submittedAt: '',
        updatedAt: '',
      },
      {
        id: 'app-2',
        jobId: 'job-1',
        jobTitle: 'Barista',
        employerId: 'emp-1',
        employerName: 'Zola Café',
        candidateId: 'cand-2',
        candidateName: 'Sipho Zulu',
        candidateHeadline: 'Junior Barista',
        candidateLocation: 'Johannesburg CBD',
        candidateAvailability: 'immediate',
        status: 'selected',
        matchScore: 92,
        matchBreakdown: {} as any,
        submittedAt: '',
        updatedAt: '',
      },
      {
        id: 'app-3',
        jobId: 'job-1',
        jobTitle: 'Barista',
        employerId: 'emp-1',
        employerName: 'Zola Café',
        candidateId: 'cand-3',
        candidateName: 'Thabo Ndlovu',
        candidateHeadline: 'Senior Barista',
        candidateLocation: 'Soweto',
        candidateAvailability: 'immediate',
        status: 'completed',
        matchScore: 95,
        matchBreakdown: {} as any,
        submittedAt: '',
        updatedAt: '',
        payoutConfirmed: false,
      },
    ];

    const activeApps = apps.filter((a) => a.status !== 'completed' && a.status !== 'withdrawn');
    const completedApps = apps.filter((a) => a.status === 'completed');

    assert.equal(activeApps.length, 2);
    assert.equal(activeApps.some((a) => a.candidateName === 'Thabo Ndlovu'), false, 'Completed applicant must not appear in active applied list');

    assert.equal(completedApps.length, 1);
    assert.equal(completedApps[0].candidateName, 'Thabo Ndlovu');
    assert.equal(completedApps[0].payoutConfirmed, false);
  });
});
