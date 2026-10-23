import { useState, useEffect, useCallback } from 'react';
import {
  Application,
  ApplicationStatus,
  AssessmentRecord,
  CandidateProfile,
  EmployerProfile,
  Job,
  ModerationReport,
  Role,
  SkillClaim,
  User,
  WorkRecord,
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
} from '../../data/seed';
import { calculateMatchScore } from '../../domain/matching';
import { applicationId, isValidTransition, VALID_STATUS_TRANSITIONS } from '../../domain/applicationStatus';
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
  const addSkillClaim = (claim: Omit<SkillClaim, 'id' | 'createdAt'>) => {
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
    return newRecord;
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
