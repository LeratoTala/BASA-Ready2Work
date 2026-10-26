import { env } from '../config/env';
import React, { useState, useEffect } from 'react';
import { useDemoStore } from './store/useDemoStore';
import { useFirestoreStore } from './store/useFirestoreStore';
import type { BasaStore } from './store/types';
import { OnboardingPage } from '../features/auth/components/OnboardingPage';
import { Header, ViewportMode } from '../shared/components/Header';
import { PopiaBanner } from '../shared/components/PopiaBanner';
import { SignInPage } from '../features/auth/components/SignInPage';
import { CandidateDashboard } from '../features/candidate/components/CandidateDashboard';
import { CandidateProfilePage } from '../features/candidate/components/CandidateProfilePage';
import { SkillsAndEvidence } from '../features/candidate/components/SkillsAndEvidence';
import { SkillPassportModal } from '../features/candidate/components/SkillPassportModal';
import { AICVDrafterModal } from '../features/candidate/components/AICVDrafterModal';
import { OpportunityDetailModal } from '../features/candidate/components/OpportunityDetailModal';
import { ApplicationsView } from '../features/candidate/components/ApplicationsView';
import { EmployerDashboard } from '../features/employer/components/EmployerDashboard';
import { EmployerProfilePage } from '../features/employer/components/EmployerProfilePage';
import { CreateOpportunityModal } from '../features/employer/components/CreateOpportunityModal';
import { ApplicantListView } from '../features/employer/components/ApplicantListView';
import { CandidateDetailModal } from '../features/employer/components/CandidateDetailModal';
import { DemoUpgradeModal } from '../features/employer/components/DemoUpgradeModal';
import { PricingPulseSurveyModal } from '../features/employer/components/PricingPulseSurveyModal';
import { AdminDashboard } from '../features/admin/components/AdminDashboard';
import { ExportPassportModal } from '../features/candidate/components/ExportPassportModal';
import { NotificationCenterModal } from '../features/notifications/components/NotificationCenterModal';
import { useColorTheme } from './useColorTheme';
import { calculateMatchScore } from '../domain/matching';
import { Application, CandidateProfile, Job, MatchBreakdown } from '../domain/types';
import { Flame, Shield, Info, CheckCircle2, Award } from 'lucide-react';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import { triggerOSHaptic } from '../shared/utils/osOperations';

