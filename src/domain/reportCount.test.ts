import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reportCountDelta } from './reportCount';

describe('moderation report count', () => {
  it('counts newly submitted pending reports', () => {
    assert.equal(reportCountDelta(null, 'pending'), 1);
  });

  it('removes reports when they are resolved or dismissed', () => {
    assert.equal(reportCountDelta('pending', 'resolved'), -1);
    assert.equal(reportCountDelta('pending', 'dismissed'), -1);
  });

  it('does not count changes that remain outside the pending state', () => {
    assert.equal(reportCountDelta('resolved', 'dismissed'), 0);
    assert.equal(reportCountDelta('pending', 'pending'), 0);
  });

  it('restores the count when a report is reopened', () => {
    assert.equal(reportCountDelta('dismissed', 'pending'), 1);
  });
});
