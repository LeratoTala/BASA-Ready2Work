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

const raw = import.meta.env as Record<string, string | undefined>;

function read(key: string): string {
  return (raw[key] ?? '').trim();
}

function flagValue(key: string): boolean {
  const value = read(key).toLowerCase();
  return value === 'true' || value === '1';
}

// Demo mode runs entirely on-device with fictional data and needs no Firebase project.
const demoMode = flagValue('VITE_ENABLE_DEMO_DATA');
const missing: RequiredKey[] = demoMode ? [] : REQUIRED_KEYS.filter((key) => read(key) === '');

export const envErrors: string[] = missing.map(
  (key) => `Missing ${key}. Copy .env.example to .env and fill it in.`
);

function flag(key: string, fallback: boolean): boolean {
  const value = read(key).toLowerCase();
  if (value === '') return fallback;
  return value === 'true' || value === '1';
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
  /** Seed fictional demo data and expose the demo tour / persona switcher. Never enable in production. */
  enableDemoData: flag('VITE_ENABLE_DEMO_DATA', false),
  minimumUserAge: positiveInteger('VITE_MINIMUM_USER_AGE', 18),
  isProduction: import.meta.env.PROD,
} as const;
