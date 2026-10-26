# Data Retention, Deletion & POPIA Compliance Policy (Section 38)

**Document Version:** 1.0 (Part 4 Implementation)  
**Applicability:** BASA: Ready2Work Platform  
**Governing Regulation:** Protection of Personal Information Act (POPIA, Act No. 4 of 2013)  
**Config Reference:** [`src/config/retentionConfig.ts`](../src/config/retentionConfig.ts)  

---

## 1. Data Retention Schedule (Retention Table)

The following schedule governs the lifecycle of personal data held across Firestore, Firebase Cloud Storage, and authentication services:

| Category | Data Items Included | Retention Duration | Trigger / Action Upon Expiry |
|---|---|---|---|
| **Active Candidate Profiles** | Full name, phone, area, headline, experience summary, availability | Retained while account is active | Permanently purged within 30 days of deletion request |
| **Skill Claims & Evidence Files** | Claim descriptions, photos, work samples, audio notes, certificates | Retained while account is active | Permanently deleted from Cloud Storage and database on account deletion |
| **Credential Records & Duplicate Hashes** | Issuer name, verification link, salted duplicate check hash (`HMAC-SHA256`) | Retained while account is active | Hashes and records deleted upon account deletion to release credentials |
| **Unselected Job Applications** | Applications marked `not_selected`, `rejected`, or `withdrawn` | **6 Months** | Automatically purged or anonymized to protect applicant history |
| **Candidate Work History (Skill Passport)** | Completed work entries, employer confirmation, hours served | Retained while account is active | The candidate's own professional proof. Deleted with account within 30 days of deletion request. |
| **Employer Billing & Subscription Invoices** | Business name, target plan, invoice amount, billing contact | 5 Years (assumed statutory tax/audit period, to be confirmed by SA tax rules) | Contains corporate business details only; zero candidate personal data. |
| **Closed Placements (Aggregate Impact)** | Anonymised placement counts, trade category, regional cluster | Indefinite (anonymised metrics) | Stripped of all candidate PII (no name, contact details, ID, or evidence files). |
| **Inactive Accounts** | User profile with zero logins or applications | **12 Months** (Warning)<br>**18 Months** (Deletion) | Warning notification sent at 12 months; permanent account deletion executed at 18 months |
| **Audit Logs** | Action timestamp, actor UID, event type (e.g. `USER_DELETED`) | Minimal retention; zero personal content | Anonymized on account deletion; minimal receipt retained |
| **Aggregate Impact Metrics** | Verified skill counts, placement totals, repeat engagements | Indefinite | Contains zero PII; fully anonymized counts |

---

## 2. In-App Self-Service Account Deletion (Section 38.1 & 38.2)

Candidates and employers can request permanent account deletion directly within the application (**Settings > Privacy > Delete my account**):

### 2.1 Candidate Journey (No Dark Patterns)
1. **Direct Access:** Accessible from candidate profile settings without hidden menus or forced retention surveys.
2. **Plain-Language Impact Confirmation:** The dialog states clearly what will be removed:
   - Candidate profile and bio
   - All claimed skills and evidence descriptions
   - All uploaded photos, certificates, and credential files in Cloud Storage
   - All salted credential duplicate hashes (releasing certificates from platform lock)
   - All pending and past job applications and notifications
3. **30-Day Purge Execution:** The deletion pipeline executes within 30 days via Cloud Function or immediate emulator purge:
   - Removes Firestore documents across all collections (`users`, `candidateProfiles`, `skillClaims`, `applications`, `endorsements`, `mentorReviews`).
   - Recursively deletes Storage bucket objects under `candidate-evidence/{uid}/`.
   - Deletes Firebase Authentication records.
4. **Post-Deletion Barrier (Section 38.7):** A deleted user cannot sign back in to recover deleted data; signing in again initializes a clean zero-state account.

---

## 3. Inactive Account Lifecycle (Section 38.3)

To prevent the indefinite accumulation of dormant personal records:
- **Active State (0–12 Months):** Full platform access and active Skill Passport visibility.
- **12-Month Inactivity Warning:** If a candidate does not log in for 12 consecutive months, an automated notification and SMS/email reminder is sent:
  > *"We noticed you haven't logged into BASA Ready2Work for a while. To protect your privacy, inactive accounts are safely deleted after 18 months. Log in anytime to keep your Skill Passport active."*
- **18-Month Automated Deletion:** If no login occurs within 18 months, the account deletion cascade is automatically triggered, wiping all personal evidence and claims.

---

## 4. Employer-Held Copies Disclaimer (Section 38.3)

Candidates share their verified contact details and Skill Passport with an employer only when applying or shortlisting:
- **Revocation of Sharing:** A candidate can withdraw their application at any time, immediately removing the candidate's phone and email from the employer's in-app portal.
- **Clear External Disclaimer:** The platform communicates transparently (Grade 6 level) that:
  > *"Data you shared with an employer is visible only for that job application. You can revoke sharing at any time in the app. However, any notes or documents already printed, written down, or saved by an employer to their own computer outside the app cannot be deleted by us."*

---

## 5. Candidate Data Export (Section 38.4)

Candidates have the statutory right under POPIA to obtain a portable copy of their personal data:
- **One-Click JSON Export:** Candidates can tap **"Export My Data (JSON)"** in profile settings.
- **Safe Payload Scope:** The exported `.json` file contains:
  - Full candidate profile details (name, headline, experience summary, availability)
  - All claimed skills and verification statuses
  - All verified credentials (excluding secret salted hashes)
  - Submitted job application records
- **Zero Third-Party Leaks:** The export never includes data belonging to other candidates, employer contact details, or proprietary platform weights.

---

## 6. Employer Account Deletion (Section 38.6)

Employers can delete their account and job listings from their profile page:
- Deleting an employer account closes all open job postings immediately.
- Historical candidate applications received for past jobs are retained under Section 38.3 (6-month rule) and then purged.
- Unverified business documents are wiped.

---

## 7. Automated Test Verification (Section 38.7)

The retention engine is verified in [`src/domain/retentionEngine.test.ts`](../src/domain/retentionEngine.test.ts):
- `(a)` 6-month retention filter identifies and purges unselected applications while preserving active placements.
- `(b)` Inactivity warning triggers at 12 months and deletion triggers at 18 months.
- `(c)` Deletion purge removes profile, skills, credentials, duplicate hashes, and notifications.
- `(d)` Deleted user cannot sign back in to old data.
- `(e)` Data export contains only the candidate's personal data.
