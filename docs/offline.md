# Offline Usage

- Local storage: Dexie (IndexedDB)
- Network: Manual sync only in Sprint 1 (stubbed)

## What Works Offline
- Creating and editing projects, pins, and notes (seeded data persists locally).
- Adding photos to pins (compressed to 1080p, stored locally).
- Sync queueing (Outbox) persists offline until you trigger “Sync Now”.

## What Requires Network (Sprint 2)
- Google OAuth sign-in
- Google Drive folder discovery and uploads
- Writing project.json to Drive

## Tips
- Allow camera permissions to capture photos.
- If assets fail to load the first time, revisit screens once online; shell/image caching is planned for later.
- If the banner shows “Error”, tap “Sync Now” again to retry.

