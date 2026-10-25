export type Role = 'candidate' | 'employer' | 'admin';

export type VerificationStatus =
  | 'Self-reported'
  | 'Peer-endorsed'
  | 'Task-assessed'
  | 'Mentor-reviewed';

export type AvailabilityType = 'immediate' | 'part_time' | 'full_time' | 'weekends';

export type WorkMode = 'In-person' | 'Hybrid' | 'Remote';

export type CompensationUnit = 'hourly' | 'daily' | 'fixed';

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

export interface EmployerProfile {
  uid: string;
  businessName: string;
  industry: string;
  description: string;
  locationArea: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  contactEmail: string;
  createdAt: string;
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
  submittedAt: string;
  updatedAt: string;
  employerNotes?: string;
  payoutConfirmed?: boolean;
  paidAt?: string;
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


