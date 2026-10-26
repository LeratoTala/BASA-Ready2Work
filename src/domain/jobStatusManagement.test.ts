import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyCandidateJobs,
  filterCandidateJobs,
} from './candidateJobViews';
import type { Job, Application, CandidateProfile, SkillClaim } from './types';

describe('Job Closure Guard, Reopening & Status Invariants', () => {
  const candidate: CandidateProfile = {
    uid: 'cand-1',
    fullName: 'Thabo Ndlovu',
    headline: 'Barista',
    experienceSummary: '',
    skillIds: ['skill-barista'],
    locationArea: 'Soweto',
    availability: 'immediate',
    popiaVisibility: 'public_link',
    updatedAt: new Date().toISOString(),
  };

  const claims: SkillClaim[] = [
    {
      id: 'c1',
      candidateId: candidate.uid,
      skillId: 'skill-barista',
      skillName: 'Barista',
      selfReportedLevel: 'Proficient',
      evidenceType: 'work_sample',
      evidenceTitle: 'Bar work',
      evidenceDescription: 'Bar work description',
      evidenceUrlOrText: 'sample.jpg',
      verificationStatus: 'Task-assessed',
      createdAt: new Date().toISOString(),
    },
  ];

  it('blocks closing a job if there are applicants still in submitted status', () => {
    const job: Job = {
      id: 'job-close-test',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      employerVerified: true,
      title: 'Espresso Barista',
      description: 'Coffee shift',
      responsibilities: ['Pull shots'],
      requiredSkillIds: ['skill-barista'],
      requiredSkillNames: ['Barista'],
      locationArea: 'Johannesburg CBD',
      workMode: 'In-person',
      compensationAmount: 70,
      compensationCurrency: 'ZAR',
      compensationUnit: 'hourly',
      startDate: '2026-11-01',
      applicationDeadline: '2026-10-31',
      status: 'open',
      reportCount: 0,
      createdAt: new Date().toISOString(),
    };

    const apps: Application[] = [
      {
        id: 'app-unreviewed',
        jobId: job.id,
        jobTitle: job.title,
        employerId: job.employerId,
        employerName: job.employerName,
        candidateId: 'cand-2',
        candidateName: 'Nomvula Khumalo',
        candidateHeadline: 'Assistant',
        candidateLocation: 'Alexandra',
        candidateAvailability: 'immediate',
        status: 'submitted', // Still pending initial review!
        matchScore: 85,
        matchBreakdown: {
          totalScore: 85,
          skillAlignment: 100,
          evidenceStrength: 75,
          availabilityFit: 100,
          locationFit: 70,
          matchedSkills: ['Barista'],
          missingSkills: [],
          reasons: [],
          improvementTips: [],
        },
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payoutConfirmed: false,
      },
    ];

    // Helper validating employer closure invariant
    const validateCanCloseJob = (targetJob: Job, jobApplications: Application[], userRole: string) => {
      if (targetJob.status === 'open' && userRole === 'employer') {
        const pendingApplicants = jobApplications.filter(
          (a) => a.jobId === targetJob.id && a.status === 'submitted'
        );
        if (pendingApplicants.length > 0) {
          throw new Error(
            `Cannot close job: Please update the status of each applicant before closing. There are ${pendingApplicants.length} applicant(s) still in 'Submitted' awaiting your review.`
          );
        }
      }
      return true;
    };

    // Should throw because app-unreviewed is still 'submitted'
    assert.throws(
      () => validateCanCloseJob(job, apps, 'employer'),
      /Cannot close job: Please update the status of each applicant before closing/
    );

    // Once the employer updates the status to 'under_review' or 'shortlisted' or 'not_selected'
    apps[0].status = 'under_review';
    assert.equal(validateCanCloseJob(job, apps, 'employer'), true);
  });

  it('allows reopening a closed job and makes it available to unapplied candidates again', () => {
    const job: Job = {
      id: 'job-reopen-test',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      employerVerified: true,
      title: 'Espresso Barista',
      description: 'Coffee shift',
      responsibilities: ['Pull shots'],
      requiredSkillIds: ['skill-barista'],
      requiredSkillNames: ['Barista'],
      locationArea: 'Johannesburg CBD',
      workMode: 'In-person',
      compensationAmount: 70,
      compensationCurrency: 'ZAR',
      compensationUnit: 'hourly',
      startDate: '2026-11-01',
      applicationDeadline: '2026-10-31',
      status: 'closed', // Currently closed
      reportCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Candidate has not applied
    let classified = classifyCandidateJobs([job], candidate, claims, []);
    let available = filterCandidateJobs(classified, 'available');
    assert.equal(available.length, 0, 'Closed job must not appear in Available');

    // Employer reopens the job
    job.status = 'open';
    classified = classifyCandidateJobs([job], candidate, claims, []);
    available = filterCandidateJobs(classified, 'available');
    assert.equal(available.length, 1, 'Reopened job must appear in Available');
    assert.equal(available[0].job.id, 'job-reopen-test');
  });

  it('shows closed jobs in applied and all jobs tabs, and shows open/closed job status in completed', () => {
    const closedJob: Job = {
      id: 'job-closed-1',
      employerId: 'emp-1',
      employerName: 'Zola Café',
      employerVerified: true,
      title: 'Festival Barista',
      description: 'Coffee shift',
      responsibilities: ['Pull shots'],
      requiredSkillIds: ['skill-barista'],
      requiredSkillNames: ['Barista'],
      locationArea: 'Soweto',
      workMode: 'In-person',
      compensationAmount: 850,
      compensationCurrency: 'ZAR',
      compensationUnit: 'fixed',
      startDate: '2026-09-20',
      applicationDeadline: '2026-09-18',
      status: 'closed', // Job is closed
      reportCount: 0,
      createdAt: new Date().toISOString(),
    };

    const activeAppJob: Job = {
      id: 'job-applied-closed',
      employerId: 'emp-2',
      employerName: 'Artisan Roastery',
      employerVerified: true,
      title: 'Weekend Barista',
      description: 'Weekend shift',
      responsibilities: ['Dial espresso'],
      requiredSkillIds: ['skill-barista'],
      requiredSkillNames: ['Barista'],
      locationArea: 'Braamfontein',
      workMode: 'In-person',
      compensationAmount: 80,
      compensationCurrency: 'ZAR',
      compensationUnit: 'hourly',
      startDate: '2026-11-01',
      applicationDeadline: '2026-10-30',
      status: 'closed', // Employer closed this job after candidate applied
      reportCount: 0,
      createdAt: new Date().toISOString(),
    };

    const apps: Application[] = [
      {
        id: 'app-completed',
        jobId: closedJob.id,
        jobTitle: closedJob.title,
        employerId: closedJob.employerId,
        employerName: closedJob.employerName,
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
          matchedSkills: ['Barista'],
          missingSkills: [],
          reasons: [],
          improvementTips: [],
        },
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payoutConfirmed: true,
      },
      {
        id: 'app-applied',
        jobId: activeAppJob.id,
        jobTitle: activeAppJob.title,
        employerId: activeAppJob.employerId,
        employerName: activeAppJob.employerName,
        candidateId: candidate.uid,
        candidateName: candidate.fullName,
        candidateHeadline: candidate.headline,
        candidateLocation: candidate.locationArea,
        candidateAvailability: candidate.availability,
        status: 'shortlisted',
        matchScore: 90,
        matchBreakdown: {
          totalScore: 90,
          skillAlignment: 100,
          evidenceStrength: 100,
          availabilityFit: 100,
          locationFit: 80,
          matchedSkills: ['Barista'],
          missingSkills: [],
          reasons: [],
          improvementTips: [],
        },
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payoutConfirmed: false,
      },
    ];

    const classified = classifyCandidateJobs([closedJob, activeAppJob], candidate, claims, apps);

    // 1. Applied tab includes closed jobs
    const applied = filterCandidateJobs(classified, 'applied');
    assert.equal(applied.length, 1);
    assert.equal(applied[0].job.id, 'job-applied-closed');
    assert.equal(applied[0].job.status, 'closed', 'Applied tab must include closed jobs');

    // 2. All jobs tab includes closed jobs
    const all = filterCandidateJobs(classified, 'all');
    assert.equal(all.length, 2);
    assert.ok(all.some((j) => j.job.id === 'job-closed-1' && j.job.status === 'closed'));
    assert.ok(all.some((j) => j.job.id === 'job-applied-closed' && j.job.status === 'closed'));

    // 3. Completed tab preserves the job object so UI can check if job is open or closed
    const completed = filterCandidateJobs(classified, 'completed');
    assert.equal(completed.length, 1);
    assert.equal(completed[0].job.id, 'job-closed-1');
    assert.equal(completed[0].job.status, 'closed');

    // If closedJob is reopened later, completed tab reflects that the job is now open!
    closedJob.status = 'open';
    const reclassified = classifyCandidateJobs([closedJob, activeAppJob], candidate, claims, apps);
    const reCompleted = filterCandidateJobs(reclassified, 'completed');
    assert.equal(reCompleted[0].job.status, 'open', 'Completed view must reflect if job was reopened');
  });
});
