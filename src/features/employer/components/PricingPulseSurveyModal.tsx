import React, { useState } from 'react';
import { X, Check, HelpCircle, ArrowRight } from 'lucide-react';
import { PRICING_PULSE_SURVEY } from '../../../config/plans';
import { PricingPulseSurveyResponse } from '../../../domain/types';
import { useOSModalNavigation } from '../../../shared/hooks/useOSNavigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employerUid: string;
  onSubmitSurvey: (response: Omit<PricingPulseSurveyResponse, 'id' | 'submittedAt'>) => void;
}

export const PricingPulseSurveyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employerUid,
  onSubmitSurvey,
}) => {
  useOSModalNavigation({
    isOpen,
    onClose,
    modalId: 'pricing-pulse-survey',
  });

  const [q1, setQ1] = useState<'Too high' | 'Fair' | 'Too low'>('Fair');
  const [q2Selected, setQ2Selected] = useState<string[]>([
    PRICING_PULSE_SURVEY.question2.options[0],
  ]);
  const [q3, setQ3] = useState<'Yes' | 'No' | 'Maybe, once verified'>('Maybe, once verified');
  const [q4, setQ4] = useState<string>(PRICING_PULSE_SURVEY.question4.options[0]);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleQ2Option = (opt: string) => {
    setQ2Selected((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSurvey({
      employerUid,
      q1FairPrice: q1,
      q2UpgradeDrivers: q2Selected,
      q3AnnualDiscount: q3,
      q4CheaperPlan: q4,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden my-6">
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Quick Pricing Pulse (3 Questions)</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-sm">Thank You for Your Feedback!</h4>
            <p className="text-xs text-stone-500">
              Your input directly helps us keep pricing sustainable for SMMEs and free for youth.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <p className="text-stone-600">
              Help us calibrate employer subscription pricing to support sustainable local employment.
            </p>

            {/* Q1 */}
            <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <label className="font-bold text-stone-900 block">
                1. {PRICING_PULSE_SURVEY.question1.text}
              </label>
              <div className="flex gap-2">
                {PRICING_PULSE_SURVEY.question1.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setQ1(opt as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold border text-center cursor-pointer transition-all ${
                      q1 === opt
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2 */}
            <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <label className="font-bold text-stone-900 block">
                2. {PRICING_PULSE_SURVEY.question2.text}
              </label>
              <div className="space-y-1">
                {PRICING_PULSE_SURVEY.question2.options.map((opt) => {
                  const checked = q2Selected.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-stone-100 cursor-pointer text-stone-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleQ2Option(opt)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Q3 */}
            <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <label className="font-bold text-stone-900 block">
                3. {PRICING_PULSE_SURVEY.question3.text}
              </label>
              <div className="flex gap-2">
                {PRICING_PULSE_SURVEY.question3.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setQ3(opt as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold border text-center cursor-pointer transition-all ${
                      q3 === opt
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q4 (Requirement 9) */}
            <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <label className="font-bold text-stone-900 block">
                4. {PRICING_PULSE_SURVEY.question4.text}
              </label>
              <div className="space-y-1.5">
                {PRICING_PULSE_SURVEY.question4.options.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => setQ4(opt)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                      q4 === opt
                        ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      q4 === opt ? 'border-amber-600 bg-amber-600' : 'border-stone-400'
                    }`}>
                      {q4 === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
              >
                Skip Survey
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Submit Response</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
