import React from 'react';
import {
  Flame,
  Shield,
  ArrowRight,
  PlayCircle,
  LogIn,
  Users,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { START_SCREEN_STRINGS } from '../../config/strings';
import { ThemeToggle } from '../../shared/components/ThemeToggle';
import type { ColorTheme } from '../../app/useColorTheme';

interface Props {
  onSelectMode: (mode: 'demo' | 'real') => void;
  isFirebaseConfigured: boolean;
  theme: ColorTheme;
  onToggleTheme: () => void;
}

export const StartScreen: React.FC<Props> = ({
  onSelectMode,
  isFirebaseConfigured,
  theme,
  onToggleTheme,
}) => {
  return (
    <div
      className={`min-h-screen flex flex-col justify-between font-sans transition-colors ${
        theme === 'dark' ? 'bg-stone-950 text-stone-100' : 'bg-[#faf8f5] text-stone-900'
      }`}
    >
      {/* Top Navbar */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xs sticky top-0 z-30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-500 flex items-center justify-center shadow-xs">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-stone-900 dark:text-white">
                BASA
              </span>
              <span className="ml-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-1.5 py-0.5 rounded">
                Ready2Work
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>POPIA Protected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero & Choice Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-4xl w-full mx-auto space-y-8">
          {/* Hero Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>South Africa Skills-First Platform</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              {START_SCREEN_STRINGS.title}
            </h1>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto font-medium">
              {START_SCREEN_STRINGS.tagline}
            </p>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
              {START_SCREEN_STRINGS.subTagline}
            </p>
          </div>

          {/* Dual Path Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Card 1: Real Accounts */}
            <div
              className={`relative rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all ${
                isFirebaseConfigured
                  ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-lg hover:shadow-xl hover:border-amber-500/60'
                  : 'bg-stone-100 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800/80 opacity-75'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                    Production Data
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                    {START_SCREEN_STRINGS.realCardTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {START_SCREEN_STRINGS.realCardDesc}
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Real Firebase Auth (Google, Email, Phone SMS)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Persistent cloud Firestore storage & live matching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Guided candidate & employer onboarding flow</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                {isFirebaseConfigured ? (
                  <button
                    type="button"
                    onClick={() => onSelectMode('real')}
                    className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer group"
                  >
                    <span>Enter Real Accounts</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-stone-300 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-semibold text-sm py-3 px-4 rounded-xl cursor-not-allowed"
                    >
                      <span>Real Accounts Unavailable</span>
                    </button>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5 justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{START_SCREEN_STRINGS.realCardDisabledNote}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Quick Access Demo */}
            <div className="relative rounded-2xl border border-amber-300 dark:border-amber-700/80 bg-gradient-to-br from-amber-50/60 via-white to-stone-50 dark:from-amber-950/20 dark:via-stone-900 dark:to-stone-900 p-6 sm:p-7 flex flex-col justify-between shadow-lg hover:shadow-xl hover:border-amber-500 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                    {START_SCREEN_STRINGS.demoCardBadge}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                      {START_SCREEN_STRINGS.demoCardTitle}
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                    {START_SCREEN_STRINGS.demoCardTag}
                  </p>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {START_SCREEN_STRINGS.demoCardDesc}
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400 pt-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>7 fixed personas: 2 candidates, 3 employers, 2 assessors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Instant persona switcher inside the app (no sign-out)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Isolated browser storage (localStorage) + 1-click Reset</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => onSelectMode('demo')}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer group"
                >
                  <Users className="w-4 h-4" />
                  <span>Launch Quick Access Demo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-4 px-6 text-center text-xs text-stone-500 dark:text-stone-400">
        <p>{START_SCREEN_STRINGS.footerText}</p>
      </footer>
    </div>
  );
};
