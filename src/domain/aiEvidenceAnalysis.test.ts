import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyzeEvidenceWithAI } from './aiEvidenceAnalysis';
import type { EvidenceItem } from './types';

describe('AI Evidence Analysis Engine (Assessor Copilot)', () => {
  it('extracts certificate details and safety indicators from attached documents', () => {
    const evidenceItems: EvidenceItem[] = [
      {
        id: 'ev-1',
        type: 'document_pdf',
        title: 'Soweto Solar PV TVET Certificate',
        fileName: 'Soweto_Solar_Certificate.pdf',
        mimeType: 'application/pdf',
        uploadedAt: '2026-10-15T10:00:00Z',
      },
      {
        id: 'ev-2',
        type: 'photo',
        title: 'Roof Mount Harness and Clamping',
        fileName: 'roof_safety_clamp.jpg',
        mimeType: 'image/jpeg',
        uploadedAt: '2026-10-15T10:05:00Z',
      },
    ];

    const result = analyzeEvidenceWithAI({
      candidateName: 'Sipho Khumalo',
      skillName: 'Solar PV Rooftop Mounting & DC Wiring',
      evidenceTitle: 'Solar PV Installation Workshop with Safety Isolation',
      evidenceDescription: 'Completed 40 hours with PPE safety harness and multimeter grounding tests.',
      evidenceItems,
    });

    assert.ok(result.extractedFacts.length >= 3);
    assert.ok(result.matchedCredentials.certificateTitle?.includes('Solar'));
    assert.equal(result.matchedCredentials.candidateNameMatched, true);
    assert.ok(result.suggestedScores.total >= 70, 'Should suggest a passing score for certified solar evidence');
    assert.ok(result.criteriaFindings.safetyCompliance.includes('safety'));
  });

  it('suggests lower scores and alerts assessor when evidence is missing safety', () => {
    const result = analyzeEvidenceWithAI({
      candidateName: 'Thabo Ndlovu',
      skillName: 'General Maintenance',
      evidenceTitle: 'Assisted neighbor with yard',
      evidenceDescription: 'Helped clean up garden tools.',
      evidenceItems: [],
    });

    assert.ok(result.suggestedScores.crit2 <= 20, 'Safety score should be low without explicit safety protocols');
    assert.ok(result.extractedFacts.some((f) => f.includes('Limited explicit mention of safety')));
  });
});
