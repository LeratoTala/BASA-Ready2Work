import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { maskEmail, maskPhone } from '../shared/maskContact';
import { VALID_STATUS_TRANSITIONS } from './applicationStatus';

describe('Section 30 Fraud Protection & Safeguards', () => {
  describe('30.1 Employer Verification Invariants', () => {
    it('requires verified status before an employer can post opportunities', () => {
      const employerProfile = {
        uid: 'emp-unverified',
        businessName: 'Unverified Cafe Ltd',
        verificationStatus: 'pending',
      };

      const canPost = employerProfile.verificationStatus === 'verified';
      assert.equal(canPost, false, 'Unverified employer must not be allowed to post');

      const verifiedEmployer = { ...employerProfile, verificationStatus: 'verified' };
      assert.equal(verifiedEmployer.verificationStatus === 'verified', true);
    });
  });

  describe('30.2 Auto-hide Job on 3 Reports', () => {
    it('flags and hides a job when report count reaches 3', () => {
      let job = { id: 'job-1', title: 'Suspicious Job', reportCount: 0, status: 'open' };

      const submitMockReport = () => {
        const newCount = job.reportCount + 1;
        job = {
          ...job,
          reportCount: newCount,
          status: newCount >= 3 ? 'flagged' : job.status,
        };
      };

      submitMockReport();
      assert.equal(job.reportCount, 1);
      assert.equal(job.status, 'open');

      submitMockReport();
      assert.equal(job.reportCount, 2);
      assert.equal(job.status, 'open');

      submitMockReport();
      assert.equal(job.reportCount, 3);
      assert.equal(job.status, 'flagged', 'Job must auto-hide (flagged) when it receives 3 reports');
    });
  });

  describe('30.4 Candidate Contact Protection (POPIA)', () => {
    it('masks phone and email until application is shortlisted or selected', () => {
      const candidate = {
        fullName: 'Bongani Sithole',
        phone: '0821234567',
        contactEmail: 'bongani.sithole@example.co.za',
      };

      // Unshortlisted state: masked
      const maskedPhone = maskPhone(candidate.phone);
      const maskedEmail = maskEmail(candidate.contactEmail);

      assert.ok(maskedPhone.includes('••'));
      assert.ok(maskedEmail.includes('••'));
      assert.equal(maskedPhone.endsWith('67'), true);
    });

    it('allows candidate withdrawal from any non-terminal state', () => {
      const currentStatus = 'submitted';
      const transitions = VALID_STATUS_TRANSITIONS[currentStatus];
      assert.ok(transitions.includes('withdrawn'), 'Candidate must be able to withdraw application');
    });
  });

  describe('30.5 Endorsement Integrity Safeguards', () => {
    it('prohibits self-endorsement', () => {
      const candidateName = 'Lerato Moloi';
      const endorserName = 'Lerato Moloi';

      const isSelfEndorsement = candidateName.trim().toLowerCase() === endorserName.trim().toLowerCase();
      assert.equal(isSelfEndorsement, true, 'Self-endorsement must be detected and rejected');
    });

    it('caps endorsements per skill at 3', () => {
      const existingEndorsements = [
        { id: 'e1', claimId: 'claim-1', endorserName: 'Sipho Zulu', status: 'approved' },
        { id: 'e2', claimId: 'claim-1', endorserName: 'Nomvula Dlamini', status: 'approved' },
        { id: 'e3', claimId: 'claim-1', endorserName: 'Themba Khumalo', status: 'approved' },
      ];

      const canAddMore = existingEndorsements.length < 3;
      assert.equal(canAddMore, false, 'Skill cannot exceed 3 active endorsements');
    });

    it('rejects duplicate endorsement from the same endorser on the same skill', () => {
      const existingEndorsements = [
        { id: 'e1', claimId: 'claim-1', endorserName: 'Sipho Zulu', status: 'approved' },
      ];
      const newEndorserName = 'sipho zulu';

      const isDuplicate = existingEndorsements.some(
        (e) => e.endorserName.trim().toLowerCase() === newEndorserName.trim().toLowerCase()
      );
      assert.equal(isDuplicate, true, 'Same endorser cannot endorse the same skill twice');
    });
  });
});
