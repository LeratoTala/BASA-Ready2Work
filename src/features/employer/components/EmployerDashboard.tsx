import React, { useState } from 'react';
import { Plus, Briefcase, Users, CheckCircle2, DollarSign, Clock, ShieldCheck, ChevronRight, Power, FileText } from 'lucide-react';
import { Application, EmployerProfile, Job, SkillClaim, ENGAGEMENT_TYPE_METADATA, BusinessVerificationDetails } from '../../../domain/types';
import { TrustAndSafetyBanner } from '../../../shared/components/TrustAndSafetyBanner';
import { RequestEmployerVerificationModal } from './RequestEmployerVerificationModal';

interface Props {
  employer: EmployerProfile;
  jobs: Job[];
  applications: Application[];
  onOpenCreateJob: () => void;
  onToggleJobStatus: (jobId: string) => void;
  onSelectApplication: (app: Application) => void;
  onViewAllApplicants: () => void;
  onUpdateEmployerProfile: (updates: Partial<EmployerProfile>) => void;
  onRequestVerification?: (
    employerUid: string,
    details: BusinessVerificationDetails,
    file?: File
  ) => Promise<void> | void;
  onOpenProfile?: () => void;
  onOpenUpgrade?: () => void;
  onOpenPulseSurvey?: () => void;
}

