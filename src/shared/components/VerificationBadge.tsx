import React from 'react';
import { VerificationStatus } from '../../domain/types';
import { CheckCircle2, Users, Award, ShieldCheck, HelpCircle } from 'lucide-react';

interface Props {
  status: VerificationStatus;
  showMeaning?: boolean;
  className?: string;
}

export const VERIFICATION_METADATA: Record<
  VerificationStatus,
  {
    label: string;
    meaning: string;
    disclaimer: string;
    badgeStyle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  'Self-reported': {
    label: 'Self-reported',
    meaning: 'Candidate entered the claim.',
    disclaimer: 'Not independently confirmed.',
    badgeStyle: 'bg-stone-100 text-stone-700 border-stone-200',
    icon: HelpCircle,
  },
  'Peer-endorsed': {
    label: 'Peer-endorsed',
    meaning: 'An identified peer or community contractor provided an endorsement.',
    disclaimer: 'Not formal certification.',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Users,
  },
  'Task-assessed': {
    label: 'Task-assessed',
    meaning: 'A recorded assessment was completed against an approved rubric.',
    disclaimer: 'Not a guarantee of job performance.',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
    icon: ShieldCheck,
  },
  'Mentor-reviewed': {
    label: 'Mentor-reviewed',
    meaning: 'A designated industry mentor reviewed submitted work evidence.',
    disclaimer: 'Not necessarily an accredited qualification.',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: Award,
  },
};

export const VerificationBadge: React.FC<Props> = ({ status, showMeaning = false, className = '' }) => {
  const meta = VERIFICATION_METADATA[status] || VERIFICATION_METADATA['Self-reported'];
  const Icon = meta.icon;

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 text-xs px-2.5 py-1 rounded border ${meta.badgeStyle} ${className}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-semibold">{meta.label}</span>
      {showMeaning && (
        <span className="text-[11px] opacity-75 whitespace-normal">
          · {meta.disclaimer}
        </span>
      )}
    </div>
  );
};
