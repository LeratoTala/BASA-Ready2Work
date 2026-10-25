# BASA: Ready2Work Progress

Updated: 2026-10-24

## Plan Position

The local Firebase emulator environment is configured for rules tests. A real Firebase development project ID has not been supplied, so live Firebase integration and deployment remain unverified. The project intentionally remains React/TypeScript.

## Completed This Session

- **POPIA deletion workflow**: `DELETE /api/delete-account` uses the Admin SDK to delete Firestore records, Storage evidence and the Firebase Auth account after an admin marks the request `in_review`. The AdminDashboard has a completion action. The live workflow still needs integration verification.
- **Gemini model default**: `server/config.ts` now falls back to `gemini-1.5-flash` when `GEMINI_MODEL` is empty — only `GEMINI_ENABLED=true` + `GEMINI_API_KEY` are required to activate AI drafting.
- **Firebase App Check**: Client initialises App Check (reCAPTCHA v3) when `VITE_RECAPTCHA_SITE_KEY` is set. Server adds `verifyAppCheck` middleware applied to all `/api` routes; in production it validates `X-Firebase-AppCheck` tokens.
- **Report counts**: Cloud Functions are configured for deployment and maintain `reportCount` for pending job reports. Resolving or dismissing a report decrements the count; reopening one increments it. Deployment and emulator verification remain open.
- **Employer verification UI**: New "Employers" sub-tab in AdminDashboard lists all employer profiles with pending/verified/unverified status and Verify/Revoke buttons. `POST /api/admin/verify-employer` server route updates `verificationStatus` via Admin SDK. Demo store stub updates state locally.
- **syncService**: Replaced stub with `deriveSyncState()` and `syncStateLabel()` helpers. Firestore store now tracks a `pendingWriteCount` so the header sync indicator shows `syncing` during in-flight writes and `offline_cached` when offline.
- **employerCandidateContactAccess write confirmed**: The write was already present in `updateApplicationStatus` (`batch.set` on shortlist). Contact access is granted correctly.
- **Work record creation**: Already implemented in `updateApplicationStatus` — when employer moves an application to `completed`, a `WorkRecord` is batch-written. The "Confirm Work & Payout Completed" button in `CandidateDetailModal` triggers this path. The `paymentConfirmation` flag is still `false` (no separate payment UI needed).
- **PRIVACY.md**: Added full POPIA privacy notice covering data collection, sharing, retention, and deletion rights. Linked from the app footer.
- **`.env.example`**: Added `VITE_RECAPTCHA_SITE_KEY` and documented `GEMINI_MODEL` default.

## Functional Requirements

| ID | Status | Evidence / gap |
|---|---|---|
| FR-01 Authentication | Done | Multi-provider sign-in (Google, Apple, Email/Password, South African Phone SMS OTP) with invisible reCAPTCHA; trusted role onboarding; minimum-age attestation; cross-OS compatibility. |
| FR-02 Role-based access | Partial | Admin custom claim, trusted registration route and deny-client-create rule are implemented; emulator rules tests pass, but live integration is unverified. |
| FR-03 Candidate profile | Partial | Profile editing, legacy contact migration and the POPIA request/review/completion workflow exist; Firebase-backed end-to-end deletion is unverified. |
| FR-04 Skill evidence | Partial | Claims persist as `Self-reported`; optional private JPEG/PNG/WebP uploads (5 MB max) use owner/admin Storage rules; browser end-to-end verification and assessment attachment preview remain open. |
| FR-05 Verification states | Done | Four honest labels (Self-reported, Peer-endorsed, Task-assessed, Mentor-reviewed) with clear disclaimers; peer endorsements, 100-point rubric micro-tasks, and mentor reviews fully wired. |
| FR-06 Skill Passport | Partial | Passport and export views exist; emulator permissions and complete disclosure behavior are unverified. |
| FR-07 Employer profile | Partial | Employer profile editing exists; no persistence integration test. |
| FR-08 Job management | Partial | Job create/close, ZAR terms and report UI exist; employer updates are status-only in rules. Pending-report counters are implemented with Cloud Functions but are not yet deployed or emulator-tested. |
| FR-09 Matching | Done | Pure explainable scorer and edge-case tests exist; 10 matching tests pass. |
| FR-10 Applications | Partial | Authenticated server transaction creates records from persisted profile/claims, recalculates matches, prevents duplicates, and grants employer access atomically; emulator denies direct client writes. No Firebase-backed end-to-end test. |
| FR-11 Shortlisting | Partial | Employer status controls and shortlist-scoped contact access exist; emulator rules tests pass, but no full employer workflow test. |
| FR-12 Basic moderation | Partial | Admin reporting/moderation UI and rules exist; report review, suspension and counter updates need end-to-end verification. |
| FR-13 Offline-friendly drafts | Partial | Local draft support exists; recovery/connectivity integration is unverified. |
| FR-14 AI CV drafting | Partial | Server-side endpoint is token-protected, default-off, and excludes profile identifiers; provider terms and enabled-model behavior need review. |
| FR-15 In-app notifications | Done | Dedicated notification center modal, unread badge counter in header, fine-grained preferences toggles, idempotent deterministic IDs, Firestore rules, and tests T-13, T-14, T-15 pass. |
| FR-16 Location-aware filters | Done | Broad-area matching, centroid distance estimation via Haversine formula, privacy-safe distance filters on candidate view, no GPS tracking; tests T-16, T-17, T-18 pass. |
| FR-17 WhatsApp access | Not started | Deferred P2 integration. |
| FR-18 Transport support | Not started | Deferred P2 integration. |
| FR-19 Verification flows | Done | Peer endorsement requests with admin review queue, 100-pt practical micro-task rubrics with pass threshold (>=70), and designated mentor reviews; tests T-19, T-20, T-21, T-22 pass. |

