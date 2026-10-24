import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

const BUCKET = 'gs://basa-storage-test.appspot.com';
let env: RulesTestEnvironment;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'basa-storage-test',
    storage: { rules: readFileSync('firebase/storage.rules', 'utf8') },
  });
});

after(async () => env.cleanup());
beforeEach(async () => env.clearStorage());

describe('Firebase Storage rules', () => {
  it('candidate can upload and read their own image evidence', async () => {
    const storage = env.authenticatedContext('cand1').storage(BUCKET);
    const evidence = ref(storage, 'candidate-evidence/cand1/claim1/evidence');
    await assertSucceeds(uploadBytes(evidence, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' }));
    await assertSucceeds(getBytes(evidence));
  });

  it('another candidate cannot read or overwrite evidence', async () => {
    const owner = env.authenticatedContext('cand1').storage(BUCKET);
    const evidence = ref(owner, 'candidate-evidence/cand1/claim1/evidence');
    await assertSucceeds(uploadBytes(evidence, new Uint8Array([1, 2, 3]), { contentType: 'image/png' }));

    const other = env.authenticatedContext('cand2').storage(BUCKET);
    const otherReference = ref(other, 'candidate-evidence/cand1/claim1/evidence');
    await assertFails(getBytes(otherReference));
    await assertFails(uploadBytes(otherReference, new Uint8Array([4, 5, 6]), { contentType: 'image/png' }));
  });

  it('rejects unsupported content types and files over 5 MB', async () => {
    const storage = env.authenticatedContext('cand1').storage(BUCKET);
    const unsupported = ref(storage, 'candidate-evidence/cand1/claim1/evidence');
    await assertFails(uploadBytes(unsupported, new Uint8Array([1, 2, 3]), { contentType: 'application/pdf' }));

    const oversized = ref(storage, 'candidate-evidence/cand1/claim2/evidence');
    await assertFails(uploadBytes(oversized, new Uint8Array(5 * 1024 * 1024 + 1), { contentType: 'image/jpeg' }));
  });

  it('admin can review evidence files', async () => {
    const owner = env.authenticatedContext('cand1').storage(BUCKET);
    const evidence = ref(owner, 'candidate-evidence/cand1/claim1/evidence');
    await assertSucceeds(uploadBytes(evidence, new Uint8Array([1, 2, 3]), { contentType: 'image/webp' }));

    const admin = env.authenticatedContext('adm', { admin: true }).storage(BUCKET);
    await assertSucceeds(getBytes(ref(admin, 'candidate-evidence/cand1/claim1/evidence')));
  });
});