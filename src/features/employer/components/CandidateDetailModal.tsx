import { maskEmail, maskPhone, NOT_PROVIDED } from '../../../shared/maskContact';
import React, { useState } from 'react';
import { X, CheckCircle2, Award, ShieldCheck, MapPin, Phone, Mail, FileText, Check, DollarSign } from 'lucide-react';
import { Application, ApplicationStatus, CandidateProfile, SkillClaim } from '../../../domain/types';
import { VerificationBadge } from '../../../shared/components/VerificationBadge';
import { VALID_STATUS_TRANSITIONS } from '../../../domain/applicationStatus';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  candidateProfile: CandidateProfile | null;
  candidateClaims: SkillClaim[];
  currentEmployerId: string;
  onUpdateStatus: (
    applicationId: string,
    newStatus: ApplicationStatus,
    employerNotes?: string,
    payoutConfirmed?: boolean
  ) => void;
}

export const CandidateDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  application,
  candidateProfile,
  candidateClaims,
  currentEmployerId,
  onUpdateStatus,
}) => {
  const [employerNotes, setEmployerNotes] = useState(application?.employerNotes || '');
  const [confirmPayout, setConfirmPayout] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

          {/* Skill Evidence Trail */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              Verified Skill Evidence ({candidateClaims.length})
            </h4>

            {candidateClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-3.5 rounded-lg border border-stone-200 bg-white space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-bold text-stone-900 text-sm">{claim.skillName}</h5>
                  <VerificationBadge status={claim.verificationStatus} showMeaning />
                </div>
                <div className="bg-stone-50 p-2.5 rounded text-stone-600 space-y-1 border border-stone-100">
                  <p className="font-semibold text-stone-800">{claim.evidenceTitle}</p>
                  <p>{claim.evidenceDescription}</p>
                  {claim.peerEndorserName && (
                    <p className="text-stone-500 text-[11px] pt-1">
                      Endorser: <strong className="text-stone-700">{claim.peerEndorserName}</strong>
                    </p>
                  )}
                  {claim.assessmentId && (
                    <p className="text-emerald-700 font-semibold text-[11px] pt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Assessment record: {claim.assessmentId}
                    </p>
                  )}
                </div>
              </div>
            ))}
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

          {allowedTransitions.includes('completed') && (
            <label className="flex items-start gap-2 p-3 bg-stone-50 border border-stone-200 text-xs text-stone-700">
              <input
                type="checkbox"
                checked={confirmPayout}
                onChange={(event) => setConfirmPayout(event.target.checked)}
                className="mt-0.5"
              />
              <span>I confirm payment was sent. Leave unchecked if payment has not been confirmed; work completion is recorded separately.</span>
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
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confirm Work & Payout Completed</span>
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
    </div>
  );
};
