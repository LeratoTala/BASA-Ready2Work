import React, { useState } from 'react';
import { Application, ApplicationStatus, CandidateProfile, Job, SkillClaim } from '../../../domain/types';
import { VerificationBadge } from '../../../shared/components/VerificationBadge';
import { Users, Filter, ChevronRight, Award, MapPin, Building2 } from 'lucide-react';

interface Props {
  applications: Application[];
  jobs: Job[];
  onSelectApplication: (app: Application) => void;
  candidateProfiles: Record<string, CandidateProfile>;
  skillClaims: SkillClaim[];
}

export const ApplicantListView: React.FC<Props> = ({
  applications,
  jobs,
  onSelectApplication,
  candidateProfiles,
  skillClaims,
}) => {
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const filteredApps = applications.filter((app) => {
    if (selectedJobFilter !== 'all' && app.jobId !== selectedJobFilter) return false;
    if (selectedStatusFilter !== 'all' && app.status !== selectedStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Job Applicants & Candidate Evidence</h2>
          <p className="text-xs text-stone-500 mt-1">
            Review candidates based on demonstrable skill evidence rather than formal credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Job Filter */}
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="border border-stone-300 rounded px-2.5 py-1.5 text-xs bg-white text-stone-800"
          >
            <option value="all">All Jobs ({jobs.length})</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="border border-stone-300 rounded px-2.5 py-1.5 text-xs bg-white text-stone-800"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="selected">Selected</option>
            <option value="completed">Work Completed</option>
          </select>
        </div>
      </div>

      {/* Applicant Cards */}
      {filteredApps.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-stone-700">No applicants match this filter</p>
          <p className="text-xs text-stone-500">
            When candidates discover your opportunities and apply with their Skill Passport, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const candidateClaims = skillClaims.filter((c) => c.candidateId === app.candidateId);
            const verifiedClaims = candidateClaims.filter(
              (c) => c.verificationStatus === 'Task-assessed' || c.verificationStatus === 'Peer-endorsed'
            );

            return (
              <div
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="bg-white rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-xs p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-stone-900 group-hover:text-amber-800">
                      {app.candidateName}
                    </h3>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-600 font-medium">For: {app.jobTitle}</span>
                    <span
                      className={`ml-auto md:ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'selected'
                          ? 'bg-emerald-50 text-emerald-700'
                          : app.status === 'shortlisted'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500">{app.candidateHeadline}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {app.candidateLocation}
                    </span>
                    <span>·</span>
                    <span className="capitalize">Availability: {app.candidateAvailability.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>Applied: {new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Evidence Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {candidateClaims.slice(0, 3).map((claim) => (
                      <span
                        key={claim.id}
                        className="inline-flex items-center gap-1 text-[11px] bg-stone-50 border border-stone-200 px-2 py-0.5 rounded text-stone-700"
                      >
                        <span>{claim.skillName}</span>
                        <span className="text-[10px] font-semibold text-amber-700">({claim.verificationStatus})</span>
                      </span>
                    ))}
                    {candidateClaims.length > 3 && (
                      <span className="text-[11px] text-stone-400">+{candidateClaims.length - 3} more</span>
                    )}
                  </div>
                </div>

                {/* Score & Review button */}
                <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-stone-100 gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-amber-900 block">
                      {app.matchScore}%
                    </span>
                    <span className="text-[10px] text-stone-500">Compatibility Score</span>
                  </div>

                  <button className="flex items-center gap-1 text-xs font-semibold text-amber-800 group-hover:underline">
                    <span>Inspect Dossier</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
