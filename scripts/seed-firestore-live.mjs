#!/usr/bin/env node
/**
 * BASA: Ready2Work — Live Firestore Seed Script
 *
 * Seeds a production/staging Firestore database with the 3 foundational personas:
 *   1. Admin / Assessor (with custom claim { admin: true })
 *   2. Employer (verified SMME with active listings & plan)
 *   3. Candidate (with Skill Passport, evidence, and applications)
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/seed-firestore-live.mjs
 */

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath && !process.env.FIREBASE_CONFIG) {
  console.log('Notice: GOOGLE_APPLICATION_CREDENTIALS not set. Attempting applicationDefault credentials...');
}

let app;
try {
  if (credPath && fs.existsSync(credPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    app = initializeApp({ credential: applicationDefault() });
  }
} catch (e) {
  console.error('Failed to initialize Firebase Admin SDK:', e.message);
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS to a valid service account JSON file.');
  process.exit(1);
}

const auth = getAuth(app);
const db = getFirestore(app);

const NOW = new Date().toISOString();
const EXPIRY = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

async function createOrGetUser(email, password, displayName) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`User already exists in Auth: ${email} (${existing.uid})`);
    return existing;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
      });
      console.log(`Created Auth user: ${email} (${created.uid})`);
      return created;
    }
    throw err;
  }
}

async function runSeed() {
  console.log('\n--- Seeding BASA: Ready2Work Live Firestore ---\n');

  // 1. Admin Persona (Nomsa Dlamini)
  const adminUser = await createOrGetUser(
    'nomsa.admin@basa.co.za',
    'AdminBasa2026!',
    'Nomsa Dlamini (Admin)'
  );
  await auth.setCustomUserClaims(adminUser.uid, { admin: true });
  await db.doc(`users/${adminUser.uid}`).set({
    uid: adminUser.uid,
    email: 'nomsa.admin@basa.co.za',
    displayName: 'Nomsa Dlamini',
    role: 'admin',
    createdAt: NOW,
    accountStatus: 'active',
    minimumAgeConfirmed: true,
  }, { merge: true });
  console.log(`✓ Admin user configured with { admin: true } claim: nomsa.admin@basa.co.za`);

  // 2. Employer Persona (Zola Sithole - Zola Artisan Café)
  const employerUser = await createOrGetUser(
    'zola.employer@basa.co.za',
    'EmployerBasa2026!',
    'Zola Sithole'
  );
  await db.doc(`users/${employerUser.uid}`).set({
    uid: employerUser.uid,
    email: 'zola.employer@basa.co.za',
    displayName: 'Zola Sithole',
    role: 'employer',
    createdAt: NOW,
    accountStatus: 'active',
    minimumAgeConfirmed: true,
  }, { merge: true });

  await db.doc(`employerProfiles/${employerUser.uid}`).set({
    employerUid: employerUser.uid,
    businessName: 'Zola Artisan Café',
    industry: 'Specialty Hospitality & Bakery',
    locationArea: 'Johannesburg CBD',
    contactEmail: 'zola.employer@basa.co.za',
    phone: '0821234567',
    description: 'Independent café serving ethically sourced African beans and training young youth baristas.',
    verificationStatus: 'verified',
    plan: 'free',
    planStatus: 'active',
    planSince: NOW,
    planExpiresAt: null,
    updatedAt: NOW,
  }, { merge: true });

  // 1 Active Job for Employer
  const jobId = `job-barista-${employerUser.uid.slice(0, 5)}`;
  await db.doc(`jobs/${jobId}`).set({
    id: jobId,
    employerId: employerUser.uid,
    title: 'Junior Barista & Front of House',
    industry: 'Hospitality',
    description: 'Looking for an enthusiastic barista with espresso calibration and milk texturing basics.',
    requiredSkillIds: ['skill-barista-espresso', 'skill-customer-service'],
    locationArea: 'Johannesburg CBD',
    rateType: 'hourly',
    rateAmount: 45,
    status: 'open',
    reportCount: 0,
    engagementType: 'contract',
    absorptionLikelihood: 'High - Leading to full-time permanent role upon 3-month review',
    createdAt: NOW,
    updatedAt: NOW,
  }, { merge: true });
  console.log(`✓ Employer profile & active job created for Zola Artisan Café (${employerUser.uid})`);

  // 3. Candidate Persona (Thabo Ndlovu)
  const candidateUser = await createOrGetUser(
    'thabo.candidate@basa.co.za',
    'CandidateBasa2026!',
    'Thabo Ndlovu'
  );
  await db.doc(`users/${candidateUser.uid}`).set({
    uid: candidateUser.uid,
    email: 'thabo.candidate@basa.co.za',
    displayName: 'Thabo Ndlovu',
    role: 'candidate',
    createdAt: NOW,
    accountStatus: 'active',
    minimumAgeConfirmed: true,
  }, { merge: true });

  await db.doc(`candidateProfiles/${candidateUser.uid}`).set({
    uid: candidateUser.uid,
    fullName: 'Thabo Ndlovu',
    headline: 'Practical Barista & Certified Solar PV Assistant',
    summary: 'Practical experience in high-volume café service and accredited TVET solar maintenance.',
    locationArea: 'Soweto',
    availability: 'immediate',
    popiaConsentGranted: true,
    popiaVisibility: 'public_to_verified_employers',
    skillIds: ['skill-barista-espresso', 'skill-solar-install'],
    phone: '0719876543',
    contactEmail: 'thabo.candidate@basa.co.za',
    updatedAt: NOW,
  }, { merge: true });

  // Add 1 Skill Claim with Proof
  const claimId = `claim-barista-${candidateUser.uid.slice(0, 5)}`;
  await db.doc(`skillClaims/${claimId}`).set({
    id: claimId,
    candidateId: candidateUser.uid,
    skillId: 'skill-barista-espresso',
    skillName: 'Espresso Extraction & Milk Texturing',
    selfReportedLevel: 'Proficient',
    evidenceType: 'practical_demo',
    evidenceTitle: 'Barista Guild Bench Assessment',
    evidenceDescription: 'Completed grinder dosing calibration, 25-second extraction test, and micro-foam pour.',
    verificationStatus: 'Task-assessed',
    assessmentId: 'assess-demo-101',
    createdAt: NOW,
  }, { merge: true });

  // 1 Application to Zola's job
  const appId = `${jobId}_${candidateUser.uid}`;
  await db.doc(`applications/${appId}`).set({
    id: appId,
    jobId,
    candidateId: candidateUser.uid,
    status: 'under_review',
    submittedAt: NOW,
    updatedAt: NOW,
  }, { merge: true });
  console.log(`✓ Candidate profile, verified skill, and application seeded for Thabo Ndlovu (${candidateUser.uid})`);

  console.log('\n--- Seeding Complete Successfully! ---');
  console.log('\nSeed Credentials for Live Deployment:');
  console.log('1. Admin:     nomsa.admin@basa.co.za     / AdminBasa2026!');
  console.log('2. Employer:  zola.employer@basa.co.za  / EmployerBasa2026!');
  console.log('3. Candidate: thabo.candidate@basa.co.za / CandidateBasa2026!\n');
}

runSeed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
