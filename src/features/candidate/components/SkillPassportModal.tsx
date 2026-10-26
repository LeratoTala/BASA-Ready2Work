import { maskEmail, maskPhone, NOT_PROVIDED } from '../../../shared/maskContact';
import React, { useState } from 'react';
import { X, Download, ShieldCheck, MapPin, Award, Linkedin } from 'lucide-react';
import { CandidateProfile, SkillClaim } from '../../../domain/types';
import { VerificationBadge } from '../../../shared/components/VerificationBadge';
import { generatePassportPdf } from '../../../services/passportExport';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateProfile;
  claims: SkillClaim[];
  onOpenExport?: () => void;
}

export const SkillPassportModal: React.FC<Props> = ({ isOpen, onClose, candidate, claims, onOpenExport }) => {
  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: 'skill-passport',
  });

  const [maskContact, setMaskContact] = useState(candidate.popiaVisibility !== 'public_link');

  if (!isOpen) return null;

  const taskAssessedCount = claims.filter((c) => c.verificationStatus === 'Task-assessed').length;
  const peerEndorsedCount = claims.filter((c) => c.verificationStatus === 'Peer-endorsed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Passport Header */}
        <div className="bg-stone-900 text-white p-6 border-b border-stone-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                  BASA Skill Passport
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">{candidate.fullName}</h3>
              <p className="text-sm text-stone-300 font-medium">{candidate.headline}</p>
              <div className="flex items-center gap-3 text-xs text-stone-400 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {candidate.locationArea}
                </span>
                <span>·</span>
                <span className="capitalize">Availability: {candidate.availability.replace('_', ' ')}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1 rounded hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Credibility Summary */}
          <div className="mt-5 grid grid-cols-3 gap-2 bg-stone-800/80 rounded-lg p-3 text-center border border-stone-700/60">
            <div>
              <p className="text-xs text-stone-400">Total Skills</p>
              <p className="text-lg font-bold text-white">{claims.length}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-400">Task-Assessed</p>
              <p className="text-lg font-bold text-emerald-400">{taskAssessedCount}</p>
            </div>
            <div>
              <p className="text-xs text-amber-400">Peer-Endorsed</p>
              <p className="text-lg font-bold text-amber-400">{peerEndorsedCount}</p>
            </div>
          </div>
        </div>

        {/* POPIA Privacy Warning & Toggle */}
        <div className="bg-amber-50/60 border-b border-amber-200/60 px-6 py-2.5 text-xs text-stone-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Contact display: <strong>{maskContact ? 'Masked' : 'Visible in this preview'}</strong>
            </span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-stone-600 hover:text-stone-900">
            <input
              type="checkbox"
              checked={maskContact}
              onChange={(e) => setMaskContact(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Mask Phone & Email until shortlisted</span>
          </label>
        </div>

        {/* Passport Body: Evidence Claims */}
        <div className="p-6 space-y-6 max-h-[55vh] overflow-y-auto">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Skills & Evidence Trail
            </h4>

            {claims.length === 0 ? (
              <p className="text-sm text-stone-500 italic">No skill claims recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 rounded-lg border border-stone-200 bg-white hover:border-stone-300 transition-all space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-sm text-stone-900">{claim.skillName}</h5>
                        <p className="text-xs text-stone-500">
                          Self-Reported Level: <span className="font-medium text-stone-700">{claim.selfReportedLevel}</span>
                        </p>
                      </div>
                      <VerificationBadge status={claim.verificationStatus} showMeaning />
                    </div>

                    <div className="bg-stone-50 rounded p-2.5 text-xs text-stone-700 border border-stone-100 space-y-1">
                      <p className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        {claim.evidenceTitle}
                      </p>
                      <p className="text-stone-600">{claim.evidenceDescription}</p>
                      {claim.peerEndorserName && (
                        <p className="text-stone-500 text-[11px] pt-1">
                          Endorsed by: <span className="font-medium text-stone-700">{claim.peerEndorserName}</span>
                        </p>
                      )}
                      {claim.credentials && claim.credentials.length > 0 && (
                        <div className="pt-2 border-t border-stone-200/60 space-y-1">
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                            Credentials & Badges ({claim.credentials.length}):
                          </span>
                          <div className="space-y-1">
                            {claim.credentials.map((cred) => (
                              <div
                                key={cred.id}
                                className="flex items-center justify-between text-xs bg-white p-2 rounded border border-stone-200"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  <span className="font-semibold text-stone-800 truncate">{cred.credentialName}</span>
                                  <span className="text-stone-400">·</span>
                                  <span className="text-stone-600 truncate">{cred.issuer}</span>
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ml-2 ${
                                  cred.checkStatus === 'checked_ok'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : cred.checkStatus === 'checked_mismatch'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-stone-100 text-stone-600'
                                }`}>
                                  {cred.checkStatus === 'checked_ok' ? 'Checked with issuer' : cred.checkStatus === 'checked_mismatch' ? 'Detail mismatch' : 'Not checked yet'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Details (With Masking) */}
          <div className="border-t border-stone-200 pt-4 text-xs text-stone-600 space-y-1">
            <h5 className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">Direct Contact</h5>
            <p>
              Phone:{' '}
              {maskContact ? (
                <span className="font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                  {maskPhone(candidate.phone)} (Masked for POPIA Privacy)
                </span>
              ) : (
                <span className="font-mono font-medium text-stone-800">{candidate.phone || NOT_PROVIDED}</span>
              )}
            </p>
            <p>
              Email:{' '}
              {maskContact ? (
                <span className="font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                  {maskEmail(candidate.contactEmail)} (Available to shortlisted employers)
                </span>
              ) : (
                <span className="font-medium text-stone-800">{candidate.contactEmail || NOT_PROVIDED}</span>
              )}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <span>BASA: Ready2Work · Skills and evidence summary</span>
          <div className="flex items-center gap-2">
            {onOpenExport && (
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold cursor-pointer"
              >
                <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                <span>LinkedIn Export</span>
              </button>
            )}
            <button
              onClick={() => generatePassportPdf(candidate, claims)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
