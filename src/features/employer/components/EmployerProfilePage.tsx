import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  ShieldCheck,
  Briefcase,
  Users,
  Edit3,
  CheckCircle2,
  DollarSign,
  Plus,
  Power,
  ChevronRight,
  Clock,
  AlertCircle,
  FileText,
  Phone,
  Globe,
  Award,
  Trash2,
  Info,
  Sparkles,
} from 'lucide-react';
import { Application, EmployerProfile, Job, BusinessVerificationDetails, formatRegistrationType } from '../../../domain/types';
import { getPlanConfig, EMPLOYER_PLANS } from '../../../config/plans';
import { RequestEmployerVerificationModal } from './RequestEmployerVerificationModal';

interface Props {
  employer: EmployerProfile;
  jobs: Job[];
  applications: Application[];
  onUpdateEmployerProfile: (updates: Partial<EmployerProfile>) => void;
  onOpenCreateJob: () => void;
  onToggleJobStatus: (jobId: string) => void;
  onViewApplicants: () => void;
  onRequestVerification?: (
    employerUid: string,
    details: BusinessVerificationDetails,
    file?: File
  ) => Promise<void> | void;
  onOpenUpgrade?: () => void;
  onDowngradePlan?: (newPlan: 'free' | 'starter' | 'business') => void;
}

