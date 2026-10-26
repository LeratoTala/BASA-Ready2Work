import React, { useState } from 'react';
import { X, ArrowDownCircle, ShieldCheck, Check, AlertCircle, Building2 } from 'lucide-react';
import { EMPLOYER_PLANS, EmployerPlanId, EmployerPlanConfig } from '../../../config/plans';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employerUid: string;
  businessName: string;
  currentPlan?: EmployerPlanId;
  activeJobCount: number;
  initialTargetPlan?: 'free' | 'starter' | 'business';
  onConfirmDowngrade: (targetPlan: 'free' | 'starter' | 'business', reason?: string) => void;
}

export const DowngradePlanModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employerUid: _employerUid,
  businessName,
  currentPlan = 'starter',
  activeJobCount,
  initialTargetPlan,
  onConfirmDowngrade,
}) => {
  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: 'plan-downgrade',
  });

  // Calculate available downgrade tiers strictly below current plan
  const planOrder: EmployerPlanId[] = ['free', 'starter', 'business', 'partner'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const lowerPlanIds = planOrder.slice(0, Math.max(1, currentIndex)).reverse() as ('free' | 'starter' | 'business')[];

  const defaultSelection = initialTargetPlan && lowerPlanIds.includes(initialTargetPlan)
    ? initialTargetPlan
    : lowerPlanIds[0] || 'free';

  const [selectedPlan, setSelectedPlan] = useState<'free' | 'starter' | 'business'>(defaultSelection);
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync state if initialTargetPlan changes on open
  React.useEffect(() => {
    if (initialTargetPlan && lowerPlanIds.includes(initialTargetPlan)) {
      setSelectedPlan(initialTargetPlan);
    } else if (lowerPlanIds.length > 0 && !lowerPlanIds.includes(selectedPlan)) {
      setSelectedPlan(lowerPlanIds[0]);
    }
  }, [initialTargetPlan, currentPlan]);

  if (!isOpen) return null;

  const targetConfig: EmployerPlanConfig = EMPLOYER_PLANS[selectedPlan];
  const currentConfig: EmployerPlanConfig = EMPLOYER_PLANS[currentPlan];
  const doesNotAdhere = activeJobCount > targetConfig.activeJobLimit;
  const excess = activeJobCount - targetConfig.activeJobLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (doesNotAdhere) {
      alert(
        `Automatic Decline: You cannot switch to the ${targetConfig.name}.\n\n` +
        `You currently have ${activeJobCount} active jobs, but ${targetConfig.name} only allows up to ${targetConfig.activeJobLimit}. ` +
        `Please close ${excess} active job${excess === 1 ? '' : 's'} first until your active jobs balance within the scale of the tier.`
      );
      return;
    }

    onConfirmDowngrade(selectedPlan, reason.trim() || undefined);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ArrowDownCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {selectedPlan === 'free' ? 'Cancel Plan (Switch to Free SMME)' : 'Downgrade Plan'}
              </h3>
              <p className="text-xs text-stone-400">
                Instant self-service change. Zero lock-in contracts; changes take effect immediately without admin approval.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-stone-900">
                {selectedPlan === 'free' ? 'Plan Cancelled (Free SMME Active)' : 'Plan Downgraded Successfully'}
              </h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Your subscription has been updated immediately to the {targetConfig.name}. Your past jobs and applicant records remain completely safe.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
            {/* Business summary */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-stone-400" />
                <span className="font-bold text-stone-900">{businessName}</span>
              </div>
              <span className="text-[11px] text-stone-500">
                Current Plan: <strong className="capitalize text-stone-800">{currentConfig.name}</strong>
              </span>
            </div>

            {/* Target Tier Selection */}
            <div className="space-y-2">
              <label className="block font-bold text-stone-800">
                Select your new subscription tier:
              </label>
              <div className="space-y-2">
                {lowerPlanIds.map((planId) => {
                  const p = EMPLOYER_PLANS[planId];
                  const isSelected = selectedPlan === planId;
                  return (
                    <div
                      key={planId}
                      onClick={() => setSelectedPlan(planId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 capitalize text-sm">{p.name}</span>
                          {planId === 'free' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                              Free SMME Pilot
                            </span>
                          )}
                        </div>
                        <p className="text-stone-500 text-[11px]">
                          Up to <strong>{p.activeJobLimit === 999999 ? 'Unlimited' : p.activeJobLimit} active opportunity</strong> listings
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-stone-900 block text-sm">
                          {p.priceZarMonthly === 0 ? 'R0' : `R${p.priceZarMonthly}`}
                        </span>
                        <span className="text-[10px] text-stone-400">/ month</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tier Rules Adherence & Quota Impact Check */}
            {doesNotAdhere ? (
              <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-950 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <strong className="font-extrabold text-xs text-red-900 uppercase tracking-wide">
                    Automatic Decline: Active Jobs Exceed Tier Limit
                  </strong>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  You currently have <strong>{activeJobCount} active opportunity listings</strong>, but the <strong>{targetConfig.name}</strong> only allows up to <strong>{targetConfig.activeJobLimit} active listing{targetConfig.activeJobLimit === 1 ? '' : 's'}</strong>.
                </p>
                <div className="text-xs font-semibold text-red-950 bg-red-100/80 p-2.5 rounded-lg border border-red-200">
                  Action Required: You must close <strong>{excess} active job listing{excess === 1 ? '' : 's'}</strong> on your profile before you can {selectedPlan === 'free' ? 'cancel' : 'downgrade'} until your active jobs balance within the scale of the tier.
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 text-stone-700">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Currently active opportunity listings:</span>
                  <span className="font-bold text-stone-900">{activeJobCount}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>New opportunity capacity ({targetConfig.name}):</span>
                  <span className="font-bold text-stone-900">{targetConfig.activeJobLimit}</span>
                </div>
                <div className="pt-1.5 border-t border-stone-200 text-emerald-800 text-[11px] flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tier rules satisfied: Your active listings adhere to the {targetConfig.name} capacity.</span>
                </div>
              </div>
            )}

            {/* Plain language fairness guarantee */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Zero Lock-In &amp; Data Safety Guarantee</span>
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Downgrading or cancelling will <strong>never delete</strong> any of your existing jobs or applicants. You maintain full access to past applications, talent notes, and hired candidate details.
              </p>
            </div>

            {/* Optional Reason Field */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Optional feedback or reason:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve: e.g., Finished our hiring campaign, scaling back budget..."
                rows={2}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold cursor-pointer"
              >
                Keep Current Plan
              </button>
              <button
                type="submit"
                disabled={doesNotAdhere}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  doesNotAdhere
                    ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                    : 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer'
                }`}
              >
                {doesNotAdhere
                  ? `Close ${excess} Active Job${excess === 1 ? '' : 's'} First to Adhere`
                  : selectedPlan === 'free'
                  ? 'Confirm Instant Cancellation (Free)'
                  : `Confirm Instant Downgrade to ${targetConfig.name}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
