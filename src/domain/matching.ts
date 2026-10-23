import type { CandidateProfile, Job, MatchBreakdown, SkillClaim } from './types';

import {
  ASSESSMENT_UPLIFT_POINTS,
  AVAILABILITY_FALLBACK,
  AVAILABILITY_SCORES,
  EVIDENCE_BASELINE,
  EVIDENCE_SCORES,
  EVIDENCE_THRESHOLDS,
  LOCATION_SCORES,
  MATCH_WEIGHTS,
  WEEKEND_KEYWORD,
} from '../config/scoring';
import { getMetroCluster } from '../config/locations';

export function calculateMatchScore(
  job: Job,
  candidate: CandidateProfile,
  candidateClaims: SkillClaim[]
): MatchBreakdown {
  const requiredSkills = job.requiredSkillNames || [];
  const candidateClaimMap = new Map<string, SkillClaim>();

  candidateClaims.forEach((claim) => {
    candidateClaimMap.set(claim.skillName.toLowerCase(), claim);
  });

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let totalEvidenceScore = 0;

  requiredSkills.forEach((reqSkill) => {
    const claim = candidateClaimMap.get(reqSkill.toLowerCase());
    if (claim) {
      matchedSkills.push(claim.skillName);
      const evWeight = EVIDENCE_SCORES[claim.verificationStatus] ?? EVIDENCE_SCORES['Self-reported'];
      totalEvidenceScore += evWeight;
    } else {
      missingSkills.push(reqSkill);
    }
  });

  // 1. Skill Alignment (S: 0-100)
  let S = 0;
  if (requiredSkills.length === 0) {
    S = 100;
  } else {
    S = Math.round((matchedSkills.length / requiredSkills.length) * 100);
  }

  // 2. Evidence Strength (E: 0-100)
  let E = 0;
  if (matchedSkills.length > 0) {
    E = Math.round(totalEvidenceScore / matchedSkills.length);
  } else {
    // If no direct required skills matched, give small baseline if candidate has any verified claims
    const verifiedAny = candidateClaims.some(
      (c) => c.verificationStatus === 'Task-assessed' || c.verificationStatus === 'Mentor-reviewed'
    );
    E = verifiedAny ? EVIDENCE_BASELINE.hasStrongEvidence : EVIDENCE_BASELINE.none;
  }

  // 3. Availability Fit (A: 0-100)
  const availabilityRule = AVAILABILITY_SCORES[candidate.availability];
  let A = AVAILABILITY_FALLBACK;
  if (availabilityRule) {
    A = availabilityRule.byPayUnit?.[job.compensationUnit] ?? availabilityRule.default;
    const weekendFriendly = job.workMode === 'Remote' || job.title.toLowerCase().includes(WEEKEND_KEYWORD);
    if (availabilityRule.remoteOrWeekendJob !== undefined && weekendFriendly) {
      A = availabilityRule.remoteOrWeekendJob;
    }
  }

  // 4. Location / Work Mode Fit (L: 0-100)
  let L: number = LOCATION_SCORES.unknown;
  if (job.workMode === 'Remote') {
    L = LOCATION_SCORES.remote;
  } else {
    const candidateLoc = (candidate.locationArea || '').toLowerCase().trim();
    const jobLoc = (job.locationArea || '').toLowerCase().trim();
    if (!candidateLoc || !jobLoc) {
      L = LOCATION_SCORES.unknown;
    } else if (candidateLoc === jobLoc || candidateLoc.includes(jobLoc) || jobLoc.includes(candidateLoc)) {
      L = LOCATION_SCORES.sameArea;
    } else {
      const candidateMetro = getMetroCluster(candidate.locationArea);
      const jobMetro = getMetroCluster(job.locationArea);
      L = candidateMetro && jobMetro && candidateMetro === jobMetro ? LOCATION_SCORES.sameMetro : LOCATION_SCORES.different;
    }
  }

  // Formula (spec 7.1): M = wS*S + wE*E + wA*A + wL*L, weights in config/scoring.ts
  const totalScore = Math.round(
    MATCH_WEIGHTS.skills * S +
      MATCH_WEIGHTS.evidence * E +
      MATCH_WEIGHTS.availability * A +
      MATCH_WEIGHTS.location * L
  );

  const reasons: string[] = [];
  const improvementTips: string[] = [];

  if (S === 100) {
    reasons.push(`Perfect skill match: You hold all ${matchedSkills.length} required skills for this role.`);
  } else if (S > 0) {
    reasons.push(`Partial skill match: You match ${matchedSkills.length} of ${requiredSkills.length} required skills.`);
  } else {
    reasons.push(`Skill gap: This role requires ${missingSkills.join(', ')}.`);
  }

  if (E >= EVIDENCE_THRESHOLDS.high) {
    reasons.push(`Stronger evidence: One or more matched skills are task-assessed or mentor-reviewed.`);
  } else if (E >= EVIDENCE_THRESHOLDS.medium) {
    reasons.push(`Peer-supported evidence: Your claims are backed by community references or peer endorsements.`);
  } else {
    reasons.push(`Self-reported evidence: Completing a practical assessment would give this application a major boost.`);
  }

  if (L === 100) {
    reasons.push(job.workMode === 'Remote' ? 'Fully remote opportunity (flexible from anywhere).' : `Exact location match in ${candidate.locationArea}.`);
  } else if (L >= 70) {
    reasons.push(`Accessible location within the greater metro area (${job.locationArea}).`);
  }

  // Constructive improvement suggestions
  if (missingSkills.length > 0) {
    improvementTips.push(`Add or practice: ${missingSkills.slice(0, 2).join(' and ')}.`);
  }
  const selfReportedMatched = matchedSkills.filter((s) => {
    const c = candidateClaimMap.get(s.toLowerCase());
    return c && c.verificationStatus === 'Self-reported';
  });
  if (selfReportedMatched.length > 0) {
    improvementTips.push(`Request a task assessment for "${selfReportedMatched[0]}" to increase evidence strength by up to ${ASSESSMENT_UPLIFT_POINTS} points.`);
  }

  return {
    totalScore,
    skillAlignment: S,
    evidenceStrength: E,
    availabilityFit: A,
    locationFit: L,
    matchedSkills,
    missingSkills,
    reasons,
    improvementTips,
  };
}
