import { env } from '../../../config/env';
import { APP } from '../../../config/app';
import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, Check, Loader2, FileText, ArrowRight } from 'lucide-react';
import { CandidateProfile, SkillClaim } from '../../../domain/types';
import { getFirebase } from '../../../services/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateProfile;
  claims: SkillClaim[];
  onApplyDraft: (headline: string, summary: string) => void;
}

export const AICVDrafterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  candidate,
  claims,
  onApplyDraft,
}) => {
  const [experienceNotes, setExperienceNotes] = useState(
    'Assisted community electrical contractor with roof solar mounts and cable runs. Ran manual espresso machine and milk texturing at church and street pop-up events. Managed daily cash floats.'
  );
  const [headline, setHeadline] = useState(candidate.headline);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [suggestedHeadline, setSuggestedHeadline] = useState<string>('');
  const [successSaved, setSuccessSaved] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessSaved(false);

    try {
      // Attach the Firebase ID token so the server can verify the caller.
      let idToken = '';
      if (!env.enableDemoData) {
        try {
          const { auth } = getFirebase();
          idToken = (await auth.currentUser?.getIdToken()) ?? '';
        } catch {
          // If token fetch fails, proceed without a token — server returns 401 for non-demo mode.
        }
      }

      const response = await fetch(`${env.apiBaseUrl}/api/cv-draft`, {
        signal: AbortSignal.timeout(APP.apiTimeoutMs),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          skills: claims.map((c) => `${c.skillName} (${c.verificationStatus})`),
          experienceNotes: experienceNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate CV summary.');
      }

      setGeneratedDraft(data.draft);
      if (!suggestedHeadline) {
        setSuggestedHeadline(headline || `${claims[0]?.skillName || 'Skilled'} Assistant`);
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with drafting assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProfile = () => {
    if (!generatedDraft) return;
    onApplyDraft(suggestedHeadline || headline, generatedDraft);
    setSuccessSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">BASA AI CV Drafting Assistant</h3>
              <p className="text-xs text-stone-400">
                Turns informal tasks into credible professional wording (FR-14)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anti-Hallucination & POPIA Safeguard Notice (T-10 Acceptance Criteria) */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Strict Fact-Checking Guardrail (Test Case T-10):</strong> The model is constrained to ONLY use the facts and skills you provide below. It will never invent unearned university degrees or imaginary corporate titles.
          </div>
        </div>

        <p className="px-6 py-2 text-xs text-stone-600 bg-stone-50 border-b border-stone-200">
          Only your skill claims and experience notes are sent for drafting. Leave out names, contact details and ID numbers.
        </p>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Your Primary Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Skilled Barista & Junior Solar PV Assistant"
              className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Currently Claimed Skills from Passport
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs">
              {claims.length > 0 ? (
                claims.map((c) => (
                  <span
                    key={c.id}
                    className="bg-white border border-stone-300 text-stone-800 px-2 py-0.5 rounded"
                  >
                    {c.skillName} ({c.verificationStatus})
                  </span>
                ))
              ) : (
                <span className="text-stone-500 italic">No skills claimed yet. Add skills in the skills tab.</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Describe Your Informal Experience & Tasks Done
            </label>
            <p className="text-xs text-stone-500 mb-1.5">
              Mention any informal work, volunteering, spaza duties, repairs, or pop-up stalls.
            </p>
            <textarea
              rows={4}
              value={experienceNotes}
              onChange={(e) => setExperienceNotes(e.target.value)}
              placeholder="e.g. Worked at Kasi coffee cart on Saturdays, helped install 6 solar battery backup systems with local electrician..."
              className="w-full text-sm border border-stone-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <div className="pt-1">
            <button
              onClick={handleGenerate}
              disabled={loading || !experienceNotes.trim()}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing verified wording with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Draft Professional CV Summary</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Preview with editable control */}
          {generatedDraft && (
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Fact-Constrained Draft Ready
                </span>
                <span className="text-xs text-stone-500">You can edit the text directly below</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Suggested Professional Headline
                </label>
                <input
                  type="text"
                  value={suggestedHeadline}
                  onChange={(e) => setSuggestedHeadline(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Editable Experience Summary
                </label>
                <textarea
                  rows={5}
                  value={generatedDraft}
                  onChange={(e) => setGeneratedDraft(e.target.value)}
                  className="w-full text-sm font-sans border border-stone-300 rounded-lg p-3 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {successSaved ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated successfully! Closing...</span>
                </div>
              ) : (
                <button
                  onClick={handleSaveToProfile}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Save to My Candidate Profile</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>Candidate reviews & approves before saving (T-10)</span>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-900 font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
