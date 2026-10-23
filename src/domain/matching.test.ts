import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateMatchScore } from './matching';
import { MATCH_WEIGHTS } from '../config/scoring';
import { makeCandidate, makeClaim, makeJob } from './testFixtures';

describe('calculateMatchScore', () => {
  it('weights sum to 1', () => {
    const sum = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9);
  });

  it('scores a perfect, assessed, local match at 100', () => {
    const result = calculateMatchScore(
      makeJob(),
      makeCandidate(),
      [makeClaim('Skill A', 'Task-assessed'), makeClaim('Skill B', 'Task-assessed')]
    );
    assert.equal(result.totalScore, 100);
    assert.deepEqual(result.missingSkills, []);
  });

  it('lists missing required skills and lowers the score', () => {
    const result = calculateMatchScore(makeJob(), makeCandidate(), [makeClaim('Skill A', 'Task-assessed')]);
    assert.deepEqual(result.missingSkills, ['Skill B']);
    assert.equal(result.skillAlignment, 50);
    assert.ok(result.totalScore < 100);
  });

  it('does not crash on an incomplete profile and gives low evidence', () => {
    const result = calculateMatchScore(makeJob(), makeCandidate({ locationArea: '' }), []);
    assert.equal(result.skillAlignment, 0);
    assert.ok(result.totalScore >= 0 && result.totalScore <= 100);
    assert.ok(result.reasons.length > 0);
  });

  it('gives full location fit to remote jobs regardless of area', () => {
    const result = calculateMatchScore(
      makeJob({ workMode: 'Remote', locationArea: 'Cape Town CBD' }),
      makeCandidate({ locationArea: 'Soweto' }),
      []
    );
    assert.equal(result.locationFit, 100);
  });

  it('treats same metro cluster as partial location fit', () => {
    const result = calculateMatchScore(
      makeJob({ locationArea: 'Sandton' }),
      makeCandidate({ locationArea: 'Soweto' }),
      []
    );
    assert.equal(result.locationFit, 75);
  });

  it('scores a weekend-only candidate lower for a non-weekend in-person role', () => {
    const weekend = calculateMatchScore(makeJob(), makeCandidate({ availability: 'weekends' }), []);
    const immediate = calculateMatchScore(makeJob(), makeCandidate({ availability: 'immediate' }), []);
    assert.ok(weekend.availabilityFit < immediate.availabilityFit);
  });

  it('ranks stronger evidence higher when everything else is equal', () => {
    const job = makeJob({ requiredSkillNames: ['Skill A'], requiredSkillIds: ['skill-a'] });
    const self = calculateMatchScore(job, makeCandidate(), [makeClaim('Skill A', 'Self-reported')]);
    const assessed = calculateMatchScore(job, makeCandidate(), [makeClaim('Skill A', 'Task-assessed')]);
    assert.ok(assessed.totalScore > self.totalScore);
  });

  it('suggests an assessment for self-reported matches (shows unverified skills are not treated as absent)', () => {
    const job = makeJob({ requiredSkillNames: ['Skill A'], requiredSkillIds: ['skill-a'] });
    const result = calculateMatchScore(job, makeCandidate(), [makeClaim('Skill A', 'Self-reported')]);
    assert.equal(result.skillAlignment, 100);
    assert.ok(result.improvementTips.some((t) => t.includes('task assessment')));
  });

  it('returns identical scores for identical inputs (stable ties)', () => {
    const a = calculateMatchScore(makeJob(), makeCandidate(), [makeClaim('Skill A')]);
    const b = calculateMatchScore(makeJob(), makeCandidate(), [makeClaim('Skill A')]);
    assert.equal(a.totalScore, b.totalScore);
  });
});
