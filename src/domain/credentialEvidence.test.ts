import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  validateCredentialInput,
  generateCredentialHash,
  maskCredentialId,
  isCredentialExpired,
  ISSUER_CONFIGS,
} from './credentialValidation';
import { resolveSkillLabelFromCredential } from '../config/credentialRules';
import { calculateMatchScore } from './matching';
import type { CandidateProfile, CredentialEvidence, Job, SkillClaim } from './types';

describe('Part 3B - Section 35: Badges and Certificates as Evidence', () => {
  describe('Section 35.2 & 35.3: Form Validation and Zero-SSRF Safety', () => {
    it('requires at least one of: credential ID, verification link, or uploaded file', () => {
      // Missing all three
      const missingAll = validateCredentialInput({
        issuer: 'Credly',
        credentialName: 'Cloud Practitioner',
      });
      assert.strictEqual(missingAll.isValid, false);
      assert.match(missingAll.error || '', /at least one/i);

      // Only ID provided
      const withIdOnly = validateCredentialInput({
        issuer: 'Microsoft',
        credentialName: 'Azure Fundamentals',
        credentialId: 'MS-AZ900-12345',
      });
      assert.strictEqual(withIdOnly.isValid, true);

      // Only link provided (certificate without ID, Section 35.7)
      const withLinkOnly = validateCredentialInput({
        issuer: 'Coursera',
        credentialName: 'Python for Beginners',
        verifyUrl: 'https://coursera.org/verify/AB12CD34EF56',
      });
      assert.strictEqual(withLinkOnly.isValid, true);

      // Only file provided (community certificate photo or PDF)
      const withFileOnly = validateCredentialInput({
        issuer: 'Other',
        credentialName: 'Township Solar Apprenticeship',
        fileRef: 'candidate-evidence/cert-123.pdf',
      });
      assert.strictEqual(withFileOnly.isValid, true);
    });

    it('enforces HTTPS only for verification URLs to prevent insecure protocol links', () => {
      const httpResult = validateCredentialInput({
        issuer: 'Credly',
        credentialName: 'Cybersecurity Badge',
        verifyUrl: 'http://credly.com/badges/abc-123',
      });
      assert.strictEqual(httpResult.isValid, false);
      assert.match(httpResult.error || '', /https:\/\//i);

      const javascriptResult = validateCredentialInput({
        issuer: 'Credly',
        credentialName: 'Cybersecurity Badge',
        verifyUrl: 'javascript:alert(1)',
      });
      assert.strictEqual(javascriptResult.isValid, false);
    });

    it('sets needs_review for unknown domains or custom issuers without failing', () => {
      const unknownDomain = validateCredentialInput({
        issuer: 'Credly',
        credentialName: 'Badge',
        verifyUrl: 'https://random-unverified-site.com/badge/123',
      });
      assert.strictEqual(unknownDomain.isValid, true);
      assert.strictEqual(unknownDomain.initialCheckStatus, 'needs_review');
      assert.match(unknownDomain.checkNote || '', /domain/i);
    });

    it('sets needs_review when credential ID does not match known issuer format', () => {
      const invalidRedCrossId = validateCredentialInput({
        issuer: 'South African Red Cross',
        credentialName: 'First Aid Level 1',
        credentialId: 'INVALID_ID_FORMAT_123',
      });
      assert.strictEqual(invalidRedCrossId.isValid, true);
      assert.strictEqual(invalidRedCrossId.initialCheckStatus, 'needs_review');
      assert.match(invalidRedCrossId.checkNote || '', /pattern/i);
    });

    it('handles "Other" issuer without regex enforcement and queues for assessor review', () => {
      const otherIssuer = validateCredentialInput({
        issuer: 'Other',
        credentialName: 'Local Church Sound Engineering Certificate',
        credentialId: 'CHURCH-SOUND-2026',
        verifyUrl: 'https://community-church.org.za/cert',
      });
      assert.strictEqual(otherIssuer.isValid, true);
      assert.strictEqual(otherIssuer.initialCheckStatus, 'needs_review');
    });
  });

  describe('Section 35.3 & 35.6: Privacy, Masking & Duplicate Detection', () => {
    it('masks credential IDs to protect candidate privacy while showing the last 4 characters', () => {
      assert.strictEqual(maskCredentialId('SCA-BAR-2026-9921'), '••••••••9921');
      assert.strictEqual(maskCredentialId('ABCD'), '••••');
      assert.strictEqual(maskCredentialId(''), '');
      assert.strictEqual(maskCredentialId(undefined), '');
    });

    it('computes salted hashes for duplicate credential detection across candidate accounts', () => {
      const hash1 = generateCredentialHash('Credly', 'BADGE-1234-ABCD');
      const hash2 = generateCredentialHash('Credly', 'badge-1234-abcd'); // Normalized case
      const hash3 = generateCredentialHash('Credly', 'DIFFERENT-ID');
      const hashOtherIssuer = generateCredentialHash('Coursera', 'BADGE-1234-ABCD');

      assert.ok(hash1);
      assert.strictEqual(typeof hash1, 'string');
      // Case and whitespace normalized equality
      assert.strictEqual(hash1, hash2);
      // Different ID produces different hash
      assert.notStrictEqual(hash1, hash3);
      // Different issuer produces different hash
      assert.notStrictEqual(hash1, hashOtherIssuer);
    });
  });

  describe('Section 35.3 & 35.4: Expiry Detection and Matching Neutrality', () => {
    it('correctly detects expired credentials against reference date', () => {
      const pastDate = '2024-01-01';
      const futureDate = '2030-01-01';
      const now = new Date('2026-10-25T00:00:00Z');

      assert.strictEqual(isCredentialExpired(pastDate, now), true);
      assert.strictEqual(isCredentialExpired(futureDate, now), false);
      assert.strictEqual(isCredentialExpired(undefined, now), false);
    });

    it('does not upgrade verification status if credential has expired', () => {
      const expiredCred: CredentialEvidence = {
        id: 'cred-expired-1',
        type: 'credential',
        issuer: 'Microsoft',
        credentialName: 'Azure Administrator',
        credentialCategory: 'proctored_exam',
        checkStatus: 'checked_ok',
        expiresOn: '2024-01-01', // Expired
      };

      const result = resolveSkillLabelFromCredential('Self-reported', expiredCred);
      assert.strictEqual(result, 'Self-reported');
    });

    it('never penalizes candidates in matching for omitting a credential ID (Section 35.7)', () => {
      const testJob: Job = {
        id: 'job-1',
        employerId: 'emp-1',
        employerName: 'Soweto Solar Tech',
        employerVerified: true,
        title: 'Solar Panel Technician',
        description: 'Install residential solar systems.',
        responsibilities: ['Mount solar panels and connect inverters'],
        requiredSkillIds: ['skill-solar'],
        requiredSkillNames: ['Solar Installation'],
        locationArea: 'Soweto',
        workMode: 'In-person',
        compensationAmount: 500,
        compensationCurrency: 'ZAR',
        compensationUnit: 'daily',
        startDate: '2026-11-01',
        applicationDeadline: '2026-10-31',
        status: 'open',
        reportCount: 0,
        createdAt: '2026-10-01T00:00:00Z',
      };

      const candidateProfile: CandidateProfile = {
        uid: 'cand-1',
        fullName: 'Bongani Sithole',
        headline: 'Solar Technician',
        experienceSummary: '2 years rooftop experience',
        skillIds: ['skill-solar'],
        locationArea: 'Soweto',
        availability: 'immediate',
        popiaVisibility: 'employers_only',
        updatedAt: '2026-10-01T00:00:00Z',
      };

      // Claim A: Has credential WITH ID
      const claimWithId: SkillClaim = {
        id: 'claim-a',
        candidateId: 'cand-1',
        skillId: 'skill-solar',
        skillName: 'Solar Installation',
        selfReportedLevel: 'Proficient',
        evidenceType: 'practical_demo',
        evidenceTitle: 'TVET Certificate with ID',
        evidenceDescription: '60 hrs practical.',
        evidenceUrlOrText: 'candidate-evidence/tvet.pdf',
        verificationStatus: 'Task-assessed',
        credentials: [
          {
            id: 'cred-with-id',
            type: 'credential',
            issuer: 'SAQA',
            credentialName: 'Solar Certificate',
            credentialId: 'SAQA-12345',
            checkStatus: 'checked_ok',
          },
        ],
        createdAt: '2026-10-01T00:00:00Z',
      };

      // Claim B: Has institutional certificate WITHOUT ID (photo/link only)
      const claimWithoutId: SkillClaim = {
        ...claimWithId,
        id: 'claim-b',
        credentials: [
          {
            id: 'cred-no-id',
            type: 'credential',
            issuer: 'Other',
            credentialName: 'Community TVET Certificate',
            fileRef: 'candidate-evidence/tvet_cert.pdf',
            checkStatus: 'checked_ok',
          },
        ],
      };

      const scoreWithId = calculateMatchScore(testJob, candidateProfile, [claimWithId]);
      const scoreWithoutId = calculateMatchScore(testJob, candidateProfile, [claimWithoutId]);

      // Both must achieve identical score — zero penalty for omitted credential ID
      assert.strictEqual(scoreWithoutId.totalScore, scoreWithId.totalScore);
      assert.strictEqual(scoreWithoutId.evidenceStrength, scoreWithId.evidenceStrength);
    });
  });

  describe('Section 35.4: Honest Evidence Label Resolution Matrix', () => {
    it('checked_ok proctored exam upgrades Self-reported to Task-assessed', () => {
      const proctoredCred: CredentialEvidence = {
        id: 'cred-1',
        type: 'credential',
        issuer: 'Microsoft',
        credentialName: 'Azure Administrator',
        credentialCategory: 'proctored_exam',
        checkStatus: 'checked_ok',
      };

      assert.strictEqual(resolveSkillLabelFromCredential('Self-reported', proctoredCred), 'Task-assessed');
    });

    it('checked_ok course badge upgrades Self-reported to Peer-endorsed', () => {
      const courseCred: CredentialEvidence = {
        id: 'cred-2',
        type: 'credential',
        issuer: 'Coursera',
        credentialName: 'Python for Beginners',
        credentialCategory: 'course_badge',
        checkStatus: 'checked_ok',
      };

      assert.strictEqual(resolveSkillLabelFromCredential('Self-reported', courseCred), 'Peer-endorsed');
    });

    it('unchecked, needs_review, or checked_mismatch never upgrades the label', () => {
      const uncheckedCred: CredentialEvidence = {
        id: 'cred-3',
        type: 'credential',
        issuer: 'Microsoft',
        credentialName: 'Azure Administrator',
        credentialCategory: 'proctored_exam',
        checkStatus: 'unchecked',
      };
      const mismatchCred: CredentialEvidence = {
        ...uncheckedCred,
        checkStatus: 'checked_mismatch',
      };
      const reviewCred: CredentialEvidence = {
        ...uncheckedCred,
        checkStatus: 'needs_review',
      };

      assert.strictEqual(resolveSkillLabelFromCredential('Self-reported', uncheckedCred), 'Self-reported');
      assert.strictEqual(resolveSkillLabelFromCredential('Self-reported', mismatchCred), 'Self-reported');
      assert.strictEqual(resolveSkillLabelFromCredential('Self-reported', reviewCred), 'Self-reported');
    });

    it('never downgrades a higher status (e.g. Mentor-reviewed remains Mentor-reviewed)', () => {
      const courseCred: CredentialEvidence = {
        id: 'cred-4',
        type: 'credential',
        issuer: 'Credly',
        credentialName: 'Intro Badge',
        credentialCategory: 'course_badge',
        checkStatus: 'checked_ok',
      };

      assert.strictEqual(resolveSkillLabelFromCredential('Mentor-reviewed', courseCred), 'Mentor-reviewed');
      assert.strictEqual(resolveSkillLabelFromCredential('Task-assessed', courseCred), 'Task-assessed');
    });

    it('evaluates multiple credentials on a claim and selects highest eligible tier', () => {
      const creds: CredentialEvidence[] = [
        {
          id: 'c1',
          type: 'credential',
          issuer: 'Coursera',
          credentialName: 'Course Badge',
          credentialCategory: 'course_badge',
          checkStatus: 'checked_ok',
        },
        {
          id: 'c2',
          type: 'credential',
          issuer: 'Microsoft',
          credentialName: 'Proctored Certification',
          credentialCategory: 'proctored_exam',
          checkStatus: 'checked_ok',
        },
        {
          id: 'c3',
          type: 'credential',
          issuer: 'Other',
          credentialName: 'Expired Exam',
          credentialCategory: 'proctored_exam',
          checkStatus: 'checked_ok',
          expiresOn: '2023-01-01',
        },
      ];

      assert.strictEqual(resolveSkillLabelFromCredential('Self-reported', creds), 'Task-assessed');
    });
  });

  describe('Section 35.4: Accredited Qualification Guardrail', () => {
    it('strictly reserves accredited status for verified SAQA or statutory licenses only', () => {
      assert.strictEqual(ISSUER_CONFIGS['SAQA'].isAccredited, true);
      assert.strictEqual(ISSUER_CONFIGS['Credly'].isAccredited, false);
      assert.strictEqual(ISSUER_CONFIGS['Coursera'].isAccredited, false);
      assert.strictEqual(ISSUER_CONFIGS['Microsoft'].isAccredited, false);
    });
  });
});
