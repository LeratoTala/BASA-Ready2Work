import type { AvailabilityType, VerificationStatus } from '../domain/types';

/**
 * Matching-engine configuration (spec section 7.1).
 * M = wS*S + wE*E + wA*A + wL*L
 *
 * These weights are hypotheses, not validated predictors of job performance.
 * Change them here only, and note the change in docs/ARCHITECTURE.md.
 */
export const MATCH_WEIGHTS = {
  skills: 0.5,
  evidence: 0.25,
  availability: 0.15,
  location: 0.1,
} as const;

/**
 * How much each verification state contributes to evidence strength (0-100).
 * Based on Section 28.2: Self-reported 0.25 (25), Peer-endorsed 0.50 (50),
 * Task-assessed 0.85 (85), Mentor-reviewed 1.0 (100).
 */
export const EVIDENCE_SCORES: Record<VerificationStatus, number> = {
  'Mentor-reviewed': 100,
  'Task-assessed': 85,
  'Peer-endorsed': 50,
  'Self-reported': 25,
};

export const EVIDENCE_BASELINE = {
  /** No required skill matched but the candidate has stronger evidence elsewhere. */
  hasStrongEvidence: 25,
  /** No required skill matched and nothing verified. */
  none: 10,
} as const;

export const EVIDENCE_THRESHOLDS = { high: 80, medium: 50 } as const;

export type PayUnit = 'hourly' | 'daily' | 'fixed';

/** Availability fit (0-100) by candidate availability, with optional overrides. */
export const AVAILABILITY_SCORES: Record<
  AvailabilityType,
  { default: number; byPayUnit?: Partial<Record<PayUnit, number>>; remoteOrWeekendJob?: number }
> = {
  immediate: { default: 100 },
  full_time: { default: 100, byPayUnit: { hourly: 85 } },
  part_time: { default: 60, byPayUnit: { hourly: 100 } },
  weekends: { default: 45, remoteOrWeekendJob: 100 },
};
export const AVAILABILITY_FALLBACK = 70;
export const WEEKEND_KEYWORD = 'weekend';

export const LOCATION_SCORES = {
  remote: 100,
  sameArea: 100,
  sameMetro: 75,
  /** Different region, or either location unknown. */
  different: 30,
  unknown: 40,
} as const;

/** Tip shown when a self-reported claim could be upgraded by assessment. */
export const ASSESSMENT_UPLIFT_POINTS =
  EVIDENCE_SCORES['Task-assessed'] - EVIDENCE_SCORES['Self-reported'];
