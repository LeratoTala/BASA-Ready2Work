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
import { doc, setDoc, updateDoc, getDoc, writeBatch } from 'firebase/firestore';

let env: RulesTestEnvironment;

function applicationData(jobId: string) {
  return {
    id: `${jobId}_cand1`,
    jobId,
    jobTitle: 'Garden helper',
    employerId: 'emp1',
    employerName: 'Fictional Employer',
    candidateId: 'cand1',
    candidateName: 'Fictional Candidate',
    candidateHeadline: 'Community gardener',
    candidateLocation: 'Soweto',
    candidateAvailability: 'immediate',
    status: 'submitted',
    matchScore: 50,
    matchBreakdown: {
      totalScore: 50,
      skillAlignment: 50,
      evidenceStrength: 50,
      availabilityFit: 50,
      locationFit: 50,
      matchedSkills: [],
      missingSkills: [],
      reasons: [],
      improvementTips: [],
    },
    submittedAt: '2026-10-23T00:00:00.000Z',
    updatedAt: '2026-10-23T00:00:00.000Z',
  };
}

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
    await setDoc(doc(db, 'candidateProfiles/cand1'), {
      uid: 'cand1', fullName: 'Fictional Candidate', headline: 'Community gardener',
      locationArea: 'Soweto', availability: 'immediate', popiaVisibility: 'employers_only',
    });
    await setDoc(doc(db, 'jobs/open1'), {
      employerId: 'emp1', employerName: 'Fictional Employer', title: 'Garden helper', status: 'open',
    });
    await setDoc(doc(db, 'jobs/closed1'), {
      employerId: 'emp1', employerName: 'Fictional Employer', title: 'Garden helper', status: 'closed',
    });
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
    await assertFails(setDoc(doc(db, 'applications/open1_cand1'), applicationData('open1')));
  });

  it('T-07: cannot apply to a closed job', async () => {
    const db = env.authenticatedContext('cand1').firestore();
    await assertFails(setDoc(doc(db, 'applications/closed1_cand1'), applicationData('closed1')));
  });

  it('candidate cannot forge profile fields or match scores in an application', async () => {
    const db = env.authenticatedContext('cand1').firestore();
    const forgedProfile = { ...applicationData('open1'), candidateName: 'Someone Else' };
    const forgedScore = { ...applicationData('open1'), matchScore: 100, matchBreakdown: {
      ...applicationData('open1').matchBreakdown, totalScore: 100,
    } };
    await assertFails(setDoc(doc(db, 'applications/open1_cand1'), forgedProfile));
    await assertFails(setDoc(doc(db, 'applications/open1_cand1'), forgedScore));
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

  it('selected applications cannot be changed to not_selected', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'applications/open1_cand1'), { status: 'selected' });
    });
    const db = env.authenticatedContext('emp1').firestore();
    await assertFails(updateDoc(doc(db, 'applications/open1_cand1'), { status: 'not_selected' }));
  });

  it('employer cannot mark their own job as verified', async () => {
    const db = env.authenticatedContext('emp1').firestore();
    const base = { employerId: 'emp1', status: 'open', reportCount: 0, compensationCurrency: 'ZAR', compensationUnit: 'daily', compensationAmount: 100 };
    await assertFails(setDoc(doc(db, 'jobs/j-fake'), { ...base, employerVerified: true }));
    await assertSucceeds(setDoc(doc(db, 'jobs/j-ok'), { ...base, employerVerified: false }));
  });

  it('clients cannot assign roles during registration', async () => {
    const db = env.authenticatedContext('fresh').firestore();
    await assertFails(setDoc(doc(db, 'users/fresh'), { uid: 'fresh', role: 'candidate', accountStatus: 'active' }));
    await assertFails(setDoc(doc(db, 'users/fresh-admin'), { uid: 'fresh-admin', role: 'admin', accountStatus: 'active' }));
  });

  it('employer-only profiles and claims require an application access grant', async () => {
    const db = env.authenticatedContext('emp1').firestore();
    await assertFails(getDoc(doc(db, 'candidateProfiles/cand1')));
    await assertFails(getDoc(doc(db, 'skillClaims/c1')));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'employerCandidateAccess/emp1/candidates/cand1'), {
        candidateId: 'cand1', employerId: 'emp1', applicationIds: ['open1_cand1'],
        latestApplicationId: 'open1_cand1', updatedAt: '2026-10-23T00:00:00.000Z',
      });
    });
    await assertSucceeds(getDoc(doc(db, 'skillClaims/c1')));
    await assertSucceeds(getDoc(doc(db, 'candidateProfiles/cand1')));
  });

  it('public-link profiles are not discoverable to employers before they receive an application', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'candidateProfiles/cand1'), { uid: 'cand1', popiaVisibility: 'public_link' });
    });
    const db = env.authenticatedContext('emp2').firestore();
    await assertFails(getDoc(doc(db, 'candidateProfiles/cand1')));
    await assertFails(getDoc(doc(db, 'skillClaims/c1')));
  });

  it('clients cannot create applications or grant employer access directly', async () => {
    const db = env.authenticatedContext('cand1').firestore();
    await assertFails(setDoc(doc(db, 'applications/open1_cand1'), applicationData('open1')));
    await assertFails(setDoc(doc(db, 'employerCandidateAccess/emp1/candidates/cand1'), {
      candidateId: 'cand1', employerId: 'emp1', applicationIds: ['open1_cand1'],
      latestApplicationId: 'open1_cand1', updatedAt: '2026-10-23T00:00:00.000Z',
    }));
  });

  it('legacy shared profiles containing contact details remain unreadable to employers', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'candidateProfiles/cand1'), {
        uid: 'cand1', popiaVisibility: 'employers_only', phone: '+27123456789',
      });
      await setDoc(doc(ctx.firestore(), 'employerCandidateAccess/emp1/candidates/cand1'), {
        candidateId: 'cand1', employerId: 'emp1', applicationIds: ['open1_cand1'],
        latestApplicationId: 'open1_cand1', updatedAt: '2026-10-23T00:00:00.000Z',
      });
    });
    const db = env.authenticatedContext('emp1').firestore();
    await assertFails(getDoc(doc(db, 'candidateProfiles/cand1')));
  });

  it('candidate cannot write contact fields into the shared profile', async () => {
    const db = env.authenticatedContext('cand1').firestore();
    await assertFails(updateDoc(doc(db, 'candidateProfiles/cand1'), { phone: '+27123456789' }));
    await assertFails(updateDoc(doc(db, 'candidateProfiles/cand1'), { contactEmail: 'candidate@example.invalid' }));
  });

  it('shortlisting grants contact access in the same valid status transition', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'applications/open1_cand1'), {
        jobId: 'open1', jobTitle: 'Garden helper', candidateId: 'cand1', candidateName: 'Fictional Candidate',
        employerId: 'emp1', employerName: 'Fictional Employer', status: 'under_review',
      });
      await setDoc(doc(db, 'employerCandidateAccess/emp1/candidates/cand1'), {
        candidateId: 'cand1', employerId: 'emp1', applicationIds: ['open1_cand1'],
        latestApplicationId: 'open1_cand1', updatedAt: '2026-10-23T00:00:00.000Z',
      });
      await setDoc(doc(db, 'candidatePrivateProfiles/cand1'), {
        uid: 'cand1', contactEmail: 'candidate@example.invalid', phone: '+27123456789',
      });
    });

    const db = env.authenticatedContext('emp1').firestore();
    await assertFails(getDoc(doc(db, 'candidatePrivateProfiles/cand1')));
    const batch = writeBatch(db);
    batch.update(doc(db, 'applications/open1_cand1'), { status: 'shortlisted', updatedAt: '2026-10-23T00:00:00.000Z' });
    batch.set(doc(db, 'employerCandidateContactAccess/emp1/candidates/cand1'), {
      candidateId: 'cand1', employerId: 'emp1', applicationId: 'open1_cand1', grantedAt: '2026-10-23T00:00:00.000Z',
    });
    await assertSucceeds(batch.commit());
    await assertSucceeds(getDoc(doc(db, 'candidatePrivateProfiles/cand1')));
    await updateDoc(doc(db, 'applications/open1_cand1'), { status: 'not_selected', updatedAt: '2026-10-23T00:01:00.000Z' });
    await assertFails(getDoc(doc(db, 'candidatePrivateProfiles/cand1')));
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

  it('employer can create a work record only with the selected-to-completed application update', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'jobs/open1'), { employerId: 'emp1', status: 'open', compensationAmount: 100 });
      await setDoc(doc(ctx.firestore(), 'applications/open1_cand1'), {
        jobId: 'open1', jobTitle: 'Garden helper', candidateId: 'cand1', candidateName: 'Fictional Candidate',
        employerId: 'emp1', employerName: 'Fictional Employer', status: 'selected',
      });
    });

    const db = env.authenticatedContext('emp1').firestore();
    const batch = writeBatch(db);
    batch.update(doc(db, 'applications/open1_cand1'), { status: 'completed', updatedAt: '2026-10-23T00:00:00.000Z' });
    batch.set(doc(db, 'workRecords/work1'), {
      id: 'work1', applicationId: 'open1_cand1', jobId: 'open1', jobTitle: 'Garden helper',
      candidateId: 'cand1', candidateName: 'Fictional Candidate', employerId: 'emp1', employerName: 'Fictional Employer',
      completionStatus: 'completed', employerConfirmed: true, payoutConfirmed: false,
      amountZAR: 100, feedback: '', confirmedAt: '2026-10-23T00:00:00.000Z',
    });
    await assertSucceeds(batch.commit());
  });

  it('employer cannot create an unrelated work record or rewrite an existing one', async () => {
    const db = env.authenticatedContext('emp1').firestore();
    await assertFails(setDoc(doc(db, 'workRecords/unrelated'), {
      id: 'unrelated', applicationId: 'missing', jobId: 'open1', candidateId: 'cand1', employerId: 'emp1',
    }));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'workRecords/locked'), { employerId: 'emp1', candidateId: 'cand1' });
    });
    await assertFails(updateDoc(doc(db, 'workRecords/locked'), { payoutConfirmed: true }));
  });
});
