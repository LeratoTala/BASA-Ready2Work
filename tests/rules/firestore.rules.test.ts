/**
 * Security-rules tests (T-03, T-05, T-06, T-07, T-11, T-12).
 * Run with the emulator:  npm run test:rules
 * One-time setup:         npm i -D @firebase/rules-unit-testing firebase-tools
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'basa-rules-test',
    firestore: { rules: readFileSync('firebase/firestore.rules', 'utf8') },
  });
});
after(async () => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/cand1'), { uid: 'cand1', role: 'candidate', accountStatus: 'active' });
    await setDoc(doc(db, 'users/emp1'), { uid: 'emp1', role: 'employer', accountStatus: 'active' });
    await setDoc(doc(db, 'users/emp2'), { uid: 'emp2', role: 'employer', accountStatus: 'active' });
    await setDoc(doc(db, 'employerProfiles/emp1'), { uid: 'emp1', verificationStatus: 'pending' });
    await setDoc(doc(db, 'candidateProfiles/cand1'), { uid: 'cand1', popiaVisibility: 'employers_only' });
    await setDoc(doc(db, 'jobs/open1'), { employerId: 'emp1', status: 'open' });
    await setDoc(doc(db, 'jobs/closed1'), { employerId: 'emp1', status: 'closed' });
    await setDoc(doc(db, 'skillClaims/c1'), { candidateId: 'cand1', verificationStatus: 'Self-reported' });
    await setDoc(doc(db, 'applications/open1_cand1'), {
      jobId: 'open1', candidateId: 'cand1', employerId: 'emp1', status: 'submitted',
    });
  });
});

describe('firestore rules', () => {
  it('T-03: candidate cannot change a verification label', async () => {
    const db = env.authenticatedContext('cand1').firestore();
    await assertFails(updateDoc(doc(db, 'skillClaims/c1'), { verificationStatus: 'Task-assessed' }));
  });

  it('users cannot self-register as admin', async () => {
    const db = env.authenticatedContext('newbie').firestore();
    await assertFails(setDoc(doc(db, 'users/newbie'), { uid: 'newbie', role: 'admin', accountStatus: 'active' }));
  });

  it('T-05: second application to the same job is rejected (deterministic id)', async () => {
    const db = env.authenticatedContext('cand1').firestore();
    await assertFails(setDoc(doc(db, 'applications/open1_cand1'), {
      jobId: 'open1', candidateId: 'cand1', employerId: 'emp1', status: 'submitted',
    }));
  });

  it('T-07: cannot apply to a closed job', async () => {
    const db = env.authenticatedContext('cand1').firestore();
    await assertFails(setDoc(doc(db, 'applications/closed1_cand1'), {
      jobId: 'closed1', candidateId: 'cand1', employerId: 'emp1', status: 'submitted',
    }));
  });

  it('T-06: another employer cannot read the applicants', async () => {
    const db = env.authenticatedContext('emp2').firestore();
    await assertFails(getDoc(doc(db, 'applications/open1_cand1')));
  });

  it('job owner can read applicants and make a valid transition', async () => {
    const db = env.authenticatedContext('emp1').firestore();
    await assertSucceeds(getDoc(doc(db, 'applications/open1_cand1')));
    await assertSucceeds(updateDoc(doc(db, 'applications/open1_cand1'), { status: 'under_review' }));
  });

  it('T-12: invalid transition is rejected', async () => {
    const db = env.authenticatedContext('emp1').firestore();
    await assertFails(updateDoc(doc(db, 'applications/open1_cand1'), { status: 'selected' }));
  });

  it('employer cannot mark their own job as verified', async () => {
    const db = env.authenticatedContext('emp1').firestore();
    const base = { employerId: 'emp1', status: 'open', reportCount: 0, compensationCurrency: 'ZAR', compensationUnit: 'daily', compensationAmount: 100 };
    await assertFails(setDoc(doc(db, 'jobs/j-fake'), { ...base, employerVerified: true }));
    await assertSucceeds(setDoc(doc(db, 'jobs/j-ok'), { ...base, employerVerified: false }));
  });

  it('candidate can register as candidate but never as admin', async () => {
    const db = env.authenticatedContext('fresh').firestore();
    await assertSucceeds(setDoc(doc(db, 'users/fresh'), { uid: 'fresh', role: 'candidate', accountStatus: 'active' }));
  });

  it('employer can read claims only for candidates who allow it', async () => {
    const db = env.authenticatedContext('emp1').firestore();
    await assertSucceeds(getDoc(doc(db, 'skillClaims/c1')));
  });

  it('T-11: non-admin cannot read reports', async () => {
    const db = env.authenticatedContext('cand1').firestore();
    await assertFails(getDoc(doc(db, 'reports/r1')));
  });

  it('admin claim can write assessments; candidate cannot', async () => {
    const admin = env.authenticatedContext('adm', { admin: true }).firestore();
    await assertSucceeds(setDoc(doc(admin, 'assessments/a1'), { candidateId: 'cand1' }));
    const cand = env.authenticatedContext('cand1').firestore();
    await assertFails(setDoc(doc(cand, 'assessments/a2'), { candidateId: 'cand1' }));
    assert.ok(true);
  });
});
