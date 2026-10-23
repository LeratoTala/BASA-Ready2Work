# Security & Privacy Baseline

## Identity and roles
- Authentication: Firebase Authentication (Google sign-in enabled).
- Admin/assessor = Firebase **custom claim** `admin: true`, granted only with `scripts/set-admin-claim.mjs` from a trusted machine. No identities are hard-coded in rules or code.
- The client reads the claim from the ID token only to choose the UI; rules re-check it on every request.
- Self-registration may create `candidate` or `employer` accounts only. Employer profiles start `pending`; only an admin may verify.

## Enforced server-side (Firestore rules)
Candidates cannot change verification labels or assessments. Employers only read applications for their own jobs. Applications are one-per-candidate-per-job, only for open jobs, and follow valid status transitions. `employers_only` profiles and claims require a candidate application; contact details are stored separately and become readable only after the employer shortlists that application. See `firebase/firestore.rules` and `tests/rules/`.

## Before going public (checklist)
- [ ] Enable **Firebase App Check** and restrict the web API key to your domains.
- [ ] Add authorized domains only for your real hosts (Firebase Auth settings).
- [x] Require Firebase ID-token verification for the AI endpoint outside fictional demo mode.
- [ ] Keep AI drafting disabled by default; review the provider's current data-use terms before setting `GEMINI_ENABLED=true`.
- [x] Exclude candidate names, contact details, location and account identifiers from AI prompts; show a reminder not to enter them in free text.
- [x] Move candidate phone/contact into a private document revealed only after shortlisting; legacy profile fields migrate on next candidate sign-in.
- [ ] Before public launch, verify legacy profile contact fields have been migrated for all active candidates.
- [ ] Publish a privacy notice; define correction, deletion and evidence-retention process.
- [ ] Configure and publish the BASA service operator's privacy contact before public use; deletion requests currently require operator handling.
- [ ] Confirm `VITE_ENABLE_DEMO_DATA=false` in production.
- [ ] Run `npm run test:rules` against the emulator in CI.
- [ ] Rotate any key that was ever shared outside your team.

This is a product checklist, not legal advice. Review POPIA obligations before launch.
