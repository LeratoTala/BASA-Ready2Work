import { useState, useEffect, useCallback } from 'react';
import {
  Application,
  ApplicationStatus,
  AssessmentRecord,
  CandidateProfile,
  EmployerProfile,
  Job,
  ModerationReport,
  PrivacyDeletionRequest,
  Role,
  SkillClaim,
  User,
  WorkRecord,
  InAppNotification,
  NotificationPreferences,
  NotificationType,
  PeerEndorsement,
  MentorReview,
} from '../../domain/types';
import {
  INITIAL_APPLICATIONS,
  INITIAL_ASSESSMENTS,
  INITIAL_CANDIDATE_PROFILES,
  INITIAL_EMPLOYER_PROFILES,
  INITIAL_JOBS,
  INITIAL_REPORTS,
  INITIAL_SKILL_CLAIMS,
  INITIAL_USERS,
  INITIAL_WORK_RECORDS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ENDORSEMENTS,
  INITIAL_MENTOR_REVIEWS,
} from '../../data/seed';
import { calculateMatchScore } from '../../domain/matching';
import { applicationId, isValidTransition, VALID_STATUS_TRANSITIONS } from '../../domain/applicationStatus';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  formatApplicationStatusNotification,
  createNotificationRecord,
  shouldDeliverNotification,
} from '../../domain/notifications';
import { NEW_ACCOUNT_DEFAULTS, STORAGE_KEYS } from '../../config/app';
import { env } from '../../config/env';
import { SyncState } from '../../services/syncService';
import { loadStored, saveStored, removeStored } from '../../services/localStorage';
import { useLocalPrefs } from './useLocalPrefs';

export { VALID_STATUS_TRANSITIONS, isValidTransition };

/**
 * Local-only store used when VITE_ENABLE_DEMO_DATA=true: fictional seed data in localStorage, no backend.
 * Production uses useFirestoreStore. Both expose the same BasaStore shape.
 */
