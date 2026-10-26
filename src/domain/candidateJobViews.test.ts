import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyCandidateJobs,
  filterCandidateJobs,
} from './candidateJobViews';
import type { Job, Application, CandidateProfile, SkillClaim } from './types';

describe('Candidate Job Listing Views (Available, Applied, Completed, All)', () => {
  const candidate: CandidateProfile = {
    uid: 'candidate-thabo',
    fullName: 'Thabo Ndlovu',
    headline: 'Barista & Solar Assistant',
    experienceSummary: '',
    skillIds: ['skill-barista'],
    locationArea: 'Soweto, Johannesburg',
    availability: 'immediate',
    popiaVisibility: 'public_link',
    updatedAt: new Date().toISOString(),
  };

  const claims: SkillClaim[] = [
    {
      id: 'claim-1',
      candidateId: candidate.uid,
      skillId: 'skill-barista',
      skillName: 'Barista & Espresso Calibration',
      selfReportedLevel: 'Proficient',
      evidenceType: 'work_sample',
      evidenceTitle: 'Espresso Bar Work',
      evidenceDescription: 'Calibration and extraction',
      evidenceUrlOrText: 'sample.jpg',
      verificationStatus: 'Task-assessed',
      createdAt: new Date().toISOString(),
    },
  ];

  const jobs: Job[] = [
    {
      id: 'job-available-1',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      employerVerified: true,
      title: 'Barista Morning Shift',
      description: 'Morning coffee rush',
      responsibilities: ['Pull shots'],
      requiredSkillIds: ['skill-barista'],
      requiredSkillNames: ['Barista & Espresso Calibration'],
      locationArea: 'Johannesburg CBD',
      workMode: 'In-person',
      compensationAmount: 65,
      compensationCurrency: 'ZAR',
      compensationUnit: 'hourly',
      startDate: '2026-11-01',
      applicationDeadline: '2026-10-31',
      status: 'open',
      reportCount: 0,
      createdAt: '2026-10-20T08:00:00Z',
    },
    {
      id: 'job-applied-1',
      employerId: 'emp-2',
      employerName: 'Artisan Roastery',
      employerVerified: true,
      title: 'Weekend Head Barista',
      description: 'Weekend specialist',
      responsibilities: ['Dial espresso'],
      requiredSkillIds: ['skill-barista'],
      requiredSkillNames: ['Barista & Espresso Calibration'],
      locationArea: 'Braamfontein',
      workMode: 'In-person',
      compensationAmount: 80,
      compensationCurrency: 'ZAR',
      compensationUnit: 'hourly',
      startDate: '2026-11-05',
      applicationDeadline: '2026-11-02',
      status: 'open',
      reportCount: 0,
      createdAt: '2026-10-18T08:00:00Z',
    },
    {
      id: 'job-completed-paid',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      employerVerified: true,
      title: 'Festival Pop-up Barista',
      description: 'Festival pop up engagement',
      responsibilities: ['High volume brewing'],
      requiredSkillIds: ['skill-barista'],
      requiredSkillNames: ['Barista & Espresso Calibration'],
      locationArea: 'Soweto, Johannesburg',
      workMode: 'In-person',
      compensationAmount: 850,
      compensationCurrency: 'ZAR',
      compensationUnit: 'fixed',
      startDate: '2026-09-20',
      applicationDeadline: '2026-09-18',
      status: 'closed',
      reportCount: 0,
      createdAt: '2026-09-15T08:00:00Z',
    },
    {
      id: 'job-completed-pending',
      employerId: 'emp-3',
      employerName: 'SunPower Solars',
      employerVerified: true,
      title: 'Solar Inverter Bracket Assistant',
      description: '1-day cable run assistance',
      responsibilities: ['Mount cable trays'],
      requiredSkillIds: ['skill-solar'],
      requiredSkillNames: ['Solar PV Rooftop Mounting'],
      locationArea: 'Alexandra',
      workMode: 'In-person',
      compensationAmount: 520,
      compensationCurrency: 'ZAR',
      compensationUnit: 'daily',
      startDate: '2026-10-10',
      applicationDeadline: '2026-10-08',
      status: 'closed',
      reportCount: 0,
      createdAt: '2026-10-05T08:00:00Z',
    },
  ];

  const applications: Application[] = [
    {
      id: 'app-applied-1',
      jobId: 'job-applied-1',
      jobTitle: 'Weekend Head Barista',
      employerId: 'emp-2',
      employerName: 'Artisan Roastery',
      candidateId: candidate.uid,
      candidateName: candidate.fullName,
      candidateHeadline: candidate.headline,
      candidateLocation: candidate.locationArea,
      candidateAvailability: candidate.availability,
      status: 'under_review',
      matchScore: 92,
      matchBreakdown: {
        totalScore: 92,
        skillAlignment: 100,
        evidenceStrength: 85,
        availabilityFit: 100,
        locationFit: 75,
        matchedSkills: ['Barista & Espresso Calibration'],
        missingSkills: [],
        reasons: [],
        improvementTips: [],
      },
      submittedAt: '2026-10-21T09:00:00Z',
      updatedAt: '2026-10-21T12:00:00Z',
      payoutConfirmed: false,
    },
    {
      id: 'app-completed-paid',
      jobId: 'job-completed-paid',
      jobTitle: 'Festival Pop-up Barista',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      candidateId: candidate.uid,
      candidateName: candidate.fullName,
      candidateHeadline: candidate.headline,
      candidateLocation: candidate.locationArea,
      candidateAvailability: candidate.availability,
      status: 'completed',
      matchScore: 95,
      matchBreakdown: {
        totalScore: 95,
        skillAlignment: 100,
        evidenceStrength: 100,
        availabilityFit: 100,
        locationFit: 100,
        matchedSkills: ['Barista & Espresso Calibration'],
        missingSkills: [],
        reasons: [],
        improvementTips: [],
      },
      submittedAt: '2026-09-16T08:00:00Z',
      updatedAt: '2026-09-21T18:00:00Z',
      payoutConfirmed: true,
      paidAt: '2026-09-21T19:00:00Z',
    },
    {
      id: 'app-completed-pending',
      jobId: 'job-completed-pending',
      jobTitle: 'Solar Inverter Bracket Assistant',
      employerId: 'emp-3',
      employerName: 'SunPower Solars',
      candidateId: candidate.uid,
      candidateName: candidate.fullName,
      candidateHeadline: candidate.headline,
      candidateLocation: candidate.locationArea,
      candidateAvailability: candidate.availability,
      status: 'completed',
      matchScore: 70,
      matchBreakdown: {
        totalScore: 70,
        skillAlignment: 50,
        evidenceStrength: 60,
        availabilityFit: 100,
        locationFit: 70,
        matchedSkills: [],
        missingSkills: ['Solar PV Rooftop Mounting'],
        reasons: [],
        improvementTips: [],
      },
      submittedAt: '2026-10-06T08:00:00Z',
      updatedAt: '2026-10-10T17:00:00Z',
      payoutConfirmed: false,
    },
  ];

  it('classifies each job with application status, hasApplied, and payoutStatus', () => {
    const classified = classifyCandidateJobs(jobs, candidate, claims, applications);
    assert.equal(classified.length, 4);

    const jobAvail = classified.find((c) => c.job.id === 'job-available-1');
    assert.ok(jobAvail);
    assert.equal(jobAvail.hasApplied, false);
    assert.equal(jobAvail.isCompleted, false);
    assert.equal(jobAvail.payoutStatus, 'not_applicable');

    const jobApplied = classified.find((c) => c.job.id === 'job-applied-1');
    assert.ok(jobApplied);
    assert.equal(jobApplied.hasApplied, true);
    assert.equal(jobApplied.isCompleted, false);
    assert.equal(jobApplied.application?.status, 'under_review');
    assert.equal(jobApplied.payoutStatus, 'not_applicable');

    const jobPaid = classified.find((c) => c.job.id === 'job-completed-paid');
    assert.ok(jobPaid);
    assert.equal(jobPaid.hasApplied, true);
    assert.equal(jobPaid.isCompleted, true);
    assert.equal(jobPaid.payoutStatus, 'paid');

    const jobPending = classified.find((c) => c.job.id === 'job-completed-pending');
    assert.ok(jobPending);
    assert.equal(jobPending.hasApplied, true);
    assert.equal(jobPending.isCompleted, true);
    assert.equal(jobPending.payoutStatus, 'payment_pending');
  });

  it('filters available jobs: only open jobs not yet applied to appear', () => {
    const classified = classifyCandidateJobs(jobs, candidate, claims, applications);
    const available = filterCandidateJobs(classified, 'available');

    // Only job-available-1 is open and unapplied
    assert.equal(available.length, 1);
    assert.equal(available[0].job.id, 'job-available-1');

    // Applied jobs do NOT show up in available (protecting against duplicates)
    assert.ok(!available.some((a) => a.job.id === 'job-applied-1'));
    assert.ok(!available.some((a) => a.job.id === 'job-completed-paid'));
    assert.ok(!available.some((a) => a.job.id === 'job-completed-pending'));
  });

  it('filters applied jobs: shows in-progress applications with status', () => {
    const classified = classifyCandidateJobs(jobs, candidate, claims, applications);
    const applied = filterCandidateJobs(classified, 'applied');

    assert.equal(applied.length, 1);
    assert.equal(applied[0].job.id, 'job-applied-1');
    assert.equal(applied[0].application?.status, 'under_review');
  });

  it('filters completed jobs: distinguishes between paid and waiting for payment', () => {
    const classified = classifyCandidateJobs(jobs, candidate, claims, applications);
    const completed = filterCandidateJobs(classified, 'completed');

    assert.equal(completed.length, 2);

    const paidItem = completed.find((c) => c.job.id === 'job-completed-paid');
    assert.ok(paidItem);
    assert.equal(paidItem.payoutStatus, 'paid');
    assert.equal(paidItem.application?.payoutConfirmed, true);

    const pendingItem = completed.find((c) => c.job.id === 'job-completed-pending');
    assert.ok(pendingItem);
    assert.equal(pendingItem.payoutStatus, 'payment_pending');
    assert.equal(pendingItem.application?.payoutConfirmed, false);
  });

  it('filters all jobs: shows all jobs and displays application status on applied posts', () => {
    const classified = classifyCandidateJobs(jobs, candidate, claims, applications);
    const all = filterCandidateJobs(classified, 'all');

    assert.equal(all.length, 4);

    // Unapplied job
    const unapplied = all.find((c) => c.job.id === 'job-available-1');
    assert.ok(unapplied);
    assert.equal(unapplied.hasApplied, false);

    // In-progress applied job
    const inProgress = all.find((c) => c.job.id === 'job-applied-1');
    assert.ok(inProgress);
    assert.equal(inProgress.hasApplied, true);
    assert.equal(inProgress.application?.status, 'under_review');

    // Completed paid job
    const completedPaid = all.find((c) => c.job.id === 'job-completed-paid');
    assert.ok(completedPaid);
    assert.equal(completedPaid.hasApplied, true);
    assert.equal(completedPaid.isCompleted, true);
    assert.equal(completedPaid.payoutStatus, 'paid');

    // Completed payment pending job
    const completedPending = all.find((c) => c.job.id === 'job-completed-pending');
    assert.ok(completedPending);
    assert.equal(completedPending.hasApplied, true);
    assert.equal(completedPending.isCompleted, true);
    assert.equal(completedPending.payoutStatus, 'payment_pending');
  });

  it('dynamically moves a job from available to applied when candidate applies', () => {
    // Before applying
    let currentApplications: Application[] = [...applications];
    let classified = classifyCandidateJobs(jobs, candidate, claims, currentApplications);
    let available = filterCandidateJobs(classified, 'available');
    assert.equal(available.length, 1);
    assert.equal(available[0].job.id, 'job-available-1');

    // Candidate applies to job-available-1
    const newApplication: Application = {
      id: 'app-new-1',
      jobId: 'job-available-1',
      jobTitle: 'Barista Morning Shift',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      candidateId: candidate.uid,
      candidateName: candidate.fullName,
      candidateHeadline: candidate.headline,
      candidateLocation: candidate.locationArea,
      candidateAvailability: candidate.availability,
      status: 'submitted',
      matchScore: 90,
      matchBreakdown: {
        totalScore: 90,
        skillAlignment: 100,
        evidenceStrength: 85,
        availabilityFit: 100,
        locationFit: 75,
        matchedSkills: ['Barista & Espresso Calibration'],
        missingSkills: [],
        reasons: [],
        improvementTips: [],
      },
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payoutConfirmed: false,
    };
    currentApplications = [...currentApplications, newApplication];

    // Reclassify
    classified = classifyCandidateJobs(jobs, candidate, claims, currentApplications);
    available = filterCandidateJobs(classified, 'available');
    const applied = filterCandidateJobs(classified, 'applied');

    // Now available is empty!
    assert.equal(available.length, 0);

    // And applied has increased to 2
    assert.equal(applied.length, 2);
    assert.ok(applied.some((a) => a.job.id === 'job-available-1' && a.application?.status === 'submitted'));
  });
});
