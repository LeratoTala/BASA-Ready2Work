import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  MapPin,
  Clock,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
  Share2,
  Download,
  Compass,
} from 'lucide-react';
import { Application, CandidateProfile, Job, MatchBreakdown, SkillClaim, WorkRecord } from '../../../domain/types';
import { calculateMatchScore } from '../../../domain/matching';
import {
  classifyCandidateJobs,
  filterCandidateJobs,
  CandidateJobFilter,
} from '../../../domain/candidateJobViews';
import { FEATURE_FLAGS } from '../../../config/featureFlags';
import type { ProfileDraft } from '../../../app/store/useLocalPrefs';
import { CandidateJourneyTracker } from '../../../shared/components/CandidateJourneyTracker';
import { TrustAndSafetyBanner } from '../../../shared/components/TrustAndSafetyBanner';

interface Props {
  candidate: CandidateProfile;
  claims: SkillClaim[];
  jobs: Job[];
  applications: Application[];
  workRecords: WorkRecord[];
  onOpenPassport: () => void;
  onOpenAIDrafter: () => void;
  onOpenSkills: () => void;
  onOpenExport?: () => void;
  onOpenProfile?: () => void;
  onSelectJob: (job: Job, breakdown: MatchBreakdown) => void;
  onUpdateProfile: (updates: Partial<CandidateProfile>) => void;
  profileDraft: ProfileDraft | null;
  onSaveDraft: (draft: ProfileDraft) => void;
}

