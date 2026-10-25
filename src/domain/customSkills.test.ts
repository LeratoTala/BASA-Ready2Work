import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateMatchScore } from './matching';
import { ASSESSMENT_PASS_THRESHOLD, getRubricForSkill, gradeMicroTaskRubric } from './rubrics';
import { SKILL_DEFINITIONS } from './skillCatalogue';
import { makeCandidate, makeClaim, makeJob } from './testFixtures';

describe('Expanded Skill Catalogue & Custom Employer Skills', () => {
  it('contains at least 35 diverse South African skills across 7 distinct categories', () => {
    assert.ok(SKILL_DEFINITIONS.length >= 35, `Expected >= 35 skills, got ${SKILL_DEFINITIONS.length}`);

    const categories = new Set(SKILL_DEFINITIONS.map((s) => s.category));
    assert.ok(categories.size >= 7, `Expected at least 7 categories, got ${categories.size}`);
    assert.ok(categories.has('Technical & Trades'));
    assert.ok(categories.has('Hospitality & Retail'));
    assert.ok(categories.has('Digital & Admin'));
    assert.ok(categories.has('Care & Community'));
    assert.ok(categories.has('Logistics & Driving'));
    assert.ok(categories.has('Creative & Beauty'));
    assert.ok(categories.has('Agriculture & Environment'));
  });

  it('preserves all original core skill IDs for backward compatibility', () => {
    const originalIds = [
      'skill-barista',
      'skill-solar',
      'skill-retail',
      'skill-phone-repair',
      'skill-digital-admin',
      'skill-childcare',
      'skill-plumbing',
    ];

    for (const id of originalIds) {
      const match = SKILL_DEFINITIONS.find((s) => s.id === id);
      assert.ok(match, `Missing original core skill ID: ${id}`);
      assert.equal(match?.active, true);
    }
  });

  it('matches candidates holding custom employer skills that do not exist in standard catalogue', () => {
    const customSkillName = 'Specialized Fibre Optic Splicing';
    const customJob = makeJob({
      title: 'Fibre Technician',
      requiredSkillNames: [customSkillName, 'Solar PV Rooftop Mounting & DC Wiring'],
      requiredSkillIds: ['custom-skill-specialized-fibre-optic-splicing', 'skill-solar'],
    });

    const candidateWithCustom = makeCandidate({
      fullName: 'Thabo Mokoena',
    });

    const claims = [
      makeClaim(customSkillName, 'Task-assessed'),
      makeClaim('Solar PV Rooftop Mounting & DC Wiring', 'Task-assessed'),
    ];

    const matchResult = calculateMatchScore(customJob, candidateWithCustom, claims);

    assert.equal(matchResult.skillAlignment, 100);
    assert.deepEqual(matchResult.missingSkills, []);
    assert.ok(matchResult.totalScore >= 80);
    assert.ok(matchResult.reasons.some((r) => r.toLowerCase().includes('matched skills')));
  });

  it('correctly reports missing custom skills if candidate lacks them', () => {
    const customSkillName = 'Heavy Machinery Rigging';
    const customJob = makeJob({
      title: 'Rigging Specialist',
      requiredSkillNames: [customSkillName],
      requiredSkillIds: ['custom-skill-heavy-machinery-rigging'],
    });

    const candidate = makeCandidate();
    const claims = [makeClaim('Commercial Kitchen Prep & Knife Skills', 'Mentor-reviewed')];

    const matchResult = calculateMatchScore(customJob, candidate, claims);

    assert.equal(matchResult.skillAlignment, 0);
    assert.deepEqual(matchResult.missingSkills, [customSkillName]);
  });

  it('provides a valid standard 100-point 4-criterion rubric for any custom skill', () => {
    const customSkillName = 'Custom Drone Inspection';
    const rubric = getRubricForSkill('custom-skill-drone', customSkillName);

    assert.equal(rubric.skillName, customSkillName);
    assert.equal(rubric.criteria.length, 4);
    assert.equal(ASSESSMENT_PASS_THRESHOLD, 70);

    const totalWeight = rubric.criteria.reduce((sum, c) => sum + c.maxPoints, 0);
    assert.equal(totalWeight, 100);

    const gradeResult = gradeMicroTaskRubric({
      c1: 20,
      c2: 20,
      c3: 18,
      c4: 18,
    });
    assert.equal(gradeResult.totalScore, 76);
    assert.equal(gradeResult.passed, true);
  });
});
