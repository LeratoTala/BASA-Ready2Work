import React from 'react';
import {
  ShieldCheck,
  Award,
} from 'lucide-react';
import { AssessmentRecord, SkillClaim } from '../../../domain/types';

interface Props {
  assessorName: string;
  assessments: AssessmentRecord[];
  claims: SkillClaim[];
}

export const AssessorProfilePage: React.FC<Props> = ({ assessorName, assessments, claims }) => {
  const approvedCount = assessments.filter((a) => a.decision === 'approved').length;
  const skillCount = new Set(assessments.map((assessment) => assessment.skillId)).size;
  const candidateCount = new Set(assessments.map((assessment) => assessment.candidateId)).size;

  return (
    <div className="space-y-6">
      {/* Assessor Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 text-emerald-400 font-extrabold text-2xl flex items-center justify-center shrink-0 border border-stone-800">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  BASA Admin & Assessor
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900">
                {assessorName}
              </h1>
              <p className="text-xs text-stone-600 font-medium">
                Assessment access is granted by BASA administrators.
              </p>
            </div>
          </div>
        </div>

        {/* Assessor Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-stone-100 text-center text-xs">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Assessment Records</span>
            <span className="text-xl font-extrabold text-stone-900">{assessments.length}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 block">Approved Assessments</span>
            <span className="text-xl font-extrabold text-emerald-700">{approvedCount}</span>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Skills Assessed</span>
            <span className="text-xl font-extrabold text-stone-900">{skillCount}</span>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Candidates Assessed</span>
            <span className="text-xl font-extrabold text-stone-900">{candidateCount}</span>
          </div>
        </div>
      </div>

      {/* Authorized Assessment Rubrics */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          Assessment Rubric
        </h3>
        <p className="text-stone-500">
          Assessment records use a shared 100-point rubric. This prototype rubric is not an accredited qualification standard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">Core technical execution</span>
              <span className="text-xs font-semibold text-stone-700 bg-stone-200 px-2 py-0.5 rounded">25 points</span>
            </div>
            <p className="text-stone-600">Follows the relevant task procedure and demonstrates the claimed skill.</p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">Safety and protocol</span>
              <span className="text-xs font-semibold text-stone-700 bg-stone-200 px-2 py-0.5 rounded">25 points</span>
            </div>
            <p className="text-stone-600">Uses appropriate safety measures and follows task-specific procedures.</p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">Tool and equipment care</span>
              <span className="text-xs font-semibold text-stone-700 bg-stone-200 px-2 py-0.5 rounded">25 points</span>
            </div>
            <p className="text-stone-600">Selects and uses relevant tools while keeping equipment and workspace in order.</p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">Efficiency and troubleshooting</span>
              <span className="text-xs font-semibold text-stone-700 bg-stone-200 px-2 py-0.5 rounded">25 points</span>
            </div>
            <p className="text-stone-600">Completes the task clearly and responds appropriately to common issues.</p>
          </div>
        </div>
      </div>

      {/* Recent Evaluations Log */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-base text-stone-900">Assessment Records</h3>
        <div className="divide-y divide-stone-100">
          {assessments.map((a) => (
            <div key={a.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-stone-900 text-xs block">{a.candidateName}</span>
                <span className="text-stone-500 text-[11px]">{a.skillName} · Assessed by {a.assessorName} · {a.feedback}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-emerald-700 text-sm block">{a.score} / 100</span>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {a.decision}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
