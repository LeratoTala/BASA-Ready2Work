import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNotificationId,
  shouldDeliverNotification,
  formatApplicationStatusNotification,
  createNotificationRecord,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notifications';
import { NotificationPreferences } from './types';

describe('In-App Notifications (R1 / FR-15)', () => {
  it('T-13 builds a deterministic ID for idempotency on status changes', () => {
    const userId = 'cand_123';
    const type = 'application_status';
    const appId = 'job_999_cand_123';
    const status = 'shortlisted';

    const id1 = buildNotificationId(userId, type, appId, status);
    const id2 = buildNotificationId(userId, type, appId, status);

    assert.equal(id1, id2, 'Notification IDs for the same user and state must be identical to avoid duplicates');
    assert.equal(id1, 'notif_cand_123_application_status_job_999_cand_123_shortlisted');
  });

  it('T-15 correctly respects opted-out notification preferences', () => {
    const customPrefs: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      matching_job: false,
      application_status: true,
    };

    assert.equal(
      shouldDeliverNotification(customPrefs, 'application_status'),
      true,
      'Enabled notification type should be delivered'
    );
    assert.equal(
      shouldDeliverNotification(customPrefs, 'matching_job'),
      false,
      'Disabled notification type should not be delivered'
    );
    assert.equal(
      shouldDeliverNotification(undefined, 'application_status'),
      true,
      'Default to delivering if preferences are not set'
    );
  });

  it('formats friendly status messages without leaking sensitive compensation or contact data', () => {
    const jobTitle = 'Spaza Shop Assistant';
    const notif = formatApplicationStatusNotification(jobTitle, 'shortlisted');

    assert.ok(notif.title.includes('Shortlisted'));
    assert.ok(notif.body.includes(jobTitle));
    assert.equal(
      /ZAR|\$|R\d+|@|\+27|\d{10}/.test(notif.body),
      false,
      'Notification body must never contain compensation figures or contact info'
    );
  });

  it('creates a clean in-app notification record with unread status', () => {
    const record = createNotificationRecord({
      userId: 'user_cand_1',
      type: 'application_status',
      title: 'Shortlisted',
      body: 'You were shortlisted for Barista role',
      entityId: 'app_1',
      stateOrTimestamp: 'shortlisted',
      createdAt: '2026-10-24T12:00:00.000Z',
    });

    assert.equal(record.userId, 'user_cand_1');
    assert.equal(record.readAt, null);
    assert.equal(record.type, 'application_status');
    assert.ok(record.id.startsWith('notif_user_cand_1'));
  });
});
