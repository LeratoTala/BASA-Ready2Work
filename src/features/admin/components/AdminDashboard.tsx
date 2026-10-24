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
} from 'lucide-react';
import {
  AssessmentRecord,
  CandidateProfile,
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
  assessments: AssessmentRecord[];
  jobs: Job[];
  reports: ModerationReport[];
  privacyDeletionRequests: PrivacyDeletionRequest[];
  endorsements?: PeerEndorsement[];
  mentorReviews?: MentorReview[];
  onSubmitAssessment: (assessment: Omit<AssessmentRecord, 'id' | 'createdAt'>, claimId: string) => void;
  onResolveReport: (reportId: string, action: 'dismiss' | 'suspend_job') => void;
  onReviewPrivacyDeletionRequest: (uid: string, status: 'in_review' | 'declined') => Promise<void>;
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
  activeSubTab: string;
}

export const AdminDashboard: React.FC<Props> = ({
  assessorId,
  assessorName,
  claims,
  candidateProfiles,
  assessments,
  jobs,
  reports,
  privacyDeletionRequests,
  endorsements = [],
  mentorReviews = [],
  onSubmitAssessment,
  onResolveReport,
  onReviewPrivacyDeletionRequest,
  onApproveEndorsement,
  onSubmitMentorReview,
  activeSubTab = 'overview',
}) => {
  const [selectedClaimForGrading, setSelectedClaimForGrading] = useState<SkillClaim | null>(null);
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

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-stone-900 text-white rounded-xl p-6 shadow-md border border-stone-800 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
            Admin & Technical Assessor Workspace
          </span>
          <span className="text-xs text-stone-400">Assessor: {assessorName}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Quality Control, Rubrics & Moderation
        </h1>
        <p className="text-stone-300 text-xs">
          Assess informal candidates against verifiable rubrics, review scam reports, and monitor pilot metrics.
        </p>
      </div>

      {assessmentSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{assessmentSuccess}</span>
        </div>
      )}

      {/* Pilot Targets Metric Cards (Section 13.1) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
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

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
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

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
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

        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
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

      {/* Assessor Rubric Workspace (FR-04, FR-05, T-03) */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
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
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
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
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
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

      {/* Moderation & Fraud Prevention (FR-12, Section 8.3) */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
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
                      className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded font-semibold text-xs"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => onResolveReport(rep.id, 'suspend_job')}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-xs"
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

      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
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
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <button onClick={() => void onReviewPrivacyDeletionRequest(request.uid, 'in_review')} className="px-3 py-2 border border-stone-300 bg-white font-semibold text-stone-800">
                        Start review
                      </button>
                    )}
                    <button onClick={() => void onReviewPrivacyDeletionRequest(request.uid, 'declined')} className="px-3 py-2 border border-stone-300 bg-white font-semibold text-stone-800">
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
  );
};
