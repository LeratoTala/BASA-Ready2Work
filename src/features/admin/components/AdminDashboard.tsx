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
} from 'lucide-react';
import {
  AssessmentRecord,
  CandidateProfile,
  Job,
  ModerationReport,
  RubricCriterion,
  SkillClaim,
  User,
} from '../../../domain/types';

interface Props {
  assessorId: string;
  assessorName: string;
  claims: SkillClaim[];
  candidateProfiles: Record<string, CandidateProfile>;
  assessments: AssessmentRecord[];
  jobs: Job[];
  reports: ModerationReport[];
  onSubmitAssessment: (assessment: Omit<AssessmentRecord, 'id' | 'createdAt'>, claimId: string) => void;
  onResolveReport: (reportId: string, action: 'dismiss' | 'suspend_job') => void;
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
  onSubmitAssessment,
  onResolveReport,
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

    const criteria: RubricCriterion[] = [
      {
        id: 'c1',
        title: 'Core Technical Execution',
        description: 'Performs procedure according to standard industry benchmarks.',
        maxPoints: 25,
        score: rubricScores.crit1,
        passed: rubricScores.crit1 >= 18,
      },
      {
        id: 'c2',
        title: 'Safety, PPE & Protocol Compliance',
        description: 'Adheres strictly to workshop safety, electrical isolation, or hygiene.',
        maxPoints: 25,
        score: rubricScores.crit2,
        passed: rubricScores.crit2 >= 18,
      },
      {
        id: 'c3',
        title: 'Tool & Equipment Care',
        description: 'Uses appropriate instruments, cleans workstation, prevents damage.',
        maxPoints: 25,
        score: rubricScores.crit3,
        passed: rubricScores.crit3 >= 18,
      },
      {
        id: 'c4',
        title: 'Efficiency & Troubleshooting',
        description: 'Demonstrates confidence, speed, and handles minor defects appropriately.',
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
        rubricVersion: 'v1.0',
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
                    <span className="font-bold text-stone-900 text-sm block">
                      {candidate?.fullName || 'Candidate'}
                    </span>
                    <span className="text-stone-500 font-medium">{claim.skillName}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      isAssessed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {claim.verificationStatus}
                  </span>
                </div>

                <p className="text-stone-600 bg-stone-50 p-2 rounded">{claim.evidenceDescription}</p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-400">
                    Logged: {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedClaimForGrading(claim)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs cursor-pointer"
                  >
                    {isAssessed ? 'Re-grade Rubric' : 'Grade Against Rubric'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Rubric Grading Drawer / Form */}
        {selectedClaimForGrading && (
          <form
            onSubmit={handleGradeSubmit}
            className="mt-6 bg-stone-50 rounded-xl p-5 border border-amber-300 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Rubric Assessment: {selectedClaimForGrading.skillName}
                </h3>
                <p className="text-stone-500">
                  Candidate: {candidateProfiles[selectedClaimForGrading.candidateId]?.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaimForGrading(null)}
                className="text-stone-500 hover:text-stone-800"
              >
                Cancel
              </button>
            </div>

            {/* 4 Rubric Criteria (25 pts each = 100 total) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border border-stone-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800">1. Core Technical Execution</label>
                  <span className="font-bold text-stone-900">{rubricScores.crit1}/25</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Proper technique, measurement calibration, sequence of operations.
                </p>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={rubricScores.crit1}
                  onChange={(e) => setRubricScores({ ...rubricScores, crit1: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="bg-white p-3 rounded border border-stone-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800">2. Safety, PPE & Protocols</label>
                  <span className="font-bold text-stone-900">{rubricScores.crit2}/25</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  PPE compliance, harness / electrical isolation, food hygiene.
                </p>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={rubricScores.crit2}
                  onChange={(e) => setRubricScores({ ...rubricScores, crit2: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="bg-white p-3 rounded border border-stone-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800">3. Tool & Machine Handling</label>
                  <span className="font-bold text-stone-900">{rubricScores.crit3}/25</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Cleanliness, correct tool torque, zero damage to materials.
                </p>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={rubricScores.crit3}
                  onChange={(e) => setRubricScores({ ...rubricScores, crit3: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="bg-white p-3 rounded border border-stone-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-800">4. Pace, Speed & Problem Solving</label>
                  <span className="font-bold text-stone-900">{rubricScores.crit4}/25</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Calmness under pressure, reasonable turnaround time.
                </p>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={rubricScores.crit4}
                  onChange={(e) => setRubricScores({ ...rubricScores, crit4: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Total Score preview */}
            <div className="flex items-center justify-between bg-white p-3 rounded border border-stone-200">
              <div>
                <span className="font-bold text-stone-900 text-sm">Total Rubric Score: {totalScore} / 100</span>
                <p className="text-[11px] text-stone-500">
                  Passing threshold is 70 points to earn official "Task-assessed" passport status.
                </p>
              </div>
              <span
                className={`font-bold px-3 py-1 rounded text-xs ${
                  totalScore >= 70
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {totalScore >= 70 ? 'PASS (Approved)' : 'REVISION NEEDED'}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Assessor Notes & Transparent Feedback
              </label>
              <textarea
                rows={2}
                required
                value={assessorFeedback}
                onChange={(e) => setAssessorFeedback(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedClaimForGrading(null)}
                className="px-3 py-1.5 text-stone-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-xs shadow-xs"
              >
                Submit Rubric & Certify Claim
              </button>
            </div>
          </form>
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
    </div>
  );
};
