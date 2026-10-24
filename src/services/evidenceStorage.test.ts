import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateEvidenceFile } from './evidenceValidation';

describe('candidate evidence upload validation', () => {
  it('rejects unsupported file types before initializing Firebase', async () => {
    assert.throws(() => validateEvidenceFile({ size: 12, type: 'text/plain' }), /JPEG, PNG or WebP/);
  });

  it('rejects files larger than 5 MB before initializing Firebase', async () => {
    assert.throws(() => validateEvidenceFile({ size: 5 * 1024 * 1024 + 1, type: 'image/png' }), /smaller than 5 MB/);
  });
});
