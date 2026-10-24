import type {
  AssessmentRecord,
  PeerEndorsement,
  MentorReview,
  RubricCriterion,
  SkillClaim,
  VerificationStatus,
} from './types';

/**
 * Standard passing score for practical micro-task assessment against rubrics.
 * Per specification: 70/100 threshold required for 'Task-assessed'.
 */
export const ASSESSMENT_PASS_THRESHOLD = 70;

export interface RubricTemplate {
  skillId?: string;
  skillName: string;
  category: string;
  criteria: Omit<RubricCriterion, 'score' | 'passed' | 'notes'>[];
}

export const STANDARD_RUBRICS: Record<string, RubricTemplate> = {
  default: {
    skillName: 'General Practical Skill',
    category: 'Practical & Trades',
    criteria: [
      {
        id: 'c1',
        title: 'Core Technical Execution',
        description: 'Performs procedure according to standard industry benchmarks.',
        maxPoints: 25,
      },
      {
        id: 'c2',
        title: 'Safety, PPE & Protocol Compliance',
        description: 'Adheres strictly to workshop safety, electrical isolation, or hygiene.',
        maxPoints: 25,
      },
      {
        id: 'c3',
        title: 'Tool & Equipment Care',
        description: 'Uses appropriate instruments, cleans workstation, prevents damage.',
        maxPoints: 25,
      },
      {
        id: 'c4',
        title: 'Efficiency & Troubleshooting',
        description: 'Demonstrates confidence, speed, and handles minor defects appropriately.',
        maxPoints: 25,
      },
    ],
  },
  'skill-solar': {
    skillName: 'Solar PV Rooftop Mounting & DC Wiring',
    category: 'Technical & Trades',
    criteria: [
      {
        id: 'c1',
        title: 'DC Cabling & Rail Clamping',
        description: 'Properly torques rooftop brackets and crimps MC4 connectors without exposed wire.',
        maxPoints: 25,
      },
      {
        id: 'c2',
        title: 'Height & Electrical Isolation Safety',
        description: 'Uses safety harness, checks roof anchor points, and tests zero voltage with multimeter.',
        maxPoints: 25,
      },
      {
        id: 'c3',
        title: 'Inverter & Battery Wiring Hygiene',
        description: 'Labels DC/AC runs correctly and adheres to South African SANS 10142-1 wire sizing.',
        maxPoints: 25,
      },
      {
        id: 'c4',
        title: 'System Startup Diagnostics',
        description: 'Verifies open-circuit string voltage and tests earth continuity reliably.',
        maxPoints: 25,
      },
    ],
  },
  'skill-phone-repair': {
    skillName: 'Cellphone Screen & Hardware Repair',
    category: 'Technical & Trades',
    criteria: [
      {
        id: 'c1',
        title: 'Thermal Separation & Screen Teardown',
        description: 'Applies correct heat without damaging OLED/LCD panel or digitizer flex cable.',
        maxPoints: 25,
      },
      {
        id: 'c2',
        title: 'ESD & Lithium Battery Safety',
        description: 'Uses anti-static grounding and safely handles swollen or glued lithium batteries.',
        maxPoints: 25,
      },
      {
        id: 'c3',
        title: 'Micro-Screws & Bracket Organization',
        description: 'Maintains screw mat map to avoid motherboard screw-through damage.',
        maxPoints: 25,
      },
      {
        id: 'c4',
        title: 'Touch & Sensor Calibration',
        description: 'Tests multi-touch, proximity sensor, front camera alignment, and digitizer latency.',
        maxPoints: 25,
      },
    ],
  },
  'skill-barista': {
    skillName: 'Barista & Espresso Calibration',
    category: 'Hospitality & Retail',
    criteria: [
      {
        id: 'c1',
        title: 'Dose & Grind Extraction',
        description: 'Tamps level, measures 1:2 extraction ratio within 25-30 seconds with rich crema.',
        maxPoints: 25,
      },
      {
        id: 'c2',
        title: 'Food Safety & Steamer Purging',
        description: 'Purges steam wand before/after, wipes with dedicated cloth, checks milk temps.',
        maxPoints: 25,
      },
      {
        id: 'c3',
        title: 'Microfoam Texture & Pouring',
        description: 'Creates glossy, silky microfoam suitable for flat whites and lattes without bubbles.',
        maxPoints: 25,
      },
      {
        id: 'c4',
        title: 'Speed & Station Cleanliness',
        description: 'Keeps portafilter dry, maintains clean knock-box, handles customer order pacing.',
        maxPoints: 25,
      },
    ],
  },
};

/**
 * Returns the relevant rubric template for a skill.
 */
export function getRubricForSkill(skillId: string, skillName: string): RubricTemplate {
  if (STANDARD_RUBRICS[skillId]) {
    return STANDARD_RUBRICS[skillId];
  }
  return {
    ...STANDARD_RUBRICS.default,
    skillName,
  };
}

export interface RubricGradingInput {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
}

