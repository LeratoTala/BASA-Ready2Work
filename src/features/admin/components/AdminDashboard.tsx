import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart3,
  Flag,
  UserCheck,
  Building2,
  Check,
  Users,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Ban,
  CheckCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import {
  AssessmentRecord,
  CandidateProfile,
  EmployerProfile,
  Job,
  MentorReview,
  ModerationReport,
  PeerEndorsement,
  PrivacyDeletionRequest,
  RubricCriterion,
  SkillClaim,
  User,
} from '../../../domain/types';
import { getRubricForSkill } from '../../../domain/rubrics';

interface Props {
  assessorId: string;
  assessorName: string;
  claims: SkillClaim[];
  candidateProfiles: Record<string, CandidateProfile>;
  employerProfiles?: Record<string, EmployerProfile>;
  assessments: AssessmentRecord[];
  jobs: Job[];
  reports: ModerationReport[];
  privacyDeletionRequests: PrivacyDeletionRequest[];
  endorsements?: PeerEndorsement[];
  mentorReviews?: MentorReview[];
  onSubmitAssessment: (assessment: Omit<AssessmentRecord, 'id' | 'createdAt'>, claimId: string) => void;
  onResolveReport: (reportId: string, action: 'dismiss' | 'suspend_job') => void;
  onReviewPrivacyDeletionRequest: (uid: string, status: 'in_review' | 'declined') => Promise<void>;
  onCompletePrivacyDeletion?: (uid: string) => Promise<void>;
  onVerifyEmployer?: (uid: string, status: 'verified' | 'unverified') => Promise<void>;
  onApproveEndorsement?: (endorsementId: string) => Promise<void>;
  onSubmitMentorReview?: (
    claimId: string,
    params: {
      mentorName: string;
      organization?: string;
      feedback: string;
      decision: 'approved' | 'needs_more_evidence' | 'rejected';
    }
  ) => Promise<any>;
  onToggleJobStatus?: (jobId: string) => void;
  activeSubTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  assessorId,
  assessorName,
  claims,
  candidateProfiles,
  employerProfiles = {},
  assessments,
  jobs,
  reports,
  privacyDeletionRequests,
  endorsements = [],
  mentorReviews = [],
  onSubmitAssessment,
  onResolveReport,
  onReviewPrivacyDeletionRequest,
  onCompletePrivacyDeletion,
  onVerifyEmployer,
  onApproveEndorsement,
  onSubmitMentorReview,
  onToggleJobStatus,
  activeSubTab = 'overview',
  onSelectSubTab,
}) => {
  const [selectedClaimForGrading, setSelectedClaimForGrading] = useState<SkillClaim | null>(null);
  const [jobFilter, setJobFilter] = useState<'all' | 'open' | 'closed' | 'flagged'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [deletionWorking, setDeletionWorking] = useState<string | null>(null);
  const [verifyWorking, setVerifyWorking] = useState<string | null>(null);
  const [rubricScores, setRubricScores] = useState({
    crit1: 24,
    crit2: 23,
    crit3: 25,
    crit4: 22,
  });
  const [assessorFeedback, setAssessorFeedback] = useState(
    'Demonstrated proper workstation hygiene, correct sequence of execution, and good safety precautions.'
  );
  const [assessmentSuccess, setAssessmentSuccess] = useState<string | null>(null);

  // Pilot metrics calculation per Section 13.1
  const candidateCount = Object.keys(candidateProfiles).length;
  const businessCount = new Set(jobs.map((j) => j.employerId)).size;
  const openJobsCount = jobs.filter((j) => j.status === 'open').length;
  const taskAssessedCount = claims.filter((c) => c.verificationStatus === 'Task-assessed').length;
  const pendingEndorsementCount = endorsements.filter((e) => e.status === 'pending').length;
  const pendingReportCount = reports.filter((r) => r.status === 'pending').length;
  const pendingEmployerCount = Object.values(employerProfiles).filter((e) => e.verificationStatus === 'pending').length;

  const totalScore = rubricScores.crit1 + rubricScores.crit2 + rubricScores.crit3 + rubricScores.crit4;

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimForGrading) return;

    const candidate = candidateProfiles[selectedClaimForGrading.candidateId];
    const decision = totalScore >= 70 ? 'approved' : 'revision_requested';
    const rubricTemplate = getRubricForSkill(
      selectedClaimForGrading.skillId,
      selectedClaimForGrading.skillName
    );

    const criteria: RubricCriterion[] = [
      {
        id: 'c1',
        title: rubricTemplate.criteria[0]?.title || 'Core Technical Execution',
        description: rubricTemplate.criteria[0]?.description || 'Performs procedure according to standard industry benchmarks.',
        maxPoints: 25,
        score: rubricScores.crit1,
        passed: rubricScores.crit1 >= 18,
      },
      {
        id: 'c2',
        title: rubricTemplate.criteria[1]?.title || 'Safety, PPE & Protocol Compliance',
        description: rubricTemplate.criteria[1]?.description || 'Adheres strictly to workshop safety, electrical isolation, or hygiene.',
        maxPoints: 25,
        score: rubricScores.crit2,
        passed: rubricScores.crit2 >= 18,
      },
      {
        id: 'c3',
        title: rubricTemplate.criteria[2]?.title || 'Tool & Equipment Care',
        description: rubricTemplate.criteria[2]?.description || 'Uses appropriate instruments, cleans workstation, prevents damage.',
        maxPoints: 25,
        score: rubricScores.crit3,
        passed: rubricScores.crit3 >= 18,
      },
      {
        id: 'c4',
        title: rubricTemplate.criteria[3]?.title || 'Efficiency & Troubleshooting',
        description: rubricTemplate.criteria[3]?.description || 'Demonstrates confidence, speed, and handles minor defects appropriately.',
        maxPoints: 25,
        score: rubricScores.crit4,
        passed: rubricScores.crit4 >= 18,
      },
    ];

    onSubmitAssessment(
      {
        candidateId: selectedClaimForGrading.candidateId,
        candidateName: candidate?.fullName || 'Candidate',
        skillId: selectedClaimForGrading.skillId,
        skillName: selectedClaimForGrading.skillName,
        rubricVersion: 'v1.0-standard',
        score: totalScore,
        criteria,
        assessorId,
        assessorName,
        decision,
        feedback: assessorFeedback,
      },
      selectedClaimForGrading.id
    );

    setAssessmentSuccess(
      `Assessment recorded! Claim for "${selectedClaimForGrading.skillName}" upgraded to Task-assessed (Score: ${totalScore}/100).`
    );
    setSelectedClaimForGrading(null);
    setTimeout(() => setAssessmentSuccess(null), 4000);
  };

  const handleToggleJob = (jobId: string, title: string, currentStatus: string) => {
    if (!onToggleJobStatus) return;
    onToggleJobStatus(jobId);
    const newStatus = currentStatus === 'open' ? 'closed/suspended' : 'reopened/active';
    setActionNotice(`Listing "${title}" marked as ${newStatus}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredJobs = jobs.filter((job) => {
    if (jobFilter === 'all') return true;
    if (jobFilter === 'open') return job.status === 'open';
    if (jobFilter === 'closed') return job.status === 'closed';
    if (jobFilter === 'flagged') return job.status === 'flagged';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-stone-900 text-white rounded-xl p-6 shadow-md border border-stone-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
              Admin & Assessor Workspace
            </span>
            <span className="text-xs text-stone-400">Assessor: {assessorName}</span>
          </div>

          {/* Quick Sub-tab selector */}
          <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-lg border border-stone-700 text-xs">
            <button
              onClick={() => onSelectSubTab?.('overview')}
              className={`px-2.5 py-1 rounded cursor-pointer font-medium transition-colors ${
                activeSubTab === 'overview' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onSelectSubTab?.('jobs')}
              className={`px-2.5 py-1 rounded cursor-pointer font-medium transition-colors ${
                activeSubTab === 'jobs' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              Jobs ({jobs.length})
            </button>
            <button
              onClick={() => onSelectSubTab?.('employers')}
              className={`px-2.5 py-1 rounded cursor-pointer font-medium transition-colors ${
                activeSubTab === 'employers' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              Employers {pendingEmployerCount > 0 && <span className="ml-1 bg-rose-500 text-white text-[9px] px-1 rounded-full">{pendingEmployerCount}</span>}
            </button>
            <button
              onClick={() => onSelectSubTab?.('assessments')}
              className={`px-2.5 py-1 rounded cursor-pointer font-medium transition-colors ${
                activeSubTab === 'assessments' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              Rubrics & Verification
            </button>
            <button
              onClick={() => onSelectSubTab?.('reports')}
              className={`px-2.5 py-1 rounded cursor-pointer font-medium transition-colors ${
                activeSubTab === 'reports' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:text-white'
              }`}
            >
              Moderation ({reports.length})
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          {activeSubTab === 'jobs' && 'Live Job Opportunities & Verification'}
          {activeSubTab === 'employers' && 'Employer Verification'}
          {activeSubTab === 'assessments' && 'Practical Rubrics, Endorsements & Mentor Reviews'}
          {activeSubTab === 'reports' && 'Community Moderation & Safety Reports'}
          {(activeSubTab === 'overview' || !activeSubTab) && 'Pilot Overview & Quality Control'}
        </h1>
        <p className="text-stone-300 text-xs">
          {activeSubTab === 'jobs' && 'Inspect pay terms, verify employer job listings, and suspend deceptive or exploitative posts.'}
          {activeSubTab === 'employers' && 'Review pending employer registrations and grant or revoke verified status.'}
          {activeSubTab === 'assessments' && 'Grade candidate demonstrations against 100-point rubrics and approve peer contractor endorsements.'}
          {activeSubTab === 'reports' && 'Protect young jobseekers from scam postings, upfront fees, and handle POPIA account deletion tickets.'}
          {(activeSubTab === 'overview' || !activeSubTab) && 'Monitor pilot metrics against FNB App of the Year targets and review key platform operations.'}
        </p>
      </div>

      {actionNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {assessmentSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{assessmentSuccess}</span>
        </div>
      )}

      {/* ==================== TAB 1: PILOT OVERVIEW ==================== */}
      {(activeSubTab === 'overview' || !activeSubTab) && (
        <div className="space-y-6">
          {/* Pilot Targets Metric Cards (Section 13.1) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1 shadow-xs">
              <span className="text-xs text-stone-500 block">Candidate Profiles</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-stone-900">{candidateCount}</span>
                <span className="text-xs text-stone-400">/ Target 20</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (candidateCount / 20) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1 shadow-xs">
              <span className="text-xs text-stone-500 block">Participating Businesses</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-stone-900">{businessCount}</span>
                <span className="text-xs text-stone-400">/ Target 3</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (businessCount / 3) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1 shadow-xs">
              <span className="text-xs text-stone-500 block">Open Paid Opportunities</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-stone-900">{openJobsCount}</span>
                <span className="text-xs text-stone-400">/ Target 3-5</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (openJobsCount / 4) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1 shadow-xs">
              <span className="text-xs text-stone-500 block">Task-Assessed Skills</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-800">{taskAssessedCount}</span>
                <span className="text-xs text-stone-400">Rigorous Rubrics</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `75%` }} />
              </div>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900">Live Jobs & Pay Terms</h3>
                <p className="text-xs text-stone-500 mt-1">
                  {jobs.length} total listings ({openJobsCount} active). Ensure clear ZAR pay and no scam upfront fees.
                </p>
              </div>
              <button
                onClick={() => onSelectSubTab?.('jobs')}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 cursor-pointer text-center block"
              >
                Review & Verify Jobs →
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900">Rubric Assessments</h3>
                <p className="text-xs text-stone-500 mt-1">
                  {claims.length} candidate claims, {pendingEndorsementCount} pending endorsements waiting for approval.
                </p>
              </div>
              <button
                onClick={() => onSelectSubTab?.('assessments')}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 cursor-pointer text-center block"
              >
                Open Assessor Workspace →
              </button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900">Community Safety & POPIA</h3>
                <p className="text-xs text-stone-500 mt-1">
                  {pendingReportCount} open fraud reports and {privacyDeletionRequests.length} deletion tickets.
                </p>
              </div>
              <button
                onClick={() => onSelectSubTab?.('reports')}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 cursor-pointer text-center block"
              >
                Inspect Moderation Queue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: LIVE JOBS & VERIFICATION ==================== */}
      {activeSubTab === 'jobs' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                Live Job Postings & Moderation ({jobs.length})
              </h2>
              <p className="text-xs text-stone-500">
                Inspect pay terms, verify employer authenticity, and suspend deceptive or fraudulent listings.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setJobFilter('all')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  jobFilter === 'all' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-500'
                }`}
              >
                All ({jobs.length})
              </button>
              <button
                onClick={() => setJobFilter('open')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  jobFilter === 'open' ? 'bg-white shadow-xs text-emerald-800 font-bold' : 'text-stone-500'
                }`}
              >
                Open ({openJobsCount})
              </button>
              <button
                onClick={() => setJobFilter('closed')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  jobFilter === 'closed' ? 'bg-white shadow-xs text-stone-800 font-bold' : 'text-stone-500'
                }`}
              >
                Closed ({jobs.filter((j) => j.status === 'closed').length})
              </button>
              <button
                onClick={() => setJobFilter('flagged')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  jobFilter === 'flagged' ? 'bg-white shadow-xs text-rose-800 font-bold' : 'text-stone-500'
                }`}
              >
                Flagged ({jobs.filter((j) => j.status === 'flagged').length})
              </button>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-4">No jobs matching selected filter.</p>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-colors text-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-stone-900">{job.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            job.status === 'open'
                              ? 'bg-emerald-100 text-emerald-800'
                              : job.status === 'flagged'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-stone-500 text-[11px]">
                        <span className="flex items-center gap-1 font-medium text-stone-800">
                          <Building2 className="w-3.5 h-3.5 text-stone-400" />
                          {job.employerName}
                          {job.employerVerified && (
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 ml-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          )}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {job.locationArea} ({job.workMode})
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-emerald-800">
                          R{job.compensationAmount.toLocaleString()} / {job.compensationUnit}
                        </span>
                      </div>
                    </div>

                    {/* Admin Status Actions */}
                    <div className="flex items-center gap-2">
                      {onToggleJobStatus && (
                        <button
                          type="button"
                          onClick={() => handleToggleJob(job.id, job.title, job.status)}
                          className={`px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                            job.status === 'open'
                              ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {job.status === 'open' ? (
                            <>
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>Suspend Listing</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                              <span>Reopen Listing</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-stone-700 bg-white p-3 rounded-lg border border-stone-200 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-stone-500 mr-1">Required Skills:</span>
                    {(job.requiredSkillNames || job.requiredSkillIds || []).map((skillName: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-[10px] font-medium"
                      >
                        {skillName}
                      </span>
                    ))}
                    {job.reportCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                        <Flag className="w-3 h-3 text-amber-600" />
                        {job.reportCount} Report(s)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2.5: EMPLOYER VERIFICATION ==================== */}
      {activeSubTab === 'employers' && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                Employer Verification ({Object.values(employerProfiles).length})
              </h2>
              <p className="text-xs text-stone-500">
                Review employer registrations and grant verified status. Verified employers get a
                shield badge on all their job listings.
              </p>
            </div>
          </div>

          {Object.values(employerProfiles).length === 0 ? (
            <p className="text-xs text-stone-500 italic py-4">No employer profiles found.</p>
          ) : (
            <div className="space-y-3">
              {Object.values(employerProfiles).map((emp) => (
                <div
                  key={emp.uid}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 text-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-stone-900">{emp.businessName}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            emp.verificationStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : emp.verificationStatus === 'pending'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {emp.verificationStatus}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-stone-500 text-[11px]">
                        <span>{emp.industry}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {emp.locationArea}
                        </span>
                        <span>·</span>
                        <span>{emp.contactEmail}</span>
                        <span>·</span>
                        <span>Joined {new Date(emp.createdAt).toLocaleDateString()}</span>
                      </div>
                      {emp.description && (
                        <p className="text-stone-600 bg-white p-2 rounded border border-stone-100 mt-1">
                          {emp.description}
                        </p>
                      )}
                    </div>

                    {onVerifyEmployer && (
                      <div className="flex items-center gap-2 shrink-0">
                        {emp.verificationStatus !== 'verified' && (
                          <button
                            type="button"
                            disabled={verifyWorking === emp.uid}
                            onClick={async () => {
                              setVerifyWorking(emp.uid);
                              try {
                                await onVerifyEmployer(emp.uid, 'verified');
                                setActionNotice(`"${emp.businessName}" has been verified.`);
                                setTimeout(() => setActionNotice(null), 3500);
                              } finally {
                                setVerifyWorking(null);
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{verifyWorking === emp.uid ? 'Verifying…' : 'Grant Verified'}</span>
                          </button>
                        )}
                        {emp.verificationStatus === 'verified' && (
                          <button
                            type="button"
                            disabled={verifyWorking === emp.uid}
                            onClick={async () => {
                              setVerifyWorking(emp.uid);
                              try {
                                await onVerifyEmployer(emp.uid, 'unverified');
                                setActionNotice(`"${emp.businessName}" verification revoked.`);
                                setTimeout(() => setActionNotice(null), 3500);
                              } finally {
                                setVerifyWorking(null);
                              }
                            }}
                            className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Revoke Verified</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: ASSESSOR WORKSPACE (RUBRICS & VERIFICATION) ==================== */}
      {activeSubTab === 'assessments' && (
        <div className="space-y-6">
          {/* Assessor Rubric Workspace (FR-04, FR-05, T-03) */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  Candidate Practical Claims Pending Assessment
                </h2>
                <p className="text-xs text-stone-500">
                  Select any candidate claim to evaluate against the approved 100-point rubric.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {claims.map((claim) => {
                const candidate = candidateProfiles[claim.candidateId];
                const isAssessed = claim.verificationStatus === 'Task-assessed';

                return (
                  <div
                    key={claim.id}
                    className={`p-4 rounded-lg border text-xs space-y-2 transition-all ${
                      selectedClaimForGrading?.id === claim.id
                        ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500'
                        : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-stone-400 block text-[10px]">
                          Candidate: {candidate?.fullName || 'Candidate ' + claim.candidateId}
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm">{claim.skillName}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isAssessed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {claim.verificationStatus}
                      </span>
                    </div>

                    <p className="text-stone-600 bg-stone-50 p-2 rounded line-clamp-2">
                      {claim.evidenceDescription}
                    </p>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClaimForGrading(claim);
                          setRubricScores({ crit1: 22, crit2: 24, crit3: 20, crit4: 21 });
                        }}
                        className={`px-3 py-1.5 rounded font-semibold text-xs cursor-pointer ${
                          selectedClaimForGrading?.id === claim.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-800 text-white hover:bg-stone-700'
                        }`}
                      >
                        {isAssessed ? 'Re-evaluate Rubric' : 'Grade Against Rubric'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Claim Grading Form */}
            {selectedClaimForGrading && (
              <form
                onSubmit={handleGradeSubmit}
                className="mt-6 border-t border-stone-200 pt-6 space-y-5 bg-stone-50/60 p-5 rounded-xl border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      Active Scoring Sheet (100-Point Micro-Task Rubric)
                    </span>
                    <h3 className="text-base font-bold text-stone-900">
                      Bench Test Evaluation: {selectedClaimForGrading.skillName}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-stone-900">{totalScore}</span>
                    <span className="text-xs text-stone-500 font-bold"> / 100 pts</span>
                    <span
                      className={`block text-[11px] font-bold ${
                        totalScore >= 70 ? 'text-emerald-700' : 'text-amber-800'
                      }`}
                    >
                      {totalScore >= 70 ? 'Meets Benchmark (Approved)' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-stone-800">1. Core Technical Execution</label>
                      <span className="font-semibold text-amber-700">{rubricScores.crit1}/25</span>
                    </div>
                    <p className="text-[11px] text-stone-500">Benchmark speed, procedure sequence, and accuracy.</p>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={rubricScores.crit1}
                      onChange={(e) => setRubricScores({ ...rubricScores, crit1: Number(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-stone-800">2. Safety, PPE & Protocol</label>
                      <span className="font-semibold text-amber-700">{rubricScores.crit2}/25</span>
                    </div>
                    <p className="text-[11px] text-stone-500">Adheres to PPE standards, isolation rules, and hygiene.</p>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={rubricScores.crit2}
                      onChange={(e) => setRubricScores({ ...rubricScores, crit2: Number(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-stone-800">3. Tool & Equipment Care</label>
                      <span className="font-semibold text-amber-700">{rubricScores.crit3}/25</span>
                    </div>
                    <p className="text-[11px] text-stone-500">Careful handling, cleaning, and prevention of damage.</p>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={rubricScores.crit3}
                      onChange={(e) => setRubricScores({ ...rubricScores, crit3: Number(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-stone-800">4. Troubleshooting & Efficiency</label>
                      <span className="font-semibold text-amber-700">{rubricScores.crit4}/25</span>
                    </div>
                    <p className="text-[11px] text-stone-500">Handled defect detection and time-bound task pacing.</p>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={rubricScores.crit4}
                      onChange={(e) => setRubricScores({ ...rubricScores, crit4: Number(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 text-xs mb-1">Assessor Feedback & Notes</label>
                  <textarea
                    rows={2}
                    required
                    value={assessorFeedback}
                    onChange={(e) => setAssessorFeedback(e.target.value)}
                    className="w-full border border-stone-300 rounded p-2 text-xs bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedClaimForGrading(null)}
                    className="px-3 py-1.5 text-stone-600 hover:text-stone-900 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs shadow-xs"
                  >
                    Submit Rubric Grade ({totalScore}/100)
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Peer Endorsement Review Queue (R3 / FR-19) */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  Peer Endorsement Review Queue ({endorsements.length})
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Verify community contractor, coworker, or supervisor endorsements to upgrade claims to "Peer-endorsed".
                </p>
              </div>
            </div>

            {endorsements.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No peer endorsement requests pending.</p>
            ) : (
              <div className="space-y-3">
                {endorsements.map((end) => (
                  <div
                    key={end.id}
                    className="p-4 rounded-lg border border-stone-200 bg-stone-50 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-stone-900">{end.skillName}</span>
                        <span className="text-stone-500 block text-[11px]">
                          Candidate: <strong>{end.candidateName}</strong> · Endorser: <strong>{end.endorserName}</strong> ({end.endorserRole}, {end.relationship})
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          end.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {end.status}
                      </span>
                    </div>

                    <p className="text-stone-700 bg-white p-2.5 rounded border border-stone-200">
                      <strong>Work Performed / Context:</strong> {end.comments || 'Direct hands-on experience confirmed.'}
                    </p>

                    {end.status === 'pending' && onApproveEndorsement && (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onApproveEndorsement(end.id)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Endorsement & Upgrade Claim</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mentor Reviews Log (R3 / FR-19) */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  Designated Mentor Reviews ({mentorReviews.length})
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  Recorded portfolio reviews by designated youth employment partners.
                </p>
              </div>
            </div>

            {mentorReviews.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No mentor reviews recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {mentorReviews.map((mr) => (
                  <div
                    key={mr.id}
                    className="p-4 rounded-lg border border-stone-200 bg-stone-50 text-xs space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-stone-900">{mr.skillName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          mr.decision === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {mr.decision.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      Mentor: <strong>{mr.mentorName}</strong> ({mr.organization || 'Youth Partner'}) · {new Date(mr.reviewedAt).toLocaleDateString()}
                    </p>
                    <p className="text-stone-700 bg-white p-2 rounded border border-stone-200 mt-1">
                      {mr.feedback}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: MODERATION REPORTS & DELETION ==================== */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Moderation & Fraud Prevention (FR-12, Section 8.3) */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-red-600" />
                  Community Moderation Queue ({reports.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Protect jobseekers from misleading posts, upfront kit fees, or exploitative terms.
                </p>
              </div>
            </div>

            {reports.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No open reports.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-lg border border-stone-200 bg-stone-50 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-stone-900">{rep.targetTitle}</span>
                        <span className="text-stone-400 block text-[11px]">
                          Reported by {rep.reporterRole} on {new Date(rep.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rep.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>

                    <p className="text-stone-700 bg-white p-2.5 rounded border border-stone-200">
                      <strong>Report Reason:</strong> {rep.reason}
                    </p>

                    {rep.status !== 'resolved' && (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => onResolveReport(rep.id, 'dismiss')}
                          className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded font-semibold text-xs cursor-pointer"
                        >
                          Dismiss Report
                        </button>
                        <button
                          onClick={() => onResolveReport(rep.id, 'suspend_job')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-xs cursor-pointer"
                        >
                          Suspend / Flag Listing
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account deletion requests */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-base font-bold text-stone-900">Account deletion requests ({privacyDeletionRequests.length})</h2>
              <p className="text-xs text-stone-500 mt-1">
                Review retention requirements and complete deletion using the operator procedure. The request status does not mean data has been deleted.
              </p>
            </div>
            {privacyDeletionRequests.length === 0 ? (
              <p className="text-xs text-stone-500 italic">No requests.</p>
            ) : (
              <div className="space-y-3">
                {privacyDeletionRequests.map((request) => (
                  <div key={request.uid} className="p-4 border border-stone-200 bg-stone-50 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-stone-900">Account {request.uid}</p>
                      <p className="text-stone-600">Requested {new Date(request.requestedAt).toLocaleDateString()} · Status: {request.status.replace('_', ' ')}</p>
                    </div>
                    {request.status !== 'declined' && (
                      <div className="flex gap-2 flex-wrap">
                        {request.status === 'pending' && (
                          <button onClick={() => void onReviewPrivacyDeletionRequest(request.uid, 'in_review')} className="px-3 py-2 border border-stone-300 bg-white font-semibold text-stone-800 cursor-pointer rounded">
                            Start review
                          </button>
                        )}
                        {request.status === 'in_review' && onCompletePrivacyDeletion && (
                          <button
                            disabled={deletionWorking === request.uid}
                            onClick={async () => {
                              if (!window.confirm(`Permanently delete ALL data for account ${request.uid}? This cannot be undone.`)) return;
                              setDeletionWorking(request.uid);
                              try {
                                await onCompletePrivacyDeletion(request.uid);
                                setActionNotice(`Account ${request.uid} has been permanently deleted (POPIA compliant).`);
                                setTimeout(() => setActionNotice(null), 5000);
                              } catch (err: any) {
                                setActionNotice(`Deletion failed: ${err?.message ?? 'Unknown error'}`);
                              } finally {
                                setDeletionWorking(null);
                              }
                            }}
                            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{deletionWorking === request.uid ? 'Deleting…' : 'Complete Deletion (POPIA)'}</span>
                          </button>
                        )}
                        <button onClick={() => void onReviewPrivacyDeletionRequest(request.uid, 'declined')} className="px-3 py-2 border border-stone-300 bg-white font-semibold text-stone-800 cursor-pointer rounded">
                          Decline request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
