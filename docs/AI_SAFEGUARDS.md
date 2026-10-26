# AI CV Safeguards & Anti-Hallucination Framework (Section 37)

**Document Version:** 1.0 (Part 4 Implementation)  
**Target Reading Level:** Grade 6 Plain English + Technical Specification  
**Applicability:** BASA: Ready2Work Platform  

---

## 1. Executive Plain-Language Summary (Grade 6)

Computers and AI can write well, but they can also make things up (hallucinate) or exaggerate what a person did. In jobs, exaggerating is dangerous: if someone says they can fix a solar battery when they have only watched a friend do it, someone could get hurt.

At **BASA: Ready2Work**, we have strict safety rules for AI:

1. **AI Can Only Reword, Never Invent:** The AI can only change how candidate words sound. It is **never** allowed to add new tools, employers, skills, qualifications, or numbers.
2. **You Confirm Every Line:** You see your original notes on the left and the AI wording on the right. You can edit or delete any sentence. Nothing is saved until you tick: *"I confirm this is true"*.
3. **AI Never Gives You a Badge:** The AI cannot upgrade your skills. A "Self-reported" skill stays Self-reported. Only real human assessors or supervisors can verify skills.
4. **Employers See Truth First:** Employers always see your honest badge first (e.g. *Task-assessed* or *Self-reported*) and the AI text second. All AI text carries the tag: `"Written with AI help - not verified"`.
5. **No Personal Data Sent:** We never send your South African ID number, phone number, address, or certificate numbers to the AI.

---

## 2. Technical Architecture & Anti-Exaggeration Safeguards

### 2.1 Server-Side Execution & Feature Flag
- AI CV drafting runs **strictly on the server** via authenticated Cloud API routes (`/api/cv-draft`).
- Zero API keys are stored in the client bundle.
- The feature flag `aiCv` in [`src/config/featureFlags.ts`](../src/config/featureFlags.ts) defaults to `false` until all automated tests pass.

### 2.2 Sanitized Input Allow-List (Section 37.2)
Only verified candidate-supplied fields are packaged into the AI prompt:
- Candidate name placeholder `{{NAME}}` (candidate real name is **never** sent to the AI; swapped locally post-generation)
- Claimed skills with their exact verification tier label (`Self-reported`, `Peer-endorsed`, `Task-assessed`, `Mentor-verified`)
- Practical task experience notes
- Broad work preferences

**Automatic Redaction Pipeline:**
Regex filters automatically redact sensitive identifiers before prompt assembly:
- South African 13-digit National ID numbers: `\b\d{13}\b` $\to$ `[ID REDACTED]`
- Phone numbers (08x, +27x): `(\+27|0)[6-8][0-9]{8}\b` $\to$ `[PHONE REDACTED]`
- Email addresses: `\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b` $\to$ `[EMAIL REDACTED]`
- Credential serial IDs and hashes: `\b[A-Z0-9]{3,}-[A-Z0-9-]{4,}\b` $\to$ `[CREDENTIAL_ID REDACTED]`

### 2.3 System Prompt Rules (Section 37.3)
The system prompt ([`src/domain/aiCvSafeguards.ts`](../src/domain/aiCvSafeguards.ts)) enforces zero-hallucination behavior:
1. *Use ONLY the supplied facts.* Never add degrees, employers, qualifications, tools, or achievements.
2. *Do not upgrade wording:* "assisted" must not become "led"; "2 years" must not become "extensive".
3. *Preserve evidence labels:* Self-reported skills must read as self-reported and never as certified or professional.
4. *Output structured JSON:* Every line must cite at least one `source_fields` ID matching candidate inputs.

### 2.4 Server-Side Output Validation & Allow-List Diff (Section 37.4)
Before returning any text to the user, the server runs automated deterministic validation:
1. **Source Citation Requirement:** Any output line that lacks a valid `source_fields` reference is dropped.
2. **Superlative & Inflation Blocklist:** A dedicated blocklist rejects inflated words unless they existed verbatim in the candidate's input:
   - `expert`
   - `certified`
   - `award-winning`
   - `senior`
   - `leading`
   - `extensive`
3. **Number & Year Allow-List Diff:** The server extracts all digits (`\b\d+\b`) from the AI output. If any digit or year (e.g. `2018`, `10`) appears in the output that was not in the candidate's input notes, the entire AI response is rejected.
4. **Self-Reported Upgrade Protection:** If a candidate's skill is labeled `Self-reported`, any AI sentence mentioning that skill alongside "certified", "accredited", "qualified", or "professional" is rejected.
5. **Deterministic Template Fallback:** Whenever an AI response fails validation, times out, or has AI disabled, the platform automatically returns a deterministic template CV constructed strictly from the raw input facts.

---

## 3. Human in the Loop (Section 37.5)

- **Side-by-Side Review:** Candidates view their raw input facts directly alongside the drafted lines in [`src/features/candidate/components/AICVDrafterModal.tsx`](../src/features/candidate/components/AICVDrafterModal.tsx).
- **Line-by-Line Editing:** Candidates can edit the wording of each individual bullet point or delete unrepresentative lines.
- **Mandatory Confirmation Checkbox:** The profile save button remains disabled until the candidate explicitly checks:
  > *"I confirm this is true: These lines accurately reflect my real experience and skills without any false claims or exaggeration."*
- **No Automatic Employer Sharing:** Drafts are never shared with employers automatically. Candidates must manually save the draft to their profile.

---

## 4. Employer Presentation & Trust Signals (Section 37.6 & 37.7)

To ensure employers are never misled by AI phrasing:
1. **Verification Label First, AI Summary Second:** When employers view a candidate's profile or application, the 4-tier verification badge (`Task-assessed`, `Peer-endorsed`, `Mentor-verified`, `Self-reported`) is displayed prominently at the top of each skill chip.
2. **Mandatory Tag:** All AI-assisted summaries carry the explicit disclaimer tag:
   `"Written with AI help - not verified"`
3. **Hard Invariant:** AI can **never** change a Skill Passport label or add an unearned skill to a candidate's passport.

---

## 5. Privacy & Data Protection (Section 37.8)

- **Explicit Opt-in Consent:** Candidates see a plain-language consent screen before entering facts, explaining what is sent, how it is processed, and that it can be closed at any time.
- **Zero Model Training:** Candidate data sent through the API is configured with zero data retention for training public commercial foundation models.
- **Minimal Metadata Logging:** Server logs record only that a request occurred and the number of skills parsed (`uid=123, 2 skills`). Zero candidate experience text, names, or outputs are retained in access logs.

---

## 6. Automated Test Suite (Section 37.9)

The safeguard engine is verified by automated unit tests in [`src/domain/aiCvSafeguards.test.ts`](../src/domain/aiCvSafeguards.test.ts):
- `(a)` Invented skills (e.g. Blockchain, MBA) are rejected and fall back to template.
- `(b)` Invented numbers or years (e.g. "10 years experience") are rejected.
- `(c)` Self-reported skills never appear as certified or professional.
- `(d)` Fallback template operates reliably when AI is disabled or fails.
- `(e)` Saving is strictly blocked unless the candidate confirms truthfulness.
- `(f)` Prompt payloads strip all phone numbers, SA ID numbers, and credential IDs.
