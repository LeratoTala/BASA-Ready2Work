export type Role = 'candidate' | 'employer' | 'admin';

export type VerificationStatus =
  | 'Self-reported'
  | 'Peer-endorsed'
  | 'Task-assessed'
  | 'Mentor-reviewed';

export type AvailabilityType = 'immediate' | 'part_time' | 'full_time' | 'weekends';

export type WorkMode = 'In-person' | 'Hybrid' | 'Remote';

export type CompensationUnit = 'hourly' | 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'fixed';

export type EngagementType =
  | 'permanent'
  | 'internship'
  | 'micro_internship'
  | 'casual'
  | 'learnership'
  | 'contract';

export interface EngagementTypeMeta {
  label: string;
  shortLabel: string;
  badgeClass: string;
  expectation: string;
}

export const ENGAGEMENT_TYPE_METADATA: Record<EngagementType, EngagementTypeMeta> = {
  permanent: {
    label: 'Permanent Position',
    shortLabel: 'Permanent',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    expectation: 'Long-term permanent employment with ongoing career absorption and statutory employee benefits.',
  },
  internship: {
    label: 'Graduate / Practical Internship',
    shortLabel: 'Internship',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    expectation: 'Structured workplace internship (3-12 months) focused on entry-level skill acquisition with absorption potential.',
  },
  micro_internship: {
    label: 'Micro-Internship / Project Gig',
    shortLabel: 'Micro-Internship',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    expectation: 'Short-term trial engagement (1-4 weeks) designed to evaluate mutual fit and build portfolio evidence.',
  },
  casual: {
    label: 'Casual / Relief Work',
    shortLabel: 'Casual / Shifts',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    expectation: 'Flexible, shift-based or seasonal work (e.g. peak hours, weekend coverage, or day-to-day relief shifts).',
  },
  learnership: {
    label: 'Learnership / Apprenticeship',
    shortLabel: 'Learnership',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    expectation: 'Formal vocational training program combining practical on-site experience with technical trade theory toward accredited certification.',
  },
  contract: {
    label: 'Fixed-Term Contract',
    shortLabel: 'Contract',
    badgeClass: 'bg-stone-100 text-stone-900 border-stone-300',
    expectation: 'Pre-agreed employment duration (e.g. 3, 6, or 12 months) for specific project deliverables with option to renew or absorb.',
  },
};

export function formatEngagementType(type?: EngagementType): string {
  if (!type) return 'Casual / Opportunity';
  return ENGAGEMENT_TYPE_METADATA[type]?.label || type;
}

export function formatRateUnit(unit?: string): string {
  if (!unit) return 'hour';
  if (unit === 'hourly' || unit === 'hour') return 'hour';
  if (unit === 'daily' || unit === 'day') return 'day';
  if (unit === 'weekly' || unit === 'week') return 'week';
  if (unit === 'fortnightly' || unit === 'fortnight') return 'fortnight';
  if (unit === 'monthly' || unit === 'month') return 'month';
  return unit;
}

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'selected'
  | 'not_selected'
  | 'completed'
  | 'withdrawn';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  createdAt: string;
  accountStatus: 'active' | 'suspended';
  minimumAgeConfirmed?: boolean;
}

export interface CandidateProfile {
  uid: string;
  fullName: string;
  headline: string;
  experienceSummary: string;
  skillIds: string[];
  locationArea: string;
  availability: AvailabilityType;
  phone?: string;
  contactEmail?: string;
  popiaVisibility: 'public_link' | 'employers_only' | 'private';
  updatedAt: string;
}

export type BusinessRegistrationType =
  | 'cipc_pty_ltd'           // CIPC Registered Private Company (Pty) Ltd
  | 'cipc_close_corp'        // CIPC Close Corporation (CC)
  | 'cipc_npc'               // Non-Profit Company (NPC)
  | 'municipal_trade_permit' // Municipal / Local Trading Permit (Township Spaza / Micro-enterprise)
  | 'sars_sole_proprietor'   // Registered Sole Proprietor with SARS Tax Number
  | 'cooperative'            // Registered Worker / Community Cooperative
  | 'other_formal';          // Other Statutory / Formally Listed Body

