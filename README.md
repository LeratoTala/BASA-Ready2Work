# BASA: Ready2Work

**Skills → Evidence → Work.** A skills-first, low-data employment web platform that turns informal South African experience into credible, verifiable evidence and connects young people to real entry-level jobs, paid tasks, and short work.

*BASA = Bridge to Actual Skills & Access.*

Users can switch between light and dark appearance; their selection is saved on the device.

---

## Quick Navigation: How to Use the Documentation

Use this quick-reference directory to find the exact documentation file for your current task:

| If your task is to... | Navigate to... | What you will find |
|---|---|---|
| **Audit panel feedback & requirements** | [`docs/PANEL_FEEDBACK_STATUS.md`](docs/PANEL_FEEDBACK_STATUS.md) | Item-by-item verification audit for Sections 28–35 (Core journey, honest labels, fraud protection, badges, metrics, feedback). |
| **Understand system architecture & data schemas** | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | End-to-end data flow, state management, matching algorithm mathematics, and Firestore collection schemas. |
| **Deploy to Google Cloud Run & Firebase** | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production Dockerfile, Google Cloud Run continuous deployment, Firebase App Check, and environment variables. |
| **Verify POPIA privacy & security safeguards** | [`docs/SECURITY.md`](docs/SECURITY.md) | POPIA data handling, phone/email contact masking, security rules, and right-to-be-forgotten deletion procedures. |
| **Conduct user validation interviews (Youth & SMMEs)** | [`docs/VALIDATION_PLAN.md`](docs/VALIDATION_PLAN.md) | 5-question interview protocols for 5–10 job seekers and 3–5 small businesses, with P1/P2 prioritization rubrics. |
| **Record & synthesize validation findings** | [`docs/VALIDATION_FINDINGS.md`](docs/VALIDATION_FINDINGS.md) | Real-world pilot validation interview notes, quotes, usability pain points, and issue tracking. |
| **Measure pilot outcomes & sustained income** | [`docs/SUCCESS_METRICS.md`](docs/SUCCESS_METRICS.md) | 5 core funnel indicators, 3-month sustained income follow-up methodology, and aggregate counting invariants. |
| **Pitch to judges & conduct a live walkthrough** | [`docs/PILOT_GUIDE.md`](docs/PILOT_GUIDE.md) | 5-minute judge demo script, persona walkthrough steps, and FNB App of the Year evaluation rubric. |
| **Check engineering roadmap & test coverage** | [`docs/PROGRESS.md`](docs/PROGRESS.md) | Comprehensive engineering changelog, functional requirements matrix (FR-01 to FR-22), and 111 automated tests. |

---

## Core Capabilities by Role

| Role | Core Capabilities |
|---|---|
| **Candidate (Youth Jobseeker)** | Build a verifiable Skill Passport with honest status labels, attach work photos/evidence, post single certificates covering multiple modular skills, request peer contractor endorsements, take 100-pt practical rubric tests, see explainable job matches ranked by commute distance, submit 1-click applications (duplicate applications strictly prevented), and track payment confirmation. |
| **Employer** | Post opportunities with mandatory transparent ZAR pay terms (`hourly`, `daily`, or `fixed`), inspect vetted applicant evidence instead of unverified paper CVs, advance candidates through hiring stages, view active listings vs. finished engagements, and explicitly confirm candidate payments. |
| **Assessor & Administrator** | Grade bench tests against standardized 100-pt rubrics, approve peer contractor endorsements, review badges/certificates and upgrade all linked passport skills simultaneously, inspect job compensation against statutory South African National Minimum Wage ($\ge \text{R}27.58/\text{hr}$), resolve community reports, and operate multiple administrative roles (Assessor vs Moderator). |

---

## Key Features & Safety Guardrails

### 1. 1 Badge or Certificate for Multiple Skills
* In South Africa, modular TVET and vocational awards (e.g. *Commercial Kitchen Operations & Food Safety*) certify multiple competencies.
* Candidates can upload a single certificate/badge and associate multiple skills (e.g. *Food Safety & Kitchen Hygiene*, *Barista & Espresso Brewing*, and *Inventory & Stock Control*).
* Unrecorded skills are automatically created on the candidate's Skill Passport.
* When an assessor reviews and approves the credential, all linked skills on the candidate's passport are verified simultaneously.

### 2. Duplicate Application Prevention
* Deterministic application IDs (`jobId_candidateId`) and store guards ensure that a candidate can **never apply for the same job post more than once**.
* The job detail view shows an active `Already Applied (Application on File)` disabled state to eliminate duplicate submissions.

### 3. Admin Job Pay Terms & National Minimum Wage (NMW) Inspector
* Admin dashboard features an `[Inspect Terms & NMW]` tool on every live listing.
* Automatically computes effective hourly earnings and validates compliance against the statutory South African National Minimum Wage benchmark of **$\text{R}27.58/\text{hour}$**.
* Non-compliant postings trigger an exploitation alert with 1-click listing suspension.

### 4. Work Completion Decoupled from Payment Confirmation
* When work is completed, payout confirmation defaults to `false`.
* The engagement shows `Work Completed · Payment Pending Confirmation` until the employer explicitly clicks `[Confirm Payment Sent]`.
* Completed engagements move off the active applicant list into a dedicated `Completed Engagements` tab.

### 5. In-App User Feedback Engine (Section 31.2)
* Built-in 5-star rating and qualitative feedback modal accessible across candidate, employer, and admin personas via the header `Feedback` button.
* Fully POPIA-compliant with zero tracking SDKs.

### 6. Multiple Admin Accounts
* Pre-seeded with multiple administrative accounts (e.g., **Nomsa Dlamini** for practical rubric assessments, and **Sipho Mthethwa** for platform moderation & wage compliance).

