import { canEmployerPostActiveJob, getPlanConfig, type EmployerPlanId } from '../src/config/plans';

export interface VerifyJobCreationLimitsParams {
  employerUid: string;
  employerVerificationStatus: 'verified' | 'pending' | 'unverified';
  employerPlan?: EmployerPlanId;
  currentActiveJobCount: number;
}

export interface VerifyJobCreationLimitsResult {
  allowed: boolean;
  statusCode: number;
  error?: string;
  limit: number;
}

/**
 * Server-side enforcement of active-job limits and employer verification on job creation.
 * Evaluates whether an employer has reached their tier limit before writing to Firestore.
 */
export function verifyJobCreationLimits(
  params: VerifyJobCreationLimitsParams
): VerifyJobCreationLimitsResult {
  // Hard Rule 30.1: Unverified employers cannot publish opportunities
  if (params.employerVerificationStatus !== 'verified') {
    return {
      allowed: false,
      statusCode: 403,
      error: 'Only verified registered employers may publish active opportunities.',
      limit: 0,
    };
  }

  const planId = params.employerPlan || 'free';
  const planConfig = getPlanConfig(planId);
  const gating = canEmployerPostActiveJob(params.currentActiveJobCount, planId);

  if (!gating.allowed) {
    return {
      allowed: false,
      statusCode: 403,
      error: gating.reason || `Active job posting limit reached for ${planConfig.name}.`,
      limit: gating.limit,
    };
  }

  return {
    allowed: true,
    statusCode: 200,
    limit: gating.limit,
  };
}
