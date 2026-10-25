/**
 * Roadmap Feature Flags
 * Specified in Section 20 & 21 of the AI Agent Brief.
 * 
 * Rules:
 *  - Every roadmap feature sits behind a flag.
 *  - A flag is ON only when its feature is finished, tested, and reviewed. Default is OFF.
 */

export interface FeatureFlags {
  notificationsInApp: boolean;
  pushNotifications: boolean;
  locationFilters: boolean;
  offlineDrafts: boolean;
  offlineSync: boolean;
  peerEndorsement: boolean;
  microTasks: boolean;
  mentorReview: boolean;
  aiDrafting: boolean;
  mentorChat: boolean;
  microInternships: boolean;
  transportSupport: boolean;
  paymentConfirmation: boolean;
  whatsapp: boolean;
  credentials: boolean;
  credentialEvidence: boolean;
  matchFeedback: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  notificationsInApp: true,  // R1: In-app notifications (FR-15)
  pushNotifications: false,
  locationFilters: true,     // R2: Location-aware filters (FR-16)
  offlineDrafts: true,       // R5 Phase A: Profile drafts
  offlineSync: false,
  peerEndorsement: true,     // R3: Peer endorsement (FR-19)
  microTasks: true,          // R3: Micro-tasks & rubrics (FR-19)
  mentorReview: true,        // R3: Mentor review (FR-19)
  aiDrafting: false,         // R6: AI drafting (default off per POPIA rules)
  mentorChat: false,         // R7: Mentor chat
  microInternships: false,   // R4: 1-5 day micro-internships
  transportSupport: false,   // R8: Transport help
  paymentConfirmation: false,// R9: Payment confirmation records
  whatsapp: false,           // R10: WhatsApp channel
  credentials: false,        // R11: Qualification entries
  credentialEvidence: true,  // Section 35: Badges and Certificates as Evidence (Part 3B)
  matchFeedback: false,      // R12: Weight tuning & feedback
} as const;
