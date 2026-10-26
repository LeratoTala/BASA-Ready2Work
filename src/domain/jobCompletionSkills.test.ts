import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyCompletedJobToSkillPassport } from './jobCompletionSkills';
import { Application, Job, SkillClaim } from './types';

describe('Job Completion Skill Passport Auto-Update', () => {
  const sampleJob: Job = {
    id: 'job-solar-barista',
    employerId: 'emp-zola',
    employerName: 'Zola Artisan Cafe',
    employerVerified: true,
    title: 'Cafe Technician & Solar Backup Assistant',
    description: 'Assist with daily espresso machinery and solar backup inverter operation.',
    responsibilities: ['Clean steam wand', 'Monitor solar inverter'],
    requiredSkillIds: ['skill-barista', 'skill-solar'],
    requiredSkillNames: ['Barista & Espresso Calibration', 'Solar PV Rooftop Mounting & DC Wiring'],
    locationArea: 'Johannesburg CBD',
    workMode: 'In-person',
    compensationAmount: 4500,
    compensationCurrency: 'ZAR',
    compensationUnit: 'monthly',
    startDate: '2026-09-01',
    applicationDeadline: '2026-08-25',
    status: 'open',
    reportCount: 0,
    createdAt: '2026-08-15T08:00:00Z',
  };

  const sampleApplication: Application = {
    id: 'app-991',
    jobId: sampleJob.id,
    jobTitle: sampleJob.title,
    employerId: sampleJob.employerId,
    employerName: sampleJob.employerName,
    candidateId: 'candidate-nomvula',
    candidateName: 'Nomvula Khumalo',
    candidateHeadline: 'Retail Merchandiser',
    candidateLocation: 'Khayelitsha, Cape Town',
    candidateAvailability: 'immediate',
    status: 'completed',
    matchScore: 88,
    matchBreakdown: {
      totalScore: 88,
      skillAlignment: 90,
      evidenceStrength: 85,
      availabilityFit: 90,
      locationFit: 85,
      matchedSkills: ['Barista'],
      missingSkills: [],
      reasons: [],
      improvementTips: [],
    },
    submittedAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
    actualTimeInWorkplace: '1 month served (173 hrs)',
    payoutConfirmed: true,
    payoutAmountZAR: 4500,
  };

  it('automatically adds skills that the candidate did NOT have with completed job proof', () => {
    // Candidate starts with NO solar skill
    const initialClaims: SkillClaim[] = [];
    const initialSkillIds: string[] = [];

    const result = applyCompletedJobToSkillPassport({
      candidateId: 'candidate-nomvula',
      job: sampleJob,
      application: sampleApplication,
      currentClaims: initialClaims,
      currentSkillIds: initialSkillIds,
      workDurationLabel: '1 month served (173 hrs)',
      payoutAmountZAR: 4500,
    });

    assert.equal(result.newSkillsAdded.length, 2);
    assert.ok(result.newSkillsAdded.includes('Barista & Espresso Calibration'));
    assert.ok(result.newSkillsAdded.includes('Solar PV Rooftop Mounting & DC Wiring'));
    assert.equal(result.updatedClaims.length, 2);

    // Verify claim details
    const solarClaim = result.updatedClaims.find((c) => c.skillId === 'skill-solar');
    assert.ok(solarClaim);
    assert.equal(solarClaim?.verificationStatus, 'Peer-endorsed');
    assert.equal(solarClaim?.peerEndorserName, 'Zola Artisan Cafe (Employer Verified)');
    assert.equal(solarClaim?.evidenceItems?.length, 1);
    assert.equal(solarClaim?.evidenceItems?.[0].type, 'work_sample');
    assert.ok(solarClaim?.evidenceItems?.[0].description?.includes('Zola Artisan Cafe'));
    assert.ok(solarClaim?.evidenceItems?.[0].description?.includes('1 month served (173 hrs)'));
    assert.ok(solarClaim?.evidenceItems?.[0].description?.includes('R4500'));

    // Check updatedSkillIds
    assert.ok(result.updatedSkillIds.includes('skill-solar'));
    assert.ok(result.updatedSkillIds.includes('skill-barista'));
  });

  it('attaches completed job proof to an existing skill claim and upgrades Self-reported to Peer-endorsed', () => {
    // Candidate already had barista as self-reported without uploaded files
    const existingBaristaClaim: SkillClaim = {
      id: 'claim-existing-barista',
      candidateId: 'candidate-nomvula',
      skillId: 'skill-barista',
      skillName: 'Barista & Espresso Calibration',
      selfReportedLevel: 'Beginner',
      evidenceType: 'practical_demo',
      evidenceTitle: 'Home espresso practice',
      evidenceDescription: 'Practiced at home, no certificates uploaded.',
      evidenceUrlOrText: '',
      evidenceItems: [],
      verificationStatus: 'Self-reported',
      createdAt: '2026-08-01T10:00:00Z',
    };

    const initialClaims: SkillClaim[] = [existingBaristaClaim];
    const initialSkillIds: string[] = ['skill-barista'];

    const result = applyCompletedJobToSkillPassport({
      candidateId: 'candidate-nomvula',
      job: sampleJob,
      application: sampleApplication,
      currentClaims: initialClaims,
      currentSkillIds: initialSkillIds,
    });

    assert.ok(result.existingSkillsUpdated.includes('Barista & Espresso Calibration'));
    assert.ok(result.newSkillsAdded.includes('Solar PV Rooftop Mounting & DC Wiring'));

    const updatedBarista = result.updatedClaims.find((c) => c.id === 'claim-existing-barista');
    assert.ok(updatedBarista);
    // Upgraded from Self-reported to Peer-endorsed
    assert.equal(updatedBarista?.verificationStatus, 'Peer-endorsed');
    assert.equal(updatedBarista?.peerEndorserName, 'Zola Artisan Cafe (Employer Verified)');
    // Evidence attached
    assert.equal(updatedBarista?.evidenceItems?.length, 1);
    assert.equal(updatedBarista?.evidenceItems?.[0].title, 'Completed Job: Cafe Technician & Solar Backup Assistant (Zola Artisan Cafe)');
  });

  it('preserves Task-assessed status if candidate already had a higher verification tier', () => {
    const existingTaskAssessed: SkillClaim = {
      id: 'claim-task-barista',
      candidateId: 'candidate-nomvula',
      skillId: 'skill-barista',
      skillName: 'Barista & Espresso Calibration',
      selfReportedLevel: 'Proficient',
      evidenceType: 'practical_demo',
      evidenceTitle: 'Practical Exam',
      evidenceDescription: 'Passed with 95/100',
      evidenceUrlOrText: '',
      evidenceItems: [],
      verificationStatus: 'Task-assessed',
      createdAt: '2026-08-01T10:00:00Z',
    };

    const result = applyCompletedJobToSkillPassport({
      candidateId: 'candidate-nomvula',
      job: sampleJob,
      application: sampleApplication,
      currentClaims: [existingTaskAssessed],
      currentSkillIds: ['skill-barista'],
    });

    const barista = result.updatedClaims.find((c) => c.id === 'claim-task-barista');
    // Does not downgrade Task-assessed
    assert.equal(barista?.verificationStatus, 'Task-assessed');
    // But still appends the job proof
    assert.equal(barista?.evidenceItems?.length, 1);
  });
});
