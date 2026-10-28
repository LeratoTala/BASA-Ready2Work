import fs from 'node:fs';
import os from 'node:os';

const configPath = os.homedir() + '/.config/configstore/firebase-tools.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;
const PROJECT_ID = 'basa-ready2work';
const API_KEY = 'AIzaSyC11F6QyvhLdPno4bNtT1Lye6q3sJ3udeg';

console.log('Using project:', PROJECT_ID);

async function getOrRefreshAccessToken() {
  // If access token works, return it, otherwise refresh
  return accessToken;
}

async function createAuthUser(email, password, displayName) {
  // Try to sign up user via Identity Toolkit REST API
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName,
      returnSecureToken: true,
    }),
  });

  const data = await res.json();
  if (data.localId) {
    console.log(`✓ Created user in Auth: ${email} (UID: ${data.localId})`);
    return data.localId;
  }

  if (data.error && data.error.message.includes('EMAIL_EXISTS')) {
    // Look up user UID using admin API
    console.log(`User ${email} already exists in Auth. Looking up UID...`);
    const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`;
    const signinUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
    const signinRes = await fetch(signinUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const signinData = await signinRes.json();
    if (signinData.localId) {
      console.log(`✓ Found user UID: ${signinData.localId}`);
      return signinData.localId;
    }
  }

  throw new Error(`Failed to create/get Auth user ${email}: ` + JSON.stringify(data));
}

async function setAdminClaim(uid, token) {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      localId: uid,
      customAttributes: JSON.stringify({ admin: true }),
    }),
  });

  const data = await res.json();
  if (data.localId) {
    console.log(`✓ Granted { admin: true } custom claim to UID: ${uid}`);
    return;
  }
  console.warn('Set admin claim warning:', data);
}

// Convert JS object to Firestore REST document fields format
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      fields[key] = Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((v) => {
            if (typeof v === 'string') return { stringValue: v };
            if (typeof v === 'number') return { integerValue: v.toString() };
            if (typeof v === 'boolean') return { booleanValue: v };
            return { stringValue: String(v) };
          }),
        },
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

async function writeFirestoreDoc(collection, docId, data, token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: toFirestoreFields(data),
    }),
  });

  const resData = await res.json();
  if (resData.name) {
    console.log(`✓ Firestore document written: ${collection}/${docId}`);
    return resData;
  }
  throw new Error(`Failed to write doc ${collection}/${docId}: ` + JSON.stringify(resData));
}

async function main() {
  const token = await getOrRefreshAccessToken();
  const NOW = new Date().toISOString();

  console.log('\n--- 1. Creating Real Auth Users ---');
  const adminUid = await createAuthUser('nomsa.admin@basa.co.za', 'NomsaPass2026!', 'Nomsa Dlamini');
  await setAdminClaim(adminUid, token);

  const employerUid = await createAuthUser('zola.sithole@basa.co.za', 'ZolaPass2026!', 'Zola Sithole');
  const candidateUid = await createAuthUser('thabo.ndlovu@basa.co.za', 'ThaboPass2026!', 'Thabo Ndlovu');

  console.log('\n--- 2. Writing Real Firestore Data ---');

  // Admin user
  await writeFirestoreDoc('users', adminUid, {
    uid: adminUid,
    email: 'nomsa.admin@basa.co.za',
    displayName: 'Nomsa Dlamini',
    role: 'admin',
    createdAt: NOW,
    accountStatus: 'active',
    minimumAgeConfirmed: true,
  }, token);

  // Employer user & profile
  await writeFirestoreDoc('users', employerUid, {
    uid: employerUid,
    email: 'zola.sithole@basa.co.za',
    displayName: 'Zola Sithole',
    role: 'employer',
    createdAt: NOW,
    accountStatus: 'active',
    minimumAgeConfirmed: true,
  }, token);

  await writeFirestoreDoc('employerProfiles', employerUid, {
    employerUid,
    businessName: 'Zola Artisan Café',
    industry: 'Specialty Hospitality & Bakery',
    locationArea: 'Johannesburg CBD',
    contactEmail: 'zola.sithole@basa.co.za',
    phone: '0821234567',
    description: 'Independent café serving ethically sourced African beans and training young youth baristas.',
    verificationStatus: 'verified',
    plan: 'free',
    planStatus: 'active',
    planSince: NOW,
    updatedAt: NOW,
  }, token);

  // Employer active job
  const jobId = `job_barista_live_${employerUid.slice(0, 5)}`;
  await writeFirestoreDoc('jobs', jobId, {
    id: jobId,
    employerId: employerUid,
    employerName: 'Zola Artisan Café',
    employerVerified: true,
    title: 'Junior Barista & Front of House',
    industry: 'Hospitality',
    description: 'Looking for an enthusiastic barista with espresso calibration and milk texturing basics.',
    responsibilities: [
      'Prepare espresso-based drinks to cafe standards',
      'Maintain espresso machine cleanliness and calibration',
      'Provide warm, professional front-of-house customer service',
    ],
    requiredSkillIds: ['skill-barista-espresso', 'skill-customer-service'],
    requiredSkillNames: ['Espresso Preparation', 'Customer Service'],
    locationArea: 'Johannesburg CBD',
    workMode: 'in_person',
    compensationAmount: 45,
    compensationCurrency: 'ZAR',
    compensationUnit: 'hourly',
    rateType: 'hourly',
    rateAmount: 45,
    status: 'open',
    reportCount: 0,
    engagementType: 'contract',
    absorptionLikelihood: 'High - Leading to full-time permanent role upon 3-month review',
    startDate: NOW.split('T')[0],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: NOW,
    updatedAt: NOW,
  }, token);

  // Candidate user & profile
  await writeFirestoreDoc('users', candidateUid, {
    uid: candidateUid,
    email: 'thabo.ndlovu@basa.co.za',
    displayName: 'Thabo Ndlovu',
    role: 'candidate',
    createdAt: NOW,
    accountStatus: 'active',
    minimumAgeConfirmed: true,
  }, token);

  await writeFirestoreDoc('candidateProfiles', candidateUid, {
    uid: candidateUid,
    fullName: 'Thabo Ndlovu',
    headline: 'Practical Barista & Certified Solar PV Assistant',
    summary: 'Practical experience in high-volume café service and accredited TVET solar maintenance.',
    locationArea: 'Soweto',
    availability: 'immediate',
    popiaConsentGranted: true,
    popiaVisibility: 'public_to_verified_employers',
    skillIds: ['skill-barista-espresso', 'skill-solar-install'],
    updatedAt: NOW,
  }, token);

  // Candidate skill claim
  const claimId = `claim_barista_live_${candidateUid.slice(0, 5)}`;
  await writeFirestoreDoc('skillClaims', claimId, {
    id: claimId,
    candidateId: candidateUid,
    skillId: 'skill-barista-espresso',
    skillName: 'Espresso Extraction & Milk Texturing',
    selfReportedLevel: 'Proficient',
    evidenceType: 'practical_demo',
    evidenceTitle: 'Barista Guild Bench Assessment',
    evidenceDescription: 'Completed grinder dosing calibration, 25-second extraction test, and micro-foam pour.',
    verificationStatus: 'Task-assessed',
    assessmentId: 'assess-demo-101',
    createdAt: NOW,
  }, token);

  // Application to the job
  const appId = `${jobId}_${candidateUid}`;
  await writeFirestoreDoc('applications', appId, {
    id: appId,
    jobId,
    candidateId: candidateUid,
    status: 'under_review',
    submittedAt: NOW,
    updatedAt: NOW,
  }, token);

  console.log('\n=== REAL FIRESTORE SEED COMPLETE ===');
  console.log('Candidate: thabo.ndlovu@basa.co.za / ThaboPass2026!');
  console.log('Employer:  zola.sithole@basa.co.za  / ZolaPass2026!');
  console.log('Admin:     nomsa.admin@basa.co.za   / NomsaPass2026!\n');
}

main().catch((e) => {
  console.error('Error running seed:', e);
  process.exit(1);
});
