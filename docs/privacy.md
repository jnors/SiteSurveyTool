# Privacy & Data

SST keeps survey data either on the device or in your own Google Drive—there is no shared backend database.

## Local-First Storage

- Projects, floorplans, pins, notes, photos, and outbox entries live in Dexie/IndexedDB until you choose to sync.
- Photos are resized on-device to max 1080p (up to four per pin) to minimize upload size and protect bandwidth.
- Deletions propagate by removing Dexie rows and queuing Drive deletes for the next manual sync.

## Google Drive Access

- OAuth scopes: `openid email profile https://www.googleapis.com/auth/drive`.
- SST creates `/My Drive/SST/<ProjectName>__<projectId>` for each project. That path is displayed before uploads start.
- Drive ensure/relink/recreate happens client-side with your token; no SST server persists Drive IDs.
- `project.json` writes last to guarantee floorplans, pins, and photos are uploaded first.

## Session Handling

- NextAuth (JWT strategy) stores access tokens in encrypted cookies; refresh tokens remain client-side.
- Signing out clears tokens immediately. Remaining offline keeps all edits local until you initiate sync.
- If authentication fails, the app simply defers sync—captures remain available offline.

## No Server-Side PII

- API routes proxy requests directly to Google; they do not store payloads or metadata.
- Manual sync is the only upload trigger. There is no background or auto-sync service.

See [Offline](./offline.md) for capture behaviour and [Onboarding](./onboarding.md) to walk through the first sync.
