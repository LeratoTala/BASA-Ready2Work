import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { aiEnabled, serverConfig } from '../config';
import { verifyIdToken } from '../middleware/verifyIdToken';
import { buildStructuredCvDraftPrompt } from '../aiPrompt';
import {
  sanitizeCandidateCvInput,
  validateAiCvOutput,
  buildFallbackTemplateDraft,
  AI_CV_SYSTEM_PROMPT,
} from '../../src/domain/aiCvSafeguards';

const ai = aiEnabled
  ? new GoogleGenAI({ apiKey: serverConfig.gemini.apiKey })
  : null;

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const cvDraftRouter = Router();

/**
 * POST /api/cv-draft  (FR-14, Section 37 P1 AI CV Safeguards)
 * Drafts editable summary text strictly from user-supplied facts.
 * Safeguards:
 *  - Sanitized allow-list (no phone, no ID, no credential IDs).
 *  - System prompt enforcing zero-hallucination and JSON citations.
 *  - Server-side allow-list diff dropping ungrounded lines/invented numbers.
 *  - Fallback template when AI is disabled, times out, or fails diff check.
 *  - Privacy: logs only that a request occurred (no personal content).
 */
cvDraftRouter.post('/cv-draft', verifyIdToken, async (req, res) => {
  const { maxFieldChars, maxSkills } = serverConfig.limits;
  const body = (req.body ?? {}) as Record<string, unknown>;

  const candidateName = text(body.candidateName, 100);
  const experienceNotes = text(body.experienceNotes, maxFieldChars);
  const evidenceDescriptions = Array.isArray(body.evidenceDescriptions)
    ? body.evidenceDescriptions.map((d) => text(d, maxFieldChars)).filter(Boolean)
    : [];
  const taskNotes = Array.isArray(body.taskNotes)
    ? body.taskNotes.map((t) => text(t, maxFieldChars)).filter(Boolean)
    : [];
  const mentorComments = Array.isArray(body.mentorComments)
    ? body.mentorComments.map((m) => text(m, maxFieldChars)).filter(Boolean)
    : [];
  
  // Format raw skills with optional verification labels
  const rawSkillsInput = Array.isArray(body.skills) ? body.skills.slice(0, maxSkills) : [];
  const rawSkills: Array<{ name: string; label?: string }> = rawSkillsInput.map((s) => {
    if (typeof s === 'string') {
      // Check if format is "Skill Name (Label)"
      const match = s.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        return { name: match[1].trim(), label: match[2].trim() };
      }
      return { name: s.trim() };
    }
    if (typeof s === 'object' && s !== null) {
      const obj = s as { name?: string; label?: string };
      return { name: text(obj.name, 100), label: text(obj.label, 50) };
    }
    return { name: '' };
  }).filter((s) => Boolean(s.name));

  if (!experienceNotes && rawSkills.length === 0) {
    return res.status(400).json({
      error: 'Please provide at least one skill claim or some experience notes to draft a summary.',
    });
  }

  // 37.2 Sanitized allow-list input across all free-text fields
  const sanitized = sanitizeCandidateCvInput(
    candidateName,
    rawSkills,
    experienceNotes,
    undefined,
    { evidenceDescriptions, taskNotes, mentorComments }
  );
  const fallback = buildFallbackTemplateDraft(sanitized);

  // Privacy 37.8: Log only that a request occurred, no content
  const callerUid = (req as typeof req & { uid?: string }).uid || 'anonymous';
  console.log(`[AI CV] Draft requested by uid=${callerUid} (${rawSkills.length} skills)`);

  if (!ai) {
    return res.json({
      draft: fallback.summaryText,
      lines: fallback.lines,
      source: 'template',
      disclaimerTag: fallback.disclaimerTag,
    });
  }

  const prompt = buildStructuredCvDraftPrompt(sanitized);

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: serverConfig.gemini.model,
        contents: prompt,
        config: {
          temperature: 0.1, // Near deterministic
          systemInstruction: AI_CV_SYSTEM_PROMPT,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), serverConfig.gemini.timeoutMs)
      ),
    ]);

    const rawResponseText = response.text?.trim() || '';
    
    // Parse JSON from code fence or raw text
    let jsonParsed: unknown = null;
    try {
      const cleanedJson = rawResponseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
      jsonParsed = JSON.parse(cleanedJson);
    } catch {
      console.warn('[AI CV] Failed to parse model output as JSON. Falling back to template.');
    }

    // 37.4 Output checks on server before returning
    const validatedResult = validateAiCvOutput(jsonParsed, sanitized);

    return res.json({
      draft: validatedResult.summaryText,
      lines: validatedResult.lines,
      source: validatedResult.source,
      disclaimerTag: validatedResult.disclaimerTag,
      rejectedReason: validatedResult.rejectedReason,
    });
  } catch (err) {
    console.warn('[AI CV] AI generation failed or timed out; returning fallback template.');
    return res.json({
      draft: fallback.summaryText,
      lines: fallback.lines,
      source: 'template',
      disclaimerTag: fallback.disclaimerTag,
    });
  }
});
