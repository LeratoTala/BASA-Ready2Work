import React, { useState } from 'react';
import { X, MapPin, Calendar, Clock, DollarSign, Award, CheckCircle2, AlertTriangle, ShieldCheck, Flag, Check, ChevronRight } from 'lucide-react';
import { CandidateProfile, Job, MatchBreakdown, SkillClaim } from '../../../domain/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  candidate: CandidateProfile;
  claims: SkillClaim[];
  matchBreakdown: MatchBreakdown;
  hasApplied: boolean;
  onApply: (jobId: string) => void | Promise<unknown>;
  onReport: (jobId: string, title: string, reason: string) => void;
}

export const OpportunityDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  job,
  candidate,
  claims,
  matchBreakdown,
  hasApplied,
  onApply,
  onReport,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showApplyPreview, setShowApplyPreview] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  if (!isOpen || !job) return null;

  const handleApplyClick = () => {
    setApplyError(null);
    setShowApplyPreview(true);
  };

  const handleConfirmApplication = async () => {
    setIsSubmittingApplication(true);
    setApplyError(null);
    try {
      await onApply(job.id);
      setShowApplyPreview(false);
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    onReport(job.id, job.title, reportReason.trim());
    setReportSuccess(true);
    setTimeout(() => {
      setShowReportForm(false);
      setReportSuccess(false);
      setReportReason('');
    }, 2000);
  };

  const isClosed = job.status === 'closed' || job.status === 'flagged';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 border-b border-stone-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                  {job.workMode}
                </span>
                {job.status === 'open' ? (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                    Open & Accepting Applications
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-red-400 bg-red-950/60 border border-red-800 px-2 py-0.5 rounded">
                    Closed / Suspended
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">{job.title}</h3>
              <p className="text-xs text-stone-300 font-medium">{job.employerName}</p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Job Meta Bar */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-800/80 rounded-lg p-3 text-xs border border-stone-700/60">
            <div>
              <span className="text-stone-400 block">Compensation</span>
              <span className="font-bold text-amber-400 text-sm">
                R{job.compensationAmount}{' '}
                <span className="text-[11px] font-normal text-stone-300">/ {job.compensationUnit}</span>
              </span>
            </div>
            <div>
              <span className="text-stone-400 block">Location</span>
              <span className="font-medium text-white">{job.locationArea}</span>
              {matchBreakdown.distanceLabel && (
                <span className="text-[10px] text-amber-300 block font-normal">
                  {matchBreakdown.distanceLabel}
                </span>
              )}
            </div>
            <div>
              <span className="text-stone-400 block">Start Date</span>
              <span className="font-medium text-white">{job.startDate}</span>
            </div>
            <div>
              <span className="text-stone-400 block">Deadline</span>
              <span className="font-medium text-white">{job.applicationDeadline}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Never pay to get a job. Report any listing that asks for an upfront fee.
        </div>

        {/* Explainable Match Score Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-sm flex items-center justify-center">
              {matchBreakdown.totalScore}%
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">Match Compatibility Score</h4>
              <p className="text-[11px] text-stone-600">
                Formula: S (50%) + E (25%) + A (15%) + L (10%)
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 cursor-pointer"
          >
            {showBreakdown ? 'Hide Breakdown' : 'Why this score? (Explain)'}
          </button>
        </div>

        {/* Match Breakdown Detailed View (Section 7.1) */}
        {showBreakdown && (
          <div className="bg-stone-50 border-b border-stone-200 p-5 text-xs space-y-3">
            <h5 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              Transparent Matching Breakdown (Formula 7.1)
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <span className="text-stone-500 block">Skill Alignment (S)</span>
                <span className="text-base font-bold text-stone-900">{matchBreakdown.skillAlignment}%</span>
                <span className="text-[10px] text-stone-400 block">50% weight</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <span className="text-stone-500 block">Evidence Credibility (E)</span>
                <span className="text-base font-bold text-emerald-700">{matchBreakdown.evidenceStrength}%</span>
                <span className="text-[10px] text-stone-400 block">25% weight</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <span className="text-stone-500 block">Availability Fit (A)</span>
                <span className="text-base font-bold text-stone-900">{matchBreakdown.availabilityFit}%</span>
                <span className="text-[10px] text-stone-400 block">15% weight</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-stone-200">
                <span className="text-stone-500 block">Location Fit (L)</span>
                <span className="text-base font-bold text-stone-900">{matchBreakdown.locationFit}%</span>
                <span className="text-[10px] text-stone-400 block">10% weight</span>
                {matchBreakdown.distanceLabel && (
                  <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">
                    {matchBreakdown.distanceLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="font-semibold text-stone-800 block">Match Drivers:</span>
              {matchBreakdown.reasons.map((r, i) => (
                <p key={i} className="text-stone-600 flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1 shrink-0" />
                  <span>{r}</span>
                </p>
              ))}
            </div>

            {matchBreakdown.improvementTips.length > 0 && (
              <div className="bg-white rounded p-2.5 border border-amber-200 text-amber-900 space-y-1">
                <span className="font-semibold text-[11px] block">How to boost your score for this role:</span>
                {matchBreakdown.improvementTips.map((tip, idx) => (
                  <p key={idx} className="text-[11px] text-stone-700">· {tip}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Job Body */}
        <div className="p-6 space-y-5 max-h-[50vh] overflow-y-auto text-xs text-stone-700">
          <div>
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
              Opportunity Overview
            </h4>
            <p className="leading-relaxed text-stone-700">{job.description}</p>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
              Responsibilities & Tasks
            </h4>
            <ul className="space-y-1">
              {job.responsibilities.map((resp, i) => (
                <li key={i} className="flex items-start gap-2 text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1.5">
              Required Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkillNames.map((s, idx) => {
                const candidateHas = claims.some(
                  (c) => c.skillName.toLowerCase() === s.toLowerCase()
                );
                return (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded text-xs font-medium border ${
                      candidateHas
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {s} {candidateHas ? '✓ (in your passport)' : '(missing)'}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Reporting Section (FR-08, FR-12) */}
          <div className="border-t border-stone-200 pt-4 flex items-center justify-between">
            <span className="text-stone-500">Notice anything suspicious or misleading?</span>
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="text-stone-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Listing</span>
            </button>
          </div>

          {showReportForm && (
            <form onSubmit={handleReportSubmit} className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-2">
              <span className="font-semibold text-stone-800 block">Report Reason</span>
              <p className="text-stone-500 text-[11px]">
                Under BASA policies, employers may never charge upfront registration or training fees.
              </p>
              <textarea
                rows={2}
                required
                placeholder="e.g. Employer requested R150 kit fee, or misleading wage details..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded bg-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-2.5 py-1 text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-xs"
                >
                  Submit Report
                </button>
              </div>
              {reportSuccess && (
                <p className="text-emerald-700 text-xs font-semibold">
                  Report submitted. Admin moderation team will review this listing.
                </p>
              )}
            </form>
          )}

          {applyError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              {applyError}
            </div>
          )}

          {showApplyPreview && (
            <section className="border border-amber-300 bg-amber-50 p-4 space-y-3" aria-labelledby="application-preview-title">
              <div>
                <h4 id="application-preview-title" className="font-bold text-stone-900 text-sm">What this employer will see</h4>
                <p className="text-stone-700 mt-1">This application shares the following with {job.employerName}:</p>
              </div>
              <ul className="list-disc pl-5 text-stone-700 space-y-1">
                <li>{candidate.fullName}, {candidate.headline || 'your profile headline'}, broad area ({candidate.locationArea}), and availability</li>
                <li>Your match score and the skills that match or are missing</li>
                {candidate.popiaVisibility === 'private' ? (
                  <li>Your Skill Passport and evidence are private and will not be shared</li>
                ) : (
                  <li>Your skill labels, evidence titles and descriptions allowed by your Skill Passport visibility</li>
                )}
              </ul>
              <p className="text-stone-700">
                Your email and phone number stay private unless this employer shortlists you. You can change Skill Passport visibility in your profile.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyPreview(false)}
                  className="px-3 py-2 text-xs font-semibold text-stone-700 border border-stone-300 bg-white"
                >
                  Go back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApplication}
                  disabled={isSubmittingApplication}
                  className="px-3 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800"
                >
                  {isSubmittingApplication ? 'Submitting…' : 'Confirm and apply'}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Footer Application Action */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            Applying sends your <strong>Skill Passport</strong> directly to {job.employerName}.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              Close
            </button>

            {hasApplied ? (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 text-stone-700 font-semibold text-xs rounded-lg">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Application Submitted (Active)</span>
              </div>
            ) : isClosed ? (
              <button
                disabled
                className="px-4 py-2 bg-stone-200 text-stone-500 font-semibold text-xs rounded-lg cursor-not-allowed"
              >
                Listing Closed
              </button>
            ) : (
              <button
                onClick={handleApplyClick}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>Apply with Skill Passport</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
