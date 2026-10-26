import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  sanitizeCandidateCvInput,
  validateAiCvOutput,
  buildFallbackTemplateDraft,
  canSaveAiCvDraft,
  INFLATION_BLOCKLIST,
  AI_CV_DISCLAIMER_TAG,
  TEMPLATE_DISCLAIMER_TAG,
} from './aiCvSafeguards';

describe('Section 37: P1 AI CV Safeguards', () => {
  const baseSkills = [
    { name: 'Solar PV Maintenance', label: 'Self-reported' },
    { name: 'Espresso Calibration', label: 'Task-assessed' },
  ];
  const baseNotes = 'Assisted local contractor for 2 years with cabling and panel cleaning.';

  // (f) prompt payload contains no phone, ID, or credential ID.
  it('(f) sanitizes input payload and strips phone, SA ID, email, and credential IDs', () => {
    const candidateName = 'Kagiso Mokoena';
    const rawSkillsWithLeak = [
      { name: 'Phone Repair MS-900-8812', label: 'Self-reported' },
    ];
    const rawNotesWithPII =
      'Call me on 0821234567 or email me at km@test.org. SA ID: 0102035800089. Worked for 6 months.';

    const sanitized = sanitizeCandidateCvInput(
      candidateName,
      rawSkillsWithLeak,
      rawNotesWithPII,
      ['Prefers Soweto region']
    );

    const serialized = JSON.stringify(sanitized);

    assert.doesNotMatch(serialized, /0821234567/);
    assert.doesNotMatch(serialized, /0102035800089/);
    assert.doesNotMatch(serialized, /km@test\.org/);
    assert.doesNotMatch(serialized, /MS-900-8812/);
    assert.match(serialized, /\[PHONE REDACTED\]/);
    assert.match(serialized, /\[ID REDACTED\]/);
    assert.match(serialized, /\[EMAIL REDACTED\]/);
    assert.match(serialized, /\[CREDENTIAL_ID REDACTED\]/);
  });

  // (a) invented skill is rejected
  it('(a) rejects AI output containing an invented skill / qualification', () => {
    const payload = sanitizeCandidateCvInput('Nomvula', baseSkills, baseNotes);

    const hallucinatoryOutput = {
      lines: [
        {
          line: 'Maintained solar PV systems and practiced Blockchain architecture.',
          source_fields: ['skill_0'],
        },
      ],
    };

    const result = validateAiCvOutput(hallucinatoryOutput, payload);

    assert.equal(result.source, 'template');
    assert.equal(result.disclaimerTag, TEMPLATE_DISCLAIMER_TAG);
    assert.match(result.rejectedReason || '', /Invented skill/i);
  });

  // (b) invented number/year is rejected
  it('(b) rejects AI output containing an invented number or year not in input', () => {
    const payload = sanitizeCandidateCvInput('Nomvula', baseSkills, baseNotes); // only number '2' is present

    const hallucinatoryOutput = {
      lines: [
        {
          line: 'Assisted with solar panel cleaning for 10 years and graduated in 2018.',
          source_fields: ['skill_0', 'evidence_0'],
        },
      ],
    };

    const result = validateAiCvOutput(hallucinatoryOutput, payload);

    assert.equal(result.source, 'template');
    assert.equal(result.disclaimerTag, TEMPLATE_DISCLAIMER_TAG);
    assert.match(result.rejectedReason || '', /Invented number or year "10"/);
  });

  // (c) Self-reported skill never appears as certified
  it('(c) rejects AI output that upgrades a Self-reported skill to certified or professional', () => {
    const payload = sanitizeCandidateCvInput('Nomvula', baseSkills, baseNotes); // Solar PV is Self-reported

    const upgradedOutput = {
      lines: [
        {
          line: 'Certified professional in Solar PV Maintenance.',
          source_fields: ['skill_0'],
        },
      ],
    };

    const result = validateAiCvOutput(upgradedOutput, payload);

    assert.equal(result.source, 'template');
    assert.equal(result.disclaimerTag, TEMPLATE_DISCLAIMER_TAG);
    assert.match(result.rejectedReason || '', /improperly upgraded to certified/i);
  });

  // Rejects superlatives and inflation words from blocklist
  it('rejects inflation words from blocklist (expert, leading, extensive) when not in input', () => {
    const payload = sanitizeCandidateCvInput('Nomvula', baseSkills, baseNotes);

    const inflatedOutput = {
      lines: [
        {
          line: 'Senior expert with extensive knowledge in electrical cabling.',
          source_fields: ['evidence_0'],
        },
      ],
    };

    const result = validateAiCvOutput(inflatedOutput, payload);

    assert.equal(result.source, 'template');
    assert.match(result.rejectedReason || '', /Inflation word/i);
  });

  // Drops lines without source_fields citation
  it('drops lines that lack valid source_field citations', () => {
    const payload = sanitizeCandidateCvInput('Nomvula', baseSkills, baseNotes);

    const mixedOutput = {
      lines: [
        {
          line: 'Assisted local contractor for 2 years with cabling.',
          source_fields: ['evidence_0'],
        },
        {
          line: 'Random ungrounded bullet point with no source citation.',
          source_fields: [], // empty citation
        },
      ],
    };

    const result = validateAiCvOutput(mixedOutput, payload);

    assert.equal(result.source, 'ai');
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].line, 'Assisted local contractor for 2 years with cabling.');
    assert.equal(result.disclaimerTag, AI_CV_DISCLAIMER_TAG);
  });

  // (d) fallback template works when AI is off or fails
  it('(d) produces a factual deterministic fallback template CV from raw facts', () => {
    const payload = sanitizeCandidateCvInput('Nomvula', baseSkills, baseNotes, ['Willing to travel 10km']);

    const fallback = buildFallbackTemplateDraft(payload);

    assert.equal(fallback.source, 'template');
    assert.equal(fallback.disclaimerTag, TEMPLATE_DISCLAIMER_TAG);
    assert.ok(fallback.lines.length >= 3);
    assert.match(fallback.summaryText, /Solar PV Maintenance \(Self-reported practical skill\)/);
    assert.match(fallback.summaryText, /Espresso Calibration \(Task-assessed verified skill\)/);
    assert.match(fallback.summaryText, /Assisted local contractor for 2 years/);
  });

  // (e) no confirm = no save
  it('(e) blocks saving draft if candidate has not confirmed truthfulness', () => {
    const lines = [
      { line: 'Assisted local contractor with solar panel cleaning.', source_fields: ['evidence_0'] },
    ];

    assert.equal(canSaveAiCvDraft(false, lines), false);
    assert.equal(canSaveAiCvDraft(true, []), false);
    assert.equal(canSaveAiCvDraft(true, lines), true);
  });

  it('replaces {{NAME}} placeholder with real candidate name post-generation without sending name to LLM', () => {
    const payload = sanitizeCandidateCvInput('Nomvula', baseSkills, baseNotes);
    const aiOutputWithPlaceholder = {
      lines: [
        {
          line: '{{NAME}} assisted local contractor for 2 years with cabling.',
          source_fields: ['evidence_0'],
        },
      ],
    };

    const result = validateAiCvOutput(aiOutputWithPlaceholder, payload);
    assert.equal(result.source, 'ai');
    assert.equal(result.lines[0].line, 'Nomvula assisted local contractor for 2 years with cabling.');
    assert.doesNotMatch(result.lines[0].line, /\{\{NAME\}\}/);
  });
});
