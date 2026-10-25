import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  OAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  arrayUnion,
  type Query,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
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
import { applicationId, isValidTransition } from '../../domain/applicationStatus';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  formatApplicationStatusNotification,
  buildNotificationId,
  shouldDeliverNotification,
} from '../../domain/notifications';
import { COLLECTIONS } from '../../config/app';
import { friendlyFirebaseError, getFirebase } from '../../services/firebase';
import type { SyncState } from '../../services/syncService';
import { deriveSyncState } from '../../services/syncService';
import { useLocalPrefs } from './useLocalPrefs';
import type { BasaStore } from './types';
import { env } from '../../config/env';
import { deleteCandidateEvidence, uploadCandidateEvidence } from '../../services/evidenceStorage';

const nowIso = () => new Date().toISOString();

/** Firestore rejects `undefined`; strip it from plain data objects. */
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const byId = <T extends { uid: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.uid, item]));

/**
 * Production store: Firestore is the source of truth, with live listeners and an offline cache.
 * Every query is scoped to what the signed-in role may read (Firestore rules are not filters).
 * Authoritative permission checks live in firebase/firestore.rules; checks here give fast feedback.
 */
export function useFirestoreStore(): BasaStore {
  const { db, auth, googleProvider } = getFirebase();
  const prefs = useLocalPrefs();

  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [hasAdminClaim, setHasAdminClaim] = useState(false);
  const [userDoc, setUserDoc] = useState<User | null>(null);
  const [userDocLoaded, setUserDocLoaded] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [candidateProfiles, setCandidateProfiles] = useState<Record<string, CandidateProfile>>({});
  const [employerProfiles, setEmployerProfiles] = useState<Record<string, EmployerProfile>>({});
  const [skillClaims, setSkillClaims] = useState<SkillClaim[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [privacyDeletionRequests, setPrivacyDeletionRequests] = useState<PrivacyDeletionRequest[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [endorsements, setEndorsements] = useState<PeerEndorsement[]>([]);
  const [mentorReviews, setMentorReviews] = useState<MentorReview[]>([]);

  const reportError = useCallback((error: unknown) => {
    console.warn('BASA data error:', error);
    setLastError(friendlyFirebaseError(error));
  }, []);

  // Pending write counter — incremented before a fire() call, decremented on settle.
  const [pendingWriteCount, setPendingWriteCount] = useState(0);

  const fire = (promise: Promise<unknown>) => {
    setPendingWriteCount((c) => c + 1);
    promise
      .catch(reportError)
      .finally(() => setPendingWriteCount((c) => Math.max(0, c - 1)));
  };

  // ---- connectivity ----
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

  // ---- authentication + trusted role claim ----
  useEffect(
    () =>
      onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        setUserDocLoaded(false);
        if (!fbUser) {
          setHasAdminClaim(false);
          setUserDoc(null);
          setAuthLoading(false);
          return;
        }
        try {
          const token = await fbUser.getIdTokenResult();
          setHasAdminClaim(token.claims.admin === true);
        } catch (error) {
          reportError(error);
        } finally {
          setAuthLoading(false);
        }
      }),
    [auth, reportError]
  );

  // ---- own user document (role lives here; users cannot change it) ----
  useEffect(() => {
    if (!firebaseUser) return;
    return onSnapshot(
      doc(db, COLLECTIONS.users, firebaseUser.uid),
      (snap) => {
        setUserDoc(snap.exists() ? (snap.data() as User) : null);
        setUserDocLoaded(true);
      },
      (error) => {
        reportError(error);
        setUserDocLoaded(true);
      }
    );
  }, [db, firebaseUser, reportError]);

  const currentUser: User | null = useMemo(() => {
    if (!firebaseUser) return null;
    if (hasAdminClaim) {
      return {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? firebaseUser.email ?? 'Assessor',
        email: firebaseUser.email ?? '',
        role: 'admin',
        createdAt: firebaseUser.metadata.creationTime ?? '',
        accountStatus: 'active',
      };
    }
    return userDoc && userDoc.accountStatus === 'active' ? userDoc : null;
  }, [firebaseUser, hasAdminClaim, userDoc]);

  const needsOnboarding = Boolean(firebaseUser && !hasAdminClaim && userDocLoaded && !userDoc);

  useEffect(() => {
    if (userDoc?.accountStatus === 'suspended') {
      setLastError('This account has been suspended. Please contact support.');
      void signOut(auth);
    }
  }, [auth, userDoc]);

  // ---- role-scoped live data ----
  const uid = currentUser?.uid;
  const role = currentUser?.role;

  useEffect(() => {
    setAllUsers([]);
    setCandidateProfiles({});
    setEmployerProfiles({});
    setSkillClaims([]);
    setAssessments([]);
    setJobs([]);
    setApplications([]);
    setWorkRecords([]);
    setReports([]);
    setPrivacyDeletionRequests([]);
    setNotifications([]);
    setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    if (!uid || !role) return;

    const unsubs: Unsubscribe[] = [];
    const listCol = <T,>(q: Query, set: (items: T[]) => void) =>
      unsubs.push(onSnapshot(q, (snap) => set(snap.docs.map((d) => d.data() as T)), reportError));
    const col = (name: string) => collection(db, name);

    // Notifications subscription (R1 / FR-15)
    unsubs.push(
      onSnapshot(
        query(col(COLLECTIONS.notifications), where('userId', '==', uid)),
        (snap) => {
          const list = snap.docs.map((d) => d.data() as InAppNotification);
          list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
          setNotifications(list);
        },
        reportError
      )
    );
    unsubs.push(
      onSnapshot(
        doc(db, COLLECTIONS.notificationPreferences, uid),
        (snap) => {
          if (snap.exists()) {
            setNotificationPreferences(snap.data() as NotificationPreferences);
          } else {
            setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
          }
        },
        reportError
      )
    );

    if (role === 'candidate') {
      listCol<Job>(query(col(COLLECTIONS.jobs), where('status', '==', 'open')), setJobs);
      listCol<SkillClaim>(query(col(COLLECTIONS.skillClaims), where('candidateId', '==', uid)), setSkillClaims);
      listCol<AssessmentRecord>(query(col(COLLECTIONS.assessments), where('candidateId', '==', uid)), setAssessments);
      listCol<PeerEndorsement>(query(col(COLLECTIONS.endorsements), where('candidateId', '==', uid)), setEndorsements);
      listCol<MentorReview>(query(col(COLLECTIONS.mentorReviews), where('candidateId', '==', uid)), setMentorReviews);
      listCol<Application>(query(col(COLLECTIONS.applications), where('candidateId', '==', uid)), setApplications);
      listCol<WorkRecord>(query(col(COLLECTIONS.workRecords), where('candidateId', '==', uid)), setWorkRecords);
      unsubs.push(onSnapshot(
        doc(db, COLLECTIONS.privacyDeletionRequests, uid),
        (snap) => setPrivacyDeletionRequests(snap.exists() ? [snap.data() as PrivacyDeletionRequest] : []),
        reportError
      ));
      unsubs.push(
        onSnapshot(
          doc(db, COLLECTIONS.candidateProfiles, uid),
          (snap) => {
            if (!snap.exists()) {
              setCandidateProfiles({});
              return;
            }
            const { phone, contactEmail, ...publicProfile } = snap.data() as CandidateProfile;
            if (phone !== undefined || contactEmail !== undefined) {
              const migration = writeBatch(db);
              migration.set(
                doc(db, COLLECTIONS.candidatePrivateProfiles, uid),
                { uid, ...(phone !== undefined ? { phone } : {}), ...(contactEmail !== undefined ? { contactEmail } : {}) },
                { merge: true }
              );
              migration.update(doc(db, COLLECTIONS.candidateProfiles, uid), {
                phone: deleteField(),
                contactEmail: deleteField(),
              });
              fire(migration.commit());
            }
            setCandidateProfiles((prev) => ({
              ...prev,
              [uid]: { ...prev[uid], ...publicProfile } as CandidateProfile,
            }));
          },
          reportError
        )
      );
      unsubs.push(
        onSnapshot(
          doc(db, COLLECTIONS.candidatePrivateProfiles, uid),
          (snap) => {
            if (snap.exists()) setCandidateProfiles((prev) => ({
              ...prev,
              [uid]: { ...prev[uid], ...snap.data() } as CandidateProfile,
            }));
          },
          reportError
        )
      );
    } else if (role === 'employer') {
      listCol<Job>(query(col(COLLECTIONS.jobs), where('employerId', '==', uid)), setJobs);
      listCol<Application>(query(col(COLLECTIONS.applications), where('employerId', '==', uid)), setApplications);
      listCol<WorkRecord>(query(col(COLLECTIONS.workRecords), where('employerId', '==', uid)), setWorkRecords);
      unsubs.push(
        onSnapshot(
          doc(db, COLLECTIONS.employerProfiles, uid),
          (snap) => setEmployerProfiles(snap.exists() ? { [uid]: snap.data() as EmployerProfile } : {}),
          reportError
        )
      );
    } else {
      listCol<User>(col(COLLECTIONS.users), setAllUsers);
      listCol<Job>(col(COLLECTIONS.jobs), setJobs);
      listCol<SkillClaim>(col(COLLECTIONS.skillClaims), setSkillClaims);
      listCol<AssessmentRecord>(col(COLLECTIONS.assessments), setAssessments);
      listCol<PeerEndorsement>(col(COLLECTIONS.endorsements), setEndorsements);
      listCol<MentorReview>(col(COLLECTIONS.mentorReviews), setMentorReviews);
      listCol<Application>(col(COLLECTIONS.applications), setApplications);
      listCol<WorkRecord>(col(COLLECTIONS.workRecords), setWorkRecords);
      listCol<ModerationReport>(col(COLLECTIONS.reports), setReports);
      listCol<PrivacyDeletionRequest>(col(COLLECTIONS.privacyDeletionRequests), setPrivacyDeletionRequests);
      listCol<CandidateProfile>(col(COLLECTIONS.candidateProfiles), (items) => setCandidateProfiles(byId(items)));
      listCol<EmployerProfile>(col(COLLECTIONS.employerProfiles), (items) => setEmployerProfiles(byId(items)));
    }
    return () => unsubs.forEach((unsub) => unsub());
  }, [db, uid, role, reportError]);

  // Employers read profiles/evidence only for people who applied to them (and only where the candidate allows it).
  const applicantKey = useMemo(
    () => (role === 'employer' ? [...new Set(applications.map((a) => a.candidateId))].sort().join(',') : ''),
    [role, applications]
  );
  const contactCandidateKey = useMemo(
    () => (role === 'employer'
      ? [...new Set(applications
          .filter((application) => ['shortlisted', 'selected', 'completed'].includes(application.status))
          .map((application) => application.candidateId))].sort().join(',')
      : ''),
    [role, applications]
  );
  const applicantSubs = useRef<Unsubscribe[]>([]);
  useEffect(() => {
    applicantSubs.current.forEach((unsub) => unsub());
    applicantSubs.current = [];
    if (role !== 'employer' || !applicantKey) return;
    for (const candidateId of applicantKey.split(',')) {
      applicantSubs.current.push(
        onSnapshot(
          doc(db, COLLECTIONS.candidateProfiles, candidateId),
          (snap) => {
            if (snap.exists()) setCandidateProfiles((prev) => ({
              ...prev,
              [candidateId]: { ...prev[candidateId], ...snap.data() } as CandidateProfile,
            }));
          },
          () => undefined // private profiles are expected to be unreadable
        ),
        onSnapshot(
          query(collection(db, COLLECTIONS.skillClaims), where('candidateId', '==', candidateId)),
          (snap) =>
            setSkillClaims((prev) => [
              ...prev.filter((c) => c.candidateId !== candidateId),
              ...snap.docs.map((d) => d.data() as SkillClaim),
            ]),
          () => undefined
        )
      );
      if (contactCandidateKey.split(',').includes(candidateId)) {
        applicantSubs.current.push(
          onSnapshot(
            doc(db, COLLECTIONS.candidatePrivateProfiles, candidateId),
            (snap) => {
              if (snap.exists()) setCandidateProfiles((prev) => ({
                ...prev,
                [candidateId]: { ...prev[candidateId], ...snap.data() } as CandidateProfile,
              }));
            },
            () => undefined
          )
        );
      }
    }
    return () => {
      applicantSubs.current.forEach((unsub) => unsub());
      applicantSubs.current = [];
    };
  }, [db, role, applicantKey, contactCandidateKey]);

  // ---- helpers ----
  const requireUser = (): User => {
    if (!currentUser) throw new Error('Authentication required');
    return currentUser;
  };

  // ---- auth actions ----
  const signInWithGoogle = async (): Promise<unknown> => {
    try {
      return (await signInWithPopup(auth, googleProvider)).user;
    } catch (error) {
      throw new Error(friendlyFirebaseError(error));
    }
  };

  const signInWithApple = async (): Promise<unknown> => {
    try {
      const appleProvider = new OAuthProvider('apple.com');
      appleProvider.addScope('email');
      appleProvider.addScope('name');
      return (await signInWithPopup(auth, appleProvider)).user;
    } catch (error) {
      throw new Error(friendlyFirebaseError(error));
    }
  };

  const signInWithEmail = async (
    email: string,
    pass: string,
    isSignUp = false,
    displayName?: string
  ): Promise<unknown> => {
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
        if (displayName && cred.user) {
          await updateProfile(cred.user, { displayName });
        }
        return cred.user;
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
        return cred.user;
      }
    } catch (error) {
      throw new Error(friendlyFirebaseError(error));
    }
  };

  const phoneConfirmationRef = useRef<ConfirmationResult | null>(null);

  const sendPhoneOtp = async (phoneNumber: string): Promise<boolean> => {
    try {
      let formatted = phoneNumber.trim().replace(/\s+/g, '');
      if (formatted.startsWith('0')) {
        formatted = '+27' + formatted.slice(1);
      } else if (!formatted.startsWith('+')) {
        formatted = '+27' + formatted;
      }
      const container = document.getElementById('recaptcha-container');
      const verifier = container
        ? new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
        : new RecaptchaVerifier(auth, document.body, { size: 'invisible' });
      phoneConfirmationRef.current = await signInWithPhoneNumber(auth, formatted, verifier);
      return true;
    } catch (error) {
      throw new Error(friendlyFirebaseError(error));
    }
  };

  const verifyPhoneOtp = async (code: string): Promise<unknown> => {
    try {
      if (!phoneConfirmationRef.current) {
        throw new Error('Please request an SMS verification code first.');
      }
      const cred = await phoneConfirmationRef.current.confirm(code.trim());
      return cred.user;
    } catch (error) {
      throw new Error(friendlyFirebaseError(error));
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  /** Onboarding: signed-in person picks candidate or employer. Admin is never self-assignable. */
  const registerUser = (displayName: string, email: string, newRole: Role, minimumAgeConfirmed = false): User => {
    if (!firebaseUser) throw new Error('Please sign in first.');
    if (newRole === 'admin') throw new Error('Admin access cannot be self-assigned.');
    const newUser: User = {
      uid: firebaseUser.uid,
      displayName: displayName || firebaseUser.displayName || firebaseUser.email || '',
      email: firebaseUser.email ?? email,
      role: newRole,
      createdAt: nowIso(),
      accountStatus: 'active',
      minimumAgeConfirmed,
    };
    fire((async () => {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${env.apiBaseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: newUser.displayName, role: newRole, minimumAgeConfirmed }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not create your account. Please try again.');
    })());
    return newUser;
  };

  // ---- profiles ----
  const updateCandidateProfile = (profileUid: string, updates: Partial<CandidateProfile>) => {
    const user = requireUser();
    if (user.role !== 'candidate' || user.uid !== profileUid) {
      throw new Error('Permission denied: You can only update your own candidate profile.');
    }
    const currentProfile = candidateProfiles[profileUid] ?? ({} as CandidateProfile);
    const { phone, contactEmail, ...publicUpdates } = updates;
    const next = { ...currentProfile, ...publicUpdates, uid: profileUid, updatedAt: nowIso() };
    fire(setDoc(doc(db, COLLECTIONS.candidateProfiles, profileUid), {
      ...clean(next),
      phone: deleteField(),
      contactEmail: deleteField(),
    }, { merge: true }));
    const privateProfile: Record<string, string> = { uid: profileUid };
    if (phone !== undefined) privateProfile.phone = phone;
    else if (currentProfile.phone !== undefined) privateProfile.phone = currentProfile.phone;
    if (contactEmail !== undefined) privateProfile.contactEmail = contactEmail;
    else if (currentProfile.contactEmail !== undefined) privateProfile.contactEmail = currentProfile.contactEmail;
    if (Object.keys(privateProfile).length > 1) {
      fire(setDoc(doc(db, COLLECTIONS.candidatePrivateProfiles, profileUid), privateProfile, { merge: true }));
    }
  };

  const updateEmployerProfile = (profileUid: string, updates: Partial<EmployerProfile>) => {
    const user = requireUser();
    if (user.role !== 'employer' || user.uid !== profileUid) {
      throw new Error('Permission denied: You can only update your own business profile.');
    }
    // verificationStatus is admin-controlled; strip it from employer edits.
    const { verificationStatus: _ignored, ...safe } = updates;
    fire(setDoc(doc(db, COLLECTIONS.employerProfiles, profileUid), clean({ ...safe, uid: profileUid }), { merge: true }));
  };

  /**
   * Admin-only: update an employer's verification status.
   * Requires the Admin SDK on the server because Firestore rules block client updates to verificationStatus.
   * In this store we call the server route; alternatively an admin can use the Firebase console directly.
   */
  const updateEmployerVerification = async (employerUid: string, status: 'verified' | 'unverified'): Promise<void> => {
    const user = requireUser();
    if (user.role !== 'admin') throw new Error('Admin authorization required.');
    const token = await firebaseUser!.getIdToken();
    const response = await fetch(`${env.apiBaseUrl}/api/admin/verify-employer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ employerUid, status }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Could not update employer verification status.');
  };

  // ---- skills & assessments ----
  const addSkillClaim = async (
    claim: Omit<SkillClaim, 'id' | 'createdAt'>,
    evidenceFile?: File
  ): Promise<SkillClaim> => {
    const user = requireUser();
    if (user.role !== 'candidate') throw new Error('Only candidates can register skill claims.');
    const ref = doc(collection(db, COLLECTIONS.skillClaims));
    const evidencePath = evidenceFile
      ? await uploadCandidateEvidence(user.uid, ref.id, evidenceFile)
      : claim.evidenceUrlOrText;
    // New claims are ALWAYS self-reported. Peer/mentor/assessed labels are granted by others, never typed in by the candidate.
    const newClaim: SkillClaim = {
      ...claim,
      evidenceUrlOrText: evidencePath,
      candidateId: user.uid,
      verificationStatus: 'Self-reported',
      id: ref.id,
      createdAt: nowIso(),
    };
    delete newClaim.assessmentId;
    const batch = writeBatch(db);
    batch.set(ref, clean(newClaim));
    batch.update(doc(db, COLLECTIONS.candidateProfiles, user.uid), { skillIds: arrayUnion(claim.skillId), updatedAt: nowIso() });
    try {
      await batch.commit();
    } catch (error) {
      if (evidenceFile) await deleteCandidateEvidence(evidencePath).catch(() => undefined);
      throw error;
    }
    return newClaim;
  };

  const submitAssessment = (assessment: Omit<AssessmentRecord, 'id' | 'createdAt'>, claimId: string): AssessmentRecord => {
    const user = requireUser();
    if (user.role !== 'admin') throw new Error('Permission denied: Only authorized assessors can record assessment results.');
    const ref = doc(collection(db, COLLECTIONS.assessments));
    const record: AssessmentRecord = { ...assessment, assessorId: user.uid, id: ref.id, createdAt: nowIso() };
    const batch = writeBatch(db);
    batch.set(ref, clean(record));
    if (assessment.decision === 'approved') {
      batch.update(doc(db, COLLECTIONS.skillClaims, claimId), { verificationStatus: 'Task-assessed', assessmentId: ref.id });
    }
    fire(batch.commit());
    return record;
  };

  const requestPeerEndorsement = async (
    claimId: string,
    params: {
      endorserName: string;
      endorserRole: string;
      relationship: string;
      comments: string;
    }
  ): Promise<PeerEndorsement> => {
    const user = requireUser();
    if (user.role !== 'candidate') throw new Error('Only candidates can request peer endorsements.');
    const claim = skillClaims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Skill claim not found.');
    if (claim.candidateId !== user.uid) throw new Error('You can only request endorsements for your own claims.');

    const ref = doc(collection(db, COLLECTIONS.endorsements));
    const newEndorsement: PeerEndorsement = {
      id: ref.id,
      claimId,
      candidateId: user.uid,
      candidateName: user.displayName,
      skillName: claim.skillName,
      endorserName: params.endorserName.trim(),
      endorserRole: params.endorserRole.trim(),
      relationship: params.relationship.trim(),
      comments: params.comments.trim(),
      status: 'pending',
      createdAt: nowIso(),
    };

    fire(setDoc(ref, clean(newEndorsement)));
    return newEndorsement;
  };

  const approvePeerEndorsement = async (endorsementId: string): Promise<void> => {
    const user = requireUser();
    if (user.role !== 'admin') throw new Error('Only administrators can approve peer endorsements.');
    const endorsement = endorsements.find((e) => e.id === endorsementId);
    if (!endorsement) throw new Error('Endorsement not found.');

    const batch = writeBatch(db);
    batch.update(doc(db, COLLECTIONS.endorsements, endorsementId), {
      status: 'approved',
      confirmedAt: nowIso(),
    });
    batch.update(doc(db, COLLECTIONS.skillClaims, endorsement.claimId), {
      verificationStatus: 'Peer-endorsed',
      peerEndorserName: endorsement.endorserName,
      peerEndorsementId: endorsement.id,
    });
    fire(batch.commit());
  };

  const submitMentorReview = async (
    claimId: string,
    params: {
      mentorName: string;
      organization?: string;
      feedback: string;
      decision: 'approved' | 'needs_more_evidence' | 'rejected';
    }
  ): Promise<MentorReview> => {
    const user = requireUser();
    if (user.role !== 'admin') throw new Error('Only authorized mentors or administrators can record mentor reviews.');
    const claim = skillClaims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Skill claim not found.');

    const ref = doc(collection(db, COLLECTIONS.mentorReviews));
    const now = nowIso();
    const newReview: MentorReview = {
      id: ref.id,
      claimId,
      candidateId: claim.candidateId,
      candidateName: 'Candidate',
      skillName: claim.skillName,
      mentorId: user.uid,
      mentorName: params.mentorName.trim() || user.displayName,
      organization: params.organization?.trim() || 'Youth Employment Partner',
      feedback: params.feedback.trim(),
      decision: params.decision,
      createdAt: now,
      reviewedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(ref, clean(newReview));
    if (params.decision === 'approved') {
      batch.update(doc(db, COLLECTIONS.skillClaims, claimId), {
        verificationStatus: 'Mentor-reviewed',
        mentorName: newReview.mentorName,
        mentorReviewId: newReview.id,
      });
    }
    fire(batch.commit());
    return newReview;
  };

  // ---- jobs ----
  const postJob = (
    jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'reportCount' | 'employerId' | 'employerName' | 'employerVerified'>
  ): Job => {
    const user = requireUser();
    if (user.role !== 'employer') throw new Error('Only employers can post opportunities.');
    const profile = employerProfiles[user.uid];
    const ref = doc(collection(db, COLLECTIONS.jobs));
    const newJob: Job = {
      ...jobData,
      id: ref.id,
      employerId: user.uid,
      employerName: profile?.businessName || user.displayName,
      employerVerified: profile?.verificationStatus === 'verified',
      status: 'open',
      reportCount: 0,
      createdAt: nowIso(),
    };
    fire(setDoc(ref, clean(newJob)));
    return newJob;
  };

  const toggleJobStatus = (jobId: string) => {
    const user = requireUser();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) throw new Error('Job not found.');
    if (user.role !== 'admin' && (user.role !== 'employer' || job.employerId !== user.uid)) {
      throw new Error('Permission denied: You can only manage your own jobs.');
    }
    if (job.status === 'flagged' && user.role !== 'admin') {
      throw new Error('This listing was suspended by a moderator.');
    }
    fire(updateDoc(doc(db, COLLECTIONS.jobs, jobId), { status: job.status === 'open' ? 'closed' : 'open' }));
  };

  // ---- applications ----
  const applyToJob = async (jobId: string): Promise<Application> => {
    const user = requireUser();
    if (user.role !== 'candidate') throw new Error('Only registered candidates can apply for jobs.');
    const job = jobs.find((j) => j.id === jobId);
    if (!job) throw new Error('Job listing not found.');
    if (job.status !== 'open') throw new Error('This opportunity is closed or suspended and cannot accept applications.');
    const id = applicationId(jobId, user.uid);
    if (applications.some((a) => a.id === id)) {
      throw new Error('Duplicate application prevented: you have already applied for this opportunity.');
    }
    const profile = candidateProfiles[user.uid];
    if (!profile) throw new Error('Please complete your profile before applying.');

    const token = await firebaseUser!.getIdToken();
    const response = await fetch(`${env.apiBaseUrl}/api/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jobId }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Could not submit your application. Please try again.');
    return result.application as Application;
  };

  const updateApplicationStatus = (
    appId: string,
    newStatus: ApplicationStatus,
    employerNotes?: string,
    payoutConfirmed?: boolean
  ) => {
    const user = requireUser();
    const app = applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found.');
    if (user.role === 'employer' && app.employerId !== user.uid) {
      throw new Error('Access denied: You cannot view or modify applicants belonging to another employer.');
    }
    if (user.role === 'candidate') {
      if (app.candidateId !== user.uid) throw new Error('Permission denied.');
      if (newStatus !== 'withdrawn') throw new Error('Candidates may only withdraw their own application.');
    }
    if (!isValidTransition(app.status, newStatus)) {
      throw new Error(`Invalid status transition: Cannot move application from '${app.status}' to '${newStatus}'.`);
    }

    const batch = writeBatch(db);
    const update: Record<string, unknown> = { status: newStatus, updatedAt: nowIso() };
    if (user.role === 'employer' && employerNotes !== undefined) update.employerNotes = employerNotes;
    batch.update(doc(db, COLLECTIONS.applications, appId), update);

    if (newStatus === 'shortlisted' && user.role === 'employer') {
      batch.set(
        doc(db, COLLECTIONS.employerCandidateContactAccess, app.employerId, 'candidates', app.candidateId),
        {
          candidateId: app.candidateId,
          employerId: app.employerId,
          applicationId: app.id,
          grantedAt: nowIso(),
        },
        { merge: true }
      );
    }

    if (newStatus === 'completed' && user.role === 'employer') {
      const job = jobs.find((j) => j.id === app.jobId);
      const ref = doc(collection(db, COLLECTIONS.workRecords));
      const record: WorkRecord = {
        id: ref.id,
        applicationId: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        candidateId: app.candidateId,
        candidateName: app.candidateName,
        employerId: app.employerId,
        employerName: app.employerName,
        completionStatus: 'completed',
        employerConfirmed: true,
        payoutConfirmed: payoutConfirmed ?? false,
        amountZAR: job?.compensationAmount ?? 0,
        feedback: employerNotes ?? '',
        confirmedAt: nowIso(),
      };
      batch.set(ref, clean(record));
    }

    // Generate in-app notification for candidate (R1 / FR-15)
    const statusNotif = formatApplicationStatusNotification(app.jobTitle, newStatus);
    const notifId = buildNotificationId(app.candidateId, 'application_status', app.id, newStatus);
    const notifRecord: InAppNotification = {
      id: notifId,
      userId: app.candidateId,
      type: 'application_status',
      title: statusNotif.title,
      body: statusNotif.body,
      link: 'applications',
      createdAt: nowIso(),
      readAt: null,
    };
    batch.set(doc(db, COLLECTIONS.notifications, notifId), clean(notifRecord));

    fire(batch.commit());
  };

  // ---- notifications management (R1 / FR-15) ----
  const markNotificationRead = (notificationId: string) => {
    fire(updateDoc(doc(db, COLLECTIONS.notifications, notificationId), { readAt: nowIso() }));
  };

  const markAllNotificationsRead = () => {
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    const now = nowIso();
    unread.forEach((n) => {
      batch.update(doc(db, COLLECTIONS.notifications, n.id), { readAt: now });
    });
    fire(batch.commit());
  };

  const deleteNotification = (notificationId: string) => {
    fire(deleteDoc(doc(db, COLLECTIONS.notifications, notificationId)));
  };

  const updateNotificationPreferences = (prefs: Partial<NotificationPreferences>) => {
    const user = requireUser();
    fire(
      setDoc(doc(db, COLLECTIONS.notificationPreferences, user.uid), clean(prefs), { merge: true })
    );
  };

  // ---- moderation ----
  const submitReport = (
    report: Omit<ModerationReport, 'id' | 'createdAt' | 'status' | 'reporterId' | 'reporterRole'>
  ): ModerationReport => {
    const user = requireUser();
    const ref = doc(collection(db, COLLECTIONS.reports));
    const newReport: ModerationReport = {
      ...report,
      id: ref.id,
      reporterId: user.uid,
      reporterRole: user.role,
      status: 'pending',
      createdAt: nowIso(),
    };
    // reportCount is NOT incremented here: reporters cannot write to jobs. Admins count pending reports per job.
    fire(setDoc(ref, clean(newReport)));
    return newReport;
  };

  const resolveReport = (reportId: string, action: 'dismiss' | 'suspend_job') => {
    const user = requireUser();
    if (user.role !== 'admin') throw new Error('Admin authorization required.');
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;
    const batch = writeBatch(db);
    if (action === 'suspend_job' && report.targetType === 'job') {
      batch.update(doc(db, COLLECTIONS.jobs, report.targetId), { status: 'flagged' });
    }
    batch.update(doc(db, COLLECTIONS.reports, reportId), { status: 'resolved' });
    fire(batch.commit());
  };

  const requestPrivacyDeletion = async () => {
    const user = requireUser();
    if (user.role !== 'candidate') throw new Error('Only candidates can request account deletion.');
    const existing = privacyDeletionRequests.find((request) => request.uid === user.uid);
    if (existing && existing.status !== 'declined') throw new Error('A deletion request is already open.');
    const now = nowIso();
    const ref = doc(db, COLLECTIONS.privacyDeletionRequests, user.uid);
    if (existing) {
      await updateDoc(ref, { status: 'pending', requestedAt: now, updatedAt: now });
    } else {
      await setDoc(ref, { uid: user.uid, status: 'pending', requestedAt: now, updatedAt: now });
    }
  };

  const reviewPrivacyDeletionRequest = async (requestUid: string, status: 'in_review' | 'declined') => {
    const user = requireUser();
    if (user.role !== 'admin') throw new Error('Admin authorization required.');
    await updateDoc(doc(db, COLLECTIONS.privacyDeletionRequests, requestUid), {
      status,
      updatedAt: nowIso(),
      reviewedBy: user.uid,
    });
  };

  /**
   * POPIA deletion completion (FR-03 launch blocker).
   * Calls the server-side DELETE /api/delete-account route which uses the Admin SDK to wipe
   * all Firestore documents, Storage files, and the Firebase Auth account for the given UID.
   * Only works when the deletion request is already in `in_review` state.
   */
  const completePrivacyDeletion = async (requestUid: string): Promise<void> => {
    const user = requireUser();
    if (user.role !== 'admin') throw new Error('Admin authorization required.');
    const token = await firebaseUser!.getIdToken();
    const response = await fetch(`${env.apiBaseUrl}/api/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Target-Uid': requestUid,
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Account deletion failed. Please try again.');
  };

  const switchUser = (_uid: string) => undefined; // demo-only
  const resetDemoData = () => undefined; // demo-only
  const triggerSync = async () => undefined; // handled by the Firestore SDK

  const syncStatus: SyncState = deriveSyncState(isOnline, pendingWriteCount > 0);

  return {
    users: currentUser ? (role === 'admin' ? allUsers : [currentUser]) : [],
    currentUser,
    switchUser,
    registerUser,
    candidateProfiles,
    currentCandidateProfile: currentUser ? candidateProfiles[currentUser.uid] : null,
    updateCandidateProfile,
    employerProfiles,
    currentEmployerProfile: currentUser ? employerProfiles[currentUser.uid] : null,
    updateEmployerProfile,
    updateEmployerVerification,
    skillClaims,
    currentCandidateClaims: currentUser ? skillClaims.filter((c) => c.candidateId === currentUser.uid) : [],
    addSkillClaim,
    assessments,
    submitAssessment,
    endorsements,
    mentorReviews,
    requestPeerEndorsement,
    approvePeerEndorsement,
    submitMentorReview,
    jobs,
    postJob,
    toggleJobStatus,
    applications,
    currentCandidateApplications: currentUser ? applications.filter((a) => a.candidateId === currentUser.uid) : [],
    currentEmployerApplications: currentUser ? applications.filter((a) => a.employerId === currentUser.uid) : [],
    applyToJob,
    updateApplicationStatus,
    workRecords,
    reports,
    submitReport,
    resolveReport,
    privacyDeletionRequests,
    requestPrivacyDeletion,
    reviewPrivacyDeletionRequest,
    completePrivacyDeletion,
    // In-App Notifications (R1 / FR-15)
    notifications,
    unreadNotificationCount: notifications.filter((n) => !n.readAt).length,
    notificationPreferences,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    updateNotificationPreferences,
    lowDataMode: prefs.lowDataMode,
    setLowDataMode: prefs.setLowDataMode,
    profileDraft: prefs.profileDraft,
    saveDraft: prefs.saveDraft,
    resetDemoData,
    syncStatus,
    pendingSyncCount: pendingWriteCount,
    isOnline,
    triggerSync,
    signInWithGoogle,
    signInWithEmail,
    signInWithApple,
    sendPhoneOtp,
    verifyPhoneOtp,
    signOutUser,
    authLoading,
    needsOnboarding,
    authIdentity: firebaseUser
      ? { displayName: firebaseUser.displayName ?? '', email: firebaseUser.email ?? '' }
      : null,
    lastError,
    clearError: () => setLastError(null),
  };
}
