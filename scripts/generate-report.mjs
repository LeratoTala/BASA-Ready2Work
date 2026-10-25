// scripts/generate-report.mjs
// Generates the BASA: Ready2Work judging criteria evaluation report as a PDF.
// Run: node scripts/generate-report.mjs

import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const outputPath = join(__dir, '..', 'docs', 'BASA_Judging_Report.pdf');

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const pageW = doc.internal.pageSize.getWidth();
const pageH = doc.internal.pageSize.getHeight();
const marginL = 20;
const marginR = 20;
const contentW = pageW - marginL - marginR;
let y = 0;

// ── helpers ──────────────────────────────────────────────────────────────────

function newPage() {
  doc.addPage();
  y = 20;
}

function checkY(needed = 10) {
  if (y + needed > pageH - 18) newPage();
}

function addText(text, x, fontSize, style = 'normal', color = [30, 30, 30]) {
  doc.setFont('helvetica', style);
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  doc.text(text, x, y);
}

function paragraph(text, fontSize = 10, indent = 0, lineHeight = 5.5) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(50, 50, 50);
  const lines = doc.splitTextToSize(text, contentW - indent);
  lines.forEach((line) => {
    checkY(lineHeight);
    doc.text(line, marginL + indent, y);
    y += lineHeight;
  });
}

function heading1(text) {
  checkY(14);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 80, 150);
  doc.text(text, marginL, y);
  y += 2;
  doc.setDrawColor(15, 80, 150);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, pageW - marginR, y);
  y += 6;
}

function heading2(text) {
  checkY(10);
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 80, 150);
  doc.text(text, marginL, y);
  y += 6;
}

function bullet(text, indent = 4, fontSize = 10) {
  checkY(6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(50, 50, 50);
  const lines = doc.splitTextToSize(text, contentW - indent - 4);
  doc.text('•', marginL + indent, y);
  lines.forEach((line, i) => {
    checkY(5.5);
    doc.text(line, marginL + indent + 4, y);
    if (i < lines.length - 1) y += 5.2;
  });
  y += 5.5;
}

function scoreBar(label, score, max = 10) {
  checkY(10);
  const barX = marginL + 58;
  const barW = 80;
  const barH = 4;
  const filled = (score / max) * barW;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(label, marginL, y);

  // background bar
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(barX, y - 3.5, barW, barH, 1, 1, 'F');

  // filled bar
  const pct = score / max;
  const r = Math.round(200 - pct * 140);
  const g = Math.round(60 + pct * 140);
  doc.setFillColor(r, g, 50);
  if (filled > 0) doc.roundedRect(barX, y - 3.5, filled, barH, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`${score} / ${max}`, barX + barW + 4, y);
  y += 8;
}

function tableRow(col1, col2, col3, isHeader = false) {
  checkY(8);
  const c1w = 60, c2w = 25, c3w = contentW - c1w - c2w;
  const style = isHeader ? 'bold' : 'normal';
  const color = isHeader ? [15, 80, 150] : [50, 50, 50];

  doc.setFont('helvetica', style);
  doc.setFontSize(9.5);
  doc.setTextColor(...color);

  const lines1 = doc.splitTextToSize(col1, c1w - 2);
  const lines3 = doc.splitTextToSize(col3, c3w - 2);
  const rowH = Math.max(lines1.length, lines3.length) * 5.2 + 3;

  if (isHeader) {
    doc.setFillColor(235, 243, 255);
    doc.rect(marginL, y - 4, contentW, rowH, 'F');
  } else if (tableRow._alt) {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginL, y - 4, contentW, rowH, 'F');
  }
  tableRow._alt = !tableRow._alt;

  doc.setFont('helvetica', style);
  doc.setFontSize(9.5);
  doc.setTextColor(...color);
  lines1.forEach((l, i) => doc.text(l, marginL + 2, y + i * 5.2));
  doc.text(col2, marginL + c1w + 2, y);
  lines3.forEach((l, i) => doc.text(l, marginL + c1w + c2w + 2, y + i * 5.2));
  y += rowH;
}
tableRow._alt = false;

function divider() {
  checkY(6);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(marginL, y, pageW - marginR, y);
  y += 5;
}

