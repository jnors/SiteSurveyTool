# User Stories — Sprint 2 (Google Drive Integration)

Scope: Add Google OAuth + Drive integration for manual sync. Keep manual sync entry point; no auto-sync; write `project.json` last; idempotent uploads; robust error handling.

## Story 1 — Google OAuth + Token Handling [PO → GDrive]
- Status: [x] Done
- Tags: auth, gdrive
- Data Contract Touched: tokens stored locally (NextAuth JWT); no Dexie table required
- UX States: offline/unauthenticated, authenticated
- Scenarios (Given/When/Then):
  - Given a new user, when signing in with Google, then the app requests scopes `openid email profile https://www.googleapis.com/auth/drive` and stores tokens locally.
  - Given loss of connectivity, when opening the app, then UI remains responsive and "Sync now" is disabled with an offline message.
  - Given sign-out, when confirmed, then tokens are cleared and Drive actions are disabled.
- Acceptance Criteria:
  - OAuth flow works in PWA context; tokens available to Drive client; minimal persistence.
  - Clear path disclosure: shows `/My Drive/SST/…` target.
  - Offline/unauthenticated states communicated without blocking the UI.
- Test Notes:
  - Token expiry/refresh via NextAuth JWT refresh path (test forced expiry).
  - Sign-in/out in iOS Safari PWA, Android Chrome, desktop browsers (redirect flow).
  - Offline launch: banner disables Sync Now; projects remain usable while sign-in CTA shows.

Implementation Notes (Delivered):
- NextAuth configured with Google provider and Drive scope; JWT with refresh path (`lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`).
- SessionProvider disables refetch while offline; `useAuth` caches last successful session for offline UX.
- Sign-in card and privacy docs disclose Drive path; UI remains usable while unauthenticated.

## Story 2 — Drive Root/Project Folder Ensure [PO → GDrive]
- Status: [x] Done
- Tags: gdrive, state-UX
- Data Contract Touched: Drive folder IDs cached per `Project.driveFolderId`
- UX States: syncing/success/fail
- Scenarios (Given/When/Then):
  - Given "Sync now", when root `/My Drive/SST/` is missing, then create it (idempotent).
  - Given a project `<ProjectName>__<projectId>`, when syncing, then ensure the project folder exists (idempotent).
  - Given a moved/renamed folder, when detected, then prompt to re-link or re-create.
- Acceptance Criteria:
  - Idempotent root/project folder discovery/creation.
  - Caches `Project.driveFolderId` once established.
  - Clear error surfacing and recovery for moved/renamed.
- Test Notes:
  - Simulate moved/renamed folders; multiple syncs; permissions errors.

Implementation Notes (Delivered):
- API `POST /api/drive/ensure` creates/locates `SST` root and `<ProjectName>__<projectId>` idempotently; validates cached `driveFolderId` and flags moved/renamed/trashed or wrong parent.
- `useProjects.syncAll()` sets all projects to `syncing`, calls ensure per project, updates Dexie `Project.driveFolderId`, and returns an issues summary.
- UI shows a toast summary and a dialog listing impacted projects with a "Re‑create here" action; ProjectCards render a yellow "Relink" chip until resolved.

Follow‑ups (moved to Sprint 3):
- Manual relink to an existing folder (paste/choose) in addition to re‑create.
- Persist anomaly badge across reloads via a Dexie flag.

## Story 3 — Upload Sequencing + project.json Last [PO → GDrive]
- Status: [ ] Pending
- Tags: data-contract (export JSON), state-UX
- Data Contract Touched:
  - Export `project.json` (structure per PRD); written last.
  - Update `Photo.driveFileId` and `Floorplan.driveFileId` upon success.
- UX States: syncing/success/fail; retry/backoff
- Scenarios (Given/When/Then):
  - Given an Outbox with pending items, when "Sync now", then upload photos first + any per-pin JSONs (if used) + write/patch `project.json` last.
  - Given a quota/network error, when encountered, then errors surface with actionable retry; exponential backoff on repeated failures.
  - Given repeated "Sync now", when run, then operations are idempotent (no duplicates).
- Acceptance Criteria:
  - Outbox items transition pending→syncing→synced/error; retries with exponential backoff and max cap.
  - `project.json` reflects current Dexie state and validates against schema.
  - Last-write-wins respected for updates.
- Test Notes:
  - Throttling; partial failures; duplicate protection; schema validation.

## Success Metrics
- ≥90% successful syncs within 24h (with retries/backoff).
- Clear, actionable errors for offline/quota/moved-folder scenarios.

---

Guardrails: Manual sync only; write `project.json` last; respect folder naming `<ProjectName>__<projectId>`; only requested scopes; avoid blocking UI on network calls.

*** End of Sprint 2 ***
