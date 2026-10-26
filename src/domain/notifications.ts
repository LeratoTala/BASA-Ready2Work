import { ApplicationStatus, InAppNotification, NotificationPreferences, NotificationType } from './types';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  application_status: true,
  matching_job: true,
  assessment_result: true,
  endorsement_request: true,
  transport_update: true,
  mentor_message: true,
};

/**
 * Builds a deterministic notification ID to prevent duplicates (idempotency).
 * Example: notif_user123_application_status_app456_shortlisted
 */
export function buildNotificationId(
  userId: string,
  type: NotificationType,
  entityId: string,
  stateOrTimestamp: string
): string {
  const cleanState = stateOrTimestamp.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `notif_${userId}_${type}_${entityId}_${cleanState}`;
}

/**
 * Checks if user preferences permit delivery of a given notification type.
 * T-15: Opted-out types are not delivered.
 */
export function shouldDeliverNotification(
  prefs: NotificationPreferences | undefined | null,
  type: NotificationType
): boolean {
  if (!prefs) return true; // Default to true if preferences haven't been customized
  return Boolean(prefs[type]);
}

/**
 * Formats user-facing status messages using plain, encouraging South African English.
 * Never includes sensitive information (pay amounts, contact details, or raw evidence).
 */
export function formatApplicationStatusNotification(
  jobTitle: string,
  newStatus: ApplicationStatus
): { title: string; body: string } {
  switch (newStatus) {
    case 'submitted':
      return {
        title: 'Application Sent',
        body: `Your application for "${jobTitle}" was submitted successfully.`,
      };
    case 'under_review':
      return {
        title: 'Application Under Review',
        body: `An employer is currently reviewing your profile for "${jobTitle}".`,
      };
    case 'shortlisted':
      return {
        title: 'You Are Shortlisted!',
        body: `Great news! You have been shortlisted for "${jobTitle}". The employer will contact you if selected.`,
      };
    case 'selected':
      return {
        title: 'Selected for Work!',
        body: `Congratulations! You were selected for "${jobTitle}". Check your applications tab for next steps.`,
      };
    case 'completed':
      return {
        title: 'Work Completed & Confirmed',
        body: `Your work on "${jobTitle}" has been confirmed as completed by the employer.`,
      };
    case 'not_selected':
      return {
        title: 'Application Update',
        body: `The employer has decided to move forward with other applicants for "${jobTitle}". Keep applying!`,
      };
    case 'withdrawn':
      return {
        title: 'Application Withdrawn',
        body: `Your application for "${jobTitle}" was marked as withdrawn.`,
      };
    default:
      return {
        title: 'Application Update',
        body: `There is a new update regarding your application for "${jobTitle}".`,
      };
  }
}

/**
 * Creates an in-app notification object.
 */
export function createNotificationRecord(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityId: string;
  stateOrTimestamp: string;
  link?: string;
  createdAt: string;
}): InAppNotification {
  return {
    id: buildNotificationId(params.userId, params.type, params.entityId, params.stateOrTimestamp),
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link,
    createdAt: params.createdAt,
    readAt: null,
  };
}
