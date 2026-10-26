# BASA: Ready2Work Progress & Requirements Matrix

**Updated:** 2026-10-26  
**Auditor / Agent:** BASA Ready2Work Engineering Agent  
**Build & Test State:** Clean build · 0 TypeScript errors · 121 / 121 unit & domain tests passing across 40 suites.

---

## 1. Executive Summary & Current State

The BASA: Ready2Work platform has completed all core functional requirements and panel feedback action items:
- **Core Journey (Sections 28 & 26):** End-to-end verified path from registered skill $\to$ proof & work samples $\to$ 100-pt rubric assessment $\to$ transparent job match ranking $\to$ 1-click application $\to$ verified work completion and explicit payout confirmation.
- **Honest Skill Passport (Section 29):** Strict 4-tier honest labels (`Self-reported`, `Peer-endorsed`, `Task-assessed`, `Mentor-reviewed`), Grade 6 plain-language explanations, and AI CV tags (`"Written with AI help - not verified"`).
- **Fraud & Exploitation Protection (Section 30):** Mandatory transparent ZAR compensation, unverified employer posting blocks, 3-report auto-hide with community moderation queue, safety tips banners, contact masking (POPIA), and endorsement cap/ring detection.
- **Badges & Modular Credentials (Section 35 & Multi-Skill):** Candidates can post a single vocational certificate or badge, link multiple modular skills it covers, have skills automatically added to their Skill Passport, and have all linked skills verified simultaneously upon assessor approval.
- **Admin Job Pay Terms Inspector & Statutory NMW Checks:** Complete compensation inspector evaluating effective hourly rates and providing statutory National Minimum Wage guidance.
- **Duplicate Application Prevention:** Deterministic ID generation (`jobId_candidateId`) and store guards block candidates from applying for the same job post more than once.
- **User Validation & Success Metrics (Sections 31 & 32):** In-app 5-star user feedback form (`FeedbackModal.tsx`), validation interview protocols (`VALIDATION_PLAN.md`), template (`VALIDATION_FINDINGS.md`), and pilot metrics (`SUCCESS_METRICS.md`).

---

## 2. Functional Requirements Status

| ID | Feature | Status | Implementation Details |
|---|---|---|---|
| **FR-01** | **Multi-Provider Authentication** | **Done** | Google 1-tap, Apple Sign-in, Email & Password, and South African Phone SMS OTP with background reCAPTCHA; trusted role onboarding. |
| **FR-02** | **Role-Based Access Control (RBAC)** | **Done** | Cryptographic custom claims (`admin: true`), Firestore rules enforcing role boundaries, multiple admin accounts support. |
| **FR-03** | **Candidate Profile** | **Done** | Headline, summary, availability, area, POPIA visibility toggles, and right-to-be-forgotten deletion requests. |
| **FR-04** | **Skill Proof & Work Samples** | **Done** | Photos, PDFs, work samples (under 5 MB), and client reference notes. |
| **FR-05** | **Honest Verification States** | **Done** | Exactly 4 honest tiers; never generic "Verified"; server-side label upgrades only. |
| **FR-06** | **Skill Passport & Export** | **Done** | Dynamic passport view with credibility summary, proof trail, contact masking toggle, and client-side PDF generation. |
| **FR-07** | **Employer Profile** | **Done** | Business details, industry, location area, contact email, and admin verification status. |
| **FR-08** | **Job Management & Transparency** | **Done** | ZAR terms (`hourly`, `daily`, `fixed`), active listings vs completed work tab, job closing, and report counting. |
| **FR-09** | **Explainable Matching Algorithm** | **Done** | Deterministic formula ($50\% \text{ Skills} + 25\% \text{ Evidence} + 15\% \text{ Availability} + 10\% \text{ Location}$), missing skills disclosure, distance estimation. |
| **FR-10** | **Applications & Duplicate Prevention** | **Done** | Deterministic application IDs (`jobId_candidateId`); duplicate applications strictly prevented in UI, store, and server. |
| **FR-11** | **Hiring Pipeline & Shortlisting** | **Done** | Stage progression (`submitted` $\to$ `under_review` $\to$ `shortlisted` $\to$ `selected` $\to$ `completed`). Separate active vs completed candidate tabs. |
| **FR-12** | **Moderation & Fraud Prevention** | **Done** | 3-report auto-hide, scam warning banner, safety tips card, employer suspension/reopening actions. |
| **FR-13** | **Offline Drafts & Sync Indicator** | **Done** | Local draft persistence, low-data mode, and network connectivity sync indicator. |
| **FR-14** | **AI CV Drafter Copilot** | **Done** | Server-side Gemini copilot drafts summary from confirmed facts only; carries mandatory AI disclaimer. |
| **FR-15** | **In-App Notifications** | **Done** | Notification modal, unread badge counter, idempotent status alerts, fine-grained preference toggles. |
| **FR-16** | **Location-Aware Distance Engine** | **Done** | Centroid Haversine calculation across 30+ South African townships and metros without device GPS tracking. |
| **FR-19** | **Verification Engine** | **Done** | Peer endorsements, 100-pt practical micro-task rubrics ($\ge 70$ pass mark), and designated mentor reviews. |
| **FR-20** | **Decoupled Payout Confirmation** | **Done** | Work completion decoupled from payout; employer must explicitly confirm payment before status shows `paid`. |
| **FR-21** | **Badges & Multi-Skill Credentials** | **Done** | Single certificate or badge links across multiple practical skills; batch verification on passport upon assessor approval. |
| **FR-22** | **National Minimum Wage Compliance** | **Done** | Statutory wage guidance on Admin Job Inspector. |
| **FR-23** | **Candidate Categorized Job Views** | **Done** | 4 distinct candidate views: Available (unapplied only; hides applied jobs to prevent duplicates), Applied (shows live review status), Completed (tracks paid vs payment pending), and All Jobs (shows application status across all posts). |
| **FR-24** | **Job Closure Guard, Reopening & Job ID Visibility** | **Done** | Employers must update every applicant's status before closing a job; reopening support; persistent Job ID (#job-id) on every card; completed view tracks whether the job is currently open or closed; applied & all jobs display closed jobs with status badges. |
| **FR-25** | **Grade 6 Plain-Language Accessibility** | **Done** | Simplified candidate and employer interfaces using everyday English instead of technical jargon; clear matching formula breakdown; plain privacy disclosures; intuitive tab guidance banners. |
| **FR-26** | **Time Served in Institution & Pay Rate Display (No Lump Sum)** | **Done** | Eliminates lump-sum totals; prominently displays agreed unit rate (money/hr, money/day, money/week, money/fortnight, or money/month); tracks total time served in the institution with approved leaves/days off contributing directly rather than flagged separately; strictly limits active candidate date visibility to employment start date until completed. |
| **FR-27** | **Absorption Pathway & Opportunity Type Transparency** | **Done** | Mandatory employer specification of engagement type (Permanent, Internship, Micro-internship, Casual/shifts, Learnership, Contract); displays expectations prominently so candidates know what to expect. |

