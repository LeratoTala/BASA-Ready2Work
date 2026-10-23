import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, MapPin, Briefcase, Trash2 } from 'lucide-react';
import { Job, WorkMode, CompensationUnit } from '../../../domain/types';
import { SKILL_DEFINITIONS } from '../../../domain/skillCatalogue';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'reportCount' | 'employerId' | 'employerName' | 'employerVerified'>) => void;
  defaultLocation?: string;
}

export const CreateOpportunityModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultLocation = 'Johannesburg CBD',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Carry out assigned hands-on tasks safely and punctually',
    'Follow hygiene and equipment maintenance protocols',
  ]);
  const [newResp, setNewResp] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([SKILL_DEFINITIONS[0].id]);
  const [locationArea, setLocationArea] = useState(defaultLocation);
  const [workMode, setWorkMode] = useState<WorkMode>('In-person');
  const [compensationAmount, setCompensationAmount] = useState<number>(450);
  const [compensationUnit, setCompensationUnit] = useState<CompensationUnit>('daily');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedSkillIds.length === 0) return;

    const skillNames = selectedSkillIds
      .map((id) => SKILL_DEFINITIONS.find((s) => s.id === id)?.name)
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

          {/* Required Skills Selection */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Select Required Skills (For Matching Engine)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded border border-stone-200">
              {SKILL_DEFINITIONS.map((s) => {
                const isSelected = selectedSkillIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
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
              className="px-3 py-1.5 text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded shadow-xs"
            >
              Publish Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
