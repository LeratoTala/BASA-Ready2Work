import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface Props {
  visibility: 'public_link' | 'employers_only' | 'private';
  onUpdateVisibility?: (val: 'public_link' | 'employers_only' | 'private') => void;
  isCandidate?: boolean;
}

export const PopiaBanner: React.FC<Props> = ({ visibility, onUpdateVisibility, isCandidate = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const selectedVisibility = visibility === 'private' ? 'private' : 'employers_only';

  if (dismissed) return null;

  return (
    <div className="bg-stone-50 border-b border-stone-200 text-stone-700 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-stone-900">Your privacy:</strong> Your contact details stay private until an employer shortlists you.
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
              value={selectedVisibility}
              onChange={(e) => onUpdateVisibility(e.target.value as any)}
              className="bg-white border border-stone-300 rounded px-2 py-0.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="employers_only">Employers I apply to</option>
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
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <p className="font-semibold text-stone-800 mb-1">What we collect and why</p>
              <p>Your name, email, role, broad area, availability, skills and chosen evidence help run profiles, matching, applications and safety reviews. We do not collect precise GPS or identity documents.</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">Who can see your information</p>
              <p>You can see your own profile. An employer can see an application and allowed skill evidence only after you apply. Your private contact details are available only to that employer after shortlisting.</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">How we use data</p>
              <p>We use information only to provide BASA features. We do not sell it, use it for advertising, or share it for unrelated profiling. AI drafting is off by default; BASA must review a provider's data-use terms before enabling it.</p>
            </div>
            <div>
              <p className="font-semibold text-stone-800 mb-1">Correct or delete your data</p>
              <p>Update your profile and claims in BASA. To request account deletion, contact the BASA service operator. The operator must review related work and safety records under the retention policy before deleting them.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
