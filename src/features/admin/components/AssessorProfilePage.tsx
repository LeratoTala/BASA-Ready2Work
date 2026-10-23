import React from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  FileCheck,
  Building2,
  MapPin,
  Mail,
  Scale,
  Calendar,
} from 'lucide-react';
import { AssessmentRecord, SkillClaim } from '../../../domain/types';

interface Props {
  assessments: AssessmentRecord[];
  claims: SkillClaim[];
}

export const AssessorProfilePage: React.FC<Props> = ({ assessments, claims }) => {
  const verifiedCount = assessments.filter((a) => a.decision === 'approved').length;

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
                  Certified Technical Assessor Profile
                </span>
                <span className="text-xs text-stone-400">Accreditation: ZA-BASA-ASSESS-881</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900">
                Nomsa Dlamini
              </h1>
              <p className="text-xs text-stone-600 font-medium">
                Lead Vocational Assessor & Quality Assurance Officer
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1">
                <span className="flex items-center gap-1 font-medium text-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  Soweto & Alexandra Skills Hubs (Gauteng)
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  nomsa.assessor@basa-skills.org.za
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessor Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-stone-100 text-center text-xs">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Rubrics Evaluated</span>
            <span className="text-xl font-extrabold text-stone-900">{assessments.length}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 block">Certifications Granted</span>
            <span className="text-xl font-extrabold text-emerald-700">{verifiedCount}</span>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Accredited Skill Domains</span>
            <span className="text-xl font-extrabold text-stone-900">4</span>
          </div>
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Audit Pass Rate</span>
            <span className="text-xl font-extrabold text-stone-900">100%</span>
          </div>
        </div>
      </div>

      {/* Authorized Assessment Rubrics */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          Authorized 100-Point Rubric Benchmarks
        </h3>
        <p className="text-stone-500">
          Independent practical evaluations administered by registered assessors under Section 3.3.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">Barista & Espresso Calibration</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Active Rubric</span>
            </div>
            <p className="text-stone-600">
              Extraction timing, 1:2 ratio calibration, milk microfoam texture (60-65°C), equipment purge hygiene, and order sequence under pressure.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">Solar PV Rooftop Mounting & DC Wiring</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Active Rubric</span>
            </div>
            <p className="text-stone-600">
              Roof anchor ladder safety, aluminum rail torque specifications, 4mm UV DC cable polarity inspection, and open-circuit voltage multimeter testing.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">Retail POS, Stock Balance & Till Cash Up</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Active Rubric</span>
            </div>
            <p className="text-stone-600">
              Barcode scanning speed, cash drawer balancing, float reconciliation, refund processing, and friendly customer interaction.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-stone-900">Cellphone Screen & Hardware Repair</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Active Rubric</span>
            </div>
            <p className="text-stone-600">
              Digitizer separation, heat gun temperature control, ribbon cable seating, screw organization, and multi-touch digitizer testing.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Evaluations Log */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-base text-stone-900">Recent Assessments Certified by Nomsa</h3>
        <div className="divide-y divide-stone-100">
          {assessments.map((a) => (
            <div key={a.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-stone-900 text-xs block">{a.candidateName}</span>
                <span className="text-stone-500 text-[11px]">{a.skillName} · {a.feedback}</span>
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
