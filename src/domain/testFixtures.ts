import type { CandidateProfile, Job, SkillClaim } from './types';

/** Fictional fixtures for unit tests only. */
export function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    employerId: 'employer-1',
    employerName: 'Test Employer',
    employerVerified: true,
    title: 'Test Role',
    description: 'A test role',
    responsibilities: [],
    requiredSkillIds: ['skill-a', 'skill-b'],
    requiredSkillNames: ['Skill A', 'Skill B'],
    locationArea: 'Soweto',
    workMode: 'In-person',
    compensationAmount: 100,
    compensationCurrency: 'ZAR',
    compensationUnit: 'hourly',
    startDate: '2026-01-01',
    applicationDeadline: '2026-01-01',
    status: 'open',
    reportCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    uid: 'candidate-1',
    fullName: 'Test Candidate',
    headline: '',
    experienceSummary: '',
    skillIds: [],
    locationArea: 'Soweto',
    availability: 'immediate',
    popiaVisibility: 'private',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeClaim(skillName: string, status: SkillClaim['verificationStatus'] = 'Self-reported'): SkillClaim {
  return {
    id: `claim-${skillName}`,
    candidateId: 'candidate-1',
    skillId: `skill-${skillName}`,
    skillName,
    selfReportedLevel: 'Intermediate',
    evidenceType: 'work_sample',
    evidenceTitle: '',
    evidenceDescription: '',
    evidenceUrlOrText: '',
    verificationStatus: status,
    createdAt: '2026-01-01T00:00:00Z',
  };
}
