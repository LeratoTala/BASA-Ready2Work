# BASA: Ready2Work — Privacy Notice (POPIA)

*Last updated: October 2026*

## Who we are

BASA: Ready2Work ("we", "the platform") connects South African youth jobseekers with verified
employers offering paid, short-duration work. The platform is operated by the BASA project team.

**Privacy contact:** privacy@basa.app *(update this address before public launch)*

---

## What personal information we collect

| Category | Examples | Why |
|---|---|---|
| Identity | Full name, display name | Account creation and job matching |
| Contact | Cell number, email address | Authentication (SMS OTP), employer contact after shortlisting |
| Professional | Skills, experience summary, evidence descriptions | Building a Skill Passport and matching to jobs |
| Evidence files | Photos, work samples (JPEG/PNG/WebP, max 5 MB) | Supporting skill claims; stored in private Firebase Storage |
| Location | Broad area (e.g. "Soweto, Johannesburg") — **no GPS coordinates** | Distance-based job matching |
| Usage | Authentication timestamps, application history | Platform operation and fraud prevention |

We do **not** collect South African ID numbers, financial account details, or biometric data.

---

## Legal basis for processing (POPIA)

We process personal information on these grounds:
- **Consent** — you choose to create an account and submit your profile.
- **Legitimate interest** — fraud prevention, platform security, and matching accuracy.
- **Contractual necessity** — connecting candidates with employers requires sharing relevant profile data.

---

## How we share your information

- **Employers** see your public profile (skills, experience, broad location) only if you set
  visibility to "employers only" or "public link" **and** have applied to a job they posted.
- **Contact details** (phone, email) are revealed to an employer only after they shortlist you.
- **Administrators** can access all data for moderation, assessment, and POPIA compliance purposes.
- We do **not** sell your data. We do **not** share it with third parties for advertising.
- AI CV drafting (when enabled) sends anonymised skill descriptions to Google Gemini. Your name,
  contact details, and location are **never** sent to AI providers.

---

## Your rights under POPIA

You have the right to:
- **Access** your personal information at any time via your profile page.
- **Correct** inaccurate information by editing your profile.
- **Object** to processing — contact us at the privacy address above.
- **Request deletion** — use the "Request Account Deletion" button on your profile page.
  An admin will review your request and complete deletion within **30 days**.
  Deletion removes your Firebase Auth account, Firestore documents, and Storage files.

---

## Evidence retention

Skill evidence photos and work samples are stored privately in Firebase Storage.
They are deleted when you delete a skill claim or when your account is fully deleted.
We retain application and work records for **12 months** after a job is completed for dispute
resolution, after which they are deleted. *(Confirm this period with legal counsel before launch.)*

---

## Security

- All data is stored in Google Firebase (Firestore and Storage), which is ISO 27001 certified.
- Role-based access control is enforced at the database level via Firestore security rules.
- The server validates all requests with Firebase ID tokens; client writes are scoped by role.
- Firebase App Check (reCAPTCHA v3) protects API endpoints from abuse.

---

## Changes to this notice

We will update this notice when our practices change and post the updated version here.
Continued use of the platform after changes constitutes acceptance.

---

*Questions? Contact us at privacy@basa.app*
