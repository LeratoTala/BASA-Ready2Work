import type { Application, SkillClaim, WorkRecord } from './types';

export interface PilotMetrics {
  /** Total application records created on the platform. */
  applicationRecords: number;
  /** Applications currently at shortlisted status (point-in-time snapshot). */
  currentlyShortlisted: number;
  /** Work records where employer confirmed completion. */
  completedWorkRecords: number;
  /** Completed records where employer also confirmed payout (self-reported, not audited). */
  employerReportedPayouts: number;
  /** Skills promoted beyond Self-reported — the core trust signal. */
  verifiedSkillsBreakdown: {
    peerEndorsed: number;
    taskAssessed: number;
    mentorReviewed: number;
    total: number;
  };
  /**
   * Candidates with at least one completed work record — a proxy for "translated talent
   * into a genuine opportunity". Sustained income requires multiple; track separately.
   */
  candidatesWithCompletedWork: number;
  /**
   * Repeat engagements: candidates with more than one completed work record.
   * This is the closest platform-observable proxy for sustained income.
   */
  candidatesWithRepeatEngagements: number;
}

export function calculatePilotMetrics(
  applications: readonly Pick<Application, 'status' | 'candidateId'>[],
  workRecords: readonly Pick<WorkRecord, 'completionStatus' | 'payoutConfirmed' | 'candidateId'>[],
  skillClaims?: readonly Pick<SkillClaim, 'verificationStatus'>[]
): PilotMetrics {
  const completedRecords = workRecords.filter((r) => r.completionStatus === 'completed');

  // Candidates who completed at least one engagement
  const completedByCandidateId = new Map<string, number>();
  completedRecords.forEach((r) => {
    completedByCandidateId.set(r.candidateId, (completedByCandidateId.get(r.candidateId) ?? 0) + 1);
  });

  const candidatesWithCompletedWork = completedByCandidateId.size;
  const candidatesWithRepeatEngagements = [...completedByCandidateId.values()].filter((n) => n > 1).length;

  // Verified skills breakdown
  const claims = skillClaims ?? [];
  const verifiedSkillsBreakdown = {
    peerEndorsed: claims.filter((c) => c.verificationStatus === 'Peer-endorsed').length,
    taskAssessed: claims.filter((c) => c.verificationStatus === 'Task-assessed').length,
    mentorReviewed: claims.filter((c) => c.verificationStatus === 'Mentor-reviewed').length,
    total: claims.filter((c) => c.verificationStatus !== 'Self-reported').length,
  };

  return {
    applicationRecords: applications.length,
    currentlyShortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    completedWorkRecords: completedRecords.length,
    employerReportedPayouts: completedRecords.filter((r) => r.payoutConfirmed).length,
    verifiedSkillsBreakdown,
    candidatesWithCompletedWork,
    candidatesWithRepeatEngagements,
  };
}
