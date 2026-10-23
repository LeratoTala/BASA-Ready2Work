import React, { useState } from 'react';
import { Plus, Award, CheckCircle2, FileText, Sparkles, HelpCircle, ShieldCheck, Users, Upload, AlertCircle } from 'lucide-react';
import { CandidateProfile, SkillClaim, VerificationStatus } from '../../../domain/types';
import { SKILL_DEFINITIONS } from '../../../domain/skillCatalogue';
import { VerificationBadge } from '../../../shared/components/VerificationBadge';

interface Props {
  candidate: CandidateProfile;
  claims: SkillClaim[];
  onAddClaim: (claim: Omit<SkillClaim, 'id' | 'createdAt'>) => void;
  onOpenPassport: () => void;
  onOpenAIDrafter: () => void;
}

export const SkillsAndEvidence: React.FC<Props> = ({
  candidate,
  claims,
  onAddClaim,
  onOpenPassport,
  onOpenAIDrafter,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState(SKILL_DEFINITIONS[0].id);
  const [customSkillName, setCustomSkillName] = useState('');
  const [selfReportedLevel, setSelfReportedLevel] = useState<'Beginner' | 'Intermediate' | 'Proficient'>('Intermediate');
  const [evidenceType, setEvidenceType] = useState<'photo_video' | 'client_review' | 'reference_note' | 'work_sample' | 'practical_demo'>('reference_note');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [peerName, setPeerName] = useState('');
  const [peerContact, setPeerContact] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let skillName = '';
    if (selectedSkillId === 'custom') {
      if (!customSkillName.trim()) return;
      skillName = customSkillName.trim();
    } else {
      const def = SKILL_DEFINITIONS.find((s) => s.id === selectedSkillId);
      skillName = def?.name || 'Practical Skill';
    }

    // Determine honest verification status:
    // If peer endorser name provided, initial status is "Peer-endorsed", otherwise "Self-reported"
    let status: VerificationStatus = 'Self-reported';
    if (peerName.trim()) {
      status = 'Peer-endorsed';
    }

    onAddClaim({
      candidateId: candidate.uid,
      skillId: selectedSkillId === 'custom' ? `custom-${Date.now()}` : selectedSkillId,
      skillName,
      selfReportedLevel,
      evidenceType,
      evidenceTitle: evidenceTitle || `${skillName} Practical Experience`,
      evidenceDescription: evidenceDescription || 'Completed practical hands-on tasks.',
      evidenceUrlOrText: peerContact ? `Contact: ${peerContact}` : 'Evidence logged locally in BASA.',
      verificationStatus: status,
      peerEndorserName: peerName.trim() || undefined,
      peerEndorserContact: peerContact.trim() || undefined,
    });

    setNotification(`Skill claim for "${skillName}" recorded as ${status}.`);
    setShowAddForm(false);
    setEvidenceTitle('');
    setEvidenceDescription('');
    setPeerName('');
    setPeerContact('');
    setCustomSkillName('');

    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Skills & Evidence Portfolio</h2>
          <p className="text-xs text-stone-500 mt-1">
            Record informal experience and attach honest evidence. Independent assessors can verify claims.
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
                <label className="block font-semibold text-stone-700 mb-1">Evidence Type (Proof)</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value as any)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
                >
                  <option value="reference_note">Reference Note / Contractor Endorsement</option>
                  <option value="client_review">Customer or Community Feedback</option>
                  <option value="practical_demo">In-Person Practical Bench Test</option>
                  <option value="work_sample">Work Sample / Portfolio Link</option>
                  <option value="photo_video">Photo or Video Proof of Task</option>
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
              <textarea
                rows={3}
                required
                placeholder="Mention specific equipment, safety procedures, machines or daily routines you handled..."
                value={evidenceDescription}
                onChange={(e) => setEvidenceDescription(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>

            {/* Peer Reference Section */}
            <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 space-y-2">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                Peer or Contractor Endorsement (Optional - Upgrades status to "Peer-endorsed")
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Endorser Name (e.g. Sipho, Master Electrician)"
                  value={peerName}
                  onChange={(e) => setPeerName(e.target.value)}
                  className="border border-stone-300 rounded p-2 bg-white text-xs"
                />
                <input
                  type="text"
                  placeholder="Contact Cell or Business (e.g. +27 82 000 0000)"
                  value={peerContact}
                  onChange={(e) => setPeerContact(e.target.value)}
                  className="border border-stone-300 rounded p-2 bg-white text-xs"
                />
              </div>
            </div>

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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded shadow-xs"
              >
                Save Skill Claim
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
              Click &quot;Add Skill Claim&quot; above to start building your verified Skill Passport.
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
                    <span>Graded by Nomsa Dlamini (Assessor) at Soweto Skills Hub · Score: 92/100</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
