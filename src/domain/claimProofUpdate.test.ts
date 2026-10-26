import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSkillClaimProofStatus, updateClaimProof } from './claimProofUpdate';
import { SkillClaim, EvidenceItem } from './types';

describe('Claim Proof Updates & Status Evaluation', () => {
  const claimWithoutProof: SkillClaim = {
    id: 'claim-no-proof',
    candidateId: 'cand-1',
    skillId: 'skill-phone-repair',
    skillName: 'Smartphone Screen & Battery Replacement',
    selfReportedLevel: 'Beginner',
    evidenceType: 'practical_demo',
    evidenceTitle: 'Phone repair hobby',
    evidenceDescription: 'Replaced screens for friends but have no photos or docs.',
    evidenceUrlOrText: '',
    evidenceItems: [],
    credentials: [],
    verificationStatus: 'Self-reported',
    createdAt: '2026-10-18T10:00:00Z',
  };

  it('correctly classifies a claim without proof as "No proof uploaded yet"', () => {
    const status = getSkillClaimProofStatus(claimWithoutProof);
    assert.equal(status.hasProof, false);
    assert.equal(status.statusLabel, 'No proof uploaded yet');
    assert.equal(status.totalProofItems, 0);
  });

  it('allows candidate to update proof even after initial submission', () => {
    const newProofItem: EvidenceItem = {
      id: 'ev-new-1',
      type: 'photo',
      title: 'iPhone Screen Replacement Bench Photo',
      fileName: 'screen_repair_bench.jpg',
      fileSize: 1024 * 500,
      mimeType: 'image/jpeg',
      description: 'Showing safe heat gun and suction cup screen removal without flex cable tear.',
      uploadedAt: '2026-10-26T12:00:00Z',
    };

    const updatedClaim = updateClaimProof(claimWithoutProof, {
      evidenceTitle: 'Bench-tested iPhone & Samsung Screen Repairs',
      evidenceDescription: 'Replaced 15+ screens with heat plate calibration and digitizer testing.',
      evidenceType: 'photo_video',
      newEvidenceItems: [newProofItem],
    });

    assert.equal(updatedClaim.evidenceTitle, 'Bench-tested iPhone & Samsung Screen Repairs');
    assert.equal(updatedClaim.evidenceType, 'photo_video');
    assert.equal(updatedClaim.evidenceItems?.length, 1);
    assert.equal(updatedClaim.evidenceItems?.[0].title, 'iPhone Screen Replacement Bench Photo');

    // Status now reports proof uploaded!
    const newStatus = getSkillClaimProofStatus(updatedClaim);
    assert.equal(newStatus.hasProof, true);
    assert.equal(newStatus.statusLabel, 'Proof Uploaded (1 file)');
  });

  it('correctly identifies completed job work experience as verified proof', () => {
    const claimWithJobProof: SkillClaim = {
      ...claimWithoutProof,
      evidenceItems: [
        {
          id: 'ev-job-1',
          type: 'work_sample',
          title: 'Completed Job: Cell Phone Repair Assistant (TechFix CBD)',
          fileName: 'Job_Proof.pdf',
          uploadedAt: '2026-10-26T12:00:00Z',
        },
      ],
    };

    const status = getSkillClaimProofStatus(claimWithJobProof);
    assert.equal(status.hasProof, true);
    assert.equal(status.completedJobsCount, 1);
    assert.equal(status.statusLabel, 'Verified by Job (1)');
  });
});
