import type { useDemoStore } from './useDemoStore';

/** The single contract every store implementation (demo or Firestore) must satisfy. */
export type BasaStore = ReturnType<typeof useDemoStore>;
