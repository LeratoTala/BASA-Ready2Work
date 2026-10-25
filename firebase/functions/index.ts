/**
 * BASA: Ready2Work — Firebase Cloud Functions
 *
 * To deploy:
 *   npm install -g firebase-tools
 *   firebase deploy --only functions
 *
 * Firestore triggers maintain each job's pending moderation-report count.
 */

import * as functions from 'firebase-functions/v1';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { reportCountDelta, type ReportStatus } from '../../src/domain/reportCount';

initializeApp();
const db = getFirestore();

/**
 * Increments `reportCount` when a pending report targeting a job is created.
 */
export const incrementReportCount = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap) => {
    const data = snap.data() as {
      targetType: string;
      targetId: string;
      status: ReportStatus;
    };

    if (data.targetType !== 'job' || reportCountDelta(null, data.status) === 0) return null;

    const jobRef = db.doc(`jobs/${data.targetId}`);
    return db.runTransaction(async (transaction) => {
      const jobSnap = await transaction.get(jobRef);
      if (!jobSnap.exists) {
        console.warn(`incrementReportCount: job ${data.targetId} not found`);
        return;
      }
      const currentCount = jobSnap.get('reportCount');
      const safeCount = typeof currentCount === 'number' && Number.isFinite(currentCount)
        ? currentCount
        : 0;
      transaction.update(jobRef, { reportCount: safeCount + 1 });
    });
  });

/**
 * Keeps each job's reportCount equal to its pending moderation reports.
 */
export const updateReportCount = functions.firestore
  .document('reports/{reportId}')
  .onUpdate(async (change) => {
    const before = change.before.data() as { targetType: string; targetId: string; status: ReportStatus };
    const after = change.after.data() as { targetType: string; targetId: string; status: ReportStatus };
    const delta = reportCountDelta(before.status, after.status);
    if (delta === 0) return null;
    if (after.targetType !== 'job') return null;

    const jobRef = db.doc(`jobs/${after.targetId}`);
    return db.runTransaction(async (transaction) => {
      const jobSnap = await transaction.get(jobRef);
      if (!jobSnap.exists) {
        console.warn(`updateReportCount: job ${after.targetId} not found`);
        return;
      }
      const currentCount = jobSnap.get('reportCount');
      const safeCount = typeof currentCount === 'number' && Number.isFinite(currentCount)
        ? currentCount
        : 0;
      transaction.update(jobRef, { reportCount: Math.max(0, safeCount + delta) });
    });
  });
