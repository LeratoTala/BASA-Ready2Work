import React, { useState } from 'react';
import { X, Star, MessageSquare, CheckCircle2, ShieldCheck, HeartHandshake } from 'lucide-react';
import { FeedbackRecord, User } from '../../../domain/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubmitFeedback?: (feedback: Omit<FeedbackRecord, 'id' | 'createdAt'>) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Very Difficult / Confusing',
  2: 'Needed More Help',
  3: 'Okay / Neutral',
  4: 'Good / Easy to Use',
  5: 'Excellent / Very Empowering',
};

export const FeedbackModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitFeedback,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [workedWell, setWorkedWell] = useState('');
  const [needsImprovement, setNeedsImprovement] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmitFeedback && currentUser) {
      onSubmitFeedback({
        userId: currentUser.uid,
        userRole: currentUser.role,
        userName: currentUser.displayName,
        rating,
        workedWell: workedWell.trim(),
        needsImprovement: needsImprovement.trim(),
      });
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setWorkedWell('');
      setNeedsImprovement('');
      setRating(5);
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Tell Us What You Think</h3>
              <p className="text-xs text-stone-300">
                {currentUser?.role === 'candidate'
                  ? 'Job Seeker Feedback'
                  : currentUser?.role === 'employer'
                  ? 'Employer Feedback'
                  : 'Assessor / Admin Feedback'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-stone-900">Siyabonga! Thank You!</h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                Your feedback helps us make BASA Ready2Work simpler, fairer, and more effective for youth job seekers and SMMEs across South Africa.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Grade 6 Plain Introduction */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-stone-700 text-xs leading-relaxed flex items-start gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                We want to hear about your experience. Did you find what you were looking for? Was anything confusing? No tracking cookies or personal data are shared.
              </p>
            </div>

            {/* Rating Stars */}
            <div className="space-y-1.5">
              <label className="block font-bold text-stone-800">
                How easy was it to use Ready2Work today? *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-hidden"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating !== null ? star <= hoverRating : star <= rating)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-stone-700 ml-2">
                  {RATING_LABELS[hoverRating ?? rating]}
                </span>
              </div>
            </div>

            {/* What worked well */}
            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                What worked well for you?
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Adding my barista badge was simple, the job match explanations were clear..."
                value={workedWell}
                onChange={(e) => setWorkedWell(e.target.value)}
                className="w-full border border-stone-300 rounded p-2.5 text-xs text-stone-800 placeholder:text-stone-400"
              />
            </div>

            {/* What was confusing / could be improved */}
            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                What was confusing or could be improved?
              </label>
              <textarea
                rows={2}
                placeholder="e.g. I wasn't sure what 'Task-assessed' meant at first, or I want more jobs near my township..."
                value={needsImprovement}
                onChange={(e) => setNeedsImprovement(e.target.value)}
                className="w-full border border-stone-300 rounded p-2.5 text-xs text-stone-800 placeholder:text-stone-400"
              />
            </div>

            {/* Privacy Guarantee */}
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Section 31.2: Feedback is reviewed internally by platform organizers only.</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded text-xs shadow-xs cursor-pointer"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
