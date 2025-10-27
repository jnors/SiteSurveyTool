# User Stories — Sprint 3

Scope: Close Sprint 2 gaps and harden core creation/capture flows. Prioritize: Create Project, Multi-Floorplan (Phase 1), and Photo Deletion. Keep MVP guardrails: manual sync, write `project.json` last (Sprint 2 Story 3), no backend DB, no auto-sync.

---

## Story 1 — Create New Project (Works)
- Status: [x] Completed
- Tags: state-UX
- Data Contract Touched: Project, Floorplan (no schema change)
- UX States: idle, saving, success, fail, offline
- Scenarios (Given/When/Then):
  - Given the Projects page, when the user taps “Create New Project,” then a dialog prompts for Project name and a Floorplan image (required) with Save disabled until both are provided.
  - Given Save is clicked (online or offline), then a new Project row and initial Floorplan row are created in Dexie; the app routes to `/projects/<projectId>` with an empty pin list.
  - Given offline, when the project is created, then it persists locally and shows Pending sync status; no Drive calls are attempted.
  - Given the user cancels the dialog, then no rows are created.
- Acceptance Criteria:
  - Dexie rows created:
    - Project { id, name, createdAt, updatedAt, driveFolderId?, syncedAt? }
    - Floorplan { id, projectId, name, type='image/jpeg', width, height, localUri, driveFileId? }
  - Floorplan image is resized client-side to max 1080p JPEG (q≈0.75–0.85).
  - Route changes to Project Detail on success; Projects list shows the new project after refresh.
  - Guardrails: manual sync entry point only; last-write-wins; autosave on edits.
- Test Notes:
  - Unit test `createProject`: inserts both rows; returns `projectId`; uses `compressImageToJpeg`; Save disabled until both inputs set.
  - E2E happy path: create offline → appears with Pending; after manual sync → Synced.

## Story 2 — Multiple Floorplans (Phase 1: Local + Selection)
- Status: [ ] Pending
- Tags: state-UX, data-contract
- Data Contract Touched: none (existing Floorplan table supports N per project)
- UX States: idle, selecting, offline
- Scenarios:
  - Given Project Detail, when the user adds another floorplan (image picker), then the image is compressed to 1080p JPEG, a new Floorplan row is created, and it becomes the selected floorplan.
  - Given multiple floorplans exist, when the user switches between them (chips/list), then pins/photos update context to the selected floorplan.
  - Given sync during Sprint 3, then project.json includes the selected floorplan (Phase 1); uploading all floorplans is a P2 (follow-up) with `data-contract` tag.
  - Given offline, adding/switching floorplans works locally; manual sync later.
- Acceptance Criteria:
  - Add Floorplan action present on Project Detail; selection UI clearly indicates the active floorplan.
  - Pins are scoped per floorplan; 4-photo limit per pin enforced.
  - No Drive deletions; write `project.json` last.
- Test Notes:
  - Seed 2 floorplans; assert selection switches pin sets.
  - Create additional floorplan offline; verify Dexie row; confirm selection persists across reloads.

## Story 3 — Delete Photos (Per Pin)
- Status: [ ] Pending
- Tags: state-UX
- Data Contract Touched: Photo, Outbox (no schema change)
- UX States: idle, deleting, offline
- Scenarios:
  - Given a pin with photos, when the user taps “Delete” on a photo, then the photo is removed from Dexie and any matching Outbox `upload_photo` rows are removed.
  - Given the deleted photo was already uploaded to Drive, then deletion is local-only for MVP (file not deleted on Drive); the next `project.json` omits the photo.
  - Given offline, deletion works locally and reflects immediately in UI.
- Acceptance Criteria:
  - Delete control visible per photo in Pin Detail; confirm affordance (dialog or clear undo toast) shown.
  - Post-delete, the pin’s photo count updates and user can attach a new photo up to 4 total.
  - Outbox has no lingering entries for the deleted photo; pin/project statuses recompute correctly.
- Test Notes:
  - Create 2 pending photos → delete one → Dexie photo count decrements; related Outbox row removed.
  - Delete a synced photo → Dexie row removed; sync writes project.json without that photo.

---

