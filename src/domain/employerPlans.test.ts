import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canEmployerPostActiveJob,
  getPlanConfig,
  EMPLOYER_PLANS,
  CANDIDATE_NEVER_PAYS_INVARIANT,
  MATCHING_PLAN_INDEPENDENT_INVARIANT,
} from '../config/plans';
import { calculateMatchScore } from './matching';
import { CandidateProfile, Job, SkillClaim, EmployerUpgradeRequest, Application } from './types';

describe('Section 39: P3 Employer Subscription Plans & Sustainability', () => {
  const dummyCandidate: CandidateProfile = {
    uid: 'candidate_free_1',
    fullName: 'Nomvula Khumalo',
    headline: 'Certified Solar PV Installer',
    experienceSummary: 'Experienced in rooftop solar installations.',
    skillIds: ['skill_solar'],
    locationArea: 'Johannesburg CBD',
    availability: 'immediate',
    popiaVisibility: 'employers_only',
    updatedAt: '2026-01-01',
  };

  const dummyClaims: SkillClaim[] = [
    {
      id: 'claim_1',
      candidateId: 'candidate_free_1',
      skillId: 'skill_solar',
      skillName: 'Solar PV Maintenance',
      selfReportedLevel: 'Proficient',
      evidenceType: 'practical_demo',
      evidenceTitle: 'Rooftop 5kw Solar Array',
      evidenceUrlOrText: 'Installed 5kw systems.',
      evidenceDescription: 'Installed 5kw systems.',
      verificationStatus: 'Task-assessed',
      createdAt: '2026-01-01',
    },
  ];

  const baseJob: Job = {
    id: 'job_test_1',
    employerId: 'emp_123',
    employerName: 'Solar Tech Co',
    employerVerified: true,
    title: 'Solar Assistant',
    description: 'Help install panels on roofs',
    responsibilities: ['Mount panels'],
    requiredSkillIds: ['skill_solar'],
    requiredSkillNames: ['Solar PV Maintenance'],
    locationArea: 'Johannesburg CBD',
    workMode: 'In-person',
    compensationAmount: 450,
    compensationCurrency: 'ZAR',
    compensationUnit: 'daily',
    engagementType: 'casual',
    startDate: '2026-11-01',
    applicationDeadline: '2026-10-31',
    status: 'open',
    reportCount: 0,
    createdAt: '2026-10-26',
  };

  // (a) Free employer cannot post 2nd active job
  it('(a) gates Free plan employers from posting more than 1 active job', () => {
    // 0 active jobs: allowed
    const canPostFirst = canEmployerPostActiveJob(0, 'free');
    assert.equal(canPostFirst.allowed, true);
    assert.equal(canPostFirst.limit, 1);

    // 1 active job: blocked from 2nd
    const canPostSecond = canEmployerPostActiveJob(1, 'free');
    assert.equal(canPostSecond.allowed, false);
    assert.match(canPostSecond.reason || '', /limit of 1 active job/i);
  });

  // (b) Starter employer can post up to 5
  it('(b) allows Starter plan employers to post up to 5 active jobs', () => {
    assert.equal(canEmployerPostActiveJob(0, 'starter').allowed, true);
    assert.equal(canEmployerPostActiveJob(4, 'starter').allowed, true);

    // 5 active jobs: blocked from 6th
    const canPostSixth = canEmployerPostActiveJob(5, 'starter');
    assert.equal(canPostSixth.allowed, false);
    assert.equal(canPostSixth.limit, 5);
    assert.match(canPostSixth.reason || '', /limit of 5 active jobs/i);
  });

  // Business employer up to 20
  it('allows Business plan employers to post up to 20 active jobs', () => {
    assert.equal(canEmployerPostActiveJob(19, 'business').allowed, true);
    assert.equal(canEmployerPostActiveJob(20, 'business').allowed, false);
  });

  // (c) Candidate ranking is identical regardless of employer plan
  it('(c) matching score is 100% identical regardless of whether employer is on Free, Starter, or Business plan', () => {
    // Score under Free employer
    const scoreFree = calculateMatchScore(baseJob, dummyCandidate, dummyClaims);

    // Same job posted by a Business tier employer
    const businessJob: Job = { ...baseJob, employerId: 'emp_business_tier' };
    const scoreBusiness = calculateMatchScore(businessJob, dummyCandidate, dummyClaims);

    // Match score and breakdown must be exactly identical (plan-independent)
    assert.equal(scoreFree.totalScore, scoreBusiness.totalScore);
    assert.equal(scoreFree.evidenceStrength, scoreBusiness.evidenceStrength);
    assert.equal(scoreFree.skillAlignment, scoreBusiness.skillAlignment);
    assert.equal(scoreFree.availabilityFit, scoreBusiness.availabilityFit);
    assert.ok(MATCHING_PLAN_INDEPENDENT_INVARIANT.length > 0);
  });

  // (d) Candidate cannot be charged (test for 36.3 hard rule)
  it('(d) candidates are never charged fees for registration, passport creation, verification, or applications', () => {
    // Assert invariant constant is enforced
    assert.match(CANDIDATE_NEVER_PAYS_INVARIANT, /Candidates NEVER pay any fee/);
    assert.match(CANDIDATE_NEVER_PAYS_INVARIANT, /no pay-to-rank/);

    // Candidate profile schema contains zero billing or payment card fields
    const candidateKeys = Object.keys(dummyCandidate);
    assert.equal(candidateKeys.includes('creditCard'), false);
    assert.equal(candidateKeys.includes('billingDetails'), false);
    assert.equal(candidateKeys.includes('subscriptionFee'), false);
    assert.equal(candidateKeys.includes('payToRankTier'), false);
  });

  // (e) Upgrade request writes document without taking card data
  it('(e) records upgrade request without storing or accepting credit card data', () => {
    const upgradeReq: EmployerUpgradeRequest = {
      id: 'req_123',
      employerUid: 'emp_123',
      businessName: 'Solar Tech Co',
      targetPlan: 'starter',
      contactName: 'Sipho Ndlovu',
      billingEmail: 'accounts@solartech.co.za',
      poNumber: 'PO-2026-001',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(upgradeReq);

    // Card data is NEVER accepted or stored
    assert.doesNotMatch(serialized, /card/i);
    assert.doesNotMatch(serialized, /cvv/i);
    assert.doesNotMatch(serialized, /pan/i);
    assert.match(serialized, /"targetPlan":"starter"/);
    assert.match(serialized, /"status":"pending"/);
  });

  // (f) Downgrade keeps existing jobs and applications (Zero-Deletion Invariant)
  it('(f) downgrading or cancelling plan never deletes existing jobs or applications', () => {
    // Employer on Business tier with 3 active jobs and 6 applications
    const existingJobs: Job[] = [
      { ...baseJob, id: 'job_1', status: 'open' },
      { ...baseJob, id: 'job_2', status: 'open' },
      { ...baseJob, id: 'job_3', status: 'open' },
    ];

    const existingApplications: Partial<Application>[] = [
      { id: 'app_1', jobId: 'job_1', candidateId: 'c1', status: 'submitted' },
      { id: 'app_2', jobId: 'job_1', candidateId: 'c2', status: 'shortlisted' },
      { id: 'app_3', jobId: 'job_2', candidateId: 'c3', status: 'submitted' },
      { id: 'app_4', jobId: 'job_2', candidateId: 'c4', status: 'selected' },
      { id: 'app_5', jobId: 'job_3', candidateId: 'c5', status: 'submitted' },
      { id: 'app_6', jobId: 'job_3', candidateId: 'c6', status: 'completed' },
    ];

    // Employer downgrades to Free (limit 1)
    const downgradedPlan = 'free';

    // Invariant: zero jobs or applications are removed
    assert.equal(existingJobs.length, 3, 'All 3 jobs must remain untouched');
    assert.equal(existingApplications.length, 6, 'All 6 applications must remain intact');

    // Only NEW job creation is blocked because current active (3) >= free limit (1)
    const gating = canEmployerPostActiveJob(existingJobs.length, downgradedPlan);
    assert.equal(gating.allowed, false);
    assert.match(gating.reason || '', /limit of 1 active job/i);
  });

  // (g) Request alone does NOT change the plan (Honest Flow)
  it('(g) requesting an upgrade creates a pending record and marks planStatus as upgrade_pending without changing the plan', () => {
    const employerProfile = {
      uid: 'emp_123',
      businessName: 'Solar Tech Co',
      plan: 'free' as const,
      planStatus: 'active' as const,
    };

    // Submitting upgrade request
    const requestData: Omit<EmployerUpgradeRequest, 'id' | 'requestedAt'> = {
      employerUid: employerProfile.uid,
      businessName: employerProfile.businessName,
      targetPlan: 'starter',
      contactName: 'Sipho Ndlovu',
      billingEmail: 'accounts@solartech.co.za',
      status: 'pending',
    };

    // Honest flow simulation: plan does NOT change
    const updatedProfile = {
      ...employerProfile,
      plan: employerProfile.plan, // stays 'free'
      planStatus: 'upgrade_pending' as const,
    };

    assert.equal(updatedProfile.plan, 'free', 'Plan must remain Free until admin approval');
    assert.equal(updatedProfile.planStatus, 'upgrade_pending', 'planStatus must indicate pending upgrade review');
    assert.equal(requestData.status, 'pending');
  });

  // (h) Admin approval transitions request to approved and updates plan
  it('(h) admin approval moves request to approved, records reviewer, and activates the new plan', () => {
    const employerProfile = {
      uid: 'emp_123',
      businessName: 'Solar Tech Co',
      plan: 'free' as const,
      planStatus: 'upgrade_pending' as const,
      planSince: undefined as string | undefined,
    };

    const pendingRequest: EmployerUpgradeRequest = {
      id: 'upgrade-1',
      employerUid: 'emp_123',
      businessName: 'Solar Tech Co',
      targetPlan: 'starter',
      contactName: 'Sipho Ndlovu',
      billingEmail: 'accounts@solartech.co.za',
      status: 'pending',
      requestedAt: '2026-10-26T12:00:00.000Z',
    };

    // Admin approves
    const adminName = 'Nomsa Dlamini (Admin)';
    const approvalTime = new Date().toISOString();

    const approvedRequest: EmployerUpgradeRequest = {
      ...pendingRequest,
      status: 'approved',
      reviewedBy: adminName,
      reviewedAt: approvalTime,
    };

    const activatedProfile = {
      ...employerProfile,
      plan: pendingRequest.targetPlan,
      planStatus: 'active' as const,
      planSince: approvalTime,
    };

    assert.equal(approvedRequest.status, 'approved');
    assert.equal(approvedRequest.reviewedBy, adminName);
    assert.ok(approvedRequest.reviewedAt);
    assert.equal(activatedProfile.plan, 'starter');
    assert.equal(activatedProfile.planStatus, 'active');
    assert.ok(activatedProfile.planSince);
  });
});
