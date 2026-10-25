import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  FileText,
  Upload,
  Calendar,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Eye,
  ArrowRight,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';
import { CredentialEvidence, CredentialCategory } from '../../../domain/types';
import {
  COMMON_ISSUER_NAMES,
  ISSUER_CONFIGS,
  validateCredentialInput,
  maskCredentialId,
  generateCredentialHash,
} from '../../../domain/credentialValidation';
import { SKILL_DEFINITIONS } from '../../../domain/skillCatalogue';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  skillName?: string;
  claimId?: string;
  onSaveCredential: (
    credential: CredentialEvidence,
    file?: File,
    associatedSkills?: string[]
  ) => Promise<void>;
}

export const AddCredentialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  skillName,
  claimId,
  onSaveCredential,
}) => {
  const [issuerChoice, setIssuerChoice] = useState('Credly');
  const [customIssuer, setCustomIssuer] = useState('');
  const [credentialName, setCredentialName] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [issuedOn, setIssuedOn] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [credentialCategory, setCredentialCategory] = useState<CredentialCategory>('course_badge');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Multi-Skill Association State (1 Badge -> Multiple Skills)
  const [associatedSkills, setAssociatedSkills] = useState<string[]>(
    skillName ? [skillName] : []
  );
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [skillPickerSearch, setSkillPickerSearch] = useState('');

  // Flow & Validation State
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (skillName && !associatedSkills.includes(skillName)) {
      setAssociatedSkills((prev) => Array.from(new Set([skillName, ...prev])));
    }
  }, [skillName]);

  if (!isOpen) return null;

  const resolvedIssuer = issuerChoice === 'Other' ? customIssuer.trim() : issuerChoice;

  const handleToggleSkill = (name: string) => {
    setAssociatedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!associatedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setAssociatedSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkillInput('');
  };

  const handleRemoveSkill = (name: string) => {
    setAssociatedSkills((prev) => prev.filter((s) => s !== name));
  };

  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (associatedSkills.length === 0) {
      setValidationError('Please select or add at least one practical skill that this badge or certificate covers.');
      return;
    }

    const result = validateCredentialInput({
      issuer: resolvedIssuer,
      credentialName,
      credentialId,
      verifyUrl,
      fileRef: selectedFile?.name,
      issuedOn,
      expiresOn,
    });

    if (!result.isValid) {
      setValidationError(result.error || 'Please check your credential details.');
      return;
    }

    setStep('preview');
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    setValidationError(null);

    const validation = validateCredentialInput({
      issuer: resolvedIssuer,
      credentialName,
      credentialId,
      verifyUrl,
      fileRef: selectedFile?.name,
      issuedOn,
      expiresOn,
    });

    const isAccredited = ISSUER_CONFIGS[resolvedIssuer]?.isAccredited ?? false;
    const duplicateHash = generateCredentialHash(resolvedIssuer, credentialId) || undefined;

    const newCredential: CredentialEvidence = {
      id: `cred-${Date.now()}`,
      type: 'credential',
      issuer: resolvedIssuer,
      credentialName: credentialName.trim(),
      credentialId: credentialId.trim() || undefined,
      verifyUrl: verifyUrl.trim() || undefined,
      issuedOn: issuedOn || undefined,
      expiresOn: expiresOn || undefined,
      fileRef: selectedFile ? selectedFile.name : undefined,
      credentialCategory,
      isAccredited,
      checkStatus: validation.initialCheckStatus,
      checkNote: validation.checkNote,
      duplicateHash,
      associatedSkills,
    };

    try {
      await onSaveCredential(newCredential, selectedFile || undefined, associatedSkills);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Could not save badge or certificate. Please try again.');
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Add a Badge or Certificate</h3>
              <p className="text-xs text-stone-300">
                {associatedSkills.length > 0
                  ? `Covers ${associatedSkills.length} Skill(s) on your Passport`
                  : 'Attach credentials and associate practical skills'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Input Form */}
        {step === 'form' && (
          <form onSubmit={handleProceedToPreview} className="p-6 space-y-4 text-xs">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 text-[11px] leading-relaxed">
              <strong className="block font-bold mb-0.5">Modular Vocational Proof:</strong>
              1 Certificate or Badge can cater for multiple skills (e.g. TVET Food & Beverage Operations covers Kitchen Prep, Barista, and Inventory). All selected skills will automatically appear on your Skill Passport.
            </div>

            {/* Associated Skills Multi-Selector */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-stone-800 text-xs">
                    Associated Practical Skills *
                  </label>
                  <p className="text-[11px] text-stone-500">
                    Select all skills certified by this single credential.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  {associatedSkills.length} Selected
                </span>
              </div>

              {/* Active Selected Skill Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-white rounded border border-stone-200">
                {associatedSkills.length === 0 ? (
                  <span className="text-stone-400 italic text-[11px]">
                    No skills selected yet. Pick from catalogue below or type a custom skill.
                  </span>
                ) : (
                  associatedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="text-stone-400 hover:text-rose-600 cursor-pointer ml-0.5"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Custom Skill Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type custom skill (e.g. Pastry Baking, POS Cashier)..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  className="flex-1 border border-stone-300 rounded p-1.5 text-xs bg-white text-stone-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs rounded cursor-pointer shrink-0"
                >
                  + Add Skill
                </button>
              </div>

              {/* Quick Pick from Standard Catalogue */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>Pick from catalogue:</span>
                  <input
                    type="text"
                    placeholder="Filter catalogue..."
                    value={skillPickerSearch}
                    onChange={(e) => setSkillPickerSearch(e.target.value)}
                    className="border border-stone-300 rounded px-1.5 py-0.5 text-[11px] bg-white w-32"
                  />
                </div>
                <div className="max-h-28 overflow-y-auto grid grid-cols-2 gap-1 p-1 bg-white rounded border border-stone-200">
                  {SKILL_DEFINITIONS.filter(
                    (s) =>
                      !skillPickerSearch ||
                      s.name.toLowerCase().includes(skillPickerSearch.toLowerCase()) ||
                      s.category.toLowerCase().includes(skillPickerSearch.toLowerCase())
                  )
                    .slice(0, 16)
                    .map((s) => {
                      const isSelected = associatedSkills.includes(s.name);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleToggleSkill(s.name)}
                          className={`text-left px-2 py-1 rounded text-[11px] transition-colors truncate cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                              : 'hover:bg-stone-100 text-stone-700'
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-amber-700 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Issuer Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Issuing Organisation / Platform *
                </label>
                <select
                  value={issuerChoice}
                  onChange={(e) => setIssuerChoice(e.target.value)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
                >
                  {COMMON_ISSUER_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {issuerChoice === 'Other' && (
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Enter Organisation Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Soweto Barista Guild, Local TVET"
                    value={customIssuer}
                    onChange={(e) => setCustomIssuer(e.target.value)}
                    className="w-full border border-stone-300 rounded p-2 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Type of Certificate / Award
                </label>
                <select
                  value={credentialCategory}
                  onChange={(e) => setCredentialCategory(e.target.value as any)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
                >
                  <option value="course_badge">Course Badge or Workshop (Peer-endorsed tier when checked)</option>
                  <option value="proctored_exam">Proctored Benchmark / Practical Exam (Task-assessed tier)</option>
                  <option value="trade_certificate">Official Trade Diploma / License (Task-assessed tier)</option>
                  <option value="other">General Certificate of Attendance</option>
                </select>
              </div>
            </div>

            {/* Credential Name */}
            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Badge / Certificate Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Level 1 First Aid, Barista Essentials, TVET Commercial Cookery"
                value={credentialName}
                onChange={(e) => setCredentialName(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>

            {/* Verification Proof: ID, URL, or File */}
            <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 space-y-3">
              <span className="font-semibold text-stone-800 block text-xs">
                Proof Details (Provide at least one: ID number, online link, or photo/PDF)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">
                    Credential ID / Certificate Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CRED-9812-44X or leave blank if none"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    className="w-full border border-stone-300 rounded p-2 text-xs bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1">
                    Online Verification Link (Optional, https://)
                  </label>
                  <input
                    type="url"
                    placeholder="https://credly.com/badges/..."
                    value={verifyUrl}
                    onChange={(e) => setVerifyUrl(e.target.value)}
                    className="w-full border border-stone-300 rounded p-2 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Date Issued (Optional)</label>
                  <input
                    type="date"
                    value={issuedOn}
                    onChange={(e) => setIssuedOn(e.target.value)}
                    className="w-full border border-stone-300 rounded p-1.5 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={expiresOn}
                    onChange={(e) => setExpiresOn(e.target.value)}
                    className="w-full border border-stone-300 rounded p-1.5 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Upload Certificate File */}
              <div className="pt-2 border-t border-stone-200 text-center">
                <input
                  type="file"
                  id="credential-file-upload"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setSelectedFile(f);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="credential-file-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-stone-300 text-stone-700 font-medium hover:bg-stone-50 cursor-pointer shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>{selectedFile ? 'Change File' : 'Choose Document / Photo'}</span>
                </label>
                {selectedFile && (
                  <p className="text-[11px] text-emerald-800 font-semibold mt-1.5 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
                {!selectedFile && (
                  <p className="text-[11px] text-stone-400 mt-1">PDF, JPEG, or PNG up to 5 MB</p>
                )}
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs shadow-xs cursor-pointer"
              >
                <span>Review & Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Live Preview & Confirm Before Saving (Section 35.2) */}
        {step === 'preview' && (
          <div className="p-6 space-y-4 text-xs text-stone-700">
            <div>
              <h4 className="font-bold text-stone-900 text-sm">Review Your Badge Details</h4>
              <p className="text-[11px] text-stone-500">
                Check that everything looks right before adding this badge across your selected skills.
              </p>
            </div>

            {/* Preview Card */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-stone-900 text-sm">{credentialName}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                  Not Checked Yet
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600 pt-1">
                <p><strong>Organisation:</strong> {resolvedIssuer}</p>
                <p><strong>Type:</strong> <span className="capitalize">{credentialCategory.replace('_', ' ')}</span></p>
                {credentialId && (
                  <p><strong>Credential ID:</strong> <span className="font-mono">{maskCredentialId(credentialId)}</span></p>
                )}
                {issuedOn && <p><strong>Issued:</strong> {issuedOn}</p>}
                {expiresOn && <p><strong>Expires:</strong> {expiresOn}</p>}
                {selectedFile && <p><strong>File:</strong> {selectedFile.name}</p>}
              </div>

              {verifyUrl && (
                <div className="pt-1 text-[11px] flex items-center gap-1 text-amber-800">
                  <ExternalLink className="w-3 h-3 text-amber-600" />
                  <span className="truncate max-w-sm">{verifyUrl}</span>
                </div>
              )}

              {/* Associated Skills List */}
              <div className="pt-2 border-t border-stone-200/80">
                <span className="font-bold text-stone-800 block text-xs mb-1.5">
                  Linked Skills ({associatedSkills.length}) — will appear on your Skill Passport:
                </span>
                <div className="flex flex-wrap gap-1">
                  {associatedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[11px] border border-amber-200"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-stone-100 rounded-lg text-[11px] text-stone-600 space-y-1">
              <p>
                <strong>Verification note:</strong> When an assessor reviews and approves this badge, all {associatedSkills.length} linked skills on your Skill Passport will be verified simultaneously.
              </p>
              <p>Your full credential ID is masked to protect your privacy.</p>
            </div>

            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                {validationError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-stone-100">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving…' : 'Save to Skill Passport'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