## Story 4 — Relink Existing Drive Folder (Moved/Renamed)
- Status: [ ] Pending
- Tags: state-UX, data-contract
- Data Contract Touched: Project.driveFolderId (re-validated/replaced)
- UX States: syncing/success/fail; relink prompt
- Scenarios:
  - Given a project with a cached `driveFolderId`, when ensure detects the folder is moved/renamed/trashed or not under `/My Drive/SST/`, then the UI offers “Re-create here” and “Relink existing”.
  - Given “Relink existing,” when the user pastes a Drive folder URL/ID (or uses a picker, P2), then the client validates ownership, parent = `SST` root, and name = `<ProjectName>__<projectId>`; upon success, `Project.driveFolderId` is updated and ensure passes on next sync.
  - Given invalid folder, when validated, then the UI shows actionable errors and does not persist.
- Acceptance Criteria:
  - Dialog shows both actions when `movedOrMissing = true`.
  - Validation covers: exists, not trashed, parent is `SST` root, exact name match.
  - On success, relink persists to Dexie and badge clears on next ensure.
- Test Notes:
  - Mock ensure API returning `movedOrMissing: true` then simulate relink path; verify Dexie update and subsequent ensure call passes.

## Story 5 — Persist Sync Anomalies Across Reloads
- Status: [ ] Pending
- Tags: state-UX, data-contract
- Data Contract Touched: Project (add `syncAnomaly?: 'moved' | 'missing' | null`)
- UX States: normal; “Relink” badge visible until cleared
- Scenarios:
  - Given ensure finds a moved/renamed folder, then set `Project.syncAnomaly` accordingly.
  - Given successful “Re-create here” or valid relink, then clear `syncAnomaly` and update `driveFolderId`.
  - Given app reload, then the “Relink” chip still shows for affected projects until resolved.
- Acceptance Criteria:
  - Badge persists across reloads; automatically clears after successful ensure/relink.
- Test Notes:
  - Seed one project with `syncAnomaly='moved'`; render ProjectCard list and assert chip visible; run relink flow and assert cleared.

## Story 6 — Gate Demo Normalizer and Remove For Prod
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

## Story 7 — SW Pre-cache Enhancements (Optional, P2)
- Status: [ ] Pending
- Tags: state-UX
- Data Contract Touched: none
- Scenarios:
  - Given first online visit to `/projects`, when SW installs, then it pre-caches HTML plus dependent `/_next/*` assets for project detail routes to guarantee first-time offline navigation without white screens.
  - Given assets updated, when SW activates, then it cleans old entries and refreshes navigation fallbacks.
- Acceptance Criteria:
  - Verified offline navigation to a visited project without 504 errors; install-time warm works reliably.
- Test Notes:
  - SW unit tests for URL extraction and cache writes (mock `fetch`/`caches`).

## Story 8 — Unit Tests Coverage (Expanded)
- Status: [ ] Pending
- Tags: qa, test
- Goal: Establish and expand Vitest + RTL coverage for new flows and Sprint 2 carryover.

### Coverage Targets
1) Create Project
   - Hook `createProject` persists Project + Floorplan; returns `projectId`.
   - UI: Save disabled until name+image; offline creation shows Pending in list/detail.
2) Delete Photo
   - `deletePhoto(photoId)` removes Photo and matching Outbox rows.
   - UI updates pin photo count; can re-attach up to 4.
3) Auth (Sprint 2 Story 1)
   - `useAuth` offline fallback; sign-out clears cached session.
4) Drive Ensure (Sprint 2 Story 2)
   - API `POST /api/drive/ensure` idempotency and moved/missing case.
   - Hook `useProjects.syncAll` sets syncing, updates `driveFolderId`, returns summary.
   - UI SyncBanner shows “Syncing”.

### Tooling
- Test runner: Vitest. DOM: React Testing Library. API route handler tests using `next/server` mocks. Dexie: in-memory instance; seed helpers in `lib/seed.ts`.

---

## Success Metrics (Sprint 3)
- 90%+ successful ensure operations on first attempt; clear recovery for remainder.
- Create Project success locally (offline or online) ≥ 99% across test devices.
- Photo delete correctness: 100% local removal and outbox cleanup.
- Zero false-positive “Relink” badges after successful relink/recreate.
- Green unit test suite for the above coverage.

---

Guardrails: Manual sync only; Drive scope unchanged; write-last rule for `project.json` (Sprint 2 Story 3). No backend DB, no auto-sync, no collaborative features, no video or PDF.
