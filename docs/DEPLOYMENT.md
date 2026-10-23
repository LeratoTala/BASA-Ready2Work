# Deployment

## 1. Firebase
```bash
npm i -g firebase-tools && firebase login
cp .firebaserc.example .firebaserc        # set your project id
firebase deploy --only firestore:rules,firestore:indexes
```
Enable Authentication → Google. Add your production domain to Authorized domains.

## 2. Grant yourself assessor/admin
```bash
npm i -D firebase-admin
export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json   # never commit
node scripts/set-admin-claim.mjs you@example.com
```

## 3. Deploy the app (Google Cloud Run, serves web + API)
```bash
gcloud run deploy basa-ready2work --source . --region <region> --allow-unauthenticated \
  --service-account <runtime-service-account> \
  --set-env-vars FIREBASE_PROJECT_ID=<project-id>
```
Pass the `VITE_*` values, including `VITE_MINIMUM_USER_AGE`, as Docker build args (they are public configuration baked into the client bundle).
The runtime service account needs the Firebase Admin permissions required to verify ID tokens and create user/profile documents. AI drafting stays disabled unless `GEMINI_ENABLED=true`; review the provider's current data-use terms before enabling it and configure its API key as a managed secret.
Any host that runs Node 20+ works: `npm ci && npm run build && npm start`.

## 4. Desktop and mobile
- **Web/PWA:** the build is installable (manifest + responsive layout). Add PNG icons (192/512) for full Android install prompts.
- **Android/iOS store apps:** wrap `dist/` with Capacitor (`npm i @capacitor/core @capacitor/cli`).
- **Desktop app:** wrap with Tauri or Electron if a store-style desktop app is required; the PWA already installs on Windows/macOS/ChromeOS.
