# Manual Sync

- Mode: Manual only in Sprint 1 (no network calls; local simulation)
- Entry point: Sync banner at the top of Projects and Project Detail screens

## How It Works (Sprint 1)
- Outbox collects changes:
  - New pins enqueue `create_pin`
  - Added photos enqueue `upload_photo`
- Tap “Sync Now” to process the queue locally:
  - Items transition pending → syncing → synced or error
  - Failed items keep their Outbox row and increment `retries`
- Tap “Sync Now” again to retry failed items

## Status Colors
- Syncing: blue
- Synced: green
- Pending: yellow
- Error: red (retry available)

## Troubleshooting
- Error persists after retries: leave items as-is for now; Sprint 2 will introduce real uploads with detailed errors.
- Nothing happens on “Sync Now”: ensure there are pending items (new pins/photos).

## Sprint 2 (Preview)
- Google OAuth (openid, email, profile, Drive scope)
- Ensure `/My Drive/SST/` root and `<ProjectName>__<projectId>` project folder
- Upload photos first, then write project.json last
- Exponential backoff and error surfacing (quota, moved folder, offline)