export function gradeMicroTaskRubric(scores: RubricGradingInput): {
  totalScore: number;
  passed: boolean;
  decision: 'approved' | 'revision_requested';
} {
  const c1 = Math.max(0, Math.min(25, scores.c1));
  const c2 = Math.max(0, Math.min(25, scores.c2));
  const c3 = Math.max(0, Math.min(25, scores.c3));
  const c4 = Math.max(0, Math.min(25, scores.c4));

  const totalScore = c1 + c2 + c3 + c4;
  const passed = totalScore >= ASSESSMENT_PASS_THRESHOLD;
  const decision: 'approved' | 'revision_requested' = passed ? 'approved' : 'revision_requested';

  return { totalScore, passed, decision };
}

/**
 * Creates an evaluation record for a practical task assessment.
 */
export function buildAssessmentRecord(
  claim: SkillClaim,
  assessor: { uid: string; displayName: string },
  scores: RubricGradingInput,
  feedback: string
): AssessmentRecord {
  const { totalScore, decision } = gradeMicroTaskRubric(scores);
  const template = getRubricForSkill(claim.skillId, claim.skillName);

  const criteria: RubricCriterion[] = [
    {
      id: 'c1',
      title: template.criteria[0].title,
      description: template.criteria[0].description,
      maxPoints: 25,
      score: scores.c1,
      passed: scores.c1 >= 18,
    },
    {
      id: 'c2',
      title: template.criteria[1].title,
      description: template.criteria[1].description,
      maxPoints: 25,
      score: scores.c2,
      passed: scores.c2 >= 18,
    },
    {
      id: 'c3',
      title: template.criteria[2].title,
      description: template.criteria[2].description,
      maxPoints: 25,
      score: scores.c3,
      passed: scores.c3 >= 18,
    },
    {
      id: 'c4',
      title: template.criteria[3].title,
      description: template.criteria[3].description,
      maxPoints: 25,
      score: scores.c4,
      passed: scores.c4 >= 18,
    },
  ];

  return {
    id: `assess_${Date.now()}_${claim.id}`,
    candidateId: claim.candidateId,
    candidateName: 'Candidate',
    skillId: claim.skillId,
    skillName: claim.skillName,
    rubricVersion: 'v1.0-standard',
    score: totalScore,
    criteria,
    assessorId: assessor.uid,
    assessorName: assessor.displayName,
    decision,
    feedback: feedback.trim(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates a pending Peer Endorsement request initiated by the candidate.
 */
export function buildPeerEndorsementRequest(params: {
  claim: SkillClaim;
  candidateName: string;
  endorserName: string;
  endorserRole: string;
  relationship: string;
  comments: string;
}): PeerEndorsement {
  return {
    id: `endorse_${Date.now()}_${params.claim.id}`,
    claimId: params.claim.id,
    candidateId: params.claim.candidateId,
    candidateName: params.candidateName,
    skillName: params.claim.skillName,
    endorserName: params.endorserName.trim(),
    endorserRole: params.endorserRole.trim(),
    relationship: params.relationship.trim(),
    comments: params.comments.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Evaluates and confirms a Peer Endorsement.
 */
export function processPeerEndorsement(
  endorsement: PeerEndorsement,
  decision: 'approved' | 'rejected'
): PeerEndorsement {
  return {
    ...endorsement,
    status: decision,
    confirmedAt: new Date().toISOString(),
  };
}

/**
 * Creates a structured Mentor Review record.
 */
export function buildMentorReview(params: {
  claim: SkillClaim;
  candidateName: string;
  mentor: { uid: string; displayName: string; organization?: string };
  feedback: string;
  decision: 'approved' | 'needs_more_evidence' | 'rejected';
}): MentorReview {
  const now = new Date().toISOString();
  return {
    id: `mentor_${Date.now()}_${params.claim.id}`,
    claimId: params.claim.id,
    candidateId: params.claim.candidateId,
    candidateName: params.candidateName,
    skillName: params.claim.skillName,
    mentorId: params.mentor.uid,
    mentorName: params.mentor.displayName,
    organization: params.mentor.organization || 'Community Youth Partner',
    feedback: params.feedback.trim(),
    decision: params.decision,
    createdAt: now,
    reviewedAt: now,
  };
}

/**
 * Determines the honest verification caveat line for display in UI.
 * Explicitly fulfills Section 3: "Show the 'what this does not mean' line next to each label".
 */
export function getVerificationMeaning(status: VerificationStatus): {
  label: string;
  honestMeaning: string;
  whatItDoesNotMean: string;
} {
  switch (status) {
    case 'Self-reported':
      return {
        label: 'Self-reported',
        honestMeaning: 'Candidate entered this informal experience claim directly.',
        whatItDoesNotMean: 'Not independently confirmed by an employer, peer, or mentor.',
      };
    case 'Peer-endorsed':
      return {
        label: 'Peer-endorsed',
        honestMeaning: 'An identified contractor, supervisor, or peer endorsed practical work.',
        whatItDoesNotMean: 'Not a formal educational certification or accredited license.',
      };
    case 'Task-assessed':
      return {
        label: 'Task-assessed',
        honestMeaning: 'A hands-on practical task was scored >=70 against a rubric by an assessor.',
        whatItDoesNotMean: 'Not a complete guarantee of long-term on-the-job performance.',
      };
    case 'Mentor-reviewed':
      return {
        label: 'Mentor-reviewed',
        honestMeaning: 'A designated youth mentor or partner reviewed the submitted portfolio.',
        whatItDoesNotMean: 'Not necessarily a state-accredited academic qualification.',
      };
  }
}
