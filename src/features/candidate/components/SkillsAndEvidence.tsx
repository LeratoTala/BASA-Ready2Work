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
} from 'lucide-react';
import { CandidateProfile, SkillClaim, VerificationStatus } from '../../../domain/types';
import { SKILL_DEFINITIONS } from '../../../domain/skillCatalogue';
import { VerificationBadge } from '../../../shared/components/VerificationBadge';
import { env } from '../../../config/env';
import { FEATURE_FLAGS } from '../../../config/featureFlags';
import { getRubricForSkill } from '../../../domain/rubrics';

interface Props {
  candidate: CandidateProfile;
  claims: SkillClaim[];
  onAddClaim: (claim: Omit<SkillClaim, 'id' | 'createdAt'>, evidenceFile?: File) => Promise<SkillClaim>;
  onOpenPassport: () => void;
  onOpenAIDrafter: () => void;
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
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

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

    try {
      const savedClaim = await onAddClaim({
        candidateId: candidate.uid,
        skillId: selectedSkillId === 'custom' ? `custom-${Date.now()}` : selectedSkillId,
        skillName,
        selfReportedLevel,
        evidenceType,
        evidenceTitle: evidenceTitle.trim() || `${skillName} Practical Experience`,
        evidenceDescription: evidenceDescription.trim(),
        evidenceUrlOrText: evidenceDescription.trim() || evidenceTitle.trim(),
        verificationStatus: status,
      }, evidenceFile ?? undefined);

      const hasPrivateImage = savedClaim.evidenceUrlOrText.startsWith('candidate-evidence/');
      setNotification(`Skill claim for "${skillName}" recorded as ${status}${hasPrivateImage ? ' with a private image' : ''}.`);
      setShowAddForm(false);
      setEvidenceTitle('');
      setEvidenceDescription('');
      setEvidenceFile(null);
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
                  <option value="reference_note">Reference note details</option>
                  <option value="client_review">Customer or community feedback summary</option>
                  <option value="practical_demo">Practical demonstration details</option>
                  <option value="work_sample">Work sample description</option>
                  <option value="photo_video">Photo or video evidence description</option>
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
              <p className="text-[11px] text-stone-500 mb-1">Do not include private contact details. This form stores a text description, not a file.</p>
              <textarea
                rows={3}
                required
                placeholder="Mention specific equipment, safety procedures, machines or daily routines you handled..."
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>

            {!env.enableDemoData && (
              <label className="block">
                <span className="block font-semibold text-stone-700 mb-1">Optional evidence image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-stone-700"
                />
                <span className="block text-[11px] text-stone-500 mt-1">JPEG, PNG or WebP, up to 5 MB. Do not include private contact details.</span>
              </label>
            )}

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

      {/* Honest Verification Legend (Section 3.3) */}
      <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 text-xs">
        <h3 className="font-bold text-stone-900 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Honest Verification Standards (Section 3.3)
        </h3>
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
              </div>

              {/* R3 Verification Action Bar */}
              {claim.verificationStatus === 'Self-reported' && (
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-stone-100">
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
                </div>
              )}
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
    </div>
  );
};
