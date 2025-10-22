# Privacy & Data

- Storage: All data is local or user-owned Google Drive (no server-side DB).
- Scopes (Sprint 2): `openid email profile https://www.googleapis.com/auth/drive`.
- Visibility: Show the target Drive path (`/My Drive/SST/<ProjectName>__<projectId>`) before syncing.

## Local Data
- Stored in IndexedDB (Dexie). Includes projects, floorplans (URIs), pins, photos (data URLs in Sprint 1), and outbox queue.
- Photos limited to 4 per pin and resized to 1080p JPEG to reduce resource usage and improve reliability.

## Tokens
- OAuth tokens are stored locally with least persistence and are cleared on sign-out.

## No PII on Server
- The app does not send data to a server. All data remains on the device or in the user’s Drive.

