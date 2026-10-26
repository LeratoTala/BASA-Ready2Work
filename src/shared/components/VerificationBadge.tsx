import React from 'react';
import { VerificationStatus } from '../../domain/types';
import { CheckCircle2, Users, Award, ShieldCheck, HelpCircle } from 'lucide-react';
import { EVIDENCE_EXPLANATIONS } from '../../config/strings';

interface Props {
  status: VerificationStatus;
  showMeaning?: boolean;
  className?: string;
}

const ICONS: Record<VerificationStatus, React.ComponentType<{ className?: string }>> = {
  'Self-reported': HelpCircle,
  'Peer-endorsed': Users,
  'Task-assessed': ShieldCheck,
  'Mentor-reviewed': Award,
};

export const VERIFICATION_METADATA: Record<
  VerificationStatus,
  {
    label: string;
    meaning: string;
    oneLinePlain: string;
    disclaimer: string;
    badgeStyle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  'Self-reported': {
    label: EVIDENCE_EXPLANATIONS['Self-reported'].label,
    meaning: 'Candidate entered the claim.',
    oneLinePlain: EVIDENCE_EXPLANATIONS['Self-reported'].oneLinePlain,
    disclaimer: EVIDENCE_EXPLANATIONS['Self-reported'].disclaimer,
    badgeStyle: EVIDENCE_EXPLANATIONS['Self-reported'].badgeStyle,
    icon: ICONS['Self-reported'],
  },
  'Peer-endorsed': {
    label: EVIDENCE_EXPLANATIONS['Peer-endorsed'].label,
    meaning: 'An identified peer or community contractor provided an endorsement.',
    oneLinePlain: EVIDENCE_EXPLANATIONS['Peer-endorsed'].oneLinePlain,
    disclaimer: EVIDENCE_EXPLANATIONS['Peer-endorsed'].disclaimer,
    badgeStyle: EVIDENCE_EXPLANATIONS['Peer-endorsed'].badgeStyle,
    icon: ICONS['Peer-endorsed'],
  },
  'Task-assessed': {
    label: EVIDENCE_EXPLANATIONS['Task-assessed'].label,
    meaning: 'A recorded assessment was completed against an approved rubric.',
    oneLinePlain: EVIDENCE_EXPLANATIONS['Task-assessed'].oneLinePlain,
    disclaimer: EVIDENCE_EXPLANATIONS['Task-assessed'].disclaimer,
    badgeStyle: EVIDENCE_EXPLANATIONS['Task-assessed'].badgeStyle,
    icon: ICONS['Task-assessed'],
  },
  'Mentor-reviewed': {
    label: EVIDENCE_EXPLANATIONS['Mentor-reviewed'].label,
    meaning: 'A designated industry mentor reviewed submitted work evidence.',
    oneLinePlain: EVIDENCE_EXPLANATIONS['Mentor-reviewed'].oneLinePlain,
    disclaimer: EVIDENCE_EXPLANATIONS['Mentor-reviewed'].disclaimer,
    badgeStyle: EVIDENCE_EXPLANATIONS['Mentor-reviewed'].badgeStyle,
    icon: ICONS['Mentor-reviewed'],
  },
};

export const VerificationBadge: React.FC<Props> = ({ status, showMeaning = false, className = '' }) => {
  const meta = VERIFICATION_METADATA[status] || VERIFICATION_METADATA['Self-reported'];
  const Icon = meta.icon;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 text-xs px-2.5 py-1 rounded border ${meta.badgeStyle} ${className}`}
      title={`${meta.label}: ${meta.oneLinePlain}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-semibold">{meta.label}</span>
      {showMeaning && (
        <span className="text-[11px] opacity-75 whitespace-normal">
          · {meta.oneLinePlain}
        </span>
      )}
    </div>
  );
};