export interface BusinessVerificationDetails {
  registrationType: BusinessRegistrationType;
  registrationNumber: string; // e.g. 2021/123456/07 or SARS Tax No / Permit No
  legalRegisteredName: string; // Official entity name on CIPC/Permit
  taxNumber?: string; // SARS Income Tax / VAT registration
  physicalAddress: string; // Official registered business premises
  officialPhone: string; // Verification contact phone number
  officialWebsite?: string; // Company website / public social profile
  documentFileName?: string; // Uploaded CoR14.3 / municipal permit file name
  documentFileUrl?: string; // Document URL / blob URL
  submittedAt?: string; // ISO date when verification was requested
  verifiedAt?: string; // ISO date when admin verified
  rejectionReason?: string; // If admin requested revision or rejected
  adminNotes?: string;
}

export const BUSINESS_REGISTRATION_TYPE_LABELS: Record<BusinessRegistrationType, { title: string; description: string }> = {
  cipc_pty_ltd: {
    title: 'CIPC Private Company (Pty) Ltd',
    description: 'Registered with Companies and Intellectual Property Commission (CoR14.3 certificate).',
  },
  cipc_close_corp: {
    title: 'CIPC Close Corporation (CC)',
    description: 'Registered close corporation entity (CK1 or CK2 founding statement).',
  },
  cipc_npc: {
    title: 'Non-Profit Company (NPC)',
    description: 'Registered non-profit entity or public benefit organization.',
  },
  municipal_trade_permit: {
    title: 'Municipal Trading Permit / Spaza License',
    description: 'Official local municipal trading permit or township micro-enterprise license.',
  },
  sars_sole_proprietor: {
    title: 'Registered Sole Proprietor (SARS Tax)',
    description: 'Individual trading under an official SARS income tax / VAT compliance number.',
  },
  cooperative: {
    title: 'Registered Cooperative',
    description: 'Cooperative registered under the Cooperatives Act with CIPC.',
  },
  other_formal: {
    title: 'Other Formally Listed Entity',
    description: 'Statutory board, educational institution, or government agency.',
  },
};

export function formatRegistrationType(type?: BusinessRegistrationType): string {
  if (!type) return 'Unspecified';
  return BUSINESS_REGISTRATION_TYPE_LABELS[type]?.title || type;
}

export interface EmployerProfile {
  uid: string;
  businessName: string;
  industry: string;
  description: string;
  locationArea: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  contactEmail: string;
  createdAt: string;
  // Formal Business Verification details (Anti-Fraud & CIPC compliance)
  verificationDetails?: BusinessVerificationDetails;
  // Section 39: Employer Subscription Plan & Sustainability
  plan?: 'free' | 'starter' | 'business' | 'partner';
  planStatus?: 'active' | 'upgrade_pending' | 'demo_request' | 'declined';
  planSince?: string;
  planExpiresAt?: string;
}

export interface EmployerUpgradeRequest {
  id: string;
  employerUid: string;
  businessName: string;
  targetPlan: 'starter' | 'business' | 'partner';
  contactName: string;
  billingEmail: string;
  poNumber?: string;
  status: 'pending' | 'approved' | 'declined' | 'invoiced' | 'active';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
}

export interface EmployerDowngradeRequest {
  id: string;
  employerUid: string;
  businessName: string;
  currentPlan: 'free' | 'starter' | 'business' | 'partner';
  targetPlan: 'free' | 'starter' | 'business';
  reason?: string;
  requestedAt: string;
  status: 'completed' | 'pending';
}

export interface PricingPulseSurveyResponse {
  id: string;
  employerUid: string;
  q1FairPrice: 'Too high' | 'Fair' | 'Too low';
  q2UpgradeDrivers: string[];
  q3AnnualDiscount: 'Yes' | 'No' | 'Maybe, once verified';
  q4CheaperPlan?: string;
  submittedAt: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  category:
    | 'Technical & Trades'
    | 'Hospitality & Retail'
    | 'Digital & Admin'
    | 'Care & Community'
    | 'Logistics & Driving'
    | 'Creative & Beauty'
    | 'Agriculture & Environment'
    | string;
  assessmentTemplateId?: string;
  description: string;
  active: boolean;
}

