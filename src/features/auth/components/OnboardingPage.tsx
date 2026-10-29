import React, { useState } from 'react';
import { Building2, User } from 'lucide-react';
import type { Role } from '../../../domain/types';
import { ThemeToggle } from '../../../shared/components/ThemeToggle';
import type { ColorTheme } from '../../../app/useColorTheme';

interface Props {
  displayName: string;
  email: string;
  minimumAge: number;
  onComplete: (displayName: string, email: string, role: Role, minimumAgeConfirmed: boolean) => Promise<unknown> | unknown;
  onSignOut: () => void;
  theme: ColorTheme;
  onToggleTheme: () => void;
}

type SelfAssignableRole = Exclude<Role, 'admin'>;

const OPTIONS: { role: SelfAssignableRole; title: string; description: string; icon: React.ReactNode }[] = [
  { role: 'candidate', title: 'I am looking for work', description: 'Build a Skill Passport, find matches and apply.', icon: <User className="w-5 h-5" /> },
  { role: 'employer', title: 'I am offering work', description: 'Post opportunities and review applicants with verified proof.', icon: <Building2 className="w-5 h-5" /> },
];

function mapRegistrationError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? '');
  const lower = message.toLowerCase();

  if (lower.includes('offline') || lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network error')) {
    return 'Unable to connect to BASA. Please check your internet connection.';
  }
  if (lower.includes('unreachable') || lower.includes('html') || lower.includes('404') || lower.includes('syntaxerror') || lower.includes('cannot reach server')) {
    return 'The BASA registration service is currently unreachable. Please try again shortly.';
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('session') || lower.includes('sign in') || lower.includes('token') || lower.includes('authentication required')) {
    return 'Your sign-in session has expired. Please sign out and sign in again.';
  }
  if (lower.includes('age') || lower.includes('18')) {
    return 'Please confirm you meet the minimum age requirement to proceed.';
  }
  if (lower.includes('display name') || lower.includes('name')) {
    return 'Please enter your name or business name.';
  }
  return message || 'Account registration could not be completed. Please try again.';
}

/** Shown once, after first sign-in, so a person can choose how they will use BASA. */
export const OnboardingPage: React.FC<Props> = ({
  displayName,
  email,
  minimumAge,
  onComplete,
  onSignOut,
  theme,
  onToggleTheme,
}) => {
  const [name, setName] = useState(displayName);
  const [role, setRole] = useState<SelfAssignableRole>('candidate');
  const [minimumAgeConfirmed, setMinimumAgeConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your name or business name.');
      return;
    }
    if (!minimumAgeConfirmed) {
      setErrorMessage(`Please confirm you are at least ${minimumAge} years old to proceed.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await onComplete(trimmed, email, role, minimumAgeConfirmed);
    } catch (err) {
      console.error('Registration failed:', err);
      setErrorMessage(mapRegistrationError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Welcome to BASA</h1>
          <p className="text-sm text-stone-500">Signed in as {email || 'your account'}. Tell us how you will use BASA.</p>
        </div>

        <label className="block text-sm">
          <span className="font-semibold text-stone-700">Your name or business name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            required
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-stone-100 disabled:text-stone-400"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-stone-700 mb-1">I want to</legend>
          {OPTIONS.map((option) => (
            <label
              key={option.role}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                role === option.role ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:bg-stone-50'
              } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="role"
                className="mt-1"
                checked={role === option.role}
                onChange={() => setRole(option.role)}
                disabled={isLoading}
              />
              <span className="text-stone-600">{option.icon}</span>
              <span>
                <span className="block text-sm font-semibold text-stone-900">{option.title}</span>
                <span className="block text-xs text-stone-500">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <label className={`flex items-start gap-2 text-xs text-stone-700 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
          <input
            type="checkbox"
            required
            checked={minimumAgeConfirmed}
            onChange={(event) => setMinimumAgeConfirmed(event.target.checked)}
            disabled={isLoading}
            className="mt-0.5"
          />
          <span>I confirm I am at least {minimumAge} years old. BASA stores this confirmation only, not my date of birth.</span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
            isLoading
              ? 'bg-stone-400 cursor-not-allowed'
              : 'bg-stone-900 hover:bg-stone-800'
          }`}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <span>Setting up your account…</span>
            </>
          ) : (
            'Continue'
          )}
        </button>

        {errorMessage && (
          <div
            className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex flex-col gap-1.5"
            role="alert"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isLoading}
              className="self-start font-semibold text-red-800 underline hover:no-underline disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}

        <button type="button" onClick={onSignOut} disabled={isLoading} className="w-full text-xs text-stone-500 hover:underline disabled:opacity-50">
          Sign out
        </button>
      </form>
    </main>
  );
};