// ── COVER PAGE ────────────────────────────────────────────────────────────────

// Deep blue header band
doc.setFillColor(15, 80, 150);
doc.rect(0, 0, pageW, 55, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(22);
doc.setTextColor(255, 255, 255);
doc.text('BASA: Ready2Work', pageW / 2, 22, { align: 'center' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(12);
doc.setTextColor(190, 220, 255);
doc.text('Judging Criteria Evaluation Report', pageW / 2, 33, { align: 'center' });

doc.setFontSize(10);
doc.setTextColor(160, 200, 255);
doc.text('Skills  →  Evidence  →  Work', pageW / 2, 42, { align: 'center' });
doc.text('Bridge to Actual Skills & Access', pageW / 2, 49, { align: 'center' });

y = 65;

// Meta block
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(80, 80, 80);
const meta = [
  ['Evaluation Date', '24 October 2026'],
  ['Platform', 'React 19 · TypeScript · Firebase · Express · Gemini AI (optional)'],
  ['Stage', 'MVP — Phase 2 code-complete, pre-production-verified'],
  ['Overall Score', '~48.5 / 70  (~69%)'],
];
meta.forEach(([k, v]) => {
  doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40); doc.text(`${k}:`, marginL, y);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(70, 70, 100); doc.text(v, marginL + 40, y);
  y += 6.5;
});

y += 6;
heading1('Score Summary');

const scores = [
  ['Functionality', 6.5],
  ['Creativity', 8.0],
  ['Usability', 6.0],
  ['Sustainability', 7.0],
  ['Impact', 8.5],
  ['Presentation', 6.0],
  ['Intelligence', 6.5],
];
scores.forEach(([label, score]) => scoreBar(label, score));

// ── PAGE 2+ ───────────────────────────────────────────────────────────────────

newPage();

// Executive Summary
heading1('Executive Summary');
paragraph(
  'BASA: Ready2Work is a skills-first, low-data employment platform designed to connect informal South African workers to entry-level jobs by turning real-world experience into credible, verifiable evidence. The platform addresses structural youth unemployment in South Africa through a four-tier skill verification system, an explainable matching engine, and a privacy-by-design architecture.',
);
paragraph(
  "The codebase is at a solid mid-MVP stage with all core flows implemented and 22 passing unit tests, but several functional requirements remain partially complete ahead of a production launch. The app's strongest attributes are the clarity of its social purpose, the integrity of its privacy and verification design, and the explainability of its matching approach.",
);

y += 2;
heading1('1. Functionality — 6.5 / 10');
paragraph(
  'Is the app a complete solution? Is it polished and does it work as users would expect? Does it resolve the needs of the challenges it addresses? Is there a market need and does it have traction?',
  9, 0, 5,
);
y += 2;

heading2('What Is Built');
const built = [
  'Role-based authentication — Google sign-in with server-side role registration enforced via Firebase Admin SDK; admin status is a custom claim, never self-assignable',
  'Candidate flow — profile editing, skill claims with evidence, Skill Passport generation, PDF export, AI-assisted CV drafting, opportunity browsing, explainable match scores, one-click apply, application status tracking',
  'Employer flow — business profile, job creation with ZAR compensation terms, applicant review, status pipeline management, candidate contact access gated to the shortlist stage',
  'Admin/Assessor flow — rubric-based skill assessment grading, moderation of flagged listings, pilot metrics dashboard',
  'Backend security boundary — application submission and user registration happen server-side in an atomic Firestore transaction; clients cannot bypass business rules through the UI',
  'Demo mode — fully self-contained fictional dataset for pitching/demos, no backend required',
  '22 unit tests pass (npm test); 21/21 Firestore security rules tests pass in the emulator',
  '0 known vulnerabilities in production dependencies (npm audit --omit=dev)',
];
built.forEach(b => bullet(b));

y += 2;
heading2('What Remains Incomplete');
const incomplete = [
  'Every functional requirement is marked "Partial" in the project\'s own progress documentation',
  'Peer/mentor skill verification confirmation flows are absent — only the labels exist',
  'Evidence file/media upload is not implemented; skill claims are text-only',
  'No end-to-end integration tests against a live Firebase project',
  'Report counter maintenance requires a Cloud Function not yet implemented',
  'WhatsApp access and transport support were deferred and not started',
  'Firebase App Check, data deletion/retention, and a privacy contact are pre-launch requirements not yet met',
  'The production container could not be verified due to a Docker environment constraint',
];
incomplete.forEach(i => bullet(i));

y += 2;
heading2('Assessment');
paragraph(
  'The app functions convincingly in demo mode and has a well-enforced, thoughtful backend. However, the production Firebase path is unverified, several user journeys are incomplete, and the app is not publicly deployed. It is solidly mid-MVP — the right things are built, but it is not a finished product.',
);

// ── Creativity ────────────────────────────────────────────────────────────────
heading1('2. Creativity — 8.0 / 10');
paragraph(
  'Is it a new application or service? How creative is the approach? Does it improve society or business in a new way? Is it commercially, socially, politically, or personally appealing? Is it a new approach to an old problem?',
  9, 0, 5,
);
y += 2;

heading2('Strengths');
paragraph(
  "BASA addresses a structural gap that most job platforms ignore: South Africa's large informal economy produces workers with genuine, practical skills who are systematically excluded by credential-first hiring platforms. The creative response is multi-layered:",
);
const creative = [
  'Four-tier verification ladder: Self-reported → Peer-endorsed → Task-assessed → Mentor-reviewed. Rather than treating all claims equally or dismissing unverifiable ones, BASA creates a credibility gradient that rewards verifiable experience without requiring formal qualifications.',
  'The Skill Passport: A portable, shareable credential document — exportable as a PDF — that a candidate owns and controls. This reframes the relationship between worker and employer, putting evidence in the candidate\'s hands.',
  'Explainable matching score: The formula M = 0.50·S + 0.25·E + 0.15·A + 0.10·L is shown to candidates with human-readable reasons and actionable improvement tips (e.g., "Request a task assessment for Carpentry to increase your score by up to 60 points"). This is a meaningful innovation over black-box ranking algorithms.',
  'Contextual design decisions: Low-data mode, broad-area location (no GPS), WhatsApp access planned, transport support planned — designed around the real constraints of its target users, not imported from a Western tech template.',
];
creative.forEach(c => bullet(c));

// ── Usability ─────────────────────────────────────────────────────────────────
heading1('3. Usability — 6.0 / 10');
paragraph(
  'Is the app easy to use? Is there clarity, simplicity, and an intuitive feel for how the app works and what to do next?',
  9, 0, 5,
);
y += 2;

heading2('Strengths');
const usabilityGood = [
  'Clean role-based navigation — each persona (candidate / employer / admin) sees only what is relevant to them',
  'A Demo Tour Modal built into the app walks users through the key flows — strong for pitching',
  'A viewport preview mode renders the main content as a phone or tablet frame inside the browser with a fake status bar',
  'Match score breakdown with improvement tips shown to candidates is excellent UX — users understand not just where they rank but what to do about it',
  'A POPIA banner and configurable visibility controls give candidates agency over their data',
];
usabilityGood.forEach(u => bullet(u));

heading2('Concerns');
const usabilityBad = [
  'No React Router — all navigation is manual tab/modal state in a single large App.tsx (~300 lines); deep-linking and browser back-button behaviour are not supported',
  'The accessibility audit has not been performed; keyboard navigation and screen reader compatibility are unverified',
  'A 636 kB Firebase JavaScript bundle may cause slow first loads on South African mobile data connections',
  "Peer/mentor confirmation flows (a key candidate journey) are absent, which would confuse users who try to use those features",
  'There is no dedicated notification system; users must check the app to discover status changes',
];
usabilityBad.forEach(u => bullet(u));

// ── Sustainability ────────────────────────────────────────────────────────────
heading1('4. Sustainability — 7.0 / 10');
paragraph(
  'What is the potential of the application and team? Can it be taken to the next level? Is there a potential path to revenue?',
  9, 0, 5,
);
y += 2;

heading2('Technical Sustainability');
const techSustain = [
  'Config-driven scoring engine — all matching weights and evidence scores are in src/config/scoring.ts; recalibrating the algorithm is a one-line change',
  'Feature-based folder structure — new roles or features can be added without touching existing ones',
  'Dual-store pattern — the BasaStore contract makes it straightforward to swap or extend the data layer',
  'CI pipeline with Docker — GitHub Actions runs tests on every push; the app is containerised',
  'Concrete roadmap — Phase 3 (accessibility/responsive) and Phase 4 (App Check, privacy, monitoring) are clearly defined',
];
techSustain.forEach(t => bullet(t));

heading2('Revenue Path');
const revenue = [
  'Employer verification tier — pending | verified | unverified status on employer profiles suggests a paid verification product',
  'Assessment monetisation — candidates or employers could pay for task assessments that upgrade skill claims from Self-reported to Task-assessed',
  'Transaction fee / payroll layer — the WorkRecord entity tracks completed jobs and ZAR payout amounts, suggesting a commission or escrow model',
  'Gig/task model — compensation is hourly | daily | fixed, supporting marketplace transaction pricing',
  'Impact investment / grant funding — the South African edtech and impact investor landscape supports this type of platform at early stages',
];
revenue.forEach(r => bullet(r));

heading2('Risk');
paragraph(
  'The project documentation does not name a team; it appears to be a solo developer effort. Execution risk for taking the platform to pilot scale is significant without a broader team.',
);

// ── Impact ────────────────────────────────────────────────────────────────────
heading1('5. Impact — 8.5 / 10');
paragraph(
  'How much impact does the application have? What kind of problem does it solve — big or small? What is the level of indispensability and importance?',
  9, 0, 5,
);
y += 2;

heading2('The Problem');
paragraph(
  "South Africa's structural youth unemployment is among the highest in the world — over 60% for under-35s in many areas. The core obstacle is not a lack of skills or willingness to work; it is a credential gap: informal-economy workers acquire genuine practical skills that traditional CV-first, qualification-gated platforms systematically exclude.",
);

heading2("BASA's Response");
const impact = [
  'Direct address of the credential gap — the four-tier verification system creates a trust infrastructure that does not require formal qualifications',
  'Privacy protection for a vulnerable population — separate contact data storage, employer access grants scoped to the shortlist stage, POPIA compliance, and no GPS tracking',
  'Algorithmic fairness by design — explainable, non-black-box matching with human oversight ("aids decisions; never makes them") reduces the risk of automated discrimination',
  'Low-data and offline-first design — targets users on limited data plans and intermittent connectivity',
  'ZAR compensation transparency — all jobs display clear pay terms in South African Rand; no vague "competitive salary" listings',
];
impact.forEach(i => bullet(i));

heading2('Scale of Impact');
paragraph(
  'The target population is large and underserved. If the platform reaches pilot scale, it has genuine potential to reduce the friction of informal-to-formal employment transitions for a demographic with very few digital tools designed specifically for them.',
);

// ── Presentation ──────────────────────────────────────────────────────────────
heading1('6. Presentation — 6.0 / 10');
paragraph(
  'How well did the team communicate their idea? Were they effective in telling their story and conveying the importance and relevance of the application to society?',
  9, 0, 5,
);
y += 2;

heading2('Evidence from the Artefacts');
const pres = [
  'The README is well-written, clearly structured, and accurately describes what the app does, who it serves, and what remains to be done — stronger than most hackathon projects',
  'ARCHITECTURE.md and PROGRESS.md are thorough and candid; the progress doc honestly maps every requirement to done/partial/not-started',
  'The Demo Tour Modal built directly into the application suggests preparation for a live walkthrough demo',
  'The acronym and tagline ("BASA: Bridge to Actual Skills & Access — Skills → Evidence → Work") are clear and memorable',
  'The BASA_Project_Specification.pdf in the docs folder indicates a structured upfront design process',
];
pres.forEach(p => bullet(p));

heading2('Limitation');
paragraph(
  'Without access to an actual live pitch, verbal presentation, or slide deck, this score cannot be fully evaluated. The candid documentation of incomplete features could undermine confidence if not framed correctly in a verbal presentation.',
);

// ── Intelligence ──────────────────────────────────────────────────────────────
heading1('7. Intelligence — 6.5 / 10');
paragraph(
  'Can the app "think" for itself, forecast, and predict the user\'s likely future behaviour by analysing patterns in data inputs?',
  9, 0, 5,
);
y += 2;

heading2('What Is Implemented');
const intel = [
  'Explainable rules-based matching engine: M = 0.50·S + 0.25·E + 0.15·A + 0.10·L — returns scored components, matched/missing skills, human-readable reasons, and actionable improvement tips',
  'Optional Gemini AI integration (CV Drafter) — generates personalised CV summary text; privacy-safe (no name, contact, or location sent to provider); falls back gracefully to a template',
  'Assessor rubric grading — structured per-criterion scoring; approved assessments automatically upgrade a candidate\'s skill claim verification status',
];
intel.forEach(i => bullet(i));

heading2('Limitations');
paragraph(
  'The matching weights are described in the codebase as "hypotheses, not validated predictors of job performance." The system does not learn or adapt from outcomes — there is no feedback loop, no pattern recognition across users, no predictive modelling of future behaviour, and no telemetry layer. The intelligence layer is deliberate and well-designed for explainability, but it is static rather than adaptive. The architecture fully supports adding ML in future phases, but the current implementation does not qualify as a self-improving or predictive system.',
);

// ── Recommendations ───────────────────────────────────────────────────────────
heading1('Recommendations for Improvement');

tableRow._alt = false;
tableRow('Recommendation', 'Priority', 'Detail', true);
const recs = [
  ['Deploy to a live Firebase project', 'High', 'A public URL is critical for judging; verify the full production flow end-to-end'],
  ['Implement peer/mentor verification flows', 'High', 'This is a core differentiator that is currently absent; the labels exist but the journeys do not'],
  ['Run an accessibility audit', 'High', 'Keyboard navigation and screen reader support are table stakes for a public product'],
  ['Add React Router', 'Medium', 'Enables proper navigation, back-button support, and deep linking'],
  ['Address the 636 kB Firebase bundle', 'Medium', 'Code splitting would materially improve load time on mobile data'],
  ['Document the revenue model explicitly', 'Medium', 'The implied monetisation paths are strong but entirely unstated'],
  ['Add a matching feedback loop', 'Low', 'e.g., employer acceptance rate per skill, to move toward adaptive intelligence'],
  ['Implement evidence file upload', 'Low', 'Without it, skill claims remain text-only and are less credible to employers'],
];
recs.forEach(([r, p, d]) => tableRow(r, p, d));

// ── Conclusion ────────────────────────────────────────────────────────────────
y += 4;
heading1('Conclusion');
paragraph(
  'BASA: Ready2Work is a thoughtful, well-engineered response to a real and significant problem. Its strongest attributes are the clarity of its social purpose, the architectural integrity of its privacy and verification design, and the explainability of its matching approach. The codebase demonstrates mature engineering practices — clean separation of concerns, config-driven logic, test coverage, and a security model that enforces business rules at the data layer rather than trusting the UI.',
);
paragraph(
  'The platform is not yet a finished product, but the foundation is solid and the direction is credible. With a production deployment, completion of the peer/mentor verification flows, and an accessibility pass, it would represent a genuinely competitive entry in the employment technology space.',
);

y += 4;
divider();
doc.setFont('helvetica', 'italic');
doc.setFontSize(8.5);
doc.setTextColor(140, 140, 140);
paragraph(
  'Report generated from static codebase analysis of the BASA: Ready2Work repository. Scores reflect an assessment of the implemented code, architecture, and documentation against the stated judging criteria. Live usability and verbal presentation could not be directly observed.',
  8.5,
);

// ── Footer on every page ──────────────────────────────────────────────────────
const totalPages = doc.internal.pages.length - 1;
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text('BASA: Ready2Work — Judging Criteria Evaluation Report', marginL, pageH - 8);
  doc.text(`Page ${i} of ${totalPages}`, pageW - marginR, pageH - 8, { align: 'right' });
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(marginL, pageH - 12, pageW - marginR, pageH - 12);
}

// ── Save ──────────────────────────────────────────────────────────────────────
const pdfBytes = doc.output('arraybuffer');
writeFileSync(outputPath, Buffer.from(pdfBytes));
console.log(`PDF saved to: ${outputPath}`);