export type CredentialCheckStatus = 'unchecked' | 'checked_ok' | 'checked_mismatch' | 'needs_review';
export type CredentialCategory = 'proctored_exam' | 'course_badge' | 'trade_certificate' | 'other';

export interface CredentialEvidence {
  id: string;
  type: 'credential';
  issuer: string;
  credentialName: string;
  credentialId?: string; // Optional (Section 35.2, 35.7)
  verifyUrl?: string; // Optional, https only
  issuedOn?: string; // Optional ISO date
  expiresOn?: string; // Optional ISO date
  fileRef?: string; // Optional Storage path or preview URL
  credentialCategory?: CredentialCategory;
  isAccredited?: boolean; // Strictly for confirmed SAQA-registered qualifications (Section 35.4)
  checkStatus: CredentialCheckStatus; // Server/admin written only
  checkedBy?: string; // Server/admin UID
  checkedAt?: string; // Server ISO timestamp
  checkNote?: string; // Assessor verification or mismatch audit note
  duplicateHash?: string; // Salted hash for cross-account duplicate detection
  associatedSkills?: string[]; // Multiple skills covered by this single badge/certificate
}

export interface EvidenceItem {
  id: string;
  type: 'document_pdf' | 'photo' | 'photo_video' | 'work_sample' | 'certificate' | 'reference_letter' | 'link' | 'credential';
  title: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number | string;
  mimeType?: string;
  description?: string;
  uploadedAt: string;
  credential?: CredentialEvidence;
}

export interface EvidenceAnalysisResult {
  summary: string;
  extractedFacts: string[];
  matchedCredentials: {
    institutionName?: string;
    certificateTitle?: string;
    issueDate?: string;
    candidateNameMatched?: boolean;
  };
  criteriaFindings: {
    technicalExecution: string;
    safetyCompliance: string;
    equipmentCare: string;
    efficiencyTroubleshooting: string;
  };
  suggestedScores: {
    crit1: number;
    crit2: number;
    crit3: number;
    crit4: number;
    total: number;
  };
  assessorGuidance: string;
  analyzedAt: string;
}

export interface SkillClaim {
  id: string;
  candidateId: string;
  skillId: string;
  skillName: string;
  selfReportedLevel: 'Beginner' | 'Intermediate' | 'Proficient';
  evidenceType: 'photo_video' | 'client_review' | 'reference_note' | 'work_sample' | 'practical_demo';
  evidenceTitle: string;
  evidenceDescription: string;
  evidenceUrlOrText: string;
  evidenceItems?: EvidenceItem[];
  credentials?: CredentialEvidence[];
  aiAnalysis?: EvidenceAnalysisResult;
  verificationStatus: VerificationStatus;
  peerEndorserName?: string;
  peerEndorserContact?: string;
  peerEndorsementId?: string;
  mentorReviewId?: string;
  mentorName?: string;
  assessmentId?: string;
  createdAt: string;
}

export interface PeerEndorsement {
  id: string;
  claimId: string;
  candidateId: string;
  candidateName: string;
  skillName: string;
  endorserName: string;
  endorserRole: string;
  relationship: string;
  comments: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  confirmedAt?: string;
}

export interface MentorReview {
  id: string;
  claimId: string;
  candidateId: string;
  candidateName: string;
  skillName: string;
  mentorId: string;
  mentorName: string;
  organization?: string;
  feedback: string;
  decision: 'approved' | 'needs_more_evidence' | 'rejected';
  createdAt: string;
  reviewedAt: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  score: number;
  passed: boolean;
  notes?: string;
}

export interface AssessmentRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  skillId: string;
  skillName: string;
  rubricVersion: string;
  score: number; // 0 - 100
  criteria: RubricCriterion[];
  assessorId: string;
  assessorName: string;
  decision: 'approved' | 'revision_requested' | 'rejected';
  feedback: string;
  aiAnalysis?: EvidenceAnalysisResult;
  createdAt: string;
}

