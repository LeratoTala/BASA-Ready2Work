import { NOT_PROVIDED } from '../../../shared/maskContact';
import React, { useState } from 'react';
import {
  User,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Share2,
  Download,
  FileCheck,
  CheckCircle2,
  DollarSign,
  Edit3,
  Save,
  Linkedin,
  Trash2,
  Info,
} from 'lucide-react';
import { CandidateProfile, PrivacyDeletionRequest, SkillClaim, WorkRecord } from '../../../domain/types';
import { VerificationBadge } from '../../../shared/components/VerificationBadge';
import { generatePassportPdf } from '../../../services/passportExport';
import { DataRetentionModal } from './DataRetentionModal';
import { exportCandidateUserData } from '../../../domain/retentionEngine';

interface Props {
  candidate: CandidateProfile;
  claims: SkillClaim[];
  workRecords: WorkRecord[];
  deletionRequest: PrivacyDeletionRequest | null;
  onRequestDeletion: () => Promise<void>;
  onUpdateProfile: (updates: Partial<CandidateProfile>) => void;
  onOpenExport: () => void;
  onOpenSkills: () => void;
}

export const CandidateProfilePage: React.FC<Props> = ({
  candidate,
  claims,
  workRecords,
  deletionRequest,
  onRequestDeletion,
  onUpdateProfile,
  onOpenExport,
  onOpenSkills,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [headline, setHeadline] = useState(candidate.headline);
  const [locationArea, setLocationArea] = useState(candidate.locationArea);
  const [experienceSummary, setExperienceSummary] = useState(candidate.experienceSummary);
  const [availability, setAvailability] = useState(candidate.availability);
  const [phone, setPhone] = useState(candidate.phone || '');
  const [popiaVisibility, setPopiaVisibility] = useState<'employers_only' | 'private'>(
    candidate.popiaVisibility === 'private' ? 'private' : 'employers_only'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletionRequestBusy, setDeletionRequestBusy] = useState(false);
  const [deletionRequestError, setDeletionRequestError] = useState<string | null>(null);
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false);

  const handleExportJson = () => {
    const exportData = exportCandidateUserData(candidate, claims, [], []);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basa-data-${(candidate.fullName || 'candidate').toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const candidateWorkRecords = workRecords.filter((w) => w.candidateId === candidate.uid);
  const taskAssessedCount = claims.filter((c) => c.verificationStatus === 'Task-assessed').length;
  const peerEndorsedCount = claims.filter((c) => c.verificationStatus === 'Peer-endorsed').length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      headline,
      locationArea,
      experienceSummary,
      availability,
      phone,
      popiaVisibility,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeletionRequest = async () => {
    const confirmationText =
      'Delete your account permanently?\n\n' +
      'This will permanently remove within 30 days:\n' +
      '• Your candidate profile and bio\n' +
      '• All claimed skills and proof descriptions\n' +
      '• All uploaded photos and certificate files\n' +
      '• All credential records and salted duplicate check hashes\n' +
      '• All job applications and notification records\n\n' +
      'You will not be able to log in or recover these records once deleted.\n\n' +
      'Do you wish to proceed with permanent account deletion?';

    if (!window.confirm(confirmationText)) return;
    setDeletionRequestBusy(true);
    setDeletionRequestError(null);
    try {
      await onRequestDeletion();
    } catch (error) {
      setDeletionRequestError(error instanceof Error ? error.message : 'Could not send your request. Please try again.');
    } finally {
      setDeletionRequestBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Candidate Avatar Initials */}
            <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-400 font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-xs border border-stone-800">
              {candidate.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Official Candidate Profile
                </span>
                <span className="text-xs text-stone-400">UID: {candidate.uid.toUpperCase()}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900">
                {candidate.fullName}
              </h1>
              <p className="text-sm text-stone-600 font-medium">{candidate.headline}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1">
                <span className="flex items-center gap-1 font-medium text-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  {candidate.locationArea}
                </span>
                <span>·</span>
                <span className="capitalize">
                  Availability: <strong>{candidate.availability.replace('_', ' ')}</strong>
                </span>
                <span>·</span>
                <span>
                  Privacy: <strong>{candidate.popiaVisibility.replace('_', ' ')}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Export & Edit Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Export Passport (PDF / LinkedIn)</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile details updated and cached successfully!</span>
          </div>
        )}

        {/* Credentials & Metrics Bar */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-stone-100 text-center text-xs">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Total Skills</span>
            <span className="text-xl font-extrabold text-stone-900">{claims.length}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 block">Task-Assessed</span>
            <span className="text-xl font-extrabold text-emerald-700">{taskAssessedCount}</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <span className="text-amber-800 block">Peer-Endorsed</span>
            <span className="text-xl font-extrabold text-amber-700">{peerEndorsedCount}</span>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Confirmed Work Records</span>
            <span className="text-xl font-extrabold text-stone-900">{candidateWorkRecords.length}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
            Edit Candidate Profile Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Professional Headline</label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Broad Location Area (POPIA)</label>
              <input
                type="text"
                required
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Experience Summary</label>
            <textarea
              rows={3}
              required
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
              >
                <option value="immediate">Immediate (Ready today)</option>
                <option value="part_time">Part-time / Flexible</option>
                <option value="full_time">Full-time standard</option>
                <option value="weekends">Weekends only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number (POPIA Protected)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Passport Visibility</label>
              <select
                value={popiaVisibility}
                onChange={(e) => setPopiaVisibility(e.target.value as any)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
              >
                <option value="employers_only">Employers I apply to</option>
                <option value="private">Private (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* Main Profile Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary & Skill Passport Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-2">
            <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wider text-[11px]">
              Practical Experience Summary
            </h3>
            <p className="text-xs text-stone-700 leading-relaxed">
              {candidate.experienceSummary || 'No experience summary provided yet.'}
            </p>
          </div>

          {/* Skills & Evidence Trail */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900">Skill Passport Trail</h3>
                <p className="text-xs text-stone-500">
                  Each label describes the proof recorded for a skill claim.
                </p>
              </div>
              <button
                onClick={onOpenSkills}
                className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
              >
                + Add / Manage Claims
              </button>
            </div>

            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-xl border border-stone-200 bg-white hover:border-amber-300 transition-all space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">{claim.skillName}</h4>
                      <p className="text-xs text-stone-500">
                        Self-reported: <span className="font-medium text-stone-700">{claim.selfReportedLevel}</span> · Type: <span className="capitalize">{claim.evidenceType.replace('_', ' ')}</span>
                      </p>
                    </div>
                    <VerificationBadge status={claim.verificationStatus} showMeaning />
                  </div>

                  <div className="bg-stone-50 p-3 rounded-lg text-xs text-stone-700 border border-stone-100 space-y-1">
                    <p className="font-semibold text-stone-800">{claim.evidenceTitle}</p>
                    <p className="text-stone-600">{claim.evidenceDescription}</p>
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
          </div>

          {/* Confirmed Work Records & Payout Confirmations */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Verified Work Completion Records
            </h3>
            <p className="text-xs text-stone-500">
              Employer-reported work completion and payment status, recorded separately.
            </p>

            {candidateWorkRecords.length === 0 ? (
              <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center text-xs text-stone-500">
                No completed work records yet. When an employer confirms task completion, it will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {candidateWorkRecords.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm">{w.jobTitle}</span>
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        {w.payoutConfirmed ? `Employer reports rate of R${w.payRateAmount ?? w.amountZAR} / ${w.payRateUnit ?? 'hour'} · Time served: ${w.actualTimeInWorkplace || w.workDurationLabel || (w.hoursWorked ? `${w.hoursWorked} hrs` : 'Full duration')} · Started: ${w.employmentStartDate || w.confirmedAt.split('T')[0]} · Completed: ${w.employmentEndDate || w.confirmedAt.split('T')[0]}` : `Rate: R${w.payRateAmount ?? w.amountZAR} / ${w.payRateUnit ?? 'hour'} · Time served: ${w.actualTimeInWorkplace || w.workDurationLabel || (w.hoursWorked ? `${w.hoursWorked} hrs` : 'duration')}`}
                      </span>
                    </div>
                    <p className="text-stone-700">
                      Employer: <strong>{w.employerName}</strong> · Work recorded on {new Date(w.confirmedAt).toLocaleDateString()}
                    </p>
                    <p className="text-stone-600 italic bg-white p-2.5 rounded border border-emerald-200">
                      &ldquo;{w.feedback}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact Details, QR Code & Privacy Notice */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              Direct Contact & Privacy
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-stone-700">
                <Phone className="w-4 h-4 text-stone-400" />
                <span>{candidate.phone || NOT_PROVIDED}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <Mail className="w-4 h-4 text-stone-400" />
                <span>{candidate.contactEmail || NOT_PROVIDED}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span>{candidate.locationArea}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
              Contact details are visible only to you and an employer who has shortlisted your application.
            </div>

            {/* Section 38: Privacy, Data Retention & Export */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-stone-800 text-xs">Your Data & Privacy Policy</h4>
                <button
                  type="button"
                  onClick={() => setIsRetentionModalOpen(true)}
                  className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>View Policy</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Grade 6 plain-language retention rules: what we store, how long we keep it, and your right to download or delete your records.
              </p>
              <button
                type="button"
                onClick={handleExportJson}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>Export My Data (JSON)</span>
              </button>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-2">
              <h4 className="font-semibold text-stone-800 text-xs">Account Deletion</h4>
              <p className="text-[11px] text-stone-600">
                Self-service permanent deletion. All profiles, skills, evidence files, and credentials are removed within 30 days.
              </p>
              {deletionRequest && (
                <p className="text-[11px] text-stone-700" role="status">
                  Request status: <strong>{deletionRequest.status.replace('_', ' ')}</strong>
                </p>
              )}
              {(!deletionRequest || deletionRequest.status === 'declined') && (
                <button
                  type="button"
                  onClick={handleDeletionRequest}
                  disabled={deletionRequestBusy}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletionRequestBusy ? 'Processing request…' : deletionRequest ? 'Submit another request' : 'Delete my account permanently'}</span>
                </button>
              )}
              {deletionRequestError && <p className="text-[11px] text-red-700" role="alert">{deletionRequestError}</p>}
            </div>
          </div>

          {/* Quick PDF & Share Card */}
          <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-md border border-stone-800 space-y-3 text-xs">
            <h3 className="font-bold text-white text-sm">Export your Skill Passport</h3>
            <p className="text-stone-300">
              Export your skills and evidence as a PDF or editable LinkedIn summary.
            </p>
            <div className="pt-1 space-y-2">
              <button
                onClick={() => generatePassportPdf(candidate, claims)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF summary</span>
              </button>
              <button
                onClick={onOpenExport}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold rounded-lg cursor-pointer"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
                <span>Export LinkedIn Summary</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 38: Plain-Language Data Retention Modal */}
      <DataRetentionModal
        isOpen={isRetentionModalOpen}
        onClose={() => setIsRetentionModalOpen(false)}
        onExportData={handleExportJson}
        onRequestDeletion={handleDeletionRequest}
      />
    </div>
  );
};
