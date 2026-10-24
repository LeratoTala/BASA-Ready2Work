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
} from 'lucide-react';
import { User as UserType } from '../../../domain/types';

interface Props {
  onSignInWithGoogle: () => Promise<any>;
  onSignInWithEmail?: (email: string, pass: string, isSignUp?: boolean, displayName?: string) => Promise<any>;
  onSignInWithApple?: () => Promise<any>;
  onSendPhoneOtp?: (phoneNumber: string) => Promise<boolean>;
  onVerifyPhoneOtp?: (code: string) => Promise<any>;
  onSelectDemoUser: (uid: string) => void;
  demoUsers: UserType[];
}

export const SignInPage: React.FC<Props> = ({
  onSignInWithGoogle,
  onSignInWithEmail,
  onSignInWithApple,
  onSendPhoneOtp,
  onVerifyPhoneOtp,
  onSelectDemoUser,
  demoUsers,
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
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    resetErrors();
    try {
      await onSignInWithEmail(email, password, isSignUp, fullName);
    } catch (err: any) {
      console.warn('Email auth error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSendPhoneOtp) return;
    const clean = phoneNumber.trim().replace(/\s+/g, '');
    if (!clean || clean.length < 9) {
      setErrorMessage('Please enter a valid South African cell number (e.g. 082 123 4567).');
      return;
    }

    setIsLoading(true);
    resetErrors();
    try {
      await onSendPhoneOtp(phoneNumber);
      setPhoneOtpSent(true);
      setInfoMessage(`Verification code sent via SMS to ${phoneNumber}.`);
    } catch (err: any) {
      console.warn('Phone OTP send error:', err);
      setErrorMessage(err.message || 'Could not send SMS code. Please check your number format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between text-stone-900">
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
              <p className="text-[11px] text-stone-400">Skills → Evidence → Work · South Africa</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">POPIA Protected Portal</span>
          </div>
        </div>
      </div>

      {/* Main Sign-In Card Container */}
      <div className="flex-1 flex items-center justify-center p-4 my-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden space-y-5 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mb-1">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Sign in to BASA
            </h1>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Access your Skill Passport, opportunities, and verified applicant dossiers.
            </p>
          </div>

          {/* Cross-Platform Device Support Badge */}
          <div className="bg-stone-50 rounded-lg p-2 border border-stone-200 text-[11px] text-stone-600 flex items-center justify-center gap-1.5 text-center">
            <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Universal Access · Android · iOS / iPhone · Windows · Mac · Linux</span>
          </div>

          {/* Authentication Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('quick');
                resetErrors();
              }}
              className={`py-2 px-2 rounded-lg cursor-pointer transition-all ${
                authMethod === 'quick'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
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
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
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
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Cell Phone</span>
            </button>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* ================= METHOD 1: 1-TAP SOCIAL (GOOGLE & APPLE) ================= */}
          {authMethod === 'quick' && (
            <div className="space-y-3">
              {/* Google Auth Button */}
              <button
                onClick={handleGoogleClick}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 font-semibold text-xs text-stone-800 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>

              {/* Apple Auth Button (Works on iOS, macOS, Windows, Android) */}
              <button
                onClick={handleAppleClick}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-black hover:bg-stone-900 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.71-13.98-5.87-8.91-10.45-19.12-13.74-29.61-3.29-10.49-4.94-20.73-4.94-30.72 0-14.37 3.66-26.23 10.99-35.58 7.33-9.35 16.48-14.15 27.46-14.39 4.35 0 9.29 1.19 14.81 3.56 5.53 2.37 9.29 3.66 11.28 3.89 2.45-.48 6.25-1.89 11.41-4.22 5.16-2.33 9.77-3.39 13.83-3.18 10.48.5 19.33 4.54 26.54 12.13-8.8 5.34-13.08 12.7-12.83 22.09.25 7.42 3.03 13.67 8.35 18.75 5.32 5.08 11.71 8.04 19.17 8.89-1.99 6.06-4.45 12.33-7.39 18.8zM119.22 33.15c0-6.9 2.43-13.34 7.29-19.33 4.86-5.99 10.93-9.87 18.22-11.64.49 2.22.74 4.39.74 6.52 0 6.64-2.52 13.06-7.56 19.26-5.04 6.2-11.19 10.15-18.45 11.85-.08-2.22-.24-4.44-.24-6.66z" />
                </svg>
                <span>{isLoading ? 'Connecting...' : 'Continue with Apple'}</span>
              </button>

              <p className="text-center text-[11px] text-stone-500 pt-1">
                Recommended for Android and iPhone. Instant sign-in without passwords.
              </p>
            </div>
          )}

          {/* ================= METHOD 2: EMAIL & PASSWORD ================= */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="font-bold text-stone-800">
                  {isSignUp ? 'Create New Account' : 'Sign In with Email'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    resetErrors();
                  }}
                  className="text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer"
                >
                  {isSignUp ? 'Already registered? Sign in' : 'Need an account? Sign up'}
                </button>
              </div>

              {isSignUp && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sipho Khumalo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-stone-300 rounded-lg p-2.5 text-xs bg-white text-stone-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-stone-300 rounded-lg pl-9 p-2.5 text-xs bg-white text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-stone-300 rounded-lg pl-9 pr-9 p-2.5 text-xs bg-white text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Processing...' : isSignUp ? 'Create Free Account' : 'Sign In with Email'}
              </button>
            </form>
          )}

          {/* ================= METHOD 3: CELL PHONE SMS OTP ================= */}
          {authMethod === 'phone' && (
            <div className="space-y-3 text-xs">
              {!phoneOtpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      South African Cell Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 082 123 4567 or +27 82 123 4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full border border-stone-300 rounded-lg pl-9 p-2.5 text-xs bg-white text-stone-900"
                      />
                    </div>
                    <span className="block text-[11px] text-stone-500 mt-1">
                      Works with Vodacom, MTN, Telkom, and Cell C. We send an SMS with a 6-digit code.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Sending SMS...' : 'Send SMS Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-stone-700">Enter 6-Digit SMS Code</label>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneOtpSent(false);
                          resetErrors();
                        }}
                        className="text-amber-700 hover:underline text-[11px]"
                      >
                        Change Number
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full border-2 border-amber-500 rounded-lg p-3 text-center text-lg font-mono tracking-widest bg-amber-50/20 text-stone-900 font-bold"
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

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-stone-200" />
            <span className="flex-shrink mx-3 text-stone-400 text-[11px] uppercase tracking-wider">
              Or quick test persona
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          {/* 1-Click Role-Based Demo Sign In (Pitch & Testing) */}
          {demoUsers.length > 0 && (
            <div className="space-y-2">
              <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Select a verified persona to test:
              </span>

              {demoUsers.map((u) => {
                let icon = <User className="w-4 h-4 text-amber-600" />;
                let roleDesc = 'Jobseeker in Soweto · Barista & Solar Assistant';

                if (u.role === 'employer') {
                  icon = <Building2 className="w-4 h-4 text-blue-600" />;
                  roleDesc = 'Specialty Coffee Roastery & Hiring Manager';
                } else if (u.role === 'admin') {
                  icon = <Shield className="w-4 h-4 text-emerald-600" />;
                  roleDesc = 'Assessor and moderation workspace';
                }

                return (
                  <button
                    key={u.uid}
                    onClick={() => onSelectDemoUser(u.uid)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-stone-50/80 text-left transition-all flex items-center justify-between cursor-pointer group"
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
