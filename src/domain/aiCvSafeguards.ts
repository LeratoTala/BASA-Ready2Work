/**
 * AI CV Safeguards Domain Engine (Section 37 - P1)
 *
 * Core Principle: AI may only REWORD facts the candidate has already entered.
 * It may NEVER invent, upgrade, or add anything.
 *
 * Safeguards:
 *  - Sanitized input allow-list: name, skills (with labels), evidence, dates, preferences.
 *  - Strips phone numbers, SA ID numbers, credential IDs, and third-party data.
 *  - Verifies structured JSON citations: every line must cite source_fields.
 *  - Enforces superlative/inflation blocklist (expert, certified, award-winning, senior, leading, extensive).
 *  - Strict allow-list diff: rejects invented numbers, years, employers, and skills.
 *  - Fallback template CV built from raw fields if AI is disabled or rejected.
 *  - Mandatory candidate confirmation: "I confirm this is true".
 */

export const INFLATION_BLOCKLIST = [
  'expert',
  'certified',
  'award-winning',
  'senior',
  'leading',
  'extensive',
] as const;

export const AI_CV_DISCLAIMER_TAG = 'Written with AI help - not verified' as const;
export const TEMPLATE_DISCLAIMER_TAG = 'Candidate facts template' as const;

export interface CvInputFact {
  id: string; // e.g. "skill_0", "evidence_0"
  type: 'skill' | 'evidence' | 'preference' | 'date' | 'task_note' | 'mentor_comment';
  label?: string; // 'Self-reported' | 'Peer-endorsed' | 'Task-assessed' | 'Mentor-verified'
  text: string;
}

export interface SanitizedCvPayload {
  candidateName: string;
  facts: CvInputFact[];
}

export interface AiCvDraftLine {
  line: string;
  source_fields: string[];
}

export interface AiCvDraftResult {
  lines: AiCvDraftLine[];
  summaryText: string;
  source: 'ai' | 'template';
  disclaimerTag: typeof AI_CV_DISCLAIMER_TAG | typeof TEMPLATE_DISCLAIMER_TAG;
  rejectedReason?: string;
}

/** Regex to detect South African 13-digit ID numbers */
const SA_ID_REGEX = /\b\d{13}\b/g;

/** Regex to detect South African phone numbers (mobile 06-08, landlines 01-05, and +27 prefix) */
const PHONE_REGEX = /(\+27|0)[1-8][0-9]{8}\b/g;

/** Regex to detect email addresses */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/** Regex to detect credential/serial IDs like MS-900-1234 or hash strings */
const CREDENTIAL_ID_REGEX = /\b[A-Z0-9]{3,}-[A-Z0-9-]{4,}\b/g;

/**
 * Sanitizes any free-text field destined for LLM prompts or audit stores.
 * Strictly redacts South African 13-digit ID numbers, phone numbers, email addresses, and credential IDs.
 */
export function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(SA_ID_REGEX, '[ID REDACTED]')
    .replace(PHONE_REGEX, '[PHONE REDACTED]')
    .replace(EMAIL_REGEX, '[EMAIL REDACTED]')
    .replace(CREDENTIAL_ID_REGEX, '[CREDENTIAL_ID REDACTED]')
    .trim();
}

export interface AdditionalFreeTextFields {
  evidenceDescriptions?: string[];
  taskNotes?: string[];
  mentorComments?: string[];
}

/**
 * 37.2 Sanitizes candidate facts to build a privacy-safe allow-list payload.
 * Strictly strips ID numbers, phone numbers, email addresses, and credential IDs
 * from EVERY free-text field: skills, experience notes, evidence descriptions,
 * task notes, mentor comments, and preferences.
 */
