import dotenv from 'dotenv';

dotenv.config();

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** All server configuration comes from the environment. See .env.example. */
export const serverConfig = {
  port: int(process.env.PORT, 3000),
  /** Firebase project ID — required by the Admin SDK for ID token verification. */
  firebaseProjectId: (process.env.FIREBASE_PROJECT_ID ?? '').trim(),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  /** Comma-separated list of allowed browser origins. Empty = same-origin only. */
  allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  gemini: {
    apiKey: (process.env.GEMINI_API_KEY ?? '').trim(),
    model: (process.env.GEMINI_MODEL ?? '').trim(),
    timeoutMs: int(process.env.GEMINI_TIMEOUT_MS, 8000),
    temperature: Number(process.env.GEMINI_TEMPERATURE ?? '0.3'),
  },
  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    maxRequests: int(process.env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  limits: {
    bodyBytes: process.env.MAX_BODY_SIZE ?? '16kb',
    maxFieldChars: int(process.env.MAX_FIELD_CHARS, 2000),
    maxSkills: int(process.env.MAX_SKILLS, 30),
  },
  region: process.env.DEFAULT_REGION_LABEL ?? 'South Africa',
} as const;

export const isProduction = serverConfig.nodeEnv === 'production';
export const aiEnabled = serverConfig.gemini.apiKey.length > 10 && serverConfig.gemini.model.length > 0;
