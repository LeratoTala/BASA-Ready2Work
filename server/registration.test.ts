import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRegistrationData } from './registration';

describe('trusted account registration', () => {
  it('creates a private candidate profile from a verified identity', () => {
    const result = buildRegistrationData('candidate-1', 'candidate@example.invalid', {
      role: 'candidate', displayName: 'Fictional Candidate', email: 'attacker@example.invalid',
      minimumAgeConfirmed: true,
    }, '2026-10-23T00:00:00.000Z');

    assert.equal(result.user.role, 'candidate');
    assert.equal(result.user.email, 'candidate@example.invalid');
    assert.equal(result.candidateProfile?.popiaVisibility, 'private');
    assert.equal(result.candidatePrivateProfile?.contactEmail, 'candidate@example.invalid');
    assert.equal(result.candidateProfile?.email, undefined);
    assert.equal(result.user.minimumAgeConfirmed, true);
  });

  it('rejects privileged or unsupported roles', () => {
    assert.throws(() => buildRegistrationData('uid-1', 'u@example.invalid', {
      role: 'admin', displayName: 'Fictional User',
      minimumAgeConfirmed: true,
    }, '2026-10-23T00:00:00.000Z'));
  });

  it('requires a minimum-age confirmation without collecting a birth date', () => {
    assert.throws(() => buildRegistrationData('uid-1', 'u@example.invalid', {
      role: 'candidate', displayName: 'Fictional User',
    }, '2026-10-23T00:00:00.000Z'), /minimum age/);
  });
});