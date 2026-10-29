# BASA: Ready2Work

**Skills -> Evidence -> Work.** A skills-first, low-data employment web platform that turns informal South African experience into credible, verifiable evidence and connects young people to real entry-level jobs, paid tasks, and short work.

*BASA = Bridge to Actual Skills & Access.*

🔗 **Live Application:** [https://basa-ready2work-27af9.web.app](https://basa-ready2work-27af9.web.app)  
📦 **Repository:** [https://github.com/LeratoTala/BASA-Ready2Work](https://github.com/LeratoTala/BASA-Ready2Work)

Users can switch between light and dark appearance; their selection is saved on the device.

---

## Quick Navigation: Documentation Directory

Use this quick-reference directory to find the exact documentation file for your task:

| If your task is to... | Navigate to... | What you will find |
|---|---|---|
| **Audit panel feedback & requirements** | [`docs/PANEL_FEEDBACK_STATUS.md`](docs/PANEL_FEEDBACK_STATUS.md) | Item-by-item verification audit for Sections 28-35 (Core journey, honest labels, fraud protection, badges, metrics, feedback). |
| **Understand system architecture & data schemas** | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | End-to-end data flow, state management, matching algorithm mathematics, and Firestore collection schemas. |
| **Deploy to Google Cloud Run & Firebase** | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production Dockerfile, Google Cloud Run continuous deployment, Firebase App Check, and environment variables. |
| **Verify POPIA privacy & security safeguards** | [`docs/SECURITY.md`](docs/SECURITY.md) | POPIA data handling, phone/email contact masking, security rules, and right-to-be-forgotten deletion procedures. |
| **Data retention & POPIA compliance schedule** | [`docs/DATA_RETENTION.md`](docs/DATA_RETENTION.md) | Split retention policy (Skill Passport active history vs 5-yr tax/audit billing records vs aggregate metrics), and self-service account deletion cascade. |
| **AI CV safeguards & anti-hallucination** | [`docs/AI_SAFEGUARDS.md`](docs/AI_SAFEGUARDS.md) | Server-side drafting, allow-list diffs, superlative blocklists, `{{NAME}}` placeholder (zero candidate name sent to LLM), and human truth confirmation. |
| **Sustainable business model & economics** | [`docs/BUSINESS_MODEL.md`](docs/BUSINESS_MODEL.md) | Employer subscription architecture (R0, R199, R599), break-even thresholds (40 Starter SMMEs), candidate zero-fee guarantee, and plan-blind matching. |
| **Employer willingness-to-pay validation** | [`docs/BUSINESS_MODEL_VALIDATION.md`](docs/BUSINESS_MODEL_VALIDATION.md) | Active job gating, in-app 4-question pricing pulse survey, objection responses, and revenue pilot tracking. |
| **Conduct user validation interviews (Youth & SMMEs)** | [`docs/VALIDATION_PLAN.md`](docs/VALIDATION_PLAN.md) | 5-question interview protocols for 5-10 job seekers and 3-5 small businesses, with P1/P2 prioritization rubrics. |
| **Record & synthesize validation findings** | [`docs/VALIDATION_FINDINGS.md`](docs/VALIDATION_FINDINGS.md) | Real-world pilot validation interview notes, quotes, usability pain points, and issue tracking. |
| **Measure pilot outcomes & sustained income** | [`docs/SUCCESS_METRICS.md`](docs/SUCCESS_METRICS.md) | 5 core funnel indicators, 3-month sustained income follow-up methodology, and aggregate counting invariants. |
| **Pitch to judges & conduct a live walkthrough** | [`docs/PILOT_GUIDE.md`](docs/PILOT_GUIDE.md) | 5-minute judge demo script, persona walkthrough steps, and FNB App of the Year evaluation rubric. |
| **Check engineering roadmap & test coverage** | [`docs/PROGRESS.md`](docs/PROGRESS.md) | Comprehensive engineering changelog, functional requirements matrix (FR-01 to FR-22), and 218 automated tests. |

---

## Core Capabilities by Role

| Role | Core Capabilities |
|---|---|
| **Candidate (Youth Jobseeker)** | Build a verifiable Skill Passport with honest status labels, attach work photos/evidence, post single certificates covering multiple modular skills, request peer contractor endorsements, take 100-pt practical rubric tests, see explainable job matches ranked by commute distance, submit 1-click applications (duplicate applications strictly prevented), and track payment confirmation. |
| **Employer** | Post opportunities with mandatory transparent ZAR pay terms (`hourly`, `daily`, or `fixed`), inspect vetted applicant evidence instead of unverified paper CVs, advance candidates through hiring stages, view active listings vs. finished engagements, and explicitly confirm candidate payments. |
| **Assessor & Administrator** | Grade bench tests against standardized 100-pt rubrics, approve peer contractor endorsements, review badges/certificates and upgrade all linked passport skills simultaneously, inspect job compensation against statutory South African National Minimum Wage guidelines, resolve community reports, and operate multiple administrative roles (Assessor vs Moderator). |

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
* Automatically computes effective hourly earnings and prompts administrators to check the rate against the current statutory National Minimum Wage gazetted by the Department of Employment and Labour.
* Enables administrative oversight and review under Section 30 youth worker protections.

### 4. Work Completion Decoupled from Payment Confirmation & Workplace Time Accounting
* When work is completed, payout confirmation defaults to `false`.
* The engagement shows `Work Completed | Payment Pending Confirmation` until the employer explicitly clicks `[Confirm Payment Sent]`.
* **Pay Rate Focus (No Total Lump Sum Display):** The platform intentionally avoids lump-sum payout totals on both candidate and employer dashboards. Instead, it prominently displays the transparent agreed pay rate in unit terms: **money/hour**, **money/day**, **money/week**, **money/fortnight**, or **money/month** (e.g., `Rate: R60 / hour`, `Rate: R450 / day`, `Rate: R1,500 / week`, `Rate: R3,200 / fortnight`, or `Rate: R6,500 / month`).
* **Total Time Served in Institution (No Separate Day-Off Flags):** The pre-payout confirmation modal and completed work cards record the total time served at the institution (e.g., `20 days served (160 hrs)`). Any approved days off or leaves are not flagged or displayed separately as day offs; they contribute directly under the total amount of time served in that institution.
* **Employment Start Date Guardrail:** When a candidate is actively employed at a workplace (`Selected` / in-progress), the interface **strictly displays only the employment start date** (e.g., `Started: 2026-10-15`), never displaying the end date or completion deadline until the duration is actually completed.
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

### 10. Absorption Pathway & Opportunity Type Transparency
* **Employer Specification on Publishing:** When publishing a post, employers must specify the engagement/absorption pathway so applicants apply knowing what to expect:
  * **Permanent Position:** Long-term permanent employment with ongoing career absorption and statutory benefits.
  * **Graduate / Practical Internship:** Structured entry-level training (3-12 months) with absorption potential.
  * **Micro-Internship / Project Gig:** Short-term trial engagement (1-4 weeks) to evaluate mutual fit.
  * **Casual / Relief Work:** Flexible shift-based, day-to-day, or seasonal coverage.
  * **Learnership / Apprenticeship:** Structured vocational training combining practical on-site hours with trade theory.
  * **Fixed-Term Contract:** Pre-agreed employment duration for specific project deliverables.
* **Applicant Expectation Banner:** Job cards and opportunity detail modals prominently display the absorption badge and detailed expectations.

### 11. Employer Subscription Model & Pilot Pricing (Section 39)
* **Candidates NEVER Pay:** Jobseekers never pay any fee to register, build a Skill Passport, get verified, or apply for opportunities.
* **100% Plan-Blind Matching:** Candidate ranking algorithms are completely blind to an employer's subscription plan—paying more never elevates unverified applicants or inflates match scores.
* **No Payment Provider (Manual Invoicing Only):** There is NO third-party card processing gateway or automated recurring debit provider (no Stripe, PayFast, or Ozow). Subscription tier upgrades operate strictly on a request-and-approval model: the employer submits a request with PO number/billing details -> a BASA administrator invoices manually and approves -> server Admin SDK updates the plan.
* **Calibrated Pilot Tiers (Assumptions to Validate):**
  * **Free (SMME Pilot):** 1 active job listing at a time, full applicant review, basic candidate profiles (permanently free for informal and micro-enterprises).
  * **Starter (R199/month):** Up to 5 active jobs, verified candidate filters & shortlists, applicant profile view.
  * **Business Growth (R599/month):** Up to 20 active jobs, verified-first matching filters, priority email support.
  * **Enterprise / Partner (Custom SLA):** Unlimited listings, bespoke trade rubrics, dedicated account review.
* **Honest Workflow, Instant Downgrade & Zero Lock-In:** Upgrades operate via an invoiced request workflow requiring admin confirmation. In contrast, **downgrades and cancellations are instant self-service actions** requiring zero admin approval:
  * Cancelling instantly resets the subscription to the Free SMME Pilot tier (`R0/month`).
  * **Strict Tier Rule Adherence:** If currently open active jobs exceed the target tier's capacity (Free: 1, Starter: 5, Business: 20), the system automatically declines the action and requires the employer to close excess jobs first.
  * **Zero Deletion Guarantee:** Downgrading or cancelling **never deletes** past jobs or applicant records.
  * **30-Day Billing Cycle Expiry:** Activated plans run for 30 days before next invoice renewal; unrenewed plans revert to Free tier access.

### 12. Dual Runtime Architecture (Start Screen)
* **Start Screen:** Clean landing screen offering one-click entry into either **Real Accounts Mode** or **Quick Access Demo Mode** (see [docs/DEMO_MODE.md](docs/DEMO_MODE.md)).
* **Quick Access Demo Mode:** Zero-setup on-device sandbox with 7 pre-configured personas (candidates, employers, assessors). Operates completely in browser localStorage with prefix `basa_demo_v1:`. Includes 1-click persona switching, simulated AI CV drafting, and an instant reset button. Requires **zero cloud credentials** (see [docs/DEMO_ACCOUNTS.md](docs/DEMO_ACCOUNTS.md)).
* **Real Accounts Mode:** Full Firestore mode with live Firebase Auth (Google, Email, Phone SMS), cloud Firestore data, and automatic client fallback for hosting-only environments.

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
5. **Quick Access Demo Mode (Instant Sandbox):** Select "Quick Access Demo" on the Start Screen to explore with 7 sample profiles—no sign-up, passwords, or Firebase Auth required:
   - **Candidate (Thabo Ndlovu):** Solar installer & barista with task-assessed and peer-endorsed claims.
   - **Candidate (Nomvula Dlamini):** Youth barista & retail assistant with pending peer endorsement and active notifications.
   - **Employer (Zola Sithole):** Township Cafe owner on Free Plan with 1 active job post and applicant pipeline.
   - **Employer (Kagiso Molefe):** SunPower Solar Co. on Starter Plan with 2 open jobs and candidates.
   - **Employer (Tshiamo Khumalo):** Tshiamo Logistics with pending business verification and pending Starter tier upgrade.
   - **Admin (Nomsa Baloyi):** Lead Assessor & Mentor managing practical rubrics, business verification, and upgrade reviews.
   - **Admin (Sipho Sithole):** Compliance & Moderation Officer managing fraud reports and pending POPIA deletion requests.

---

## Honest Verification Standards

Verification labels are never conflated or forged:

```
[ Candidate Claims Skill ] ---> Status: "Self-reported" (Default)
                                       |
          +----------------------------+---------------------------+
          |                            |                           |
          v                            v                           v
[ Peer Endorsement ]         [ Micro-Task Rubric ]       [ Designated Mentor ]
Approved by coworker/        Graded >= 70/100 by         Assessed by accredited
supervisor/contractor        practical assessor          master artisan
          |                            |                           |
          v                            v                           v
Status: "Peer-endorsed"      Status: "Task-assessed"     Status: "Mentor-reviewed"
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
git clone https://github.com/LeratoTala/BASA-Ready2Work.git && cd BASA-Ready2Work

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

# Full test suite (218 tests across 56 suites)
npm test

# Production bundle build
npm run build
```

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server with hot module reloading (HMR) |
| `npm test` | Run full automated test suite (218 tests across 56 suites) |
| `npm run typecheck` | Verify TypeScript compilation with zero emitted errors |
| `npm run build` | Build optimized client bundle for production to `dist/` |
| `npm start` | Run server in production mode |
| `node scripts/seed_demo.mjs` | Generate fresh demo candidates, employers, jobs, and claims |
| `npm run test:rules` | Run Firebase Firestore security rules emulator tests |

---

## License & Intellectual Property

Developed for the **FNB App of the Year** challenge under the **Bridge to Actual Skills & Access (BASA)** initiative.  
All rights reserved © 2026 BASA Ready2Work Team.
