# Contributing to FieldPins

Thanks for taking an interest in FieldPins! This document will get you up and running as a contributor.

---

## Prerequisites

- [Node.js](https://nodejs.org/) LTS
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A Google account (for OAuth testing)

---

## Local Setup

### 1. Fork & clone

```bash
git clone https://github.com/<your-handle>/fieldpins.git
cd fieldpins
pnpm install
```

### 2. Google Cloud OAuth (required to run the app)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) → create a project (e.g. `fieldpins-dev`).
2. Enable the **Google Drive API**.
3. Go to **APIs & Services → OAuth consent screen** → External → fill in app name, add your email as a test user.
4. Go to **APIs & Services → Credentials** → **Create Credentials → OAuth 2.0 Client ID** → Web application.
5. Add `http://localhost:3000/api/auth/callback/google` as an **Authorised redirect URI**.
6. Copy the Client ID and Client Secret.

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET
```

### 4. Run

```bash
pnpm dev        # development server → http://localhost:3000
pnpm test       # unit tests (Vitest)
pnpm typecheck  # TypeScript check
pnpm lint       # ESLint
```

---

## Project Structure (key areas)

| Path | What lives here |
|---|---|
| `app/` | Next.js App Router pages & API routes |
| `components/` | Shared UI components |
| `lib/` | Dexie DB client, Drive client, types |
| `hooks/` | React hooks |
| `sync/` | Manual sync queue logic |
| `docs/` | User-facing documentation |

---

## Branch & Commit Conventions

```
feat/short-description     # new feature
fix/short-description      # bug fix
docs/short-description     # documentation only
chore/short-description    # tooling, deps, config
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add retry badge to sync queue
fix: clamp photo count to 4 on paste
docs: update offline.md with Android steps
```

A `commitlint` hook enforces this locally.

---

## Pull Request Process

1. Create your branch from `main`.
2. Make sure `pnpm test`, `pnpm typecheck`, and `pnpm lint` all pass.
3. Open a PR with a clear description of **what** changed and **why**.
4. Reference any related GitHub Issues in the PR body.
5. A maintainer will review within a few days.

---

## Scope Guardrails

FieldPins is intentionally minimal. Please don't open PRs for:

- Video capture
- PDF export
- Multi-user / collaborative editing
- Auto-sync / background sync
- Backend databases (no Supabase, no Firebase, no custom server)

If you're unsure whether an idea fits, open a **Discussion** or **Issue** first.

---

## Code Style

- **TypeScript** — avoid `any`; prefer explicit types.
- **Prettier** — auto-formatted on save (`.prettierrc` is committed).
- **Tailwind CSS** — use design tokens from `app/globals.css`; avoid arbitrary values for colours/spacing.
- **State colours** — blue = uploading/active, green = synced, yellow = pending, red = failed. Don't repurpose these.

---

## Licence

By contributing you agree your code will be released under the [MIT Licence](LICENSE).