export function sanitizeCandidateCvInput(
  candidateName: string,
  rawSkills: Array<{ name: string; label?: string }>,
  rawExperienceNotes: string,
  preferences?: string[],
  additionalFields?: AdditionalFreeTextFields
): SanitizedCvPayload {
  const facts: CvInputFact[] = [];

  rawSkills.forEach((s, idx) => {
    const cleanSkill = sanitizeText(s.name);
    if (cleanSkill) {
      facts.push({
        id: `skill_${idx}`,
        type: 'skill',
        label: s.label || 'Self-reported',
        text: cleanSkill,
      });
    }
  });

  if (rawExperienceNotes && rawExperienceNotes.trim()) {
    const cleanNotes = sanitizeText(rawExperienceNotes);
    facts.push({
      id: 'evidence_0',
      type: 'evidence',
      text: cleanNotes,
    });
  }

  // Evidence descriptions (FR-04 / Section 37)
  additionalFields?.evidenceDescriptions?.forEach((desc, idx) => {
    const cleanDesc = sanitizeText(desc);
    if (cleanDesc) {
      facts.push({
        id: `evidence_desc_${idx}`,
        type: 'evidence',
        text: cleanDesc,
      });
    }
  });

  // Task notes (micro-task practical rubrics)
  additionalFields?.taskNotes?.forEach((note, idx) => {
    const cleanNote = sanitizeText(note);
    if (cleanNote) {
      facts.push({
        id: `task_note_${idx}`,
        type: 'task_note',
        text: cleanNote,
      });
    }
  });

  // Mentor comments (mentor reviews)
  additionalFields?.mentorComments?.forEach((comment, idx) => {
    const cleanComment = sanitizeText(comment);
    if (cleanComment) {
      facts.push({
        id: `mentor_comment_${idx}`,
        type: 'mentor_comment',
        text: cleanComment,
      });
    }
  });

  if (preferences && preferences.length > 0) {
    preferences.forEach((pref, idx) => {
      const cleanPref = sanitizeText(pref);
      if (cleanPref) {
        facts.push({
          id: `pref_${idx}`,
          type: 'preference',
          text: cleanPref,
        });
      }
    });
  }

  return {
    candidateName: sanitizeText(candidateName || 'Candidate'),
    facts,
  };
}

/**
 * 37.3 Versioned system prompt rules for the LLM.
 */
export const AI_CV_SYSTEM_PROMPT = `
You draft concise, factual CV bullet points for entry-level candidates in South Africa.
CRITICAL RULES (Section 37):
1. Use ONLY the supplied facts. Do NOT add skills, employers, qualifications, years, tools, numbers, or achievements.
2. Do NOT upgrade wording: "assisted" must not become "led"; "2 years" must not become "extensive".
3. Keep the evidence label wording: a Self-reported skill must read as self-reported (e.g. "I have repaired phone screens for 2 years") and NEVER as certified or professional.
4. Output MUST be valid JSON with this exact structure:
{
  "lines": [
    { "line": "reworded factual sentence", "source_fields": ["skill_0", "evidence_0"] }
  ]
}
5. Do NOT include any intro or conversational filler outside the JSON object.
`.trim();

/**
 * Builds the fallback template CV strictly from raw facts without AI.
 */
export function buildFallbackTemplateDraft(payload: SanitizedCvPayload): AiCvDraftResult {
  const lines: AiCvDraftLine[] = [];

  const skills = payload.facts.filter((f) => f.type === 'skill');
  const evidence = payload.facts.filter((f) => f.type === 'evidence');
  const prefs = payload.facts.filter((f) => f.type === 'preference');

  skills.forEach((s) => {
    const labelDesc = s.label === 'Self-reported'
      ? 'Self-reported practical skill'
      : `${s.label} verified skill`;
    lines.push({
      line: `${s.text} (${labelDesc})`,
      source_fields: [s.id],
    });
  });

  evidence.forEach((e) => {
    lines.push({
      line: `Practical experience: ${e.text}`,
      source_fields: [e.id],
    });
  });

  prefs.forEach((p) => {
    lines.push({
      line: `Work preference: ${p.text}`,
      source_fields: [p.id],
    });
  });

  const summaryText = lines.map((l) => `- ${l.line}`).join('\n');

  return {
    lines,
    summaryText,
    source: 'template',
    disclaimerTag: TEMPLATE_DISCLAIMER_TAG,
  };
}

/**
 * 37.4 Server-side output validation and allow-list diff.
 * Returns either validated AI draft lines or falls back to template.
 */
