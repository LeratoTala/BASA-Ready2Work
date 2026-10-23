import type { ApplicationStatus } from './types';

/** Explicitly permitted application status transitions (spec Appendix A.1). */
export const VALID_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ['under_review', 'withdrawn'],
  under_review: ['shortlisted', 'not_selected', 'withdrawn'],
  shortlisted: ['selected', 'not_selected', 'withdrawn'],
  selected: ['completed', 'not_selected', 'withdrawn'],
  not_selected: [],
  completed: [],
  withdrawn: [],
};

export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Deterministic id: one application per candidate per job (duplicate prevention). */
export function applicationId(jobId: string, candidateId: string): string {
  return `${jobId}_${candidateId}`;
}
