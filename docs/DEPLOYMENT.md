# Deployment

## 1. Firebase Setup & Authentication Providers
```bash
npm i -g firebase-tools && firebase login
cp .firebaserc.example .firebaserc        # set your project id
firebase deploy --only firestore:rules,firestore:indexes,storage
```
The repository configures Cloud Functions in `firebase.json`; report-count triggers are deployed with:
```bash
node scripts/recount-job-reports.mjs
firebase deploy --only functions
```
Run the recount once before deploying the triggers, with `FIREBASE_PROJECT_ID` set for the target project and Application Default Credentials available. Then deploy the functions. Use the real Firebase project ID in `.firebaserc` (copy `.firebaserc.example` and replace its placeholder). The project ID is required for live integration; never commit service-account credentials.
Enable the authentication sign-in providers in **Firebase Console → Authentication → Sign-in method**:
- **Google:** Enable.
- **Apple:** Enable (Services ID & Key for iOS/Safari users).
- **Email/Password:** Enable.
- **Phone:** Enable (Optionally add test phone numbers like `+27820000000` with SMS code `123456` for costless development testing).
Add your production domain to **Authorized domains**.

## 2. Grant Yourself Assessor/Admin Rights
```bash
node scripts/set-admin-claim.mjs you@example.com
```
Use Application Default Credentials or set `GOOGLE_APPLICATION_CREDENTIALS` to a trusted service-account key stored outside the repository.
*Note: Public users can only self-register as Candidate or Employer. Admin rights can only be granted using this backend script.*

## 3. Where the Owner Manages & Oversees Everything After Deploying
1. **Inside the Live Application (Operational Governance):**
   - Log in using your designated admin account.
   - Navigate the **Admin Center**:
     - **Pilot Overview:** High-level metrics tracking candidates, businesses, open jobs, and assessed skills.
     - **Manage Jobs:** View all posted jobs, audit ZAR pay rates, verify employers, and suspend suspicious listings.
     - **Assessor Workspace:** Grade candidate practical rubrics and approve peer contractor endorsements.
     - **Moderation Reports:** Resolve community fraud reports and complete POPIA deletion requests.
2. **In the Cloud Console (Infrastructure Governance):**
   - **Firebase Console (console.firebase.google.com):** User management, Firestore collections, private evidence storage buckets, and App Check bot protection.
   - **Google Cloud Console (console.cloud.google.com):** Cloud Run containers, CPU/memory auto-scaling, domain SSL, and IAM roles.

## 4. Deploy the app (Google Cloud Run, serves web + API)
```bash
gcloud run deploy basa-ready2work --source . --region <region> --allow-unauthenticated \
  --service-account <runtime-service-account> \
  --set-env-vars FIREBASE_PROJECT_ID=<project-id>
```
Pass the `VITE_*` values, including `VITE_MINIMUM_USER_AGE`, as Docker build args (they are public configuration baked into the client bundle).
The runtime service account needs the Firebase Admin permissions required to verify ID tokens and create user/profile documents. AI drafting stays disabled unless `GEMINI_ENABLED=true`; review the provider's current data-use terms before enabling it and configure its API key as a managed secret.
Any host that runs Node 20+ works: `npm ci && npm run build && npm start`.

## 5. Desktop and mobile
- **Web/PWA:** the build is installable (manifest + responsive layout). Add PNG icons (192/512) for full Android install prompts.
- **Android/iOS store apps:** wrap `dist/` with Capacitor (`npm i @capacitor/core @capacitor/cli`).
- **Desktop app:** wrap with Tauri or Electron if a store-style desktop app is required; the PWA already installs on Windows/macOS/ChromeOS.
