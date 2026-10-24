# BASA: Ready2Work

**Skills → Evidence → Work.** A skills-first, low-data employment platform that turns informal South African experience into credible evidence and connects young people to entry-level jobs, paid tasks and short work.

*BASA = Bridge to Actual Skills & Access.*

## What it does

| Role | Can do |
|---|---|
| **Candidate** | Record skills with evidence, build a Skill Passport with honest verification labels, see explainable job matches, apply once per job, track status. |
| **Employer** | Post jobs with clear ZAR pay terms, review applicants and allowed evidence, move applications through valid status transitions. |
| **Assessor / Admin** | Grade practical demos against rubrics, moderate reported listings, view pilot metrics. |

**Verification labels** (never conflated): Self-reported · Peer-endorsed · Task-assessed · Mentor-reviewed.
**Matching** is rules-based and explainable: `M = 0.50·S + 0.25·E + 0.15·A + 0.10·L`. It aids decisions; it never makes them.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Firebase (Auth, Firestore, Admin SDK) · Express (API) · optional Gemini for CV drafting.
One responsive codebase targets browsers on phone, tablet and desktop, and is installable as a PWA.

## Getting started

Requires Node 20+ and npm.

```bash
git clone <your-repo-url> && cd BASA-Ready2Work
npm install
cp .env.example .env      # fill in your Firebase web config (see below)
npm run dev               # http://localhost:3000
```

Before pushing or validating locally, install dependencies first and then run:

```bash
npm run typecheck
npm test
npm run build
npm audit
```

Try it with fictional data and no backend: set `VITE_ENABLE_DEMO_DATA=true` in `.env` (Firebase settings are then optional). Never enable this in production.

## Current status

This repository is an MVP-level working web app for BASA: Ready2Work. The core product flow is implemented: role-based onboarding, candidate and employer dashboards, explainable matching, application status handling, admin/assessor views, Firebase-backed persistence, optional demo mode, and an Express API for AI-assisted CV drafting.

The repo is not yet marked as production-ready; the remaining work is primarily validation, security hardening, and launch-readiness tasks such as emulator verification, App Check, and privacy/deletion controls.

### Firebase setup
1. Create a Firebase project; add a **Web app** and copy its config into the `VITE_FIREBASE_*` variables.
2. Enable **Authentication → Google**.
3. Create Firestore and a Storage bucket, then deploy Firestore and Storage rules: `firebase deploy --only firestore:rules,firestore:indexes,storage`.
4. Grant admin/assessor access with `scripts/set-admin-claim.mjs` (see `docs/DEPLOYMENT.md`).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Vite + API) |
| `npm run build` | Production client build to `dist/` |
| `npm start` | Serve build + API in production mode |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (matching engine, status rules) |
| `npm run test:rules` | Firestore security-rules tests (needs emulator; see `tests/rules/`) |

## Configuration (no hard-coded values)

- **Environment:** every URL, key, limit and feature flag is in `.env` (documented in `.env.example`).
- **AI CV drafting:** disabled by default; only enable with `GEMINI_ENABLED=true` after reviewing the provider's current data-use terms.
- **Product tunables:** scoring weights, evidence scores, locations, defaults and storage keys are in `src/config/`.
- **Business rules:** pure, tested functions in `src/domain/`.

## Project structure

```
src/app        app shell + store      src/config     all tunables
src/domain     pure logic + types     src/features   auth / candidate / employer / admin
src/shared     reusable UI            src/services   firebase, sync, PDF export
src/data/seed  demo data (opt-in)     server/        API (CV drafting, rate limiting)
firebase/      rules + indexes        tests/ docs/   tests and documentation
```
Details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Security and privacy

Roles, ownership and status transitions are enforced in Firestore rules, not in the UI. No identities are hard-coded; admin status is a custom claim. Locations are broad areas (no GPS). See [`docs/SECURITY.md`](docs/SECURITY.md) for the pre-launch checklist. This is not legal advice; review POPIA obligations before a public launch.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (Firebase rules, Cloud Run/Node hosting, PWA, Capacitor/Tauri).

## Roadmap

- [x] **Phase 1: Foundation.** Feature-based structure, config/env separation, hardened rules, unit tests, CI, Docker.
- [x] **Phase 2: Real backend (code complete, needs emulator verification).** Firestore-backed store with role-scoped live listeners and offline cache; onboarding; admin via custom claim. The localStorage store remains as demo mode only.
- [ ] **Phase 2b:** Cloud Function to maintain `reportCount`; run `npm run test:rules` in CI.
- [ ] **Phase 3: Responsive and accessibility pass.** Remove fixed-width layouts, test on real phones, keyboard and contrast audit, measure bundle and data use.
- [ ] **Phase 4: Launch readiness.** App Check, privacy notice, data retention and deletion, monitoring, store wrappers if needed.

## Project documents

The original specification and 12-day plan: [`docs/BASA_Project_Specification.pdf`](docs/BASA_Project_Specification.pdf).
Note: the spec proposes Flutter; this codebase uses React/TypeScript, which satisfies the same product requirements.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).
