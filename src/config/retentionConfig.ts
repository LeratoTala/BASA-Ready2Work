/**
 * BASA Ready2Work Data Retention Configuration (Section 38 - P2)
 *
 * Configurable retention policies complying with POPIA and fair user privacy.
 * All defaults are explicit and subject to operator configuration.
 */

export interface RetentionPolicyConfig {
  /** Evidence files & credential records: kept while account is active; deleted on account deletion */
  activeAccountEvidence: 'kept_while_active';

  /** Candidate's own completed-work entries (Skill Passport history): kept while account active; deleted with account within 30 days */
  candidateWorkHistory: 'kept_while_active_deleted_with_account';

  /** Employer billing and invoice records (subscriptions): statutory tax/audit period (assumed 5 years to be confirmed by SA tax rules; contains business details only, zero candidate data) */
  employerBillingTaxYears: number;

  /** Closed placement records: anonymised aggregate count only (no name, contact details, ID, or evidence) */
  closedPlacementsRetention: 'anonymized_aggregate_only';

  /** Days within which all records are permanently purged after deletion request (suggested: 30) */
  deletionPurgeGraceDays: number;

  /** Unselected applications are deleted or anonymised after this many months (suggested: 6) */
  unselectedApplicationsMonths: number;

  /** Months of inactivity before sending an inactivity warning email/notification (suggested: 12) */
  inactiveAccountWarningMonths: number;

  /** Months of inactivity before deleting an inactive account (suggested: 18) */
  inactiveAccountDeletionMonths: number;

  /** Audit log policy: minimal metadata (who/when/what-type) with zero personal content */
  auditLogRetention: 'metadata_only_anonymized_on_delete';

  /** Grade 6 notice for employer-downloaded records outside the platform */
  employerDownloadedNotice: string;
}

export const DEFAULT_RETENTION_CONFIG: RetentionPolicyConfig = {
  activeAccountEvidence: 'kept_while_active',
  candidateWorkHistory: 'kept_while_active_deleted_with_account',
  employerBillingTaxYears: 5, // Assumed 5 years for SA tax/audit compliance; contains business details only
  closedPlacementsRetention: 'anonymized_aggregate_only',
  deletionPurgeGraceDays: 30,
  unselectedApplicationsMonths: 6,
  inactiveAccountWarningMonths: 12,
  inactiveAccountDeletionMonths: 18,
  auditLogRetention: 'metadata_only_anonymized_on_delete',
  employerDownloadedNotice:
    'Data you shared with an employer is visible only for that job application. You can revoke sharing at any time in the app. However, any notes or documents already printed or saved by an employer to their own computer outside the app cannot be deleted by us.',
};

/** Plain-language summary items for the Grade 6 "Your data" screen (Section 38.5) */
export const GRADE_6_DATA_POLICY = [
  {
    title: 'What we keep',
    summary:
      'We keep your name, phone number, the practical skills you add, your photos or certificates of work, and your job applications.',
  },
  {
    title: 'Why we keep it',
    summary:
      'To build your honest Skill Passport and connect you directly with real, paid local jobs and employers who need your skills.',
  },
  {
    title: 'How long we keep it',
    summary:
      'As long as your account is active. Applications not selected are cleared after 6 months. If you do not use the app for 18 months, your account is safely deleted.',
  },
  {
    title: 'How you can delete it',
    summary:
      'You can tap "Delete my account" at any time in Settings. Everything you uploaded—skills, photos, certificates, and applications—will be permanently wiped within 30 days.',
  },
  {
    title: 'Export your data',
    summary:
      'You can download a full copy of your own profile, skills, and records at any time as a JSON file.',
  },
];
