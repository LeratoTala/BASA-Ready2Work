# BASA: Ready2Work Pilot Evaluation Plan

This guide helps the team test the product and present results honestly. It is a proposed evaluation plan, not evidence that a pilot has taken place.

---

## What success looks like (judge-requested metrics)

The judges asked BASA to measure success using three categories. These are tracked in the Admin overview:

| Success Indicator | How BASA measures it | Honest limitation |
|---|---|---|
| **Verified skills** | Count of skill claims promoted beyond Self-reported (Peer-endorsed, Task-assessed, Mentor-reviewed). Task-assessed is the strongest signal — graded ≥70/100 on a practical rubric. | Peer endorsements are community references, not formal qualifications. Only Task-assessed claims have an objective score threshold. |
| **Completed placements** | Work records where an employer confirmed completion. Broken down by candidates with at least one completion. | Employer-reported only. Does not confirm payment was received or that the engagement met employment law standards. |
| **Sustained income** | Candidates with more than one completed work record (repeat engagements). | Platform-observable proxy only. Actual income continuity requires independent income tracking outside BASA. |

For a credible pilot report, present each metric with: its source (platform records vs. participant interview), date range, consent basis, and its limitation. Never claim employment impact that cannot be traced to a source.

---

## The four-step candidate journey

The judges asked for a demonstration of how a young person progresses from registering a skill to being matched with a suitable opportunity. The in-app Journey Tracker (visible on every candidate dashboard) walks through these steps:

```
Step 1: Record a skill claim with evidence
        → Status: Self-reported (candidate-entered, not confirmed)
                ↓
Step 2: Get the skill independently verified
        → Peer-endorsed  (admin-reviewed community endorsement)
        → Task-assessed  (≥70/100 on a practical rubric — strongest evidence)
        → Mentor-reviewed (designated youth mentor assessment)
                ↓
Step 3: Match with a transparent job opportunity
        → Explainable score: M = 0.50·S + 0.25·E + 0.15·A + 0.10·L
        → Score is a fit guide, never an automatic rejection
        → Employer sees exact verification tier for each skill
                ↓
Step 4: Complete work and build an immutable record
        → Employer confirms completion → immutable WorkRecord created
        → Candidate's portfolio shows verified track record to future employers
```

---

## How BASA ensures the Skill Passport reflects genuine ability

The judges specifically asked how BASA prevents peer endorsements and AI-generated CVs from misrepresenting competence. The platform has five controls:

1. **All new claims start as Self-reported.** Candidates cannot self-assign a higher label. This is enforced at the database level in `firebase/firestore.rules` — no client-side bypass is possible.

2. **Peer endorsements require admin review before upgrading a label.** An endorsement goes into a pending queue. A BASA admin must approve it before the candidate's skill status changes. Suspicious endorsements can be rejected without affecting the candidate's record.

3. **Task-assessed claims require a ≥70/100 score on a standardised rubric** graded by a registered assessor. There are four independent criteria (25 pts each): technical execution, safety compliance, tool care, and efficiency. A candidate cannot pass by being strong on only one dimension.

4. **AI CV drafting is off by default** and excludes the candidate's name, contact details, and location from the Gemini prompt. The drafted text is a writing aid — it does not modify or upgrade any verification labels. Candidates must manually review and apply draft text.

5. **Immutable work records.** Once an employer confirms completion, the work record cannot be edited by either party. This anchors the Skill Passport to real-world outcomes, not just self-reported claims.

**What BASA honestly cannot guarantee:** Peer endorsements confirm that someone observed the work — they are not accredited licences or formal employment references. Task assessments evaluate practical ability at a point in time, not long-term performance. BASA presents all of this clearly in the verification badge tooltips and in the Trust & Safety panel shown to every user.

---

## How businesses and young people are protected

### Candidate protections
- Every job listing has a Report button. Flagged jobs are suspended and reviewed by a BASA admin.
- Employers must declare ZAR compensation before a listing goes live. Vague pay terms are blocked.
- Candidate contact details are private by default, released only when an employer formally shortlists.
- Employer verification status (Pending / Verified / Unverified) is visible before a candidate applies.
- Firestore rules prevent candidates from reading each other's private data.

### Employer protections
- Skill claims show their exact verification tier — employers know precisely what was confirmed and by whom.
- Endorsements are admin-reviewed before upgrading a label; fabricated endorsements can be blocked.
- Immutable work records give future employers a reliable completion history.
- Community moderation: candidates can report suspicious profiles and job listings.

---

## Validation approach: young job seekers and small businesses

The judges encouraged BASA to validate with real participants. Before inviting participants:

- Configure a dedicated Firebase development project (see `DEPLOY.md`).
- Confirm minimum-age policy, privacy contact, and evidence-retention period with the project owner.
- Recruit through a trusted partner. Explain clearly that BASA is being evaluated, not a guarantee of work.
- Use fictional accounts for public demos. Do not show real candidate data in slides.

**Candidate usability tasks (observe without coaching):**
1. Add one practical skill claim with a description of duties and tools used.
2. Understand what the Self-reported label means and how to get it upgraded.
3. Find a suitable opportunity, read the match explanation, and apply.
4. Explain what a work record would mean for their future job search.

**Employer usability tasks:**
1. Post an opportunity with a clear ZAR pay rate and specific skill requirements.
2. Review an applicant's skill claims and verification tier.
3. Shortlist a candidate and confirm what contact access that grants.
4. Mark an engagement as completed.

**Follow-up questions:** What was confusing? What did you trust or not trust? Would you use this again? What information was missing?

---

## Suggested presentation structure

1. **Need:** Informal experience — solar installation, phone repair, catering — is hard to show on a conventional CV without formal credentials.
2. **Approach:** BASA organises skill claims into a Skill Passport with honest, multi-tier verification labels. Employers see exactly what was confirmed and by whom.
3. **Demonstration:** Walk through the four-step journey: candidate adds a skill → endorsement or rubric assessment upgrades it → candidate matches with a job → employer confirms completion → immutable work record created.
4. **Trust:** Explain the five integrity controls: rules-enforced labels, admin-reviewed endorsements, 70/100 rubric threshold, AI drafting excluded from verification, and immutable work records.
5. **Success metrics:** Present the three judge-requested metrics — verified skills, completed placements, repeat engagements — with their sources and limitations.
6. **Next milestone:** First real pilot with 5 candidates and 2 small businesses; first Task-assessed skill in a real deployment.
