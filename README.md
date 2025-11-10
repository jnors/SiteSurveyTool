# README.md — Local Development Setup

## Overview
This document guides developers to set up and run the Site Survey Tool (FieldPins) locally using VS Code and Codex CLI.

Note on Sprint 1: Manual sync is local-only (no Google OAuth/Drive yet). OAuth + Drive integration lands in Sprint 2. Offline capture and local queueing are fully functional.

### Tech Stack
- **Frontend:** Next.js (PWA), TypeScript, TailwindCSS
- **Local DB:** Dexie (IndexedDB)
- **Auth & Storage:** Google OAuth + Google Drive API
- **Offline-First:** Manual sync; no backend DB

## Setup Steps
1. **Clone the repo**  
   \`\`\`bash
   git clone <repo-url>
   cd site-survey-tool
   \`\`\`

2. **Install dependencies**  
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Create `.env.local`**
   \`\`\`bash
   GOOGLE_OAUTH_CLIENT_ID=
   GOOGLE_OAUTH_CLIENT_SECRET=
   GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
GOOGLE_DRIVE_SCOPE="openid email profile https://www.googleapis.com/auth/drive"
NEXT_PUBLIC_APP_NAME="FieldPins"
NEXT_PUBLIC_MAX_PHOTOS_PER_PIN=4
NEXT_PUBLIC_MAX_PHOTO_RES=1080
# Optional: enable demo-only sync normalization (flags unsynced photos as synced for presentations)
# NEXT_PUBLIC_DEMO_SYNC=1
# Theme keys not currently read by the app; styling uses tokens in app/globals.css
# NEXT_PUBLIC_THEME_BG=#121212
# NEXT_PUBLIC_THEME_PRIMARY=#8AB4F8
\`\`\`

4. **Run the development server**
   \`\`\`bash
   pnpm dev
   \`\`\`

5. **Access locally**  
   Visit [http://localhost:3000](http://localhost:3000)

## Documentation
- Full index: `docs/README.md`
- Onboarding: `docs/onboarding.md`
- Offline usage: `docs/offline.md`
- Manual Sync (Sprint 1 local stub): `docs/sync.md`
- Export JSON (Sprint 2 target): `docs/export-json.md`
- iOS PWA Camera FAQ: `docs/faq-ios-pwa-camera.md`
- Privacy & Data: `docs/privacy.md`

## Codex CLI Integration
- Ensure Codex CLI is installed globally (`pipx install codex-cli` or similar).
- Agents and routing rules are defined in `AGENTS.md`.
- Example commands:
  \`\`\`bash
  codex plan "Implement PinModal with 4-photo limit (1080p)"
  codex generate "Drive client upload sequence"
  codex write "docs/sync.md: Manual sync flow"
  \`\`\`

## Recommended VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Error Lens
- GitLens

## Testing Targets
- Offline capture → queued uploads → manual sync → success/fail handling (see `docs/offline.md` and `docs/sync.md`)
- Max 4 photos per pin (1080p cap)
- Correct folder creation under My Drive/FieldPins/ (Sprint 2)
