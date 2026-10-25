const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EVIDENCE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function validateEvidenceFile(file: Pick<File, 'size' | 'type'>): void {
  if (file.size > MAX_EVIDENCE_BYTES) throw new Error('Choose a document or image smaller than 5 MB.');
  if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
    throw new Error('Choose a PDF document or a JPEG, PNG or WebP image.');
  }
}
