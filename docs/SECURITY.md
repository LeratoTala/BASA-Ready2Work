# Security & Privacy Baseline

## Identity and roles
- Authentication: Firebase Authentication (Google sign-in enabled).
- Admin/assessor = Firebase **custom claim** `admin: true`, granted only with `scripts/set-admin-claim.mjs` from a trusted machine. No identities are hard-coded in rules or code.
- The client reads the claim from the ID token only to choose the UI; rules re-check it on every request.
- Self-registration may create `candidate` or `employer` accounts only. Employer profiles start `pending`; only an admin may verify.

## Enforced server-side (Firestore rules)
Candidates cannot change verification labels or assessments. Employers only read applications for their own jobs. Applications are one-per-candidate-per-job, only for open jobs, and follow valid status transitions. `employers_only` profiles and claims require a candidate application; contact details are stored separately and become readable only after the employer shortlists that application. See `firebase/firestore.rules` and `tests/rules/`.

Optional evidence images are limited to JPEG, PNG or WebP up to 5 MB. Storage paths are candidate-owned; only the candidate and admin claim can read them. Employers receive text evidence, not raw image files. See `firebase/storage.rules` and the Storage emulator tests.

## Before going public (checklist)
- [ ] Enable **Firebase App Check** and restrict the web API key to your domains.
- [ ] Add authorized domains only for your real hosts (Firebase Auth settings).
- [x] Require Firebase ID-token verification for the AI endpoint outside fictional demo mode.
- [ ] Keep AI drafting disabled by default; review the provider's current data-use terms before setting `GEMINI_ENABLED=true`.
- [x] Exclude candidate names, contact details, location and account identifiers from AI prompts; show a reminder not to enter them in free text.
- [x] Move candidate phone/contact into a private document revealed only after shortlisting; legacy profile fields migrate on next candidate sign-in.
- [ ] Before public launch, verify legacy profile contact fields have been migrated for all active candidates.
- [ ] Publish a privacy notice; define correction, deletion and evidence-retention process.
- [ ] Configure and publish the BASA service operator's privacy contact before public use.
- [ ] Confirm `VITE_ENABLE_DEMO_DATA=false` in production.
- [ ] Run `npm run test:rules` against the emulator in CI.
- [ ] Rotate any key that was ever shared outside your team.

This is a product checklist, not legal advice. Review POPIA obligations before launch.

## Account deletion requests

Candidates can submit a minimal deletion request in their profile. It records only the candidate UID, request timestamps and review status. The candidate can see their own request; admins can review requests and mark them `in_review` or `declined`. The UI does not claim that data has been deleted.

Before public use, the BASA operator must publish a privacy contact and retention policy, verify the requester, review applications/work/safety records for required retention, then perform and audit deletion of eligible Firebase Auth and Firestore data through a trusted operator process. There is currently no in-app delete/completion action; keep a request in review until the operator workflow is approved and implemented.

## R1: In-App Notifications (FR-15) Security & Privacy Review

- **Data collected:** Document ID, recipient `userId`, category `type`, generic notification `title`, friendly plain-text `body`, optional internal navigation `link`, `createdAt` timestamp, and `readAt` timestamp.
- **Data minimization:** No personal identifiers, no phone numbers/emails, no ZAR compensation amounts, and no raw evidence content are ever stored or exposed in notification payloads.
- **Purpose:** Purely internal application status alerts, assessment results, and matching reminders within the BASA platform.
- **Access control:** Enforced strictly in `firebase/firestore.rules`. Only the authenticated owner matching `resource.data.userId` can read, mark as read, or delete their notifications. Direct client writes/creations are denied; creations happen only through trusted backend batches or admin SDK operations with deterministic IDs preventing duplicates.
- **Third-party sharing:** None. No push tokens or notification data are sent to external third parties.
- **Preferences & Consent:** Users configure fine-grained delivery preferences for each notification category in the Notification Center settings; opted-out notification types are never generated.

## R2: Location-Aware Filters (FR-16) Security & Privacy Review

- **Data collected:** Broad area identifier or name (e.g. "Soweto", "Sandton", "Khayelitsha").
- **Zero GPS / Geolocation Tracking (T-18):** No HTML5 Geolocation API, GPS receiver, device coordinates, home street address, or IP-based geolocation tracking is ever requested, stored, or processed. Distance math is purely mathematical between public, static South African area centroid coordinates (`SA_AREA_CENTROIDS`).
- **Data minimization:** Candidate profiles and employer job postings record only broad suburb or township text names (e.g. "Soweto, Johannesburg").
- **Purpose:** Assist youth in identifying reachable opportunities and estimating commute feasibility without exposing where they live.
- **Centroid Distance Math (T-17):** Pure client-side/server-side Haversine formula against pre-defined township and suburb centroids, returning rounded estimated kilometers labeled clearly as centroid estimates.
- **Access control:** Area reference data in `/areas/{areaId}` is readable by signed-in users and writable only by administrators (`firebase/firestore.rules`).
- **Third-party sharing:** None. Zero location data is sent to external maps or third-party tracking APIs.

## R3: Verification Flows (FR-19) Security & Privacy Review

- **Data collected:** Peer endorsements collect only endorser name, relationship (coworker, supervisor, client, mentor, community_leader), role/trade, and brief observed work context. Mentor reviews record mentor name, organization/designation, and assessment feedback.
- **Anti-Spam & Contact Privacy:** Candidates cannot enter third-party phone numbers or email addresses; no unsolicited automated SMS, emails, or messages are ever dispatched. All endorsement approvals and mentor submissions occur within the secure platform workflow.
- **Anti-Forgery & Tamper Proofing (T-22):** Strict server-side Firestore security rules deny candidates from mutating claim verification labels or approving their own endorsements. Claims always originate as `Self-reported`.
- **Authorization & Separation of Concerns:** Peer endorsement status transitions (`approved` / `rejected`) and mentor reviews are restricted to verified administrators and designated assessors (`request.auth.token.admin == true`).
- **Honest Labeling & Disclaimers:** All verification levels display transparent user-facing definitions and "what this does not mean" disclaimers, ensuring youth credibility without misrepresenting formal accreditations.

## Multi-Provider Authentication (FR-01) Security & Privacy Review

- **Authentication Providers Supported:** Google 1-tap, Apple OAuth (`apple.com`), Email/Password with client show/hide controls, and South African cell phone SMS OTP with invisible background reCAPTCHA.
- **Data Minimization:** No unnecessary demographic, financial, or tracking data is requested during signup. Phone authentication collects only the candidate's cell number to dispatch the verification OTP; no third-party spam services are engaged.
- **Protection Against Credential Stuffing & Bots:** Invisible reCAPTCHA protects SMS endpoints from automated abuse and telecom exhaustion. Firebase Authentication manages token issuance, rotation, and cryptographically signed JWTs.
- **Role Elevation Barrier:** All public sign-up flows create `candidate` or `employer` accounts exclusively. The `admin` custom claim cannot be set through any public authentication provider.



