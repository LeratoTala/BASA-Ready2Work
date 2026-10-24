import { env } from '../config/env';
import React, { useState } from 'react';
import { useDemoStore } from './store/useDemoStore';
import { useFirestoreStore } from './store/useFirestoreStore';
import type { BasaStore } from './store/types';
import { OnboardingPage } from '../features/auth/components/OnboardingPage';
import { Header, ViewportMode } from '../shared/components/Header';
import { PopiaBanner } from '../shared/components/PopiaBanner';
import { DemoTourModal } from '../shared/components/DemoTourModal';
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
import { AdminDashboard } from '../features/admin/components/AdminDashboard';
import { AssessorProfilePage } from '../features/admin/components/AssessorProfilePage';
import { ExportPassportModal } from '../features/candidate/components/ExportPassportModal';
import { calculateMatchScore } from '../domain/matching';
import { Application, Job, MatchBreakdown, Role } from '../domain/types';
import { Flame, Shield, Info, CheckCircle2, Award } from 'lucide-react';

export default function App() {
  // env.enableDemoData is fixed at build time, so exactly one store hook runs for the app's lifetime.
  const store: BasaStore = env.enableDemoData ? useDemoStore() : useFirestoreStore();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isExportPassportOpen, setIsExportPassportOpen] = useState(false);
  const [isAIDrafterOpen, setIsAIDrafterOpen] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
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
      />
    );
  }

  // AUTH GATE: A person has to sign in in order to see a page
  if (!currentUser) {
    return (
      <SignInPage
        onSignInWithGoogle={store.signInWithGoogle}
        onSelectDemoUser={handleSwitchUser}
        demoUsers={env.enableDemoData ? store.users : []}
      />
    );
  }

  const handleRoleTourSwitch = (role: Role, uid: string) => {
    store.switchUser(uid);
    setActiveTab('dashboard');
    setIsDemoTourOpen(false);
  };

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
          : 'bg-[#faf8f5] text-stone-900'
      }`}
    >
      {/* Global Header */}
      <Header
        currentUser={currentUser}
        users={store.users}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lowDataMode={store.lowDataMode}
        onToggleLowData={() => store.setLowDataMode(!store.lowDataMode)}
        onOpenDemoTour={() => setIsDemoTourOpen(true)}
        onResetDemoData={store.resetDemoData}
        syncStatus={store.syncStatus}
        pendingCount={store.pendingSyncCount}
        isOnline={store.isOnline}
        onSyncNow={store.triggerSync}
        onSignInGoogle={store.signInWithGoogle}
        onSignOutGoogle={store.signOutUser}
        viewportMode={viewportMode}
        onSetViewportMode={setViewportMode}
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
                onOpenSkills={() => setActiveTab('skills')}
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
                onOpenPassport={() => setIsPassportOpen(true)}
                onOpenAIDrafter={() => setIsAIDrafterOpen(true)}
                onOpenSkills={() => setActiveTab('skills')}
                onOpenExport={() => setIsExportPassportOpen(true)}
                onOpenProfile={() => setActiveTab('profile')}
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
                onOpenPassport={() => setIsPassportOpen(true)}
                onOpenAIDrafter={() => setIsAIDrafterOpen(true)}
              />
            )}

            {activeTab === 'passport' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-stone-200 p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">Your Skill Passport</h2>
                    <p className="text-xs text-stone-500 mt-1">
                      Your skills, evidence and honest verification labels in one place.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPassportOpen(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer"
                  >
                    Open Full Passport Modal
                  </button>
                </div>
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
                  onOpenPassport={() => setIsPassportOpen(true)}
                  onOpenAIDrafter={() => setIsAIDrafterOpen(true)}
                />
              </div>
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
                onOpenProfile={() => setActiveTab('profile')}
              />
            )}

            {activeTab === 'applicants' && (
              <ApplicantListView
                applications={store.currentEmployerApplications}
                jobs={store.jobs.filter((j) => j.employerId === currentUser.uid)}
                onSelectApplication={(app) => setSelectedAppForModal(app)}
                candidateProfiles={store.candidateProfiles}
                skillClaims={store.skillClaims}
              />
            )}
          </>
        )}

        {/* ================= ADMIN / ASSESSOR PERSONA ================= */}
        {currentUser.role === 'admin' && (
          <>
            {activeTab === 'profile' && (
              <AssessorProfilePage
                assessorName={currentUser.displayName}
                assessments={store.assessments}
                claims={store.skillClaims}
              />
            )}

            {activeTab !== 'profile' && (
              <AdminDashboard
                assessorId={currentUser.uid}
                assessorName={currentUser.displayName}
                claims={store.skillClaims}
                candidateProfiles={store.candidateProfiles}
                assessments={store.assessments}
                jobs={store.jobs}
                reports={store.reports}
                privacyDeletionRequests={store.privacyDeletionRequests}
                onSubmitAssessment={store.submitAssessment}
                onResolveReport={store.resolveReport}
                onReviewPrivacyDeletionRequest={store.reviewPrivacyDeletionRequest}
                activeSubTab={activeTab}
              />
            )}
          </>
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
            <span>POPIA Protected</span>
            {env.enableDemoData && (
              <>
                <span>·</span>
                <button
                  onClick={() => setIsDemoTourOpen(true)}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  5-Minute Demo Script
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DemoTourModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onSwitchRole={handleRoleTourSwitch}
      />

      {isPassportOpen && store.currentCandidateProfile && (
        <SkillPassportModal
          isOpen={isPassportOpen}
          onClose={() => setIsPassportOpen(false)}
          candidate={store.currentCandidateProfile}
          claims={store.currentCandidateClaims}
          onOpenExport={() => setIsExportPassportOpen(true)}
        />
      )}

      {isExportPassportOpen && store.currentCandidateProfile && (
        <ExportPassportModal
          isOpen={isExportPassportOpen}
          onClose={() => setIsExportPassportOpen(false)}
          candidate={store.currentCandidateProfile}
          claims={store.currentCandidateClaims}
        />
      )}

      {isAIDrafterOpen && store.currentCandidateProfile && (
        <AICVDrafterModal
          isOpen={isAIDrafterOpen}
          onClose={() => setIsAIDrafterOpen(false)}
          candidate={store.currentCandidateProfile}
          claims={store.currentCandidateClaims}
          onApplyDraft={handleApplyCVDraft}
        />
      )}

      {selectedJobForModal && store.currentCandidateProfile && (
        <OpportunityDetailModal
          isOpen={Boolean(selectedJobForModal)}
          onClose={() => setSelectedJobForModal(null)}
          job={selectedJobForModal.job}
          candidate={store.currentCandidateProfile}
          claims={store.currentCandidateClaims}
          matchBreakdown={selectedJobForModal.breakdown}
          hasApplied={store.applications.some(
            (a) =>
              a.jobId === selectedJobForModal.job.id &&
              a.candidateId === currentUser.uid &&
              a.status !== 'withdrawn'
          )}
          onApply={handleApplyToJob}
          onReport={handleReportJob}
        />
      )}

      {isCreateJobOpen && (
        <CreateOpportunityModal
          isOpen={isCreateJobOpen}
          onClose={() => setIsCreateJobOpen(false)}
          onSubmit={store.postJob}
          defaultLocation={store.currentEmployerProfile?.locationArea || 'Johannesburg CBD'}
        />
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
          currentEmployerId={currentUser.uid}
          onUpdateStatus={(appId, newStatus, notes, payout) => {
            store.updateApplicationStatus(appId, newStatus, notes, payout);
            // Refresh modal application state
            const updated = store.applications.find((a) => a.id === appId);
            if (updated) setSelectedAppForModal({ ...updated, status: newStatus });
          }}
        />
      )}
    </div>
  );
}
