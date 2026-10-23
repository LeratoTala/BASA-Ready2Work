/** UI-facing sync state. Offline persistence and write queuing are handled by the Firestore SDK cache. */
export type SyncState = 'synced' | 'syncing' | 'offline_cached' | 'error';
