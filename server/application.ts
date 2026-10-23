import { applicationId } from '../src/domain/applicationStatus';
import { calculateMatchScore } from '../src/domain/matching';
import type { Application, CandidateProfile, Job, SkillClaim } from '../src/domain/types';

export function buildApplicationRecord(
  job: Job,
  candidate: CandidateProfile,
  claims: SkillClaim[],
  submittedAt: string
): Application {
  const matchBreakdown = calculateMatchScore(job, candidate, claims);
  const id = applicationId(job.id, candidate.uid);

  return {
    id,
    jobId: job.id,
    jobTitle: job.title,
    employerId: job.employerId,
    employerName: job.employerName,
    candidateId: candidate.uid,
    candidateName: candidate.fullName,
    candidateHeadline: candidate.headline,
    candidateLocation: candidate.locationArea,
    candidateAvailability: candidate.availability,
    status: 'submitted',
    matchScore: matchBreakdown.totalScore,
    matchBreakdown,
    submittedAt,
    updatedAt: submittedAt,
  };
}