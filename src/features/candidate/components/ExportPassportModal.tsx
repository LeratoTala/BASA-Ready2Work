import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  FileText,
  Printer,
  ShieldCheck,
  ExternalLink,
  Linkedin,
} from 'lucide-react';
import { CandidateProfile, SkillClaim } from '../../../domain/types';
import { generateLinkedInSummary, generatePassportPdf } from '../../../services/passportExport';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateProfile;
  claims: SkillClaim[];
}

export const ExportPassportModal: React.FC<Props> = ({ isOpen, onClose, candidate, claims }) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'linkedin'>('pdf');
  const [copied, setCopied] = useState(false);
  const [linkedInText, setLinkedInText] = useState(() => generateLinkedInSummary(candidate, claims));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handleCopyLinkedIn = () => {
    navigator.clipboard?.writeText(linkedInText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generatePassportPdf(candidate, claims);
    } catch (e) {
      console.error('Error generating PDF:', e);
      window.print();
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 500);
    }
  };

  const handleOpenLinkedIn = () => {
    handleCopyLinkedIn();
    const passportUrl = `https://basa-ready2work.gov.za/passport/${candidate.uid}`;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(passportUrl)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                Export & Credential Sharing
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mt-1">
              Export Verified Skill Passport
            </h3>
            <p className="text-xs text-stone-400">
              Download a standardized official PDF or share directly on LinkedIn.
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="bg-stone-100 flex items-center border-b border-stone-200 px-6 py-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Standardized PDF Document</span>
          </button>
          <button
            onClick={() => setActiveTab('linkedin')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              activeTab === 'linkedin'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Linkedin className="w-3.5 h-3.5 text-blue-600" />
            <span>Shareable LinkedIn Summary</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">
                      Official BASA Vocational Credential (A4 Format)
                    </h4>
                    <p className="text-stone-500 text-xs">
                      Includes passport ID ({candidate.uid.toUpperCase()}), honest verification stamps,
                      assessor rubric grades, and POPIA protection notice.
                    </p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                    Verified
                  </span>
                </div>

                {/* Preview Box */}
                <div className="bg-white border border-stone-200 rounded p-4 text-[11px] font-mono text-stone-700 space-y-1.5 shadow-xs">
                  <div className="text-stone-900 font-bold border-b border-stone-100 pb-1 flex justify-between">
                    <span>BASA: READY2WORK · VOCATIONAL SKILL PASSPORT</span>
                    <span>ID: {candidate.uid.toUpperCase()}</span>
                  </div>
                  <p>Candidate: {candidate.fullName}</p>
                  <p>Headline: {candidate.headline}</p>
                  <p>Location: {candidate.locationArea} (South Africa)</p>
                  <div className="pt-1 text-stone-600">
                    <p className="font-semibold text-stone-800">Verified Evidence Summary ({claims.length} Skills):</p>
                    {claims.map((c, i) => (
                      <p key={c.id}>
                        {i + 1}. {c.skillName} — [{c.verificationStatus}]
                      </p>
                    ))}
                  </div>
                  <p className="pt-1 text-[10px] text-stone-400">
                    Compliant with South African POPIA · Zero Upfront Fee Guarantee
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-stone-500 text-xs">
                  Ready to submit to employers, funders, or training providers.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 font-semibold text-stone-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'linkedin' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200/60 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2">
                <Linkedin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong>LinkedIn-Optimized Post & Profile Format:</strong> Formatted with verified credentials,
                  honest evidence badges, hashtags, and your direct verification URL. You can customize the wording before copying.
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Editable LinkedIn Post / Summary Text
                </label>
                <textarea
                  rows={9}
                  value={linkedInText}
                  onChange={(e) => setLinkedInText(e.target.value)}
                  className="w-full text-xs font-mono border border-stone-300 rounded-lg p-3 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {copied ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" /> Copied to clipboard! Ready to paste into LinkedIn.
                    </span>
                  ) : (
                    <span className="text-stone-500 text-xs">
                      Copy the text or open LinkedIn share window directly.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLinkedIn}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 font-semibold text-stone-800 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>

                  <button
                    onClick={handleOpenLinkedIn}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0077b5] hover:bg-[#006097] text-white font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>Copy & Open LinkedIn</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>South Africa POPIA Privacy Compliant Credential</span>
          </div>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-900 font-medium">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
