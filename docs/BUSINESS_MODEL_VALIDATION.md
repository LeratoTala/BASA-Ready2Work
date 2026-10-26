# Business Model Validation & Pricing Testing Framework (Section 39.7 & 40.4)

**Document Version:** 1.0 (Part 4 Implementation)  
**Applicability:** BASA: Ready2Work Platform  
**Target Focus:** Validating Employer Willingness to Pay & Monetization Invariants  

---

## 1. Validation Methodology & Pilot Execution

To ensure the business model is grounded in real commercial willingness to pay rather than unvalidated assumptions, BASA: Ready2Work deploys a multi-pronged validation loop:

1. **Active Job Gating (P3 Engine):** Employers on the Free tier are restricted to 1 active opportunity. When they need to hire for a second role, they encounter a natural decision point: either close their first listing or request a tier upgrade.
2. **Demo Upgrade Intent Requests:** When employers request an upgrade (**R199 Starter** or **R599 Business**), the app records their explicit commercial intent (company name, contact name, billing email, purchase order number). This provides hard evidence of demand without taking credit cards during early pilot phases.
3. **In-App 3-Question Pricing Pulse Survey:** Displayed optionally after an employer posts their first opportunity or navigates to the subscription upgrade view.

---

## 2. In-App Pricing Pulse Survey Structure (Section 39.7)

The pricing pulse survey ([`src/features/employer/components/PricingPulseSurveyModal.tsx`](../src/features/employer/components/PricingPulseSurveyModal.tsx)) collects quantitative feedback across 3 core dimensions:

### Question 1: Price Point Calibration
> *"Is R199/month fair for 5 active jobs and verified candidate shortlists?"*
- **Options:**
  - `Fair` (Target: >65% consensus among SMMEs)
  - `Too high` (Triggers follow-up regarding pay-per-post)
  - `Too low` (Indicates room for premium enterprise tier)

### Question 2: Upgrade Drivers & Value Perception
> *"What would make you upgrade to a paid employer tier?"* (Multi-select)
- **Options:**
  - `More active job slots (5+ jobs)`
  - `Pre-tested candidates with Task-assessed rubrics`
  - `Fast candidate placement turnaround (<48 hours)`
  - `Candidate identity and CIPC background checks`

### Question 3: Cashflow & Annual Commitment
> *"Would you pay annually in advance for a 20% discount (R1,910/year)?"*
- **Options:**
  - `Yes`
  - `No`
  - `Maybe, once verified`

---

## 3. Anticipated Employer Objections & Commercial Solutions

| Objection | Root Concern | Platform Commercial Response |
|---|---|---|
| **"Why not charge per job post instead of monthly (e.g. R50 per post)?"** | Low hiring frequency; SMME only hires 2–3 times a year. | The **Free Tier (R0)** permanently accommodates one-off hiring (1 active job at a time). The R199/mo subscription is targeted at businesses with continuous churn or seasonal peaks. A prepaid token model can be piloted for ad-hoc users in Phase 2. |
| **"Why can't I pay more to get my job sponsored at the top of candidate feeds?"** | Desire for maximum applicant visibility. | **Strict Equity Rule (Section 30 & 36.3):** We do not allow pay-to-rank. Sponsored jobs undermine candidate trust. Jobs are ranked purely by skill match and proximity. High-tier employers receive verified shortlists and faster response SLAs instead of unfair visibility manipulation. |
| **"Why is candidate access 100% free? Shouldn't candidates pay R10 to prove commitment?"** | Reducing applicant flakiness and no-shows. | In South Africa, requiring youth to pay even R10 creates severe exclusion, violates ethics, and risks falling foul of employment agency regulations. Reliability is proven by **practical task demonstrations** and **peer endorsements**, not by charging poor jobseekers. |
| **"What happens if no qualified candidates apply for my post?"** | Fear of paying subscription fees without ROI. | The pilot model offers manual offline invoice terms (zero automated debit orders). *Assumption to validate during pilot:* Exploring a 14-day placement cycle extension if zero qualified applicants apply. |

---

## 4. Admin Revenue Pilot Visibility (Section 39.6)

Platform operators track monetization health in real-time within the Admin Workspace (**Revenue (Pilot)** sub-tab in [`src/features/admin/components/AdminDashboard.tsx`](../src/features/admin/components/AdminDashboard.tsx)):
- **Honest Zero-State Reporting:** MRR displays `R0.00 / month` with honest tier breakdowns until paid subscriptions are manually invoiced and activated.
- **Queue of Upgrade Requests:** Lists business name, target tier, billing email, and PO number for manual offline invoicing.
- **Aggregated Survey Sentiment:** Tracks the percentage of employers rating R199/month as "Fair" and ranks top upgrade drivers.

---

## 5. Next Steps for Public Monetization Launch

1. **Cohort 1 Trial (50 SMMEs):** Seed 50 verified SMMEs across Johannesburg and Soweto on the Free tier.
2. **First Upgrade Threshold:** Measure how many SMMEs naturally hit the 1-job ceiling within 30 days and submit an upgrade intent request.
3. **Invoicing Pilot (Cohort 2):** Issue manual invoices to the first 10 upgrading employers to confirm willingness to wire funds before introducing an automated PCI-DSS compliant payment gateway (e.g. PayFast, Peach Payments, or Ozow).
4. **Price Elasticity Test:** Test a micro-tier (R99 for 2 active jobs) vs. the standard Starter (R199 for 5 active jobs) based on Question 1 pulse survey feedback.
