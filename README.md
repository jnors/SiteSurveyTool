# README.md — Local Development Setup

## Overview
This document guides developers to set up and run the Site Survey Tool (SST) locally using VS Code and Codex CLI.

### Tech Stack
- **Frontend:** Next.js (PWA), TypeScript, TailwindCSS
- **Local DB:** Dexie (IndexedDB)
- **Auth & Storage:** Google OAuth + Google Drive API
- **Offline-First:** Manual sync; no backend DB

## Setup Steps
1. **Clone the repo**  
   ```bash
   git clone <repo-url>
   cd site-survey-tool
   ```

2. **Install dependencies**  
   ```bash
   pnpm install
   ```

3. **Create `.env.local`**
   ```bash
   GOOGLE_OAUTH_CLIENT_ID=
   GOOGLE_OAUTH_CLIENT_SECRET=
   GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
   GOOGLE_DRIVE_SCOPE="openid email profile https://www.googleapis.com/auth/drive"
   NEXT_PUBLIC_APP_NAME="SST"
   NEXT_PUBLIC_MAX_PHOTOS_PER_PIN=4
   NEXT_PUBLIC_MAX_PHOTO_RES=1080
   NEXT_PUBLIC_THEME_BG=#121212
   NEXT_PUBLIC_THEME_PRIMARY=#8AB4F8
   ```

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Access locally**  
   Visit [http://localhost:3000](http://localhost:3000)

## Codex CLI Integration
- Ensure Codex CLI is installed globally (`pipx install codex-cli` or similar).
- Agents and routing rules are defined in `AGENTS.md`.
- Example commands:
  ```bash
  codex plan "Implement PinModal with 4-photo limit (1080p)"
  codex generate "Drive client upload sequence"
  codex write "docs/sync.md: Manual sync flow"
  ```

## Recommended VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Error Lens
- GitLens

## Testing Targets
- Offline capture → queued uploads → manual sync → success/fail handling
- Max 4 photos per pin (1080p cap)
- Correct folder creation under My Drive/SST/
