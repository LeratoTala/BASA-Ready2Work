# Contributing

## Workflow
- `main` is always demonstrable. No direct commits.
- One branch per issue: `feature/short-name`, `fix/short-name`.
- Commit prefixes: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`.
- Open a PR; CI (typecheck, unit tests, build) must pass; one review before merge.

## Rules of the codebase
1. **No hard-coded values.** Tunables live in `src/config/` (scoring, locations, defaults, storage keys) or in environment variables (`.env.example`). Components never contain weights, thresholds, URLs, emails or ids.
2. **Business rules live in `src/domain/`** as pure functions with unit tests. Do not put scoring or status logic in components.
3. **Security is server-side.** Hiding a button is not security. Any new permission must be enforced in `firebase/firestore.rules` and covered in `tests/rules/`.
4. **Honest evidence labels.** Self-reported, peer-endorsed, mentor-reviewed and task-assessed must never be conflated in UI copy.
5. **No real personal data in seeds or tests.** Fictional people only.
6. **No secrets in Git.** Only `.env.example` is committed.

## PR checklist
- [ ] Meets the linked issue's acceptance criteria
- [ ] Loading, empty and error states handled
- [ ] Permissions considered and tested
- [ ] `npm run typecheck && npm test` pass
- [ ] Docs updated; screenshots attached for UI changes
