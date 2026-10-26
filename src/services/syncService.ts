/**
 * Sync service types and helpers.
 *
 * Firestore's persistent local cache handles offline reads and queued writes automatically.
 * This service derives a UI-facing sync state from the online/offline signal so the header
 * can show an accurate indicator without implementing a custom write queue.
 *
 * If a full custom offline queue is needed in a future release, set the `offlineSync`
 * feature flag to `true` and build the queue here, exporting it through these same types.
 */

/** UI-facing sync state driven by connectivity. */
export type SyncState = 'synced' | 'syncing' | 'offline_cached' | 'error';

/**
 * Derives a SyncState from the current online status and an optional in-flight write indicator.
 * - `offline_cached`: browser reports offline; Firestore SDK is serving from local cache.
 * - `syncing`: browser is online but at least one write operation is in flight.
 * - `synced`: online with no pending writes.
 * - `error`: last known state when an error was reported.
 */
export function deriveSyncState(isOnline: boolean, hasPendingWrites: boolean): SyncState {
  if (!isOnline) return 'offline_cached';
  if (hasPendingWrites) return 'syncing';
  return 'synced';
}

/**
 * Human-readable label for a SyncState shown in the header sync indicator.
 */
export function syncStateLabel(state: SyncState): string {
  switch (state) {
    case 'offline_cached': return 'Offline — changes saved locally';
    case 'syncing':        return 'Syncing…';
    case 'synced':         return 'All changes saved';
    case 'error':          return 'Sync error — will retry';
  }
}
