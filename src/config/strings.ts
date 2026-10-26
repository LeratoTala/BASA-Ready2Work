/**
 * BASA: Ready2Work Plain-Language Strings (Grade 6 Reading Level)
 * Single source of truth for user-facing terminology and glossary.
 *
 * Rules:
 * 1. Plain language across all views (Grade 6 reading level).
 * 2. Candidate folder -> "My Skill Passport" (candidate view) / "Applicant profile" (employer view)
 * 3. Evidence / documents -> "My proof" / "proof"
 * 4. Review applicant -> "See profile and proof"
 * 5. Company verification pack -> "Business documents"
 * 6. Verification labels: Self-reported, Peer-endorsed, Task-assessed, Mentor-reviewed
 *    with a one-line plain explanation for each.
 */

export const GLOSSARY = {
  candidatePassport: 'My Skill Passport',
  applicantProfile: 'Applicant profile',
  proof: 'proof',
  proofCapitalized: 'Proof',
  myProof: 'My proof',
  seeProfileAndProof: 'See profile and proof',
  businessDocuments: 'Business documents',
  businessDocumentsCheck: 'Business Documents (Anti-Fraud Check)',
} as const;

export const EVIDENCE_LABELS = {
  selfReported: 'Self-reported',
  peerEndorsed: 'Peer-endorsed',
  taskAssessed: 'Task-assessed',
  mentorReviewed: 'Mentor-reviewed',
} as const;

export interface EvidenceExplanation {
  label: string;
  oneLinePlain: string;
  candidateTip: string;
  employerNote: string;
  disclaimer: string;
  badgeStyle: string;
}

export const EVIDENCE_EXPLANATIONS: Record<string, EvidenceExplanation> = {
  'Self-reported': {
    label: 'Self-reported',
    oneLinePlain: 'You entered this skill yourself. It has not been checked by an assessor yet.',
    candidateTip: 'You added this skill yourself. Add proof or get a review to upgrade it.',
    employerNote: 'The candidate added this skill themselves. It has not been checked yet.',
    disclaimer: 'Not checked by an assessor.',
    badgeStyle: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  'Peer-endorsed': {
    label: 'Peer-endorsed',
    oneLinePlain: 'A coworker or client you worked with confirmed you can do this.',
    candidateTip: 'A person you worked with confirmed your skill.',
    employerNote: 'A coworker, supervisor or client confirmed this candidate can do this work.',
    disclaimer: 'Confirmed by a coworker, not an official certificate.',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  'Task-assessed': {
    label: 'Task-assessed',
    oneLinePlain: 'An assessor scored a real practical task or test you completed.',
    candidateTip: 'You completed a real hands-on test scored by an assessor.',
    employerNote: 'An assessor scored a practical work task done by this candidate.',
    disclaimer: 'Passed a practical skill test.',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
  },
  'Mentor-reviewed': {
    label: 'Mentor-reviewed',
    oneLinePlain: 'An experienced supervisor or mentor checked your work samples.',
    candidateTip: 'An experienced mentor checked your work samples and approved them.',
    employerNote: 'An experienced supervisor or mentor reviewed this candidate\'s work samples.',
    disclaimer: 'Reviewed by an experienced mentor.',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
  },
};

export const UI_STRINGS = {
  // Navigation tabs
  navOpportunities: 'Opportunities',
  navSkillsAndProof: 'Skills & Proof',
  navMyApplications: 'My Applications',
  navMyProfile: 'My Profile',
  navDashboardJobs: 'Dashboard & Jobs',
  navApplicants: 'Applicants',
  navCompanyProfile: 'Company Profile',

  // Taglines
  tagline: 'Skills → Proof → Work',
  taglineWithCountry: 'Skills → Proof → Work · South Africa',

  // Actions
  seeProfileAndProof: 'See profile and proof',
  viewRecord: 'View Record',
  updateProof: 'Update / Add Proof',
  uploadProof: 'Upload proof',
  addProof: 'Add proof',
  viewBusinessDocuments: 'View business documents',
  submitBusinessDocuments: 'Submit business documents',

  // Status & notifications
  freeTextPrivacyWarning: "Don't type ID numbers, phone numbers, email addresses or home addresses here. They are not needed.",
  proofNotUploaded: 'No proof uploaded yet',
  proofAttached: 'Attached Proof & Work Samples',
  verifiedProof: 'Verified Proof & Work Samples',
  businessDocumentsTitle: 'Business Documents (Anti-Fraud Check)',
  businessDocumentsSubtitle: 'Official papers proving the company is formally registered.',
  applicantProfileTitle: 'Applicant Profile',
  candidateProofTitle: 'Uploaded Proof & Work Samples',
  accessDeniedProfile: 'You do not have permission to view applicant profiles belonging to another employer.',
} as const;