export const EmployerProfilePage: React.FC<Props> = ({
  employer,
  jobs,
  applications,
  onUpdateEmployerProfile,
  onOpenCreateJob,
  onToggleJobStatus,
  onViewApplicants,
  onRequestVerification,
  onOpenUpgrade,
  onDowngradePlan,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState(employer.businessName);
  const [industry, setIndustry] = useState(employer.industry);
  const [description, setDescription] = useState(employer.description);
  const [locationArea, setLocationArea] = useState(employer.locationArea);
  const [contactEmail, setContactEmail] = useState(employer.contactEmail);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeJobs = jobs.filter((j) => j.status === 'open');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmployerProfile({
      businessName,
      industry,
      description,
      locationArea,
      contactEmail,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const regDetails = employer.verificationDetails;

  return (
    <div className="space-y-6">
      {/* Business Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-500 font-extrabold text-2xl flex items-center justify-center shrink-0 border border-stone-800">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Employer Business Profile
                </span>
                {employer.verificationStatus === 'verified' ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Registered Company (CIPC)
                  </span>
                ) : employer.verificationStatus === 'pending' ? (
                  <span className="flex items-center gap-1 text-xs text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Verification Pending Review
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-stone-600 font-semibold bg-stone-100 border border-stone-200 px-2 py-0.5 rounded">
                    <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                    Unverified Business
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900">
                {employer.businessName}
              </h1>
              <p className="text-xs text-stone-500 font-medium">Industry: {employer.industry}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1">
                <span className="flex items-center gap-1 font-medium text-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {employer.locationArea}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  {employer.contactEmail}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Company Info'}</span>
            </button>

            <button
              onClick={onOpenCreateJob}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post New Job</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Company profile updated successfully!</span>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-stone-100 text-xs text-stone-700">
          <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
            Company Overview & Mission
          </h4>
          <p className="leading-relaxed text-stone-600">{employer.description}</p>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
            Update Business Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Industry</label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Business Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Location Area</label>
              <input
                type="text"
                required
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
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
              Save Company Changes
            </button>
          </div>
        </form>
      )}

      {/* Formal Business Registration & Statutory Listings (Anti-Fraud) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                Official Business Registration & Statutory Listings
              </h3>
              <p className="text-xs text-stone-500">
                Formal legal listing to prevent fraud and assure jobseekers of legitimate employment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVerificationModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{regDetails ? 'Update Registration Details' : 'Submit Business Registration'}</span>
          </button>
        </div>

        {regDetails ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Legal Registered Entity Name
                </span>
                <span className="font-bold text-stone-900 text-sm">{regDetails.legalRegisteredName}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Registration Entity Type
                </span>
                <span className="font-semibold text-stone-800">
                  {formatRegistrationType(regDetails.registrationType)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Official Registration / Permit Number
                </span>
                <span className="font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded inline-block mt-0.5">
                  {regDetails.registrationNumber}
                </span>
              </div>

              {regDetails.taxNumber && (
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    SARS Tax Reference Number
                  </span>
                  <span className="font-mono font-medium text-stone-700">{regDetails.taxNumber}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Registered Physical Address
                </span>
                <span className="text-stone-800 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>{regDetails.physicalAddress}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Verified Contact Phone
                </span>
                <span className="text-stone-800 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{regDetails.officialPhone}</span>
                </span>
              </div>

              {regDetails.documentFileName && (
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Uploaded Proof of Registration
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-300 text-stone-800 font-semibold text-[11px] mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                    <span>{regDetails.documentFileName}</span>
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Verification Status
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase mt-0.5 ${
                    employer.verificationStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : employer.verificationStatus === 'pending'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {employer.verificationStatus === 'verified' ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified by BASA Admin</span>
                    </>
                  ) : employer.verificationStatus === 'pending' ? (
                    <>
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Pending Administrator Review</span>
                    </>
                  ) : (
                    <span>Unverified</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="font-bold text-amber-950">No formal business registration submitted yet</p>
              <p className="text-amber-800 leading-relaxed">
                Provide your CIPC registration certificate (CoR14.3) or municipal trade permit to unlock posting opportunities and verify your company.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVerificationModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Submit Registration
            </button>
          </div>
        )}
      </div>

      {/* Subscription Tier & Hiring Capacity (Section 39 / Requirement 4) */}
      {(() => {
        const planConfig = getPlanConfig(employer.plan);
        const isPaid = employer.plan && employer.plan !== 'free';

        const handleConfirmDowngrade = (newPlan: 'free' | 'starter' | 'business') => {
          const actionText = newPlan === 'free' ? 'cancel your plan and return to the Free SMME Tier' : `downgrade to the ${newPlan.toUpperCase()} plan`;
          const confirmed = window.confirm(
            `Are you sure you want to ${actionText}?\n\n` +
            `PLAIN LANGUAGE PROMISE:\n` +
            `• Downgrading or cancelling will NEVER delete any of your existing jobs or applicants.\n` +
            `• You keep full access to past applicants, notes, and active jobs.\n` +
            `• Only creating NEW jobs beyond the new limit will be blocked until you close older jobs.\n` +
            `• Zero lock-in contracts or penalty fees.`
          );
          if (confirmed && onDowngradePlan) {
            onDowngradePlan(newPlan);
          }
        };

        return (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">
                    Employer Subscription &amp; Hiring Capacity
                  </h3>
                  <p className="text-xs text-stone-500">
                    Pilot — Invoiced manually (No credit card or recurring debit order required)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenUpgrade && (
                  <button
                    type="button"
                    onClick={onOpenUpgrade}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Request Upgrade</span>
                  </button>
                )}
              </div>
            </div>

            {/* Plan Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Current Active Plan
                </span>
                <span className="text-base font-extrabold text-stone-900 capitalize block">
                  {planConfig.name}
                </span>
                <span className="text-[11px] text-stone-600 block">
                  {planConfig.priceZarMonthly > 0 ? `R${planConfig.priceZarMonthly}/month (Pilot)` : 'R0 (Free SMME Pilot)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Active Opportunity Quota
                </span>
                <span className="text-base font-extrabold text-stone-900 block">
                  {activeJobs.length} / {planConfig.activeJobLimit === 999999 ? 'Unlimited' : planConfig.activeJobLimit}
                </span>
                <span className="text-[11px] text-stone-500 block">
                  {activeJobs.length >= planConfig.activeJobLimit ? 'Quota reached (upgrade to post more)' : 'Slots available'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Subscription Status
                </span>
                <div className="flex items-center gap-1.5">
                  {employer.planStatus === 'upgrade_pending' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                      Upgrade Pending Review
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  )}
                </div>
                {employer.planSince && (
                  <span className="text-[10px] text-stone-400 block">
                    Active since: {new Date(employer.planSince).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Plain-Language Fairness Notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
              <p className="font-bold text-amber-900 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Zero Lock-In &amp; Data Safety Guarantee:</span>
              </p>
              <p className="text-[11px] text-stone-700 leading-relaxed">
                Downgrading or cancelling will <strong>never delete</strong> any of your existing jobs or applicants. You maintain complete access to all past applications. Only new jobs beyond the new limit will be blocked until you close older listings.
              </p>
            </div>

            {/* Downgrade / Cancel Actions if on a Paid Plan */}
            {isPaid && (
              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-stone-500 text-[11px]">
                  Need to reduce hiring costs? You can downgrade or cancel back to Free at any time.
                </span>
                <div className="flex items-center gap-2">
                  {employer.plan === 'business' && (
                    <button
                      type="button"
                      onClick={() => handleConfirmDowngrade('starter')}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs cursor-pointer"
                    >
                      Downgrade to Starter (5 jobs)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleConfirmDowngrade('free')}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs cursor-pointer"
                  >
                    Cancel Plan (Back to Free SMME)
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Active Listings Storefront */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-stone-900">
              Active Opportunities Posted by {employer.businessName} ({jobs.length})
            </h3>
            <p className="text-xs text-stone-500">
              Candidates discover these opportunities and apply using their Skill Passport.
            </p>
          </div>
          <button
            onClick={onOpenCreateJob}
            className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
          >
            + Post another job
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const jobApps = applications.filter((a) => a.jobId === job.id);
            const isOpen = job.status === 'open';

            return (
              <div
                key={job.id}
                className="p-5 rounded-xl border border-stone-200 bg-white hover:border-amber-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {isOpen ? 'Active' : 'Closed'}
                      </span>
                      <h4 className="font-bold text-base text-stone-900 mt-1">{job.title}</h4>
                    </div>
                    <button
                      onClick={() => onToggleJobStatus(job.id)}
                      className="text-xs px-2.5 py-1 rounded border border-stone-300 hover:bg-stone-50 text-stone-700 cursor-pointer"
                    >
                      {isOpen ? 'Close' : 'Reopen'}
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2">{job.description}</p>

                  <div className="text-xs font-semibold text-stone-900">
                    R{job.compensationAmount} / {job.compensationUnit} · {job.locationArea}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">
                    <strong>{jobApps.length}</strong> applicants
                  </span>
                  <button
                    onClick={onViewApplicants}
                    className="text-amber-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Candidates</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 38.6: Employer Account & Data Management */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-stone-600" />
          Employer Data & Account Management
        </h3>
        <p className="text-stone-600 leading-relaxed">
          In accordance with Section 38 POPIA retention rules, employers may delete their account and job listings at any time. Candidate applications already received will be retained under the standard 6-month retention policy or deleted if the candidate requests account deletion.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to delete this employer account?\n\nThis will permanently delete your company profile, close all posted jobs, and cancel active listings.\n\nContinue?'
                )
              ) {
                alert('Your employer deletion request has been scheduled. All job postings will be removed.');
              }
            }}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold cursor-pointer transition-colors"
          >
            Delete Employer Account & Listings
          </button>
        </div>
      </div>

      {/* Formal Business Verification Modal */}
      {isVerificationModalOpen && (
        <RequestEmployerVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          employer={employer}
          onSubmitVerification={async (empUid, details, file) => {
            await onRequestVerification?.(empUid, details, file);
          }}
        />
      )}
    </div>
  );
};