export interface SkillPassport {
  candidateId: string;
  candidateName: string;
  version: string;
  summary: string;
  publishedAt: string;
  visibility: 'public' | 'shortlisted_only';
  claims: SkillClaim[];
}

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  employerVerified: boolean;
  title: string;
  description: string;
  responsibilities: string[];
  requiredSkillIds: string[];
  requiredSkillNames: string[];
  locationArea: string;
  workMode: WorkMode;
  compensationAmount: number;
  compensationCurrency: 'ZAR';
  compensationUnit: CompensationUnit;
  engagementType?: EngagementType;
  startDate: string;
  endDate?: string;
  applicationDeadline: string;
  status: 'open' | 'closed' | 'flagged';
  reportCount: number;
  createdAt: string;
}

export interface MatchBreakdown {
  totalScore: number; // 0 - 100
  skillAlignment: number; // S: 0 - 100 (50% weight)
  evidenceStrength: number; // E: 0 - 100 (25% weight)
  availabilityFit: number; // A: 0 - 100 (15% weight)
  locationFit: number; // L: 0 - 100 (10% weight)
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  improvementTips: string[];
  estimatedDistanceKm?: number | null;
  distanceLabel?: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  candidateId: string;
  candidateName: string;
  candidateHeadline: string;
  candidateLocation: string;
  candidateAvailability: AvailabilityType;
  status: ApplicationStatus;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  engagementType?: EngagementType;
  submittedAt: string;
  updatedAt: string;
  employerNotes?: string;
  payoutConfirmed?: boolean;
  paidAt?: string;
  hoursWorked?: number;
  workDurationLabel?: string;
  payoutAmountZAR?: number;
  payRateAmount?: number;
  payRateUnit?: 'hour' | 'day' | 'week' | 'fortnight' | 'month' | 'hourly' | 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'fixed';
  actualTimeInWorkplace?: string;
  actualHoursWorked?: number;
  actualDaysWorked?: number;
  daysOffAndLeave?: number;
  daysOffLeaveLabel?: string;
  employmentStartDate?: string;
  employmentEndDate?: string;
}

export interface PayoutConfirmationDetails {
  payRateAmount?: number;
  payRateUnit?: 'hour' | 'day' | 'week' | 'fortnight' | 'month' | 'hourly' | 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'fixed';
  actualTimeInWorkplace?: string;
  actualHoursWorked?: number;
  actualDaysWorked?: number;
  daysOffAndLeave?: number;
  daysOffLeaveLabel?: string;
  employmentStartDate?: string;
  employmentEndDate?: string;
  hoursWorked?: number;
  workDurationLabel?: string;
  exactAmountZAR?: number;
  notes?: string;
}

export interface WorkRecord {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  employerId: string;
  employerName: string;
  completionStatus: 'completed' | 'disputed';
  employerConfirmed: boolean;
  payoutConfirmed: boolean;
  amountZAR: number;
  feedback: string;
  confirmedAt: string;
  payRateAmount?: number;
  payRateUnit?: 'hour' | 'day' | 'week' | 'fortnight' | 'month' | 'hourly' | 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'fixed';
  actualTimeInWorkplace?: string;
  actualHoursWorked?: number;
  actualDaysWorked?: number;
  daysOffAndLeave?: number;
  daysOffLeaveLabel?: string;
  employmentStartDate?: string;
  employmentEndDate?: string;
  hoursWorked?: number;
  workDurationLabel?: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterRole: Role;
  targetType: 'job' | 'candidate' | 'claim';
  targetId: string;
  targetTitle: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface PrivacyDeletionRequest {
  uid: string;
  status: 'pending' | 'in_review' | 'declined';
  requestedAt: string;
  updatedAt: string;
  reviewedBy?: string;
}

export type NotificationType =
  | 'application_status'
  | 'matching_job'
  | 'assessment_result'
  | 'endorsement_request'
  | 'transport_update'
  | 'mentor_message';

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPreferences {
  application_status: boolean;
  matching_job: boolean;
  assessment_result: boolean;
  endorsement_request: boolean;
  transport_update: boolean;
  mentor_message: boolean;
}

export interface FeedbackRecord {
  id: string;
  userId: string;
  userRole: Role;
  userName: string;
  rating: number; // 1 to 5
  workedWell: string;
  needsImprovement: string;
  createdAt: string;
}


