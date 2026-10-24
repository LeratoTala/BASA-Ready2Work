/** Product-level configuration and defaults. Change copy/defaults here, not in components. */

export const APP = {
  name: 'BASA: Ready2Work',
  tagline: 'Skills → Evidence → Work',
  storagePrefix: 'basa_',
  /** Client-side wait before giving up on the CV drafting API. */
  apiTimeoutMs: 15_000,
} as const;

export const STORAGE_KEYS = {
  currentUser: `${APP.storagePrefix}currentUser`,
  users: `${APP.storagePrefix}users`,
  candidateProfiles: `${APP.storagePrefix}candidateProfiles`,
  employerProfiles: `${APP.storagePrefix}employerProfiles`,
  skillClaims: `${APP.storagePrefix}skillClaims`,
  assessments: `${APP.storagePrefix}assessments`,
  jobs: `${APP.storagePrefix}jobs`,
  applications: `${APP.storagePrefix}applications`,
  workRecords: `${APP.storagePrefix}workRecords`,
  reports: `${APP.storagePrefix}reports`,
  privacyDeletionRequests: `${APP.storagePrefix}privacyDeletionRequests`,
  notifications: `${APP.storagePrefix}notifications`,
  notificationPreferences: `${APP.storagePrefix}notificationPreferences`,
  endorsements: `${APP.storagePrefix}endorsements`,
  mentorReviews: `${APP.storagePrefix}mentorReviews`,
  lowDataMode: `${APP.storagePrefix}lowDataMode`,
  profileDraft: `${APP.storagePrefix}profileDraft`,
  syncQueue: `${APP.storagePrefix}sync_queue`,
  lastSync: `${APP.storagePrefix}last_sync_timestamp`,
} as const;

/** Values pre-filled on new accounts. Candidates edit these during onboarding. */
export const NEW_ACCOUNT_DEFAULTS = {
  candidate: {
    headline: '',
    experienceSummary: '',
    locationArea: '',
    availability: 'immediate',
    popiaVisibility: 'private',
  },
  employer: {
    industry: '',
    description: '',
    locationArea: '',
    /** Employers start unverified; only an admin can change this. */
    verificationStatus: 'pending',
  },
} as const;

export const COLLECTIONS = {
  users: 'users',
  candidateProfiles: 'candidateProfiles',
  candidatePrivateProfiles: 'candidatePrivateProfiles',
  employerProfiles: 'employerProfiles',
  skillClaims: 'skillClaims',
  assessments: 'assessments',
  jobs: 'jobs',
  applications: 'applications',
  employerCandidateAccess: 'employerCandidateAccess',
  employerCandidateContactAccess: 'employerCandidateContactAccess',
  workRecords: 'workRecords',
  reports: 'reports',
  privacyDeletionRequests: 'privacyDeletionRequests',
  notifications: 'notifications',
  notificationPreferences: 'notificationPreferences',
  endorsements: 'endorsements',
  mentorReviews: 'mentorReviews',
} as const;
