import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Wifi,
  WifiOff,
  Shield,
  Building2,
  User,
  LogIn,
  LogOut,
  Monitor,
  Smartphone,
  Tablet,
  Bell,
  MessageSquare,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Role, User as UserType, FeedbackRecord } from '../../domain/types';
import { SyncIndicator } from './SyncIndicator';
import { SyncState } from '../../services/syncService';
import { ThemeToggle } from './ThemeToggle';
import type { ColorTheme } from '../../app/useColorTheme';
import { FeedbackModal } from '../../features/feedback/components/FeedbackModal';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

interface Props {
  currentUser: UserType | null;
  users: UserType[];
  onSwitchUser: (uid: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  lowDataMode: boolean;
  onToggleLowData: () => void;
  onResetDemoData?: () => void;
  theme: ColorTheme;
  onToggleTheme: () => void;
  syncStatus: SyncState;
  pendingCount: number;
  isOnline: boolean;
  onSyncNow: () => void;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  viewportMode: ViewportMode;
  onSetViewportMode: (mode: ViewportMode) => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  onSubmitFeedback?: (feedback: Omit<FeedbackRecord, 'id' | 'createdAt'>) => void;
  mode?: 'demo' | 'real';
}

export const Header: React.FC<Props> = ({
  currentUser,
  users,
  onSwitchUser,
  activeTab,
  onSelectTab,
  lowDataMode,
  onToggleLowData,
  theme,
  onToggleTheme,
  syncStatus,
  pendingCount,
  isOnline,
  onSyncNow,
  onSignInGoogle,
  onSignOutGoogle,
  viewportMode,
  onSetViewportMode,
  unreadNotificationCount,
  onOpenNotifications,
  onSubmitFeedback,
  mode = 'real',
}) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close persona dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    if (isSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSwitcherOpen]);

  // Navigation tabs based on role — simplified to essential, non-redundant views
  const candidateTabs = [
    { id: 'dashboard', label: 'Opportunities' },
    { id: 'skills', label: 'Skills & Proof' },
    { id: 'applications', label: 'My Applications' },
    { id: 'profile', label: 'My Profile' },
  ];

  const employerTabs = [
    { id: 'dashboard', label: 'Dashboard & Jobs' },
    { id: 'applicants', label: 'Applicants' },
    { id: 'profile', label: 'Company Profile' },
  ];

  const adminTabs = [
    { id: 'overview', label: 'Pilot Overview' },
    { id: 'jobs', label: 'Manage Jobs' },
    { id: 'assessments', label: 'Assessor Workspace' },
    { id: 'credentials', label: 'Credential Review' },
    { id: 'reports', label: 'Moderation Reports' },
  ];

  let currentTabs = candidateTabs;
  if (currentUser?.role === 'employer') currentTabs = employerTabs;
  if (currentUser?.role === 'admin') currentTabs = adminTabs;

  const isDemo = mode === 'demo';

  // Grouped users for demo switcher
  const candidateUsers = users.filter((u) => u.role === 'candidate');
  const employerUsers = users.filter((u) => u.role === 'employer');
  const adminUsers = users.filter((u) => u.role === 'admin');

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
      {/* Top Utility & Persona Switcher Bar */}
      <div className="bg-stone-900 text-stone-200 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Persona quick switch (demo only) */}
          {isDemo ? (
            <div className="relative" ref={switcherRef}>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-xs cursor-pointer transition-colors shadow-2xs"
                aria-expanded={isSwitcherOpen}
                aria-label="Switch demo profile"
              >
                <span className="text-stone-400 font-normal">Switch profile:</span>
                <span className="text-white font-semibold">
                  {currentUser ? currentUser.displayName.split(' ')[0] : 'Select'}
                </span>
                <span className="text-[10px] text-amber-400 capitalize bg-stone-900 px-1 py-0.5 rounded border border-stone-700">
                  {currentUser?.role ?? 'demo'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
              </button>

              {isSwitcherOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-72 max-w-[90vw] bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-2 z-50 text-stone-200 divide-y divide-stone-800">
                  {/* Candidates */}
                  <div className="pb-1.5">
                    <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Candidates
                    </span>
                    {candidateUsers.map((u) => {
                      const isSelected = currentUser?.uid === u.uid;
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => {
                            onSwitchUser(u.uid);
                            setIsSwitcherOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white font-semibold'
                              : 'hover:bg-stone-800 text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{u.displayName}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Employers */}
                  <div className="py-1.5">
                    <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Employers
                    </span>
                    {employerUsers.map((u) => {
                      const isSelected = currentUser?.uid === u.uid;
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => {
                            onSwitchUser(u.uid);
                            setIsSwitcherOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'hover:bg-stone-800 text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{u.displayName}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Admins */}
                  <div className="pt-1.5">
                    <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Admins & Assessors
                    </span>
                    {adminUsers.map((u) => {
                      const isSelected = currentUser?.uid === u.uid;
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => {
                            onSwitchUser(u.uid);
                            setIsSwitcherOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-semibold'
                              : 'hover:bg-stone-800 text-stone-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{u.displayName}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-stone-400 font-medium">Skills → Proof → Work</span>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            {/* Viewport simulator: demo-only. Real devices use the responsive layout. */}
            {isDemo && (
              <div className="hidden sm:flex items-center gap-0.5 bg-stone-800 p-0.5 rounded border border-stone-700">
                <button
                  type="button"
                  onClick={() => onSetViewportMode('desktop')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewportMode === 'desktop'
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Desktop View (1440px wide)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSetViewportMode('tablet')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewportMode === 'tablet'
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Tablet View (768px wide)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSetViewportMode('mobile')}
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewportMode === 'mobile'
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Mobile Android/iPhone Phone View (390px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Sync Status Indicator */}
            <SyncIndicator
              syncStatus={syncStatus}
              pendingCount={pendingCount}
              isOnline={isOnline}
              onSyncNow={onSyncNow}
            />

            {/* Google Auth Sign In */}
            {onSignInGoogle && !currentUser && (
              <button
                type="button"
                onClick={onSignInGoogle}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-stone-800 text-stone-300 border border-stone-700 hover:text-white hover:bg-stone-700 transition-colors cursor-pointer"
                title="Authenticate with Google Account"
              >
                <LogIn className="w-3 h-3 text-amber-400" />
                <span className="hidden lg:inline">Google Auth</span>
              </button>
            )}

            {/* Sign Out Button */}
            {onSignOutGoogle && currentUser && (
              <button
                type="button"
                onClick={onSignOutGoogle}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-stone-800 text-stone-300 border border-stone-700 hover:text-rose-400 hover:border-rose-900/60 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Sign out of Ready2Work"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>Sign Out</span>
              </button>
            )}

            {/* Feedback Button (Section 31.2) */}
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-600/50 hover:bg-amber-500/30 transition-colors cursor-pointer"
              title="Tell us what you think (Section 31.2)"
            >
              <MessageSquare className="w-3 h-3 text-amber-400" />
              <span>Feedback</span>
            </button>

            {/* Low Data Mode Toggle */}
            <button
              type="button"
              onClick={onToggleLowData}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                lowDataMode
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-medium'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
              title="Toggle Low-Data Mode (reduces non-essential content)"
            >
              {lowDataMode ? <WifiOff className="w-3 h-3 text-emerald-400" /> : <Wifi className="w-3 h-3" />}
              <span>{lowDataMode ? 'Low-Data: ON' : 'Low-Data Mode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Brand & Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-900 text-amber-500 flex items-center justify-center shadow-xs">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-stone-950">BASA</span>
              <span className="text-amber-800 text-xs font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                Ready2Work
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Bridge to Actual Skills & Access · South Africa</p>
          </div>
        </div>

        {/* Dynamic Role Navigation Tabs */}
        <nav aria-label="Main Navigation" className="flex flex-wrap items-center gap-1 sm:gap-2">
          {currentTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer rounded-md ${
                  isActive
                    ? 'text-stone-950 bg-stone-100 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 ml-1 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 text-sm font-medium"
              title="Notifications & Updates"
              aria-label={`Notifications ${unreadNotificationCount ? `(${unreadNotificationCount} unread)` : ''}`}
            >
              <Bell className="w-4 h-4 text-stone-700" />
              <span className="hidden md:inline text-xs font-medium">Alerts</span>
              {unreadNotificationCount !== undefined && unreadNotificationCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-emerald-600 rounded-full">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        currentUser={currentUser}
        onSubmitFeedback={onSubmitFeedback}
      />
    </header>
  );
};
