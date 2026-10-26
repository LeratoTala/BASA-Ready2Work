import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  FileCheck,
  Briefcase,
} from 'lucide-react';
import { EvidenceItem, SkillClaim } from '../../../domain/types';
import { getSkillClaimProofStatus } from '../../../domain/claimProofUpdate';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  claim: SkillClaim;
  onSaveProof: (
    claimId: string,
    updates: {
      evidenceTitle: string;
      evidenceDescription: string;
      evidenceType: 'photo_video' | 'client_review' | 'reference_note' | 'work_sample' | 'practical_demo';
      evidenceUrlOrText?: string;
      newFiles?: File[];
      existingItemIdsToKeep?: string[];
    }
  ) => Promise<void> | void;
}

export const UpdateSkillProofModal: React.FC<Props> = ({
  isOpen,
  onClose,
  claim,
  onSaveProof,
}) => {
  const [evidenceTitle, setEvidenceTitle] = useState(claim.evidenceTitle || '');
  const [evidenceDescription, setEvidenceDescription] = useState(claim.evidenceDescription || '');
  const [evidenceType, setEvidenceType] = useState(claim.evidenceType || 'work_sample');
  const [evidenceUrlOrText, setEvidenceUrlOrText] = useState(claim.evidenceUrlOrText || '');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [keptItemIds, setKeptItemIds] = useState<string[]>(
    (claim.evidenceItems || []).map((i) => i.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: `proof_${claim.id}`,
  });

  if (!isOpen) return null;

  const currentProofStatus = getSkillClaimProofStatus(claim);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const oversized = filesArray.find((f) => f.size > 5 * 1024 * 1024);
      if (oversized) {
        setErrorMsg(`File "${oversized.name}" exceeds the 5 MB limit.`);
        return;
      }
      setNewFiles((prev) => [...prev, ...filesArray]);
      setErrorMsg(null);
    }
  };

  const handleRemoveExistingItem = (itemId: string) => {
    setKeptItemIds((prev) => prev.filter((id) => id !== itemId));
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!evidenceTitle.trim()) {
      setErrorMsg('Please provide a title describing your proof.');
      return;
    }
    if (!evidenceDescription.trim()) {
      setErrorMsg('Please provide details of what you did.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveProof(claim.id, {
        evidenceTitle: evidenceTitle.trim(),
        evidenceDescription: evidenceDescription.trim(),
        evidenceType,
        evidenceUrlOrText: evidenceUrlOrText.trim(),
        newFiles,
        existingItemIdsToKeep: keptItemIds,
      });

      setSuccessToast('Proof updated successfully! Employers will now see your latest proof.');
      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingItems = (claim.evidenceItems || []).filter((item) =>
    keptItemIds.includes(item.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Skill Proof Editor
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    currentProofStatus.hasProof
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {currentProofStatus.statusLabel}
                </span>
              </div>
              <h2 className="text-base font-bold text-stone-900 mt-0.5">
                Update Proof for {claim.skillName}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              You can update your proof at any time—even after initial submission. Assessor evaluations and employer matching algorithms will automatically reflect your latest evidence.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Evidence Type */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              Proof & Evidence Category <span className="text-rose-600">*</span>
            </label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as any)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="work_sample">Work Sample / Completed Job (Portfolio, photo of completed work)</option>
              <option value="photo_video">Photo or Video Demonstration (Performing the skill)</option>
              <option value="practical_demo">In-Person Bench Test / Practical Demonstration</option>
              <option value="client_review">Client / Customer Recommendation Note</option>
              <option value="reference_note">Supervisor / Contractor Reference Letter</option>
            </select>
          </div>

          {/* Proof Title */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              Proof Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. In-Person Bench Practical / Rooftop Mounting Array Photos"
              value={evidenceTitle}
              onChange={(e) => setEvidenceTitle(e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
            </input>
          </div>

          {/* Evidence Description */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              Context & Description of Proof <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe what procedure you performed, what tools you used, where you worked, or who supervised your bench work."
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Reference Link / Note */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              External Reference Note or Online Portfolio Link (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. GitHub link, wireman contact note, or Google Drive URL"
              value={evidenceUrlOrText}
              onChange={(e) => setEvidenceUrlOrText(e.target.value)}
              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Existing Proof Items */}
          {existingItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="font-bold text-stone-800 block">
                Attached Proof Files ({existingItems.length}):
              </span>
              <div className="space-y-2">
                {existingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {item.type === 'work_sample' && <Briefcase className="w-4 h-4 text-amber-700 shrink-0" />}
                      {item.type === 'photo' && <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0" />}
                      {(item.type === 'document_pdf' || item.type === 'certificate') && (
                        <FileCheck className="w-4 h-4 text-purple-700 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-bold text-stone-900 block truncate">{item.title}</span>
                        <span className="text-[10px] text-stone-500">{item.fileName || 'Attached document'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingItem(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                      title="Remove this item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Files to Upload */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <span className="font-bold text-stone-800 block">
              Upload New Documents, Photos or Certificates:
            </span>
            <div className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-4 text-center bg-stone-50/50 hover:bg-amber-50/30 transition-all cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
              <p className="font-bold text-stone-800 text-xs">
                Click or drag & drop files to attach as proof
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                Supports PDF documents, JPG, and PNG images up to 5 MB each.
              </p>
            </div>

            {newFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-stone-700">Newly selected files:</span>
                {newFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-[10px] text-stone-400">({Math.round(file.size / 1024)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewFile(idx)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Proof…' : 'Save & Update Proof'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
