/**
 * BASA Ready2Work Employer Subscription Plans & Sustainability Engine (Section 39 - P3)
 *
 * Core Revenue Model:
 *  - Free: 1 active job post, community-level candidates, email support.
 *  - Starter (R199/month): up to 5 active jobs, verified candidates filter, shortlist export.
 *  - Business (R599/month): up to 20 active jobs, custom assessment request, priority support.
 *  - Partner (Custom): unlimited jobs, bespoke rubric, SLA, dedicated account manager.
 *
 * HARD INVARIANTS (Section 36.3 & 39.4):
 *  1. Candidates NEVER pay to register, build a Skill Passport, get verified, be matched, or apply.
 *  2. Matching ranking is 100% blind to employer plan/payment (plan NEVER affects candidate ranking).
 *  3. In the pilot, billing is invoiced manually; zero card processing or card storage.
 */

export type EmployerPlanId = 'free' | 'starter' | 'business' | 'partner';

export interface EmployerPlanConfig {
  id: EmployerPlanId;
  name: string;
  priceZarMonthly: number;
  activeJobLimit: number;
  features: string[];
  badge: string;
  isPopular?: boolean;
}

export const CANDIDATE_NEVER_PAYS_INVARIANT =
  'HARD RULE (Section 36.3): Candidates NEVER pay any fee to register, build a Skill Passport, get verified, be matched, or apply. No fees, no paywalls, no premium candidate tiers, no pay-to-rank.';

export const MATCHING_PLAN_INDEPENDENT_INVARIANT =
  'HARD RULE (Section 39.4): Matching is 100% independent of candidate payment or employer subscription tier. An employer plan NEVER influences match score algorithms or moves unverified candidates above verified ones.';

export const EMPLOYER_PLANS: Record<EmployerPlanId, EmployerPlanConfig> = {
  free: {
    id: 'free',
    name: 'Free (SMME Pilot)',
    priceZarMonthly: 0,
    activeJobLimit: 1,
    badge: 'Free Tier',
    features: [
      '1 active job listing at a time',
      'Community-level candidates & applicants',
      'Standard email support',
      'Basic candidate profile view',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    priceZarMonthly: 199,
    activeJobLimit: 5,
    badge: 'Popular for SMMEs',
    isPopular: true,
    features: [
      'Up to 5 active job listings',
      'Verified candidates filter & shortlist',
      'Applicant profile view (PDF export coming soon)',
      'Pilot email support (WhatsApp coming soon)',
    ],
  },
  business: {
    id: 'business',
    name: 'Business Growth',
    priceZarMonthly: 599,
    activeJobLimit: 20,
    badge: 'For Growing Firms',
    features: [
      'Up to 20 active job listings',
      'Verified-first matching filter',
      'Priority email support (Phone support coming soon)',
      'Custom micro-task assessment request (Coming soon)',
    ],
  },
  partner: {
    id: 'partner',
    name: 'Enterprise / Partner',
    priceZarMonthly: 0, // Custom invoiced
    activeJobLimit: 999999, // Unlimited
    badge: 'Custom Corporate',
    features: [
      'Unlimited active job listings',
      'Dedicated pilot support & account review',
      'Bespoke trade rubric design (Coming soon)',
      'Direct HRIS integration / API access (Coming soon)',
    ],
  },
};

/**
 * Returns configuration for a given plan ID, defaulting safely to 'free'.
 */
export function getPlanConfig(planId?: string): EmployerPlanConfig {
  if (planId && planId in EMPLOYER_PLANS) {
    return EMPLOYER_PLANS[planId as EmployerPlanId];
  }
  return EMPLOYER_PLANS.free;
}

/**
 * Section 39.2 & 39.3: Evaluates whether an employer may publish another active job.
 */
export function canEmployerPostActiveJob(
  currentActiveJobCount: number,
  planId: EmployerPlanId = 'free'
): { allowed: boolean; reason?: string; limit: number } {
  const plan = getPlanConfig(planId);
  const limit = plan.activeJobLimit;

  if (currentActiveJobCount >= limit) {
    return {
      allowed: false,
      limit,
      reason: `You have reached your plan's limit of ${limit} active job${limit === 1 ? '' : 's'}. Close an existing job or request an upgrade.`,
    };
  }

  return { allowed: true, limit };
}

/**
 * Pulse survey questions for employer price validation (Section 39.7).
 */
export const PRICING_PULSE_SURVEY = {
  question1: {
    id: 'q1_fair_price',
    text: 'Is R199/month fair for 5 active jobs and verified candidate shortlists?',
    options: ['Too high', 'Fair', 'Too low'],
  },
  question2: {
    id: 'q2_upgrade_driver',
    text: 'What would make you upgrade to a paid employer tier?',
    options: [
      'More active job slots (5+ jobs)',
      'Pre-tested candidates with Task-assessed rubrics',
      'Fast candidate placement turnaround (<48 hours)',
      'Candidate identity and CIPC background checks',
    ],
  },
  question3: {
    id: 'q3_annual_discount',
    text: 'Would you pay annually in advance for a 20% discount (R1,910/year)?',
    options: ['Yes', 'No', 'Maybe, once verified'],
  },
  question4: {
    id: 'q4_cheaper_plan',
    text: 'Would a cheaper 2-job plan (e.g. R99/month) fit your business better than the 5-job Starter plan?',
    options: [
      'Yes, 2 jobs at R99/mo would be ideal',
      'No, 5 jobs at R199/mo is the right size',
      'I only need the Free 1-job tier',
    ],
  },
};
