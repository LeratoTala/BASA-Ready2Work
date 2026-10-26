import type { EmployerPlanId } from '../src/config/plans';

export const PLAN_RANK: Record<EmployerPlanId, number> = {
  free: 0,
  starter: 1,
  business: 2,
  partner: 3,
};

export interface UpgradeRequestInput {
  callerUid?: string;
  employerId: string;
  targetPlan: EmployerPlanId;
  currentPlan?: EmployerPlanId;
  notes?: string;
}

export interface PlanChangeInput {
  callerUid?: string;
  employerId: string;
  targetPlan: EmployerPlanId;
  currentPlan: EmployerPlanId;
  reason?: string;
}

export interface AdminApproveUpgradeInput {
  callerUid?: string;
  callerIsAdmin: boolean;
  requestId: string;
  decision: 'approved' | 'declined';
  currentRequestStatus?: string;
}

export interface ValidationResult {
  valid: boolean;
  statusCode: number;
  error?: string;
}

/**
 * Validates employer upgrade request submission.
 * Enforces:
 * 1. Caller authentication
 * 2. Caller owns employer ID (cannot submit for another employer)
 * 3. Target plan is a higher tier than current plan
 */
export function validateUpgradeRequest(input: UpgradeRequestInput): ValidationResult {
  if (!input.callerUid) {
    return {
      valid: false,
      statusCode: 401,
      error: 'Authentication required. Please sign in to request a plan upgrade.',
    };
  }

  if (input.callerUid !== input.employerId) {
    return {
      valid: false,
      statusCode: 403,
      error: 'Forbidden: You cannot submit upgrade requests for another employer.',
    };
  }

  const validTargetPlans: EmployerPlanId[] = ['starter', 'business', 'partner'];
  if (!validTargetPlans.includes(input.targetPlan)) {
    return {
      valid: false,
      statusCode: 400,
      error: `Invalid target plan "${input.targetPlan}". Must be starter, business, or partner.`,
    };
  }

  const currentPlan = input.currentPlan || 'free';
  if (PLAN_RANK[input.targetPlan] <= PLAN_RANK[currentPlan]) {
    return {
      valid: false,
      statusCode: 400,
      error: `Cannot request upgrade: target plan "${input.targetPlan}" is not higher than current plan "${currentPlan}". Use change-plan to downgrade.`,
    };
  }

  return { valid: true, statusCode: 200 };
}

/**
 * Validates employer plan downgrade or cancellation.
 * Enforces:
 * 1. Caller authentication
 * 2. Caller owns employer ID (cannot change another employer's plan)
 * 3. Target plan is strictly lower than current plan (genuine downgrade / cancellation)
 * 4. Invariant: Existing jobs and applicants are never deleted; only new postings beyond limit are blocked.
 */
export function validatePlanChange(input: PlanChangeInput): ValidationResult {
  if (!input.callerUid) {
    return {
      valid: false,
      statusCode: 401,
      error: 'Authentication required. Please sign in to change your plan.',
    };
  }

  if (input.callerUid !== input.employerId) {
    return {
      valid: false,
      statusCode: 403,
      error: 'Forbidden: You cannot modify subscription plans for another employer.',
    };
  }

  const currentRank = PLAN_RANK[input.currentPlan ?? 'free'];
  const targetRank = PLAN_RANK[input.targetPlan];

  if (targetRank === undefined) {
    return {
      valid: false,
      statusCode: 400,
      error: `Invalid target plan "${input.targetPlan}".`,
    };
  }

  if (targetRank >= currentRank) {
    return {
      valid: false,
      statusCode: 400,
      error: `Invalid plan change: "${input.targetPlan}" is not a downgrade from "${input.currentPlan}". Upgrades must be submitted via /api/employer/upgrade-request.`,
    };
  }

  return { valid: true, statusCode: 200 };
}

/**
 * Validates administrator review of an upgrade request.
 * Enforces:
 * 1. Caller must have administrator privileges (custom claim or admin record)
 * 2. Request ID must be provided
 * 3. Decision must be 'approved' or 'declined'
 * 4. Request must currently be in 'pending' status
 */
export function validateAdminApproveUpgrade(input: AdminApproveUpgradeInput): ValidationResult {
  if (!input.callerUid) {
    return {
      valid: false,
      statusCode: 401,
      error: 'Authentication required. Please sign in as administrator.',
    };
  }

  if (!input.callerIsAdmin) {
    return {
      valid: false,
      statusCode: 403,
      error: 'Forbidden: Administrator privileges required to approve or decline upgrade requests.',
    };
  }

  if (!input.requestId || !input.requestId.trim()) {
    return {
      valid: false,
      statusCode: 400,
      error: 'requestId is required.',
    };
  }

  if (input.decision !== 'approved' && input.decision !== 'declined') {
    return {
      valid: false,
      statusCode: 400,
      error: 'decision must be either "approved" or "declined".',
    };
  }

  if (input.currentRequestStatus && input.currentRequestStatus !== 'pending') {
    return {
      valid: false,
      statusCode: 400,
      error: `Request has already been processed with status "${input.currentRequestStatus}".`,
    };
  }

  return { valid: true, statusCode: 200 };
}
