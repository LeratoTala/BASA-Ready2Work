#!/usr/bin/env node
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
if (!projectId) {
  console.error('Set FIREBASE_PROJECT_ID to the Firebase project to update.');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const [jobs, pendingReports] = await Promise.all([
  db.collection('jobs').get(),
  db.collection('reports')
    .where('targetType', '==', 'job')
    .where('status', '==', 'pending')
    .get(),
]);

const pendingCountByJob = new Map();
for (const report of pendingReports.docs) {
  const targetId = report.get('targetId');
  if (typeof targetId !== 'string' || !targetId) continue;
  pendingCountByJob.set(targetId, (pendingCountByJob.get(targetId) ?? 0) + 1);
}

for (let offset = 0; offset < jobs.docs.length; offset += 400) {
  const batch = db.batch();
  for (const job of jobs.docs.slice(offset, offset + 400)) {
    batch.update(job.ref, { reportCount: pendingCountByJob.get(job.id) ?? 0 });
  }
  await batch.commit();
}

console.log(`Updated pending report counts on ${jobs.size} job(s) in ${projectId}.`);
