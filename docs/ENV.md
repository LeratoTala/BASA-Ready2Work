# BASA: Ready2Work — Environment Variables Reference (Firestore Mode)

This document lists all environment variables required to run the BASA: Ready2Work client application and backend Express server in **Firestore Mode** (`VITE_ENABLE_DEMO_DATA=false`).

---

## 1. Client Environment Variables (`.env`)

These variables are prefixed with `VITE_` and bundled into the client build via Vite (`src/config/env.ts`).

| Variable | Required? | Description | Example Value |
|---|---|---|---|
| `VITE_ENABLE_DEMO_DATA` | Optional | Set to `false` (or leave empty) to enable Firestore mode. Set to `true` to use the on-device mock store. | `false` |
| `VITE_FIREBASE_API_KEY` | **Required** | Firebase Web API key from Firebase Project Settings. | `AIzaSyD-ABC123xyz...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Required** | Firebase Authentication domain. | `basa-ready2work.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | **Required** | Google Cloud / Firebase project identifier. | `basa-ready2work-prod` |
| `VITE_FIREBASE_APP_ID` | **Required** | Firebase Web App ID. | `1:123456789:web:abcdef` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Recommended | Cloud Storage bucket for proof photos and certificates (FR-04). | `basa-ready2work-prod.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase Cloud Messaging sender ID. | `123456789012` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID`| Optional | Firestore named database. Defaults to `(default)`. | `(default)` |
| `VITE_API_BASE_URL` | Optional | Backend API base URL. Leave blank for same-origin deployment. | `https://api.basa.co.za` |
| `VITE_RECAPTCHA_SITE_KEY` | Recommended | reCAPTCHA Enterprise / v3 public site key for App Check. | `6Lc...` |
| `VITE_MINIMUM_USER_AGE` | Optional | Minimum age confirmation threshold (defaults to 18). | `18` |

---

## 2. Server Environment Variables

These variables are consumed by the Express backend (`server/config.ts`, `server/middleware/verifyIdToken.ts`).

| Variable | Required? | Description | Example Value |
|---|---|---|---|
| `PORT` | Optional | HTTP listen port for Express (default: `3000`). | `3000` |
| `NODE_ENV` | Optional | Runtime mode: `production` or `development`. | `production` |
| `FIREBASE_PROJECT_ID` | **Required** | Target Firebase project ID for Firebase Admin SDK. | `basa-ready2work-prod` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Required (local/VM) | Absolute path to Google Service Account JSON key file. On Google Cloud Run / App Engine, Application Default Credentials (ADC) are used automatically if this is omitted. | `/etc/secrets/firebase-admin.json` |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key used by `/api/cv-draft` (Section 37) and assessor copilot. If omitted, fallback template drafting is used. | `AIzaSyD...` |
| `GEMINI_MODEL` | Optional | Gemini model name (default: `gemini-2.5-flash`). | `gemini-2.5-flash` |
| `APP_CHECK_ENFORCEMENT` | Optional | Set to `true` to reject API requests lacking a valid Firebase App Check token. Default: `false` in development. | `true` |
| `RATE_LIMIT_WINDOW_MS` | Optional | Rate limit sliding window in milliseconds (default: `60000`). | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | Maximum allowed requests per IP within the window (default: `100`). | `100` |
| `ALLOWED_ORIGINS` | Optional | Comma-separated list of allowed CORS origins for `/api`. | `https://ready2work.basa.co.za` |

---

## 3. Switching Between Modes

* **Fictional Demo Mode (Pitch/Evaluator):**
  Set `VITE_ENABLE_DEMO_DATA=true`. The platform runs 100% on-device in `localStorage` with pre-seeded personas. No cloud credentials needed.
* **Live Firestore Mode (Production/Staging):**
  Set `VITE_ENABLE_DEMO_DATA=false`. Provide the client keys in `.env` and configure `GOOGLE_APPLICATION_CREDENTIALS` and `FIREBASE_PROJECT_ID` on the server.
