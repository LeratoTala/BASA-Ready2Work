import { SanitizedCvPayload } from '../src/domain/aiCvSafeguards';

/** Build a prompt from only the candidate-provided facts approved for external drafting (Section 37.2). */
export function buildCvDraftPrompt(experienceNotes: string, skills: string[]): string {
  return [
    `Skills and claims: ${skills.join(', ') || 'None provided'}`,
    'Informal experience notes (verbatim from the candidate):',
    `"""${experienceNotes || 'None provided'}"""`,
    '',
    'Write concise factual bullet points using only the facts above.',
  ].join('\n');
}

/**
 * 37.2 Structured prompt payload using only allowed fields with explicit fact IDs.
 * Never includes phone numbers, ID numbers, or credential IDs.
 */
export function buildStructuredCvDraftPrompt(payload: SanitizedCvPayload): string {
  const factLines = payload.facts.map((f) => {
    const labelPart = f.label ? ` [Label: ${f.label}]` : '';
    return `- ID: ${f.id} | Type: ${f.type}${labelPart} | Text: "${f.text}"`;
  });

  // Section 37 & Requirement 7(a): Candidate name is NEVER sent to AI providers.
  // Use a {{NAME}} placeholder that is filled in after generation.
  return [
    'Candidate: {{NAME}}',
    'Approved Candidate Facts (Allow-list):',
    ...factLines,
    '',
    'Task: Reword the candidate facts into concise, factual bullet points. Output strict JSON with cited source_fields.',
  ].join('\n');
}
