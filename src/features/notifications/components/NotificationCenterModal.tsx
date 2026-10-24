import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Sliders,
  Briefcase,
  Award,
  CheckCircle2,
  MessageSquare,
  Bus,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { InAppNotification, NotificationPreferences, NotificationType } from '../../../domain/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  onUpdatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  preferences,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onUpdatePreferences,
  onNavigateTab,
}) => {
  const [activeView, setActiveView] = useState<'list' | 'preferences'>('list');

  if (!isOpen) return null;

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'application_status':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      case 'assessment_result':
        return <Award className="w-4 h-4 text-amber-600" />;
      case 'endorsement_request':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'matching_job':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'transport_update':
        return <Bus className="w-4 h-4 text-indigo-600" />;
      case 'mentor_message':
        return <MessageSquare className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-stone-500" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const handleNotificationClick = (notif: InAppNotification) => {
    if (!notif.readAt) onMarkRead(notif.id);
    if (notif.link && onNavigateTab) {
      onNavigateTab(notif.link);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-[#faf8f5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 id="notification-modal-title" className="text-base font-semibold text-stone-900 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-500">Live updates and status alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView((v) => (v === 'list' ? 'preferences' : 'list'))}
              className={`p-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                activeView === 'preferences'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
              title="Notification settings"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeView === 'preferences' ? 'Back' : 'Settings'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switch */}
        {activeView === 'preferences' ? (
          /* Preferences Panel */
          <div className="p-5 overflow-y-auto space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Notification Preferences</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Choose which notifications you wish to receive in BASA. Sensitive details are never sent.
              </p>
            </div>

            <div className="space-y-3 pt-2 divide-y divide-stone-100">
              <label className="flex items-start justify-between gap-3 pt-2 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-stone-800">Application Status Updates</div>
                  <div className="text-xs text-stone-500">When an employer reviews, shortlists, or completes an application.</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.application_status}
                  onChange={(e) => onUpdatePreferences({ application_status: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-start justify-between gap-3 pt-3 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-stone-800">Skill Assessment Results</div>
                  <div className="text-xs text-stone-500">When an assessor grades practical demonstration evidence.</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.assessment_result}
                  onChange={(e) => onUpdatePreferences({ assessment_result: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-start justify-between gap-3 pt-3 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-stone-800">New Matching Opportunities</div>
                  <div className="text-xs text-stone-500">Alerts when a job with strong skill fit is published in your area.</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.matching_job}
                  onChange={(e) => onUpdatePreferences({ matching_job: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-start justify-between gap-3 pt-3 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-stone-800">Peer Endorsements</div>
                  <div className="text-xs text-stone-500">When a coworker or client endorses one of your informal skills.</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.endorsement_request}
                  onChange={(e) => onUpdatePreferences({ endorsement_request: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-start justify-between gap-3 pt-3 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-stone-800">Transport Support Updates</div>
                  <div className="text-xs text-stone-500">Status updates regarding transport stipend requests.</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.transport_update}
                  onChange={(e) => onUpdatePreferences({ transport_update: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-start justify-between gap-3 pt-3 cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-stone-800">Mentor Messages</div>
                  <div className="text-xs text-stone-500">Notifications when your assigned mentor sends support guidance.</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.mentor_message}
                  onChange={(e) => onUpdatePreferences({ mentor_message: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Preferences are private and saved instantly.
              </span>
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Notifications List */
          <>
            {notifications.length > 0 && (
              <div className="flex items-center justify-between px-5 py-2.5 bg-stone-50/80 border-b border-stone-100 text-xs">
                <span className="text-stone-500 font-medium">{notifications.length} total</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all as read
                  </button>
                )}
              </div>
            )}

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-800">You're all caught up!</h3>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                    No new notifications right now. Updates on your applications and verified skills will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = notif.readAt === null;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isUnread
                          ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
                          : 'bg-white border-stone-200/80 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white shadow-xs border border-stone-100">
                          {getNotificationIcon(notif.type)}
                        </div>

                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-medium ${isUnread ? 'text-stone-900 font-semibold' : 'text-stone-800'}`}>
                              {notif.title}
                            </h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" aria-label="Unread" />
                            )}
                          </div>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">{notif.body}</p>
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
                            <span>{formatTimestamp(notif.createdAt)}</span>
                            {notif.link && (
                              <span className="text-emerald-700 font-medium flex items-center gap-0.5 hover:underline">
                                View details <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => onMarkRead(notif.id)}
                              className="p-1 rounded text-stone-400 hover:text-emerald-700 hover:bg-white transition-colors"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDelete(notif.id)}
                            className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-white transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 bg-[#faf8f5] flex items-center justify-between text-xs text-stone-500">
          <span>Low-data safe & private</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
