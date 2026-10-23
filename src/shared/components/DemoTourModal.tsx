import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Flame, Sparkles, CheckCircle2, Shield, Briefcase, Award } from 'lucide-react';
import { Role } from '../../domain/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSwitchRole: (role: Role, uid: string) => void;
}

interface TourStep {
  title: string;
  timeWindow: string;
  focus: string;
  description: string;
  targetRole: Role;
  targetUid: string;
  keyPoints: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'The Challenge & The Spark',
    timeWindow: '0:00 – 0:45',
    focus: 'Problem: Informal Skills are Invisible',
    description:
      'Millions of young South Africans have practical abilities—from repairing cellphones to pulling espresso and mounting rooftop solar panels—yet lack formal degrees or formal CVs. BASA ("Bridge to Actual Skills & Access") lights a fire by turning practical abilities into credible, verifiable evidence.',
    targetRole: 'candidate',
    targetUid: 'candidate-thabo',
    keyPoints: [
      'Focus on Thabo Ndlovu (Soweto): 2 years practical coffee and solar experience.',
      'Traditional CV screeners filter him out; BASA makes his skills visible.',
      'South African context: broad location privacy, ZAR currency, zero upfront fees.',
    ],
  },
  {
    title: 'The Transparent Skill Passport',
    timeWindow: '0:45 – 1:45',
    focus: 'Evidence & Honest Verification Labels',
    description:
      'BASA enforces honest verification: Self-reported, Peer-endorsed, Task-assessed, and Mentor-reviewed. Candidates attach real proof (bench tests, contractor references). The Skill Passport can be shared securely via QR or public link with strict POPIA privacy toggles.',
    targetRole: 'candidate',
    targetUid: 'candidate-thabo',
    keyPoints: [
      'Inspect Thabo’s "Barista & Espresso Calibration" verified as Task-assessed (92/100).',
      'Solar PV Mounting is backed by an identified licensed electrician reference.',
      'Use the AI CV Drafter (strictly constrained to candidate-provided facts).',
    ],
  },
  {
    title: 'Explainable Matching & 1-Click Apply',
    timeWindow: '1:45 – 2:45',
    focus: 'Matching Engine: M = 0.50S + 0.25E + 0.15A + 0.10L',
    description:
      'Instead of an opaque black box, BASA computes a transparent recommendation score using required skill alignment (50%), verified evidence strength (25%), availability fit (15%), and location fit (10%). Candidates see exactly why they matched and how to level up.',
    targetRole: 'candidate',
    targetUid: 'candidate-thabo',
    keyPoints: [
      'Review open opportunities in Johannesburg & Soweto paying R400 - R480/day or R65/hr.',
      'Click "Why this score?" to inspect the four transparent formula components.',
      'Submit application in one click with built-in duplicate prevention.',
    ],
  },
  {
    title: 'Employer Shortlisting & Work Record',
    timeWindow: '2:45 – 4:00',
    focus: 'Employer Workflow: Zola Artisan Café & SunPower Solars',
    description:
      'Switch into the employer dashboard. Employers post jobs with explicit ZAR compensation terms, review applicant evidence without bias, and advance applications through valid transitions: Submitted -> Under Review -> Shortlisted -> Selected -> Work Completed.',
    targetRole: 'employer',
    targetUid: 'employer-zola',
    keyPoints: [
      'Review Thabo’s applicant dossier and assessor rubric scores.',
      'Move applicant from Under Review to Shortlisted or Selected.',
      'Confirm completed work and log payout confirmation record.',
    ],
  },
  {
    title: 'Assessor Rubrics & Low-Data Innovation',
    timeWindow: '4:00 – 5:00',
    focus: 'Quality Standards, POPIA & Low-Data Mode',
    description:
      'Switch to the Assessor / Admin view. Assessors evaluate practical demos using structured 100-point rubrics to certify candidate claims. The built-in Low-Data Mode cuts payload size down to under 80 KB for data-constrained township networks.',
    targetRole: 'admin',
    targetUid: 'admin-nomsa',
    keyPoints: [
      'Inspect the Assessor Workspace and 4-point rubric grading system.',
      'Review anti-fraud moderation for reported scam listings.',
      'Toggle Low-Data Mode to experience high-efficiency text layout.',
    ],
  },
];

export const DemoTourModal: React.FC<Props> = ({ isOpen, onClose, onSwitchRole }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];

  const handleGoToRole = () => {
    onSwitchRole(step.targetRole, step.targetUid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                BASA: Ready2Work 5-Minute Demo Guide
              </h3>
              <p className="text-xs text-stone-400">
                Official Hackathon Evaluation Script (Specification Section 13.2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-stone-100 flex items-center px-6 py-2.5 border-b border-stone-200 gap-2">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex-1 py-1 rounded text-xs font-medium text-center transition-all ${
                idx === currentStepIndex
                  ? 'bg-amber-600 text-white shadow-xs'
                  : idx < currentStepIndex
                  ? 'bg-stone-200 text-stone-700'
                  : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
              }`}
            >
              Step {idx + 1}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              {step.timeWindow} · {step.focus}
            </span>
            <span className="text-xs text-stone-500">
              Recommended Persona: <strong className="capitalize text-stone-800">{step.targetRole}</strong>
            </span>
          </div>

          <h4 className="text-xl font-bold text-stone-900">{step.title}</h4>
          <p className="text-sm text-stone-700 leading-relaxed">{step.description}</p>

          <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              What to show in this segment:
            </h5>
            <ul className="space-y-1.5">
              {step.keyPoints.map((pt, i) => (
                <li key={i} className="text-xs text-stone-700 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <button
              onClick={handleGoToRole}
              className="text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded transition-colors"
            >
              Switch to {step.targetRole} view for this step →
            </button>
            <div className="text-xs text-stone-500">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1 text-xs font-medium text-stone-600 disabled:opacity-30 hover:text-stone-900 px-2.5 py-1.5 rounded"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
            >
              Close Guide
            </button>
            {currentStepIndex < TOUR_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
              >
                Ready to Explore
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
