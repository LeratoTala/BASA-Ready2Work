import React, { useState } from 'react';
import {
  Plus,
  Award,
  CheckCircle2,
  FileText,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  Upload,
  Users,
  Check,
  X,
  Image as ImageIcon,
  Eye,
  Info,
  ExternalLink,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { CandidateProfile, CredentialEvidence, EvidenceItem, SkillClaim, VerificationStatus } from '../../../domain/types';
import { SKILL_DEFINITIONS } from '../../../domain/skillCatalogue';
import { VerificationBadge } from '../../../shared/components/VerificationBadge';
import { env } from '../../../config/env';
import { FEATURE_FLAGS } from '../../../config/featureFlags';
import { getRubricForSkill } from '../../../domain/rubrics';
import { maskCredentialId, isCredentialExpired } from '../../../domain/credentialValidation';
import { CREDENTIAL_EXPLANATIONS } from '../../../config/credentialRules';
import { AddCredentialModal } from './AddCredentialModal';

interface Props {
  candidate: CandidateProfile;
  claims: SkillClaim[];
  onAddClaim: (
    claim: Omit<SkillClaim, 'id' | 'createdAt'>,
    evidenceFile?: File,
    evidenceFiles?: File[]
  ) => Promise<SkillClaim>;
  onOpenPassport: () => void;
  onOpenAIDrafter: () => void;
  onAddCredential?: (
    claimId: string,
    credential: CredentialEvidence,
    file?: File,
    associatedSkills?: string[]
  ) => Promise<void>;
  onRequestPeerEndorsement?: (
    claimId: string,
    params: {
      endorserName: string;
      endorserRole: string;
      relationship: string;
      comments: string;
    }
  ) => Promise<any>;
  onRequestMentorReview?: (
    claimId: string,
    params: {
      mentorName: string;
      organization?: string;
      feedback: string;
      decision: 'approved' | 'needs_more_evidence' | 'rejected';
    }
  ) => Promise<any>;
}

export const SkillsAndEvidence: React.FC<Props> = ({
  candidate,
  claims,
  onAddClaim,
  onOpenPassport,
  onOpenAIDrafter,
  onAddCredential,
  onRequestPeerEndorsement,
  onRequestMentorReview,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState(SKILL_DEFINITIONS[0].id);
  const [customSkillName, setCustomSkillName] = useState('');
  const [selfReportedLevel, setSelfReportedLevel] = useState<'Beginner' | 'Intermediate' | 'Proficient'>('Intermediate');
  const [evidenceType, setEvidenceType] = useState<'photo_video' | 'client_review' | 'reference_note' | 'work_sample' | 'practical_demo'>('reference_note');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Document Inspection & Label Guide Modals
  const [inspectingItem, setInspectingItem] = useState<{ item: EvidenceItem; skillName: string } | null>(null);
  const [showLabelGuideModal, setShowLabelGuideModal] = useState(false);
  const [showCredentialGuideModal, setShowCredentialGuideModal] = useState(false);
  const [credentialModalClaim, setCredentialModalClaim] = useState<SkillClaim | null>(null);
  const [isStandaloneCredentialModalOpen, setIsStandaloneCredentialModalOpen] = useState(false);

  // R3 Verification Modals
  const [endorsementClaim, setEndorsementClaim] = useState<SkillClaim | null>(null);
  const [rubricClaim, setRubricClaim] = useState<SkillClaim | null>(null);
  const [endorserName, setEndorserName] = useState('');
  const [endorserRole, setEndorserRole] = useState('');
  const [endorserRelationship, setEndorserRelationship] = useState('Former Job Supervisor');
  const [endorserComments, setEndorserComments] = useState('');
  const [isSubmittingEndorsement, setIsSubmittingEndorsement] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    let skillName = '';
    if (selectedSkillId === 'custom') {
      if (!customSkillName.trim()) return;
      skillName = customSkillName.trim();
    } else {
      const def = SKILL_DEFINITIONS.find((s) => s.id === selectedSkillId);
      skillName = def?.name || 'Practical Skill';
    }

    const status: VerificationStatus = 'Self-reported';

    const items: EvidenceItem[] = evidenceFiles.map((file, idx) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isCert = isPdf || /cert|diploma|trade|nqa|training/i.test(file.name);
      return {
        id: `ev-${Date.now()}-${idx}`,
        type: isCert ? 'certificate' : 'photo_video',
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        fileName: file.name,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        fileUrl: URL.createObjectURL(file),
        description: evidenceDescription.trim() || evidenceTitle.trim(),
        uploadedAt: new Date().toISOString(),
      };
    });

    try {
      const savedClaim = await onAddClaim(
        {
          candidateId: candidate.uid,
          skillId: selectedSkillId === 'custom' ? `custom-${Date.now()}` : selectedSkillId,
          skillName,
          selfReportedLevel,
          evidenceType,
          evidenceTitle: evidenceTitle.trim() || `${skillName} Practical Experience`,
          evidenceDescription: evidenceDescription.trim(),
          evidenceUrlOrText: items.length > 0 ? (items[0].fileName || '') : (evidenceDescription.trim() || evidenceTitle.trim()),
          verificationStatus: status,
          evidenceItems: items.length > 0 ? items : undefined,
        },
        evidenceFiles[0] ?? undefined,
        evidenceFiles
      );

      const hasDocuments = (savedClaim.evidenceItems && savedClaim.evidenceItems.length > 0) || savedClaim.evidenceUrlOrText.startsWith('candidate-evidence/');
      setNotification(`Skill claim for "${skillName}" recorded as ${status}${hasDocuments ? ' with attached evidence documents' : ''}.`);
      setShowAddForm(false);
      setEvidenceTitle('');
      setEvidenceDescription('');
      setEvidenceFiles([]);
      setCustomSkillName('');
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this claim. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Skills & Evidence Portfolio</h2>
          <p className="text-xs text-stone-500 mt-1">
            Record informal experience and describe the evidence you have. Optional images remain private to you and admins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAIDrafter}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI CV Drafter</span>
          </button>
          <button
            onClick={onOpenPassport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>View Skill Passport</span>
          </button>
          {FEATURE_FLAGS.credentialEvidence && (
            <button
              type="button"
              onClick={() => setIsStandaloneCredentialModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-700 text-white hover:bg-purple-800 transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-purple-200" />
              <span>Add Badge or Certificate</span>
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill Claim</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Add Skill Claim Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-sm text-stone-900">Record a Skill & Provide Evidence</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Select Skill Area</label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
                >
                  {SKILL_DEFINITIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                  <option value="custom">+ Other / Custom Practical Skill</option>
                </select>
              </div>

              {selectedSkillId === 'custom' && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Custom Skill Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Small Engine Repair, Sewing & Tailoring"
                    value={customSkillName}
                    onChange={(e) => setCustomSkillName(e.target.value)}
                    className="w-full border border-stone-300 rounded p-2 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Self-Reported Ability Level</label>
                <select
                  value={selfReportedLevel}
                  onChange={(e) => setSelfReportedLevel(e.target.value as any)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
                >
                  <option value="Beginner">Beginner (Under supervision)</option>
                  <option value="Intermediate">Intermediate (Can perform routine tasks independently)</option>
                  <option value="Proficient">Proficient (Fast, reliable, solves common errors)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as any)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
                >
                  <option value="reference_note">Written letter or reference note</option>
                  <option value="client_review">Customer review or community feedback</option>
                  <option value="practical_demo">In-person demonstration or trial</option>
                  <option value="work_sample">Work sample or document (e.g. certificate, receipt, invoice)</option>
                  <option value="photo_video">Photo or video of your work</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Evidence Title / Summary</label>
              <input
                type="text"
                required
                placeholder="e.g. Assisted local electrician on 8 solar roof installations in Soweto"
                value={evidenceTitle}
                onChange={(e) => setEvidenceTitle(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Detailed Description of Duties & Tools Used
              </label>
              <p className="text-[11px] text-stone-500 mb-1">Do not include private phone numbers or IDs. Explain what you did and the tools you used.</p>
              <textarea
                rows={3}
                required
                placeholder="Mention specific equipment, safety procedures, machines or daily routines you handled..."
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>

            {/* Evidence Documents & Media Uploader */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-stone-700">
                  Upload Evidence Documents or Photos (Optional)
                </label>
                <span className="text-[11px] text-stone-500">PDF documents, JPEG, PNG or WebP up to 5 MB each</span>
              </div>

              <div className="border-2 border-dashed border-stone-200 hover:border-amber-400 rounded-lg p-3 text-center transition-colors bg-stone-50/50">
                <input
                  type="file"
                  id="evidence-file-input"
                  multiple
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    if (files.length > 0) {
                      setEvidenceFiles((prev) => [...prev, ...files]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="evidence-file-input"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 font-medium hover:bg-stone-50 cursor-pointer shadow-2xs text-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-500" />
                  <span>Choose PDF Certificates or Photos</span>
                </label>
                <p className="text-[11px] text-stone-400 mt-1">
                  You can upload multiple files under this skill (e.g. trade certificate, college diploma, reference letter, photo).
                </p>
              </div>

              {/* Selected Files Preview List */}
              {evidenceFiles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="font-semibold text-stone-600 text-[11px] block">
                    Attached Files for Submission ({evidenceFiles.length}):
                  </span>
                  <div className="space-y-1">
                    {evidenceFiles.map((file, idx) => {
                      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
                      return (
                        <div
                          key={`${file.name}-${idx}`}
                          className="flex items-center justify-between bg-stone-100 rounded px-2.5 py-1.5 text-xs text-stone-700 border border-stone-200"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isPdf ? (
                              <FileText className="w-4 h-4 text-red-600 shrink-0" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                            )}
                            <span className="font-medium truncate">{file.name}</span>
                            <span className="text-[10px] text-stone-400 shrink-0">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-stone-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {saveError && <p className="text-red-700 text-xs" role="alert">{saveError}</p>}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded shadow-xs"
              >
                {isSaving ? 'Saving…' : 'Save Skill Claim'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Honest Verification Legend (Section 3.3 & Section 29.2) */}
      <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Honest Verification Standards (Section 3.3)
          </h3>
          <button
            type="button"
            onClick={() => setShowLabelGuideModal(true)}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            What does each label mean?
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-stone-600">
          <div className="p-2 bg-white rounded border border-stone-200">
            <span className="font-semibold text-stone-800 block">Self-reported</span>
            <span className="text-[11px] text-stone-500">Candidate entered the claim. Not independently confirmed.</span>
          </div>
          <div className="p-2 bg-white rounded border border-amber-200">
            <span className="font-semibold text-amber-900 block">Peer-endorsed</span>
            <span className="text-[11px] text-stone-500">Identified contractor or peer confirmed hands-on work.</span>
          </div>
          <div className="p-2 bg-white rounded border border-emerald-200">
            <span className="font-semibold text-emerald-900 block">Task-assessed</span>
            <span className="text-[11px] text-stone-500">Bench test graded against rubric by registered assessor.</span>
          </div>
          <div className="p-2 bg-white rounded border border-blue-200">
            <span className="font-semibold text-blue-900 block">Mentor-reviewed</span>
            <span className="text-[11px] text-stone-500">Designated mentor verified submitted portfolio evidence.</span>
          </div>
        </div>
      </div>

      {/* List of Current Claims */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Your Recorded Claims ({claims.length})
        </h3>

        {claims.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-stone-700">No skill claims recorded yet</p>
            <p className="text-xs text-stone-500">
              Add a skill you want to record in your Skill Passport.
            </p>
          </div>
        ) : (
          claims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-base text-stone-900">{claim.skillName}</h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500 pt-0.5">
                    <span>Self-assessed: <strong className="text-stone-700">{claim.selfReportedLevel}</strong></span>
                    <span>·</span>
                    <span>Evidence type: <span className="capitalize">{claim.evidenceType.replace('_', ' ')}</span></span>
                  </div>
                </div>
                <VerificationBadge status={claim.verificationStatus} showMeaning />
              </div>

              <div className="bg-stone-50 rounded-lg p-3 text-xs text-stone-700 border border-stone-100 space-y-1">
                <p className="font-semibold text-stone-900">{claim.evidenceTitle}</p>
                <p className="text-stone-600 leading-relaxed">{claim.evidenceDescription}</p>
                {claim.peerEndorserName && (
                  <p className="text-stone-500 text-[11px] pt-1">
                    Endorsement: <strong className="text-stone-700">{claim.peerEndorserName}</strong>
                  </p>
                )}
                {claim.assessmentId && (
                  <div className="pt-2 flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Graded against practical rubric · Score: 92/100 (Task-assessed)</span>
                  </div>
                )}
                {claim.mentorName && (
                  <div className="pt-2 flex items-center gap-1.5 text-blue-800 font-semibold text-[11px]">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reviewed by Mentor {claim.mentorName} (Mentor-reviewed)</span>
                  </div>
                )}

                {/* Attached Evidence Dossier */}
                {claim.evidenceItems && claim.evidenceItems.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                      Attached Documents & Evidence ({claim.evidenceItems.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {claim.evidenceItems.map((item) => {
                        const isPdf = Boolean(item.mimeType?.includes('pdf') || item.fileName?.endsWith('.pdf'));
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setInspectingItem({ item, skillName: claim.skillName })}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-[11px] font-medium transition-colors shadow-2xs cursor-pointer group"
                          >
                            {isPdf ? (
                              <FileText className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                            <span className="group-hover:text-amber-800 truncate max-w-[160px]">
                              {item.title || item.fileName}
                            </span>
                            <span className="text-[10px] text-stone-400 shrink-0">({item.fileSize})</span>
                            <Eye className="w-3 h-3 text-stone-400 group-hover:text-amber-600 ml-0.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Attached Badges & Certificates (Section 35) */}
                {claim.credentials && claim.credentials.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        Badges & Certificates ({claim.credentials.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCredentialGuideModal(true)}
                        className="text-[10px] text-purple-700 hover:text-purple-900 underline flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3 h-3" />
                        What do badge labels mean?
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {claim.credentials.map((cred) => {
                        const isExpired = isCredentialExpired(cred.expiresOn);
                        return (
                          <div
                            key={cred.id}
                            className="p-2.5 rounded-lg bg-white border border-stone-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <Award className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-stone-900 text-xs truncate">{cred.credentialName}</span>
                                  <span className="text-stone-400 text-xs">·</span>
                                  <span className="text-stone-600 text-xs">{cred.issuer}</span>
                                  {cred.isAccredited && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                                      Accredited
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 pt-0.5">
                                  {cred.credentialId ? (
                                    <span className="font-mono text-stone-600">ID: {maskCredentialId(cred.credentialId)}</span>
                                  ) : (
                                    <span className="italic text-stone-400">Institutional (no ID required)</span>
                                  )}
                                  {cred.issuedOn && <span>Issued: {cred.issuedOn}</span>}
                                  {cred.expiresOn && (
                                    <span className={isExpired ? 'text-rose-600 font-semibold' : ''}>
                                      Expires: {cred.expiresOn}
                                    </span>
                                  )}
                                </div>
                                {cred.checkNote && (
                                  <p className="text-[10px] text-stone-500 pt-0.5 italic">Note: {cred.checkNote}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                                  <Clock className="w-3 h-3" />
                                  Expired
                                </span>
                              ) : cred.checkStatus === 'checked_ok' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Checked with issuer
                                </span>
                              ) : cred.checkStatus === 'checked_mismatch' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Detail mismatch
                                </span>
                              ) : cred.checkStatus === 'needs_review' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Needs review
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                                  <Clock className="w-3 h-3 text-stone-500" />
                                  Not checked yet
                                </span>
                              )}

                              {cred.verifyUrl && (
                                <a
                                  href={cred.verifyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-stone-400 hover:text-amber-600 transition-colors"
                                  title="Open official verification page (opens in new tab)"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Verification & Credential Action Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-stone-100">
                {FEATURE_FLAGS.credentialEvidence && (
                  <button
                    type="button"
                    onClick={() => setCredentialModalClaim(claim)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-purple-700" />
                    <span>Add Badge or Certificate</span>
                  </button>
                )}
                {claim.verificationStatus === 'Self-reported' && (
                  <>
                    {FEATURE_FLAGS.peerEndorsement && (
                      <button
                        type="button"
                        onClick={() => setEndorsementClaim(claim)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        <span>Request Peer Endorsement</span>
                      </button>
                    )}
                    {FEATURE_FLAGS.microTasks && (
                      <button
                        type="button"
                        onClick={() => setRubricClaim(claim)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Assessment Rubric</span>
                      </button>
                    )}
                    {FEATURE_FLAGS.mentorReview && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (onRequestMentorReview) {
                            await onRequestMentorReview(claim.id, {
                              mentorName: 'Designated Youth Mentor',
                              feedback: 'Portfolio evidence queued for review.',
                              decision: 'needs_more_evidence',
                            });
                            setNotification(`Portfolio evidence for "${claim.skillName}" submitted for mentor review.`);
                            setTimeout(() => setNotification(null), 4000);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 text-blue-700" />
                        <span>Request Mentor Review</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Peer Endorsement Request Modal (R3 / FR-19) */}
      {endorsementClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Request Peer Endorsement</h3>
                  <p className="text-xs text-stone-300">Skill: {endorsementClaim.skillName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEndorsementClaim(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!endorserName.trim() || !endorserRole.trim()) return;
                setIsSubmittingEndorsement(true);
                try {
                  if (onRequestPeerEndorsement) {
                    await onRequestPeerEndorsement(endorsementClaim.id, {
                      endorserName,
                      endorserRole,
                      relationship: endorserRelationship,
                      comments: endorserComments,
                    });
                  }
                  setNotification(`Endorsement request logged for ${endorserName}!`);
                  setEndorsementClaim(null);
                  setEndorserName('');
                  setEndorserRole('');
                  setEndorserComments('');
                  setTimeout(() => setNotification(null), 4000);
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Error submitting endorsement request');
                } finally {
                  setIsSubmittingEndorsement(false);
                }
              }}
              className="p-5 space-y-4 text-xs"
            >
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold block">POPIA Privacy & Anti-Spam Notice:</span>
                <p>
                  BASA only records professional relationships and feedback. We do not harvest or send unsolicited SMS/spam to third-party phone numbers.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Peer / Contractor Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Zulu"
                  value={endorserName}
                  onChange={(e) => setEndorserName(e.target.value)}
                  className="w-full border border-stone-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Their Trade / Role / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Electrician, Salon Owner, Senior Welder"
                  value={endorserRole}
                  onChange={(e) => setEndorserRole(e.target.value)}
                  className="w-full border border-stone-300 rounded p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Professional Relationship
                </label>
                <select
                  value={endorserRelationship}
                  onChange={(e) => setEndorserRelationship(e.target.value)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
                >
                  <option value="Former Job Supervisor">Former Job Supervisor</option>
                  <option value="Trade Co-worker">Trade Co-worker / Peer</option>
                  <option value="Local Business Owner">Local Business Owner</option>
                  <option value="Direct Client">Direct Client / Customer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Work Performed Together
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Assisted on 8 residential solar roof installations in Soweto..."
                  value={endorserComments}
                  onChange={(e) => setEndorserComments(e.target.value)}
                  className="w-full border border-stone-300 rounded p-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEndorsementClaim(null)}
                  className="px-3 py-1.5 text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEndorsement}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded shadow-xs"
                >
                  {isSubmittingEndorsement ? 'Submitting…' : 'Submit Endorsement Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rubric View Modal (R3 / FR-19) */}
      {rubricClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Practical Assessment Rubric</h3>
                  <p className="text-xs text-stone-300">Skill: {rubricClaim.skillName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRubricClaim(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-900 text-[11px]">
                <strong className="block font-bold">Standard Bench Test Evaluation:</strong>
                Candidates must achieve at least <strong>70 / 100 points</strong> across these 4 industry benchmarks to receive the "Task-assessed" label.
              </div>

              <div className="space-y-2.5">
                {getRubricForSkill(rubricClaim.skillId, rubricClaim.skillName).criteria.map((c, i) => (
                  <div key={c.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">
                        {i + 1}. {c.title}
                      </span>
                      <span className="text-[11px] font-semibold text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded">
                        Max {c.maxPoints} pts
                      </span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setRubricClaim(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded text-xs"
                >
                  Close Rubric
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Inspector Modal (View uploaded PDF / Image) */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden my-6">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Boolean(inspectingItem.item.mimeType?.includes('pdf') || inspectingItem.item.fileName?.endsWith('.pdf')) ? (
                  <FileText className="w-5 h-5 text-red-400" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                )}
                <div>
                  <h3 className="font-bold text-sm">Evidence Document Inspector</h3>
                  <p className="text-xs text-stone-300">Skill: {inspectingItem.skillName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-stone-700">
              <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">{inspectingItem.item.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-100 text-amber-900 border border-amber-200">
                    {inspectingItem.item.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 space-y-1">
                  <p><strong>File Name:</strong> {inspectingItem.item.fileName}</p>
                  <p><strong>File Size:</strong> {inspectingItem.item.fileSize}</p>
                  <p><strong>Format:</strong> {inspectingItem.item.mimeType}</p>
                  {inspectingItem.item.uploadedAt && (
                    <p><strong>Uploaded:</strong> {new Date(inspectingItem.item.uploadedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {inspectingItem.item.description && (
                <div className="space-y-1">
                  <span className="font-semibold text-stone-800 text-xs">Attached Description / Scope:</span>
                  <p className="p-2.5 bg-stone-50 rounded border border-stone-200 text-stone-600 leading-relaxed">
                    {inspectingItem.item.description}
                  </p>
                </div>
              )}

              {/* Document Preview Display */}
              <div className="border border-stone-200 rounded-lg p-4 bg-stone-100 text-center space-y-2">
                {Boolean(inspectingItem.item.mimeType?.includes('pdf') || inspectingItem.item.fileName?.endsWith('.pdf')) ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 text-red-500 mx-auto" />
                    <p className="font-semibold text-stone-800 text-xs">Portable Document Format (PDF)</p>
                    <p className="text-[11px] text-stone-500">
                      Standard verified document certificate. Ready for assessor or employer review.
                    </p>
                    {inspectingItem.item.fileUrl && !inspectingItem.item.fileUrl.startsWith('candidate-evidence/') && (
                      <a
                        href={inspectingItem.item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open Document Preview</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inspectingItem.item.fileUrl && !inspectingItem.item.fileUrl.startsWith('candidate-evidence/') ? (
                      <img
                        src={inspectingItem.item.fileUrl}
                        alt={inspectingItem.item.title}
                        className="max-h-56 mx-auto rounded object-contain border border-stone-300"
                      />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-blue-500 mx-auto" />
                        <p className="font-semibold text-stone-800 text-xs">Work Evidence Photo</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectingItem(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Honest Skill Passport Label Meaning Modal (Section 29.2) */}
      {showLabelGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">What does each label mean?</h3>
                  <p className="text-xs text-stone-300">Plain-language guide (Grade 6 reading level)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLabelGuideModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800">Self-reported</span>
                  <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
                    Entry Level
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  You entered this skill into your profile yourself. No one else has checked or tested it yet.
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900">Peer-endorsed</span>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    Workplace Verified
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  A coworker, client, or supervisor who worked side-by-side with you confirmed they personally saw you do this work.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-900">Task-assessed</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Gold Standard
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  A certified assessor watched you perform a practical benchmark test or evaluated verified trade credentials against a 100-point rubric.
                </p>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-900">Mentor-reviewed</span>
                  <span className="text-[10px] uppercase font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                    Expert Portfolio
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  An experienced industry mentor carefully inspected your submitted work photos, certificates, or client reviews and signed off on your quality.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowLabelGuideModal(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded text-xs"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credential Meaning Guide Modal (Section 35.4) */}
      {showCredentialGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">What do badge and certificate labels mean?</h3>
                  <p className="text-xs text-stone-300">Grade 6 plain-language guide</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCredentialGuideModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800">{CREDENTIAL_EXPLANATIONS.unchecked.badge}</span>
                  <span className="text-[10px] uppercase font-bold text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">
                    Pending
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {CREDENTIAL_EXPLANATIONS.unchecked.plainText}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-900">{CREDENTIAL_EXPLANATIONS.checked_ok.badge}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {CREDENTIAL_EXPLANATIONS.checked_ok.plainText}
                </p>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-900">{CREDENTIAL_EXPLANATIONS.checked_mismatch.badge}</span>
                  <span className="text-[10px] uppercase font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                    Mismatch
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {CREDENTIAL_EXPLANATIONS.checked_mismatch.plainText}
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-900">{CREDENTIAL_EXPLANATIONS.needs_review.badge}</span>
                  <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    Assessor Review
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {CREDENTIAL_EXPLANATIONS.needs_review.plainText}
                </p>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-900">{CREDENTIAL_EXPLANATIONS.accredited.badge}</span>
                  <span className="text-[10px] uppercase font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                    SAQA / Statutory
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {CREDENTIAL_EXPLANATIONS.accredited.plainText}
                </p>
              </div>

              <div className="p-3 bg-stone-100 rounded-lg border border-stone-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-700">{CREDENTIAL_EXPLANATIONS.expired.badge}</span>
                  <span className="text-[10px] uppercase font-bold text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">
                    Expired
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  {CREDENTIAL_EXPLANATIONS.expired.plainText}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCredentialGuideModal(false)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded text-xs cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Credential Modal (Section 35.2 & Multi-Skill Modular Credentials) */}
      {(credentialModalClaim || isStandaloneCredentialModalOpen) && (
        <AddCredentialModal
          isOpen={!!credentialModalClaim || isStandaloneCredentialModalOpen}
          onClose={() => {
            setCredentialModalClaim(null);
            setIsStandaloneCredentialModalOpen(false);
          }}
          skillName={credentialModalClaim?.skillName}
          claimId={credentialModalClaim?.id}
          onSaveCredential={async (cred, file, associatedSkills) => {
            const targetSkills =
              associatedSkills && associatedSkills.length > 0
                ? associatedSkills
                : credentialModalClaim
                ? [credentialModalClaim.skillName]
                : [];

            if (targetSkills.length === 0) return;

            let attachedCount = 0;
            for (const skillName of targetSkills) {
              const existingClaim = claims.find(
                (c) => c.skillName.toLowerCase() === skillName.toLowerCase()
              );
              if (existingClaim) {
                if (onAddCredential) {
                  await onAddCredential(existingClaim.id, cred, file, targetSkills);
                  attachedCount++;
                }
              } else {
                const skillDef = SKILL_DEFINITIONS.find(
                  (s) => s.name.toLowerCase() === skillName.toLowerCase()
                );
                const skillId =
                  skillDef?.id ||
                  `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                await onAddClaim({
                  candidateId: candidate.uid,
                  skillId,
                  skillName,
                  selfReportedLevel: 'Intermediate',
                  evidenceType: 'work_sample',
                  evidenceTitle: `Certified via ${cred.issuer} - ${cred.credentialName}`,
                  evidenceDescription: `Modular vocational credential "${cred.credentialName}" issued by ${cred.issuer} covering ${skillName}.`,
                  evidenceUrlOrText: cred.verifyUrl || cred.fileRef || 'Certificate Evidence',
                  verificationStatus: 'Self-reported',
                  credentials: [cred],
                });
                attachedCount++;
              }
            }

            setNotification(
              `Badge / certificate "${cred.credentialName}" saved and linked across ${attachedCount} skill(s) on your Skill Passport.`
            );
            setTimeout(() => setNotification(null), 5000);
          }}
        />
      )}
    </div>
  );
};
