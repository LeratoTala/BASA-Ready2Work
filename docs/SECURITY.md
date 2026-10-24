# Security & Privacy Baseline

## Identity and roles
- Authentication: Firebase Authentication (Google sign-in enabled).
- Admin/assessor = Firebase **custom claim** `admin: true`, granted only with `scripts/set-admin-claim.mjs` from a trusted machine. No identities are hard-coded in rules or code.
- The client reads the claim from the ID token only to choose the UI; rules re-check it on every request.
- Self-registration may create `candidate` or `employer` accounts only. Employer profiles start `pending`; only an admin may verify.

## Enforced server-side (Firestore rules)
Candidates cannot change verification labels or assessments. Employers only read applications for their own jobs. Applications are one-per-candidate-per-job, only for open jobs, and follow valid status transitions. `employers_only` profiles and claims require a candidate application; contact details are stored separately and become readable only after the employer shortlists that application. See `firebase/firestore.rules` and `tests/rules/`.

Optional evidence images are limited to JPEG, PNG or WebP up to 5 MB. Storage paths are candidate-owned; only the candidate and admin claim can read them. Employers receive text evidence, not raw image files. See `firebase/storage.rules` and the Storage emulator tests.

## Before going public (checklist)
- [ ] Enable **Firebase App Check** and restrict the web API key to your domains.
- [ ] Add authorized domains only for your real hosts (Firebase Auth settings).
- [x] Require Firebase ID-token verification for the AI endpoint outside fictional demo mode.
- [ ] Keep AI drafting disabled by default; review the provider's current data-use terms before setting `GEMINI_ENABLED=true`.
- [x] Exclude candidate names, contact details, location and account identifiers from AI prompts; show a reminder not to enter them in free text.
- [x] Move candidate phone/contact into a private document revealed only after shortlisting; legacy profile fields migrate on next candidate sign-in.
- [ ] Before public launch, verify legacy profile contact fields have been migrated for all active candidates.
- [ ] Publish a privacy notice; define correction, deletion and evidence-retention process.
- [ ] Configure and publish the BASA service operator's privacy contact before public use.
- [ ] Confirm `VITE_ENABLE_DEMO_DATA=false` in production.
- [ ] Run `npm run test:rules` against the emulator in CI.
- [ ] Rotate any key that was ever shared outside your team.

This is a product checklist, not legal advice. Review POPIA obligations before launch.

## Account deletion requests

Candidates can submit a minimal deletion request in their profile. It records only the candidate UID, request timestamps and review status. The candidate can see their own request; admins can review requests and mark them `in_review` or `declined`. The UI does not claim that data has been deleted.

Before public use, the BASA operator must publish a privacy contact and retention policy, verify the requester, review applications/work/safety records for required retention, then perform and audit deletion of eligible Firebase Auth and Firestore data through a trusted operator process. There is currently no in-app delete/completion action; keep a request in review until the operator workflow is approved and implemented.
