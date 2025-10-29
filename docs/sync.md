# Manual Sync

Manual sync keeps SST’s offline-first capture model intact while giving crews a clear, predictable path to push data into their Google Drive when connectivity returns.

- **Mode:** Manual only. No background or auto-sync.
- **Entry points:** Sync banner on Projects + Project Detail screens (`Sync Now` button).
- **States:** `syncing` (blue), `synced` (green), `pending` (yellow), `error` (red retry), plus Relink/Re-create badges when Drive folders move or go missing (persist across reloads until resolved).

## End-to-End Sequence

1. **Authenticate (optional):** Sign in with Google (`openid email profile https://www.googleapis.com/auth/drive`). Offline users can continue capturing without signing in; sync waits.
2. **Ensure Drive folders:** `/My Drive/SST/` is created if missing. Project folder must equal `<ProjectName>__<projectId>`. If the cached `driveFolderId` no longer matches, SST surfaces a “Drive folder moved or missing” dialog.
3. **Resolve folder issues:**
   - **Re-create here:** Builds a fresh project folder under `/My Drive/SST/`, clears stale `driveFileId`s, re-queues uploads. Projects show a yellow “Re-create” badge until this completes successfully.
   - **Relink:** Paste a Drive folder link/ID. SST validates ownership, parent, name, and trash status before updating Dexie. Projects show a yellow “Relink” badge until the folder validates. See [Sync QA](./qa-sync.md) for full relink tests.
4. **Upload pipeline:** With a valid `driveFolderId`, SST processes the Outbox:
   - Photos (<=4 per pin, 1080p JPEG) upload first.
   - Floorplan images follow (only if they lack `driveFileId`).
   - Pins/metadata enqueue updates; `project.json` writes last once all assets succeed.
5. **Status update:** `Sync Now` button returns to idle. Success sets project status to `synced`; failures mark `error` with retry guidance.

## Offline Behaviour

- Capture continues with no network calls. Outbox rows persist until a manual sync succeeds.
- If a project detail route was never cached, offline navigation is blocked with “Loads when online” messaging.
- When offline, URL updates for floorplan selection use `history.replaceState` to avoid reloads and queue transitions still log locally.

## Troubleshooting Guide

| Symptom | What it means | Recommended action |
| --- | --- | --- |
| `Sync Now` disabled | User is signed out or offline | Sign in, or reconnect before retrying |
| Relink or Re-create badge persists | Drive folder moved/renamed or deleted | Use the surfaced action (`Relink` or `Re-create here`) and ensure folder lives under `/My Drive/SST/` with the exact `<ProjectName>__<projectId>` name |
| Photos stuck in `pending` | Asset uploads failed | Check connection, ensure folder exists, re-run `Sync Now` |
| Error toast after ensure | Google returned 4xx/5xx | Review toast message (quota, auth, moved folder). Repeat once resolved |
| Outbox empty but status pending | Awaiting Drive ensure | Tap `Sync Now` again once the ensure issue is fixed |

## QA Quick Reference

- Run the full checklist in [`docs/qa-sync.md`](./qa-sync.md) covering online/offline states, relink, retries, and regression.
- Target devices: Android Chrome (PWA + in-tab), iOS Safari PWA, desktop Chrome.
- Measure median time for pin + photo capture (≤5s) during tests and log anomalies.
