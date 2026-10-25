# BASA: Ready2Work — Deployment Checklist

Follow these steps in order. Each step has a verification command so you know it worked.

---

## Prerequisites

- Node 20+ and npm installed
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm i -g firebase-tools && firebase login`
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install): `gcloud auth login`
- A Firebase project created at [console.firebase.google.com](https://console.firebase.google.com)
- Java 21+ installed (required for Firestore emulator / rules tests): `java -version`

---

## Step 1 — Configure environment

```bash
# Copy the template and fill in every value
cp .env.example .env
```

Required values in `.env`:

| Variable | Where to find it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project settings → Your apps → Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same |
| `VITE_FIREBASE_PROJECT_ID` | Same |
| `VITE_FIREBASE_APP_ID` | Same |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same (format: `your-project.appspot.com`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same |
| `VITE_RECAPTCHA_SITE_KEY` | [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) → reCAPTCHA v3 |
| `FIREBASE_PROJECT_ID` | Same as `VITE_FIREBASE_PROJECT_ID` |
| `CORS_ALLOWED_ORIGINS` | Your production domain, e.g. `https://basa.yourdomain.co.za` |

```bash
# Copy the Firebase project config
cp .firebaserc.example .firebaserc
# Edit .firebaserc and replace "your-firebase-project-id" with your real project ID
```

**Verify:** `cat .firebaserc` should show your actual project ID.

---

## Step 2 — Enable Firebase Auth providers

In [Firebase Console](https://console.firebase.google.com) → Authentication → Sign-in method, enable:

- ✅ **Google**
- ✅ **Apple** (requires Apple Developer account for iOS users)
- ✅ **Email/Password**
- ✅ **Phone** (SMS OTP — add `+27820000000` with code `123456` as a test number for dev)

Then add your production domain under **Authorized domains**.

---

## Step 3 — Deploy Firestore rules, indexes, and Storage rules

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

**Verify:** Firebase Console → Firestore → Rules shows your rules. Storage → Rules shows storage rules.

---

## Step 4 — Deploy Cloud Functions (report counters)

```bash
# Run the recount once first to fix any existing counts
FIREBASE_PROJECT_ID=your-project-id node scripts/recount-job-reports.mjs

# Deploy the Cloud Functions
firebase deploy --only functions
```

**Verify:** Firebase Console → Functions shows `incrementReportCount` and `updateReportCount` deployed.

---

## Step 5 — Grant yourself admin rights

```bash
# Replace with your actual admin email
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json \
  FIREBASE_PROJECT_ID=your-project-id \
  node scripts/set-admin-claim.mjs you@yourdomain.com
```

Sign out and back in after running this. The Admin Center will appear in the app header.

**Verify:** Sign into the deployed app — Admin Center tab should be visible.

---

## Step 6 — Run the local checks

```bash
npm run typecheck    # must exit 0
npm test             # must show 67 pass, 0 fail
npm run test:rules   # must show all rules tests pass (requires Java)
npm run build        # must produce dist/ with no errors
```

---

## Step 7 — Deploy to Google Cloud Run

```bash
gcloud run deploy basa-ready2work \
  --source . \
  --region africa-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --build-env-vars VITE_FIREBASE_API_KEY="$(grep VITE_FIREBASE_API_KEY .env | cut -d= -f2)",\
VITE_FIREBASE_AUTH_DOMAIN="$(grep VITE_FIREBASE_AUTH_DOMAIN .env | cut -d= -f2)",\
VITE_FIREBASE_PROJECT_ID="$(grep VITE_FIREBASE_PROJECT_ID .env | cut -d= -f2)",\
VITE_FIREBASE_APP_ID="$(grep VITE_FIREBASE_APP_ID .env | cut -d= -f2)",\
VITE_FIREBASE_STORAGE_BUCKET="$(grep VITE_FIREBASE_STORAGE_BUCKET .env | cut -d= -f2)",\
VITE_FIREBASE_MESSAGING_SENDER_ID="$(grep VITE_FIREBASE_MESSAGING_SENDER_ID .env | cut -d= -f2)",\
VITE_RECAPTCHA_SITE_KEY="$(grep VITE_RECAPTCHA_SITE_KEY .env | cut -d= -f2)",\
VITE_ENABLE_DEMO_DATA=false,\
VITE_MINIMUM_USER_AGE=18 \
  --set-env-vars FIREBASE_PROJECT_ID="$(grep FIREBASE_PROJECT_ID .env | grep -v VITE | cut -d= -f2)",\
CORS_ALLOWED_ORIGINS="$(grep CORS_ALLOWED_ORIGINS .env | cut -d= -f2)"
```

> **Alternative:** use the Cloud Run console UI to paste each variable individually.
> Never paste `GOOGLE_APPLICATION_CREDENTIALS` — Cloud Run uses the service account's Application Default Credentials automatically.

**Verify:** Visit the Cloud Run URL. The app loads and shows the sign-in page.

---

## Step 8 — Smoke test the live deployment

```bash
# Replace with your Cloud Run URL
export E2E_BASE_URL=https://basa-ready2work-xxxx-uc.a.run.app

# Run e2e smoke tests against the live deployment
npm test -- --run tests/e2e/smoke.test.ts
```

All tests should pass. The health check endpoint is at `$E2E_BASE_URL/api/health`.

---

## Step 9 — Test PWA install (Android)

1. Open the deployed URL in Chrome on Android.
2. Tap the browser menu (⋮) → **Add to Home screen**.
3. The app should install with the BASA icon and open in standalone mode (no browser chrome).

If the install prompt doesn't appear, check:
- The site is served over **HTTPS**
- `manifest.webmanifest` is accessible at `/manifest.webmanifest`
- `icon-192.png` and `icon-512.png` load correctly

---

## Step 10 — Enable App Check enforcement (optional but recommended)

Once you've verified the app works correctly in production, harden App Check:

1. In Firebase Console → App Check → Register your web app with your reCAPTCHA v3 site key.
2. Enable enforcement for Firestore, Storage, and any other Firebase services.

The server's `verifyAppCheck` middleware is already active and will block requests without a valid token.

---

## Rollback

If something goes wrong after deployment:

```bash
# List recent revisions
gcloud run revisions list --service basa-ready2work --region africa-south1

# Roll back to the previous revision
gcloud run services update-traffic basa-ready2work \
  --to-revisions REVISION_NAME=100 \
  --region africa-south1
```

---

## Decisions still needed before a public pilot

- [ ] Confirm and publish a POPIA privacy contact email in `PRIVACY.md`
- [ ] Confirm the evidence retention period (how long uploaded images are kept)
- [ ] Confirm minimum working age policy with legal (default is 18, set via `VITE_MINIMUM_USER_AGE`)
- [ ] Review Google Gemini data-use terms before setting `GEMINI_ENABLED=true`
- [ ] Confirm the Firebase project ID with the team so everyone deploys to the same environment
