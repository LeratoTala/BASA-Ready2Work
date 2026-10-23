import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCvDraftPrompt } from './aiPrompt';

describe('CV drafting prompt', () => {
  it('contains only the supplied experience and skill facts', () => {
    const prompt = buildCvDraftPrompt('Repaired phones for neighbours.', ['Phone repair (Self-reported)']);

    assert.match(prompt, /Repaired phones for neighbours\./);
    assert.match(prompt, /Phone repair \(Self-reported\)/);
    assert.doesNotMatch(prompt, /Candidate name|Headline|Broad location|email|phone number/i);
  });
});