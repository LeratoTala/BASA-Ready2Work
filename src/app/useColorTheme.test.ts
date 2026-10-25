import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeColorTheme } from './useColorTheme';

describe('color theme preference', () => {
  it('accepts dark mode and falls back safely to light mode', () => {
    assert.equal(normalizeColorTheme('dark'), 'dark');
    assert.equal(normalizeColorTheme('light'), 'light');
    assert.equal(normalizeColorTheme('unexpected'), 'light');
    assert.equal(normalizeColorTheme(null), 'light');
  });
});
