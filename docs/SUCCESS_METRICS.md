# BASA: Ready2Work — Impact & Success Metrics (Section 32)

## Philosophy & Privacy Commitments
BASA measures success by real economic outcomes for young people, not engagement vanity metrics. In compliance with POPIA:
- **No Third-Party Trackers:** Zero Google Analytics, Facebook Pixel, Mixpanel, or advertising SDKs.
- **Aggregate Numbers Only:** All metrics are computed server-side as aggregate counts and percentages without storing behavioral profiles or tracking user browsing habits.
- **Honest Zeros:** Empty states show 0 without artificial inflation.

---

## 1. Core Success Metrics Framework

### Metric 1: Skills Registered
- **Definition:** Total count of skill claims recorded by candidates across both predefined catalogue categories and custom practical skills.
- **Why it matters:** Measures platform accessibility for youth documenting informal abilities.

### Metric 2: Skills Verified
- **Definition:** Total count and percentage of registered skills that have advanced from *Self-reported* to independently verified tiers:
  - **Task-assessed:** Benchmark test evaluated against practical 100-point rubric.
  - **Mentor-reviewed:** Portfolio evidence inspected and certified by industry mentors.
- **Why it matters:** Establishes the credibility and fraud-resistance of the Skill Passport.

### Metric 3: Applications & Shortlists
- **Definition:**
  - `Total Applications`: Applications submitted by matched candidates.
  - `Shortlisted`: Candidates whose applications were progressed by employers to review contact information.
- **Conversion Rate:** `Shortlisted / Applications Submitted`.
- **Why it matters:** Tests whether explainable matching ($M = 0.50S + 0.25E + 0.15A + 0.10L$) connects relevant talent to legitimate opportunities.

### Metric 4: Placements Completed
- **Definition:** Hired candidates whose work delivery and compensation payout have been marked as completed.
- **Why it matters:** Measures genuine job completion and direct financial earnings.

### Metric 5: Sustained Income (3-Month Longitudinal Follow-Up)
- **Definition:** Percentage of candidates in completed placements who confirm they are still earning from work (employment, repeat contractor shifts, or self-employment) 3 months after placement.
- **Protocol:**
  - Consent-based, optional single-tap follow-up prompt.
  - Records only two fields: `earningStatus` (`yes` / `no`) and `reportedAt` (ISO date).
  - No continuous monitoring, financial transaction snooping, or bank account scraping.

---

## 2. Metric Thresholds & Targets

| Metric | Target (Pilot Phase) | Measurement Frequency |
|---|---|---|
| **Skills Registered** | 250+ | Daily Aggregate |
| **Verification Ratio (Assessed/Reviewed)** | ≥ 35% of registered claims | Weekly Aggregate |
| **Shortlist Rate** | ≥ 40% of submitted applications | Weekly Aggregate |
| **Placements Completed** | 50+ | Monthly Aggregate |
| **Sustained Income (3-Month)** | ≥ 60% still earning | Quarterly Cohort |

---

## 3. Implementation in Assessor/Admin Workspace
The aggregates are presented in real time on the admin **Impact Dashboard** (`AdminDashboard.tsx`) with zero-state honesty.
