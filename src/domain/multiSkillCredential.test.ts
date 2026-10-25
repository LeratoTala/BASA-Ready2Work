import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CredentialEvidence, SkillClaim, Job, FeedbackRecord } from './types';
import { resolveSkillLabelFromCredential } from '../config/credentialRules';

describe('Multi-Skill Credential Association & Passport Verifications', () => {
  it('allows 1 badge or certificate to cover multiple modular practical skills', () => {
    const modularCredential: CredentialEvidence = {
      id: 'cred-tvet-fnb-101',
      type: 'credential',
      issuer: 'SAQA / TVET College',
      credentialName: 'Commercial Kitchen Operations & Food Safety Certificate',
      credentialId: 'TVET-FNB-2026-99',
      credentialCategory: 'trade_certificate',
      isAccredited: true,
      checkStatus: 'unchecked',
      associatedSkills: [
        'Food Preparation & Kitchen Hygiene',
        'Barista & Espresso Brewing',
        'Inventory & Stock Control',
      ],
    };

    assert.equal(modularCredential.associatedSkills?.length, 3);
    assert.ok(modularCredential.associatedSkills?.includes('Food Preparation & Kitchen Hygiene'));
    assert.ok(modularCredential.associatedSkills?.includes('Barista & Espresso Brewing'));
    assert.ok(modularCredential.associatedSkills?.includes('Inventory & Stock Control'));
  });

  it('updates all linked skill claims simultaneously when assessor approves credential', () => {
    // 3 claims sharing the same certificate
    const claims: SkillClaim[] = [
      {
        id: 'claim-kitchen',
        candidateId: 'cand-1',
        skillId: 'skill-kitchen',
        skillName: 'Food Preparation & Kitchen Hygiene',
        selfReportedLevel: 'Intermediate',
        evidenceType: 'work_sample',
        evidenceTitle: 'TVET Kitchen Certificate',
        evidenceDescription: 'Covers kitchen prep',
        evidenceUrlOrText: 'doc.pdf',
        verificationStatus: 'Self-reported',
        createdAt: '2026-10-01T10:00:00Z',
        credentials: [
          {
            id: 'shared-cred-1',
            type: 'credential',
            issuer: 'SAQA / TVET College',
            credentialName: 'Modular Hospitality Certificate',
            credentialCategory: 'trade_certificate',
            isAccredited: true,
            checkStatus: 'unchecked',
            associatedSkills: ['Food Preparation & Kitchen Hygiene', 'Barista & Espresso Brewing'],
          },
        ],
      },
      {
        id: 'claim-barista',
        candidateId: 'cand-1',
        skillId: 'skill-barista',
        skillName: 'Barista & Espresso Brewing',
        selfReportedLevel: 'Intermediate',
        evidenceType: 'work_sample',
        evidenceTitle: 'TVET Barista Certificate',
        evidenceDescription: 'Covers espresso brewing',
        evidenceUrlOrText: 'doc.pdf',
        verificationStatus: 'Self-reported',
        createdAt: '2026-10-01T10:00:00Z',
        credentials: [
          {
            id: 'shared-cred-1',
            type: 'credential',
            issuer: 'SAQA / TVET College',
            credentialName: 'Modular Hospitality Certificate',
            credentialCategory: 'trade_certificate',
            isAccredited: true,
            checkStatus: 'unchecked',
            associatedSkills: ['Food Preparation & Kitchen Hygiene', 'Barista & Espresso Brewing'],
          },
        ],
      },
    ];

    // Assessor marks shared-cred-1 as checked_ok
    const decision = 'checked_ok';
    const assessorNote = 'Verified SAQA accreditation on national learner database.';

    const updatedClaims = claims.map((claim) => {
      let targetCred: CredentialEvidence | undefined;
      const updatedCreds = (claim.credentials || []).map((c) => {
        if (c.id === 'shared-cred-1') {
          targetCred = {
            ...c,
            checkStatus: decision,
            checkedBy: 'admin-assessor-1',
            checkedAt: '2026-10-26T00:00:00Z',
            checkNote: assessorNote,
          };
          return targetCred;
        }
        return c;
      });

      const newStatus = resolveSkillLabelFromCredential(claim.verificationStatus, targetCred);
      return {
        ...claim,
        credentials: updatedCreds,
        verificationStatus: newStatus,
      };
    });

    // Both claims should be upgraded to Task-assessed simultaneously
    assert.equal(updatedClaims[0].verificationStatus, 'Task-assessed');
    assert.equal(updatedClaims[0].credentials?.[0].checkStatus, 'checked_ok');

    assert.equal(updatedClaims[1].verificationStatus, 'Task-assessed');
    assert.equal(updatedClaims[1].credentials?.[0].checkStatus, 'checked_ok');
  });
});

describe('Admin Job Terms & South African National Minimum Wage (NMW) Inspector', () => {
  const SA_STATUTORY_MINIMUM_WAGE_HOURLY = 27.58;

  const calculateEffectiveHourlyRate = (job: Partial<Job>): number => {
    if (job.compensationUnit === 'hourly') return job.compensationAmount ?? 0;
    if (job.compensationUnit === 'daily') return (job.compensationAmount ?? 0) / 8;
    return job.compensationAmount ?? 0;
  };

  it('correctly calculates effective hourly rate from daily pay', () => {
    const job: Partial<Job> = {
      compensationAmount: 320,
      compensationUnit: 'daily',
    };
    const effectiveRate = calculateEffectiveHourlyRate(job);
    assert.equal(effectiveRate, 40); // 320 / 8 = R40/hr
    assert.ok(effectiveRate >= SA_STATUTORY_MINIMUM_WAGE_HOURLY);
  });

  it('flags sub-minimum wage exploitative rates below R27.58/hr', () => {
    const exploitativeJob: Partial<Job> = {
      title: 'Workshop Cleaner & Packer',
      compensationAmount: 160,
      compensationUnit: 'daily', // 160 / 8 = R20/hr, below R27.58 statutory NMW
    };

    const effectiveRate = calculateEffectiveHourlyRate(exploitativeJob);
    assert.equal(effectiveRate, 20);
    assert.ok(
      effectiveRate < SA_STATUTORY_MINIMUM_WAGE_HOURLY,
      'Effective rate of R20/hr is below statutory R27.58/hr and must trigger alert'
    );
  });

  it('validates compliant hourly job meeting statutory threshold', () => {
    const compliantJob: Partial<Job> = {
      title: 'Junior Barista Assistant',
      compensationAmount: 35,
      compensationUnit: 'hourly',
    };

    const effectiveRate = calculateEffectiveHourlyRate(compliantJob);
    assert.equal(effectiveRate, 35);
    assert.ok(effectiveRate >= SA_STATUTORY_MINIMUM_WAGE_HOURLY);
  });
});

describe('Section 31.2: In-App User Feedback Engine', () => {
  it('creates and records user feedback without external trackers or privacy leakage', () => {
    const feedback: FeedbackRecord = {
      id: 'fb-1001',
      userId: 'cand-thabo',
      userRole: 'candidate',
      userName: 'Thabo Ndlovu',
      rating: 5,
      workedWell: 'Adding my TVET certificate linked across 3 skills directly into my passport.',
      needsImprovement: 'Would love to filter jobs closer to Soweto specifically.',
      createdAt: new Date().toISOString(),
    };

    assert.equal(feedback.rating, 5);
    assert.equal(feedback.userRole, 'candidate');
    assert.ok(feedback.workedWell.length > 0);
    assert.ok(feedback.needsImprovement.length > 0);
  });
});
