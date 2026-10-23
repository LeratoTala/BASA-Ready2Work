import React, { useState } from 'react';
import { ShieldCheck, X, Eye, Info } from 'lucide-react';

interface Props {
  visibility: 'public_link' | 'employers_only' | 'private';
  onUpdateVisibility?: (val: 'public_link' | 'employers_only' | 'private') => void;
  isCandidate?: boolean;
}

export const PopiaBanner: React.FC<Props> = ({ visibility, onUpdateVisibility, isCandidate = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-stone-50 border-b border-stone-200 text-stone-700 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-stone-900">POPIA Privacy Baseline:</strong> We protect personal info. Broad locations only (no GPS tracking), phone & email masked until shortlisted.
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-stone-900 underline hover:text-amber-700 font-medium ml-1 cursor-pointer"
          >
            {expanded ? 'Hide details' : 'Privacy controls & policy'}
          </button>
        </div>

        {isCandidate && onUpdateVisibility && (
          <div className="flex items-center gap-2">
            <span className="text-stone-500">Passport Sharing:</span>
            <select
              value={visibility}
              onChange={(e) => onUpdateVisibility(e.target.value as any)}
              className="bg-white border border-stone-300 rounded px-2 py-0.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="public_link">Public Link (Shareable QR)</option>
              <option value="employers_only">Shortlisted Employers Only</option>
              <option value="private">Private (Hidden)</option>
            </select>
          </div>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="text-stone-400 hover:text-stone-700 ml-2"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="bg-stone-100 border-t border-stone-200 px-4 py-3 text-xs text-stone-600">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-semibold text-stone-800 mb-1">1. Minimal & Broad Location</p>
              <p>We only store township or suburb areas (e.g., Soweto, Khayelitsha, CBD). No fine-grained GPS tracking is recorded.</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">2. Contact Masking</p>
              <p>Employers only access your phone and direct contact details once they officially move your application to Shortlisted.</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">3. Right to Correction & Deletion</p>
              <p>Under South Africa's POPIA act, you can update your evidence claims or purge your profile and work logs at any time.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
