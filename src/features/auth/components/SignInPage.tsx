import React, { useState } from 'react';
import {
  Flame,
  Shield,
  Building2,
  User,
  ArrowRight,
  Lock,
  AlertCircle,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Smartphone,
  Globe,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { User as UserType } from '../../../domain/types';
import { ThemeToggle } from '../../../shared/components/ThemeToggle';
import type { ColorTheme } from '../../../app/useColorTheme';
import { DEMO_PERSONA_DESCRIPTIONS } from '../../../config/strings';

interface Props {
  onSignInWithGoogle: () => Promise<any>;
  onSignInWithEmail?: (email: string, pass: string, isSignUp?: boolean, displayName?: string) => Promise<any>;
  onSignInWithApple?: () => Promise<any>;
  onSendPhoneOtp?: (phoneNumber: string) => Promise<boolean>;
  onVerifyPhoneOtp?: (code: string) => Promise<any>;
  onSelectDemoUser: (uid: string) => void;
  demoUsers: UserType[];
  theme: ColorTheme;
  onToggleTheme: () => void;
  mode?: 'demo' | 'real';
  onBackToStart?: () => void;
}

export const SignInPage: React.FC<Props> = ({
  onSignInWithGoogle,
  onSignInWithEmail,
  onSignInWithApple,
  onSendPhoneOtp,
  onVerifyPhoneOtp,
  onSelectDemoUser,
  demoUsers,
  theme,
  onToggleTheme,
  mode = 'real',
  onBackToStart,
}) => {
  const [authMethod, setAuthMethod] = useState<'quick' | 'email' | 'phone'>('quick');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Email state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  const resetErrors = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const handleGoogleClick = async () => {
    setIsLoading(true);
    resetErrors();
    try {
      await onSignInWithGoogle();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMessage(err.message || 'Google sign-in was cancelled. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleClick = async () => {
    if (!onSignInWithApple) return;
    setIsLoading(true);
    resetErrors();
    try {
      await onSignInWithApple();
    } catch (err: any) {
      console.warn('Apple sign-in error:', err);
      setErrorMessage(err.message || 'Apple sign-in was cancelled. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSignInWithEmail) return;
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMessage('Please enter your full name to create an account.');
      return;
    }

    setIsLoading(true);
    resetErrors();
    try {
      await onSignInWithEmail(email.trim(), password, isSignUp, fullName.trim());
    } catch (err: any) {
      console.warn('Email auth error:', err);
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists. Try signing in instead.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMessage('Incorrect password or email. Please check and try again.');
      } else if (code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email. Click "Create an account" below.');
      } else if (code === 'auth/weak-password') {
        setErrorMessage('Password must be at least 6 characters long.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSendPhoneOtp) return;

    const cleaned = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleaned) {
      setErrorMessage('Please enter your phone number.');
      return;
    }

    setIsLoading(true);
    resetErrors();
    try {
      const ok = await onSendPhoneOtp(cleaned);
      if (ok) {
        setPhoneOtpSent(true);
        setInfoMessage('SMS code sent! Enter the 6-digit code below.');
      } else {
        setErrorMessage('Failed to send SMS code. Please verify the phone number.');
      }
    } catch (err: any) {
      console.warn('Phone OTP error:', err);
      setErrorMessage(err.message || 'Could not send verification SMS. Try email or Google instead.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onVerifyPhoneOtp) return;
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit SMS code.');
      return;
    }

    setIsLoading(true);
    resetErrors();
    try {
      await onVerifyPhoneOtp(otpCode);
    } catch (err: any) {
      console.warn('Phone OTP verify error:', err);
      setErrorMessage(err.message || 'Invalid SMS verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= DEMO MODE QUICK ACCESS VIEW =================
  if (mode === 'demo') {
    const candidateUsers = demoUsers.filter((u) => u.role === 'candidate');
    const employerUsers = demoUsers.filter((u) => u.role === 'employer');
    const adminUsers = demoUsers.filter((u) => u.role === 'admin');

    const renderPersonaCard = (u: UserType) => {
      let icon = <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      let badgeStyle = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';

      if (u.role === 'employer') {
        icon = <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
        badgeStyle = 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      } else if (u.role === 'admin') {
        icon = <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
        badgeStyle = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      }

      const description =
        DEMO_PERSONA_DESCRIPTIONS[u.uid] ||
        (u.role === 'candidate' ? 'Jobseeker with verified skills' : u.role === 'employer' ? 'Local business hiring manager' : 'Assessor workspace');

      return (
        <button
          key={u.uid}
          type="button"
          onClick={() => onSelectDemoUser(u.uid)}
          className="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md text-left transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-start gap-3.5 min-w-0 pr-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-bold text-sm text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {u.displayName}
                </h4>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                  {u.role}
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-snug line-clamp-2">
                {description}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-1 shrink-0 transition-all" />
        </button>
      );
    };

    return (
      <div className="min-h-screen bg-[#faf8f5] dark:bg-stone-950 flex flex-col justify-between text-stone-900 dark:text-stone-100 transition-colors">
        {/* Top Brand Bar */}
        <div className="bg-stone-900 text-white px-6 py-4 border-b border-stone-800 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white">BASA</span>
                  <span className="text-amber-400 font-bold text-xs bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                    Quick Access Demo
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">7 Sample Profiles · No Sign-Up Needed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
              {onBackToStart && (
                <button
                  type="button"
                  onClick={onBackToStart}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to start</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Demo Personas Picker */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
          <div className="max-w-3xl w-full bg-white dark:bg-stone-900/90 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Zero-Setup Sandbox</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
                Choose a Demo Profile
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                Click any profile below to immediately launch that persona. You can switch personas at any time from inside the app.
              </p>
            </div>

            <div className="space-y-6">
              {/* Group 1: Candidates */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Candidates (Job Seekers)</span>
                </h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {candidateUsers.map(renderPersonaCard)}
                </div>
              </div>

              {/* Group 2: Employers */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Employers (Hiring Managers)</span>
                </h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {employerUsers.map(renderPersonaCard)}
                </div>
              </div>

              {/* Group 3: Admins */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admins & Assessors (Verification & Moderation)</span>
                </h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {adminUsers.map(renderPersonaCard)}
                </div>
              </div>
            </div>

            {onBackToStart && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onBackToStart}
                  className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Return to start screen</span>
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Footer info */}
        <footer className="bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 py-4 px-6 text-center text-xs text-stone-500">
          <p>BASA: Ready2Work · Quick Access Demo Sandbox · All data stays in your browser</p>
        </footer>
      </div>
    );
  }

  // ================= REAL MODE AUTH VIEW =================
  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-stone-950 flex flex-col justify-between text-stone-900 dark:text-stone-100 transition-colors">
      {/* Invisible Recaptcha Container for Phone SMS Auth */}
      <div id="recaptcha-container" />

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
              <p className="text-[11px] text-stone-400">Skills → Proof → Work · South Africa</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-400">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            {onBackToStart && (
              <button
                type="button"
                onClick={onBackToStart}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition-colors cursor-pointer"
                title="Return to mode selection"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to start</span>
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>POPIA Protected Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sign-In Card Container */}
      <div className="flex-1 flex items-center justify-center p-4 my-6">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden space-y-5 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 mb-1">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
              {isSignUp ? 'Create a Real Account' : 'Sign in to BASA'}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
              Access your verified Skill Passport, apply to opportunities, or recruit local talent.
            </p>
          </div>

          {/* Cross-Platform Device Support Badge */}
          <div className="bg-stone-50 dark:bg-stone-800/60 rounded-lg p-2 border border-stone-200 dark:border-stone-700 text-[11px] text-stone-600 dark:text-stone-300 flex items-center justify-center gap-1.5 text-center">
            <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Universal Access · Android · iOS / iPhone · Web</span>
          </div>

          {/* Authentication Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('quick');
                resetErrors();
              }}
              className={`py-2 px-2 rounded-lg cursor-pointer transition-all ${
                authMethod === 'quick'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              1-Tap Social
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                resetErrors();
              }}
              className={`py-2 px-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 ${
                authMethod === 'email'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                resetErrors();
              }}
              className={`py-2 px-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 ${
                authMethod === 'phone'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>SMS Phone</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Info Message */}
          {infoMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">{infoMessage}</div>
            </div>
          )}

          {/* TAB 1: 1-Tap Social Auth */}
          {authMethod === 'quick' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 font-semibold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
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
                <span>Continue with Google</span>
              </button>

              {onSignInWithApple && (
                <button
                  type="button"
                  onClick={handleAppleClick}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-stone-900 text-white font-semibold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.65-7.74-11.86-14.11-6.19-9.35-11.05-20.08-14.58-32.2-3.53-12.11-5.3-23.75-5.3-34.92 0-14.77 3.75-27.18 11.26-37.23 7.51-10.05 16.92-15.19 28.23-15.42 5.11 0 10.84 1.34 17.2 4.02 6.36 2.68 10.14 4.08 11.34 4.19 1.7 0 5.86-1.57 12.48-4.7 6.62-3.13 12.56-4.47 17.82-4.02 13.7.67 24.62 5.75 32.76 15.24-11.97 7.26-17.84 17.1-17.62 29.53.22 9.83 4.08 18.06 11.58 24.7 7.5 6.64 16.29 10.42 26.36 11.34-2.12 6.6-4.69 13.04-7.72 19.33zM119.22 31.05c0-7.26 2.62-14.19 7.86-20.78 5.24-6.59 11.83-10.27 19.77-11.05.22 1.12.33 2.12.33 3.02 0 7.37-2.67 14.41-8.02 21.12-5.35 6.71-12.04 10.39-20.07 11.05.11-1.12.13-2.24.13-3.36z" />
                  </svg>
                  <span>Sign in with Apple</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: Email & Password */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Your Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thabo Ndlovu"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg p-2.5 text-stone-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg pl-9 pr-3 py-2.5 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg pl-9 pr-10 py-2.5 text-stone-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Please wait...' : isSignUp ? 'Create Real Account' : 'Sign In with Email'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp((prev) => !prev);
                    resetErrors();
                  }}
                  className="text-xs text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in here'
                    : "Don't have an account yet? Create one"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Phone SMS OTP */}
          {authMethod === 'phone' && (
            <div className="space-y-3">
              {!phoneOtpSent ? (
                <form onSubmit={handlePhoneSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      South African Mobile Number
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        placeholder="+27 82 123 4567 or 0821234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full text-xs border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-lg pl-9 pr-3 py-2.5 text-stone-900 dark:text-white"
                      />
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      Standard SMS rates apply. Works across Vodacom, MTN, Telkom, Cell C.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Sending SMS...' : 'Send Verification SMS Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePhoneVerifyOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                      6-Digit SMS Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full border-2 border-amber-500 rounded-lg p-3 text-center text-lg font-mono tracking-widest bg-amber-50/20 dark:bg-amber-950/20 text-stone-900 dark:text-white font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code & Sign In'}
                  </button>
                </form>
              )}
            </div>
          )}

          {onBackToStart && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onBackToStart}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to start screen</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 py-4 px-6 text-center text-xs text-stone-500">
        <p>BASA: Ready2Work · Fair Opportunity & Verification Platform · South Africa</p>
      </div>
    </div>
  );
};
