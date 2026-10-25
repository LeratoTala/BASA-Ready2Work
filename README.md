# BASA: Ready2Work

**Skills → Evidence → Work.** A skills-first, low-data employment web platform that turns informal South African experience into credible, verifiable evidence and connects young people to real entry-level jobs, paid tasks, and short work.

*BASA = Bridge to Actual Skills & Access.*

---

## What It Does

| Role | Core Capabilities |
|---|---|
| **Candidate (Youth Jobseeker)** | Build a verifiable Skill Passport with honest status labels, attach work photos/evidence, request peer contractor endorsements, take 100-pt practical rubric tests, see explainable job matches ranked by commute distance, and apply in one click. |
| **Employer** | Post opportunities with mandatory transparent ZAR pay terms (`R250/day`, `R4,500/month`), inspect vetted applicant evidence instead of unverified paper CVs, and advance candidates through valid hiring stages (`Applied` → `Shortlisted` → `Selected`). |
| **Assessor & Administrator** | Grade bench tests against standardized 100-pt rubrics, approve peer contractor endorsements, verify and moderate job postings to prevent scams/exploitation, review community reports, and monitor pilot employment targets. |

---

## Supported Operating Systems & Cross-Platform Access

BASA: Ready2Work is built with a responsive, mobile-first architecture installable as a Progressive Web App (PWA):

* **Android (Phones & Tablets):** Works seamlessly on Google Chrome, Samsung Internet, and mobile browsers. Installable directly to the home screen as a full-screen, low-data app.
* **iOS & iPadOS (Apple Devices):** Runs on Safari and Chrome for iOS with support for iPhone dynamic islands, notches, and home indicator safe areas (`viewport-fit=cover`). Installable via Safari's "Add to Home Screen".
* **Windows & macOS:** Full multi-column dashboard and split-pane workspace with keyboard navigation.
* **Linux & ChromeOS:** Native performance in all modern Chromium and WebKit browsers.

---

## How to Sign In

The platform provides universal multi-provider authentication ([`src/features/auth/components/SignInPage.tsx`](src/features/auth/components/SignInPage.tsx)) across three convenient tabs:

1. **Google 1-Tap Sign-In (Social Tab):**
   * Instant authentication for users with an existing Google account (recommended for Android users).
2. **Apple Sign-In (Social Tab):**
   * Powered by Firebase Apple OAuth (`apple.com`). Delivers 1-tap sign-in on iPhone, iPad, and Mac, while remaining accessible from any browser.
3. **Email & Password (Email Tab):**
   * Standard account login and new account registration with full name, email, and password (includes show/hide password toggle).
4. **South African Cell Phone SMS OTP (Cell Phone Tab):**
   * For candidates without an email address. Enter a South African mobile number (`082 123 4567` or `+27 82 123 4567`), complete the invisible background reCAPTCHA, and enter the 6-digit SMS verification code.
5. **Quick Demo Personas (Pitch & Testing Mode):**
   * When `VITE_ENABLE_DEMO_DATA=true`, evaluators can switch between pre-seeded personas with one click:
     * 👷 **Candidate:** Sipho Khumalo (Jobseeker in Soweto · Barista & Solar Assistant)
     * 🏢 **Employer:** Khaya Green Solutions (Hiring Manager · Specialty Roastery & Solar)
     * 🛡️ **Assessor/Admin:** Nandi Assessor (Technical Assessor & Moderation Workspace)

---

## Access Rights & User Roles (RBAC)

Access rights are enforced cryptographically at the database kernel level in [`firebase/firestore.rules`](firebase/firestore.rules):

| Role | Access Rights & Boundaries |
|---|---|
| **Candidate** (`candidate`) | Can view and edit their own profile, submit skill claims, upload work evidence, request peer endorsements, view assessment rubrics, apply to open jobs, and track their applications. **Cannot view other candidates' private data or self-promote verification badges.** |
| **Employer** (`employer`) | Can create, edit, and close their own job listings, view applicants who applied to their postings, and advance application statuses. **Can only see candidate contact details after explicitly shortlisting them.** |
| **Assessor & Admin** (`admin: true`) | Can grade candidate demonstrations against 100-point rubrics, approve peer endorsements, review/suspend job postings, resolve community fraud reports, and process account deletion requests. |
| **Platform Owner** | Holds cloud root access, manages cloud infrastructure, and grants/revokes admin privileges. |

---

## How Admin Rights Are Granted

**Security Principle:** Public users can **only** register as a Candidate or an Employer. To prevent unauthorized privilege escalation, there is no public "Register as Admin" button.

Admin privileges are granted using **Firebase Custom Claims** through a secure backend script:

1. Have your staff member or assessor sign in once via Google, Apple, or Email.
2. From a trusted administrative terminal, run:
   ```bash
   node scripts/set-admin-claim.mjs staff@yourdomain.com
   ```
3. To revoke admin access:
   ```bash
   node scripts/set-admin-claim.mjs staff@yourdomain.com --revoke
   ```
4. The user signs out and back in. The app automatically recognizes the cryptographic `{ admin: true }` claim, reveals the **Admin Center**, and unlocks backend database permissions.

---

## Where the Owner Manages & Oversees Everything After Deploying

After deployment, the platform owner oversees operations across two layers:

### 1. Inside the Live Web Application (Operational Governance)
Log in with your owner account (with the admin claim granted) to access the **Admin Center**:
* 📊 **Pilot Overview:** Monitor real-time metrics (Candidates, Participating Businesses, Active Jobs, Assessed Skills) against FNB App of the Year targets.
* 💼 **Manage Jobs:** View all posted jobs, audit ZAR pay rates, verify employer credentials, and suspend deceptive or scam listings with one click.
* 🏆 **Assessor Workspace:** Grade candidate practical rubrics ($\ge 70/100$ pass mark) and approve peer contractor endorsements.
* 🚩 **Moderation Reports:** Resolve community fraud reports and process POPIA account deletion tickets.

