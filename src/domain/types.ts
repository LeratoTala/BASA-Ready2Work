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
  category: 'Technical & Trades' | 'Hospitality & Retail' | 'Digital & Admin' | 'Care & Community';
  assessmentTemplateId?: string;
  description: string;
  active: boolean;
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

