/** Build a prompt from only the candidate-provided facts approved for external drafting. */
export function buildCvDraftPrompt(experienceNotes: string, skills: string[]): string {
  return [
    `Skills and claims: ${skills.join(', ') || 'None provided'}`,
    'Informal experience notes (verbatim from the candidate):',
    `"""${experienceNotes || 'None provided'}"""`,
    '',
    'Write a 2-3 sentence professional summary and 3 bullet points using only the facts above.',
  ].join('\n');
}