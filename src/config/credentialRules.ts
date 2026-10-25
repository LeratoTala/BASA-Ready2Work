import type { CredentialEvidence, VerificationStatus } from '../domain/types';
import { isCredentialExpired } from '../domain/credentialValidation';

/**
 * Section 35.4: Label Mapping Rules (Honest Evidence)
 *
 * Rules:
 *  - checked_ok + proctored exam or practical test -> Task-assessed
 *  - checked_ok + course-completion badge only     -> Peer-endorsed level
 *  - unchecked / needs_review / checked_mismatch   -> no label change (retains existing status)
 *  - expired credentials                          -> never raise the label
 */
export const CREDENTIAL_LABEL_MAPPING = {
  /** Proctored industry certifications (e.g., Red Cross First Aid, Microsoft MCP, SCA Barista) */
  proctored_exam_checked_ok: 'Task-assessed',
  trade_certificate_checked_ok: 'Task-assessed',
  /** Course completion or online participation badges (e.g., Coursera, NetAcad basic badge) */
  course_badge_checked_ok: 'Peer-endorsed',
  /** Default fallback if category is other */
  other_checked_ok: 'Peer-endorsed',
} as const;

/**
 * Calculates the resulting verification status when a credential is evaluated.
 * Never raises label on unchecked, needs_review, checked_mismatch, or expired credentials.
 */
export function resolveSkillLabelFromCredential(
  currentStatus: VerificationStatus,
  credentials?: CredentialEvidence | CredentialEvidence[]
): VerificationStatus {
  if (!credentials) return currentStatus;

  const credList = Array.isArray(credentials) ? credentials : [credentials];

  // Hierarchy: Mentor-reviewed (4) > Task-assessed (3) > Peer-endorsed (2) > Self-reported (1)
  const rank: Record<VerificationStatus, number> = {
    'Mentor-reviewed': 4,
    'Task-assessed': 3,
    'Peer-endorsed': 2,
    'Self-reported': 1,
  };

  let highest = currentStatus;

  for (const credential of credList) {
    // If status is not checked_ok or credential is expired, it cannot upgrade the status
    if (credential.checkStatus !== 'checked_ok') continue;
    if (isCredentialExpired(credential.expiresOn)) continue;

    const category = credential.credentialCategory || 'course_badge';
    let potentialLabel: VerificationStatus;

    if (category === 'proctored_exam' || category === 'trade_certificate') {
      potentialLabel = 'Task-assessed';
    } else {
      potentialLabel = 'Peer-endorsed';
    }

    if (rank[potentialLabel] > rank[highest]) {
      highest = potentialLabel;
    }
  }

  return highest;
}

/**
 * Section 35.4: Plain Language Explanations for Credential States (Grade 6 level)
 */
export const CREDENTIAL_EXPLANATIONS = {
  unchecked: {
    badge: 'Not checked yet',
    color: 'amber',
    plainText: 'You added this credential to your profile. An assessor has not checked it with the issuer yet.',
  },
  checked_ok: {
    badge: 'Checked with issuer',
    color: 'emerald',
    plainText: 'A platform assessor verified that this credential belongs to you and matches the official issuer records.',
  },
  checked_mismatch: {
    badge: 'Name / detail mismatch',
    color: 'rose',
    plainText: 'The name or details on this certificate do not match your BASA profile. An assessor has left an explanation note.',
  },
  needs_review: {
    badge: 'Needs assessor review',
    color: 'amber',
    plainText: 'This credential link or ID format needs manual review by an assessor before it can be verified.',
  },
  expired: {
    badge: 'Expired',
    color: 'stone',
    plainText: 'This certificate has passed its expiry date. It remains on your portfolio for history, but does not boost current job matching.',
  },
  accredited: {
    badge: 'Accredited Qualification',
    color: 'purple',
    plainText: 'This is an officially accredited qualification registered on the South African National Qualifications Framework (SAQA/NQF) or an authorized statutory body. Most platform badges are not accredited.',
  },
} as const;