export default function App() {
  // env.enableDemoData is fixed at build time, so exactly one store hook runs for the app's lifetime.
  const store: BasaStore = env.enableDemoData ? useDemoStore() : useFirestoreStore();
  const { theme, toggleTheme } = useColorTheme();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isExportPassportOpen, setIsExportPassportOpen] = useState(false);
  const [isAIDrafterOpen, setIsAIDrafterOpen] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPulseSurveyOpen, setIsPulseSurveyOpen] = useState(false);
  const [selectedJobForModal, setSelectedJobForModal] = useState<{
    job: Job;
    breakdown: MatchBreakdown;
  } | null>(null);
  const [selectedAppForModal, setSelectedAppForModal] = useState<Application | null>(null);

  const currentUser = store.currentUser;

  // Switch role and reset tab to dashboard
  const handleSwitchUser = (uid: string) => {
    store.switchUser(uid);
    setActiveTab('dashboard');
  };

  // OS tab navigation with history push and tactile haptics
  const handleSelectTab = (tab: string) => {
    if (tab !== activeTab) {
      triggerOSHaptic('light');
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ appTab: tab }, '');
      }
      setActiveTab(tab);
    }
  };

  // Sync OS hardware/gesture Back button for top-level subtab navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e: PopStateEvent) => {
      // If modal was open, modal's own hook handles popstate.
      // If no modal is active and back is pressed:
      if (e.state && e.state.appTab) {
        setActiveTab(e.state.appTab);
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // Global desktop OS operational shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Cmd+K or Ctrl+K -> Open Notifications / Quick Activity
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        triggerOSHaptic('light');
        setIsNotificationsOpen((prev) => !prev);
      }

      // Alt+LeftArrow -> Go back to dashboard if on subtab (standard Windows/Linux OS back)
      if (e.altKey && e.key === 'ArrowLeft' && activeTab !== 'dashboard') {
        e.preventDefault();
        triggerOSHaptic('light');
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  if (store.authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf8f5] text-stone-500 text-sm" role="status">
        Loading…
      </main>
    );
  }

  // First sign-in: the person chooses candidate or employer. Admin is never self-assignable.
  if (!currentUser && store.needsOnboarding && store.authIdentity) {
    return (
      <OnboardingPage
        displayName={store.authIdentity.displayName}
        email={store.authIdentity.email}
        minimumAge={env.minimumUserAge}
        onComplete={store.registerUser}
        onSignOut={store.signOutUser}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // AUTH GATE: A person has to sign in in order to see a page
  if (!currentUser) {
    return (
      <SignInPage
        onSignInWithGoogle={store.signInWithGoogle}
        onSignInWithEmail={store.signInWithEmail}
        onSignInWithApple={store.signInWithApple}
        onSendPhoneOtp={store.sendPhoneOtp}
        onVerifyPhoneOtp={store.verifyPhoneOtp}
        onSelectDemoUser={handleSwitchUser}
        demoUsers={env.enableDemoData ? store.users : []}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Open job detail with computed matching breakdown
  const handleSelectJob = (job: Job, breakdown?: MatchBreakdown) => {
    const candidate = store.currentCandidateProfile || {
      uid: currentUser.uid,
      fullName: currentUser.displayName,
      headline: '',
      experienceSummary: '',
      skillIds: [],
      locationArea: 'Johannesburg',
      availability: 'immediate',
      popiaVisibility: 'public_link',
      updatedAt: new Date().toISOString(),
    };
    const calculated = breakdown || calculateMatchScore(job, candidate, store.currentCandidateClaims);
    setSelectedJobForModal({ job, breakdown: calculated });
  };

  const handleApplyToJob = async (jobId: string) => {
    await store.applyToJob(jobId);
    if (selectedJobForModal) {
      setSelectedJobForModal(null);
    }
  };

  const handleReportJob = (jobId: string, title: string, reason: string) => {
    store.submitReport({
      targetType: 'job',
      targetId: jobId,
      targetTitle: title,
      reason,
    });
  };

  const handleApplyCVDraft = (headline: string, summary: string) => {
    if (store.currentCandidateProfile) {
      store.updateCandidateProfile(currentUser.uid, {
        headline,
        experienceSummary: summary,
      });
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        store.lowDataMode
          ? 'bg-stone-100 text-stone-900 contrast-125'
          : theme === 'dark' ? 'bg-stone-950 text-stone-100' : 'bg-[#faf8f5] text-stone-900'
      }`}
    >
      {/* Global Header */}
      <Header
        currentUser={currentUser}
        users={store.users}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        lowDataMode={store.lowDataMode}
        onToggleLowData={() => store.setLowDataMode(!store.lowDataMode)}
        onResetDemoData={store.resetDemoData}
        syncStatus={store.syncStatus}
        pendingCount={store.pendingSyncCount}
        isOnline={store.isOnline}
        onSyncNow={store.triggerSync}
        onSignInGoogle={store.signInWithGoogle}
        onSignOutGoogle={store.signOutUser}
        viewportMode={viewportMode}
        onSetViewportMode={setViewportMode}
        unreadNotificationCount={store.unreadNotificationCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onSubmitFeedback={store.submitFeedback}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* POPIA Privacy Notification Banner */}
      <PopiaBanner
        visibility={store.currentCandidateProfile?.popiaVisibility || 'public_link'}
        onUpdateVisibility={(val) =>
          store.currentCandidateProfile &&
          store.updateCandidateProfile(currentUser.uid, { popiaVisibility: val })
        }
        isCandidate={currentUser.role === 'candidate'}
      />

      {store.lastError && (
        <div role="alert" className="bg-rose-50 border-b border-rose-200 text-rose-800 text-sm px-4 py-2 flex items-center justify-between gap-3">
          <span>{store.lastError}</span>
          <button onClick={store.clearError} className="font-semibold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Main Content Area with Viewport Adaptation (Desktop / Tablet / Mobile Phone) */}
      <div
        className={`flex-1 transition-all duration-300 w-full ${
          viewportMode === 'mobile'
            ? 'max-w-[420px] mx-auto my-6 bg-white rounded-[44px] border-[12px] border-stone-800 shadow-2xl overflow-hidden'
            : viewportMode === 'tablet'
            ? 'max-w-[800px] mx-auto my-4 bg-white rounded-2xl border-4 border-stone-700 shadow-xl overflow-hidden'
            : 'w-full'
        }`}
      >
        {/* Mobile Device Status Bar Notch (When in Mobile Preview) */}
        {viewportMode === 'mobile' && (
          <div className="bg-stone-900 text-stone-200 px-6 py-2 flex items-center justify-between text-[11px] font-medium border-b border-stone-800 select-none">
            <span>09:41</span>
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-stone-800 mr-2" />
            </div>
            <span>LTE · 92%</span>
          </div>
        )}

        <main className={`px-4 py-6 ${viewportMode === 'mobile' ? 'max-h-[820px] overflow-y-auto' : 'max-w-7xl mx-auto'}`}>
        {/* ================= CANDIDATE PERSONA ================= */}
        {currentUser.role === 'candidate' && (
          <>
            {activeTab === 'profile' && (
              <CandidateProfilePage
                candidate={
                  store.currentCandidateProfile || {
                    uid: currentUser.uid,
                    fullName: currentUser.displayName,
                    headline: 'Jobseeker',
                    experienceSummary: '',
                    skillIds: [],
                    locationArea: 'Soweto, Johannesburg',
                    availability: 'immediate',
                    popiaVisibility: 'public_link',
                    updatedAt: new Date().toISOString(),
                  }
                }
                claims={store.currentCandidateClaims}
                workRecords={store.workRecords}
                deletionRequest={store.privacyDeletionRequests.find((request) => request.uid === currentUser.uid) ?? null}
                onRequestDeletion={store.requestPrivacyDeletion}
                onUpdateProfile={(updates) =>
                  store.updateCandidateProfile(currentUser.uid, updates)
                }
                onOpenExport={() => setIsExportPassportOpen(true)}
                onOpenSkills={() => handleSelectTab('skills')}
              />
            )}

            {(activeTab === 'dashboard' || activeTab === 'opportunities') && (
              <CandidateDashboard
                candidate={
                  store.currentCandidateProfile || {
                    uid: currentUser.uid,
                    fullName: currentUser.displayName,
                    headline: 'Jobseeker',
                    experienceSummary: '',
                    skillIds: [],
                    locationArea: 'Soweto, Johannesburg',
                    availability: 'immediate',
                    popiaVisibility: 'public_link',
                    updatedAt: new Date().toISOString(),
                  }
                }
                claims={store.currentCandidateClaims}
                jobs={store.jobs}
                applications={store.currentCandidateApplications}
                workRecords={store.workRecords.filter((r) => r.candidateId === currentUser.uid)}
                onOpenPassport={() => setIsPassportOpen(true)}
                onOpenAIDrafter={() => setIsAIDrafterOpen(true)}
                onOpenSkills={() => handleSelectTab('skills')}
                onOpenExport={() => setIsExportPassportOpen(true)}
                onOpenProfile={() => handleSelectTab('profile')}
                onSelectJob={(job, breakdown) => handleSelectJob(job, breakdown)}
                onUpdateProfile={(updates) =>
                  store.updateCandidateProfile(currentUser.uid, updates)
                }
                profileDraft={store.profileDraft}
                onSaveDraft={store.saveDraft}
              />
            )}

            {activeTab === 'skills' && (
              <SkillsAndEvidence
                candidate={
                  store.currentCandidateProfile || {
                    uid: currentUser.uid,
                    fullName: currentUser.displayName,
                    headline: 'Jobseeker',
                    experienceSummary: '',
                    skillIds: [],
                    locationArea: 'Soweto, Johannesburg',
                    availability: 'immediate',
                    popiaVisibility: 'public_link',
                    updatedAt: new Date().toISOString(),
                  }
                }
                claims={store.currentCandidateClaims}
                onAddClaim={store.addSkillClaim}
                onUpdateClaimEvidence={store.updateClaimEvidence}
                onOpenPassport={() => setIsPassportOpen(true)}
                onOpenAIDrafter={() => setIsAIDrafterOpen(true)}
                onAddCredential={store.addCredentialToClaim}
                onRequestPeerEndorsement={store.requestPeerEndorsement}
                onRequestMentorReview={store.submitMentorReview}
              />
            )}

            {activeTab === 'applications' && (
              <ApplicationsView
                applications={store.currentCandidateApplications}
                onWithdraw={(appId) => store.updateApplicationStatus(appId, 'withdrawn')}
              />
            )}
          </>
        )}

        {/* ================= EMPLOYER PERSONA ================= */}
        {currentUser.role === 'employer' && (
          <>
            {activeTab === 'profile' && (
              <EmployerProfilePage
                employer={
                  store.currentEmployerProfile || {
                    uid: currentUser.uid,
                    businessName: currentUser.displayName,
                    industry: 'General Services',
                    description: 'Local business providing entry-level opportunities.',
                    locationArea: 'Johannesburg CBD',
                    verificationStatus: 'verified',
                    contactEmail: currentUser.email,
                    createdAt: new Date().toISOString(),
                  }
                }
                jobs={store.jobs.filter((j) => j.employerId === currentUser.uid)}
                applications={store.currentEmployerApplications}
                onUpdateEmployerProfile={(updates) =>
                  store.updateEmployerProfile(currentUser.uid, updates)
                }
                onOpenCreateJob={() => setIsCreateJobOpen(true)}
                onToggleJobStatus={store.toggleJobStatus}
                onViewApplicants={() => setActiveTab('applicants')}
                onRequestVerification={store.requestEmployerVerification}
                onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
                onDowngradePlan={(newPlan, reason) => store.downgradeEmployerPlan(currentUser.uid, newPlan, reason)}
              />
            )}

            {(activeTab === 'dashboard' || activeTab === 'jobs') && (
              <EmployerDashboard
                employer={
                  store.currentEmployerProfile || {
                    uid: currentUser.uid,
                    businessName: currentUser.displayName,
                    industry: 'General Services',
                    description: 'Local business providing entry-level opportunities.',
                    locationArea: 'Johannesburg CBD',
                    verificationStatus: 'verified',
                    contactEmail: currentUser.email,
                    createdAt: new Date().toISOString(),
                  }
                }
                jobs={store.jobs.filter((j) => j.employerId === currentUser.uid)}
                applications={store.currentEmployerApplications}
                onOpenCreateJob={() => setIsCreateJobOpen(true)}
                onToggleJobStatus={store.toggleJobStatus}
                onSelectApplication={(app) => setSelectedAppForModal(app)}
                onViewAllApplicants={() => setActiveTab('applicants')}
                onUpdateEmployerProfile={(updates) =>
                  store.updateEmployerProfile(currentUser.uid, updates)
                }
                onRequestVerification={store.requestEmployerVerification}
                onOpenProfile={() => setActiveTab('profile')}
                onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
                onOpenPulseSurvey={() => setIsPulseSurveyOpen(true)}
              />
            )}

            {activeTab === 'applicants' && (
              <ApplicantListView
                applications={store.currentEmployerApplications}
                jobs={store.jobs.filter((j) => j.employerId === currentUser.uid)}
                onSelectApplication={(app) => setSelectedAppForModal(app)}
                candidateProfiles={store.candidateProfiles}
                skillClaims={store.skillClaims}
                onConfirmPayout={store.confirmWorkPayout}
              />
            )}
          </>
        )}

        {/* ================= ADMIN / ASSESSOR PERSONA ================= */}
        {currentUser.role === 'admin' && (
          <AdminDashboard
            assessorId={currentUser.uid}
            assessorName={currentUser.displayName}
            claims={store.skillClaims}
            candidateProfiles={store.candidateProfiles}
            employerProfiles={store.employerProfiles}
            assessments={store.assessments}
            applications={store.applications}
            workRecords={store.workRecords}
            jobs={store.jobs}
            reports={store.reports}
            privacyDeletionRequests={store.privacyDeletionRequests}
            endorsements={store.endorsements}
            mentorReviews={store.mentorReviews}
            upgradeRequests={store.upgradeRequests}
            downgradeRequests={store.downgradeRequests}
            pulseSurveys={store.pulseSurveys}
            onSubmitAssessment={store.submitAssessment}
            onResolveReport={store.resolveReport}
            onReviewPrivacyDeletionRequest={store.reviewPrivacyDeletionRequest}
            onCompletePrivacyDeletion={store.completePrivacyDeletion}
            onVerifyEmployer={store.updateEmployerVerification}
            onApproveEndorsement={store.approvePeerEndorsement}
            onSubmitMentorReview={store.submitMentorReview}
            onToggleJobStatus={store.toggleJobStatus}
            onReviewCredential={store.reviewCredential}
            onApproveUpgradeRequest={store.approveUpgradeRequest}
            onDeclineUpgradeRequest={store.declineUpgradeRequest}
            activeSubTab={activeTab === 'profile' ? 'overview' : activeTab}
            onSelectSubTab={setActiveTab}
          />
        )}
      </main>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 border-t border-stone-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-white font-bold">BASA: Ready2Work</span>
            <span className="text-stone-500">·</span>
            <span>Bridge to Actual Skills & Access · South Africa MVP</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>Fair Work · Zero Upfront Fees</span>
            <span>·</span>
            <a href="/PRIVACY.md" target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-amber-400 underline">
              Privacy Notice (POPIA)
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {(() => {
        const candidateForModals: CandidateProfile = store.currentCandidateProfile || {
          uid: currentUser.uid,
          fullName: currentUser.displayName || 'Jobseeker',
          headline: 'Jobseeker',
          experienceSummary: '',
          skillIds: [],
          locationArea: 'Soweto, Johannesburg',
          availability: 'immediate',
          popiaVisibility: 'public_link',
          updatedAt: new Date().toISOString(),
        };

        return (
          <>
            {isPassportOpen && (
              <SkillPassportModal
                isOpen={isPassportOpen}
                onClose={() => setIsPassportOpen(false)}
                candidate={candidateForModals}
                claims={store.currentCandidateClaims}
                onOpenExport={() => setIsExportPassportOpen(true)}
              />
            )}

            {isExportPassportOpen && (
              <ExportPassportModal
                isOpen={isExportPassportOpen}
                onClose={() => setIsExportPassportOpen(false)}
                candidate={candidateForModals}
                claims={store.currentCandidateClaims}
              />
            )}

            {isAIDrafterOpen && (
              <AICVDrafterModal
                isOpen={isAIDrafterOpen}
                onClose={() => setIsAIDrafterOpen(false)}
                candidate={candidateForModals}
                claims={store.currentCandidateClaims}
                onApplyDraft={handleApplyCVDraft}
              />
            )}

            {selectedJobForModal && (
              <OpportunityDetailModal
                isOpen={Boolean(selectedJobForModal)}
                onClose={() => setSelectedJobForModal(null)}
                job={selectedJobForModal.job}
                candidate={candidateForModals}
                claims={store.currentCandidateClaims}
                matchBreakdown={selectedJobForModal.breakdown}
                hasApplied={store.applications.some(
                  (a) =>
                    a.jobId === selectedJobForModal.job.id &&
                    a.candidateId === currentUser.uid
                )}
                application={
                  store.applications.find(
                    (a) =>
                      a.jobId === selectedJobForModal.job.id &&
                      a.candidateId === currentUser.uid
                  ) || null
                }
                onApply={handleApplyToJob}
                onReport={handleReportJob}
              />
            )}
          </>
        );
      })()}

      {isCreateJobOpen && (
        <CreateOpportunityModal
          isOpen={isCreateJobOpen}
          onClose={() => setIsCreateJobOpen(false)}
          onSubmit={async (jobData) => {
            await store.postJob(jobData);
            setIsPulseSurveyOpen(true);
          }}
          defaultLocation={store.currentEmployerProfile?.locationArea || 'Johannesburg CBD'}
          activeJobCount={
            store.jobs.filter((j) => j.status === 'open' && j.employerId === currentUser?.uid).length
          }
          employerPlan={store.currentEmployerProfile?.plan || 'free'}
          onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        />
      )}

      {currentUser && currentUser.role === 'employer' && (
        <>
          <DemoUpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            employerUid={currentUser.uid}
            businessName={store.currentEmployerProfile?.businessName || currentUser.displayName}
            defaultEmail={currentUser.email}
            currentPlan={store.currentEmployerProfile?.plan || 'free'}
            onSubmitUpgradeRequest={store.requestEmployerUpgrade}
          />
          <PricingPulseSurveyModal
            isOpen={isPulseSurveyOpen}
            onClose={() => setIsPulseSurveyOpen(false)}
            employerUid={currentUser.uid}
            onSubmitSurvey={store.submitPricingPulseSurvey}
          />
        </>
      )}

      {selectedAppForModal && (
        <CandidateDetailModal
          isOpen={Boolean(selectedAppForModal)}
          onClose={() => setSelectedAppForModal(null)}
          application={selectedAppForModal}
          candidateProfile={store.candidateProfiles[selectedAppForModal.candidateId] || null}
          candidateClaims={store.skillClaims.filter(
            (c) => c.candidateId === selectedAppForModal.candidateId
          )}
          candidateWorkRecords={store.workRecords.filter(
            (w) => w.candidateId === selectedAppForModal.candidateId
          )}
          currentEmployerId={currentUser.uid}
          job={store.jobs.find((j) => j.id === selectedAppForModal.jobId) || null}
          onUpdateStatus={(appId, newStatus, notes, payout) => {
            store.updateApplicationStatus(appId, newStatus, notes, payout);
            // Refresh modal application state
            const updated = store.applications.find((a) => a.id === appId);
            if (updated) setSelectedAppForModal({ ...updated, status: newStatus });
          }}
          onConfirmPayout={(appId, details) => {
            store.confirmWorkPayout(appId, details);
            const updated = store.applications.find((a) => a.id === appId);
            if (updated) setSelectedAppForModal({ ...updated, payoutConfirmed: true });
          }}
        />
      )}

      {/* In-App Notifications Center (R1 / FR-15) */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={store.notifications}
        unreadCount={store.unreadNotificationCount}
        preferences={store.notificationPreferences}
        onMarkRead={store.markNotificationRead}
        onMarkAllRead={store.markAllNotificationsRead}
        onDelete={store.deleteNotification}
        onUpdatePreferences={store.updateNotificationPreferences}
        onNavigateTab={(tab) => {
          handleSelectTab(tab);
          setIsNotificationsOpen(false);
        }}
      />
    </div>
  );
}
