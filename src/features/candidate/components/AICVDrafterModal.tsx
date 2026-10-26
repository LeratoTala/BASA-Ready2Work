import { env } from '../../../config/env';
import { APP } from '../../../config/app';
import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Check,
  Loader2,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { CandidateProfile, SkillClaim } from '../../../domain/types';
import { getFirebase } from '../../../services/firebase';
import { UI_STRINGS } from '../../../config/strings';
import {
  AI_CV_DISCLAIMER_TAG,
  TEMPLATE_DISCLAIMER_TAG,
  canSaveAiCvDraft,
  AiCvDraftLine,
} from '../../../domain/aiCvSafeguards';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

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
  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: 'ai-cv-drafter',
  });

  // 37.8 Privacy Opt-in Consent state
  const [hasConsented, setHasConsented] = useState(false);

  const [experienceNotes, setExperienceNotes] = useState(
    'Assisted community electrical contractor with roof solar mounts and cable runs. Ran manual espresso machine and milk texturing at church and street pop-up events. Managed daily cash floats.'
  );
  const [headline, setHeadline] = useState(candidate.headline);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Structured draft lines (37.3, 37.4, 37.5)
  const [draftLines, setDraftLines] = useState<AiCvDraftLine[]>([]);
  const [disclaimerTag, setDisclaimerTag] = useState<string>(AI_CV_DISCLAIMER_TAG);
  const [suggestedHeadline, setSuggestedHeadline] = useState<string>('');
  
  // 37.5 Human-in-the-loop truthfulness confirmation
  const [isTruthConfirmed, setIsTruthConfirmed] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessSaved(false);
    setIsTruthConfirmed(false);

    try {
      let idToken = '';
      if (!env.enableDemoData) {
        try {
          const { auth } = getFirebase();
          idToken = (await auth.currentUser?.getIdToken()) ?? '';
        } catch {
          // Fall back gracefully
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
          candidateName: candidate.fullName,
          skills: claims.map((c) => ({
            name: c.skillName,
            label: c.verificationStatus,
          })),
          experienceNotes: experienceNotes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate CV summary.');
      }

      // Check if structured lines returned
      if (Array.isArray(data.lines) && data.lines.length > 0) {
        setDraftLines(data.lines);
      } else if (data.draft) {
        // Fallback lines from raw text
        const rawLines = data.draft
          .split('\n')
          .filter((l: string) => l.trim().length > 0)
          .map((l: string) => ({
            line: l.replace(/^[-•*]\s*/, '').trim(),
            source_fields: ['evidence_0'],
          }));
        setDraftLines(rawLines);
      }

      setDisclaimerTag(data.disclaimerTag || AI_CV_DISCLAIMER_TAG);

      if (!suggestedHeadline) {
        setSuggestedHeadline(headline || `${claims[0]?.skillName || 'Skilled'} Assistant`);
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with drafting assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLine = (index: number, newText: string) => {
    setDraftLines((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, line: newText } : item))
    );
  };

  const handleDeleteLine = (index: number) => {
    setDraftLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveToProfile = () => {
    if (!canSaveAiCvDraft(isTruthConfirmed, draftLines)) return;

    const formattedSummary = draftLines.map((l) => `- ${l.line}`).join('\n');
    onApplyDraft(suggestedHeadline || headline, formattedSummary);
    setSuccessSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">BASA AI CV Drafting Assistant</h3>
              <p className="text-xs text-stone-400">
                Turns informal tasks into credible professional wording (Section 37 Safeguards)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 37.8 STEP 1: Privacy Opt-In Consent Screen */}
        {!hasConsented ? (
          <div className="p-6 space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>Plain-Language Privacy & AI Safeguards Consent</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Before using AI CV drafting, please review our strict privacy rules:
              </p>
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-3">
                <Lock className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 mb-0.5">What is sent:</strong>
                  Only the specific skills and task notes you enter. We NEVER send your SA ID number,
                  phone number, home address, or credential IDs.
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 mb-0.5">Strict Zero-Hallucination Rule:</strong>
                  The AI is strictly forbidden from inventing degrees, corporate titles, or exaggerating
                  experience. It may only reword the facts you provide.
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-3">
                <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-900 mb-0.5">No Public Model Training:</strong>
                  Your personal profile text is never sold or used to train public commercial AI models.
                  Requests are logged only as anonymous audit counters without content.
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                No Thanks, Keep Raw Facts
              </button>
              <button
                type="button"
                onClick={() => setHasConsented(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                <span>I Understand & Agree</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Fact Input & Drafting Form */
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Anti-Hallucination & POPIA Safeguard Notice */}
            <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Section 37 Safeguards Active:</strong> AI rewording only. Cannot invent qualifications or upgrade Self-reported skills to certified. You must confirm all facts before saving.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Source Facts */}
              <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                  1. Your Genuine Facts (Allow-List)
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Your Primary Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Skilled Barista & Junior Solar Assistant"
                    className="w-full text-xs border border-stone-300 rounded p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Passport Skills (Verification Tier Preserved)
                  </label>
                  <div className="flex flex-wrap gap-1 p-2 bg-white rounded border border-stone-200 text-xs">
                    {claims.length > 0 ? (
                      claims.map((c) => (
                        <span
                          key={c.id}
                          className="bg-stone-100 border border-stone-300 text-stone-800 px-2 py-0.5 rounded text-[11px]"
                        >
                          {c.skillName} <strong className="text-amber-800">({c.verificationStatus})</strong>
                        </span>
                      ))
                    ) : (
                      <span className="text-stone-400 italic text-[11px]">No skills claimed yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Informal Experience & Tasks Done
                  </label>
                  <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>{UI_STRINGS.freeTextPrivacyWarning}</span>
                  </div>
                  <textarea
                    rows={4}
                    value={experienceNotes}
                    onChange={(e) => setExperienceNotes(e.target.value)}
                    placeholder="Describe hands-on jobs, pop-up stalls, repairs..."
                    className="w-full text-xs border border-stone-300 rounded p-2 bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !experienceNotes.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-3 rounded shadow-xs cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking facts & drafting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Grounded Draft</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Draft Preview & Human-in-the-Loop Review */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                    2. Draft Review & Edit
                  </h4>
                  {draftLines.length > 0 && (
                    <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {disclaimerTag}
                    </span>
                  )}
                </div>

                {draftLines.length === 0 ? (
                  <div className="h-48 border border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center text-center p-4 text-stone-400 text-xs">
                    <Sparkles className="w-6 h-6 text-stone-300 mb-2" />
                    <span>Enter your task facts on the left and tap generate.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Professional Headline
                      </label>
                      <input
                        type="text"
                        value={suggestedHeadline}
                        onChange={(e) => setSuggestedHeadline(e.target.value)}
                        className="w-full text-xs border border-stone-300 rounded p-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[11px] font-semibold text-stone-600">
                        Drafted Fact Lines (Edit or delete any line):
                      </label>
                      {draftLines.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 group">
                          <textarea
                            rows={2}
                            value={item.line}
                            onChange={(e) => handleUpdateLine(idx, e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded p-1.5 font-sans bg-stone-50 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(idx)}
                            title="Delete this line"
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 37.5 Human in the loop confirmation checkbox */}
                    <div className="pt-2 border-t border-stone-100">
                      <label className="flex items-start gap-2 cursor-pointer bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                        <input
                          type="checkbox"
                          checked={isTruthConfirmed}
                          onChange={(e) => setIsTruthConfirmed(e.target.checked)}
                          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-[11px] text-amber-950 font-medium">
                          <strong>I confirm this is true:</strong> These lines accurately reflect my real experience and skills without any false claims or exaggeration.
                        </span>
                      </label>
                    </div>

                    {successSaved ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Profile updated with honest CV draft!</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveToProfile}
                        disabled={!canSaveAiCvDraft(isTruthConfirmed, draftLines)}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs py-2 px-3 rounded shadow-xs cursor-pointer transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Save to My Candidate Profile</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>AI never changes a Skill Passport label. Employers see verification labels first.</span>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-900 font-medium cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
