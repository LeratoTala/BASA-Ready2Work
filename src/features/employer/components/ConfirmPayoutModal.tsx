import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Application, Job, PayoutConfirmationDetails } from '../../../domain/types';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen?: boolean;
  application: Application;
  job?: Job | null;
  onConfirmPayout: (applicationId: string, details?: PayoutConfirmationDetails) => Promise<void> | void;
  onClose: () => void;
}

export const ConfirmPayoutModal: React.FC<Props> = ({
  isOpen = true,
  application,
  job,
  onConfirmPayout,
  onClose,
}) => {
  useOSModalNavigation({
    isOpen: Boolean(isOpen),
    onClose,
    modalId: 'confirm-payout',
  });

  if (!isOpen) return null;

  const initialRateAmount =
    application.payRateAmount ||
    job?.compensationAmount ||
    application.payoutAmountZAR ||
    65;

  const initialRateUnit: 'hour' | 'day' | 'week' | 'fortnight' | 'month' =
    application.payRateUnit === 'month' ||
    application.payRateUnit === 'monthly' ||
    job?.compensationUnit === 'monthly'
      ? 'month'
      : application.payRateUnit === 'fortnight' ||
        application.payRateUnit === 'fortnightly' ||
        job?.compensationUnit === 'fortnightly'
      ? 'fortnight'
      : application.payRateUnit === 'week' ||
        application.payRateUnit === 'weekly' ||
        job?.compensationUnit === 'weekly'
      ? 'week'
      : application.payRateUnit === 'day' ||
        application.payRateUnit === 'daily' ||
        job?.compensationUnit === 'daily'
      ? 'day'
      : 'hour';

  const defaultStartDate =
    application.employmentStartDate ||
    job?.startDate ||
    new Date().toISOString().split('T')[0];

  const defaultEndDate =
    application.employmentEndDate ||
    new Date().toISOString().split('T')[0];

  const defaultDays =
    application.actualDaysWorked ??
    (initialRateUnit === 'month'
      ? 22
      : initialRateUnit === 'fortnight'
      ? 10
      : initialRateUnit === 'week'
      ? 5
      : initialRateUnit === 'day'
      ? 5
      : 20);

  const defaultHours =
    application.actualHoursWorked ??
    (initialRateUnit === 'month'
      ? 176
      : initialRateUnit === 'fortnight'
      ? 80
      : initialRateUnit === 'week'
      ? 40
      : initialRateUnit === 'day'
      ? 40
      : 160);

  const [payRateAmount, setPayRateAmount] = useState<number>(initialRateAmount);
  const [payRateUnit, setPayRateUnit] = useState<'hour' | 'day' | 'week' | 'fortnight' | 'month'>(initialRateUnit);
  const [actualDaysWorked, setActualDaysWorked] = useState<number>(defaultDays);
  const [actualHoursWorked, setActualHoursWorked] = useState<number>(defaultHours);
  const [startDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeServedText = `${actualDaysWorked} days served (${actualHoursWorked} hrs)`;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payRateAmount <= 0) {
      setError('Please enter a valid pay rate (must be greater than 0).');
      return;
    }
    if (actualDaysWorked < 0 || actualHoursWorked < 0) {
      setError('Time served cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirmPayout(application.id, {
        payRateAmount,
        payRateUnit,
        actualTimeInWorkplace: timeServedText,
        actualHoursWorked,
        actualDaysWorked,
        employmentStartDate: startDate,
        employmentEndDate: endDate,
        hoursWorked: actualHoursWorked,
        workDurationLabel: timeServedText,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm payout and time.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Time Served &amp; Pay Rate Confirmation
            </span>
            <h3 className="text-base font-bold text-white">Confirm Record for {application.candidateName}</h3>
            <p className="text-xs text-stone-300">
              Job: {application.jobTitle} {job ? `(ID: #${job.id})` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs text-stone-800">
          {/* Section 1: Agreed Pay Rate (money/hour, money/day, money/week, money/fortnight, or money/month) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                1. Agreed Pay Rate (money/hour, money/day, money/week, money/fortnight, or money/month)
              </label>
              <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                Rate-based (No total sum)
              </span>
            </div>
            <p className="text-stone-500 text-[11px]">
              Set the confirmed hourly, daily, weekly, fortnightly, or monthly pay rate agreed with the candidate.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Pay Rate (ZAR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-stone-500 text-sm">R</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={payRateAmount}
                    onChange={(e) => setPayRateAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-stone-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Rate Unit</label>
                <select
                  value={payRateUnit}
                  onChange={(e) => setPayRateUnit(e.target.value as 'hour' | 'day' | 'week' | 'fortnight' | 'month')}
                  className="w-full border border-stone-300 rounded-lg p-2.5 text-xs font-semibold text-stone-900 bg-white"
                >
                  <option value="hour">Per Hour (money/hour)</option>
                  <option value="day">Per Day (money/day)</option>
                  <option value="week">Per Week (money/week)</option>
                  <option value="fortnight">Per Fortnight (money/fortnight)</option>
                  <option value="month">Per Month (money/month)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Amount of Time Served in Institution */}
          <div className="space-y-2 border-t border-stone-200 pt-4">
            <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              2. Amount of Time Served in Institution
            </label>
            <p className="text-stone-500 text-[11px]">
              Record the total time served at this institution. All working days, approved leaves, and off days contribute under this total time served.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Days Served</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={actualDaysWorked}
                  onChange={(e) => setActualDaysWorked(parseInt(e.target.value) || 0)}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs font-semibold text-stone-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Hours Served</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={actualHoursWorked}
                  onChange={(e) => setActualHoursWorked(parseFloat(e.target.value) || 0)}
                  className="w-full border border-stone-300 rounded-lg p-2 text-xs font-semibold text-stone-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Employment Duration Dates */}
          <div className="space-y-2 border-t border-stone-200 pt-4">
            <label className="block font-bold text-stone-900 uppercase tracking-wider text-[11px]">
              3. Employment Duration Dates
            </label>
            <p className="text-stone-500 text-[11px]">
              Now that work is completed, both the starting date and completion date are recorded.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Starting Date of Employment</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="date"
                    disabled
                    value={startDate}
                    className="w-full border border-stone-200 bg-stone-100 rounded-lg pl-8 pr-2 py-2 text-xs font-medium text-stone-700 cursor-not-allowed"
                    title="Starting date was fixed upon employment"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Completion Date</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-stone-300 bg-white rounded-lg pl-8 pr-2 py-2 text-xs font-medium text-stone-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 space-y-1">
            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              What both parties will see on their dashboard:
            </span>
            <ul className="text-xs text-amber-950 font-medium list-disc pl-4 space-y-0.5">
              <li>
                Pay Rate: <strong>R{payRateAmount} / {payRateUnit}</strong>
              </li>
              <li>
                Time Served in Institution: <strong>{timeServedText}</strong>
              </li>
              <li>
                Duration: <strong>Started {startDate} · Completed {endDate}</strong>
              </li>
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Confirming…' : `Confirm Rate (R${payRateAmount}/${payRateUnit}) & Time Served`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
