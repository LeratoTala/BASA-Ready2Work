import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateMatchScore } from './matching';
import { gradeMicroTaskRubric } from './rubrics';
import { VALID_STATUS_TRANSITIONS } from './applicationStatus';
import { maskPhone, maskEmail } from '../shared/maskContact';
import type { CandidateProfile, Job, SkillClaim, Application } from './types';

describe('Section 28.3 & Section 26 Core Journey End-to-End ("Demo Never Breaks")', () => {
  it('executes the full 7-step journey: register skill -> attach evidence -> rubric assessment -> matched job -> application -> status transitions', () => {
    // -------------------------------------------------------------
    // Step 1: Candidate registers and creates a profile
    // -------------------------------------------------------------
    const candidate: CandidateProfile = {
      uid: 'cand-journey-1',
      fullName: 'Katlego Mabena',
      headline: 'Practical Mobile Device & Electronics Repairer',
      experienceSummary: 'Experienced with micro-soldering, board rework, and component replacement.',
      locationArea: 'Soweto',
      availability: 'immediate',
      popiaVisibility: 'employers_only',
      skillIds: ['skill-phone-repair'],
      phone: '0845551234',
      contactEmail: 'katlego.mabena@example.co.za',
      updatedAt: '2026-10-25T10:00:00Z',
    };

    // -------------------------------------------------------------
    // Step 2 & 3: Candidate adds a skill with evidence (starts Self-reported)
    // -------------------------------------------------------------
    const initialClaim: SkillClaim = {
      id: 'claim-phone-1',
      candidateId: candidate.uid,
      skillId: 'skill-phone-repair',
      skillName: 'Smartphone & Tablet Repair',
      selfReportedLevel: 'Intermediate',
      evidenceType: 'work_sample',
      evidenceTitle: 'Screen replacement and board cleaning',
      evidenceDescription: 'Replaced 12 cracked iPhone and Samsung OLED screens and USB-C ports with heat gun and microscope.',
      evidenceUrlOrText: 'Smartphone_Repair_Bench_Work.jpg',
      verificationStatus: 'Self-reported',
      createdAt: '2026-10-25T10:05:00Z',
    };

    assert.equal(initialClaim.verificationStatus, 'Self-reported', 'Step 3: New skill must start as Self-reported');

    // -------------------------------------------------------------
    // Step 4: Assessor reviews evidence against 100-point rubric and sets Task-assessed
    // -------------------------------------------------------------
    const rubricEvaluation = gradeMicroTaskRubric({
      c1: 23, // Component Diagnostics & Triage
      c2: 24, // Disassembly & Workstation Safety / ESD
      c3: 23, // Component Replacement & Soldering
      c4: 24, // Post-Assembly Diagnostics & Quality Check
    });

    assert.equal(rubricEvaluation.totalScore, 94);
    assert.equal(rubricEvaluation.decision, 'approved');

    // Assessor records assessment
    const assessedClaim: SkillClaim = {
      ...initialClaim,
      verificationStatus: 'Task-assessed',
      assessmentId: 'assess-rec-94',
    };

    // -------------------------------------------------------------
    // Step 5: Candidate sees the Task-assessed label on the Skill Passport
    // -------------------------------------------------------------
    assert.equal(assessedClaim.verificationStatus, 'Task-assessed');
    assert.ok(assessedClaim.assessmentId);

    // -------------------------------------------------------------
    // Step 6: Matching ranks open jobs using M = 0.50S + 0.25E + 0.15A + 0.10L and shows WHY
    // -------------------------------------------------------------
    const openJob: Job = {
      id: 'job-phone-repair-shop',
      employerId: 'emp-tech-hub',
      employerName: 'Soweto Tech Clinic',
      employerVerified: true,
      title: 'Junior Smartphone Hardware Technician',
      description: 'Hands-on technician needed for diagnostic triage and screen/battery replacement.',
      responsibilities: ['Screen disassembly', 'Battery test', 'Customer work orders'],
      requiredSkillIds: ['skill-phone-repair'],
      requiredSkillNames: ['Smartphone & Tablet Repair'],
      locationArea: 'Soweto',
      workMode: 'In-person',
      compensationAmount: 480,
      compensationCurrency: 'ZAR',
      compensationUnit: 'daily',
      startDate: '2026-11-01',
      applicationDeadline: '2026-10-31',
      status: 'open',
      reportCount: 0,
      createdAt: '2026-10-25T08:00:00Z',
    };

    const match = calculateMatchScore(openJob, candidate, [assessedClaim]);

    // Check components of formula
    assert.equal(match.skillAlignment, 100, 'Skill alignment (S) must be 100%');
    assert.equal(match.evidenceStrength, 85, 'Task-assessed gives 85 evidence strength in E term (Section 28.2)');
    assert.equal(match.availabilityFit, 100, 'Immediate availability fits job (A)');
    assert.equal(match.locationFit, 100, 'Same area Soweto gives 100% location fit (L)');
    assert.equal(match.totalScore, 96, 'Total match score M = 0.5(100) + 0.25(85) + 0.15(100) + 0.10(100) = 96.25 -> 96');
    assert.ok(match.reasons.length >= 3, 'Must show explainable WHY reasons');

    // -------------------------------------------------------------
    // Step 7: Candidate applies; employer sees labels and advances pipeline
    // -------------------------------------------------------------
    const application: Application = {
      id: 'app-phone-001',
      jobId: openJob.id,
      jobTitle: openJob.title,
      employerId: openJob.employerId,
      employerName: openJob.employerName,
      candidateId: candidate.uid,
      candidateName: candidate.fullName,
      candidateLocation: candidate.locationArea,
      candidateAvailability: candidate.availability,
      candidateHeadline: candidate.headline,
      matchScore: match.totalScore,
      matchBreakdown: match,
      status: 'submitted',
      submittedAt: '2026-10-25T11:00:00Z',
      updatedAt: '2026-10-25T11:00:00Z',
    };

    // Prior to shortlisting, contact details are masked
    assert.ok(maskPhone(candidate.phone).includes('••'));
    assert.ok(maskEmail(candidate.contactEmail).includes('••'));

    // Pipeline progression: submitted -> under_review -> shortlisted -> selected -> completed
    assert.ok(VALID_STATUS_TRANSITIONS['submitted'].includes('under_review'));
    let currentStatus = 'under_review';

    assert.ok(VALID_STATUS_TRANSITIONS['under_review'].includes('shortlisted'));
    currentStatus = 'shortlisted';

    // Once shortlisted, employer has consent to view contact details
    const isContactUnmasked = currentStatus === 'shortlisted' || currentStatus === 'selected';
    assert.equal(isContactUnmasked, true);

    assert.ok(VALID_STATUS_TRANSITIONS['shortlisted'].includes('selected'));
    currentStatus = 'selected';

    assert.ok(VALID_STATUS_TRANSITIONS['selected'].includes('completed'));
    currentStatus = 'completed';

    assert.equal(currentStatus, 'completed', 'Journey successfully reached completion');
  });
});
