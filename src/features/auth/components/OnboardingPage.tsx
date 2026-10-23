import React, { useState } from 'react';
import { Building2, User } from 'lucide-react';
import type { Role } from '../../../domain/types';

interface Props {
  displayName: string;
  email: string;
  onComplete: (displayName: string, email: string, role: Role) => void;
  onSignOut: () => void;
}

type SelfAssignableRole = Exclude<Role, 'admin'>;

const OPTIONS: { role: SelfAssignableRole; title: string; description: string; icon: React.ReactNode }[] = [
  { role: 'candidate', title: 'I am looking for work', description: 'Build a Skill Passport, find matches and apply.', icon: <User className="w-5 h-5" /> },
  { role: 'employer', title: 'I am offering work', description: 'Post opportunities and review applicants with evidence.', icon: <Building2 className="w-5 h-5" /> },
];

/** Shown once, after first sign-in, so a person can choose how they will use BASA. */
export const OnboardingPage: React.FC<Props> = ({ displayName, email, onComplete, onSignOut }) => {
  const [name, setName] = useState(displayName);
  const [role, setRole] = useState<SelfAssignableRole>('candidate');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onComplete(name.trim(), email, role);
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Welcome to BASA</h1>
          <p className="text-sm text-stone-500">Signed in as {email || 'your account'}. Tell us how you will use BASA.</p>
        </div>

        <label className="block text-sm">
          <span className="font-semibold text-stone-700">Your name or business name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-stone-700 mb-1">I want to</legend>
          {OPTIONS.map((option) => (
            <label
              key={option.role}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                role === option.role ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <input type="radio" name="role" className="mt-1" checked={role === option.role} onChange={() => setRole(option.role)} />
              <span className="text-stone-600">{option.icon}</span>
              <span>
                <span className="block text-sm font-semibold text-stone-900">{option.title}</span>
                <span className="block text-xs text-stone-500">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <button type="submit" className="w-full rounded-lg bg-stone-900 text-white py-2.5 text-sm font-semibold hover:bg-stone-800">
          Continue
        </button>
        <button type="button" onClick={onSignOut} className="w-full text-xs text-stone-500 hover:underline">
          Sign out
        </button>
      </form>
    </main>
  );
};
