import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  ShieldCheck,
  Briefcase,
  Users,
  Edit3,
  CheckCircle2,
  DollarSign,
  Plus,
  Power,
  ChevronRight,
} from 'lucide-react';
import { Application, EmployerProfile, Job } from '../../../domain/types';

interface Props {
  employer: EmployerProfile;
  jobs: Job[];
  applications: Application[];
  onUpdateEmployerProfile: (updates: Partial<EmployerProfile>) => void;
  onOpenCreateJob: () => void;
  onToggleJobStatus: (jobId: string) => void;
  onViewApplicants: () => void;
}

export const EmployerProfilePage: React.FC<Props> = ({
  employer,
  jobs,
  applications,
  onUpdateEmployerProfile,
  onOpenCreateJob,
  onToggleJobStatus,
  onViewApplicants,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(employer.businessName);
  const [industry, setIndustry] = useState(employer.industry);
  const [description, setDescription] = useState(employer.description);
  const [locationArea, setLocationArea] = useState(employer.locationArea);
  const [contactEmail, setContactEmail] = useState(employer.contactEmail);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeJobs = jobs.filter((j) => j.status === 'open');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmployerProfile({
      businessName,
      industry,
      description,
      locationArea,
      contactEmail,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Business Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 text-amber-500 font-extrabold text-2xl flex items-center justify-center shrink-0 border border-stone-800">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Employer Business Profile
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Employer (Zero Upfront Fees)
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900">
                {employer.businessName}
              </h1>
              <p className="text-xs text-stone-500 font-medium">Industry: {employer.industry}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 pt-1">
                <span className="flex items-center gap-1 font-medium text-stone-700">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {employer.locationArea}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  {employer.contactEmail}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Company Info'}</span>
            </button>

            <button
              onClick={onOpenCreateJob}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post New Job</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Company profile updated successfully!</span>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-stone-100 text-xs text-stone-700">
          <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-1">
            Company Overview & Mission
          </h4>
          <p className="leading-relaxed text-stone-600">{employer.description}</p>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
            Update Business Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Industry</label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Business Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Location Area</label>
              <input
                type="text"
                required
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Contact Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
            >
              Save Company Changes
            </button>
          </div>
        </form>
      )}

      {/* Active Listings Storefront */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-bold text-base text-stone-900">
              Active Opportunities Posted by {employer.businessName} ({jobs.length})
            </h3>
            <p className="text-xs text-stone-500">
              Candidates discover these opportunities and apply using their Skill Passport.
            </p>
          </div>
          <button
            onClick={onOpenCreateJob}
            className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
          >
            + Post another job
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const jobApps = applications.filter((a) => a.jobId === job.id);
            const isOpen = job.status === 'open';

            return (
              <div
                key={job.id}
                className="p-5 rounded-xl border border-stone-200 bg-white hover:border-amber-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {isOpen ? 'Active' : 'Closed'}
                      </span>
                      <h4 className="font-bold text-base text-stone-900 mt-1">{job.title}</h4>
                    </div>
                    <button
                      onClick={() => onToggleJobStatus(job.id)}
                      className="text-xs px-2.5 py-1 rounded border border-stone-300 hover:bg-stone-50 text-stone-700 cursor-pointer"
                    >
                      {isOpen ? 'Close' : 'Reopen'}
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2">{job.description}</p>

                  <div className="text-xs font-semibold text-stone-900">
                    R{job.compensationAmount} / {job.compensationUnit} · {job.locationArea}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">
                    <strong>{jobApps.length}</strong> applicants
                  </span>
                  <button
                    onClick={onViewApplicants}
                    className="text-amber-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Candidates</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
