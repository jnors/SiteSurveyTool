# Onboarding

- App name: SST (Site Survey Tool)
- Platform: Next.js PWA, offline-first with local Dexie DB
- Auth: Google OAuth planned (Sprint 2); Sprint 1 uses local data only

## Prerequisites
- Browser: Chrome (Android), Safari (iOS), or modern desktop browser
- Enable camera access for photo capture

## First Run
- Open the app (development: http://localhost:3000)
- Projects page loads from local Dexie. On first run, seed data is created.
- Tap a project card to open details.

## Add a Pin
- Tap the floating “Add Pin” button on the Project Detail screen.
- Tap anywhere on the floorplan to place the pin (stored as % coordinates).
- The Pin dialog opens; enter title and notes.
- Save Pin. The pin persists locally (Dexie) and appears on the floorplan.

## Attach Photos (4 max, 1080p)
- Open a pin in the Project Detail page.
- In the Pin dialog, click “Attach Photos”.
- Select up to 4 images. They are resized to a maximum 1080px longest edge (JPEG q≈0.75) and saved locally.
- Tap a thumbnail to preview it larger; resolution details are shown.

## Manual Sync (Local Stub in Sprint 1)
- The banner at the top shows overall sync state.
- Click “Sync Now” to process the local queue (no network in Sprint 1). Items move pending → syncing → synced or error.
- Retry by tapping “Sync Now” again.

## Notes
- Sprint 1 does not include Google OAuth or Drive uploads.
- Service worker and shell/image caching are not yet implemented; offline capture works via Dexie.

