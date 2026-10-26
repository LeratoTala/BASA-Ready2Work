import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Phone,
  Globe,
  Info,
} from 'lucide-react';
import {
  BusinessRegistrationType,
  BusinessVerificationDetails,
  BUSINESS_REGISTRATION_TYPE_LABELS,
  EmployerProfile,
} from '../../../domain/types';
import { validateBusinessVerification } from '../../../domain/businessVerification';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employer: EmployerProfile;
  onSubmitVerification: (
    employerUid: string,
    details: BusinessVerificationDetails,
    file?: File
  ) => Promise<void> | void;
}

export const RequestEmployerVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employer,
  onSubmitVerification,
}) => {
  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: 'request-employer-verification',
  });

  const existing = employer.verificationDetails;

  const [registrationType, setRegistrationType] = useState<BusinessRegistrationType>(
    existing?.registrationType || 'cipc_pty_ltd'
  );
  const [legalRegisteredName, setLegalRegisteredName] = useState(
    existing?.legalRegisteredName || employer.businessName || ''
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    existing?.registrationNumber || ''
  );
  const [taxNumber, setTaxNumber] = useState(existing?.taxNumber || '');
  const [physicalAddress, setPhysicalAddress] = useState(
    existing?.physicalAddress || employer.locationArea || ''
  );
  const [officialPhone, setOfficialPhone] = useState(
    existing?.officialPhone || ''
  );
  const [officialWebsite, setOfficialWebsite] = useState(
    existing?.officialWebsite || ''
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState(existing?.documentFileName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setFormErrors(['File size exceeds 10 MB limit. Please upload a smaller document.']);
        return;
      }
      setSelectedFile(file);
      setExistingFileName(file.name);
      setFormErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const details: Partial<BusinessVerificationDetails> = {
      registrationType,
      legalRegisteredName: legalRegisteredName.trim(),
      registrationNumber: registrationNumber.trim(),
      taxNumber: taxNumber.trim() || undefined,
      physicalAddress: physicalAddress.trim(),
      officialPhone: officialPhone.trim(),
      officialWebsite: officialWebsite.trim() || undefined,
      documentFileName: selectedFile ? selectedFile.name : existingFileName || undefined,
    };

    const validation = validateBusinessVerification(details);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitVerification(employer.uid, details as BusinessVerificationDetails, selectedFile || undefined);
      setSuccessMessage('Business registration submitted! Platform administrators are reviewing your details.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setFormErrors([err.message || 'Failed to submit verification request. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTypeMeta = BUSINESS_REGISTRATION_TYPE_LABELS[registrationType];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 border-b border-stone-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                  Anti-Fraud & Legitimacy Safeguard
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                  Company Registration & Verification
                </h2>
                <p className="text-xs text-stone-300 mt-0.5">
                  Prove your business is formally registered to publish jobs on BASA.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Guidance Card */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 flex items-start gap-3 text-xs text-amber-950">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900">Why does BASA verify employer registration?</p>
            <p className="text-amber-800 leading-relaxed">
              Jobseekers are vulnerable to fake job listings, upfront application fees, and exploitative ghost employers.
              To maintain fair opportunities, every employer must be verified against official South African records (CIPC, SARS, or Municipal Trading Permits).
            </p>
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formErrors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Please correct the following:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {formErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Step 1: Registration Type */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Business Legal Entity Type <span className="text-red-500">*</span>
              </label>
              <select
                value={registrationType}
                onChange={(e) => setRegistrationType(e.target.value as BusinessRegistrationType)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {Object.entries(BUSINESS_REGISTRATION_TYPE_LABELS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500 mt-1 italic">
                {currentTypeMeta?.description}
              </p>
            </div>

            {/* Step 2: Legal Registered Name */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Official Registered Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={legalRegisteredName}
                  onChange={(e) => setLegalRegisteredName(e.target.value)}
                  placeholder="e.g. Zola Artisan Coffee & Roastery (Pty) Ltd"
                  required
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-9"
                />
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                The exact legal name listed on your CIPC certificate or municipal permit.
              </p>
            </div>

            {/* Step 3: Registration / CIPC / Permit Number & Tax Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Registration / Permit Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder={
                    registrationType === 'cipc_pty_ltd'
                      ? 'e.g. 2022/481920/07'
                      : registrationType === 'cipc_close_corp'
                      ? 'e.g. CK2004/012345/23'
                      : registrationType === 'municipal_trade_permit'
                      ? 'e.g. JHB-TRD-2024-8842'
                      : 'e.g. 2021/123456/07'
                  }
                  required
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  SARS Tax / VAT Reference <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="e.g. 9481920182 (10 digits)"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Step 4: Physical Operating Address */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Physical Operating Address in South Africa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="e.g. 142 Fox Street, Marshalltown, Johannesburg CBD, 2001"
                  required
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-9"
                />
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Step 5: Official Contact Phone & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Official Business Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={officialPhone}
                    onChange={(e) => setOfficialPhone(e.target.value)}
                    placeholder="e.g. +27 11 832 4410 or 082 123 4567"
                    required
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-9"
                  />
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Company Website / Public Social Page <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={officialWebsite}
                    onChange={(e) => setOfficialWebsite(e.target.value)}
                    placeholder="e.g. https://mycompany.co.za"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-9"
                  />
                  <Globe className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Step 6: Document Upload (CIPC CoR14.3 / Municipal Permit) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Upload Registration Certificate / Trading Permit
              </label>
              <div className="mt-1 flex justify-center px-4 pt-4 pb-4 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl transition-colors bg-stone-50/50">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-7 w-7 text-stone-400" />
                  <div className="flex text-xs text-stone-600 justify-center">
                    <label className="relative cursor-pointer font-semibold text-amber-700 hover:text-amber-800 focus-within:outline-none">
                      <span>Upload CIPC CoR14.3 or Permit</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-[11px] text-stone-500">PDF, PNG, JPG up to 10 MB</p>
                </div>
              </div>

              {(selectedFile || existingFileName) && (
                <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">
                      {selectedFile ? selectedFile.name : existingFileName}
                    </span>
                    {selectedFile && (
                      <span className="text-[10px] text-emerald-600 shrink-0">
                        ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setExistingFileName('');
                    }}
                    className="text-stone-400 hover:text-stone-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-stone-500">
              Verified by BASA platform administrators before jobs become publicly visible.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-stone-300 text-stone-700 font-semibold text-xs rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting…' : 'Submit for Verification'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
