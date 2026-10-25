import React, { useState } from 'react';
import { Plus, Briefcase, Users, CheckCircle2, DollarSign, Clock, ShieldCheck, ChevronRight, Power } from 'lucide-react';
import { Application, EmployerProfile, Job, SkillClaim } from '../../../domain/types';

interface Props {
  employer: EmployerProfile;
  jobs: Job[];
  applications: Application[];
  onOpenCreateJob: () => void;
  onToggleJobStatus: (jobId: string) => void;
  onSelectApplication: (app: Application) => void;
  onViewAllApplicants: () => void;
  onUpdateEmployerProfile: (updates: Partial<EmployerProfile>) => void;
  onOpenProfile?: () => void;
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
  onOpenProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(employer.businessName);
  const [industry, setIndustry] = useState(employer.industry);
  const [description, setDescription] = useState(employer.description);
  const [locationArea, setLocationArea] = useState(employer.locationArea);

  const activeJobs = jobs.filter((j) => j.status === 'open');
  const shortlistedCount = applications.filter((a) => a.status === 'shortlisted' || a.status === 'selected').length;
  const completedCount = applications.filter((a) => a.status === 'completed').length;

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
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Business
                </span>
              ) : employer.verificationStatus === 'pending' ? (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Verification Pending
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-stone-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Unverified
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
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Post Opportunity</span>
            </button>
          </div>
        </div>

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

      {/* Active Jobs Management (FR-08) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">Your Posted Opportunities ({jobs.length})</h2>
          <button
            onClick={onOpenCreateJob}
            className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Post another job
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const jobApps = applications.filter((a) => a.jobId === job.id);
            const isOpen = job.status === 'open';

            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {isOpen ? 'Active / Open' : 'Closed'}
                        </span>
                        <span className="text-xs text-stone-400">·</span>
                        <span className="text-xs text-stone-500">{job.locationArea}</span>
                      </div>
                      <h3 className="font-bold text-base text-stone-900 mt-1">{job.title}</h3>
                    </div>

                    <button
                      onClick={() => onToggleJobStatus(job.id)}
                      className={`text-xs px-2.5 py-1 rounded font-medium border cursor-pointer ${
                        isOpen
                          ? 'border-stone-300 text-stone-700 hover:bg-stone-50'
                          : 'border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                      title={isOpen ? 'Close job (stop new applications)' : 'Reopen job'}
                    >
                      {isOpen ? 'Close Job' : 'Reopen'}
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
                    <strong>{jobApps.length}</strong> Candidate{jobApps.length === 1 ? '' : 's'} Applied
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
      </div>

      {/* Recent Applications Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">Recent Applications</h2>
          <button
            onClick={onViewAllApplicants}
            className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
          >
            View All ({applications.length}) →
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-xs text-stone-500">
            No applications received yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
            {applications.slice(0, 5).map((app) => (
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
    </div>
  );
};
