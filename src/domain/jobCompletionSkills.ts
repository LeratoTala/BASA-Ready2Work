import { Application, EvidenceItem, Job, SkillClaim } from './types';
import { SKILL_DEFINITIONS } from './skillCatalogue';

export interface ApplyJobCompletionResult {
  updatedClaims: SkillClaim[];
  updatedSkillIds: string[];
  affectedSkillNames: string[];
  newSkillsAdded: string[];
  existingSkillsUpdated: string[];
}

/**
 * Automatically updates a candidate's Skill Passport when a job is marked completed.
 * 
 * Rules:
 * 1. For every skill required by the completed job (requiredSkillIds / requiredSkillNames):
 *    - If the candidate ALREADY has a SkillClaim for that skill:
 *      - Attach a verified work experience EvidenceItem referencing the completed job,
 *        employer name, duration served, and payout.
 *      - If the claim was "Self-reported", upgrade it to "Peer-endorsed" (Employer verified).
 *    - If the candidate DOES NOT have a SkillClaim for that skill:
 *      - Automatically create a new SkillClaim in their Skill Passport with the completed
 *        job as its primary proof item and set status to "Peer-endorsed" (Employer verified).
 *      - Add the skillId to the candidate's active skillIds list.
 * 2. Invariant: Candidate NEVER pays to receive this automatic passport enhancement.
 */
export function applyCompletedJobToSkillPassport(params: {
  candidateId: string;
  job: Job;
  application: Application;
  currentClaims: SkillClaim[];
  currentSkillIds: string[];
  workDurationLabel?: string;
  payoutAmountZAR?: number;
  now?: string;
}): ApplyJobCompletionResult {
  const {
    candidateId,
    job,
    application,
    currentClaims,
    currentSkillIds,
    workDurationLabel,
    payoutAmountZAR,
    now = new Date().toISOString(),
  } = params;

  // Resolve all required skills for this job
  const requiredSkillPairs: Array<{ id: string; name: string }> = [];

  // Match IDs
  for (let i = 0; i < (job.requiredSkillIds || []).length; i++) {
    const sid = job.requiredSkillIds[i];
    const sname =
      job.requiredSkillNames?.[i] ||
      SKILL_DEFINITIONS.find((s) => s.id === sid)?.name ||
      sid;
    requiredSkillPairs.push({ id: sid, name: sname });
  }

  // Also include any requiredSkillNames that were not in requiredSkillIds
  for (const name of job.requiredSkillNames || []) {
    if (!requiredSkillPairs.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      const matchDef = SKILL_DEFINITIONS.find((s) => s.name.toLowerCase() === name.toLowerCase());
      const sid = matchDef?.id || `skill-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      requiredSkillPairs.push({ id: sid, name });
    }
  }

  // If no required skills were configured on the job, fallback to the job title as a practical skill
  if (requiredSkillPairs.length === 0 && job.title) {
    const fallbackId = `skill-${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    requiredSkillPairs.push({ id: fallbackId, name: job.title });
  }

  const updatedClaims = [...currentClaims];
  const updatedSkillIdsSet = new Set(currentSkillIds);
  const affectedSkillNames: string[] = [];
  const newSkillsAdded: string[] = [];
  const existingSkillsUpdated: string[] = [];

  const durationStr =
    workDurationLabel ||
    application.actualTimeInWorkplace ||
    application.workDurationLabel ||
    'Completed engagement';
  const payStr = payoutAmountZAR ?? application.payoutAmountZAR ?? job.compensationAmount;

  for (const skill of requiredSkillPairs) {
    affectedSkillNames.push(skill.name);
    updatedSkillIdsSet.add(skill.id);

    // Build the verified job proof EvidenceItem
    const jobProofItem: EvidenceItem = {
      id: `ev-job-${application.id}-${skill.id}`,
      type: 'work_sample',
      title: `Completed Job: ${job.title} (${job.employerName})`,
      fileName: `Job_Completion_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileSize: 1024 * 256,
      mimeType: 'application/pdf',
      description: `Verified workplace performance: Successfully completed "${job.title}" with ${job.employerName}. Duration served: ${durationStr}. Compensation: R${payStr}. Confirmed by employer.`,
      uploadedAt: now,
    };

    // Find if candidate already has a claim for this skill
    const existingClaimIdx = updatedClaims.findIndex(
      (c) =>
        c.candidateId === candidateId &&
        (c.skillId === skill.id || c.skillName.toLowerCase() === skill.name.toLowerCase())
    );

    if (existingClaimIdx >= 0) {
      // Candidate already had this skill: append completed job evidence
      const existing = updatedClaims[existingClaimIdx];
      const existingEvidence = existing.evidenceItems || [];

      // Avoid duplicate evidence from the same application
      const hasItem = existingEvidence.some((e) => e.id === jobProofItem.id);
      const newEvidenceItems = hasItem ? existingEvidence : [...existingEvidence, jobProofItem];

      // Upgrade Self-reported claims to Peer-endorsed (Employer verified)
      const newStatus =
        existing.verificationStatus === 'Self-reported'
          ? 'Peer-endorsed'
          : existing.verificationStatus;

      updatedClaims[existingClaimIdx] = {
        ...existing,
        evidenceItems: newEvidenceItems,
        verificationStatus: newStatus,
        peerEndorserName: `${job.employerName} (Employer Verified)`,
      };
      existingSkillsUpdated.push(skill.name);
    } else {
      // Candidate did NOT have this skill: create brand-new SkillClaim in Skill Passport
      const newClaim: SkillClaim = {
        id: `claim-job-${application.id}-${skill.id}`,
        candidateId,
        skillId: skill.id,
        skillName: skill.name,
        selfReportedLevel: 'Intermediate',
        evidenceType: 'work_sample',
        evidenceTitle: `Verified Work Experience: ${job.title}`,
        evidenceDescription: `Skill demonstrated and verified through successful completion of "${job.title}" for ${job.employerName} (${durationStr}).`,
        evidenceUrlOrText: `Verified by employer: ${job.employerName}`,
        evidenceItems: [jobProofItem],
        verificationStatus: 'Peer-endorsed',
        peerEndorserName: `${job.employerName} (Employer Verified)`,
        createdAt: now,
      };
      updatedClaims.push(newClaim);
      newSkillsAdded.push(skill.name);
    }
  }

  return {
    updatedClaims,
    updatedSkillIds: Array.from(updatedSkillIdsSet),
    affectedSkillNames,
    newSkillsAdded,
    existingSkillsUpdated,
  };
}
