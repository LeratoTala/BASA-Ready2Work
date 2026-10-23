import React, { useState } from 'react';
import { Application, ApplicationStatus } from '../../../domain/types';
import { Clock, CheckCircle2, XCircle, ArrowRight, Building2, MapPin, DollarSign, AlertCircle, FileCheck } from 'lucide-react';

interface Props {
  applications: Application[];
  onWithdraw: (applicationId: string) => void;
}

const STATUS_PROGRESSION: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
  'selected',
  'completed',
];

export const ApplicationsView: React.FC<Props> = ({ applications, onWithdraw }) => {
  const [notification, setNotification] = useState<string | null>(null);

  const handleWithdrawClick = (appId: string) => {
    if (confirm('Are you sure you want to withdraw this application?')) {
      try {
        onWithdraw(appId);
        setNotification('Application withdrawn.');
        setTimeout(() => setNotification(null), 3000);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-xl font-bold text-stone-900">Your Submitted Applications</h2>
        <p className="text-xs text-stone-500 mt-1">
          Track application status in real-time. Statuses advance through verified employer reviews.
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-stone-100 border border-stone-300 text-stone-800 rounded-lg text-xs font-semibold">
          {notification}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-stone-700">No applications submitted yet</p>
          <p className="text-xs text-stone-500">
            Head to Opportunities to discover jobs matching your Skill Passport!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isTerminal = app.status === 'not_selected' || app.status === 'withdrawn';
            const isCompleted = app.status === 'completed';

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-stone-900">{app.jobTitle}</h3>
                    <div className="flex items-center gap-2 text-xs text-stone-500 pt-0.5">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <Building2 className="w-3.5 h-3.5" />
                        {app.employerName}
                      </span>
                      <span>·</span>
                      <span>Applied: {new Date(app.submittedAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="font-semibold text-amber-700">Match: {app.matchScore}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                        app.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : app.status === 'selected'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'shortlisted'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : app.status === 'under_review'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : app.status === 'not_selected'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : app.status === 'withdrawn'
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>

                    {app.status !== 'withdrawn' && app.status !== 'completed' && app.status !== 'not_selected' && (
                      <button
                        onClick={() => handleWithdrawClick(app.id)}
                        className="text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Steps */}
                {!isTerminal && (
                  <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                    <div className="flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
                      {STATUS_PROGRESSION.map((step, idx) => {
                        const currentStepIndex = STATUS_PROGRESSION.indexOf(app.status);
                        const isReached = currentStepIndex >= idx;
                        const isCurrent = app.status === step;

                        return (
                          <div key={step} className="flex items-center gap-1.5 shrink-0">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isReached
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-stone-200 text-stone-500'
                              }`}
                            >
                              {isReached ? '✓' : idx + 1}
                            </div>
                            <span
                              className={`capitalize ${
                                isCurrent
                                  ? 'font-bold text-stone-900'
                                  : isReached
                                  ? 'font-medium text-stone-700'
                                  : 'text-stone-400'
                              }`}
                            >
                              {step.replace('_', ' ')}
                            </span>
                            {idx < STATUS_PROGRESSION.length - 1 && (
                              <span className="text-stone-300 mx-1">→</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Employer Notes / Work Record */}
                {app.employerNotes && (
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1">
                    <span className="font-semibold text-stone-800 block">Employer Feedback:</span>
                    <p className="text-stone-600 italic">&ldquo;{app.employerNotes}&rdquo;</p>
                  </div>
                )}

                {isCompleted && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        Work completed & verified. Official payment confirmed via South African banking EFT.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
