# Offline Usage

SST is built to run completely offline in the field. All data lands in Dexie/IndexedDB first and only syncs to Google Drive when you trigger it.

## Core Flows That Work Offline

- **Browse & capture:** Projects, floorplans, pins, notes, and photos (≤4 per pin) all read/write locally. No network calls are made while offline.
- **Use Offline Now:** From the landing page, choose `Use Offline Now` to skip auth. You can sign in later for sync without losing edits.
- **Floorplan switching:** Once a project detail page is cached, switching between floorplans and reviewing pins works offline (Sprint 4 enhancement).
- **Outbox queueing:** Every create/update/delete operation enqueues to `Outbox`. The queue persists and retries automatically once you tap `Sync Now` online.
- **Warm caches while online:** Open `/projects` when you have connectivity so SST’s Service Worker can pre-cache each listed project and its `/_next/*` assets. After that warmup, you can tap into those project pages offline without 504s or white screens. Projects that haven’t been visited online yet will still require a connection the first time.
- **Photo cleanup feedback:** Deleting a pin photo while offline removes it locally immediately. If Drive can’t be contacted, you’ll see a yellow notice in the Pin panel (“Drive removal will retry on the next sync while online”). The photo slot opens back up so you can attach a replacement without waiting for network access.

## Queueing and Retries

1. Work offline; banners stay yellow (`Pending`) showing items waiting to sync.
2. When back online, sign in with Google and hit `Sync Now`.
3. SST revalidates the Drive folder (`ensure`) before uploading photos, floorplans, and finally `project.json`.
4. Failures surface as red (`Failed`) with guidance—tap `Sync Now` again after resolving Drive or connectivity issues.

## Assets & Caching

- Open critical projects while online to let the Service Worker cache the shell and floorplan images.
- If you load a new project offline that hasn’t been cached, SST blocks navigation and shows “Loads when online” so you’re not stuck on a spinner.
- Photos stay in Dexie as base64 data URLs until uploaded; storage is client-owned.

## When You Need Network

- Google OAuth (sign-in/out).
- Google Drive ensure/relink operations and uploads.
- Writing or patching `project.json`.

## Troubleshooting

- **Offline but Google button active:** ensure system connection toggle is truly off; the app follows `navigator.onLine`.
- **Missing floorplan image:** look for the “Loads when online” placeholder, reconnect, open the project, then go back offline.
- **Relink badge won’t clear:** The Drive folder likely moved. Use the Relink dialog (Projects > “Relink”) while online to point SST at the correct `/My Drive/SST/<ProjectName>__<projectId>` folder.
- **Photo delete warning persists after reconnecting:** Trigger `Sync Now` once you’re online. The queued Drive delete will run and the warning clears automatically after a successful retry.

See [Onboarding](./onboarding.md) for the full capture flow and [Privacy](./privacy.md) for Drive scope details.
