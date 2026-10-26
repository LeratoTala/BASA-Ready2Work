import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { maskEmail, maskPhone, NOT_PROVIDED } from './maskContact';

describe('maskContact', () => {
  it('masks all but the last two phone digits', () => {
    assert.equal(maskPhone('+27 82 459 1102'), '+•• •• ••• ••02');
  });
  it('masks the email local part', () => {
    assert.equal(maskEmail('thabo@kasi.co.za'), 't••••@kasi.co.za');
  });
  it('handles missing values', () => {
    assert.equal(maskPhone(undefined), NOT_PROVIDED);
    assert.equal(maskEmail(''), NOT_PROVIDED);
  });
});
