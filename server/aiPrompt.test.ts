import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCvDraftPrompt, buildStructuredCvDraftPrompt } from './aiPrompt';
import { sanitizeCandidateCvInput } from '../src/domain/aiCvSafeguards';

describe('CV drafting prompt', () => {
  it('contains only the supplied experience and skill facts', () => {
    const prompt = buildCvDraftPrompt('Repaired phones for neighbours.', ['Phone repair (Self-reported)']);

    assert.match(prompt, /Repaired phones for neighbours\./);
    assert.match(prompt, /Phone repair \(Self-reported\)/);
    assert.doesNotMatch(prompt, /Candidate name|Headline|Broad location|email|phone number/i);
  });

  it('buildStructuredCvDraftPrompt formats allow-list with explicit IDs and excludes PII and Candidate Name', () => {
    const sanitized = sanitizeCandidateCvInput(
      'Kagiso',
      [{ name: 'Solar PV Maintenance', label: 'Self-reported' }],
      'Assisted community contractor with wiring on 0821234567.'
    );

    const prompt = buildStructuredCvDraftPrompt(sanitized);

    assert.match(prompt, /ID: skill_0/);
    assert.match(prompt, /Label: Self-reported/);
    assert.match(prompt, /Solar PV Maintenance/);
    assert.doesNotMatch(prompt, /0821234567/);
    assert.match(prompt, /\[PHONE REDACTED\]/);

    // Requirement 7(a): Name is never sent to AI; uses {{NAME}} placeholder
    assert.doesNotMatch(prompt, /Kagiso/);
    assert.match(prompt, /Candidate: \{\{NAME\}\}/);
  });
});
