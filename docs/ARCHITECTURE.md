# Architecture

## Folder layout
```
src/
  app/            App shell, entry point, global store hook
  config/         ALL tunables: env.ts, app.ts (defaults, keys), scoring.ts, locations.ts
  domain/         Pure business logic and types (no React, no Firebase): matching, status transitions
  features/       Feature modules by role: auth, candidate, employer, admin (components per feature)
  shared/         Reusable UI (header, badges, banners)
  services/       Integrations: Firebase, offline sync queue, passport PDF export
  data/seed/      Fictional demo data (only loaded when VITE_ENABLE_DEMO_DATA=true)
server/           Express API: /api/cv-draft (AI optional), rate limiting, serves dist/ in production
firebase/         Firestore rules and indexes
tests/rules/      Security-rules tests (Firebase emulator)
scripts/          Operational scripts (admin claims)
```

## Configuration rules
Weights, thresholds, defaults, storage keys, collection names, API limits and URLs are configuration.
They live in `src/config/*` (client) or env vars read in `server/config.ts` (server).

## Matching engine
`M = 0.50·S + 0.25·E + 0.15·A + 0.10·L` (weights in `src/config/scoring.ts`). Skills (S), evidence strength (E), availability (A), location/work mode (L), each 0-100. The weights are hypotheses, not validated predictors. The score is a recommendation aid and never an automatic hiring decision.

## Application lifecycle
`submitted → under_review → shortlisted → selected → completed`, with `not_selected` and `withdrawn` exits. Enforced in `src/domain/applicationStatus.ts` and mirrored in the Firestore rules. Application ids are `<jobId>_<candidateId>`, which makes duplicates impossible.

## Data layer
Two stores implement the same `BasaStore` contract (`src/app/store/types.ts`); `VITE_ENABLE_DEMO_DATA` (build-time) picks one:

| Store | When | Behaviour |
|---|---|---|
| `useFirestoreStore` | production (default) | Firestore is the source of truth. Live listeners are scoped by role (candidates: own data + open jobs; employers: own jobs/applications + applicant profiles that allow sharing; admins: everything). Firestore's persistent cache gives offline reads and queued writes. |
| `useDemoStore` | `VITE_ENABLE_DEMO_DATA=true` | Fictional data in `localStorage`, no backend, persona switcher. For demos and UI work only. |

Roles: self-registration is limited to `candidate` / `employer` (onboarding screen, rules-enforced). `admin` is a Firebase custom claim read from the ID token; it is never writable by the client.

Registration is handled by the authenticated `/api/register` route, which derives the UID and email from the verified Firebase ID token and creates role/profile records with the Admin SDK. Firestore clients cannot create their own user-role document.

Design decisions worth knowing:
- New skill claims are always **Self-reported**. Peer/mentor/assessed labels come from other people, never from the candidate's own form.
- Reporters cannot write to jobs, so `reportCount` is maintained by the deployed Cloud Function triggers under `firebase/functions/`; it tracks pending job reports.
- Candidate profiles are readable by employers only when `popiaVisibility` allows it and, for `employers_only`, the candidate has applied to that employer.
- Candidate contact details live in `candidatePrivateProfiles`; employers receive access only in the same valid shortlist transition that updates an application. Existing legacy contact fields are moved on the candidate's next sign-in.
- Optional evidence images are stored privately in Firebase Storage. Only the candidate and admin role can read raw files; employer views use text evidence.
