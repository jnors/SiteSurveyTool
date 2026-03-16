# FieldPins

> A mobile-first PWA for capturing floorplans, dropping pins, attaching photos and notes — offline-first, synced manually to your own Google Drive.

No backend database. No server costs. Your data lives in your Google Drive.

---

## Features

- 📐 **Floorplan viewer** — upload any image as a floorplan; pins stored as % coordinates so they scale perfectly
- 📍 **Pins & notes** — tap to place a pin, add a title, free-text note, and up to 4 photos (auto-resized to 1080p)
- ✈️ **Offline-first** — capture everything in the field with no connection; Dexie/IndexedDB stores everything locally
- ☁️ **Manual sync to Google Drive** — one tap pushes projects to `My Drive/FieldPins/<ProjectName>/`; you own the data
- 🔒 **Google OAuth only** — no passwords, no backend DB, no third-party storage

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (PWA) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Local DB | Dexie (IndexedDB) |
| Auth & Storage | Google OAuth 2.0 + Google Drive API |

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/<your-handle>/fieldpins.git
cd fieldpins
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Google OAuth credentials (see comments inside for setup steps).

> **Google Cloud setup (one-time)**
> 1. Go to [console.cloud.google.com](https://console.cloud.google.com/) → create a project.
> 2. Enable **Google Drive API**.
> 3. Create an **OAuth 2.0 Client ID** (Web application).
> 4. Add `http://localhost:3000/api/auth/callback/google` as an authorised redirect URI.
> 5. Add your Google account as a test user while the OAuth consent is in Testing mode.

### 4. Run

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Export Format

Synced projects produce a `project.json` in your Drive folder alongside floorplan images and photos. The schema is documented in [`docs/export-json.md`](docs/export-json.md).

---

## Documentation

| Doc | Description |
|---|---|
| [`docs/onboarding.md`](docs/onboarding.md) | First-run walkthrough |
| [`docs/offline.md`](docs/offline.md) | How offline capture works |
| [`docs/sync.md`](docs/sync.md) | Manual sync flow |
| [`docs/export-json.md`](docs/export-json.md) | `project.json` schema |
| [`docs/faq-ios-pwa-camera.md`](docs/faq-ios-pwa-camera.md) | iOS PWA camera quirks |
| [`docs/privacy.md`](docs/privacy.md) | Privacy & data notes |

---

## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Follow the setup steps above.
3. Run tests: `pnpm test`
4. Open a pull request — describe what you changed and why.

Bug reports and feature requests are welcome via [GitHub Issues](../../issues).

---

## License

[MIT](LICENSE) — see `LICENSE` for details.
