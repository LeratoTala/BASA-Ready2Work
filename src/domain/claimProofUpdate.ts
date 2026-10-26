import { EvidenceItem, SkillClaim } from './types';

export interface UpdateSkillProofPayload {
  evidenceTitle: string;
  evidenceDescription: string;
  evidenceType: 'photo_video' | 'client_review' | 'reference_note' | 'work_sample' | 'practical_demo';
  evidenceUrlOrText?: string;
  newEvidenceItems?: EvidenceItem[];
  existingEvidenceItemIdsToKeep?: string[];
}

export interface SkillProofStatus {
  hasProof: boolean;
  statusLabel: string;
  totalProofItems: number;
  filesCount: number;
  credentialsCount: number;
  completedJobsCount: number;
  summaryText: string;
}

/**
 * Determines whether proof/evidence has been uploaded for a candidate's skill claim.
 */
export function getSkillClaimProofStatus(claim: SkillClaim): SkillProofStatus {
  const files = claim.evidenceItems || [];
  const credentials = claim.credentials || [];
  const completedJobs = files.filter(
    (item) => item.type === 'work_sample' && item.title?.toLowerCase().includes('completed job')
  );

  const totalProofItems = files.length + credentials.length;
  const hasProof = totalProofItems > 0 || Boolean(claim.evidenceUrlOrText?.trim());

  let statusLabel = 'No proof uploaded yet';
  let summaryText = 'No supporting files, certificates, or verified jobs uploaded yet.';

  if (hasProof) {
    if (completedJobs.length > 0) {
      statusLabel = `Verified by Job (${completedJobs.length})`;
      summaryText = `Verified workplace experience attached (${completedJobs.length} completed job proof${completedJobs.length > 1 ? 's' : ''}).`;
    } else if (credentials.length > 0 && files.length > 0) {
      statusLabel = `Proof Uploaded (${totalProofItems} items)`;
      summaryText = `${files.length} document/photo${files.length > 1 ? 's' : ''} and ${credentials.length} certificate/badge${credentials.length > 1 ? 's' : ''} attached.`;
    } else if (credentials.length > 0) {
      statusLabel = `Certificate Attached (${credentials.length})`;
      summaryText = `${credentials.length} third-party certificate/badge${credentials.length > 1 ? 's' : ''} verified.`;
    } else if (files.length > 0) {
      statusLabel = `Proof Uploaded (${files.length} file${files.length > 1 ? 's' : ''})`;
      summaryText = `${files.length} supporting proof document/photo${files.length > 1 ? 's' : ''} attached.`;
    } else {
      statusLabel = 'Reference Link Uploaded';
      summaryText = 'Online work sample or reference details provided.';
    }
  }

  return {
    hasProof,
    statusLabel,
    totalProofItems,
    filesCount: files.length,
    credentialsCount: credentials.length,
    completedJobsCount: completedJobs.length,
    summaryText,
  };
}

/**
 * Updates a candidate's skill claim with new or revised proof.
 * Allowed even after submission so candidates can attach better proof or new certificates.
 */
export function updateClaimProof(
  claim: SkillClaim,
  payload: UpdateSkillProofPayload,
  now = new Date().toISOString()
): SkillClaim {
  // Filter existing items if specified, otherwise keep all existing
  const currentItems = claim.evidenceItems || [];
  const keptItems = payload.existingEvidenceItemIdsToKeep
    ? currentItems.filter((i) => payload.existingEvidenceItemIdsToKeep!.includes(i.id))
    : currentItems;

  const combinedEvidenceItems = [
    ...keptItems,
    ...(payload.newEvidenceItems || []),
  ];

  return {
    ...claim,
    evidenceTitle: payload.evidenceTitle.trim() || claim.evidenceTitle,
    evidenceDescription: payload.evidenceDescription.trim() || claim.evidenceDescription,
    evidenceType: payload.evidenceType || claim.evidenceType,
    evidenceUrlOrText:
      payload.evidenceUrlOrText !== undefined
        ? payload.evidenceUrlOrText.trim()
        : claim.evidenceUrlOrText,
    evidenceItems: combinedEvidenceItems,
    createdAt: claim.createdAt, // Preserve original registration date
  };
}
