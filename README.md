# BASA: Ready2Work

> **BASA** — Bridge to Actual Skills & Access.  
> **Ready2Work** is the path from that spark to a real opportunity.

A skills-first, low-data employment platform that turns informal experience into credible evidence and connects young South Africans to suitable entry-level jobs, paid tasks and short work opportunities.

---

## What it does

The core journey in four steps:

1. **Candidate** records a skill and submits evidence
2. **BASA** presents a transparent Skill Passport
3. **Candidate** discovers a relevant opportunity and applies
4. **Employer** reviews evidence and updates the application status

---

## The problem it solves

Many young people develop marketable abilities through informal work, volunteering, community activity and small businesses. Without formal qualifications or CVs, those abilities are hard for employers to assess. Data costs, transport costs and limited connectivity create further barriers.

BASA addresses this by:

- **For candidates** — making informal skills visible, providing evidence, surfacing relevant work and tracking applications
- **For employers** — discovering candidates using skill evidence rather than relying only on CVs or referrals
- **For assessors** — using clear rubrics and recording evidence-based outcomes

---

## MVP scope

| Must deliver | Deferred |
|---|---|
| Authentication & roles | AI-generated CVs |
| Candidate profile | WhatsApp bot |
| Skill claims & evidence | Transport stipend disbursement |
| Skill Passport | Complex maps |
| Employer profile & job posting | Advanced mentor chat |
| Rules-based matching | Full offline sync |
| Applications & shortlisting | Payroll / escrow |
| Basic moderation | ML-based ranking |
| Android + web builds | Large-scale credential integrations |

---

## Tech stack

| Layer | Technology |
|---|---|
| Client | Flutter / Dart (Android + Web) |
| Identity | Firebase Authentication |
| Database | Cloud Firestore |
| File storage | Cloud Storage for Firebase |
| Privileged operations | Cloud Functions |
| Hosting | Firebase Hosting |
| Collaboration | GitHub + Figma |

---

## Project structure

```
basa-ready2work/
├── README.md
├── CONTRIBUTING.md
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── security.md
│   └── testing-plan.md
├── app/
│   ├── lib/
│   │   ├── app/
│   │   ├── core/config/
│   │   ├── core/errors/
│   │   ├── core/theme/
│   │   ├── core/widgets/
│   │   ├── features/auth/
│   │   ├── features/candidate/
│   │   ├── features/skills/
│   │   ├── features/passport/
│   │   ├── features/jobs/
│   │   ├── features/applications/
│   │   ├── features/employer/
│   │   ├── features/admin/
│   │   ├── models/
│   │   ├── repositories/
│   │   └── main.dart
│   └── test/
├── functions/
│   └── src/
├── firebase/
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
└── .github/
    └── workflows/ci.yml
```

---

## Getting started

Requires [Flutter](https://docs.flutter.dev/get-started/install) and the [Firebase CLI](https://firebase.google.com/docs/cli) to be installed.

```bash
# Clone the repo
git clone https://github.com/<your-org>/basa-ready2work.git
cd basa-ready2work

# Create the Flutter app (if not already present)
flutter create --platforms=android,web app

# Run in browser
cd app
flutter run -d chrome
```

---

## Matching engine

Jobs are ranked using a transparent, rules-based scoring function — not machine learning:

```
M = 0.50S + 0.25E + 0.15A + 0.10L
```

- **S** — required-skill alignment (0–100)
- **E** — strength and relevance of evidence (0–100)
- **A** — availability fit (0–100)
- **L** — location / work-mode fit (0–100)

The score is a recommendation aid, not a hiring decision. Match reasons are shown to the candidate.

---

## Skill verification labels

| Label | Meaning |
|---|---|
| Self-reported | Candidate entered the claim — not independently confirmed |
| Peer-endorsed | An identified peer provided an endorsement — not formal certification |
| Task-assessed | A recorded assessment against a rubric — not a universal performance guarantee |
| Mentor-reviewed | A designated mentor reviewed submitted evidence — not an accredited qualification |

---

## Application status flow

```
submitted → under_review → shortlisted → selected → completed
                                       ↘ not_selected
                        ↘ withdrawn
```

Only explicitly defined transitions are permitted.

---

## Security and privacy

- All privileged actions are enforced server-side — hiding a button in the UI is not security
- Roles are assigned only through trusted server-side processes
- Employers can only access applications for their own jobs
- Candidates cannot edit assessment scores or verification labels
- Broad location areas are used by default — no precise GPS
- Designed with [POPIA](https://www.justice.gov.za/inforeg/) (Protection of Personal Information Act) in mind
- API secrets must never be committed to the repository

---

## Branching workflow

```bash
# Create a feature branch
git switch -c feature/short-name

# Commit with a prefix
git commit -m "feat: add skill evidence submission"

# Push and open a PR
git push -u origin feature/short-name
```

| Prefix | Example |
|---|---|
| `feat` | feat: add skill evidence submission |
| `fix` | fix: prevent duplicate applications |
| `test` | test: cover matching score calculation |
| `docs` | docs: add database schema |
| `refactor` | refactor: separate job repository |
| `chore` | chore: configure Firebase emulator |

`main` is always demonstrable. No direct feature commits.

---

## Definition of success

A judge or test user can:

1. Register or sign in
2. Create a candidate profile
3. Record a skill and view its evidence status
4. Find an open job
5. Apply
6. See the employer review and update that application

Key permissions are tested and the web/mobile demo is repeatable.

---

## Roadmap (12-day plan)

| Day | Focus |
|---|---|
| 1 | Scope and team alignment |
| 2 | User flows and UI wireframes |
| 3 | Architecture and schema approval |
| 4 | Project setup — Flutter + Firebase |
| 5 | Authentication and role routing |
| 6 | Candidate profile |
| 7 | Skills and Skill Passport |
| 8 | Employer profile and job management |
| 9 | Applications and duplicate prevention |
| 10 | Matching engine and employer shortlisting |
| 11 | Security audit and regression testing |
| 12 | Deployment, seed data and demo rehearsal |

---

## License

This project was prepared as a hackathon MVP build guide. It is not a guarantee of regulatory compliance or employment outcomes. Before a public pilot, review privacy, security, payment terms, employer verification and operational responsibilities.
