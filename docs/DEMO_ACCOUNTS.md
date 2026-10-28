# BASA: Ready2Work — Quick Access Demo Personas & Guide

The **Quick Access Demo** runs 100% on-device inside your browser using simulated state (`localStorage` prefixed with `basa_demo_v1:`). It requires **no passwords, no sign-up, no credit cards, and zero cloud API calls**.

You can switch between any of the 7 personas using the **Switch profile** dropdown in the header, or reset state anytime via **Reset demo**.

---

## The 7 Fixed Demo Personas

### 1. Thabo Ndlovu (`candidate-thabo`)
* **Role:** Candidate (Job Seeker in Soweto)
* **One-Line:** Jobseeker in Soweto · Barista & Solar Assistant with active applications
* **Key Scenarios to Test:**
  * **Skill Passport:** View 3 skills with distinct verification levels:
    * *Barista & Espresso Calibration* (`Task-assessed` — 92/100 score from Nomsa Dlamini)
    * *Solar PV Rooftop Mounting & DC Wiring* (`Peer-endorsed` — contractor reference on file)
    * *Smartphone Screen & Battery Replacement* (`Self-reported`)
  * **Proof Trail:** Attached TVET certificates, harness safety photos, and signed contractor reference.
  * **Applications:** Active applications (`Under Review` at Zola Artisan Café, `Shortlisted` at SunPower Solars).
  * **Work History:** Completed festival barista gig with confirmed payout (R850).
  * **AI CV Drafter:** Launch the modal, review the consent notice, enter task notes, and generate an honest CV summary with Section 37 guardrails (simulated offline).

---

### 2. Nomvula Khumalo (`candidate-nomvula`)
* **Role:** Candidate (Digital Office & Retail Assistant in Khayelitsha)
* **One-Line:** Retail Merchandiser & Digital Assistant · Multi-tier skills & pending endorsement
* **Key Scenarios to Test:**
  * **Multi-Tier Skills:**
    * *Retail POS & Cash Up* (`Peer-endorsed` by Mam Lindiwe)
    * *Digital Admin & Google Sheets* (`Mentor-reviewed` by Nomsa Dlamini)
    * *Customer Care & WhatsApp Support* (`Self-reported`)
  * **Pending Endorsement:** Peer endorsement submitted by Mam Lindiwe awaiting assessor confirmation.
  * **Alerts & Notifications:** In-app notification for pending peer endorsement review and application status.
  * **POPIA Right to Erasure:** Submitted privacy deletion request under review by Moderator Sipho.

---

### 3. Zola Sithole (`employer-zola`)
* **Role:** Employer (Zola Artisan Café & Roastery)
* **One-Line:** Zola Artisan Café (Free Plan) · 1 open barista job with applicant pipeline
* **Key Scenarios to Test:**
  * **Subscription Tier:** SMME Free Tier (strictly 1 active job limit).
  * **Active Job:** `Weekend Barista & Customer Service` (1 open job, others closed to respect the 1-job limit).
  * **Applicant Pipeline:** $\ge 2$ candidates applied (Thabo Ndlovu under review, Nomvula Khumalo submitted).
  * **Capacity Guard:** Attempting to post another job prompts the upgrade modal.
  * **Upgrade Flow:** Launch the *Request Plan Upgrade* modal to submit an upgrade to Starter plan.

---

### 4. Farai Moyo (`employer-sunpower`)
* **Role:** Employer (SunPower Solars Gauteng)
* **One-Line:** SunPower Solars (Starter Plan) · Open solar jobs with mixed applicants
* **Key Scenarios to Test:**
  * **Subscription Tier:** Starter Plan (active, up to 5 active jobs).
  * **Open Jobs:** 2 active listings (`Rooftop Solar Installation Assistant`, `Solar Maintenance & Panel Cleaning Assistant`).
  * **Pipeline:** Thabo Ndlovu shortlisted; completed cable tray gig awaiting payout confirmation.
  * **Payout Confirmation:** Test confirming completed contractor payout (R520).

---

### 5. Tshiamo Molefe (`employer-tshiamo`)
* **Role:** Employer (Kasi Fresh Logistics & Courier)
* **One-Line:** Kasi Fresh Logistics (Free Plan) · Pending business verification & upgrade request
* **Key Scenarios to Test:**
  * **Pending Business Verification:** Municipal trading permit submitted for anti-fraud review (`verificationStatus: pending`).
  * **Pending Upgrade Request:** Active request to upgrade from Free to Starter plan logged for admin review.
  * **Jobs:** 1 draft delivery driver listing (`job-tshiamo-1`).

---

### 6. Nomsa Dlamini (`admin-nomsa`)
* **Role:** Admin (Lead Practical Assessor & TVET Mentor)
* **One-Line:** Lead Assessor & Mentor · Practical rubrics queue, pending verification & upgrades
* **Key Scenarios to Test:**
  * **Assessor Workspace:** View practical task grading rubrics and candidate proof portfolios.
  * **Pending Business Verification:** Review and approve Kasi Fresh Logistics' business trading permit.
  * **Pending Upgrade Request:** Review and approve Tshiamo Molefe's upgrade to Starter plan.
  * **Credential & Endorsement Queue:** Review contractor endorsements and trade badges.

---

### 7. Sipho Mthethwa (`admin-sipho`)
* **Role:** Admin (Compliance & Moderation Officer)
* **One-Line:** Compliance & Moderation Officer · Moderation reports queue & privacy requests
* **Key Scenarios to Test:**
  * **Moderation Reports Queue:** Actionable pending report against an unregulated shift listing lacking minimum wage compliance.
  * **POPIA Right to Erasure:** Review and action Nomvula Khumalo's privacy deletion request.
  * **Fair Work Compliance:** Verify that zero upfront candidate fee policies are strictly maintained across listings.
