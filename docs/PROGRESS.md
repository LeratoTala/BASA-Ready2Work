# BASA: Ready2Work Progress

Updated: 2026-10-24

## Plan Position

First incomplete day: Day 4, Firebase development environment. Local Firestore emulator tests now pass, but no Firebase development project ID was supplied or configured. This repository intentionally remains React/TypeScript rather than being re-scaffolded as Flutter.

## Functional Requirements

| ID | Status | Evidence / gap |
|---|---|---|
| FR-01 Authentication | Partial | Google sign-in/sign-out exist; `/api/register` uses a verified token; signup stores a minimum-age yes/no attestation (default 18), but no Firebase-backed end-to-end test or age-policy approval. |
| FR-02 Role-based access | Partial | Admin custom claim, trusted registration route, deny-client-create rule; Firestore rules suite passes, but no live Firebase integration test. |
| FR-03 Candidate profile | Partial | Firestore profile editing, legacy contact migration and an in-app deletion request/review ticket exist; no integration test or deletion-completion workflow. |
| FR-04 Skill evidence | Partial | Claims persist as `Self-reported`; optional private JPEG/PNG/WebP uploads (5 MB max) use owner/admin Storage rules; no browser end-to-end test or assessment attachment preview. |
| FR-05 Verification states | Partial | Four labels and caveats exist; only task assessment has a working assessor flow. Peer/mentor confirmation flows are absent. |
| FR-06 Skill Passport | Partial | Passport and export views exist; emulator permissions and complete disclosure behavior are unverified. |
| FR-07 Employer profile | Partial | Employer profile editing exists; no persistence integration test. |
| FR-08 Job management | Partial | Job create/close, ZAR terms and report UI exist; employer updates are status-only in rules. Report counter maintenance remains incomplete. |
| FR-09 Matching | Done | Pure explainable scorer and edge-case tests exist; 10 matching tests pass. |
| FR-10 Applications | Partial | Authenticated server transaction creates records from persisted profile/claims, recalculates matches, prevents duplicates, and grants employer access atomically; emulator denies direct client writes. No Firebase-backed end-to-end test. |
| FR-11 Shortlisting | Partial | Employer status controls and shortlist-scoped contact access exist; emulator rules tests pass, but no full employer workflow test. |
| FR-12 Basic moderation | Partial | Admin reporting/moderation UI and rules exist; report review and suspension workflow need end-to-end verification. |
| FR-13 Offline-friendly drafts | Partial | Local draft support exists; recovery/connectivity integration is unverified. |
| FR-14 AI CV drafting | Partial | Server-side endpoint is token-protected, default-off, and excludes profile identifiers; provider terms and enabled-model behavior need review. |
| FR-15 In-app notifications | Partial | Live application status is visible; dedicated notification workflow is absent. |
| FR-16 Location-aware filters | Partial | Broad-area matching exists; location filter workflow is incomplete. |
| FR-17 WhatsApp access | Not started | Deferred P2 integration. |
| FR-18 Transport support | Not started | Deferred P2 integration. |

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

Latest checks: `npm run typecheck` passed; `npm test` passed (24 tests); combined Firestore/Storage emulator tests passed (27 tests); `npm run build` passed with a 658 kB Firebase chunk warning. The production image could not be built because Docker Desktop is unavailable. `npm audit --omit=dev` reports 0 vulnerabilities; full audit reports 5 moderate advisories in Firebase CLI development dependencies, with only a breaking downgrade offered. CI runs both emulator suites with Java 21.

## Security and Privacy Changes This Session

- Employer reads of candidate profiles and claims require an application-scoped grant.
- Candidate contact is stored separately and accessible to the candidate or a current shortlisted employer; legacy profile contact is migrated on candidate sign-in and denied to employer reads until removed.
- Role/profile creation uses a Firebase ID-token-protected Admin SDK route; clients cannot create their own role document.
- AI drafting is disabled unless `GEMINI_ENABLED=true`; names, contact details and location are excluded from the provider prompt.
- Employer work records are tied to the selected-to-completed application batch and immutable to clients afterward.
- Candidate-created claims remain self-reported; client entry of third-party contact details was removed.
- Signup requires a configurable minimum-age attestation and stores only a boolean, not a birth date; the default threshold is 18 pending product/legal policy confirmation.
- Candidate deletion requests can be submitted and reviewed, but no in-app operation marks them completed or deletes Firebase Auth/Firestore data; the operator runbook and retention policy remain launch blockers.
- Optional evidence images are private Storage objects; employer screens receive only the candidate's text description.
- Evidence uploads accept JPEG/PNG/WebP up to 5 MB; Firestore stores a private object path and cleans the object up if claim persistence fails.

## Next Tasks

1. Run a fresh production build and verify the production container; Docker Desktop was unavailable for the last image build.
2. Add end-to-end tests for registration, profile save, job post, server application, shortlist, and withdrawal against a configured Firebase project/emulators.
3. Define and implement the operator deletion-completion workflow; publish a privacy contact plus evidence-retention policy before public use.
4. Confirm minimum sign-up age/work rules, enable Firebase App Check, and verify runtime IAM/production domains.
5. Verify evidence upload and application flows in a configured Firebase project/browser, then assess accessibility/low-data performance and address the large Firebase bundle.

## Decisions Needed Before Public Pilot

- Confirm submission deadline, current plan day, team owners, demo skill categories, Firebase development project ID, and minimum user age/work rules.
- Choose and publish a BASA privacy contact and evidence-retention policy.
- Review the AI provider's current data-use terms before enabling `GEMINI_ENABLED`.