export function useDemoStore() {
  const [users, setUsers] = useState<User[]>(() => loadStored(STORAGE_KEYS.users, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    loadStored<User | null>(STORAGE_KEYS.currentUser, null)
  );
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, CandidateProfile>>(() =>
    loadStored(STORAGE_KEYS.candidateProfiles, INITIAL_CANDIDATE_PROFILES)
  );
  const [employerProfiles, setEmployerProfiles] = useState<Record<string, EmployerProfile>>(() =>
    loadStored(STORAGE_KEYS.employerProfiles, INITIAL_EMPLOYER_PROFILES)
  );
  const [skillClaims, setSkillClaims] = useState<SkillClaim[]>(() =>
    loadStored(STORAGE_KEYS.skillClaims, INITIAL_SKILL_CLAIMS)
  );
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(() =>
    loadStored(STORAGE_KEYS.assessments, INITIAL_ASSESSMENTS)
  );
  const [jobs, setJobs] = useState<Job[]>(() => loadStored(STORAGE_KEYS.jobs, INITIAL_JOBS));
  const [applications, setApplications] = useState<Application[]>(() =>
    loadStored(STORAGE_KEYS.applications, INITIAL_APPLICATIONS)
  );
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>(() =>
    loadStored(STORAGE_KEYS.workRecords, INITIAL_WORK_RECORDS)
  );
  const [reports, setReports] = useState<ModerationReport[]>(() =>
    loadStored(STORAGE_KEYS.reports, INITIAL_REPORTS)
  );
  const [privacyDeletionRequests, setPrivacyDeletionRequests] = useState<PrivacyDeletionRequest[]>(() =>
    loadStored(STORAGE_KEYS.privacyDeletionRequests, [])
  );
  const [notifications, setNotifications] = useState<InAppNotification[]>(() =>
    loadStored(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS)
  );
  const [notificationPreferences, setNotificationPreferences] = useState<Record<string, NotificationPreferences>>(() =>
    loadStored(STORAGE_KEYS.notificationPreferences, {})
  );
  const [endorsements, setEndorsements] = useState<PeerEndorsement[]>(() =>
    loadStored(STORAGE_KEYS.endorsements, INITIAL_ENDORSEMENTS)
  );
  const [mentorReviews, setMentorReviews] = useState<MentorReview[]>(() =>
    loadStored(STORAGE_KEYS.mentorReviews, INITIAL_MENTOR_REVIEWS)
  );
  const { lowDataMode, setLowDataMode, profileDraft, saveDraft } = useLocalPrefs();
  const syncStatus = 'synced' as SyncState;
  const pendingSyncCount = 0;
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Synchronize state changes to localStorage
  useEffect(() => saveStored(STORAGE_KEYS.users, users), [users]);
  useEffect(() => saveStored(STORAGE_KEYS.currentUser, currentUser), [currentUser]);
  useEffect(() => saveStored(STORAGE_KEYS.candidateProfiles, candidateProfiles), [candidateProfiles]);
  useEffect(() => saveStored(STORAGE_KEYS.employerProfiles, employerProfiles), [employerProfiles]);
  useEffect(() => saveStored(STORAGE_KEYS.skillClaims, skillClaims), [skillClaims]);
  useEffect(() => saveStored(STORAGE_KEYS.assessments, assessments), [assessments]);
  useEffect(() => saveStored(STORAGE_KEYS.jobs, jobs), [jobs]);
  useEffect(() => saveStored(STORAGE_KEYS.applications, applications), [applications]);
  useEffect(() => saveStored(STORAGE_KEYS.workRecords, workRecords), [workRecords]);
  useEffect(() => saveStored(STORAGE_KEYS.reports, reports), [reports]);
  useEffect(() => saveStored(STORAGE_KEYS.privacyDeletionRequests, privacyDeletionRequests), [privacyDeletionRequests]);
  useEffect(() => saveStored(STORAGE_KEYS.notifications, notifications), [notifications]);
  useEffect(() => saveStored(STORAGE_KEYS.notificationPreferences, notificationPreferences), [notificationPreferences]);
  useEffect(() => saveStored(STORAGE_KEYS.endorsements, endorsements), [endorsements]);
  useEffect(() => saveStored(STORAGE_KEYS.mentorReviews, mentorReviews), [mentorReviews]);

  const deliverNotification = useCallback(
    (
      userId: string,
      type: NotificationType,
      title: string,
      body: string,
      entityId: string,
      stateOrTimestamp: string,
      link?: string
    ) => {
      const userPrefs = notificationPreferences[userId] ?? DEFAULT_NOTIFICATION_PREFERENCES;
      if (!shouldDeliverNotification(userPrefs, type)) return;
      const notif = createNotificationRecord({
        userId,
        type,
        title,
        body,
        entityId,
        stateOrTimestamp,
        link,
        createdAt: new Date().toISOString(),
      });
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
    },
    [notificationPreferences]
  );

  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n))
    );
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser.uid && !n.readAt ? { ...n, readAt: now } : n))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
    if (!currentUser) return;
    setNotificationPreferences((prev) => ({
      ...prev,
      [currentUser.uid]: {
        ...(prev[currentUser.uid] ?? DEFAULT_NOTIFICATION_PREFERENCES),
        ...prefs,
      },
    }));
  };

  const triggerSync = async () => {};
  const authLoading = false;
  const needsOnboarding = false;
  const authIdentity = null as { displayName: string; email: string } | null;
  const lastError = null as string | null;
  const clearError = () => {};

  const signInWithGoogle = async (): Promise<unknown> => {
    throw new Error('Google sign-in is disabled in demo mode. Pick a demo persona instead.');
  };

  const signOutUser = async () => {
    setCurrentUser(null);
    removeStored(STORAGE_KEYS.currentUser);
  };

  // Switch role / active user
  const switchUser = (uid: string) => {
    // Persona switching is a demo-only feature; it must never exist in production.
    if (!env.enableDemoData) return;
    const found = users.find((u) => u.uid === uid);
    if (found) {
      setCurrentUser(found);
    }
  };

  // Register a new user
  const registerUser = (displayName: string, email: string, role: Role) => {
    const newUid = `${role}-${Date.now()}`;
    const newUser: User = {
      uid: newUid,
      displayName,
      email,
      role,
      createdAt: new Date().toISOString(),
      accountStatus: 'active',
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    if (role === 'candidate') {
      const newProfile: CandidateProfile = {
        uid: newUid,
        fullName: displayName,
        headline: NEW_ACCOUNT_DEFAULTS.candidate.headline,
        experienceSummary: NEW_ACCOUNT_DEFAULTS.candidate.experienceSummary,
        skillIds: [],
        contactEmail: email,
        locationArea: NEW_ACCOUNT_DEFAULTS.candidate.locationArea,
        availability: NEW_ACCOUNT_DEFAULTS.candidate.availability,
        popiaVisibility: NEW_ACCOUNT_DEFAULTS.candidate.popiaVisibility,
        updatedAt: new Date().toISOString(),
      };
      setCandidateProfiles((prev) => ({ ...prev, [newUid]: newProfile }));
    } else if (role === 'employer') {
      const newEmployer: EmployerProfile = {
        uid: newUid,
        businessName: displayName,
        industry: NEW_ACCOUNT_DEFAULTS.employer.industry,
        description: NEW_ACCOUNT_DEFAULTS.employer.description,
        locationArea: NEW_ACCOUNT_DEFAULTS.employer.locationArea,
        verificationStatus: NEW_ACCOUNT_DEFAULTS.employer.verificationStatus,
        contactEmail: email,
        createdAt: new Date().toISOString(),
      };
      setEmployerProfiles((prev) => ({ ...prev, [newUid]: newEmployer }));
    }
    return newUser;
  };

  // Update candidate profile
  const updateCandidateProfile = (uid: string, updates: Partial<CandidateProfile>) => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'candidate' || currentUser.uid !== uid) {
      throw new Error('Permission denied: You can only update your own candidate profile.');
    }
    setCandidateProfiles((prev) => {
      const existing = prev[uid] || {
        uid,
        fullName: currentUser.displayName,
        headline: '',
        experienceSummary: '',
        skillIds: [],
        locationArea: NEW_ACCOUNT_DEFAULTS.candidate.locationArea,
        availability: NEW_ACCOUNT_DEFAULTS.candidate.availability,
        popiaVisibility: NEW_ACCOUNT_DEFAULTS.candidate.popiaVisibility,
        updatedAt: new Date().toISOString(),
      };
      const updatedProfile = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Queue for Firestore sync

      return {
        ...prev,
        [uid]: updatedProfile,
      };
    });
  };

  // Update employer profile
  const updateEmployerProfile = (uid: string, updates: Partial<EmployerProfile>) => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'employer' || currentUser.uid !== uid) {
      throw new Error('Permission denied: You can only update your own business profile.');
    }
    setEmployerProfiles((prev) => {
      const updated = {
        ...prev[uid],
        ...updates,
      };
      return {
        ...prev,
        [uid]: updated,
      };
    });
  };

  // Add Skill Claim
  const addSkillClaim = async (claim: Omit<SkillClaim, 'id' | 'createdAt'>) => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'candidate') {
      throw new Error('Only candidates can register skill claims.');
    }
    const newClaim: SkillClaim = {
      ...claim,
      verificationStatus: 'Self-reported',
      id: `claim-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSkillClaims((prev) => [newClaim, ...prev]);

    // Also link skillId to candidate profile if not already present
    setCandidateProfiles((prev) => {
      const current = prev[claim.candidateId];
      if (!current) return prev;
      if (!current.skillIds.includes(claim.skillId)) {
        const updated = {
          ...current,
          skillIds: [...current.skillIds, claim.skillId],
          updatedAt: new Date().toISOString(),
        };
        return {
          ...prev,
          [claim.candidateId]: updated,
        };
      }
      return prev;
    });
    return newClaim;
  };

  // Submit assessment
  const submitAssessment = (assessment: Omit<AssessmentRecord, 'id' | 'createdAt'>, claimId: string) => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'admin') {
      throw new Error('Permission denied: Only authorized assessors can record assessment results.');
    }
    const newAssessmentId = `assess-${Date.now()}`;
    const newRecord: AssessmentRecord = {
      ...assessment,
      id: newAssessmentId,
      createdAt: new Date().toISOString(),
    };

    setAssessments((prev) => [newRecord, ...prev]);

    if (assessment.decision === 'approved') {
      setSkillClaims((prev) =>
        prev.map((c) => {
          if (c.id === claimId) {
            const updated = {
              ...c,
              verificationStatus: 'Task-assessed' as const,
              assessmentId: newAssessmentId,
            };
            return updated;
          }
          return c;
        })
      );
    }

    deliverNotification(
      assessment.candidateId,
      'assessment_result',
      'Skill Demonstration Assessed',
      `Your demonstration for "${assessment.skillName}" was evaluated (${assessment.decision === 'approved' ? 'Approved' : 'Reviewed'}).`,
      newRecord.id,
      newRecord.createdAt,
      'passport'
    );

    return newRecord;
  };

  // Request Peer Endorsement (R3 / FR-19)
  const requestPeerEndorsement = async (
    claimId: string,
    params: {
      endorserName: string;
      endorserRole: string;
      relationship: string;
      comments: string;
    }
  ): Promise<PeerEndorsement> => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'candidate') throw new Error('Only candidates can request peer endorsements.');

    const claim = skillClaims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Skill claim not found.');
    if (claim.candidateId !== currentUser.uid) throw new Error('You can only request endorsements for your own claims.');

    const newEndorsement: PeerEndorsement = {
      id: `endorse_${Date.now()}_${claimId}`,
      claimId,
      candidateId: currentUser.uid,
      candidateName: currentUser.displayName,
      skillName: claim.skillName,
      endorserName: params.endorserName.trim(),
      endorserRole: params.endorserRole.trim(),
      relationship: params.relationship.trim(),
      comments: params.comments.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setEndorsements((prev) => [newEndorsement, ...prev]);

    deliverNotification(
      currentUser.uid,
      'endorsement_request',
      'Peer Endorsement Requested',
      `Endorsement request logged for "${claim.skillName}" from ${params.endorserName}.`,
      newEndorsement.id,
      newEndorsement.createdAt,
      'skills'
    );

    return newEndorsement;
  };

  // Approve Peer Endorsement (R3 / FR-19)
  const approvePeerEndorsement = async (endorsementId: string): Promise<void> => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'admin') {
      throw new Error('Only administrators or verified mentors can approve peer endorsements.');
    }

    const endorsement = endorsements.find((e) => e.id === endorsementId);
    if (!endorsement) throw new Error('Endorsement request not found.');

    const confirmedAt = new Date().toISOString();

    setEndorsements((prev) =>
      prev.map((e) => (e.id === endorsementId ? { ...e, status: 'approved', confirmedAt } : e))
    );

    // Upgrade claim verification status to Peer-endorsed
    setSkillClaims((prev) =>
      prev.map((c) => {
        if (c.id === endorsement.claimId) {
          return {
            ...c,
            verificationStatus: 'Peer-endorsed',
            peerEndorserName: endorsement.endorserName,
            peerEndorsementId: endorsement.id,
          };
        }
        return c;
      })
    );

    deliverNotification(
      endorsement.candidateId,
      'endorsement_request',
      'Skill Claim Peer-Endorsed!',
      `Your skill "${endorsement.skillName}" was peer-endorsed by ${endorsement.endorserName} (${endorsement.endorserRole}).`,
      endorsement.id,
      confirmedAt,
      'passport'
    );
  };

  // Submit Mentor Review (R3 / FR-19)
  const submitMentorReview = async (
    claimId: string,
    params: {
      mentorName: string;
      organization?: string;
      feedback: string;
      decision: 'approved' | 'needs_more_evidence' | 'rejected';
    }
  ): Promise<MentorReview> => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'admin') {
      throw new Error('Only authorized mentors or administrators can record mentor reviews.');
    }

    const claim = skillClaims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Skill claim not found.');

    const now = new Date().toISOString();
    const newReview: MentorReview = {
      id: `mentor_${Date.now()}_${claimId}`,
      claimId,
      candidateId: claim.candidateId,
      candidateName: 'Candidate',
      skillName: claim.skillName,
      mentorId: currentUser.uid,
      mentorName: params.mentorName.trim() || currentUser.displayName,
      organization: params.organization?.trim() || 'Youth Employment Partner',
      feedback: params.feedback.trim(),
      decision: params.decision,
      createdAt: now,
      reviewedAt: now,
    };

    setMentorReviews((prev) => [newReview, ...prev]);

    if (params.decision === 'approved') {
      setSkillClaims((prev) =>
        prev.map((c) => {
          if (c.id === claimId) {
            return {
              ...c,
              verificationStatus: 'Mentor-reviewed',
              mentorName: newReview.mentorName,
              mentorReviewId: newReview.id,
            };
          }
          return c;
        })
      );
    }

    deliverNotification(
      claim.candidateId,
      'assessment_result',
      params.decision === 'approved' ? 'Skill Mentor-Reviewed!' : 'Mentor Review Completed',
      `Your skill "${claim.skillName}" received mentor feedback from ${newReview.mentorName}: ${params.decision === 'approved' ? 'Approved & Upgraded' : 'Additional Evidence Requested'}.`,
      newReview.id,
      now,
      'passport'
    );

    return newReview;
  };

  // Post a Job
  const postJob = (jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'reportCount' | 'employerId' | 'employerName' | 'employerVerified'>) => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'employer') {
      throw new Error('Only employers can post opportunities.');
    }
    const empProfile = employerProfiles[currentUser.uid];
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
      employerId: currentUser.uid,
      employerName: empProfile?.businessName || currentUser.displayName,
      employerVerified: empProfile?.verificationStatus === 'verified',
      status: 'open',
      reportCount: 0,
      createdAt: new Date().toISOString(),
    };

    setJobs((prev) => [newJob, ...prev]);
    return newJob;
  };

  // Toggle Job Status
  const toggleJobStatus = (jobId: string) => {
    if (!currentUser) throw new Error('Authentication required');
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) throw new Error('Job not found.');
    if (currentUser.role !== 'admin' && (currentUser.role !== 'employer' || targetJob.employerId !== currentUser.uid)) {
      throw new Error('Permission denied: You can only manage your own jobs.');
    }
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const updated = { ...j, status: (j.status === 'open' ? 'closed' : 'open') as 'open' | 'closed' };
          return updated;
        }
        return j;
      })
    );
  };

  // Apply to Job
  const applyToJob = async (jobId: string) => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'candidate') {
      throw new Error('Only registered candidates can apply for jobs.');
    }
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) throw new Error('Job listing not found.');

    if (targetJob.status === 'closed' || targetJob.status === 'flagged') {
      throw new Error('This opportunity is closed or suspended and cannot accept applications.');
    }

    const existing = applications.find(
      (a) => a.jobId === jobId && a.candidateId === currentUser.uid
    );
    if (existing) {
      throw new Error('Duplicate application prevented: you have already applied for this opportunity.');
    }

    const candidateProfile = candidateProfiles[currentUser.uid] || {
      uid: currentUser.uid,
      fullName: currentUser.displayName,
      headline: NEW_ACCOUNT_DEFAULTS.candidate.headline,
      experienceSummary: '',
      skillIds: [],
      locationArea: NEW_ACCOUNT_DEFAULTS.candidate.locationArea,
      availability: NEW_ACCOUNT_DEFAULTS.candidate.availability,
      popiaVisibility: NEW_ACCOUNT_DEFAULTS.candidate.popiaVisibility,
      updatedAt: new Date().toISOString(),
    };

    const candidateClaims = skillClaims.filter((c) => c.candidateId === currentUser.uid);
    const breakdown = calculateMatchScore(targetJob, candidateProfile, candidateClaims);

    const newApp: Application = {
      id: applicationId(jobId, currentUser.uid),
      jobId: targetJob.id,
      jobTitle: targetJob.title,
      employerId: targetJob.employerId,
      employerName: targetJob.employerName,
      candidateId: currentUser.uid,
      candidateName: candidateProfile.fullName,
      candidateHeadline: candidateProfile.headline,
      candidateLocation: candidateProfile.locationArea,
      candidateAvailability: candidateProfile.availability,
      status: 'submitted',
      matchScore: breakdown.totalScore,
      matchBreakdown: breakdown,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);

    deliverNotification(
      targetJob.employerId,
      'application_status',
      'New Applicant Received',
      `A candidate applied for "${targetJob.title}". Review their Skill Passport in your Applicants tab.`,
      newApp.id,
      'submitted',
      'applicants'
    );
    deliverNotification(
      currentUser.uid,
      'application_status',
      'Application Sent',
      `Your application for "${targetJob.title}" was submitted successfully.`,
      newApp.id,
      'submitted',
      'applications'
    );
    return newApp;
  };

  // Update Application Status
  const updateApplicationStatus = (
    applicationId: string,
    newStatus: ApplicationStatus,
    employerNotes?: string,
    payoutConfirmed?: boolean
  ) => {
    if (!currentUser) throw new Error('Authentication required');
    const app = applications.find((a) => a.id === applicationId);
    if (!app) throw new Error('Application not found.');

    if (currentUser.role === 'employer' && app.employerId !== currentUser.uid) {
      throw new Error('Access denied: You cannot view or modify applicants belonging to another employer.');
    }

    if (currentUser.role === 'candidate') {
      if (app.candidateId !== currentUser.uid) throw new Error('Permission denied.');
      if (newStatus !== 'withdrawn') throw new Error('Candidates may only withdraw their own application.');
    }

    if (!isValidTransition(app.status, newStatus)) {
      throw new Error(`Invalid status transition: Cannot move application from '${app.status}' to '${newStatus}'.`);
    }

    setApplications((prev) =>
      prev.map((a) => {
        if (a.id === applicationId) {
          const updated = {
            ...a,
            status: newStatus,
            employerNotes: employerNotes !== undefined ? employerNotes : a.employerNotes,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        }
        return a;
      })
    );

    const statusNotif = formatApplicationStatusNotification(app.jobTitle, newStatus);
    deliverNotification(
      app.candidateId,
      'application_status',
      statusNotif.title,
      statusNotif.body,
      app.id,
      newStatus,
      'applications'
    );

    if (newStatus === 'completed') {
      const targetJob = jobs.find((j) => j.id === app.jobId);
      const newWorkRecord: WorkRecord = {
        id: `work-${Date.now()}`,
        applicationId: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        candidateId: app.candidateId,
        candidateName: app.candidateName,
        employerId: app.employerId,
        employerName: app.employerName,
        completionStatus: 'completed',
        employerConfirmed: true,
        payoutConfirmed: payoutConfirmed ?? true,
        amountZAR: targetJob?.compensationAmount ?? 0,
        feedback: employerNotes || 'Work completed successfully according to terms.',
        confirmedAt: new Date().toISOString(),
      };
      setWorkRecords((prev) => [newWorkRecord, ...prev]);
    }
  };

  // Submit report
  const submitReport = (report: Omit<ModerationReport, 'id' | 'createdAt' | 'status' | 'reporterId' | 'reporterRole'>) => {
    if (!currentUser) throw new Error('Authentication required');
    const newReport: ModerationReport = {
      ...report,
      id: `rep-${Date.now()}`,
      reporterId: currentUser.uid,
      reporterRole: currentUser.role,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);

    if (report.targetType === 'job') {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === report.targetId) {
            const updated = { ...j, reportCount: j.reportCount + 1 };
            return updated;
          }
          return j;
        })
      );
    }
    return newReport;
  };

  // Resolve report
  const resolveReport = (reportId: string, action: 'dismiss' | 'suspend_job') => {
    if (!currentUser) throw new Error('Authentication required');
    if (currentUser.role !== 'admin') throw new Error('Admin authorization required.');
    const rep = reports.find((r) => r.id === reportId);
    if (!rep) return;

    if (action === 'suspend_job' && rep.targetType === 'job') {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === rep.targetId) {
            const updated = { ...j, status: 'flagged' as const };
            return updated;
          }
          return j;
        })
      );
    }

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const updated = { ...r, status: 'resolved' as const };
          return updated;
        }
        return r;
      })
    );
  };

  const requestPrivacyDeletion = async () => {
    if (!currentUser || currentUser.role !== 'candidate') throw new Error('Only candidates can request account deletion.');
    const existing = privacyDeletionRequests.find((request) => request.uid === currentUser.uid);
    if (existing && existing.status !== 'declined') throw new Error('A deletion request is already open.');
    const now = new Date().toISOString();
    const request: PrivacyDeletionRequest = {
      uid: currentUser.uid,
      status: 'pending',
      requestedAt: now,
      updatedAt: now,
    };
    setPrivacyDeletionRequests((prev) => [request, ...prev.filter((item) => item.uid !== request.uid)]);
  };

  const reviewPrivacyDeletionRequest = async (uid: string, status: 'in_review' | 'declined') => {
    if (!currentUser || currentUser.role !== 'admin') throw new Error('Admin authorization required.');
    setPrivacyDeletionRequests((prev) => prev.map((request) => request.uid === uid
      ? { ...request, status, updatedAt: new Date().toISOString(), reviewedBy: currentUser.uid }
      : request));
  };

  // Reset to initial demo seed data anytime
  const resetDemoData = () => {
    if (!env.enableDemoData) return;
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setCandidateProfiles(INITIAL_CANDIDATE_PROFILES);
    setEmployerProfiles(INITIAL_EMPLOYER_PROFILES);
    setSkillClaims(INITIAL_SKILL_CLAIMS);
    setAssessments(INITIAL_ASSESSMENTS);
    setJobs(INITIAL_JOBS);
    setApplications(INITIAL_APPLICATIONS);
    setWorkRecords(INITIAL_WORK_RECORDS);
    setReports(INITIAL_REPORTS);
    setPrivacyDeletionRequests([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    setNotificationPreferences({});
  };

  return {
    users,
    currentUser,
    switchUser,
    registerUser,
    candidateProfiles,
    currentCandidateProfile: currentUser ? candidateProfiles[currentUser.uid] : null,
    updateCandidateProfile,
    employerProfiles,
    currentEmployerProfile: currentUser ? employerProfiles[currentUser.uid] : null,
    updateEmployerProfile,
    skillClaims,
    currentCandidateClaims: currentUser
      ? skillClaims.filter((c) => c.candidateId === currentUser.uid)
      : [],
    addSkillClaim,
    assessments,
    submitAssessment,
    // Verification Flows (R3 / FR-19)
    endorsements,
    mentorReviews,
    requestPeerEndorsement,
    approvePeerEndorsement,
    submitMentorReview,
    jobs,
    postJob,
    toggleJobStatus,
    applications,
    currentCandidateApplications: currentUser
      ? applications.filter((a) => a.candidateId === currentUser.uid)
      : [],
    currentEmployerApplications: currentUser
      ? applications.filter((a) => a.employerId === currentUser.uid)
      : [],
    applyToJob,
    updateApplicationStatus,
    workRecords,
    reports,
    submitReport,
    resolveReport,
    privacyDeletionRequests: currentUser?.role === 'admin'
      ? privacyDeletionRequests
      : privacyDeletionRequests.filter((request) => request.uid === currentUser?.uid),
    requestPrivacyDeletion,
    reviewPrivacyDeletionRequest,
    // In-App Notifications (R1 / FR-15)
    notifications: currentUser ? notifications.filter((n) => n.userId === currentUser.uid) : [],
    unreadNotificationCount: currentUser
      ? notifications.filter((n) => n.userId === currentUser.uid && !n.readAt).length
      : 0,
    notificationPreferences:
      currentUser && notificationPreferences[currentUser.uid]
        ? notificationPreferences[currentUser.uid]
        : DEFAULT_NOTIFICATION_PREFERENCES,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    updateNotificationPreferences,
    lowDataMode,
    setLowDataMode,
    profileDraft,
    saveDraft,
    resetDemoData,
    // Offline sync and persistence
    syncStatus,
    pendingSyncCount,
    isOnline,
    triggerSync,
    signInWithGoogle,
    signOutUser,
    authLoading,
    needsOnboarding,
    authIdentity,
    lastError,
    clearError,
  };
}
