import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { env } from '../config/env';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  googleProvider: GoogleAuthProvider;
}

let services: FirebaseServices | null = null;

/**
 * Lazily initialises Firebase on first use so demo mode (no backend) never needs Firebase config.
 * Firestore uses a persistent local cache: reads work offline and writes queue until reconnect.
 */
export function getFirebase(): FirebaseServices {
  if (services) return services;
  const { firestoreDatabaseId, ...options } = env.firebase;
  const app = getApps()[0] ?? initializeApp(options);
  const db = initializeFirestore(
    app,
    { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
    firestoreDatabaseId
  );
  services = { app, auth: getAuth(app), db, googleProvider: new GoogleAuthProvider() };
  return services;
}

/** Turns Firebase errors into messages people can act on. */
export function friendlyFirebaseError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  if (code.includes('permission-denied')) return 'You do not have permission to do that.';
  if (code.includes('unavailable') || code.includes('network')) return 'You appear to be offline. Changes will sync when you reconnect.';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return 'Sign-in was cancelled.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in window. Allow pop-ups and try again.';
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
