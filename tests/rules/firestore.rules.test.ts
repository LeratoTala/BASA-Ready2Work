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
    await assertFails(updateDoc(doc(db, 'jobs/j-ok'), { employerVerified: true }));
    await assertFails(updateDoc(doc(db, 'jobs/j-ok'), { compensationAmount: -50 }));
    await assertSucceeds(updateDoc(doc(db, 'jobs/j-ok'), { status: 'closed' }));
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

  it('candidate can create and read only their deletion request', async () => {
    const candidate = env.authenticatedContext('cand1').firestore();
    await assertSucceeds(setDoc(doc(candidate, 'privacyDeletionRequests/cand1'), {
      uid: 'cand1', status: 'pending', requestedAt: '2026-10-24T00:00:00.000Z',
      updatedAt: '2026-10-24T00:00:00.000Z',
    }));
    await assertSucceeds(getDoc(doc(candidate, 'privacyDeletionRequests/cand1')));
    const otherCandidate = env.authenticatedContext('cand2').firestore();
    await assertFails(getDoc(doc(otherCandidate, 'privacyDeletionRequests/cand1')));
  });

  it('only admin can review a deletion request and candidates cannot complete or alter it', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'privacyDeletionRequests/cand1'), {
        uid: 'cand1', status: 'pending', requestedAt: '2026-10-24T00:00:00.000Z',
        updatedAt: '2026-10-24T00:00:00.000Z',
      });
    });
    const candidate = env.authenticatedContext('cand1').firestore();
    await assertFails(updateDoc(doc(candidate, 'privacyDeletionRequests/cand1'), { status: 'declined' }));
    const admin = env.authenticatedContext('adm', { admin: true }).firestore();
    await assertSucceeds(updateDoc(doc(admin, 'privacyDeletionRequests/cand1'), {
      status: 'in_review', updatedAt: '2026-10-24T00:01:00.000Z', reviewedBy: 'adm',
    }));
    await assertFails(updateDoc(doc(admin, 'privacyDeletionRequests/cand1'), {
      status: 'completed', updatedAt: '2026-10-24T00:02:00.000Z', reviewedBy: 'adm',
    }));
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

  it('T-14 a user cannot read another user notifications; owner can read and update readAt', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'notifications/notif_cand1_1'), {
        id: 'notif_cand1_1',
        userId: 'cand1',
        type: 'application_status',
        title: 'You are Shortlisted!',
        body: 'Great news! You have been shortlisted.',
        createdAt: '2026-10-24T12:00:00.000Z',
        readAt: null,
      });
    });

    const cand1 = env.authenticatedContext('cand1').firestore();
    const otherUser = env.authenticatedContext('other_user').firestore();

    // Owner can read their own notification
    await assertSucceeds(getDoc(doc(cand1, 'notifications/notif_cand1_1')));

    // Other user cannot read cand1's notification (T-14)
    await assertFails(getDoc(doc(otherUser, 'notifications/notif_cand1_1')));

    // Client cannot create a notification directly
    await assertFails(setDoc(doc(cand1, 'notifications/forged'), {
      userId: 'cand1',
      title: 'Forged',
    }));

    // Owner can mark as read (update readAt)
    await assertSucceeds(updateDoc(doc(cand1, 'notifications/notif_cand1_1'), {
      readAt: '2026-10-24T12:05:00.000Z',
    }));

    // Other user cannot update cand1's notification
    await assertFails(updateDoc(doc(otherUser, 'notifications/notif_cand1_1'), {
      readAt: '2026-10-24T12:05:00.000Z',
    }));
  });

  it('R2 / FR-16 signed-in users can read areas reference; only admin can write', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'areas/area_soweto'), {
        id: 'area_soweto',
        name: 'Soweto',
        province: 'Gauteng',
        lat: -26.2678,
        lng: 27.8585,
      });
    });

    const cand1 = env.authenticatedContext('cand1').firestore();
    const unauthed = env.unauthenticatedContext().firestore();
    const admin = env.authenticatedContext('admin_user', { admin: true }).firestore();

    // Signed-in user can read area centroid
    await assertSucceeds(getDoc(doc(cand1, 'areas/area_soweto')));

    // Unauthenticated user cannot read areas
    await assertFails(getDoc(doc(unauthed, 'areas/area_soweto')));

    // Candidate cannot write to areas collection
    await assertFails(setDoc(doc(cand1, 'areas/area_forged'), {
      id: 'area_forged',
      name: 'Forged',
    }));

    // Admin can write area reference data
    await assertSucceeds(setDoc(doc(admin, 'areas/area_midrand'), {
      id: 'area_midrand',
      name: 'Midrand',
      province: 'Gauteng',
      lat: -25.9992,
      lng: 28.1263,
    }));
  });

  it('R3 / FR-19 peer endorsements and mentor reviews rules enforcement (T-19)', async () => {
    const cand1 = env.authenticatedContext('cand1').firestore();
    const otherUser = env.authenticatedContext('other_user').firestore();
    const admin = env.authenticatedContext('admin_user', { admin: true }).firestore();

    // 1. Candidate can create pending endorsement request for their own claim
    await assertSucceeds(setDoc(doc(cand1, 'endorsements/endorse_1'), {
      id: 'endorse_1',
      claimId: 'claim_1',
      candidateId: 'cand1',
      candidateName: 'Fictional Candidate',
      skillName: 'Solar PV Mounting',
      endorserName: 'Sipho Zulu',
      endorserRole: 'Lead Electrician',
      relationship: 'Former Contractor',
      comments: 'Worked with me on 10 residential installs in Soweto.',
      status: 'pending',
      createdAt: '2026-10-24T12:00:00.000Z',
    }));

    // 2. Candidate cannot forge an approved status directly
    await assertFails(setDoc(doc(cand1, 'endorsements/endorse_forged'), {
      id: 'endorse_forged',
      claimId: 'claim_1',
      candidateId: 'cand1',
      status: 'approved',
    }));

    // 3. Other user cannot create endorsement in cand1 name
    await assertFails(setDoc(doc(otherUser, 'endorsements/endorse_2'), {
      id: 'endorse_2',
      claimId: 'claim_1',
      candidateId: 'cand1',
      status: 'pending',
    }));

    // 4. Non-admin cannot write mentor reviews
    await assertFails(setDoc(doc(cand1, 'mentorReviews/mentor_1'), {
      id: 'mentor_1',
      claimId: 'claim_1',
      candidateId: 'cand1',
      decision: 'approved',
    }));

    // 5. Admin can record mentor review
    await assertSucceeds(setDoc(doc(admin, 'mentorReviews/mentor_1'), {
      id: 'mentor_1',
      claimId: 'claim_1',
      candidateId: 'cand1',
      candidateName: 'Fictional Candidate',
      skillName: 'Solar PV Mounting',
      mentorId: 'admin_user',
      mentorName: 'Nomsa Dlamini',
      feedback: 'Excellent wiring neatness and adherence to safety.',
      decision: 'approved',
      createdAt: '2026-10-24T12:00:00.000Z',
      reviewedAt: '2026-10-24T12:00:00.000Z',
    }));
  });

  it('Section 39: employer plan lock and upgrade request security rules', async () => {
    const emp1 = env.authenticatedContext('emp1').firestore();
    const admin = env.authenticatedContext('admin_user', { admin: true }).firestore();

    // 1. Employer cannot self-assign a paid plan (starter, business, partner)
    await assertFails(updateDoc(doc(emp1, 'employerProfiles/emp1'), {
      plan: 'partner',
    }));

    // 2. Employer cannot modify planStatus, planSince, or planExpiresAt directly
    await assertFails(updateDoc(doc(emp1, 'employerProfiles/emp1'), {
      planStatus: 'active',
      planSince: '2026-01-01T00:00:00.000Z',
    }));
    await assertFails(updateDoc(doc(emp1, 'employerProfiles/emp1'), {
      planExpiresAt: '2027-01-01T00:00:00.000Z',
    }));

    // 2b. Employer CAN update allowed profile fields (contactPhone, description, industry)
    await assertSucceeds(updateDoc(doc(emp1, 'employerProfiles/emp1'), {
      contactPhone: '0829998877',
      description: 'Updated workshop description for small business operations.',
      industry: 'Electrical & Solar',
    }));

    // 2c. Another employer cannot modify emp1's profile
    const emp2 = env.authenticatedContext('emp2').firestore();
    await assertFails(updateDoc(doc(emp2, 'employerProfiles/emp1'), {
      description: 'Attacker overwriting competitor description',
    }));

    // 3. Admin CAN update employer plan
    await assertSucceeds(updateDoc(doc(admin, 'employerProfiles/emp1'), {
      plan: 'starter',
      planStatus: 'active',
      planSince: '2026-10-26T00:00:00.000Z',
    }));

    // 4. Employer can create own upgrade request with status 'pending'
    await assertSucceeds(setDoc(doc(emp1, 'upgradeRequests/req_emp1_1'), {
      id: 'req_emp1_1',
      employerUid: 'emp1',
      businessName: 'Fictional Employer',
      targetPlan: 'business',
      contactName: 'Manager John',
      billingEmail: 'accounts@emp1.co.za',
      status: 'pending',
      requestedAt: '2026-10-26T12:00:00.000Z',
    }));

    // 5. Employer cannot forge an approved upgrade request
    await assertFails(setDoc(doc(emp1, 'upgradeRequests/req_emp1_forged'), {
      id: 'req_emp1_forged',
      employerUid: 'emp1',
      targetPlan: 'partner',
      status: 'approved',
      reviewedBy: 'Admin',
    }));

    // 6. Admin can update upgrade request status to approved
    await assertSucceeds(updateDoc(doc(admin, 'upgradeRequests/req_emp1_1'), {
      status: 'approved',
      reviewedBy: 'Admin Nomsa',
      reviewedAt: '2026-10-26T13:00:00.000Z',
    }));
  });
});