export const CandidateDashboard: React.FC<Props> = ({
  candidate,
  claims,
  jobs,
  applications,
  workRecords,
  onOpenPassport,
  onOpenAIDrafter,
  onOpenSkills,
  onOpenExport,
  onOpenProfile,
  onSelectJob,
  onUpdateProfile,
  profileDraft,
  onSaveDraft,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editHeadline, setEditHeadline] = useState(candidate.headline);
  const [editLocation, setEditLocation] = useState(candidate.locationArea);
  const [editAvailability, setEditAvailability] = useState(candidate.availability);
  const [draftSavedAlert, setDraftSavedAlert] = useState(false);

  // R2 / FR-16: Location-aware filters
  // 4-Tab Job Category: available, applied, completed, all
  const [jobFilter, setJobFilter] = useState<CandidateJobFilter>('available');

  const [selectedMaxDistance, setSelectedMaxDistance] = useState<number | null>(null);
  const [selectedWorkMode, setSelectedWorkMode] = useState<'all' | 'in_person' | 'remote'>('all');

  // Compute profile completion percentage
  let completionScore = 30; // base registered
  if (candidate.headline) completionScore += 20;
  if (claims.length > 0) completionScore += 30;
  if (claims.some((c) => c.verificationStatus === 'Task-assessed' || c.verificationStatus === 'Peer-endorsed')) {
    completionScore += 20;
  }

  // Classify all jobs linking each to active or completed applications and payout status
  const classifiedJobs = classifyCandidateJobs(jobs, candidate, claims, applications);

  // Counters for the 4 candidate views
  const availableCount = filterCandidateJobs(classifiedJobs, 'available').length;
  const appliedCount = filterCandidateJobs(classifiedJobs, 'applied').length;
  const completedCount = filterCandidateJobs(classifiedJobs, 'completed').length;
  const allCount = filterCandidateJobs(classifiedJobs, 'all').length;

  // Filter according to selected tab (available, applied, completed, all)
  const tabJobs = filterCandidateJobs(classifiedJobs, jobFilter);

  // Filter opportunities by location, reachable distance & work mode (FR-16)
  const filteredScoredJobs = tabJobs.filter(({ job, breakdown }) => {
    if (!FEATURE_FLAGS.locationFilters) return true;

    const isRemote = job.workMode === 'Remote';
    if (selectedWorkMode === 'remote' && !isRemote) return false;
    if (selectedWorkMode === 'in_person' && isRemote) return false;

    if (selectedMaxDistance !== null && !isRemote) {
      if (breakdown.estimatedDistanceKm !== null && breakdown.estimatedDistanceKm !== undefined) {
        if (breakdown.estimatedDistanceKm > selectedMaxDistance) return false;
      }
    }
    return true;
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      headline: editHeadline,
      locationArea: editLocation,
      availability: editAvailability,
    });
    setIsEditingProfile(false);
  };

  const handleManualDraftSave = () => {
    onSaveDraft({
      editHeadline,
      editLocation,
      editAvailability,
      timestamp: new Date().toISOString(),
    });
    setDraftSavedAlert(true);
    setTimeout(() => setDraftSavedAlert(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Profile Card */}      <div className="bg-stone-900 text-white rounded-xl p-6 shadow-md border border-stone-800 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                Candidate Profile (South Africa)
              </span>
              <span className="text-xs text-stone-400">UID: {candidate.uid}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{candidate.fullName}</h1>
            <p className="text-stone-300 text-sm font-medium">{candidate.headline}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                {candidate.locationArea}
              </span>
              <span>·</span>
              <span className="capitalize">Availability: {candidate.availability.replace('_', ' ')}</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">{claims.length} Skills Recorded</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer"
                title="View your dedicated Candidate Profile Page"
              >
                View Profile Page
              </button>
            )}
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer"
            >
              {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button
              onClick={onOpenPassport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Skill Passport</span>
            </button>
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                title="Export verified Skill Passport as standardized PDF or LinkedIn summary"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Export / Share</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Completion Indicator (C-01) */}
        <div className="pt-2 border-t border-stone-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-400">Profile Completion:</span>
            <span className="font-bold text-amber-400">{completionScore}% Ready</span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Profile Edit Form with Local Draft Protection (FR-13, T-09) */}
      {isEditingProfile && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="font-bold text-sm text-stone-900">Edit Profile & Location Area</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualDraftSave}
                className="flex items-center gap-1 text-stone-500 hover:text-stone-800"
                title="Autosaves locally for offline/low connectivity recovery"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Offline Draft</span>
              </button>
              {draftSavedAlert && <span className="text-emerald-700 font-semibold">Saved locally!</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Professional Headline</label>
              <input
                type="text"
                required
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Broad Location Area (POPIA)</label>
              <input
                type="text"
                required
                placeholder="e.g. Soweto, Johannesburg"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Availability</label>
              <select
                value={editAvailability}
                onChange={(e) => setEditAvailability(e.target.value as any)}
                className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
              >
                <option value="immediate">Immediate (Ready to start today)</option>
                <option value="part_time">Part-time / Flexible</option>
                <option value="full_time">Full-time standard</option>
                <option value="weekends">Weekends only</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="px-3 py-1.5 text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* Journey Tracker — shows the 4-step path from skill recording to work completion */}
      <CandidateJourneyTracker
        candidate={candidate}
        claims={claims}
        applications={applications}
        workRecords={workRecords}
        onGoToSkills={onOpenSkills}
        onGoToOpportunities={() => {/* handled by parent tab */}}
      />

      {/* Trust & Safety — answers: how are candidates protected? */}
      <TrustAndSafetyBanner role="candidate" />

      {/* Quick Action Cards (Skills, Passport, AI CV) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={onOpenSkills}
          className="bg-white p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start justify-between cursor-pointer group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Evidence Portfolio
            </span>
            <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-800">
              Manage Skills ({claims.length})
            </h4>
            <p className="text-xs text-stone-500">Add practical claims & request bench tests.</p>
          </div>
          <Award className="w-5 h-5 text-stone-400 group-hover:text-amber-600 shrink-0" />
        </button>

        <button
          onClick={onOpenPassport}
          className="bg-white p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start justify-between cursor-pointer group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Your Skill Passport
            </span>
            <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-800">
              View Skill Passport
            </h4>
            <p className="text-xs text-stone-500">Recorded skills and evidence labels.</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-stone-400 group-hover:text-amber-600 shrink-0" />
        </button>

        <button
          onClick={onOpenAIDrafter}
          className="bg-white p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-xs transition-all text-left flex items-start justify-between cursor-pointer group"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              AI Assistance (FR-14)
            </span>
            <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-800">
              Draft CV with AI
            </h4>
            <p className="text-xs text-stone-500">Fact-constrained professional summary.</p>
          </div>
          <Sparkles className="w-5 h-5 text-stone-400 group-hover:text-amber-600 shrink-0" />
        </button>
      </div>

      {/* Opportunities & Applications Section with 4 Category Tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Opportunities &amp; Applications</h2>
            <p className="text-xs text-stone-500">
              How we match you: Skills you have (50%) + Proof & evidence (25%) + Available hours (15%) + How close it is (10%).
            </p>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {filteredScoredJobs.length} of {tabJobs.length} shown in this view
          </span>
        </div>

        {/* 4-Tab Segmented Control: Available, Applied, Completed, All */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setJobFilter('available')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                jobFilter === 'available'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
              }`}
            >
              <span>Available Jobs</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  jobFilter === 'available'
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {availableCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setJobFilter('applied')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                jobFilter === 'applied'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
              }`}
            >
              <span>Applied</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  jobFilter === 'applied'
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {appliedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setJobFilter('completed')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                jobFilter === 'completed'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
              }`}
            >
              <span>Completed</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  jobFilter === 'completed'
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {completedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setJobFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                jobFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/70'
              }`}
            >
              <span>All Jobs</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  jobFilter === 'all'
                    ? 'bg-amber-800 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {allCount}
              </span>
            </button>
          </div>

          {/* Plain-Language Grade 6 Guidance Banner */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-950 flex items-start gap-2">
            <span className="font-bold text-amber-800 shrink-0">
              {jobFilter === 'available' && 'Available Jobs:'}
              {jobFilter === 'applied' && 'Your Applications:'}
              {jobFilter === 'completed' && 'Completed Jobs:'}
              {jobFilter === 'all' && 'All Jobs:'}
            </span>
            <span className="text-amber-900">
              {jobFilter === 'available' &&
                'These are open jobs you can apply for right now. Once you apply, the job moves to "Applied" so you don\'t apply twice.'}
              {jobFilter === 'applied' &&
                'Here are the jobs you applied for. You can see if the employer is looking at your application, has shortlisted you, or picked you for the job.'}
              {jobFilter === 'completed' &&
                'Here are the jobs you finished. You can see whether the employer has confirmed payment (Paid) or if payment is still pending.'}
              {jobFilter === 'all' &&
                'Browse every job on the app. Every card clearly shows if you applied, the job status, or if it is open to apply.'}
            </span>
          </div>
        </div>

        {/* Location & Reachable Distance Filter Bar (R2 / FR-16) */}
        {FEATURE_FLAGS.locationFilters && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Location & Reachable Distance (FR-16)
                </span>
                <span className="text-xs text-stone-500 font-normal">
                  · from <strong className="text-stone-700">{candidate.locationArea || 'Your area'}</strong>
                </span>
              </div>
              <span className="text-[11px] text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded">
                Privacy Protected: Town or area only (Zero live GPS tracking)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Work Mode Selector */}
              <div className="flex items-center gap-1 bg-white border border-stone-200 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedWorkMode('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    selectedWorkMode === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All Modes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWorkMode('in_person')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    selectedWorkMode === 'in_person'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  In-Person / Hybrid
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWorkMode('remote')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    selectedWorkMode === 'remote'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Remote Only
                </button>
              </div>

              {/* Distance Filter Selector */}
              {selectedWorkMode !== 'remote' && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-stone-500 font-medium">Reachable within:</span>
                  <div className="flex items-center gap-1 bg-white border border-stone-200 p-0.5 rounded-lg">
                    {[
                      { label: 'Any', value: null },
                      { label: '~15 km', value: 15 },
                      { label: '~30 km', value: 30 },
                      { label: '~50 km', value: 50 },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setSelectedMaxDistance(option.value)}
                        className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                          selectedMaxDistance === option.value
                            ? 'bg-stone-900 text-white'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Filters */}
              {(selectedMaxDistance !== null || selectedWorkMode !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMaxDistance(null);
                    setSelectedWorkMode('all');
                  }}
                  className="text-xs text-amber-700 hover:text-amber-800 underline font-medium ml-auto cursor-pointer"
                >
                  Reset Location Filters
                </button>
              )}
            </div>
          </div>
        )}

        {filteredScoredJobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-3">
            <Compass className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-stone-900">
              {jobFilter === 'available' && 'No unapplied opportunities in this view'}
              {jobFilter === 'applied' && 'No active applications in progress'}
              {jobFilter === 'completed' && 'No completed jobs recorded yet'}
              {jobFilter === 'all' && 'No opportunities match this distance or filter'}
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              {jobFilter === 'available' &&
                'You have applied to all matching open opportunities, or there are no open listings within your selected distance.'}
              {jobFilter === 'applied' &&
                'Head to Available Jobs to discover opportunities and submit your Skill Passport!'}
              {jobFilter === 'completed' &&
                'Once an employer marks your work as completed and confirms payout, it will appear here.'}
              {jobFilter === 'all' &&
                'Try clearing distance limits or switching work mode to remote.'}
            </p>
            {(selectedMaxDistance !== null || selectedWorkMode !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedMaxDistance(null);
                  setSelectedWorkMode('all');
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Clear Distance Limit
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScoredJobs.map(
              ({ job, breakdown, application, hasApplied, isCompleted, payoutStatus }) => {
                return (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob(job, breakdown)}
                    className="bg-white rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-sm transition-all p-5 flex flex-col justify-between cursor-pointer group space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-stone-500">
                              {job.employerName}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded">
                              ID: #{job.id}
                            </span>
                          </div>
                          <h3 className="font-bold text-base text-stone-900 group-hover:text-amber-800 mt-0.5">
                            {job.title}
                          </h3>
                        </div>

                        {/* Badges / Compatibility Header */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="text-center px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 shrink-0">
                            <span className="text-xs font-extrabold text-amber-900 block">
                              {breakdown.totalScore}%
                            </span>
                            <span className="text-[10px] text-amber-700 font-medium">Match</span>
                          </div>

                          {/* Job Open / Closed Listing Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              job.status === 'open'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-stone-100 text-stone-600 border border-stone-300'
                            }`}
                          >
                            {job.status === 'open' ? 'Job: Open' : 'Job: Closed'}
                          </span>

                          {/* Tab-specific Application / Completion Badge */}
                          {hasApplied && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isCompleted
                                  ? payoutStatus === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : application?.status === 'shortlisted'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : application?.status === 'selected'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                  : application?.status === 'under_review'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-300'
                                  : 'bg-stone-100 text-stone-700 border border-stone-300'
                              }`}
                            >
                              {isCompleted
                                ? payoutStatus === 'paid'
                                  ? 'Completed · Paid'
                                  : 'Completed · Payment Pending'
                                : `Applied · ${application?.status?.replace('_', ' ')}`}
                            </span>
                          )}

                          {!hasApplied && jobFilter === 'all' && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                job.status === 'open'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-stone-100 text-stone-500 border border-stone-200'
                              }`}
                            >
                              {job.status === 'open' ? 'Open to Apply' : 'Closed'}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2">{job.description}</p>

                      {/* Location & Distance Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {job.locationArea} ({job.workMode})
                        </span>
                        {breakdown.distanceLabel && (
                          <>
                            <span>·</span>
                            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded">
                              {breakdown.distanceLabel}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Required skills */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {job.requiredSkillNames.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Completed Engagement Payout Alert Box */}
                      {isCompleted && (
                        <div
                          className={`mt-2 p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                            payoutStatus === 'paid'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-amber-50 border-amber-300 text-amber-950'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-medium">
                            {payoutStatus === 'paid' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span>
                              {payoutStatus === 'paid'
                                ? 'Payment confirmed by employer'
                                : 'Work completed · Waiting for employer payment'}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              payoutStatus === 'paid'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-200 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {payoutStatus === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      )}

                      {/* Applied Review Notes Preview */}
                      {!isCompleted && application?.employerNotes && (
                        <div className="mt-2 p-2 bg-stone-50 border border-stone-200 rounded text-[11px] text-stone-600 italic">
                          &ldquo;{application.employerNotes}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900 text-sm">
                          R{job.compensationAmount}
                        </span>
                        <span className="text-stone-500"> / {job.compensationUnit}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <span className="text-emerald-800 font-semibold group-hover:underline flex items-center gap-1">
                            View Completed Job <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        ) : hasApplied ? (
                          <span className="text-stone-700 font-semibold group-hover:underline flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Check Status <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold group-hover:underline flex items-center gap-1">
                            View Job Details <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
};
