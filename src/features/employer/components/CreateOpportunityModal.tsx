import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, MapPin, Briefcase, Trash2, Award, AlertCircle, Sparkles } from 'lucide-react';
import { Job, WorkMode, CompensationUnit, EngagementType, ENGAGEMENT_TYPE_METADATA } from '../../../domain/types';
import { SKILL_DEFINITIONS } from '../../../domain/skillCatalogue';
import { canEmployerPostActiveJob, EmployerPlanId } from '../../../config/plans';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'reportCount' | 'employerId' | 'employerName' | 'employerVerified'>) => void;
  defaultLocation?: string;
  activeJobCount?: number;
  employerPlan?: EmployerPlanId;
  onOpenUpgrade?: () => void;
}

export const CreateOpportunityModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultLocation = 'Johannesburg CBD',
  activeJobCount = 0,
  employerPlan = 'free',
  onOpenUpgrade,
}) => {
  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: 'create-opportunity',
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Carry out assigned hands-on tasks safely and punctually',
    'Follow hygiene and equipment maintenance protocols',
  ]);
  const [newResp, setNewResp] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([SKILL_DEFINITIONS[0].id]);
  const [customSkills, setCustomSkills] = useState<{ id: string; name: string }[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [locationArea, setLocationArea] = useState(defaultLocation);
  const [workMode, setWorkMode] = useState<WorkMode>('In-person');
  const [compensationAmount, setCompensationAmount] = useState<number>(450);
  const [compensationUnit, setCompensationUnit] = useState<CompensationUnit>('daily');
  const [engagementType, setEngagementType] = useState<EngagementType>('casual');
  const [startDate, setStartDate] = useState('2026-10-30');
  const [endDate, setEndDate] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('2026-10-28');

  if (!isOpen) return null;

  const handleAddResp = () => {
    if (!newResp.trim()) return;
    setResponsibilities((prev) => [...prev, newResp.trim()]);
    setNewResp('');
  };

  const handleRemoveResp = (idx: number) => {
    setResponsibilities((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;

    // 1. Check if matches standard skill catalogue (case-insensitive)
    const existingStd = SKILL_DEFINITIONS.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingStd) {
      if (!selectedSkillIds.includes(existingStd.id)) {
        setSelectedSkillIds((prev) => [...prev, existingStd.id]);
      }
      setCustomSkillInput('');
      return;
    }

    // 2. Check if already added to custom skills
    const existingCustom = customSkills.find(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingCustom) {
      if (!selectedSkillIds.includes(existingCustom.id)) {
        setSelectedSkillIds((prev) => [...prev, existingCustom.id]);
      }
      setCustomSkillInput('');
      return;
    }

    // 3. Create new custom skill with deterministic slug ID
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newId = `custom-skill-${slug || Date.now()}`;
    const newSkill = { id: newId, name: trimmed };

    setCustomSkills((prev) => [...prev, newSkill]);
    setSelectedSkillIds((prev) => [...prev, newId]);
    setCustomSkillInput('');
  };

  const allSkills = [
    ...SKILL_DEFINITIONS.map((s) => ({ id: s.id, name: s.name })),
    ...customSkills,
  ];

  const filteredSkills = SKILL_DEFINITIONS.filter((s) => {
    const matchesCategory =
      activeCategoryFilter === 'All' || s.category === activeCategoryFilter;
    const matchesSearch =
      !skillSearchQuery.trim() ||
      s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(skillSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedSkillIds.length === 0) return;

    const skillNames = selectedSkillIds
      .map((id) => allSkills.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[];

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      responsibilities: responsibilities.length > 0 ? responsibilities : ['Complete tasks reliably'],
      requiredSkillIds: selectedSkillIds,
      requiredSkillNames: skillNames,
      locationArea: locationArea.trim(),
      workMode,
      compensationAmount: Number(compensationAmount),
      compensationCurrency: 'ZAR',
      compensationUnit,
      engagementType,
      startDate,
      endDate: endDate || undefined,
      applicationDeadline,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6">
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Post New Opportunity (Section 3.4)</h3>
            <p className="text-xs text-stone-400">
              Clear compensation in ZAR and transparent task requirements.
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Section 39.2 Plan Gating Check */}
          {!canEmployerPostActiveJob(activeJobCount, employerPlan).allowed && (
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-950 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <strong className="block font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Plan Active Job Limit Reached
                </strong>
                <p className="text-stone-700">
                  {canEmployerPostActiveJob(activeJobCount, employerPlan).reason}
                </p>
              </div>
              {onOpenUpgrade && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUpgrade();
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Request Upgrade</span>
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Opportunity Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Weekend Barista, Solar Installation Assistant, Stock Merchandiser"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-stone-300 rounded p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Brief Description</label>
            <textarea
              rows={3}
              required
              placeholder="Explain the work environment, equipment used, and candidate expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-stone-300 rounded p-2 text-xs"
            />
          </div>

          {/* Opportunity & Absorption Pathway (What should applicants expect?) */}
          <div className="space-y-1.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <label className="block font-bold text-stone-900 text-xs">
              Absorption Pathway &amp; Opportunity Type *
            </label>
            <p className="text-[11px] text-stone-500">
              Specify the engagement type so applicants apply knowing exactly what to expect (permanent absorption, internship, casual shifts, etc.).
            </p>
            <select
              value={engagementType}
              onChange={(e) => setEngagementType(e.target.value as EngagementType)}
              className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800 font-semibold"
            >
              <option value="permanent">Permanent Position (Ongoing career employment with full absorption)</option>
              <option value="internship">Graduate / Practical Internship (Structured entry-level training with absorption potential)</option>
              <option value="micro_internship">Micro-Internship / Project Gig (Short-term trial / 1-4 weeks to evaluate mutual fit)</option>
              <option value="casual">Casual / Relief Work (Flexible shift-based or seasonal coverage)</option>
              <option value="learnership">Learnership / Apprenticeship (Vocational trade training combining theory & practical on-site work)</option>
              <option value="contract">Fixed-Term Contract (Agreed months duration for specific project deliverables)</option>
            </select>
            <div className="text-[11px] text-stone-600 bg-white p-2 rounded border border-stone-200 mt-1.5">
              <span className="font-semibold text-stone-800">What applicant will expect: </span>
              {ENGAGEMENT_TYPE_METADATA[engagementType]?.expectation}
            </div>
          </div>

          {/* Compensation in ZAR (Explicit units per Section 3.4) */}
          <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 space-y-2">
            <span className="font-semibold text-stone-800 block">
              Compensation Terms (ZAR - South African Rands)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 mb-1">Amount (R)</label>
                <input
                  type="number"
                  min="20"
                  step="5"
                  required
                  value={compensationAmount}
                  onChange={(e) => setCompensationAmount(Number(e.target.value))}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1">Payment Frequency / Unit</label>
                <select
                  value={compensationUnit}
                  onChange={(e) => setCompensationUnit(e.target.value as any)}
                  className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
                >
                  <option value="hourly">Hourly (e.g. R65/hr for shifts)</option>
                  <option value="daily">Daily (e.g. R450/day for day-rate tasks)</option>
                  <option value="weekly">Weekly (e.g. R1,500/week)</option>
                  <option value="fortnightly">Fortnightly (e.g. R3,000/fortnight - every 2 weeks)</option>
                  <option value="monthly">Monthly (e.g. R5,500/month stipend or salary)</option>
                  <option value="fixed">Fixed / Project (e.g. R2,500 total task)</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              BASA requires fair compensation with zero unpaid trial shifts or upfront registration fees.
            </p>
          </div>

          {/* Location & Work Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Broad Location Area</label>
              <input
                type="text"
                required
                placeholder="e.g. Midrand, Johannesburg"
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as any)}
                className="w-full border border-stone-300 rounded p-2 text-xs bg-white text-stone-800"
              >
                <option value="In-person">In-person (On site)</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Application Deadline</label>
              <input
                type="date"
                required
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="w-full border border-stone-300 rounded p-2 text-xs"
              />
            </div>
          </div>

          {/* Required Skills Selection (Section 3.4 & Custom Skills) */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="block font-semibold text-stone-700">
                Required Skills ({selectedSkillIds.length} selected)
              </label>
              <span className="text-[11px] text-stone-500">
                Matched against candidate Skill Passports
              </span>
            </div>

            {/* Currently Selected Badges */}
            {selectedSkillIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                {selectedSkillIds.map((id) => {
                  const skill = allSkills.find((s) => s.id === id);
                  const isCustom = customSkills.some((s) => s.id === id);
                  return (
                    <span
                      key={id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold shadow-2xs ${
                        isCustom
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-white text-stone-800 border border-amber-300'
                      }`}
                    >
                      <span>{skill?.name || id}</span>
                      {isCustom && (
                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-purple-200 text-purple-800 font-bold">
                          Custom
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleSkill(id)}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer ml-0.5"
                        title="Remove requirement"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Add Custom Skill Field */}
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1.5">
              <label className="block text-[11px] font-semibold text-stone-700">
                Can't find a skill in the list? Add a custom required skill:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TIG Welding, Industrial Machine Cleaning, CCTV Rigging..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSkill();
                    }
                  }}
                  className="flex-1 border border-stone-300 rounded p-1.5 text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  disabled={!customSkillInput.trim()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>
              <p className="text-[10px] text-stone-500">
                Custom skills are saved to this job posting and matched against candidates who hold equivalent experience.
              </p>
            </div>

            {/* Standard Catalogue Browser */}
            <div className="space-y-1.5 pt-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-stone-600">
                  Or select from standard catalogue ({filteredSkills.length} available):
                </span>
                <input
                  type="text"
                  placeholder="Search catalogue..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="border border-stone-300 rounded px-2 py-1 text-[11px] bg-white w-full sm:w-48"
                />
              </div>

              {/* Category quick filter pills */}
              <div className="flex flex-wrap gap-1 text-[11px]">
                {[
                  'All',
                  'Hospitality & Retail',
                  'Technical & Trades',
                  'Digital & Admin',
                  'Logistics & Driving',
                  'Care & Community',
                  'Creative & Beauty',
                  'Agriculture & Environment',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors text-[10px] ${
                      activeCategoryFilter === cat
                        ? 'bg-stone-900 text-white font-semibold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Skills buttons grid */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded border border-stone-200 max-h-40 overflow-y-auto">
                {filteredSkills.map((s) => {
                  const isSelected = selectedSkillIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSkill(s.id)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border text-left ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
                {filteredSkills.length === 0 && (
                  <div className="py-2 px-1 text-stone-500 text-xs italic">
                    No standard skills match "{skillSearchQuery}". Type your custom skill in the box above to add it!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Responsibilities list */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Core Responsibilities</label>
            <div className="space-y-1.5 mb-2">
              {responsibilities.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-1.5 bg-stone-50 rounded border border-stone-200 text-stone-700">
                  <span>· {r}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(i)}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add duty/responsibility..."
                value={newResp}
                onChange={(e) => setNewResp(e.target.value)}
                className="flex-1 border border-stone-300 rounded p-1.5 text-xs"
              />
              <button
                type="button"
                onClick={handleAddResp}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded text-xs"
              >
                Add
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canEmployerPostActiveJob(activeJobCount, employerPlan).allowed}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded shadow-xs cursor-pointer"
            >
              Publish Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