## Screens

| Screen | Status |
|---|---|
| C-01 Candidate dashboard | Partial |
| C-02 Skills and evidence | Partial |
| C-03 Skill Passport | Partial |
| C-04 Opportunity detail and application | Partial; pre-apply visibility preview added |
| C-05 Applications | Partial |
| E-01 Employer dashboard | Partial |
| E-02 Create opportunity | Partial |
| E-03 Applicant list | Partial |
| E-04 Candidate detail | Partial; contact details now require shortlist access |
| Admin overview, reports and assessments | Partial |

## Tests

| ID | Status | Notes |
|---|---|---|
| T-01 | Partial | Registration data contract passes; Firebase-backed registration not run. |
| T-02 | Partial | No Firestore profile integration test. |
| T-03 | Done | Rules deny candidate verification-label changes; emulator test passes. |
| T-04 | Done | Rules permit valid employer job creation and deny self-verification; emulator tests pass. |
| T-05 | Done | Deterministic ID unit test and duplicate-create emulator test pass. |
| T-06 | Done | Other-employer applicant read is denied in emulator. |
| T-07 | Done | Closed-job application is denied in emulator. |
| T-08 | Done | Incomplete profile matching test passes. |
| T-09 | Partial | Local draft code exists; connectivity test not run. |
| T-10 | Partial | Prompt content test passes; no model-output test. |
| T-11 | Done | Non-admin report access denied in emulator. |
| T-12 | Done | Domain transitions and Firestore transition rules pass, including selected-to-not_selected rejection. |
| T-13 | Done | Deterministic notification ID prevents duplicates on status change. |
| T-14 | Done | Firestore security rules deny users reading another user's notifications. |
| T-15 | Done | Opted-out notification types are not created or delivered. |
| T-16 | Done | Candidate opportunity location and reachable distance filtering. |
| T-17 | Done | Centroid distance estimation using Haversine calculation. |
| T-18 | Done | Zero Geolocation / GPS POPIA Privacy guarantee (broad areas only). |
| T-19 | Done | Rubric scoring engine calculates 4 criteria (max 25 each, pass >= 70) and transitions claim to Task-assessed. |
| T-20 | Done | Peer endorsement request creation and approval transitions claim to Peer-endorsed. |
| T-21 | Done | Designated mentor review submission transitions claim to Mentor-reviewed. |
| T-22 | Done | Client self-promotion is prevented; honest verification caveats returned for all states. |
| T-23 | Done | Unit tests cover pending report count increases, resolution/dismissal decreases and reopening. |

Latest checks: `npm run typecheck`, `npm test` (64 tests across 18 suites), `npm run build`, and the Cloud Functions TypeScript build pass. The Functions dependency audit reports 0 vulnerabilities. `npm run test:rules` could not run because Java is not installed/on PATH; it must be rerun in an environment with Java. The client build still warns that the Firebase chunk exceeds 500 kB. Feature flags `notificationsInApp`, `locationFilters`, `peerEndorsement`, `microTasks`, `mentorReview`, and `offlineDrafts` are enabled; all other roadmap flags remain default OFF per Section 20.

## Security and Privacy Changes This Session

- Employer reads of candidate profiles and claims require an application-scoped grant.
- Candidate contact is stored separately and accessible to the candidate or a current shortlisted employer; legacy profile contact is migrated on candidate sign-in and denied to employer reads until removed.
- Role/profile creation uses a Firebase ID-token-protected Admin SDK route; clients cannot create their own role document.
- AI drafting is disabled unless `GEMINI_ENABLED=true`; names, contact details and location are excluded from the provider prompt.
- Employer work records are tied to the selected-to-completed application batch and immutable to clients afterward.
- Candidate-created claims remain self-reported; client entry of third-party contact details was removed.
- Signup requires a configurable minimum-age attestation and stores only a boolean, not a birth date; the default threshold is 18 pending product/legal policy confirmation.
- Candidate deletion requests can be submitted and reviewed, and an admin-only endpoint completes deletion from Firestore, Storage and Firebase Auth. The workflow requires live integration verification; the privacy contact and evidence-retention policy still need owner approval before public use.
- Optional evidence images are private Storage objects; employer screens receive only the candidate's text description.
- Evidence uploads accept JPEG/PNG/WebP up to 5 MB; Firestore stores a private object path and cleans the object up if claim persistence fails.

## Next Tasks

1. Set a Firebase development project ID, then deploy/test rules, Storage and Cloud Functions against it.
2. Add/run end-to-end tests for registration, profile save, job post, application, shortlist, withdrawal, evidence upload and account deletion against Firebase emulators or a development project.
3. Obtain owner approval for the privacy contact, evidence-retention policy and minimum-age/work rules before public use.
4. Confirm App Check enforcement, runtime IAM and production domains; verify AI provider terms before enabling drafting.
5. Assess accessibility and low-data performance, and investigate the large Firebase bundle.

## Decisions Needed Before Public Pilot

- Confirm submission deadline, current plan day, team owners, demo skill categories, Firebase development project ID, and minimum user age/work rules.
- Choose and publish a BASA privacy contact and evidence-retention policy.
- Review the AI provider's current data-use terms before enabling `GEMINI_ENABLED`.
