import React from 'react';
import { X, ShieldCheck, Download, Trash2, Calendar, Lock, ExternalLink } from 'lucide-react';
import { GRADE_6_DATA_POLICY, DEFAULT_RETENTION_CONFIG } from '../../../config/retentionConfig';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExportData?: () => void;
  onRequestDeletion?: () => void;
}

export const DataRetentionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onExportData,
  onRequestDeletion,
}) => {
  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: 'data-retention',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Your Data & Privacy Choices</h3>
              <p className="text-xs text-stone-400">
                Grade 6 Plain-Language Privacy Policy (POPIA & Section 38 Compliant)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Quick Notice */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong>Candidate Protection Invariant:</strong> You will NEVER be charged to register, build a Skill Passport, or apply for jobs. Your personal data is never sold to advertisers or third parties.
            </div>
          </div>

          {/* Policy Cards (Grade 6 level) */}
          <div className="space-y-3">
            {GRADE_6_DATA_POLICY.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-xs"
              >
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  {item.title}
                </h4>
                <p className="text-stone-600 leading-relaxed pl-7">{item.summary}</p>
              </div>
            ))}
          </div>

          {/* Employer-held copies notice (Section 38.3) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <h5 className="font-bold text-stone-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-700" />
              Notice on External Employer Notes
            </h5>
            <p className="text-stone-700 leading-relaxed">
              {DEFAULT_RETENTION_CONFIG.employerDownloadedNotice}
            </p>
          </div>

          {/* Actions: Export & Delete */}
          <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {onExportData && (
              <button
                type="button"
                onClick={onExportData}
                className="flex items-center justify-center gap-2 p-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl border border-stone-300 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-stone-600" />
                <span>Export My Data (JSON)</span>
              </button>
            )}

            {onRequestDeletion && (
              <button
                type="button"
                onClick={onRequestDeletion}
                className="flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl border border-red-200 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete My Account Permanently</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>POPIA Act No. 4 of 2013 Compliant</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