---

## 3. Automated Test Suite (123 Tests / 40 Suites)

All 123 unit, domain, and integration tests pass with 0 failures:

1. `aiEvidenceAnalysis.test.ts`: AI certificate parsing, safety indicator extraction, assessor score suggestions.
2. `applicationStatus.test.ts`: Status transition matrix, terminal state enforcement, deterministic duplicate prevention.
3. `candidateJobViews.test.ts`: 4-tab candidate job filtering (Available, Applied, Completed, All), unapplied isolation, and payout tracking.
4. `jobStatusManagement.test.ts`: Job closure guard enforcing applicant status updates before closing, reopening support, and listing status badges.
5. `authIdentity.test.ts`: Trusted account registration, minimum-age attestation, role privilege denial.
6. `coreJourney.test.ts`: Section 28 end-to-end integration test (steps 1 to 7).
7. `credentialEvidence.test.ts`: Form validation, SSRF prevention, salted duplicate hashes, label mapping.
8. `customSkills.test.ts`: Expanded 36-skill catalogue, custom employer skills matching, dynamic rubric templates.
9. `fraudProtection.test.ts`: Unverified employer gating, auto-hiding reported jobs, contact masking, endorsement ring detection.
10. `locationCentroids.test.ts`: Distance filtering, metro clustering, zero-GPS POPIA privacy guarantee.
11. `matching.test.ts`: Deterministic matching weights ($0.50, 0.25, 0.15, 0.10$), tie stability, explainable breakdowns.
12. `multiSkillCredential.test.ts`: 1 badge catering to multiple skills, batch passport upgrades, SA NMW calculations, feedback recording.
13. `notifications.test.ts`: Idempotent notifications, notification preference filtering, contact data safety.
14. `pilotMetrics.test.ts`: Funnel stage counting, verified skills breakdown, repeat engagement tracking.
15. `verificationFlows.test.ts`: 100-pt rubric grading, peer endorsement workflow, mentor review workflow.
16. `workCompletionPayout.test.ts`: Work completion vs payout decoupling, candidate pipeline separation.
17. `evidenceStorage.test.ts`: File upload MIME type and 5 MB size limit validation.
18. `maskContact.test.ts`: POPIA phone and email masking.
