# QA Checklist — Manual Sync & Drive Relink

## Environments
- **Desktop Chrome (latest)** — baseline reference
- **Android Chrome** — in-tab and installed PWA (airplane mode toggles)
- **iOS Safari PWA** — Add to Home Screen, offline capture/resume

## Prerequisites
- Seed projects or create a fresh one with ≥1 floorplan, pins, and photos (≤4 per pin, 1080p JPEG limit).
- Google test account with Drive access; SST `/My Drive/SST/` root may already exist.
- Ability to toggle network offline (DevTools, OS airplane mode).

## Test Scenarios
1. **Happy Path Sync**
   - Sign in with Google while online.
   - Add a pin + photo offline (queue should show `pending`).
   - Reconnect, tap `Sync Now`.
   - Expect ensure success, photo upload, and `project.json` write (green state, toast summary).

2. **Offline Capture & Resume**
   - Open project detail online to cache assets, then go offline.
   - Switch floorplans, add pins/photos, close app.
   - Reopen offline: data persists, floorplan selection remembered.
   - Reconnect and sync; confirm queued items upload and status returns to `synced`.

3. **Moved Folder → Relink**
   - In Google Drive, move the project folder outside `/My Drive/SST/` or rename it.
   - Trigger `Sync Now`; ensure dialog lists affected project(s).
   - Use `Relink` button: paste the corrected folder URL after moving it back and renaming.
   - Validation must fail for wrong parent/name, succeed once corrected, and badge clears on next sync.

4. **Re-create Folder Flow**
   - Delete the project folder in Drive.
   - Tap `Re-create here`; expect Dexie to clear `driveFileId`s, queue uploads, and newly created folder receives assets.

5. **Error Handling & Retry**
   - Simulate network failure mid-sync (toggle offline after ensure succeeds); expect red status and retry prompt.
   - Restore network, tap `Sync Now` again; ensure retry advances items, without duplicating Drive uploads.

6. **Quota or Auth Errors**
   - Temporarily revoke Drive scope (Google Cloud console) or exceed quota to surface error toast.
   - Verify message is user-actionable and `Sync Now` remains available for retry.

## Regression Smoke
- Pin + photo capture remains ≤5 seconds end-to-end.
- Photo delete still removes Dexie row and queues delete.
- Landing page CTA states (`Continue with Google`, `Use Offline Now`) behave correctly after sync attempts.
- Docs (`onboarding`, `offline`, `privacy`, `sync`) link paths remain valid after updates.

## Logging
- Capture console logs or screenshots for failures.
- Record outcome per scenario in Linear/JIRA with device + OS + browser build.
