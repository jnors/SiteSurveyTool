# User Stories — Sprint 1 (Local-First Foundations)

Scope: Establish offline/local persistence and UX states without network calls. Aligns with PRD constraints (manual sync, no backend DB, 4-photo limit, 1080p cap).

## Story 1 — Dexie v1 Schema + Persistence [PO → FE]
- Status: [x] Completed
- Tags: data-contract
- Data Contract Touched:
  - Project { id, name, createdAt, updatedAt, driveFolderId?, syncedAt? }
  - Floorplan { id, projectId, name, type, width, height, localUri, driveFileId? }
  - Pin { id, floorplanId, title, note, xPct, yPct, updatedAt }
  - Photo { id, pinId, localUri, width, height, sizeBytes, driveFileId?, status }
  - Outbox { id, kind, entityType, entityId, payload, retries, lastTriedAt }
- UX States: idle
- Scenarios (Given/When/Then):
  - Given an empty DB, when the app loads, then seed data is inserted and Projects render from Dexie.
  - Given a project is open, when adding a pin, then it persists and survives reload.
  - Given edits in the Pin modal, when closing, then changes autosave.
- Acceptance Criteria:
  - Dexie schema created and versioned; first-run seed from fake data.
  - `useProjects`/`useProject` read from Dexie (in-memory removed).
  - Adding a pin writes a Pin row and updates Project.updatedAt.
- Test Notes:
  - Mobile Chrome/Safari PWA; reload the page; offline mode.
  - Validate data present in IndexedDB and survives refresh.

## Story 2 — Pin Coordinates → Percent-of-Intrinsic [PO → FE]
- Status: [x] Completed
- Tags: data-contract
- Data Contract Touched:
  - Pin: store `xPct`, `yPct` as percentages of intrinsic image.
- UX States: idle
- Scenarios (Given/When/Then):
  - Given different viewport sizes, when viewing the floorplan, then pins remain correctly positioned.
  - Given a tap near an image corner, when the image resizes, then the pin still anchors to the same relative spot.
- Acceptance Criteria:
  - Click handler computes percent coordinates.
  - Marker positions via `%`; no fixed-pixel positioning.
  - Existing seed pins migrated to `%`.
- Test Notes:
  - Rotate device; resize window; different aspect ratios.

## Story 3 — Photo Pipeline: 4-Photo Limit & 1080p JPEG [PO → FE]
- Status: [x] Completed
- Tags: —
- Data Contract Touched:
  - Photo: `width`, `height`, `sizeBytes` populated; `status` persists per photo.
- UX States: pending/success/fail (visual badges only in this sprint)
- Scenarios (Given/When/Then):
  - Given the Pin modal, when attaching photos, then the UI prevents adding a 5th photo.
  - Given a large photo, when attached, then it is resized client-side to max edge 1080px and encoded JPEG q≈0.75.
  - Given a photo thumbnail, when tapped, then a lightbox-style preview opens in a nested dialog showing the larger image and details (at least resolution) without closing the Pin modal.
- Acceptance Criteria:
  - Attach UI caps at 4 photos.
  - Stored images respect 1080p longest edge; JPEG output.
  - Metadata saved to Dexie.
  - Clicking a thumbnail opens a preview dialog (on top of the current Pin dialog) with larger image (object-contain) and visible resolution info; Close returns to the Pin dialog state.
- Test Notes:
  - iOS Safari PWA camera capture; Android Chrome; front/back camera; large input images.
  - Verify nested dialog focus management and scroll locking behave properly on mobile.

## Story 4 — Manual Sync UI + Outbox (Local Stub) [PO → FE]
- Status: [x] Completed
- Tags: state-UX, data-contract
- Data Contract Touched:
  - Outbox: enqueue create/update operations; `retries`, `lastTriedAt` for backoff.
  - Photo.status transitions (pending→syncing→synced/error for stubbed flow).
- UX States: syncing/synced/pending/error; offline banner
- Scenarios (Given/When/Then):
  - Given local changes, when tapping “Sync now”, then items enter `syncing` and transition to `synced` or `error` with retry.
  - Given offline network, when tapping “Sync now”, then a clear offline state is shown and queue persists.
- Acceptance Criteria:
  - Banner aggregates project status by pin/photo statuses.
  - Sync Now button available in the banner; processes a local queue.
  - Basic retry/backoff: failed items retain outbox rows with incremented retries and `lastTriedAt`; repeated Sync will retry.
  - No network calls; simulation only with pending→syncing→synced/error transitions.
- Test Notes:
  - Rapid edits; toggle offline; ensure motion ≤150ms; state colors per styleguide.

## Story 5 — Dark-Mode Readability & Contrast Alignment [PO → UX/FE]
- Status: [x] Completed
- Tags: state-UX
- Data Contract Touched: None
- UX States: idle, offline, syncing, success, fail (ensure readable text/badges in all states)
- Scenarios (Given/When/Then):
  - Given the Projects and Project Detail screens, when viewed on mobile in dark mode, then primary text is high contrast and secondary text is clearly distinguishable (no identical contrast everywhere).
  - Given state indicators (syncing/synced/pending/error/offline), when displayed, then their labels and context text meet accessibility contrast and use the styleguide colors.
  - Given interactive elements (buttons, FAB, links), when focused/pressed/disabled, then states are visually distinct and readable under 150ms motion.
- Acceptance Criteria:
  - Align app tokens to STYLEGUIDE: bg `#121212`, surface `#1E1E1E`, primary `#8AB4F8`, text-primary `#E8EAED`, text-secondary `#9AA0A6`, success `#34A853`, warning `#F9AB00`, error `#EA4335`.
  - Update `app/globals.css` to use these tokens and ensure SyncBanner, cards, sidebars, and modals inherit correctly; remove or override mismatched brand color (`#0070f3`).
  - Establish clear typographic hierarchy (Inter 400–700, 8pt scale), ensure body text ≥14px, headings distinct, and line-height improves readability.
  - All text meets ≥4.5:1 contrast ratio in dark mode (WCAG AA). Secondary/muted text remains readable but visually de-emphasized.
  - Motion ≤150ms for hover/focus/entry; no excessive glows; subtle pulse allowed for active/synced only.
- Test Notes:
  - Devices: iOS Safari PWA, Android Chrome, Desktop.
  - Environments: indoors and bright outdoor lighting (quick visual check), system dark/light toggles.
  - Verify: Projects list, Project detail (banner, markers, sidebar, modal), buttons and toasts.

## Success Metrics (Local Tracking)
- Median time to add pin+photo ≤ 5s.
- Crash rate < 1%, photo attach failure < 2%.

---

Guardrails: No backend DB, no auto-sync, manual sync only, ≤4 photos per pin, 1080p cap, last-write-wins, autosave on edit/close.

*** End of Sprint 1 ***
