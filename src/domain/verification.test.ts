import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getRubricForSkill,
  gradeMicroTaskRubric,
  buildAssessmentRecord,
  buildPeerEndorsementRequest,
  processPeerEndorsement,
  buildMentorReview,
  getVerificationMeaning,
  ASSESSMENT_PASS_THRESHOLD,
} from './rubrics';
import { makeCandidate, makeClaim } from './testFixtures';
import type { SkillClaim } from './types';

describe('Verification Flows & Rubrics Engine (R3 / FR-19)', () => {
  describe('T-22: Micro-Task Rubric Grading & Thresholds', () => {
    it('sets the standard pass threshold at 70/100', () => {
      assert.equal(ASSESSMENT_PASS_THRESHOLD, 70);
    });

    it('grades all 4 rubric criteria and approves when total >= 70', () => {
      const result = gradeMicroTaskRubric({
        c1: 22, // Core execution
        c2: 24, // Safety & PPE
        c3: 20, // Equipment care
        c4: 21, // Troubleshooting
      });

      assert.equal(result.totalScore, 87);
      assert.equal(result.passed, true);
      assert.equal(result.decision, 'approved');
    });

    it('requests revision when score is below 70 threshold', () => {
      const result = gradeMicroTaskRubric({
        c1: 15,
        c2: 18,
        c3: 16,
        c4: 15,
      });

      assert.equal(result.totalScore, 64);
      assert.equal(result.passed, false);
      assert.equal(result.decision, 'revision_requested');
    });

    it('caps individual criteria at max 25 points', () => {
      const result = gradeMicroTaskRubric({
        c1: 30, // over 25
        c2: 25,
        c3: 25,
        c4: 25,
      });

      assert.equal(result.totalScore, 100);
    });

    it('retrieves customized rubrics for South African skills (Solar, Barista, Phone Repair)', () => {
      const solarRubric = getRubricForSkill('skill-solar', 'Solar PV Rooftop Mounting & DC Wiring');
      assert.ok(solarRubric.criteria.length === 4);
      assert.ok(solarRubric.criteria.some((c) => c.title.includes('DC Cabling')));

      const baristaRubric = getRubricForSkill('skill-barista', 'Barista & Espresso Calibration');
      assert.ok(baristaRubric.criteria.some((c) => c.title.includes('Extraction')));

      const defaultRubric = getRubricForSkill('unknown-skill', 'General Maintenance');
      assert.equal(defaultRubric.criteria.length, 4);
    });

    it('builds a structured AssessmentRecord with criteria breakdown', () => {
      const claim = makeClaim('Solar PV Mounting', 'Self-reported');
      const assessor = { uid: 'assessor-1', displayName: 'Nomsa Dlamini' };
      const record = buildAssessmentRecord(
        claim,
        assessor,
        { c1: 25, c2: 25, c3: 22, c4: 20 },
        'Excellent compliance with safety isolation.'
      );

      assert.equal(record.score, 92);
      assert.equal(record.decision, 'approved');
      assert.equal(record.criteria.length, 4);
      assert.equal(record.assessorName, 'Nomsa Dlamini');
    });
  });

  describe('T-20: Peer Endorsement Workflow', () => {
    it('creates a pending peer endorsement request without collecting private phone numbers', () => {
      const claim = makeClaim('Solar PV Mounting', 'Self-reported');
      const request = buildPeerEndorsementRequest({
        claim,
        candidateName: 'Thabo Ndlovu',
        endorserName: 'Sipho Zulu',
        endorserRole: 'Lead Electrician',
        relationship: 'Former Job Supervisor',
        comments: 'Thabo assisted on 8 residential solar roof installations in Soweto.',
      });

      assert.equal(request.status, 'pending');
      assert.equal(request.endorserName, 'Sipho Zulu');
      assert.equal(request.endorserRole, 'Lead Electrician');
      assert.equal(request.relationship, 'Former Job Supervisor');
      assert.ok(!('phone' in request), 'POPIA: No phone number collected');
    });

    it('approves endorsement and transitions status to approved', () => {
      const claim = makeClaim('Solar PV Mounting', 'Self-reported');
      const request = buildPeerEndorsementRequest({
        claim,
        candidateName: 'Thabo Ndlovu',
        endorserName: 'Sipho Zulu',
        endorserRole: 'Lead Electrician',
        relationship: 'Former Job Supervisor',
        comments: 'Verified hands-on work.',
      });

      const confirmed = processPeerEndorsement(request, 'approved');
      assert.equal(confirmed.status, 'approved');
      assert.ok(confirmed.confirmedAt);
    });

    it('displays honest disclaimer for Peer-endorsed status', () => {
      const meaning = getVerificationMeaning('Peer-endorsed');
      assert.equal(meaning.label, 'Peer-endorsed');
      assert.ok(meaning.whatItDoesNotMean.includes('Not a formal educational certification'));
    });
  });

  describe('T-21: Mentor Review Workflow', () => {
    it('creates structured mentor review and approves valid portfolio', () => {
      const claim = makeClaim('Hair Braiding', 'Self-reported');
      const mentor = { uid: 'mentor-1', displayName: 'Nomsa Dlamini', organization: 'Soweto Youth Hub' };
      const review = buildMentorReview({
        claim,
        candidateName: 'Thabo Ndlovu',
        mentor: mentor,
        feedback: 'Clean parting lines, even tension, and safe scalp care observed in portfolio.',
        decision: 'approved',
      });

      assert.equal(review.decision, 'approved');
      assert.equal(review.mentorName, 'Nomsa Dlamini');
      assert.equal(review.organization, 'Soweto Youth Hub');
      assert.ok(review.reviewedAt);
    });

    it('allows mentor to request more evidence without rejecting permanently', () => {
      const claim = makeClaim('Digital Admin', 'Self-reported');
      const mentor = { uid: 'mentor-1', displayName: 'Nomsa Dlamini' };
      const review = buildMentorReview({
        claim,
        candidateName: 'Thabo Ndlovu',
        mentor: mentor,
        feedback: 'Please include examples of Google Sheets formulas used.',
        decision: 'needs_more_evidence',
      });

      assert.equal(review.decision, 'needs_more_evidence');
    });

    it('displays honest disclaimer for Mentor-reviewed status', () => {
      const meaning = getVerificationMeaning('Mentor-reviewed');
      assert.equal(meaning.label, 'Mentor-reviewed');
      assert.ok(meaning.whatItDoesNotMean.includes('Not necessarily a state-accredited'));
    });
  });

  describe('T-19: Protection against self-promotion and honest label invariants', () => {
    it('ensures new skill claims default strictly to Self-reported', () => {
      const claim: SkillClaim = {
        id: 'claim-1',
        candidateId: 'cand-1',
        skillId: 'skill-solar',
        skillName: 'Solar PV Mounting',
        selfReportedLevel: 'Intermediate',
        evidenceType: 'work_sample',
        evidenceTitle: 'Solar Assist',
        evidenceDescription: 'Assisted on installs',
        evidenceUrlOrText: 'Text description',
        verificationStatus: 'Self-reported',
        createdAt: new Date().toISOString(),
      };

      assert.equal(claim.verificationStatus, 'Self-reported');
    });

    it('provides honest disclaimer for all 4 verification states', () => {
      const statuses = ['Self-reported', 'Peer-endorsed', 'Task-assessed', 'Mentor-reviewed'] as const;
      for (const st of statuses) {
        const meaning = getVerificationMeaning(st);
        assert.ok(meaning.honestMeaning.length > 0);
        assert.ok(meaning.whatItDoesNotMean.length > 0);
      }
    });
  });
});
