# Sustainable Business Model & Revenue Architecture (Section 39)

**Document Version:** 1.0 (Part 4 Implementation)  
**Applicability:** BASA: Ready2Work Platform  
**Target Market:** South African Youth Employment Ecosystem (SMMEs, TVET Graduates & Informal Workers)  

---

## 1. The Core Economic Principle: Candidates NEVER Pay

### The Candidate Guarantee (Section 36.3 Hard Rule)
> **CANDIDATES NEVER PAY.**  
> Individuals never pay any fee to register, build a Skill Passport, upload evidence, receive peer endorsements, complete micro-task assessments, be matched with opportunities, or apply for work.

- **Zero Exploitation:** Charging unemployed youth to access work is predatory and illegal under South African labor practice guidelines.
- **Zero Pay-to-Rank:** There are no "premium candidate tiers" or sponsored candidate placements. Matching scores are calculated strictly from skill overlap, verification tier weights, location proximity, and availability.
- **Plan-Blind Matching Invariant (Section 39.4):** An employer on a higher subscription plan does **not** get unverified candidates ranked higher or ungrounded priority. The verified-first trust signal holds universally.

---

## 2. Employer Subscription Plans (B2B SaaS Architecture)

Platform revenue is generated exclusively through employer subscriptions calibrated for South African SMMEs and mid-sized enterprises ([`src/config/plans.ts`](../src/config/plans.ts)):

| Plan Tier | Monthly Price (ZAR) | Active Jobs Limit | Candidate Access & Features | Ideal Customer |
|---|---|---|---|---|
| **Free (SMME Pilot)** | **R0** | 1 Active Job | Community-level applicants, standard email support, basic profile views | Spaza shops, single-contractor trades, early-stage testing |
| **Starter** | **R199 / mo*** | Up to 5 Active Jobs | Verified candidate filter, applicant profile view (PDF export coming soon), pilot email support | Growing local workshops, cafes, electricians, hair salons |
| **Business** | **R599 / mo*** | Up to 20 Active Jobs | Verified-first matching filter, priority email support, custom rubrics (coming soon) | Facilities management firms, solar EPC installers, multi-branch hospitality |
| **Partner** | **Custom SLA*** | Unlimited Jobs | Dedicated pilot support, bespoke trade rubric design (coming soon), HRIS/API (coming soon) | National retail chains, corporate ESG / YES initiatives, government hubs |

*\*All prices, tiers, and limits are pilot assumptions to validate through real SMME feedback and in-app pulse surveys.*

---

## 3. Financial Viability & Break-Even Economics

### 3.1 Estimated Monthly Operating Costs (MVP / Regional Pilot)
Running a lean regional verification cluster in Gauteng (Johannesburg / Soweto):
- Cloud hosting, database, and storage (Firebase, Cloud Functions): **~R1,200 / mo**
- SMS and verification communication gateway: **~R800 / mo**
- Domain and infrastructure maintenance: **~R500 / mo**
- Assessor stipend pool (subsidized per-rubric evaluations): **~R5,500 / mo**
- **Total Lean Monthly Fixed Burn:** **~R8,000 / month**

### 3.2 Break-Even Thresholds
- **Via Starter Tier (R199/mo):**
  $$\text{Break-even} = \frac{\text{R}8,000}{\text{R}199} \approx 40 \text{ paying Starter employers}$$
- **Via Business Tier (R599/mo):**
  $$\text{Break-even} = \frac{\text{R}8,000}{\text{R}599} \approx 13.4 \text{ paying Business employers}$$
- **Blended Pilot Scenario:**
  25 Starter employers ($\text{R}4,975$) + 6 Business employers ($\text{R}3,594$) = **R8,569 / month** (107% of operating costs).

With over 700,000 registered formal and informal SMMEs in South Africa, capturing a tiny fraction (0.005%) in one metro region achieves complete operational sustainability.

---

## 4. Why SMMEs Pay: Value Proposition & ROI

Hiring entry-level staff through traditional classifieds (e.g. Gumtree, Facebook groups, flyer boards) is expensive and fraught with risk for small business owners:

1. **Massive Time Savings:** A typical job post on general job boards generates 200–500 unvetted CVs, mostly fabricated or irrelevant. BASA pre-screens candidates by demonstrated practical ability, reducing applicant screening time by **over 80%**.
2. **Lower No-Show and Mismatch Rates:** A verified candidate who has passed a 100-point bench test or earned peer contractor endorsements has proven attendance and tool competence.
3. **Transparent Pay Transparency:** Enforcing the South African National Minimum Wage benchmark (assumed R27.58/hr, to be confirmed against current statutory gazette) and clear pay terms ensures employers attract serious, reliable talent without wage disputes.
4. **Negligible Cost Compared to Alternatives:** Commercial recruitment agencies charge 15%–20% of first-year salary (R6,000–R12,000 per hire). At **R199/month**, an SMME can hire up to 5 candidates for less than the cost of a single tank of fuel.

---

## 5. Defensibility: Proof That Cannot Be Faked

Traditional job portals rely on self-reported, text-heavy CVs that are trivially forged or inflated by AI tools. BASA: Ready2Work builds structural defensibility through:
- **Cryptographic & Salted Verification Records:** Badges and certificates are checked against official registers (SAQA, Credly, SETA) and locked with HMAC duplicate checks to prevent credential sharing.
- **Human-Assessed Micro-Task Rubrics:** Candidates perform real-world trade tasks (e.g. wiring a solar inverter, calibrating an espresso grinder) evaluated against transparent 100-point rubrics.
- **Community Endorsement Integrity:** 3-endorsement caps and ring-detection algorithms prevent fake peer vouching.

This creates a proprietary, tamper-resistant talent graph that increases in value with every completed job placement.
