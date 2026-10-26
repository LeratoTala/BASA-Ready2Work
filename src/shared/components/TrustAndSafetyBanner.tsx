/**
 * TrustAndSafetyBanner
 *
 * Addresses the judge's specific question: "How will businesses and young people
 * be protected from fraudulent opportunities, exploitation and unreliable endorsements?"
 *
 * Shows role-appropriate protections clearly in the UI so both candidates and employers
 * understand what BASA does and does not guarantee.
 */
import React, { useState } from 'react';
import {
  ShieldCheck,
  Flag,
  Eye,
  Lock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Ban,
  ClipboardCheck,
} from 'lucide-react';
import type { Role } from '../../domain/types';

interface Props {
  role: Role;
}

interface Protection {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const CANDIDATE_PROTECTIONS: Protection[] = [
  {
    icon: <Flag className="w-4 h-4 text-red-500" />,
    title: 'Report suspicious jobs instantly',
    description:
      'Every job listing has a Report button. Flagged jobs are suspended and reviewed by a BASA admin before they can receive new applications. Employers who post misleading or exploitative listings are removed.',
  },
  {
    icon: <Eye className="w-4 h-4 text-amber-500" />,
    title: 'Transparent pay — no hidden fees',
    description:
      'Employers must declare ZAR compensation (hourly, daily, or fixed) before their listing goes live. Vague listings like "experience-based pay" are blocked. BASA charges candidates nothing.',
  },
  {
    icon: <Lock className="w-4 h-4 text-blue-500" />,
    title: 'Your contact details are private by default',
    description:
      'Your phone number and email are never visible to employers until they formally shortlist you. Even after shortlisting, contact access is tied to that specific application and cannot be exported or shared.',
  },
  {
    icon: <BadgeCheck className="w-4 h-4 text-emerald-500" />,
    title: 'Employer verification before posting',
    description:
      'Employers start with "Pending" status. Verified employers have been reviewed by a BASA admin. You can see each employer\'s verification badge before you apply.',
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-purple-500" />,
    title: 'Honest skill labels — no inflated claims',
    description:
      'Your skills are labelled exactly as confirmed: Self-reported, Peer-endorsed, Task-assessed, or Mentor-reviewed. Employers see these labels and their meaning. BASA prevents you from self-promoting to a higher tier.',
  },
];

const EMPLOYER_PROTECTIONS: Protection[] = [
  {
    icon: <ClipboardCheck className="w-4 h-4 text-emerald-500" />,
    title: 'Multi-tier skill verification — not just self-reported CVs',
    description:
      'Every skill claim shows whether it was independently endorsed by a peer, graded ≥70/100 by a practical assessor, or reviewed by an accredited mentor. You can filter and hire based on the verification tier that your role requires.',
  },
  {
    icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    title: 'Endorsements are reviewed before they upgrade a label',
    description:
      'Peer endorsements go into a pending queue and must be approved by a BASA admin before upgrading a candidate\'s label. An endorsement that looks fabricated can be rejected without the candidate\'s label changing.',
  },
  {
    icon: <Ban className="w-4 h-4 text-red-500" />,
    title: 'Candidates cannot self-promote their verification status',
    description:
      'Firestore security rules at the database level prevent any candidate from writing their own "Task-assessed" or "Mentor-reviewed" label. Only admin-verified assessors and mentors can grant those tiers.',
  },
  {
    icon: <Eye className="w-4 h-4 text-blue-500" />,
    title: 'Immutable work records on completion',
    description:
      'When you mark an engagement as completed, BASA creates an immutable work record. Candidates see this in their portfolio. Neither party can edit it after creation, giving future employers a reliable reference.',
  },
  {
    icon: <Flag className="w-4 h-4 text-stone-500" />,
    title: 'Community moderation',
    description:
      'Candidates can report jobs and candidate profiles. Admins review every report and can suspend listings. This creates a community-driven safety layer on top of BASA\'s own moderation.',
  },
];

export const TrustAndSafetyBanner: React.FC<Props> = ({ role }) => {
  const [expanded, setExpanded] = useState(false);

  const protections = role === 'employer' ? EMPLOYER_PROTECTIONS : CANDIDATE_PROTECTIONS;
  const headline =
    role === 'employer'
      ? 'How BASA protects your hiring process'
      : 'How BASA protects you';
  const subline =
    role === 'employer'
      ? 'Verified skills, admin-reviewed endorsements, and immutable work records.'
      : 'Transparent pay, private contact details, and verified employer listings.';

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-stone-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-stone-900">{headline}</p>
            <p className="text-xs text-stone-500">{subline}</p>
          </div>
        </div>
        <div className="shrink-0 text-stone-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Protections list */}
      {expanded && (
        <div className="border-t border-stone-100 divide-y divide-stone-50">
          {protections.map((p, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 shrink-0">{p.icon}</div>
              <div>
                <p className="text-xs font-bold text-stone-900">{p.title}</p>
                <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">{p.description}</p>
              </div>
            </div>
          ))}

          {/* Honest limitations footer */}
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong>What BASA cannot guarantee:</strong> Peer endorsements are community references, not formal
                qualifications. Work records confirm employer-reported completion, not independent payment audits.
                BASA is a matching and proof platform — not a labour law enforcement agency. Always use a written
                work agreement and keep your own proof of payment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
