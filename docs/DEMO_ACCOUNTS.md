# BASA: Ready2Work — Demo Accounts & Persona Guide

All demo credentials below use fictional test data (`@basa-test.co.za`). No real personal data or active banking accounts are linked.

---

## 1. Job Seeker (Candidate Persona)
* **Full Name:** Thabo Ndlovu
* **Email:** `thabo.demo@basa-test.co.za`
* **Password:** `DemoPassword2026!`
* **Role:** `candidate`
* **Seed Data & Populated Views:**
  * **My Skill Passport:** Populated with 3 skills: Barista (`Task-assessed`), Solar PV Maintenance (`Mentor-reviewed`), Phone Screen Repair (`Self-reported`).
  * **Proof Trail:** Attached TVET electrical certificate, work photos, and peer reference notes.
  * **Applications:** Active applications (`Submitted`, `Under Review`, `Shortlisted`).
  * **Completed Engagements:** Finished barista pop-up work with payment confirmed; active engagement with start date tracking.
  * **AI CV Drafter:** Grounded summary draft with zero-hallucination guardrails and PII redaction warning.

---

## 2. Employer (Small Business / SMME Persona)
* **Company:** Zola Artisan Café (Zola Sithole)
* **Email:** `zola.demo@basa-test.co.za`
* **Password:** `DemoPassword2026!`
* **Role:** `employer`
* **Plan:** Free Tier (1 active job limit) with pending Starter Plan upgrade request.
* **Seed Data & Populated Views:**
  * **Opportunities:** 1 active job listing (`Weekend Barista & Cashier`), 1 closed job listing.
  * **Applicant Review:** Live candidate cards with match percentage, missing skills disclosure, and verified proof review.
  * **Hiring Pipeline:** Candidates in `Submitted`, `Shortlisted`, `Selected` (start date only), and `Completed` (awaiting payout confirmation).
  * **Subscription Card:** In-app plan management card (`Request Upgrade`, `Downgrade Plan`, `Cancel Plan (Instant)`).
  * **Business Verification:** Submitted business documents with verified status.

---

## 3. Mentor & Assessor (Administrator Persona)
* **Full Name:** Nomsa Dlamini
* **Title:** Senior TVET Mentor & Lead Practical Assessor
* **Email:** `nomsa.mentor@basa-test.co.za`
* **Password:** `DemoPassword2026!`
* **Role:** `admin` (Assessor / Mentor)
* **Seed Data & Populated Views:**
  * **Practical Grading Queue:** 100-pt practical micro-task rubrics (pass threshold $\ge 70$).
  * **Mentor Reviews:** Work sample portfolios awaiting supervisor review.
  * **Peer Endorsement Queue:** Review contractor endorsements without phone harvesting.
  * **Job Pay Terms Inspector:** Evaluates effective hourly rates and displays statutory National Minimum Wage guidance.
  * **Upgrade Requests Queue:** Approve and activate / decline employer plan upgrades.
  * **Moderation Queue:** Community safety reports and listing suspension actions.
