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
  if (code.includes('user-not-found')) return 'No account found with this email. Please check your spelling or sign up.';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect email or password. Please try again.';
  if (code.includes('email-already-in-use')) return 'An account already exists with this email. Try signing in instead.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-phone-number')) return 'Please enter a valid South African cell number (e.g. 082 123 4567 or +27 82 123 4567).';
  if (code.includes('invalid-verification-code')) return 'Invalid SMS verification code. Please check the code and try again.';
  if (code.includes('code-expired')) return 'SMS code has expired. Please request a new code.';
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
