import React from 'react';
import { RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';

interface Props {
  onReset: () => void;
  onBackToStart: () => void;
}

export const DemoBanner: React.FC<Props> = ({ onReset, onBackToStart }) => {
  return (
    <div
      role="region"
      aria-label="Demo sandbox notice"
      className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800/80 px-4 py-2 text-xs text-amber-950 dark:text-amber-200 sticky top-0 z-35"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold">Quick Access Demo:</span>
          <span className="text-stone-700 dark:text-stone-300">
            Actions are saved only in this browser.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium text-[11px] shadow-2xs cursor-pointer transition-colors"
            title="Reset sample candidates, jobs, and evaluations to initial demo state"
          >
            <RotateCcw className="w-3 h-3 text-amber-600" />
            <span>Reset demo</span>
          </button>
          <button
            type="button"
            onClick={onBackToStart}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-medium text-[11px] shadow-2xs cursor-pointer transition-colors"
            title="Clear demo session and return to mode selection"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to start</span>
          </button>
        </div>
      </div>
    </div>
  );
};