### 2. In Cloud Consoles (Infrastructure & Security Governance)
* **Firebase Console ([console.firebase.google.com](https://console.firebase.google.com)):**
  * *Authentication:* View registered users, manage auth providers, disable accounts.
  * *Firestore Database:* Query live collections (`jobs`, `candidateProfiles`, `skillClaims`, `applications`, `endorsements`).
  * *Storage:* Inspect uploaded evidence images and certificates.
  * *App Check:* Protect backend APIs from bots, scraping, and unauthorized traffic.
* **Google Cloud Console ([console.cloud.google.com](https://console.cloud.google.com)):**
  * Monitor Google Cloud Run containers, manage CPU/memory auto-scaling, and configure custom domain SSL.

---

## Honest Verification Standards

Verification labels are never conflated or forged:

```
[ Candidate Claims Skill ] ──> Status: "Self-reported" (Default)
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
[ Peer Endorsement ]     [ Micro-Task Rubric ]      [ Designated Mentor ]
Approved by coworker/    Graded >= 70/100 by        Assessed by accredited
supervisor/contractor    practical assessor         master artisan
      │                           │                           │
      ▼                           ▼                           ▼
Status: "Peer-endorsed"   Status: "Task-assessed"    Status: "Mentor-reviewed"
```

* **Self-reported:** Entered by the candidate; not independently confirmed.
* **Peer-endorsed:** Confirmed by an identified coworker, supervisor, or community contractor who observed the candidate doing the work.
* **Task-assessed:** Evaluated against an objective 100-point rubric ($\ge 70$ pass mark) by a registered assessor.
* **Mentor-reviewed:** Portfolio evaluated by an accredited trade mentor or youth employment partner.

---

## Explainable Matching Algorithm

Matching is 100% deterministic, rules-based, and explainable. It aids decisions; it **never** makes automated rejections:

$$\mathbf{M = 0.50 \cdot S + 0.25 \cdot E + 0.15 \cdot A + 0.10 \cdot L}$$

* **$\mathbf{S}$ (Skill Alignment, 50%):** Direct overlap between candidate skills and job requirements: $(\text{Matched} / \text{Required}) \times 100$.
* **$\mathbf{E}$ (Evidence Strength, 25%):** Quality multiplier based on verification status (Self-reported: 60 pts, Peer-endorsed: 85 pts, Task-assessed: 100 pts).
* **$\mathbf{A}$ (Availability Fit, 15%):** Matches candidate availability (`immediate`, `full_time`, `part_time`, `weekends`) with job terms.
* **$\mathbf{L}$ (Location Fit, 10%):** Estimated commute feasibility using pure Haversine centroid math without GPS tracking.

---

## Getting Started

Requires Node 20+ and npm.

```bash
git clone <your-repo-url> && cd BASA-Ready2Work
npm install
cp .env.example .env      # fill in your Firebase web config (see below)
npm run dev               # http://localhost:3000
```

Before pushing or validating locally, run:

```bash
npm run typecheck         # TypeScript check (0 errors)
npm test                  # 60 tests across 17 test suites (0 failures)
npm run build             # Production Vite client build to dist/
npm audit                 # Security vulnerability audit
```

Try it with fictional data and no backend: set `VITE_ENABLE_DEMO_DATA=true` in `.env`.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Vite + Express API) |
| `npm run build` | Production client build to `dist/` |
| `npm start` | Serve build + API in production mode |
| `npm run typecheck` | TypeScript compiler check |
| `npm test` | Unit & domain tests (60 tests across 17 suites) |
| `npm run test:rules` | Firestore security rules emulator tests |

---

## Roadmap & Progress

- [x] **Phase 1: Foundation.** Feature-based structure, config/env separation, hardened rules, unit tests, CI, Docker.
- [x] **Phase 2: Real backend.** Firestore-backed store with role-scoped live listeners and offline cache; onboarding; admin via custom claim.
- [x] **FR-01: Multi-Provider Authentication.** Google 1-tap, Apple Sign-in, Email & Password, and South African Phone SMS OTP with invisible reCAPTCHA.
- [x] **Roadmap R1: In-App Notifications (FR-15).** Dedicated notification center modal, unread badge counter in header, fine-grained preferences toggles, and idempotent alerts (tests T-13, T-14, T-15 pass).
- [x] **Roadmap R2: Location-Aware Filters (FR-16).** Centroid-based distance estimation between 30+ South African areas, interactive candidate distance & work mode filters, without GPS tracking (tests T-16, T-17, T-18 pass).
- [x] **Roadmap R3: Verification Flows (FR-19).** Peer endorsement request/review queue, practical 100-pt micro-tasks rubrics, designated mentor reviews, and live admin job moderation (tests T-19, T-20, T-21, T-22 pass).
- [ ] **Roadmap R4: Micro-Internships (FR-21).** Micro-internship listings and milestone sign-offs are still outstanding. Immutable completion work records are already created when an application is marked completed; see the progress tracker for verification status.

---

## Documentation

* [Architecture & Data Flow](docs/ARCHITECTURE.md)
* [Deployment & Hosting Guide](docs/DEPLOYMENT.md)
* [Security Baseline & POPIA Compliance](docs/SECURITY.md)
* [Progress Tracker & Requirements Matrix](docs/PROGRESS.md)
* [Contributing Guide](CONTRIBUTING.md)
