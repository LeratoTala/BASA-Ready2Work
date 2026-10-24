import { env } from '../../config/env';
import React from 'react';
import {
  Flame,
  Wifi,
  WifiOff,
  PlayCircle,
  RotateCcw,
  Shield,
  Building2,
  User,
  LogIn,
  LogOut,
  Monitor,
  Smartphone,
  Tablet,
  Bell,
} from 'lucide-react';
import { Role, User as UserType } from '../../domain/types';
import { SyncIndicator } from './SyncIndicator';
import { SyncState } from '../../services/syncService';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

interface Props {
  currentUser: UserType | null;
  users: UserType[];
  onSwitchUser: (uid: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  lowDataMode: boolean;
  onToggleLowData: () => void;
  onOpenDemoTour: () => void;
  onResetDemoData: () => void;
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
}

export const Header: React.FC<Props> = ({
  currentUser,
  users,
  onSwitchUser,
  activeTab,
  onSelectTab,
  lowDataMode,
  onToggleLowData,
  onOpenDemoTour,
  onResetDemoData,
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
}) => {
  // Navigation tabs based on role per Section 4.4 - Each persona has their own dedicated profile page
  const candidateTabs = [
    { id: 'dashboard', label: 'Home' },
    { id: 'profile', label: 'My Profile' },
    { id: 'skills', label: 'Skills & Evidence' },
    { id: 'passport', label: 'Skill Passport' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'applications', label: 'My Applications' },
  ];

  const employerTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'profile', label: 'Company Profile' },
    { id: 'jobs', label: 'My Jobs' },
    { id: 'applicants', label: 'Applicants' },
  ];

  const adminTabs = [
    { id: 'overview', label: 'Pilot Overview' },
    { id: 'profile', label: 'Assessor Profile' },
    { id: 'assessments', label: 'Assessor Workspace' },
    { id: 'reports', label: 'Moderation Reports' },
  ];

  let currentTabs = candidateTabs;
  if (currentUser?.role === 'employer') currentTabs = employerTabs;
  if (currentUser?.role === 'admin') currentTabs = adminTabs;

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
      {/* Top Utility & Persona Switcher Bar */}
      <div className="bg-stone-900 text-stone-200 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Persona quick switch */}
          {env.enableDemoData ? (
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-medium hidden sm:inline">Active Persona:</span>
            <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded border border-stone-700">
              {users.map((u) => {
                const isSelected = currentUser ? u.uid === currentUser.uid : false;
                let roleIcon = <User className="w-3 h-3" />;
                if (u.role === 'employer') roleIcon = <Building2 className="w-3 h-3" />;
                if (u.role === 'admin') roleIcon = <Shield className="w-3 h-3" />;

                return (
                  <button
                    key={u.uid}
                    onClick={() => onSwitchUser(u.uid)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white font-medium shadow-xs'
                        : 'text-stone-300 hover:text-white hover:bg-stone-700'
                    }`}
                  >
                    {roleIcon}
                    <span>{u.displayName.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-75 capitalize hidden md:inline">({u.role})</span>
                  </button>
                );
              })}
            </div>
          </div>
          ) : (
            <span className="text-stone-400 font-medium">Skills → Evidence → Work</span>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Viewport simulator: demo-only. Real devices use the responsive layout. */}
            {env.enableDemoData && (
            <div className="hidden sm:flex items-center gap-0.5 bg-stone-800 p-0.5 rounded border border-stone-700">
              <button
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
                onClick={onSignOutGoogle}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-stone-800 text-stone-300 border border-stone-700 hover:text-rose-400 hover:border-rose-900/60 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Sign out of Ready2Work"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>Sign Out</span>
              </button>
            )}

            {/* Low Data Mode Toggle */}
            <button
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

            {env.enableDemoData && (
              <>
            {/* 5-Min Demo Script Tour */}
            <button
              onClick={onOpenDemoTour}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>5-Min Demo Guide</span>
            </button>

            {/* Reset Seed Data */}
            <button
              onClick={onResetDemoData}
              className="flex items-center gap-1 text-stone-400 hover:text-stone-200 transition-colors p-1"
              title="Reset sample candidates, jobs, and evaluations to initial demo state"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
              </>
            )}
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
              <span className="font-extrabold text-lg tracking-tight text-stone-950">BASA</span>
              <span className="text-amber-700 font-bold text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Ready2Work
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              Skills → Evidence → Work · South Africa
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {currentTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
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
    </header>
  );
};
