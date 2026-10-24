import React, { useState } from 'react';
import {
  Flame,
  Shield,
  Building2,
  User,
  ArrowRight,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { User as UserType } from '../../../domain/types';

interface Props {
  onSignInWithGoogle: () => Promise<any>;
  onSelectDemoUser: (uid: string) => void;
  demoUsers: UserType[];
}

export const SignInPage: React.FC<Props> = ({
  onSignInWithGoogle,
  onSelectDemoUser,
  demoUsers,
}) => {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    setIsLoadingGoogle(true);
    setErrorMessage(null);
    try {
      await onSignInWithGoogle();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMessage(
        err.message || 'Google sign-in was cancelled or the pop-up was blocked. Please try again.'
      );
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between text-stone-900">
      {/* Top Brand Bar */}
      <div className="bg-stone-900 text-white px-6 py-4 border-b border-stone-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">BASA</span>
                <span className="text-amber-400 font-bold text-xs bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                  Ready2Work
                </span>
              </div>
              <p className="text-[11px] text-stone-400">Skills → Evidence → Work · South Africa</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>POPIA Protected Portal</span>
          </div>
        </div>
      </div>

      {/* Main Sign-In Card Container */}
      <div className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden space-y-6 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mb-2">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Sign in to BASA
            </h1>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Please sign in to access your Skill Passport, opportunities, and verified applicant dossiers.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Google Auth Sign In */}
          <button
            onClick={handleGoogleClick}
            disabled={isLoadingGoogle}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 font-semibold text-xs text-stone-800 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoadingGoogle ? 'Signing in with Google...' : 'Continue with Google Account'}</span>
          </button>

          <p className="text-center text-xs text-stone-500">
            New to BASA? Continue with Google, then choose whether you are looking for work or offering work.
          </p>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200" />
            <span className="flex-shrink mx-3 text-stone-400 text-[11px] uppercase tracking-wider">
              Or quick demo sign-in
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          {/* 1-Click Role-Based Demo Sign In */}
          {demoUsers.length > 0 && (
            <div className="space-y-2">
              <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Select a verified persona to test:
              </span>

              {demoUsers.map((u) => {
                let badgeStyle = 'bg-stone-100 text-stone-800';
                let icon = <User className="w-4 h-4 text-amber-600" />;
                let roleDesc = 'Jobseeker in Soweto · Barista & Solar Assistant';

                if (u.role === 'employer') {
                  badgeStyle = 'bg-blue-50 text-blue-900 border-blue-200';
                  icon = <Building2 className="w-4 h-4 text-blue-600" />;
                  roleDesc = 'Specialty Coffee Roastery & Hiring Manager';
                } else if (u.role === 'admin') {
                  badgeStyle = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                  icon = <Shield className="w-4 h-4 text-emerald-600" />;
                  roleDesc = 'Assessor and moderation workspace';
                }

                return (
                  <button
                    key={u.uid}
                    onClick={() => onSelectDemoUser(u.uid)}
                    className="w-full p-3 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-stone-50/80 text-left transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-stone-900 group-hover:text-amber-800">
                            {u.displayName}
                          </h4>
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">{roleDesc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}

            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-stone-100 border-t border-stone-200 py-4 px-6 text-center text-xs text-stone-500">
        <p>BASA: Ready2Work · Fair Opportunity & Verification Platform · South Africa</p>
      </div>
    </div>
  );
};