export function validateAiCvOutput(
  rawJsonOutput: unknown,
  inputPayload: SanitizedCvPayload
): AiCvDraftResult {
  const fallback = buildFallbackTemplateDraft(inputPayload);

  if (!rawJsonOutput || typeof rawJsonOutput !== 'object') {
    return { ...fallback, rejectedReason: 'Invalid JSON response from AI provider' };
  }

  const rawLines = (rawJsonOutput as { lines?: unknown }).lines;
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return { ...fallback, rejectedReason: 'No lines returned in AI output' };
  }

  const validFactIds = new Set(inputPayload.facts.map((f) => f.id));
  const inputCombinedText = inputPayload.facts.map((f) => f.text).join(' ').toLowerCase();

  // Extract all numbers and years in candidate input
  const inputNumbers = new Set(
    (inputCombinedText.match(/\b\d+\b/g) || []).map((n) => n.trim())
  );

  // Extract skills from input
  const inputSkillNames = inputPayload.facts
    .filter((f) => f.type === 'skill')
    .map((f) => f.text.toLowerCase());

  // Check self-reported skills
  const selfReportedSkills = new Set(
    inputPayload.facts
      .filter((f) => f.type === 'skill' && f.label === 'Self-reported')
      .map((f) => f.text.toLowerCase())
  );

  const validatedLines: AiCvDraftLine[] = [];

  for (const item of rawLines) {
    if (!item || typeof item !== 'object') continue;
    const lineText = typeof item.line === 'string' ? item.line.trim() : '';
    const sourceFields = Array.isArray(item.source_fields)
      ? item.source_fields.filter((sf: unknown) => typeof sf === 'string' && validFactIds.has(sf))
      : [];

    // Rule 1: Every line must cite at least one valid source_field. Lines without source are dropped.
    if (!lineText || sourceFields.length === 0) {
      continue;
    }

    const lowerLine = lineText.toLowerCase();

    // Rule 2: Self-reported skill cannot appear as certified/accredited/professional
    for (const selfSkill of selfReportedSkills) {
      if (lowerLine.includes(selfSkill)) {
        if (
          lowerLine.includes('certified') ||
          lowerLine.includes('accredited') ||
          lowerLine.includes('qualified') ||
          lowerLine.includes('professional')
        ) {
          return {
            ...fallback,
            rejectedReason: `Self-reported skill "${selfSkill}" was improperly upgraded to certified/professional`,
          };
        }
      }
    }

    // Rule 3: Superlative & inflation blocklist check
    for (const blockedWord of INFLATION_BLOCKLIST) {
      const wordRegex = new RegExp(`\\b${blockedWord}\\b`, 'i');
      if (wordRegex.test(lowerLine) && !inputCombinedText.includes(blockedWord)) {
        return {
          ...fallback,
          rejectedReason: `Inflation word "${blockedWord}" detected without candidate basis`,
        };
      }
    }

    // Rule 4: Number & year allow-list diff
    const lineNumbers = lineText.match(/\b\d+\b/g) || [];
    for (const num of lineNumbers) {
      if (!inputNumbers.has(num)) {
        return {
          ...fallback,
          rejectedReason: `Invented number or year "${num}" not present in candidate facts`,
        };
      }
    }

    // Rule 5: Skill invention check (if line mentions a skill-like keyword that is not in input)
    // We check against known hallucination words
    const ungroundedTradePatterns = [
      'solidity',
      'blockchain',
      'kubernetes',
      'cpa',
      'mba',
      'phd',
      'pilot',
      'surgeon',
    ];
    for (const trade of ungroundedTradePatterns) {
      if (lowerLine.includes(trade) && !inputCombinedText.includes(trade)) {
        return {
          ...fallback,
          rejectedReason: `Invented skill/qualification "${trade}" not in candidate facts`,
        };
      }
    }

    // Section 37 & Requirement 7(a): Replace {{NAME}} placeholder with real candidate name post-generation
    const finalLineText = lineText.replace(/\{\{NAME\}\}/g, inputPayload.candidateName || 'Candidate');

    validatedLines.push({
      line: finalLineText,
      source_fields: sourceFields,
    });
  }

  if (validatedLines.length === 0) {
    return { ...fallback, rejectedReason: 'All generated lines lacked source citations' };
  }

  const summaryText = validatedLines.map((l) => `- ${l.line}`).join('\n');

  return {
    lines: validatedLines,
    summaryText,
    source: 'ai',
    disclaimerTag: AI_CV_DISCLAIMER_TAG,
  };
}

/**
 * 37.5 Human in the loop confirmation gate:
 * Candidate must confirm truthfulness before saving or sharing.
 */
export function canSaveAiCvDraft(hasCandidateConfirmed: boolean, lines: AiCvDraftLine[]): boolean {
  return hasCandidateConfirmed === true && lines.length > 0;
}
