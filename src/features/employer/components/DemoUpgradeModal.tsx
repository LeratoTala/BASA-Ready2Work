import React, { useState } from 'react';
import { X, Sparkles, Check, CheckCircle2, ShieldCheck, Mail, Building2, FileText, ArrowRight } from 'lucide-react';
import { EMPLOYER_PLANS, EmployerPlanId, EmployerPlanConfig } from '../../../config/plans';
import { FEATURE_FLAGS } from '../../../config/featureFlags';
import { EmployerUpgradeRequest } from '../../../domain/types';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employerUid: string;
  businessName: string;
  defaultEmail?: string;
  currentPlan?: EmployerPlanId;
  onSubmitUpgradeRequest: (request: Omit<EmployerUpgradeRequest, 'id' | 'requestedAt'>) => void;
}

export const DemoUpgradeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employerUid,
  businessName,
  defaultEmail = '',
  currentPlan = 'free',
  onSubmitUpgradeRequest,
}) => {
  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: 'demo-upgrade',
  });

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'business' | 'partner'>('starter');
  const [contactName, setContactName] = useState('');
  const [billingEmail, setBillingEmail] = useState(defaultEmail);
  const [poNumber, setPoNumber] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingEmail.trim()) return;

    onSubmitUpgradeRequest({
      employerUid,
      businessName,
      targetPlan: selectedPlan,
      contactName: contactName || businessName,
      billingEmail: billingEmail.trim(),
      poNumber: poNumber.trim() || undefined,
      status: 'pending',
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2200);
  };

  const availablePlans: EmployerPlanConfig[] = [
    EMPLOYER_PLANS.starter,
    EMPLOYER_PLANS.business,
    EMPLOYER_PLANS.partner,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Upgrade Employer Subscription</h3>
                {FEATURE_FLAGS.demoInstantApproval && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-400/40">
                    Demo Mode: Approve Instantly
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Pilot — Invoiced manually (No credit card required)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-stone-900">
              {FEATURE_FLAGS.demoInstantApproval ? 'Demo Upgrade Activated!' : 'Upgrade Request Submitted!'}
            </h4>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              {FEATURE_FLAGS.demoInstantApproval
                ? `Demo mode shortcut: Your plan has been upgraded to ${selectedPlan.toUpperCase()} tier immediately for testing.`
                : `Thanks! Your request has been recorded. An invoice will be sent to ${billingEmail}. Your plan remains on your current tier until approved by an administrator.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Hard rule notice */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Candidate Zero-Fee Commitment:</strong> Youth jobseekers NEVER pay to register, get verified, or apply. Employer subscription fees directly sustain local verification hubs.
              </div>
            </div>

            {/* Plan Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                Select Your Plan Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id as any)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-xs">{plan.name}</span>
                        {plan.isPopular && (
                          <span className="text-[9px] font-extrabold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-stone-900">
                        {plan.priceZarMonthly > 0 ? (
                          <span className="text-lg font-extrabold">R{plan.priceZarMonthly}<span className="text-xs text-stone-500 font-normal">/mo</span></span>
                        ) : (
                          <span className="text-sm font-extrabold text-stone-800">Custom SLA</span>
                        )}
                      </div>
                      <ul className="text-[11px] text-stone-600 space-y-1">
                        {plan.features.slice(0, 2).map((f, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Billing Details (No Card Storage) */}
            <div className="space-y-3 pt-2 border-t border-stone-100 text-xs">
              <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                Pilot Billing Information (Invoiced Manually)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Contact / Authorised Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Sipho Ndlovu (HR Manager)"
                    className="w-full border border-stone-300 rounded-lg p-2 bg-stone-50 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Billing / Accounts Email
                  </label>
                  <input
                    type="email"
                    required
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="accounts@company.co.za"
                    className="w-full border border-stone-300 rounded-lg p-2 bg-stone-50 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Purchase Order (PO) Number (Optional)
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-8812"
                  className="w-full border border-stone-300 rounded-lg p-2 bg-stone-50 text-xs"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                Cancel or downgrade anytime. Zero lock-in.
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shadow-xs cursor-pointer"
              >
                <span>Request Upgrade (Pilot Demo)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
