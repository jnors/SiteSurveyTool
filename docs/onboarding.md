# Onboarding

- App name: SST (Site Survey Tool)
- Platform: Next.js PWA, offline-first with local Dexie DB
- Auth: Google OAuth (Sprint 2) with manual sign-in/out; data still stored locally first

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

## Manual Sync (Google Sign-in Required)
- The banner at the top shows overall sync state.
- Sign in with Google to enable Drive uploads; the button disables if offline or signed out.
- Click “Sync Now” to process the local queue. Items move pending → syncing → synced or error with retries.
- Retry by tapping “Sync Now” again once issues are resolved.

## Notes
- Manual sync remains user-triggered; Drive integration writes to `/My Drive/SST/<Project>` once signed in.
- Offline mode keeps capture/editing available; sync waits until a connection returns.

