import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isApplicationRetentionExpired,
  isAccountInactiveForWarning,
  isAccountInactiveForDeletion,
  exportCandidateUserData,
  executeAccountPurge,
  isUserDeleted,
} from './retentionEngine';
import { DEFAULT_RETENTION_CONFIG } from '../config/retentionConfig';
import { CandidateProfile, SkillClaim, Application, InAppNotification, CredentialEvidence } from './types';

describe('Section 38: P2 Account Deletion and Retention Policy', () => {
  const dummyProfile: CandidateProfile = {
    uid: 'candidate_purge_123',
    fullName: 'Sipho Zulu',
    headline: 'Junior Solar Technician',
    experienceSummary: 'Passionate about renewable energy and battery wiring.',
    skillIds: [],
    locationArea: 'Gauteng',
    availability: 'immediate',
    popiaVisibility: 'employers_only',
    updatedAt: '2026-01-01T08:00:00Z',
  };

  const dummySkill: SkillClaim = {
    id: 'skill_sipho_1',
    candidateId: 'candidate_purge_123',
    skillId: 'skill_solar_pv',
    skillName: 'Solar PV Maintenance',
    selfReportedLevel: 'Intermediate',
    evidenceType: 'practical_demo',
    evidenceTitle: 'Rooftop Wiring',
    evidenceUrlOrText: 'Wiring photos attached',
    verificationStatus: 'Task-assessed',
    evidenceDescription: 'Installed panels on 4 residential rooftops.',
    createdAt: '2026-01-02T08:00:00Z',
  };

  const dummyCred: CredentialEvidence & { candidateId?: string } = {
    id: 'cred_sipho_1',
    type: 'credential',
    candidateId: 'candidate_purge_123',
    issuer: 'Credly',
    credentialName: 'PV Systems Certification',
    duplicateHash: 'hash_secret_salted_123',
    checkStatus: 'checked_ok',
  };

  const dummyApp: Application = {
    id: 'app_sipho_1',
    candidateId: 'candidate_purge_123',
    candidateName: 'Sipho Zulu',
    candidateHeadline: 'Junior Solar Tech',
    candidateLocation: 'Gauteng',
    candidateAvailability: 'immediate',
    employerId: 'emp_456',
    employerName: 'Solar Tech',
    jobId: 'job_456',
    jobTitle: 'Solar Assistant',
    status: 'not_selected',
    matchScore: 85,
    matchBreakdown: {
      totalScore: 85,
      skillAlignment: 90,
      evidenceStrength: 80,
      availabilityFit: 100,
      locationFit: 70,
      matchedSkills: ['Solar PV Maintenance'],
      missingSkills: [],
      reasons: ['Good fit'],
      improvementTips: [],
    },
    submittedAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-01-05T08:00:00Z',
  };

  const dummyNotif: InAppNotification = {
    id: 'notif_sipho_1',
    userId: 'candidate_purge_123',
    title: 'Application Update',
    body: 'Your application was received.',
    type: 'application_status',
    readAt: null,
    createdAt: '2026-01-05T08:00:00Z',
  };

  // 1. Retention age filter (38.3 & 38.7)
  it('identifies unselected applications past the 6-month retention period', () => {
    const referenceDate = new Date('2026-10-26T12:00:00Z');

    // 9 months ago: should be expired
    const oldRejectedApp = { status: 'not_selected', submittedAt: '2026-01-10T00:00:00Z' };
    assert.equal(isApplicationRetentionExpired(oldRejectedApp, DEFAULT_RETENTION_CONFIG, referenceDate), true);

    // 2 months ago: should NOT be expired
    const recentRejectedApp = { status: 'not_selected', submittedAt: '2026-08-20T00:00:00Z' };
    assert.equal(isApplicationRetentionExpired(recentRejectedApp, DEFAULT_RETENTION_CONFIG, referenceDate), false);

    // Placed application (successful employment): should NEVER be expired by the unselected rule
    const placedApp = { status: 'placed', submittedAt: '2026-01-10T00:00:00Z' };
    assert.equal(isApplicationRetentionExpired(placedApp, DEFAULT_RETENTION_CONFIG, referenceDate), false);
  });

  // 2. Inactivity triggers (38.3)
  it('triggers inactivity warning at 12 months and deletion at 18 months', () => {
    const referenceDate = new Date('2026-10-26T12:00:00Z');

    // 13 months inactive: triggers warning, not deletion
    const login13MonthsAgo = '2025-09-01T00:00:00Z';
    assert.equal(isAccountInactiveForWarning(login13MonthsAgo, DEFAULT_RETENTION_CONFIG, referenceDate), true);
    assert.equal(isAccountInactiveForDeletion(login13MonthsAgo, DEFAULT_RETENTION_CONFIG, referenceDate), false);

    // 20 months inactive: triggers deletion
    const login20MonthsAgo = '2025-02-01T00:00:00Z';
    assert.equal(isAccountInactiveForDeletion(login20MonthsAgo, DEFAULT_RETENTION_CONFIG, referenceDate), true);

    // 3 months inactive: healthy active user
    const loginRecent = '2026-07-01T00:00:00Z';
    assert.equal(isAccountInactiveForWarning(loginRecent, DEFAULT_RETENTION_CONFIG, referenceDate), false);
    assert.equal(isAccountInactiveForDeletion(loginRecent, DEFAULT_RETENTION_CONFIG, referenceDate), false);
  });

  // 3. User data export (38.4 & 38.7)
  it('exports user personal data containing strictly their own records without external leakage', () => {
    const exported = exportCandidateUserData(
      dummyProfile,
      [dummySkill],
      [dummyCred],
      [dummyApp]
    );

    assert.equal(exported.profile.fullName, 'Sipho Zulu');
    assert.equal(exported.skills.length, 1);
    assert.equal(exported.skills[0].skillName, 'Solar PV Maintenance');
    assert.equal(exported.credentials.length, 1);
    assert.equal(exported.credentials[0].credentialName, 'PV Systems Certification');
    assert.equal(exported.applications.length, 1);
    assert.equal(exported.applications[0].jobId, 'job_456');

    // Asserts duplicate check salted hash is NOT leaked in export
    assert.doesNotMatch(JSON.stringify(exported), /hash_secret_salted_123/);
  });

  // 4. Deletion purge cascade (38.2 & 38.7)
  it('purges all candidate records and duplicate hashes upon account deletion', () => {
    const dataStore = {
      profiles: { [dummyProfile.uid]: { ...dummyProfile } },
      skills: [{ ...dummySkill }],
      credentials: [{ ...dummyCred }],
      duplicateHashes: new Set(['hash_secret_salted_123']),
      applications: [{ ...dummyApp }],
      notifications: [{ ...dummyNotif }],
      deletedUids: new Set<string>(),
    };

    assert.ok(dataStore.profiles[dummyProfile.uid]);
    assert.equal(dataStore.skills.length, 1);
    assert.equal(dataStore.credentials.length, 1);
    assert.ok(dataStore.duplicateHashes.has('hash_secret_salted_123'));

    const receipt = executeAccountPurge(dummyProfile.uid, dataStore);

    // Profile wiped
    assert.equal(dataStore.profiles[dummyProfile.uid], undefined);
    // Skills wiped
    assert.equal(dataStore.skills.length, 0);
    // Credentials wiped
    assert.equal(dataStore.credentials.length, 0);
    // Salted duplicate hash deleted
    assert.equal(dataStore.duplicateHashes.has('hash_secret_salted_123'), false);
    // Applications wiped
    assert.equal(dataStore.applications.length, 0);
    // Notifications wiped
    assert.equal(dataStore.notifications.length, 0);

    // Audit receipt contains zero PII
    assert.ok(receipt.recordsPurgedCount >= 5);
    assert.doesNotMatch(receipt.uidHash, /candidate_purge_123/);

    // 5. Deleted user cannot sign back in to old data (38.7)
    assert.equal(isUserDeleted(dummyProfile.uid, dataStore.deletedUids), true);
    assert.equal(isUserDeleted('other_valid_user', dataStore.deletedUids), false);
  });
});
