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

  it('specifies work duration and allows employer to adjust and confirm exact payout amount', () => {
    // 1. Initial application in selected state for an hourly job (base R60/hr)
    const baseJobCompensation = 60; // R60/hr
    const initialApp: Application = {
      id: 'app-duration-1',
      jobId: 'job-hourly-1',
      jobTitle: 'Solar Panel Cable Tray Assistant',
      employerId: 'emp-solar',
      employerName: 'SunPower Solars Gauteng',
      candidateId: 'cand-thabo',
      candidateName: 'Thabo Ndlovu',
      candidateHeadline: 'Solar Assistant',
      candidateLocation: 'Soweto',
      candidateAvailability: 'immediate',
      status: 'selected',
      matchScore: 88,
      matchBreakdown: {} as any,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Work concluded. Candidate worked 45 hours (40 regular + 5 overtime)
    const hoursWorked = 45;
    const workDurationLabel = '45 hours (1 week + 5 hrs overtime)';
    // Base 45 * 60 = 2700, but employer adjusts payment to R3,000 to include transport bonus
    const adjustedExactAmountZAR = 3000;

    // Simulate completion with adjusted payout details
    const completedApp: Application = {
      ...initialApp,
      status: 'completed',
      hoursWorked,
      workDurationLabel,
      payoutAmountZAR: adjustedExactAmountZAR,
      payoutConfirmed: true,
      paidAt: new Date().toISOString(),
      employerNotes: 'Excellent work on roof cable runs. Transport allowance included.',
    };

    const workRecord: WorkRecord = {
      id: 'work-rec-1',
      applicationId: completedApp.id,
      jobId: completedApp.jobId,
      jobTitle: completedApp.jobTitle,
      candidateId: completedApp.candidateId,
      candidateName: completedApp.candidateName,
      employerId: completedApp.employerId,
      employerName: completedApp.employerName,
      completionStatus: 'completed',
      employerConfirmed: true,
      payoutConfirmed: true,
      amountZAR: adjustedExactAmountZAR,
      hoursWorked,
      workDurationLabel,
      feedback: 'Excellent work on roof cable runs. Transport allowance included.',
      confirmedAt: new Date().toISOString(),
    };

    // Assert that the duration worked is strictly specified
    assert.equal(completedApp.hoursWorked, 45);
    assert.equal(completedApp.workDurationLabel, '45 hours (1 week + 5 hrs overtime)');
    assert.equal(workRecord.hoursWorked, 45);
    assert.equal(workRecord.workDurationLabel, '45 hours (1 week + 5 hrs overtime)');

    // Assert that the adjusted payment (R3000) was confirmed instead of plain base compensation
    assert.equal(completedApp.payoutAmountZAR, 3000);
    assert.equal(workRecord.amountZAR, 3000);
    assert.equal(completedApp.payoutConfirmed, true);
    assert.equal(workRecord.payoutConfirmed, true);

    // Verify candidate-facing summary strings can be formatted clearly
    const candidateDurationDisplay = completedApp.workDurationLabel || `${completedApp.hoursWorked} hours`;
    const candidatePaymentDisplay = `R${completedApp.payoutAmountZAR}`;
    assert.equal(candidateDurationDisplay, '45 hours (1 week + 5 hrs overtime)');
    assert.equal(candidatePaymentDisplay, 'R3000');
  });

  it('allows specifying duration when work is completed even while payout confirmation is pending', () => {
    const pendingApp: Application = {
      id: 'app-pending-duration',
      jobId: 'job-daily-1',
      jobTitle: 'Assistant Baker',
      employerId: 'emp-bakery',
      employerName: 'Sunrise Bakery',
      candidateId: 'cand-nomvula',
      candidateName: 'Nomvula Khumalo',
      candidateHeadline: 'Kitchen Assistant',
      candidateLocation: 'Alexandra',
      candidateAvailability: 'immediate',
      status: 'completed',
      matchScore: 92,
      matchBreakdown: {} as any,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hoursWorked: 24,
      workDurationLabel: '3 days (24 hours)',
      payoutAmountZAR: 750,
      payoutConfirmed: false,
    };

    // Candidate sees how long they worked even while waiting for payout
    assert.equal(pendingApp.hoursWorked, 24);
    assert.equal(pendingApp.workDurationLabel, '3 days (24 hours)');
    assert.equal(pendingApp.payoutConfirmed, false);
    assert.equal(pendingApp.payoutAmountZAR, 750);
  });

  it('contributes all time including approved leaves into total time served in institution without separate day-off flags', () => {
    // 20 days total served (e.g. 18 days on site + 2 approved leave days, all contributing to time served)
    const completedApp: Application = {
      id: 'app-time-served-1',
      jobId: 'job-solar-1',
      jobTitle: 'Solar Panel Cable Assistant',
      employerId: 'emp-solar',
      employerName: 'SunPower Solars',
      candidateId: 'cand-lerato',
      candidateName: 'Lerato Moloi',
      candidateHeadline: 'Solar Apprentice',
      candidateLocation: 'Tembisa',
      candidateAvailability: 'immediate',
      status: 'completed',
      matchScore: 94,
      matchBreakdown: {} as any,
      submittedAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-28T17:00:00Z',
      payRateAmount: 65,
      payRateUnit: 'hour',
      actualDaysWorked: 20,
      actualHoursWorked: 160,
      actualTimeInWorkplace: '20 days served (160 hrs)',
      employmentStartDate: '2026-09-01',
      employmentEndDate: '2026-09-28',
      payoutConfirmed: true,
      paidAt: '2026-09-28T17:00:00Z',
    };

    // Assert that the time served is unified under total time served
    assert.equal(completedApp.actualTimeInWorkplace, '20 days served (160 hrs)');
    assert.equal(completedApp.actualDaysWorked, 20);
    assert.equal(completedApp.actualHoursWorked, 160);

    // Assert unit rate is preserved instead of a lump sum
    assert.equal(completedApp.payRateAmount, 65);
    assert.equal(completedApp.payRateUnit, 'hour');

    // Assert start and end dates are recorded upon completion
    assert.equal(completedApp.employmentStartDate, '2026-09-01');
    assert.equal(completedApp.employmentEndDate, '2026-09-28');
  });

  it('records and displays monthly rates (money/month) with total time served in institution', () => {
    const monthlyApp: Application = {
      id: 'app-monthly-1',
      jobId: 'job-monthly-junior-dev',
      jobTitle: 'Junior IT Support Technician',
      employerId: 'emp-tech-hub',
      employerName: 'Soweto Digital Hub',
      candidateId: 'cand-kabelo',
      candidateName: 'Kabelo Mokoena',
      candidateHeadline: 'IT Technician',
      candidateLocation: 'Soweto',
      candidateAvailability: 'immediate',
      status: 'completed',
      matchScore: 96,
      matchBreakdown: {} as any,
      submittedAt: '2026-07-01T08:00:00Z',
      updatedAt: '2026-09-30T17:00:00Z',
      payRateAmount: 6500,
      payRateUnit: 'month',
      actualDaysWorked: 66,
      actualHoursWorked: 528,
      actualTimeInWorkplace: '3 months served (528 hrs)',
      employmentStartDate: '2026-07-01',
      employmentEndDate: '2026-09-30',
      payoutConfirmed: true,
      paidAt: '2026-09-30T17:00:00Z',
      workDurationLabel: '3 months served (528 hrs)',
    };

    const workRecord: WorkRecord = {
      id: 'work-monthly-rec-1',
      applicationId: monthlyApp.id,
      jobId: monthlyApp.jobId,
      jobTitle: monthlyApp.jobTitle,
      candidateId: monthlyApp.candidateId,
      candidateName: monthlyApp.candidateName,
      employerId: monthlyApp.employerId,
      employerName: monthlyApp.employerName,
      completionStatus: 'completed',
      employerConfirmed: true,
      payoutConfirmed: true,
      amountZAR: 6500,
      payRateAmount: 6500,
      payRateUnit: 'month',
      actualTimeInWorkplace: '3 months served (528 hrs)',
      actualDaysWorked: 66,
      actualHoursWorked: 528,
      employmentStartDate: '2026-07-01',
      employmentEndDate: '2026-09-30',
      feedback: 'Excellent 3-month IT apprenticeship completed.',
      confirmedAt: '2026-09-30T17:00:00Z',
    };

    // Verify monthly pay rate is accurately recorded
    assert.equal(monthlyApp.payRateAmount, 6500);
    assert.equal(monthlyApp.payRateUnit, 'month');
    assert.equal(workRecord.payRateAmount, 6500);
    assert.equal(workRecord.payRateUnit, 'month');

    // Verify rate formatting string matches money/month
    const rateDisplay = `Rate: R${monthlyApp.payRateAmount} / ${monthlyApp.payRateUnit}`;
    assert.equal(rateDisplay, 'Rate: R6500 / month');

    // Verify time served is preserved
    assert.equal(monthlyApp.actualTimeInWorkplace, '3 months served (528 hrs)');
    assert.equal(workRecord.actualTimeInWorkplace, '3 months served (528 hrs)');
  });

  it('records and formats weekly and fortnightly wage rates accurately', () => {
    // 1. Weekly wage: R1,500 / week
    const weeklyApp: Application = {
      id: 'app-weekly-1',
      jobId: 'job-weekly-1',
      jobTitle: 'Bakery Assistant',
      employerId: 'emp-bakery',
      employerName: 'Sunrise Bakery',
      candidateId: 'cand-1',
      candidateName: 'Nomvula Khumalo',
      candidateHeadline: 'Baker',
      candidateLocation: 'Alexandra',
      candidateAvailability: 'immediate',
      status: 'completed',
      matchScore: 90,
      matchBreakdown: {} as any,
      submittedAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-15T17:00:00Z',
      payRateAmount: 1500,
      payRateUnit: 'week',
      actualDaysWorked: 10,
      actualHoursWorked: 80,
      actualTimeInWorkplace: '2 weeks served (80 hrs)',
      employmentStartDate: '2026-10-01',
      employmentEndDate: '2026-10-15',
      payoutConfirmed: true,
      paidAt: '2026-10-15T17:00:00Z',
    };

    assert.equal(weeklyApp.payRateAmount, 1500);
    assert.equal(weeklyApp.payRateUnit, 'week');
    assert.equal(`Rate: R${weeklyApp.payRateAmount} / ${weeklyApp.payRateUnit}`, 'Rate: R1500 / week');

    // 2. Fortnightly wage: R3,200 / fortnight (every 2 weeks)
    const fortnightlyApp: Application = {
      id: 'app-fortnight-1',
      jobId: 'job-fortnight-1',
      jobTitle: 'Inventory Clerk',
      employerId: 'emp-whs',
      employerName: 'Midrand Logistics Hub',
      candidateId: 'cand-2',
      candidateName: 'Sipho Zulu',
      candidateHeadline: 'Inventory Specialist',
      candidateLocation: 'Midrand',
      candidateAvailability: 'immediate',
      status: 'completed',
      matchScore: 92,
      matchBreakdown: {} as any,
      submittedAt: '2026-09-15T08:00:00Z',
      updatedAt: '2026-10-15T17:00:00Z',
      payRateAmount: 3200,
      payRateUnit: 'fortnight',
      actualDaysWorked: 20,
      actualHoursWorked: 160,
      actualTimeInWorkplace: '2 fortnights served (160 hrs)',
      employmentStartDate: '2026-09-15',
      employmentEndDate: '2026-10-15',
      payoutConfirmed: true,
      paidAt: '2026-10-15T17:00:00Z',
    };

    assert.equal(fortnightlyApp.payRateAmount, 3200);
    assert.equal(fortnightlyApp.payRateUnit, 'fortnight');
    assert.equal(`Rate: R${fortnightlyApp.payRateAmount} / ${fortnightlyApp.payRateUnit}`, 'Rate: R3200 / fortnight');
  });

  it('allows the employer to manually set the employment start date upon selecting and hiring candidate', () => {
    const hiredApp: Application = {
      id: 'app-hired-manual-start',
      jobId: 'job-solar-1',
      jobTitle: 'Solar PV Rooftop Assistant',
      employerId: 'emp-solar',
      employerName: 'SunPower Solars',
      candidateId: 'cand-thabo',
      candidateName: 'Thabo Ndlovu',
      candidateHeadline: 'Solar Apprentice',
      candidateLocation: 'Soweto',
      candidateAvailability: 'immediate',
      status: 'selected',
      matchScore: 92,
      matchBreakdown: {} as any,
      submittedAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-05T10:00:00Z',
      employmentStartDate: '2026-10-12', // Employer manually set start date to next Monday
    };

    assert.equal(hiredApp.status, 'selected');
    assert.equal(hiredApp.employmentStartDate, '2026-10-12');
    assert.equal(hiredApp.employmentEndDate, undefined); // Ongoing, end date accounted for per job post terms
  });
});
