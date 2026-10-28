/**
 * Typed, validated access to build-time environment variables.
 * Every value the client needs from the environment is read here, once.
 * Nothing else in the codebase should touch `import.meta.env` directly.
 */

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

type RequiredKey = (typeof REQUIRED_KEYS)[number];

const raw = (typeof import.meta !== 'undefined' && import.meta.env)
  ? (import.meta.env as Record<string, string | undefined>)
  : ((typeof process !== 'undefined' && process.env) ? (process.env as Record<string, string | undefined>) : {});

function read(key: string): string {
  return ((raw && raw[key]) ?? '').trim();
}

/** Check if Firebase credentials are fully configured for Real Mode. */
export const isFirebaseConfigured: boolean = REQUIRED_KEYS.every((key) => read(key) !== '');

export const envErrors: string[] = isFirebaseConfigured
  ? []
  : REQUIRED_KEYS.filter((key) => read(key) === '').map(
      (key) => `Missing ${key}. Real mode requires Firebase credentials.`
    );

// Warn (but don't hard-fail) when storage bucket is absent
if (isFirebaseConfigured && read('VITE_FIREBASE_STORAGE_BUCKET') === '') {
  console.warn(
    '[BASA] VITE_FIREBASE_STORAGE_BUCKET is not set. ' +
    'Evidence image uploads (FR-04) will fail. Add the bucket name to your .env file.'
  );
}

function positiveInteger(key: string, fallback: number): number {
  const value = Number.parseInt(read(key), 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export const env = {
  firebase: {
    apiKey: read('VITE_FIREBASE_API_KEY'),
    authDomain: read('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: read('VITE_FIREBASE_PROJECT_ID'),
    appId: read('VITE_FIREBASE_APP_ID'),
    storageBucket: read('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: read('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    firestoreDatabaseId: read('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || '(default)',
  },
  /** Base URL of the BASA API (CV drafting). Empty string = same origin. */
  apiBaseUrl: read('VITE_API_BASE_URL'),
  /** reCAPTCHA v3 site key for Firebase App Check. Empty = App Check disabled (dev/demo only). */
  recaptchaSiteKey: read('VITE_RECAPTCHA_SITE_KEY'),
  /** True when all required Firebase keys are present. */
  isFirebaseConfigured,
  minimumUserAge: positiveInteger('VITE_MINIMUM_USER_AGE', 18),
  isProduction: Boolean(raw.PROD || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production')),
} as const;
