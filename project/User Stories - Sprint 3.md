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
- Status: [x] Completed
- Tags: state-UX, data-contract
- Data Contract Touched: none (existing Floorplan table supports N per project)
- UX States: idle, selecting, offline
- Scenarios:
  - Given Project Detail, when the user adds another floorplan (image picker), then the image is compressed to 1080p JPEG, a new Floorplan row is created, and it becomes the selected floorplan.
  - Given multiple floorplans exist, when the user switches between them (chips/list), then pins/photos update context to the selected floorplan.
  - Given sync during Sprint 3, then project.json includes the selected floorplan (Phase 1); uploading all floorplans is a P2 (follow-up) with `data-contract` tag.
  - Given offline, adding new floorplans works locally; switching floorplans is not supported in Sprint 3 (see Sprint 4 for offline switching).
- Acceptance Criteria:
  - Add Floorplan action present on Project Detail; selection UI clearly indicates the active floorplan.
  - Pins are scoped per floorplan; 4-photo limit per pin enforced.
  - No Drive deletions; write `project.json` last.
  - Offline switching is explicitly out of scope for Sprint 3; attempting to switch while offline should be prevented with a clear message.
- Test Notes:
  - Seed 2 floorplans; assert selection switches pin sets.
  - Create additional floorplan offline; verify Dexie row; confirm selection persists across reloads when back online.

Note: Offline floorplan switching is deferred. See Sprint 4, Story 2 for the dedicated implementation.

#### Switching‑Disabled UX Chip (Offline)
- Purpose: Provide a clear, field‑friendly indicator that switching floorplans is unavailable while offline (until Sprint 4), without confusing taps or navigation bounce.
- Visual spec (dark‑mode first):
  - Chip base: rounded‑full, 44×44 min touch target; 8‑pt grid; Inter font.
  - Disabled state: border `#1E1E1E` → `border-border/60`, text `text-foreground-muted`, 50% opacity; no hover glow.
  - Active (current) chip remains styled as active: blue ring/glow `#8AB4F8` at ≤150ms pulse; shows name + count.
  - Tooltip (on disabled chips): “Offline—switching floorplans isn’t available yet.”
  - Accessibility: `aria-disabled="true"`, `aria-pressed` only on the active chip, focus ring still visible on active chip.
- Behavior:
  - When offline, only the active chip is interactive (no‑op on tap) and other chips are disabled with the above tooltip.
  - When online, all chips are enabled and switching updates pins/photos immediately.
- Acceptance:
  - Offline: non‑active chips show disabled visual + tooltip; no route/URL change; no network activity.
  - Online: chips behave as normal; switching completes ≤150ms with stateful feedback.
- Test Notes:
  - Force offline: verify disabled chip styling and tooltip; tapping a disabled chip does not change floorplan or URL.

### Implementation Tasks
- [x] **FE**: Expand `Project` UI types (`lib/types.ts`, `lib/mappers.ts`) to return `floorplans[]` and `activeFloorplanId`; ensure pins are scoped to a floorplan.
- [x] **FE**: Add hooks (`useFloorplans`, `useActiveFloorplan`) to load multiple floorplans, persist selection via `fp` query param, and handle defaults.
- [x] **FE**: Update `useProject` to accept an explicit `floorplanId`, load scoped pins/photos, and short-circuit add-pin when the floorplan changes.
- [x] **FE**: Build `AddFloorplanButton` (image picker + 1080p compression + Dexie insert) and `FloorplanSwitcher` (chips + thumbnails, state styling ≤150ms).
- [x] **FE**: Integrate switcher/button into `app/projects/[projectId]/page.tsx`, wire query param handling, and ensure UI resets add-pin mode on switch.
- [x] **GDrive**: Thread selected `floorplanId` into `syncProject`, include `activeFloorplanId` and only the active floorplan’s pins/photos in `project.json`; preserve write-last ordering.
- [x] **QA**: Add Vitest coverage for floorplan selection (hooks + sync payload) and an offline add-floorplan scenario; update E2E seed to validate chip switching.

## Story 3 — Delete Photos (Per Pin)
- Status: [x] Completed
- Tags: state-UX
- Data Contract Touched: Photo, Outbox (no schema change)
- UX States: idle, deleting, offline
- Scenarios:
  - Given a pin with photos, when the user taps “Delete” on a photo, then the photo is removed from Dexie and any matching Outbox `upload_photo` rows are removed.
  - Given the deleted photo was already uploaded to Drive, delete photo from Drive as well; the next `project.json` omits the photo.
  - Given offline, deletion works locally and reflects immediately in UI.
- Acceptance Criteria:
  - Delete control visible per photo in Pin Detail; confirm affordance (dialog or clear undo toast) shown.
  - Post-delete, the pin’s photo count updates and user can attach a new photo up to 4 total.
- Outbox has no lingering entries for the deleted photo; pin/project statuses recompute correctly; Drive deletion triggered for any `driveFileId` with retry queued when offline/errors occur.
- Test Notes:
  - Create 2 pending photos → delete one → Dexie photo count decrements; related Outbox row removed.
- Delete a synced photo → Dexie row removed; Drive delete invoked (mock/queued); sync writes project.json without that photo.

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