export const EmployerDashboard: React.FC<Props> = ({
  employer,
  jobs,
  applications,
  onOpenCreateJob,
  onToggleJobStatus,
  onSelectApplication,
  onViewAllApplicants,
  onUpdateEmployerProfile,
  onRequestVerification,
  onOpenProfile,
  onOpenUpgrade,
  onOpenPulseSurvey,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState(employer.businessName);
  const [industry, setIndustry] = useState(employer.industry);
  const [description, setDescription] = useState(employer.description);
  const [locationArea, setLocationArea] = useState(employer.locationArea);
  const [opportunityTab, setOpportunityTab] = useState<'active' | 'completed'>('active');

  const activeJobs = jobs.filter((j) => j.status === 'open');
  const closedJobs = jobs.filter((j) => j.status === 'closed' || j.status === 'flagged');
  const shortlistedCount = applications.filter((a) => a.status === 'shortlisted' || a.status === 'selected').length;
  const completedApplications = applications.filter((a) => a.status === 'completed');
  const completedCount = completedApplications.length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmployerProfile({
      businessName,
      industry,
      description,
      locationArea,
    });
    setIsEditing(false);
  };

  const handleCloseJobClick = (jobId: string, jobTitle: string) => {
    const unreviewed = applications.filter((a) => a.jobId === jobId && a.status === 'submitted');
    if (unreviewed.length > 0) {
      alert(
        `Cannot close listing "${jobTitle}" (ID: ${jobId}):\n\nPlease update the status of each applicant before closing. There are ${unreviewed.length} applicant(s) still in 'Submitted' awaiting your review.\n\nPlease review them (e.g. Under Review, Shortlisted, Selected, or Not Selected) before closing this job.`
      );
      return;
    }
    onToggleJobStatus(jobId);
  };

  return (
    <div className="space-y-6">
      {/* Employer Profile & Welcome Card */}
      <div className="bg-stone-900 text-white rounded-xl p-6 shadow-md border border-stone-800 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                Employer Dashboard
              </span>
              {employer.verificationStatus === 'verified' ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Employer
                </span>
              ) : employer.verificationStatus === 'pending' ? (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-medium bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                  <Clock className="w-3.5 h-3.5" />
                  Verification Pending
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-stone-400 font-medium bg-stone-800 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Unverified Account
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{employer.businessName}</h1>
            <p className="text-stone-300 text-sm">{employer.description}</p>
            <div className="flex items-center gap-3 text-xs text-stone-400 pt-1">
              <span>{employer.industry}</span>
              <span>·</span>
              <span>{employer.locationArea}</span>
              <span>·</span>
              <span>{employer.contactEmail}</span>
            </div>

            {/* Section 39: Subscription Tier Pill */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800 text-xs">
              <span className="text-stone-400">Subscription Tier:</span>
              <span className="px-2 py-0.5 rounded bg-stone-800 text-amber-400 font-bold border border-stone-700 capitalize text-[11px]">
                {employer.plan || 'Free (SMME)'} Plan
              </span>
              {employer.planStatus === 'upgrade_pending' && (
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] font-semibold border border-amber-600/60">
                  Upgrade Pending Review
                </span>
              )}
              <span className="text-stone-400 text-[11px]">
                ({activeJobs.length} / {employer.plan === 'starter' ? 5 : employer.plan === 'business' ? 20 : 1} active jobs)
              </span>
              {onOpenUpgrade && (
                <button
                  type="button"
                  onClick={onOpenUpgrade}
                  className="text-amber-400 hover:text-amber-300 font-semibold underline ml-1 cursor-pointer text-xs"
                >
                  Request Upgrade
                </button>
              )}
              {onOpenPulseSurvey && (
                <button
                  type="button"
                  onClick={onOpenPulseSurvey}
                  className="text-stone-400 hover:text-stone-300 text-[11px] underline ml-2 cursor-pointer"
                >
                  Pricing Survey
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer"
                title="View your dedicated Company Profile Page"
              >
                View Company Profile
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Business Info'}
            </button>
            <button
              onClick={onOpenCreateJob}
              disabled={employer.verificationStatus !== 'verified'}
              title={employer.verificationStatus !== 'verified' ? 'Admin verification required before posting opportunities (Section 30.1)' : 'Post a new opportunity'}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
                employer.verificationStatus === 'verified'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{employer.verificationStatus === 'verified' ? 'Post Opportunity' : 'Verification Required'}</span>
            </button>
          </div>
        </div>

        {/* Verification Status Banner & Action */}
        {employer.verificationStatus !== 'verified' ? (
          <div className="bg-amber-950/70 border border-amber-800 text-amber-200 px-5 py-4 rounded-xl text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    <span>
                      {employer.verificationStatus === 'pending'
                        ? 'Business Verification Under Review (Anti-Fraud)'
                        : 'Action Required: Submit Formal Business Verification'}
                    </span>
                    <span className="text-[10px] uppercase font-extrabold bg-amber-900/80 px-2 py-0.2 rounded border border-amber-700">
                      {employer.verificationStatus}
                    </span>
                  </div>
                  <p className="text-stone-300 leading-relaxed text-[11px]">
                    {employer.verificationStatus === 'pending'
                      ? `Your business registration details (${employer.verificationDetails?.registrationNumber || 'CIPC/Permit'}) have been submitted and are being checked against official registries to protect candidates against fraudulent listings.`
                      : 'To prevent ghost jobs and protect young South African jobseekers, employers must provide proof of formal registration (CIPC number or Municipal Trading Permit) before publishing vacancies.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(true)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-stone-950" />
                <span>
                  {employer.verificationStatus === 'pending'
                    ? 'View / Update Registration'
                    : 'Submit Business Registration'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 px-5 py-2.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">Formally Verified Registered Business:</strong>{' '}
                {employer.verificationDetails?.legalRegisteredName || employer.businessName} (Reg #{' '}
                <span className="font-mono text-emerald-300">
                  {employer.verificationDetails?.registrationNumber || 'CIPC Verified'}
                </span>
                )
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsVerificationModalOpen(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
            >
              View Registration Record
            </button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="pt-4 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="bg-stone-800/50 p-2.5 rounded-lg border border-stone-700/50">
            <span className="text-stone-400 block">Active Listings</span>
            <span className="text-xl font-bold text-white">{activeJobs.length}</span>
          </div>
          <div className="bg-stone-800/50 p-2.5 rounded-lg border border-stone-700/50">
            <span className="text-stone-400 block">Total Applicants</span>
            <span className="text-xl font-bold text-amber-400">{applications.length}</span>
          </div>
          <div className="bg-stone-800/50 p-2.5 rounded-lg border border-stone-700/50">
            <span className="text-stone-400 block">Shortlisted / Hired</span>
            <span className="text-xl font-bold text-emerald-400">{shortlistedCount}</span>
          </div>
          <div className="bg-stone-800/50 p-2.5 rounded-lg border border-stone-700/50">
            <span className="text-stone-400 block">Completed Engagements</span>
            <span className="text-xl font-bold text-white">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
            Update Business Profile (FR-07)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Industry</label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Business Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-stone-300 rounded p-2 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Opportunities & Completed Engagements Management */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Your Opportunities &amp; Engagements</h2>
            <p className="text-xs text-stone-500">Track live recruitment, manage open roles, and inspect finished candidate work records.</p>
          </div>
          <button
            onClick={onOpenCreateJob}
            className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Post another job
          </button>
        </div>

        {/* Opportunity Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => setOpportunityTab('active')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              opportunityTab === 'active'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Active Listings ({activeJobs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOpportunityTab('completed')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              opportunityTab === 'completed'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed Jobs &amp; Finished Work ({completedCount})</span>
          </button>
        </div>

        {opportunityTab === 'active' ? (
          activeJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-xs text-stone-500 space-y-2">
              <p className="font-semibold text-stone-700">No active job listings</p>
              <p>Post a new opportunity to start matching with candidates holding verified skills.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeJobs.map((job) => {
                const jobApps = applications.filter((a) => a.jobId === job.id);
                const activeJobApps = jobApps.filter((a) => a.status !== 'completed' && a.status !== 'withdrawn');
                const completedJobApps = jobApps.filter((a) => a.status === 'completed');
                const unreviewedJobApps = jobApps.filter((a) => a.status === 'submitted');

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active / Open
                            </span>
                            <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded">
                              ID: #{job.id}
                            </span>
                            {job.engagementType && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  ENGAGEMENT_TYPE_METADATA[job.engagementType]?.badgeClass || 'bg-stone-100 text-stone-700 border-stone-200'
                                }`}
                                title={ENGAGEMENT_TYPE_METADATA[job.engagementType]?.expectation}
                              >
                                {ENGAGEMENT_TYPE_METADATA[job.engagementType]?.shortLabel || job.engagementType}
                              </span>
                            )}
                            <span className="text-xs text-stone-400">·</span>
                            <span className="text-xs text-stone-500">{job.locationArea}</span>
                          </div>
                          <h3 className="font-bold text-base text-stone-900 mt-1">{job.title}</h3>
                        </div>

                        <button
                          onClick={() => handleCloseJobClick(job.id, job.title)}
                          className="text-xs px-2.5 py-1 rounded font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 cursor-pointer"
                          title="Close job (ensure all applicants have an updated status)"
                        >
                          Close Job
                        </button>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2">{job.description}</p>

                      <div className="flex items-center gap-2 text-xs pt-1">
                        <span className="font-bold text-stone-900">
                          R{job.compensationAmount}
                        </span>
                        <span className="text-stone-500">/ {job.compensationUnit}</span>
                        <span className="text-stone-300">·</span>
                        <span className="text-stone-500">Starts: {job.startDate}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-700">
                        <strong>{activeJobApps.length}</strong> Active Candidate{activeJobApps.length === 1 ? '' : 's'}
                        {completedJobApps.length > 0 && (
                          <span className="text-emerald-700 font-semibold ml-1 text-[11px]">
                            ({completedJobApps.length} completed)
                          </span>
                        )}
                      </span>
                      <button
                        onClick={onViewAllApplicants}
                        className="text-xs font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Applicants</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Completed Opportunities & Finished Engagements */
          <div className="space-y-4">
            {completedApplications.length === 0 && closedJobs.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-xs text-stone-500 space-y-2">
                <p className="font-semibold text-stone-700">No completed jobs or finished engagements yet</p>
                <p>When candidates finish their work engagements, their work records and payout receipts will appear here.</p>
              </div>
            ) : (
              <>
                {/* Completed Candidates Engagements Feed */}
                {completedApplications.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Finished Candidate Engagements ({completedApplications.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {completedApplications.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => onSelectApplication(app)}
                          className="bg-white rounded-xl border border-stone-200 hover:border-emerald-500 p-4 shadow-2xs space-y-2 cursor-pointer transition-all"
                        >
                          {(() => {
                            const parentJob = jobs.find((j) => j.id === app.jobId);
                            const isParentJobOpen = parentJob?.status === 'open';

                            return (
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-sm text-stone-900">{app.candidateName}</h4>
                                    <span className="font-mono text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-1 py-0.2 rounded">
                                      ID: #{app.jobId}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-500 font-medium">{app.jobTitle}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      isParentJobOpen
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                        : 'bg-stone-100 text-stone-600 border border-stone-300'
                                    }`}
                                  >
                                    Job: {isParentJobOpen ? 'Open' : 'Closed'}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      app.payoutConfirmed
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}
                                  >
                                    {app.payoutConfirmed ? '✓ Paid' : 'Payment Pending'}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Duration & Payout Display */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
                            <span className="flex items-center gap-1 font-medium bg-stone-100 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Worked: <strong>{app.workDurationLabel || (app.hoursWorked ? `${app.hoursWorked} hrs` : 'Completed')}</strong></span>
                            </span>
                            {app.payoutAmountZAR && (
                              <span className="font-bold text-emerald-800">
                                Payout: R{app.payoutAmountZAR}
                              </span>
                            )}
                          </div>

                          {app.employerNotes && (
                            <p className="text-[11px] text-stone-600 italic bg-stone-50 p-2 rounded border border-stone-100">
                              &ldquo;{app.employerNotes}&rdquo;
                            </p>
                          )}

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                            <span>Completed: {new Date(app.updatedAt).toLocaleDateString()}</span>
                            <span className="font-semibold text-amber-800 hover:underline flex items-center gap-0.5">
                              View Record <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Closed / Finished Listings */}
                {closedJobs.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <h3 className="font-bold text-sm text-stone-700 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-stone-500" />
                      Archived / Closed Job Listings ({closedJobs.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {closedJobs.map((job) => (
                        <div
                          key={job.id}
                          className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-stone-700">{job.title}</h4>
                                <span className="font-mono text-[10px] font-bold text-stone-500 bg-stone-200 border border-stone-300 px-1.5 py-0.5 rounded">
                                  ID: #{job.id}
                                </span>
                                {job.engagementType && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                      ENGAGEMENT_TYPE_METADATA[job.engagementType]?.badgeClass || 'bg-stone-100 text-stone-700 border-stone-200'
                                    }`}
                                    title={ENGAGEMENT_TYPE_METADATA[job.engagementType]?.expectation}
                                  >
                                    {ENGAGEMENT_TYPE_METADATA[job.engagementType]?.shortLabel || job.engagementType}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => onToggleJobStatus(job.id)}
                              className="text-xs px-2.5 py-1 rounded font-medium border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                              title="Reopen this job listing for candidate applications"
                            >
                              Reopen Role
                            </button>
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-1">{job.description}</p>
                          <p className="text-[11px] text-stone-400">
                            Closed listing · R{job.compensationAmount} / {job.compensationUnit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Trust & Safety — answers: how are employers protected from unreliable candidates? */}
      <TrustAndSafetyBanner role="employer" />

      {/* Recent Applications Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Recent Applications</h2>
            <p className="text-xs text-stone-500">Active candidates progressing through review and interview pipeline.</p>
          </div>
          <button
            onClick={onViewAllApplicants}
            className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
          >
            View All ({applications.filter((a) => a.status !== 'completed' && a.status !== 'withdrawn').length}) →
          </button>
        </div>

        {applications.filter((a) => a.status !== 'completed' && a.status !== 'withdrawn').length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-xs text-stone-500">
            No active applications in the review pipeline.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
            {applications
              .filter((a) => a.status !== 'completed' && a.status !== 'withdrawn')
              .slice(0, 5)
              .map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-stone-900">{app.candidateName}</h4>
                    <span className="text-[11px] text-stone-500">applied for {app.jobTitle}</span>
                  </div>
                  <p className="text-[11px] text-stone-400">{app.candidateLocation} · {app.candidateHeadline}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    {app.matchScore}% Match
                  </span>
                  <span className="text-[11px] capitalize text-stone-600 bg-stone-100 px-2 py-0.5 rounded font-medium">
                    {app.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            ))}
          </div>
        )}
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
