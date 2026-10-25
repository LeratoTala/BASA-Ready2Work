/**
 * BASA: Ready2Work — Firebase Cloud Functions
 *
 * To deploy:
 *   npm install -g firebase-tools
 *   firebase deploy --only functions
 *
 * Function: incrementReportCount
 * Trigger: Firestore onCreate on /reports/{reportId}
 * Purpose: Maintain the `reportCount` field on Job documents when a new moderation report
 *          targets a job. Clients cannot increment reportCount directly (rules deny it), so
 *          this trusted server-side trigger keeps the count accurate.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Increments `reportCount` on a job document when a new ModerationReport with
 * targetType === 'job' is created. Uses FieldValue.increment to avoid read-modify-write races.
 */
export const incrementReportCount = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap) => {
    const data = snap.data() as {
      targetType: string;
      targetId: string;
      status: string;
    };

    if (data.targetType !== 'job') return null;

    const jobRef = admin.firestore().doc(`jobs/${data.targetId}`);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) {
      console.warn(`incrementReportCount: job ${data.targetId} not found`);
      return null;
    }

    return jobRef.update({
      reportCount: admin.firestore.FieldValue.increment(1),
    });
  });

/**
 * Decrements `reportCount` on a job document when a ModerationReport is resolved as
 * 'dismissed' (i.e. not a real violation). This keeps the count reflecting active reports.
 */
export const decrementReportCountOnDismiss = functions.firestore
  .document('reports/{reportId}')
  .onUpdate(async (change) => {
    const before = change.before.data() as { targetType: string; targetId: string; status: string };
    const after = change.after.data() as { targetType: string; targetId: string; status: string };

    // Only act when status changes to 'dismissed'
    if (before.status === after.status) return null;
    if (after.status !== 'dismissed') return null;
    if (after.targetType !== 'job') return null;

    const jobRef = admin.firestore().doc(`jobs/${after.targetId}`);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) return null;

    const currentCount = (jobSnap.data() as { reportCount?: number }).reportCount ?? 0;
    return jobRef.update({
      reportCount: Math.max(0, currentCount - 1),
    });
  });
