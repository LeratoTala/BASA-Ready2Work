import type { Job, Application, CandidateProfile, SkillClaim, MatchBreakdown } from './types';
import { calculateMatchScore } from './matching';

export type CandidateJobFilter = 'available' | 'applied' | 'completed' | 'all';

export type PayoutStatus = 'paid' | 'payment_pending' | 'not_applicable';

export interface ScoredCandidateJob {
  job: Job;
  breakdown: MatchBreakdown;
  application: Application | null;
  hasApplied: boolean;
  isCompleted: boolean;
  payoutStatus: PayoutStatus;
}

/**
 * Classifies all jobs for a specific candidate, linking each job to any active
 * or completed application and determining its payout confirmation state.
 */
export function classifyCandidateJobs(
  jobs: Job[],
  candidate: CandidateProfile,
  claims: SkillClaim[],
  applications: Application[]
): ScoredCandidateJob[] {
  return jobs.map((job) => {
    const breakdown = calculateMatchScore(job, candidate, claims);
    const application =
      applications.find(
        (a) => a.jobId === job.id && a.candidateId === candidate.uid
      ) || null;
    const hasApplied = Boolean(application);
    const isCompleted = application?.status === 'completed';

    let payoutStatus: PayoutStatus = 'not_applicable';
    if (isCompleted) {
      payoutStatus = application?.payoutConfirmed ? 'paid' : 'payment_pending';
    }

    return {
      job,
      breakdown,
      application,
      hasApplied,
      isCompleted,
      payoutStatus,
    };
  });
}

/**
 * Filters classified jobs into the 4 candidate views:
 * 1. Available: Open jobs not yet applied to (once applied, they leave this tab).
 * 2. Applied: Active applications currently in review or hiring pipeline.
 * 3. Completed: Concluded engagements showing paid or pending payout status.
 * 4. All Jobs: Complete directory showing application status on every post.
 */
export function filterCandidateJobs(
  scoredJobs: ScoredCandidateJob[],
  filter: CandidateJobFilter
): ScoredCandidateJob[] {
  switch (filter) {
    case 'available':
      // Open opportunities that the candidate has NOT applied to yet
      return scoredJobs
        .filter((item) => item.job.status === 'open' && !item.hasApplied)
        .sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

    case 'applied':
      // Active in-progress applications
      return scoredJobs
        .filter((item) => item.hasApplied && !item.isCompleted)
        .sort((a, b) => {
          const timeA = a.application?.submittedAt ? new Date(a.application.submittedAt).getTime() : 0;
          const timeB = b.application?.submittedAt ? new Date(b.application.submittedAt).getTime() : 0;
          return timeB - timeA;
        });

    case 'completed':
      // Concluded engagements with payout status
      return scoredJobs
        .filter((item) => item.hasApplied && item.isCompleted)
        .sort((a, b) => {
          const timeA = a.application?.updatedAt ? new Date(a.application.updatedAt).getTime() : 0;
          const timeB = b.application?.updatedAt ? new Date(b.application.updatedAt).getTime() : 0;
          return timeB - timeA;
        });

    case 'all':
    default:
      // All platform jobs, ranked by compatibility match score
      return [...scoredJobs].sort(
        (a, b) => b.breakdown.totalScore - a.breakdown.totalScore
      );
  }
}
