import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('Security Rules: Employer Plan Write Lock (Section 39 / Requirement 1)', () => {
  const rules = readFileSync('firebase/firestore.rules', 'utf8');

  it('prohibits employers from updating plan, planStatus, planSince, or planExpiresAt directly', () => {
    // Assert employerProfiles update rule blocks plan fields
    assert.match(
      rules,
      /!changedKeys\(\)\.hasAny\(\['plan',\s*'planStatus',\s*'planSince',\s*'planExpiresAt'\]\)/,
      'firestore.rules must explicitly prevent employer from updating plan, planStatus, planSince, or planExpiresAt'
    );
  });

  it('restricts employerProfiles creation to free tier only without client-assigned planSince/planExpiresAt', () => {
    assert.match(
      rules,
      /!\('planSince' in incoming\(\)\)/,
      'firestore.rules must prohibit initial client-set planSince on employerProfiles'
    );
    assert.match(
      rules,
      /!\('planExpiresAt' in incoming\(\)\)/,
      'firestore.rules must prohibit initial client-set planExpiresAt on employerProfiles'
    );
  });

  it('defines secure upgradeRequests collection rules', () => {
    assert.match(
      rules,
      /match \/upgradeRequests\/\{requestId\}/,
      'firestore.rules must define rules for upgradeRequests collection'
    );
    assert.match(
      rules,
      /incoming\(\)\.status == 'pending'/,
      'Employers may only submit upgrade requests with pending status'
    );
    assert.match(
      rules,
      /!\('reviewedBy' in incoming\(\)\)/,
      'Employers cannot forge reviewedBy field'
    );
  });
});
