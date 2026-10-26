import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRegistrationNumberFormat,
  validateBusinessVerification,
} from './businessVerification';
import { BusinessVerificationDetails } from './types';

test('Business Verification & CIPC Anti-Fraud Inspection', async (t) => {
  await t.test('accepts standard South African CIPC (Pty) Ltd format (YYYY/NNNNNN/07)', () => {
    const validCipc = validateRegistrationNumberFormat('cipc_pty_ltd', '2022/481920/07');
    assert.equal(validCipc.isValidFormat, true);

    const validRaw = validateRegistrationNumberFormat('cipc_pty_ltd', '202248192007');
    assert.equal(validRaw.isValidFormat, true);
  });

  await t.test('rejects malformed CIPC registration numbers', () => {
    const invalid = validateRegistrationNumberFormat('cipc_pty_ltd', 'ABC-1234');
    assert.equal(invalid.isValidFormat, false);
    assert.match(invalid.hint || '', /YYYY\/NNNNNN\/07/);
  });

  await t.test('accepts Close Corporation format ending with /23', () => {
    const validCc = validateRegistrationNumberFormat('cipc_close_corp', 'CK2004/012345/23');
    assert.equal(validCc.isValidFormat, true);
  });

  await t.test('validates SARS Sole Proprietor 10-digit tax numbers', () => {
    const validTax = validateRegistrationNumberFormat('sars_sole_proprietor', '9481920182');
    assert.equal(validTax.isValidFormat, true);

    const invalidTax = validateRegistrationNumberFormat('sars_sole_proprietor', '12345');
    assert.equal(invalidTax.isValidFormat, false);
    assert.match(invalidTax.hint || '', /10 digits/);
  });

  await t.test('accepts valid municipal trading permits (Spaza / local trade)', () => {
    const validPermit = validateRegistrationNumberFormat('municipal_trade_permit', 'JHB-SWT-TRD-2024-8842');
    assert.equal(validPermit.isValidFormat, true);

    const tooShort = validateRegistrationNumberFormat('municipal_trade_permit', '12');
    assert.equal(tooShort.isValidFormat, false);
  });

  await t.test('validates complete business verification submission and catches missing fields', () => {
    const incomplete: Partial<BusinessVerificationDetails> = {
      registrationType: 'cipc_pty_ltd',
      legalRegisteredName: 'Zo', // too short
      registrationNumber: '',
    };
    const result = validateBusinessVerification(incomplete);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.length >= 3);
    assert.ok(result.errors.some((e) => e.includes('at least 3 characters')));
    assert.ok(result.errors.some((e) => e.includes('operating business address')));
  });

  await t.test('passes valid full business verification documents submission', () => {
    const complete: BusinessVerificationDetails = {
      registrationType: 'cipc_pty_ltd',
      legalRegisteredName: 'Zola Artisan Coffee & Roastery (Pty) Ltd',
      registrationNumber: '2022/481920/07',
      taxNumber: '9481920182',
      physicalAddress: '142 Fox Street, Marshalltown, Johannesburg CBD, 2001',
      officialPhone: '+27 11 832 4410',
      documentFileName: 'CIPC_CoR14.3_Registration_Certificate.pdf',
    };
    const result = validateBusinessVerification(complete);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
  });
});
