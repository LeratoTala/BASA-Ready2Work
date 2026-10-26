import React, { useState } from 'react';
import { Application, CandidateProfile, Job, SkillClaim, PayoutConfirmationDetails } from '../../../domain/types';
import { Users, Filter, ChevronRight, Award, MapPin, Building2, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { ConfirmPayoutModal } from './ConfirmPayoutModal';

interface Props {
  applications: Application[];
  jobs: Job[];
  onSelectApplication: (app: Application) => void;
  candidateProfiles: Record<string, CandidateProfile>;
  skillClaims: SkillClaim[];
  onConfirmPayout?: (applicationId: string, details?: PayoutConfirmationDetails) => void;
}

export const ApplicantListView: React.FC<Props> = ({
  applications,
  jobs,
  onSelectApplication,
  candidateProfiles,
  skillClaims,
  onConfirmPayout,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [payoutModalApp, setPayoutModalApp] = useState<Application | null>(null);

  const activeApps = applications.filter(
    (a) => a.status !== 'completed' && a.status !== 'withdrawn'
  );
  const completedApps = applications.filter((a) => a.status === 'completed');

  const currentPool = activeTab === 'active' ? activeApps : completedApps;

  const filteredApps = currentPool.filter((app) => {
    if (selectedJobFilter !== 'all' && app.jobId !== selectedJobFilter) return false;
    if (activeTab === 'active') {
      if (selectedStatusFilter !== 'all' && app.status !== selectedStatusFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Job Applicants & Candidate Pipeline</h2>
          <p className="text-xs text-stone-500 mt-1">
            Review active applicants by demonstrable skills. Candidates who finish engagements move to Completed Engagements.
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

          {/* Active-only Status Filter */}
          {activeTab === 'active' && (
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="border border-stone-300 rounded px-2.5 py-1.5 text-xs bg-white text-stone-800"
            >
              <option value="all">All Active Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="selected">Selected</option>
            </select>
          )}
        </div>
      </div>

      {/* Pipeline View Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('active');
            setSelectedStatusFilter('all');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'active'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Active Applicants ({activeApps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('completed');
            setSelectedStatusFilter('all');
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'completed'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed Engagements ({completedApps.length})</span>
        </button>
      </div>

      {/* Applicant Cards */}
      {filteredApps.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-stone-700">
            {activeTab === 'active' ? 'No active applicants match this filter' : 'No completed engagements yet'}
          </p>
          <p className="text-xs text-stone-500">
            {activeTab === 'active'
              ? 'When candidates apply with their Skill Passport, they appear here until work is finished.'
              : 'Candidates move here after work is marked completed. You can verify and record payments here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const candidateClaims = skillClaims.filter((c) => c.candidateId === app.candidateId);
            const isCompleted = app.status === 'completed';

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

                    {/* Status Badge */}
                    <span
                      className={`ml-auto md:ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : app.status === 'selected'
                          ? 'bg-emerald-50 text-emerald-700'
                          : app.status === 'shortlisted'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>

                    {/* Payment Badge for Completed Engagements */}
                    {isCompleted && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          app.payoutConfirmed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {app.payoutConfirmed ? '✓ Paid' : 'Payment Pending'}
                      </span>
                    )}
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

                  {/* Active Workplace Status (No end date while still working) */}
                  {!isCompleted && app.status === 'selected' && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded mt-1 w-fit">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>At workplace · Started: <strong>{app.employmentStartDate || 'Recent'}</strong> (Duration ongoing)</span>
                    </div>
                  )}

                  {/* Completed Time Served & Rate Display */}
                  {isCompleted && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="flex items-center gap-1 font-medium text-stone-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-[11px]">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Time Served: <strong>{app.actualTimeInWorkplace || app.workDurationLabel || (app.hoursWorked ? `${app.hoursWorked} hours` : 'Full duration')}</strong></span>
                      </span>
                      <span className="font-bold text-emerald-800 text-[11px]">
                        Rate: R{app.payRateAmount ?? 'agreed'} / {app.payRateUnit ?? 'hour'}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Started {app.employmentStartDate} · Completed {app.employmentEndDate}
                      </span>
                    </div>
                  )}

                  {/* Completed Notes & Payout Confirmation Action */}
                  {isCompleted && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 text-xs">
                      {app.employerNotes && (
                        <p className="text-stone-600 italic text-[11px]">
                          &ldquo;{app.employerNotes}&rdquo;
                        </p>
                      )}
                      {!app.payoutConfirmed && onConfirmPayout && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayoutModalApp(app);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Confirm Payment Sent</span>
                        </button>
                      )}
                    </div>
                  )}
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
                    <span>{isCompleted ? 'View Record' : 'See profile and proof'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Payout Modal */}
      {payoutModalApp && (
        <ConfirmPayoutModal
          isOpen={Boolean(payoutModalApp)}
          onClose={() => setPayoutModalApp(null)}
          application={payoutModalApp}
          job={jobs.find((j) => j.id === payoutModalApp.jobId) || null}
          onConfirmPayout={(appId, details) => {
            onConfirmPayout?.(appId, details);
            setPayoutModalApp(null);
          }}
        />
      )}
    </div>
  );
};
