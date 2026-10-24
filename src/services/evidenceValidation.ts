const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateEvidenceFile(file: Pick<File, 'size' | 'type'>): void {
  if (file.size > MAX_EVIDENCE_BYTES) throw new Error('Choose an image smaller than 5 MB.');
  if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) throw new Error('Choose a JPEG, PNG or WebP image.');
}