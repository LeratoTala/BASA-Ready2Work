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
  const [selectedMaxDistance, setSelectedMaxDistance] = useState<number | null>(null);
  const [selectedWorkMode, setSelectedWorkMode] = useState<'all' | 'in_person' | 'remote'>('all');

  // Compute profile completion percentage
  let completionScore = 30; // base registered
  if (candidate.headline) completionScore += 20;
  if (claims.length > 0) completionScore += 30;
  if (claims.some((c) => c.verificationStatus === 'Task-assessed' || c.verificationStatus === 'Peer-endorsed')) {
    completionScore += 20;
  }

  // Calculate matching scores for open jobs
  const openJobs = jobs.filter((j) => j.status === 'open');
  const scoredJobs = openJobs.map((job) => {
    const breakdown = calculateMatchScore(job, candidate, claims);
    return { job, breakdown };
  });

  // Sort descending by total match score M
  scoredJobs.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

  // Filter opportunities by location, reachable distance & work mode (FR-16)
  const filteredScoredJobs = scoredJobs.filter(({ job, breakdown }) => {
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
            <span className="text-stone-400">Passport Readiness:</span>
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

      {/* Recommended Opportunities Ranked by M = 0.50S + 0.25E + 0.15A + 0.10L */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Recommended Opportunities</h2>
            <p className="text-xs text-stone-500">
              Ranked by an explainable fit guide—not hiring odds. Skills (50%) + Evidence (25%) + Availability (15%) + Location (10%).
            </p>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {filteredScoredJobs.length} of {scoredJobs.length} open jobs shown
          </span>
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
                POPIA: Suburb Centroid Estimates (Zero GPS Tracking)
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
            <h3 className="text-sm font-bold text-stone-900">No opportunities match this distance</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              There are open opportunities outside this radius, or you can switch to "Remote Only" or widen your reachable distance.
            </p>
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScoredJobs.map(({ job, breakdown }) => {
              const hasApplied = applications.some((a) => a.jobId === job.id && a.status !== 'withdrawn');

              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job, breakdown)}
                  className="bg-white rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-sm transition-all p-5 flex flex-col justify-between cursor-pointer group space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-stone-500 block">
                          {job.employerName}
                        </span>
                        <h3 className="font-bold text-base text-stone-900 group-hover:text-amber-800">
                          {job.title}
                        </h3>
                      </div>
                      {/* Compatibility Score */}
                      <div className="text-center px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 shrink-0">
                        <span className="text-xs font-extrabold text-amber-900 block">
                          {breakdown.totalScore}%
                        </span>
                        <span className="text-[10px] text-amber-700 font-medium">Match</span>
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
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900 text-sm">
                        R{job.compensationAmount}
                      </span>
                      <span className="text-stone-500"> / {job.compensationUnit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasApplied ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                          <Check className="w-3.5 h-3.5" /> Applied
                        </span>
                      ) : (
                        <span className="text-amber-800 font-semibold group-hover:underline flex items-center gap-1">
                          View & Apply <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
