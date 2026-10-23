# Security & Privacy Baseline

## Identity and roles
- Authentication: Firebase Authentication (Google sign-in enabled).
- Admin/assessor = Firebase **custom claim** `admin: true`, granted only with `scripts/set-admin-claim.mjs` from a trusted machine. No identities are hard-coded in rules or code.
- The client reads the claim from the ID token only to choose the UI; rules re-check it on every request.
- Self-registration may create `candidate` or `employer` accounts only. Employer profiles start `pending`; only an admin may verify.

## Enforced server-side (Firestore rules)
Candidates cannot change verification labels or assessments. Employers only read applications for their own jobs. Applications are one-per-candidate-per-job, only for open jobs, and follow valid status transitions. See `firebase/firestore.rules` and `tests/rules/`.

## Before going public (checklist)
- [ ] Enable **Firebase App Check** and restrict the web API key to your domains.
- [ ] Add authorized domains only for your real hosts (Firebase Auth settings).
- [ ] Gate the AI endpoint with Firebase ID-token verification (currently rate-limited only).
- [ ] Move candidate phone/contact into a private sub-document revealed only after shortlisting (POPIA data minimisation).
- [ ] Publish a privacy notice; define correction, deletion and evidence-retention process.
- [ ] Confirm `VITE_ENABLE_DEMO_DATA=false` in production.
- [ ] Run `npm run test:rules` against the emulator in CI.
- [ ] Rotate any key that was ever shared outside your team.

This is a product checklist, not legal advice. Review POPIA obligations before launch.