### 7. Categorized Candidate Job Views (Available, Applied, Completed, All)
* **Available Jobs:** Lists open opportunities the candidate has not applied to yet. Once a candidate applies, the post is automatically removed from this view to prevent duplicate applications.
* **Applied Jobs:** Shows live status for active applications in the employer review pipeline (`Under Review`, `Shortlisted`, `Selected`, etc.).
* **Completed Jobs:** Tracks finished work engagements and displays transparent payout status: **Paid** (employer confirmed) vs **Payment Pending** (waiting for employer confirmation).
* **All Jobs:** Complete overview of all opportunities on the platform, showing live application status badges on every applied post.

### 8. Job Closure Guard, Reopening & ID Transparency
* **Applicant Status Update Invariant:** Employers must update each applicant's status before closing a job listing; the system strictly guards against leaving applicants in unreviewed 'Submitted' limbo.
* **Job Reopening Support:** Closed listings can be reopened by employers, making them immediately available to new candidates.
* **Job ID Transparency:** Every job card across candidate and employer portals displays its persistent identifier (`Job ID: #job-id`).
* **Completed & Applied Listing Status:** Completed engagements show whether the underlying job is currently open or closed; Applied and All Jobs views clearly display closed listings with status chips.

### 9. Grade 6 Plain Language Accessibility
* **Everyday Terms Over Technical Jargon:** Candidate and employer interfaces use plain Grade 6 English so youth jobseekers and micro-employers can navigate effortlessly.
* **Transparent Matching Formula:** Jargon like "deterministic fit ranking" is replaced with clear terms: *"Skills you have (50%) + Proof & evidence (25%) + Available hours (15%) + How close it is (10%)"*.
* **Privacy Clarity:** POPIA centroid calculations are clearly explained as *"Privacy Protected: Town or area only (Zero live GPS tracking)"*.
* **Intuitive Action Guidance:** Every tab (Available, Applied, Completed, All) provides plain-language instructions on what to expect and why jobs move between views.

---

## Supported Operating Systems & Cross-Platform Access

BASA: Ready2Work is built with a responsive, mobile-first architecture installable as a Progressive Web App (PWA):

* **Android (Phones & Tablets):** Works seamlessly on Google Chrome, Samsung Internet, and mobile browsers. Installable directly to the home screen as a full-screen, low-data app.
* **iOS & iPadOS (Apple Devices):** Runs on Safari and Chrome for iOS with support for iPhone dynamic islands, notches, and home indicator safe areas (`viewport-fit=cover`). Installable via Safari's "Add to Home Screen".
* **Windows & macOS:** Full multi-column dashboard and split-pane workspace with keyboard navigation.
* **Linux & ChromeOS:** Native performance in all modern Chromium and WebKit browsers.

---

## Authentication Methods

The platform provides multi-provider authentication ([`src/features/auth/components/SignInPage.tsx`](src/features/auth/components/SignInPage.tsx)):

1. **Google 1-Tap Sign-In:** Instant authentication for users with an existing Google account.
2. **Apple Sign-In:** Powered by Firebase Apple OAuth (`apple.com`) across iOS, macOS, and web browsers.
3. **Email & Password:** Standard login and account registration with full name, email, and password.
4. **South African Cell Phone SMS OTP:** For candidates without an email address. Enter a South African mobile number (`082 123 4567` or `+27 82 123 4567`), complete the invisible background reCAPTCHA, and enter the 6-digit SMS verification code.
5. **Quick Demo Personas (Pitch & Testing Mode):** When `VITE_ENABLE_DEMO_DATA=true`, evaluators can switch between pre-seeded personas with one click:
   * 👷 **Candidate:** Thabo Ndlovu (Jobseeker in Soweto · Barista & Solar Assistant)
   * 👷 **Candidate:** Nomvula Khumalo (Jobseeker in Alexandra · Digital Assistant)
   * 🏢 **Employer:** Zola Artisan Café (Specialty Hospitality & Retail)
   * 🏢 **Employer:** SunPower Solars Gauteng (Renewable Energy Employer)
   * 🛡️ **Assessor:** Nomsa Dlamini (Practical Rubric Assessor)
   * 🛡️ **Moderator:** Sipho Mthethwa (Platform Moderator & Compliance Officer)

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
* **Task-assessed:** Evaluated against an objective 100-point rubric ($\ge 70$ pass mark) by a registered assessor, or verified via proctored benchmark/accredited trade credential.
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

## Getting Started & Local Setup

### Prerequisites
* **Node.js:** v20.x or higher
* **npm:** v10.x or higher

### Installation & Execution Steps

```bash
# 1. Clone repository
git clone <your-repo-url> && cd BASA-Ready2Work

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. (Optional) Run demo seed script
node scripts/seed_demo.mjs

# 5. Start development server
npm run dev
# App will run at: http://localhost:3000
```

### Verification & Validation Commands

Always run these commands before submitting changes:

```bash
# TypeScript compiler check (must return 0 errors)
npm run typecheck

# Full test suite (121 tests across 40 suites)
npm test

# Production bundle build
npm run build
```

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server with hot module reloading (HMR) |
| `npm test` | Run full automated test suite (121 tests across 40 suites) |
| `npm run typecheck` | Verify TypeScript compilation with zero emitted errors |
| `npm run build` | Build optimized client bundle for production to `dist/` |
| `npm start` | Run server in production mode |
| `node scripts/seed_demo.mjs` | Generate fresh demo candidates, employers, jobs, and claims |
| `npm run test:rules` | Run Firebase Firestore security rules emulator tests |

---

## License & Intellectual Property

Developed for the **FNB App of the Year** challenge under the **Bridge to Actual Skills & Access (BASA)** initiative.
All rights reserved © 2026 BASA Ready2Work Team.
