# User Stories — Sprint 3

Scope: Close gaps from Sprint 2 and harden Drive integration. Keep MVP guardrails: manual sync, write `project.json` last (Story 3 in Sprint 2 still pending), no backend DB, no auto‑sync.

---

## Story 1 — Relink Existing Drive Folder (Moved/Renamed)
- Status: [ ] Pending
- Tags: state-UX, data-contract
- Data Contract Touched: Project.driveFolderId (re-validated/replaced)
- UX States: syncing/success/fail; relink prompt
- Scenarios (Given/When/Then):
  - Given a project with a cached `driveFolderId`, when ensure detects the folder is moved/renamed/trashed or not under `/My Drive/SST/`, then the UI offers “Re‑create here” and “Relink existing”.
  - Given “Relink existing”, when the user pastes a Drive folder URL/ID (or uses a picker, P2), then the client validates ownership, parent = `SST` root, and name = `<ProjectName>__<projectId>`; upon success, `Project.driveFolderId` is updated and ensure passes on next sync.
  - Given invalid folder, when validated, then the UI shows actionable errors and does not persist.
- Acceptance Criteria:
  - Dialog shows both actions when `movedOrMissing = true`.
  - Validation covers: exists, not trashed, parent is `SST` root, exact name match.
  - On success, relink persists to Dexie and badge clears on next ensure.
- Test Notes:
  - Mock ensure API returning `movedOrMissing: true` then simulate relink path; verify Dexie update and subsequent ensure call passes.

## Story 2 — Persist Sync Anomalies Across Reloads
- Status: [ ] Pending
- Tags: state-UX, data-contract
- Data Contract Touched: Project (add `syncAnomaly?: 'moved' | 'missing' | null`)
- UX States: normal; “Relink” badge visible until cleared
- Scenarios:
  - Given ensure finds a moved/renamed folder, then set `Project.syncAnomaly` accordingly.
  - Given successful “Re‑create here” or valid relink, then clear `syncAnomaly` and update `driveFolderId`.
  - Given app reload, then the “Relink” chip still shows for affected projects until resolved.
- Acceptance Criteria:
  - Badge persists across reloads; automatically clears after successful ensure/relink.
- Test Notes:
  - Seed one project with `syncAnomaly='moved'`; render ProjectCard list and assert chip visible; run relink flow and assert cleared.

## Story 3 — Gate Demo Normalizer and Remove For Prod
- Status: [ ] Pending
- Tags: state-UX
- Data Contract Touched: none
- Scenarios:
  - Given development/demo, when `NEXT_PUBLIC_DEMO_SYNC=1`, then local outbox uses `failRate=0` and any remaining photo statuses normalize to `synced` with `syncedAt` set (current behavior).
  - Given production (flag off), then statuses reflect actual upload outcomes (no normalization).
- Acceptance Criteria:
  - Feature-flagged behavior; default OFF; no normalization in production builds.
- Test Notes:
  - Unit tests toggle flag and assert state transitions accordingly.

## Story 4 — SW Pre‑cache Enhancements (Optional, P2)
- Status: [ ] Pending
- Tags: state-UX
- Data Contract Touched: none
- Scenarios:
  - Given first online visit to `/projects`, when SW installs, then it pre‑caches HTML plus dependent `/_next/*` assets for project detail routes to guarantee first‑time offline navigation without white screens.
  - Given assets updated, when SW activates, then it cleans old entries and refreshes navigation fallbacks.
- Acceptance Criteria:
  - Verified offline navigation to a visited project without 504 errors; install‑time warm works reliably.
- Test Notes:
  - SW unit tests for URL extraction and cache writes (mock `fetch`/`caches`).

---

## Story 5 — Unit Tests Coverage (Sprint 2 Story 1–2)
- Status: [ ] Pending
- Tags: qa, test
- Goal: Establish a test harness (Vitest/Jest + React Testing Library) and add unit tests covering Sprint 2 Stories 1 & 2. Expand incrementally as features land.

### Coverage Targets
1) Auth (Story 1)
   - `useAuth`
     - Offline fallback: with cached session and `useOnline=false`, returns `isAuthenticated=true` and hides sign‑in card.
     - Sign‑out clears cached session.
     - Provider opts: `refetchWhenOffline=false`, avoids fetch when offline.
2) Drive Ensure (Story 2)
   - API `POST /api/drive/ensure`
     - Returns ids for new folders (root and project) and is idempotent on repeats.
     - With mismatched name/parent/trashed, returns `movedOrMissing=true`.
   - Hook `useProjects.syncAll`
     - Sets all projects to `syncing` immediately.
     - Calls ensure per project and updates `Project.driveFolderId`.
     - Returns `movedOrMissing[]` summary.
     - `recreateProjectFolder(projectId)` re‑ensures and updates Dexie.
   - UI
     - SyncBanner calls `syncAll` and shows “Syncing”.
     - Projects list renders “Relink” chip when issues exist.

### Tooling
- Test runner: Vitest (preferred) or Jest.
- DOM: React Testing Library.
- API: Next.js route handler tests using `next/server` mocks.
- Dexie: use in‑memory Dexie for tests; seed helpers from `lib/seed.ts`.

---

## Success Metrics (Sprint 3)
- 90%+ successful ensure operations on first attempt; clear recovery for remainder.
- Zero false‑positive “Relink” badges after successful relink/recreate.
- Green unit test suite for the above coverage.

---

Guardrails: Manual sync only; Drive scope unchanged; keep write‑last rule for `project.json` (to be delivered in Sprint 2 Story 3).

