# Contributing to BizMind BD

## Branch strategy

- `main` — production-ready, protected. No direct pushes.
- `develop` — integration branch, protected. All feature branches merge here first.
- `feature/<module>-<short-desc>` — e.g. `feature/auth-login`, `feature/nav-sidebar`
- `fix/<short-desc>` — bug fixes
- `chore/<short-desc>` — tooling, config, non-feature work

Branch protection (set on GitHub for `main` and `develop`):
- Require at least 1 PR approval (2 for anything touching `backend/src/auth/**`)
- Require CI checks to pass before merge
- No force-push

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add login endpoint
fix: correct reorder_level comparison in inventory service
test: add unit tests for auth.service
docs: update README setup steps
chore: bump nestjs/mapped-types
```

## Coding conventions

- **Backend**: one module per ER entity (`users`, `products`, `inventory`, `sales`, `suppliers`, `procurement`, `expenses`) — controller/service/dto/entity per module, matching what's already scaffolded.
- **Frontend**: one page per screen in `src/pages/`, shared UI in `src/components/`, no page-specific styling leaking into shared components.
- **Mobile**: one screen per file in `lib/screens/`, shared widgets in `lib/widgets/`.
- Run the linter before pushing: `npm run lint` (backend/frontend) or `flutter analyze` (mobile).

## AI-assisted workflow (GitHub Copilot)

- Use Copilot for scaffolding boilerplate (DTOs, CRUD controllers, repetitive test cases) — write a clear function signature + one-line comment first so suggestions are on-target.
- **Always read and adjust Copilot output before committing** — this applies doubly to anything in `auth/` (password hashing, token handling).
- After finishing a function/endpoint, prompt your AI assistant to generate unit tests covering edge cases, then review and trim/adjust — don't commit generated tests unread.
- Every PR description should note whether it was AI-assisted (see PR template).

## Pull Request process

1. Branch off `develop`.
2. Open a PR early (draft is fine) using the template in `.github/PULL_REQUEST_TEMPLATE.md`.
3. Ensure CI (lint + test) passes.
4. Request review — minimum 1 approval (2 for auth-related changes).
5. Squash-merge into `develop` once approved.

## Weekly progress summaries

At the end of each sprint week, generate a summary from merged PRs + closed issues (via the GitHub API) and feed it to an AI assistant for a stakeholder-readable write-up. See `.github/workflows/weekly-summary.yml` for the automated version.
