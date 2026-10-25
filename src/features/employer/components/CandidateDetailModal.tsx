import { maskEmail, maskPhone, NOT_PROVIDED } from '../../../shared/maskContact';
import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Award,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  FileText,
  Check,
  DollarSign,
  Image as ImageIcon,
  Eye,
  Briefcase,
  Clock,
} from 'lucide-react';
import { Application, ApplicationStatus, CandidateProfile, EvidenceItem, SkillClaim, WorkRecord } from '../../../domain/types';
import { VerificationBadge } from '../../../shared/components/VerificationBadge';
import { VALID_STATUS_TRANSITIONS } from '../../../domain/applicationStatus';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  candidateProfile: CandidateProfile | null;
  candidateClaims: SkillClaim[];
  candidateWorkRecords?: WorkRecord[];
  currentEmployerId: string;
  onUpdateStatus: (
    applicationId: string,
    newStatus: ApplicationStatus,
    employerNotes?: string,
    payoutConfirmed?: boolean
  ) => void;
  onConfirmPayout?: (applicationId: string) => void;
}

export const CandidateDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  application,
  candidateProfile,
  candidateClaims,
  candidateWorkRecords = [],
  currentEmployerId,
  onUpdateStatus,
  onConfirmPayout,
}) => {
  const [employerNotes, setEmployerNotes] = useState(application?.employerNotes || '');
  const [confirmPayout, setConfirmPayout] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<{ item: EvidenceItem; skillName: string } | null>(null);

  if (!isOpen || !application) return null;

  // T-06: Guard against reading another employer's applicants
  if (application.employerId !== currentEmployerId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full text-center space-y-3">
          <h3 className="text-base font-bold text-red-600">Access Denied (T-06)</h3>
          <p className="text-xs text-stone-600">
            You do not have permission to view applicant dossiers belonging to another employer.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[application.status] || [];
  const isShortlistedOrSelected =
    application.status === 'shortlisted' ||
    application.status === 'selected' ||
    application.status === 'completed';

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setStatusError(null);
    try {
      onUpdateStatus(application.id, newStatus, employerNotes, confirmPayout);
      setActionSuccess(`Application status updated to ${newStatus.replace('_', ' ')}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setStatusError(err.message || 'Status transition rejected.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 border-b border-stone-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                  Applicant Dossier
                </span>
                <span className="text-xs text-stone-400">For: {application.jobTitle}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">{application.candidateName}</h3>
              <p className="text-xs text-stone-300 font-medium">{application.candidateHeadline}</p>
              <div className="flex items-center gap-3 text-xs text-stone-400 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {application.candidateLocation}
                </span>
                <span>·</span>
                <span className="capitalize">Availability: {application.candidateAvailability.replace('_', ' ')}</span>
                <span>·</span>
                <span className="text-amber-400 font-bold">Match: {application.matchScore}%</span>
              </div>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* POPIA Contact Disclosure Status */}
        <div className="bg-stone-100 border-b border-stone-200 px-6 py-2.5 text-xs text-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              POPIA Disclosure Level:{' '}
              {isShortlistedOrSelected ? (
                <strong className="text-emerald-800">Unmasked (Candidate is Shortlisted/Selected)</strong>
              ) : (
                <strong className="text-stone-700">Masked (Advance to Shortlist to reveal full phone)</strong>
              )}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
              application.status === 'completed'
                ? 'bg-emerald-100 text-emerald-800'
                : application.status === 'selected'
                ? 'bg-emerald-50 text-emerald-700'
                : application.status === 'shortlisted'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-stone-200 text-stone-800'
            }`}
          >
            Status: {application.status.replace('_', ' ')}
          </span>
        </div>

        {/* Dossier Body */}
        <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto text-xs text-stone-700">
          {/* Contact Details */}
          <div className="bg-stone-50 rounded-lg p-3.5 border border-stone-200 space-y-1.5">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              Direct Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>
                  {isShortlistedOrSelected ? (
                    <strong className="text-stone-900">{candidateProfile?.phone || NOT_PROVIDED}</strong>
                  ) : (
                    <span className="font-mono text-stone-500 bg-stone-200 px-1 rounded">
                      {maskPhone(candidateProfile?.phone)} (Shortlist to unlock)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                <span>
                  {isShortlistedOrSelected ? (
                    <strong className="text-stone-900">{candidateProfile?.contactEmail || NOT_PROVIDED}</strong>
                  ) : (
                    <span className="font-mono text-stone-500 bg-stone-200 px-1 rounded">
                      {maskEmail(candidateProfile?.contactEmail)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: DEMONSTRATED SKILL VERIFICATIONS (CAPABILITY) */}
          {/* ======================================================== */}
          <div className="space-y-3 bg-stone-50/50 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  1. Demonstrated Skill Verifications ({candidateClaims.length})
                </h4>
                <p className="text-[11px] text-stone-500">
                  Technical competency proven through standardized micro-task rubrics, peer reviews, or verified certificates.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                Skill Capability
              </span>
            </div>

            {candidateClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-3.5 rounded-lg border border-stone-200 bg-white space-y-2.5 shadow-2xs"
              >
                {/* 29.3 Employers see the verification label first */}
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                  <h5 className="font-bold text-stone-900 text-sm">{claim.skillName}</h5>
                  <VerificationBadge status={claim.verificationStatus} showMeaning />
                </div>

                <div className="bg-stone-50 p-2.5 rounded text-stone-600 space-y-2 border border-stone-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                      Candidate Self-Description:
                    </span>
                    <p className="font-semibold text-stone-800 text-xs">{claim.evidenceTitle}</p>
                    <p className="text-stone-600 leading-relaxed text-xs">{claim.evidenceDescription}</p>
                  </div>

                  {claim.peerEndorserName && (
                    <p className="text-stone-500 text-[11px] pt-1">
                      Endorser: <strong className="text-stone-700">{claim.peerEndorserName}</strong>
                    </p>
                  )}
                  {claim.assessmentId && (
                    <p className="text-emerald-700 font-semibold text-[11px] pt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Rubric Assessment Record: {claim.assessmentId}
                    </p>
                  )}

                  {/* Attached Verified Documents Dossier */}
                  {claim.evidenceItems && claim.evidenceItems.length > 0 && (
                    <div className="pt-2 border-t border-stone-200/70 space-y-1.5">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        Verified Attached Evidence ({claim.evidenceItems.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {claim.evidenceItems.map((item) => {
                          const isPdf = Boolean(item.mimeType?.includes('pdf') || item.fileName?.endsWith('.pdf'));
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setInspectingItem({ item, skillName: claim.skillName })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer group"
                            >
                              {isPdf ? (
                                <FileText className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              )}
                              <span className="group-hover:text-amber-800 truncate max-w-[170px]">
                                {item.title || item.fileName}
                              </span>
                              <span className="text-[10px] text-stone-400 shrink-0">({item.fileSize})</span>
                              <Eye className="w-3 h-3 text-stone-400 group-hover:text-amber-600 ml-0.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ================================================================= */}
          {/* SECTION 2: VERIFIED WORK HISTORY & JOB COMPLETIONS (TRACK RECORD) */}
          {/* ================================================================= */}
          <div className="space-y-3 bg-amber-50/30 p-4 rounded-xl border border-amber-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-stone-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-700" />
                  2. Verified Work History &amp; Job Completions ({candidateWorkRecords.length})
                </h4>
                <p className="text-[11px] text-stone-500">
                  Real jobs, trial shifts, and work engagements completed for employers with confirmed payouts.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                Employment History
              </span>
            </div>

            {candidateWorkRecords.length === 0 ? (
              <div className="p-4 rounded-lg bg-white border border-stone-200 text-stone-500 text-xs text-center space-y-1">
                <p className="font-semibold text-stone-700">No previous platform job completions yet</p>
                <p className="text-[11px] text-stone-400">
                  This is an entry-level candidate applying with verified practical skills (Section 1 above).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {candidateWorkRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-lg border border-stone-200 bg-white space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                      <div>
                        <h5 className="font-bold text-stone-900 text-xs">{record.jobTitle}</h5>
                        <p className="text-[11px] text-stone-500 font-medium">
                          Employer: <strong className="text-stone-700">{record.employerName}</strong> ·{' '}
                          {new Date(record.confirmedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            record.payoutConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {record.payoutConfirmed ? '✓ Payout Confirmed' : 'Payout Pending'}
                        </span>
                        <span className="block font-bold text-emerald-800 text-[11px] mt-0.5">
                          R{record.amountZAR}
                        </span>
                      </div>
                    </div>

                    {record.feedback && (
                      <div className="bg-stone-50 p-2.5 rounded border border-stone-100 text-[11px] text-stone-600">
                        <span className="font-semibold text-stone-700 block mb-0.5">Employer Recommendation:</span>
                        <p className="italic">&ldquo;{record.feedback}&rdquo;</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Employer Private Review Notes */}
          <div className="space-y-1.5">
            <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              Employer Review Notes
            </label>
            <textarea
              rows={2}
              value={employerNotes}
              onChange={(e) => setEmployerNotes(e.target.value)}
              placeholder="e.g. Completed trial shift, punctual and followed safety instructions..."
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg"
            />
          </div>

          {/* Completed Work & Payout Status (Section 28.1 & Feedback) */}
          {application.status === 'completed' && (
            <div className="p-3.5 rounded-lg border text-xs space-y-2.5 bg-stone-50 border-stone-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Work Completed
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    application.payoutConfirmed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {application.payoutConfirmed ? 'Paid (Confirmed)' : 'Payment Pending'}
                </span>
              </div>

              {application.payoutConfirmed ? (
                <p className="text-stone-600 text-[11px]">
                  Employer confirmed payout was processed for this candidate. Recorded in outcome metrics.
                </p>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200">
                  <p className="text-amber-800 text-[11px]">
                    Work completion was confirmed. Have you processed the candidate&apos;s payment?
                  </p>
                  {onConfirmPayout && (
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmPayout(application.id);
                        setActionSuccess('Payment confirmed successfully!');
                        setTimeout(() => setActionSuccess(null), 3000);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Confirm Payment Sent</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {allowedTransitions.includes('completed') && (
            <label className="flex items-start gap-2 p-3 bg-stone-50 border border-stone-200 text-xs text-stone-700 rounded-lg">
              <input
                type="checkbox"
                checked={confirmPayout}
                onChange={(event) => setConfirmPayout(event.target.checked)}
                className="mt-0.5"
              />
              <span>I confirm payment was ALREADY sent. (Leave unchecked if paying later; you can confirm payment anytime afterwards).</span>
            </label>
          )}

          {statusError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
              {statusError}
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}
        </div>

        {/* Valid Status Transitions Controls (Appendix A.1 & T-12) */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-700">Advance Application Pipeline:</span>
            <span className="text-stone-500">
              Permitted Next Steps: {allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'None (Terminal)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allowedTransitions.includes('under_review') && (
              <button
                onClick={() => handleStatusChange('under_review')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
              >
                Mark Under Review
              </button>
            )}

            {allowedTransitions.includes('shortlisted') && (
              <button
                onClick={() => handleStatusChange('shortlisted')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
              >
                Shortlist Candidate
              </button>
            )}

            {allowedTransitions.includes('selected') && (
              <button
                onClick={() => handleStatusChange('selected')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
              >
                Select / Hire Candidate
              </button>
            )}

            {allowedTransitions.includes('completed') && (
              <button
                onClick={() => handleStatusChange('completed')}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark Work Completed</span>
              </button>
            )}

            {allowedTransitions.includes('not_selected') && (
              <button
                onClick={() => handleStatusChange('not_selected')}
                className="px-3 py-1.5 bg-stone-200 hover:bg-red-100 hover:text-red-800 text-stone-700 rounded text-xs font-semibold"
              >
                Not Selected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Employer Document Inspector Preview Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden my-6">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Boolean(inspectingItem.item.mimeType?.includes('pdf') || inspectingItem.item.fileName?.endsWith('.pdf')) ? (
                  <FileText className="w-5 h-5 text-red-400" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                )}
                <div>
                  <h3 className="font-bold text-sm">Verified Candidate Evidence Dossier</h3>
                  <p className="text-xs text-stone-300">Skill: {inspectingItem.skillName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-stone-700">
              <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">{inspectingItem.item.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                    {inspectingItem.item.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 space-y-1">
                  <p><strong>File Name:</strong> {inspectingItem.item.fileName}</p>
                  <p><strong>File Size:</strong> {inspectingItem.item.fileSize}</p>
                  <p><strong>Format:</strong> {inspectingItem.item.mimeType}</p>
                  {inspectingItem.item.uploadedAt && (
                    <p><strong>Date Added:</strong> {new Date(inspectingItem.item.uploadedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {inspectingItem.item.description && (
                <div className="space-y-1">
                  <span className="font-semibold text-stone-800 text-xs">Evidence Description / Duties:</span>
                  <p className="p-2.5 bg-stone-50 rounded border border-stone-200 text-stone-600 leading-relaxed">
                    {inspectingItem.item.description}
                  </p>
                </div>
              )}

              {/* Preview Display */}
              <div className="border border-stone-200 rounded-lg p-4 bg-stone-100 text-center space-y-2">
                {Boolean(inspectingItem.item.mimeType?.includes('pdf') || inspectingItem.item.fileName?.endsWith('.pdf')) ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 text-red-500 mx-auto" />
                    <p className="font-semibold text-stone-800 text-xs">Official Document / Certificate</p>
                    <p className="text-[11px] text-stone-500">
                      Verified certificate submitted by candidate.
                    </p>
                    {inspectingItem.item.fileUrl && !inspectingItem.item.fileUrl.startsWith('candidate-evidence/') && (
                      <a
                        href={inspectingItem.item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Document</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectingItem.item.fileUrl && !inspectingItem.item.fileUrl.startsWith('candidate-evidence/') ? (
                      <img
                        src={inspectingItem.item.fileUrl}
                        alt={inspectingItem.item.title}
                        className="max-h-56 mx-auto rounded object-contain border border-stone-300"
                      />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-blue-500 mx-auto" />
                        <p className="font-semibold text-stone-800 text-xs">Work Evidence Photo</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingItem(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded text-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
