import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEvidenceFile } from './evidenceValidation';

describe('candidate evidence upload validation', () => {
  it('accepts PDF documents and standard images under 5 MB', () => {
    assert.doesNotThrow(() => validateEvidenceFile({ size: 1024 * 500, type: 'application/pdf' }));
    assert.doesNotThrow(() => validateEvidenceFile({ size: 1024 * 500, type: 'image/jpeg' }));
    assert.doesNotThrow(() => validateEvidenceFile({ size: 1024 * 500, type: 'image/png' }));
    assert.doesNotThrow(() => validateEvidenceFile({ size: 1024 * 500, type: 'image/webp' }));
  });

  it('rejects unsupported file types before initializing Firebase', () => {
    assert.throws(
      () => validateEvidenceFile({ size: 12, type: 'text/plain' }),
      /PDF document or a JPEG, PNG or WebP/
    );
    assert.throws(
      () => validateEvidenceFile({ size: 12, type: 'application/zip' }),
      /PDF document or a JPEG, PNG or WebP/
    );
  });

  it('rejects files larger than 5 MB before initializing Firebase', () => {
    assert.throws(
      () => validateEvidenceFile({ size: 5 * 1024 * 1024 + 1, type: 'application/pdf' }),
      /smaller than 5 MB/
    );
    assert.throws(
      () => validateEvidenceFile({ size: 5 * 1024 * 1024 + 1, type: 'image/png' }),
      /smaller than 5 MB/
    );
  });
});
