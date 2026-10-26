import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SyncState } from '../../services/syncService';

interface Props {
  syncStatus: SyncState;
  pendingCount: number;
  isOnline: boolean;
  onSyncNow: () => void;
}

export const SyncIndicator: React.FC<Props> = ({
  syncStatus,
  pendingCount,
  isOnline,
  onSyncNow,
}) => {
  if (syncStatus === 'syncing') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40"
        title="Syncing pending mutations to Firebase Firestore..."
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
        <span className="font-semibold">Syncing to server...</span>
        {pendingCount > 0 && (
          <span className="text-[10px] bg-amber-500/30 px-1 rounded text-amber-200">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (syncStatus === 'offline_cached' || !isOnline) {
    return (
      <button
        onClick={onSyncNow}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-stone-800 text-stone-300 border border-stone-700 hover:border-amber-400/60 hover:text-white transition-colors cursor-pointer"
        title="Input is saved locally in localStorage. Click to push pending changes to Firestore server."
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-400" />
        <span>
          {isOnline ? 'Cached locally' : 'Offline (Cached)'}
        </span>
        {pendingCount > 0 && (
          <span className="text-[10px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded-full">
            {pendingCount} pending
          </span>
        )}
        {isOnline && <span className="text-[10px] text-amber-400 underline ml-1">Sync</span>}
      </button>
    );
  }

  if (syncStatus === 'error') {
    return (
      <button
        onClick={onSyncNow}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-red-950/40 text-red-300 border border-red-800 hover:bg-red-900/50 cursor-pointer"
        title="Sync error occurred. Click to retry pushing to Firestore."
      >
        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
        <span>Sync paused · Retry</span>
      </button>
    );
  }

  // Synced state
  return (
    <button
      onClick={onSyncNow}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-stone-800/80 text-stone-300 border border-stone-700 hover:bg-stone-700/80 transition-colors cursor-pointer group"
      title="All changes saved locally & synced to Firestore. Click to force a refresh sync."
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className="font-medium text-emerald-300">Synced</span>
      <span className="text-[10px] text-stone-400 group-hover:text-stone-200 hidden md:inline">
        (Cloud + LocalStorage)
      </span>
    </button>
  );
};
