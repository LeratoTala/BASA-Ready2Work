# BASA: Ready2Work — Architecture: Demo vs Real Mode

BASA: Ready2Work ships as a **unified application** offering two distinct operational modes from the Start Screen:

```
                            [ Start Screen ]
                               /          \
                              /            \
          "Sign in or create account"    "Quick Access Demo"
                    |                              |
               [ Real Mode ]                 [ Demo Mode ]
              (FirestoreApp)                  (DemoApp)
                    |                              |
         - Firebase Authentication        - 7 Fixed Personas
         - Persistent Cloud Firestore     - Zero Sign-up / No Passwords
         - Cloud Evidence Storage         - Isolated localStorage (basa_demo_v1:)
         - Strict ID Token Verification   - Simulated AI CV Drafting
         - Production Cloud Run Server    - Instant Persona Switcher
```

---

## 1. Runtime Mode Selection

* **Key:** `basa_runtime_mode` (`"demo"` | `"real"`) in `localStorage`.
* **State Behavior:**
  * When no key exists (`null`), the user is shown the **Start Screen**.
  * A returning visitor automatically skips the Start Screen and enters their chosen mode.
  * Clicking **"Back to start"** clears the key:
    * In Demo Mode, this link is visible in the sticky demo banner and sign-in picker.
    * In Real Mode, this link is shown only when signed out. Signed-in real users cannot enter demo mode without signing out first.
* **Deployment Fallback:**
  * If Firebase environment variables (`VITE_FIREBASE_API_KEY`, etc.) are missing on a deployment, the Real Mode card is disabled with the notice:
    > *"Real accounts are not available on this deployment."*
  * Demo Mode operates autonomously without any cloud credentials.

---

## 2. Code Splitting & Security Boundary

* **Lazy Chunk Loading:**
  * `DemoApp` and `RealApp` are loaded via `React.lazy` and `<Suspense>`.
  * **Demo Mode:** Never imports, bundles, or initializes the Firebase Client SDK (`getFirebase()` is never called). All state is kept on-device.
  * **Real Mode:** Does not import the fictional demo seed data or demo store.
* **Server Verification Security Invariant:**
  * `server/middleware/verifyIdToken.ts` ALWAYS verifies the Firebase ID token in `Authorization: Bearer <token>`.
  * The server has no bypass for demo flags. Any request without a valid Firebase ID token receives `401 Unauthorized` on every authenticated route (`/api/cv-draft`, `/api/register`, `/api/apply`, etc.).

---

## 3. Demo Storage Isolation (`basa_demo_v1:`)

To prevent demo actions from contaminating real account data or other browser tools:
* **Demo Prefix:** `basa_demo_v1:`
* Every `localStorage` key read or written by `useDemoStore.ts` is routed through the `demoKey` helper:
  * `basa_demo_v1:currentUser`
  * `basa_demo_v1:users`
  * `basa_demo_v1:candidateProfiles`
  * `basa_demo_v1:employerProfiles`
  * `basa_demo_v1:skillClaims`
  * `basa_demo_v1:jobs`
  * `basa_demo_v1:applications`
  * `basa_demo_v1:feedback`
  * `basa_demo_v1:upgrade_requests`
  * `basa_demo_v1:pulse_surveys`
  * `basa_demo_v1:profileDraft`
* **Shared UI Preferences:**
  * `basa_colorTheme` and `basa_lowDataMode` remain shared device preferences.
* **Stale Key Cleanup:**
  * On demo initialization, old unprefixed demo keys from legacy builds are purged automatically.

---

## 4. Resetting Demo State

The **Reset demo** action:
1. Clears every `localStorage` key starting with `basa_demo_v1:`.
2. Deep-clones the original seed data (`structuredClone`).
3. Resets all in-memory React state to the original seed.
4. Restores the active user to the first candidate persona (`candidate-thabo`).
