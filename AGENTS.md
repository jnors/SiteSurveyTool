# AGENTS.md — Site Survey Tool (SST)

## 0) Context & Non-Negotiables

* **Product**: Mobile-first web app (Next.js PWA) to capture floorplans, pins, notes, photos, work offline, then **manual sync to Google Drive**. No backend DB for MVP (Supabase dropped). 
* **Auth/Storage**: **Google OAuth** (`openid email profile`) + **Drive scope** for user’s *My Drive/SST/* structure. Export = **JSON only**. Photos: **≤4 per pin, 1080p JPEG**. Offline store: **Dexie/IndexedDB**. Sync = **manual**. 
* **Visual identity**: Dark-mode first (Inter font, #121212 bg, #8AB4F8 primary, stateful green=Synced, yellow=Pending, red=Failed), 8-pt grid, subtle glow/pulse feedback. 

> Agents must **not** propose scope that violates the above and must align deliverables to the PRD data model & flows. 

---

## 1) Agent Roster

### Product Owner (PO)

* **Purpose**: Keep work aligned to PRD goals & constraints; break down work into DOR-ready stories; maintain MVP scope.
* **Inputs**: PRD v0.3, Next Steps, metrics. 
* **Outputs**: User stories, acceptance criteria, success metrics, cut/keep calls.
* **Guardrails**: No videos, no PDF export, no collaborative features, no auto-sync, no backend DB (MVP). 
* **Definition of Ready (DOR)**: story has scenario(s), data contract touched (if any), UX states (offline/pending/success/fail), and test notes.

### Frontend Engineer (FE)

* **Purpose**: Implement PWA views, Dexie schemas, photo pipeline (compression to 1080p), sync UI/queue.
* **Inputs**: Data model & export schema; Drive folder structure rules; pin coordinate system (% of intrinsic image). 
* **Outputs**: DX-friendly components, service worker, Dexie tables, Konva/canvas floorplan viewer.
* **Guardrails**: 5s target to add pin+photo; last-write-wins; autosave on edit/close; manual sync entry point. 

### Drive Integration Engineer (GDrive)

* **Purpose**: OAuth + Drive client; SST root detection/creation; upload sequencing; project.json patching.
* **Inputs**: Scopes, query samples, upload sequence. 
* **Outputs**: Idempotent sync; exponential backoff; helpful error surfacing (quota, moved folder, offline).
* **Guardrails**: Respect folder naming `<ProjectName>__<projectId>`; write `project.json` last. 

### UX Designer (Dark-Mode)

* **Purpose**: Field-friendly dark UI; state-driven color usage; motion under 150ms.
* **Inputs**: Tokens/palette, component rules, motion guidance. 
* **Outputs**: Figma frames (mobile-first), token sheet, empty/error/offline states.
* **Guardrails**: Colors communicate state (blue=uploading/active; green/yellow/red for sync states). 

### Docs Writer

* **Purpose**: Minimal onboarding docs; “First sync” guide; FAQ for iOS PWA camera quirks; privacy note.
* **Inputs**: PRD flows + Visual Identity for landing/docs inversion (light palette for docs). 
* **Outputs**: /docs/*.md (Onboarding, Offline, Sync, Export JSON), screenshots.

### QA

* **Purpose**: Test offline capture, retry queue, 1080p cap, 4-photo limit, % coordinate precision, export correctness.
* **Inputs**: Test matrix from PRD metrics & guardrails. 
* **Outputs**: Repro steps, device matrix (iOS Safari PWA, Android Chrome, Desktop), pass/fail per metric.

---

## 2) MCP / Tools & Environment

> Configure in `codex.toml` or your CLI’s MCP section. Keep secrets in local `.env`.

**Core Servers**

* **linear** (optional for backlog): `mcp-remote https://mcp.linear.app/sse` (Bearer env var)
* **github** (optional): for issues/PR links
* **filesystem**: local repo ops
* **shell**: run scripts/tests locally

**ENV (example)**

```
# Google
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
GOOGLE_DRIVE_SCOPE="openid email profile https://www.googleapis.com/auth/drive"

# App
NEXT_PUBLIC_APP_NAME="SST"
NEXT_PUBLIC_MAX_PHOTOS_PER_PIN=4
NEXT_PUBLIC_MAX_PHOTO_RES=1080

# Branding
NEXT_PUBLIC_THEME_BG=#121212
NEXT_PUBLIC_THEME_PRIMARY=#8AB4F8
```

---

## 3) Workflows & Task Routing

* **PO → FE**: Stories touching UI or local data (Dexie)

  * *Route when*: screens, components, service worker, Konva viewer, compression pipeline.
* **PO → GDrive**: Stories touching upload/discovery/export

  * *Route when*: Drive folder ops, `project.json` schema, sync queue/backoff.
* **PO → UX**: Any new state, empty/error/offline screens, visual refinements (dark tokens).
* **FE ↔ GDrive**: Integration contracts (`Outbox` item shape; success/fail states; idempotency markers). 
* **QA**: Always receives ticket once ACs are met; regression on flows 1–7 from PRD (Login, Discover, Create, Add Floorplan, Pins & Notes, Manual Sync, Export JSON). 

**Routing Rules**

* If a change **affects data contract** → tag `data-contract`.
* If a change **adds a new state** (syncing/success/fail/offline) → tag `state-UX`.
* If scope creeps into **non-goals** → “PO CUT” label + rationale. 

---

## 4) Definitions

**Definition of Ready (per story)**

* Problem & user outcome stated (aligns with PRD goal/metric). 
* Data model touched? explicit fields/IDs listed (Project/Floorplan/Pin/Photo/Outbox). 
* UX states specified (idle, offline, syncing, success, fail w/ retry).
* Acceptance Criteria (Given/When/Then) + test notes (devices/browsers).

**Definition of Done**

* Passes AC on **mobile first**; desktop acceptable.
* Adheres to **design tokens** + motion ≤150ms. 
* Respects limits: 4 photos, 1080p, manual sync, last-write-wins, autosave. 
* Export `project.json` validates against schema. 
* Docs updated (user-facing if flow changed).

---

## 5) Data Contracts (MVP)

**Dexie Tables**

```
Project { id, name, createdAt, updatedAt, driveFolderId?, syncedAt? }
Floorplan { id, projectId, name, type, width, height, localUri, driveFileId? }
Pin { id, floorplanId, title, note, xPct, yPct, updatedAt }
Photo { id, pinId, localUri, width, height, sizeBytes, driveFileId?, status }
Outbox { id, kind, entityType, entityId, payload, retries, lastTriedAt }
```

Export JSON (project.json) structure & sequence: see PRD (write last). 

---

## 6) UI/UX Tokens & States (Dark-Mode First)

**Colors**

* bg `#121212`, surface `#1E1E1E`, primary `#8AB4F8`, success `#34A853`, warning `#F9AB00`, error `#EA4335`, text primary `#E8EAED`. 

**States**

* **Uploading/Active**: blue spinner; **Synced**: green ring pulse; **Pending**: yellow; **Failed**: red ring + retry affordance; **Offline** banner. Motion ≤150ms. 

**Layout/Touch**

* 8-pt grid; 44×44 touch targets; 12–16px radii; Inter font. 

---

## 7) Quality Gates & Metrics

Track (locally for now):

* Median time to add pin+photo (≤5s)
* % successful syncs within 24h (≥90%)
* Crash rate (<1%), photo attach failure (<2%). 

QA must include scenarios for:

* Offline capture → queued uploads → manual “Sync now” → success/failure → retry/backoff. 
* 4-photo limit & 1080p compression path. 
* Folder moved/renamed in Drive → re-prompt. 

---

## 8) Security, Privacy, Compliance

* Only request scopes listed; store tokens locally (least persistence); show what is uploaded and where (`/My Drive/SST/<Project>`). 
* No server-side PII; all user-owned Drive.
* Respect offline context; avoid blocking UI for network calls.

---

## 9) Command Snippets (Codex CLI)

**Kick a story (FE)**

```
codex plan "Implement PinModal with 4-photo limit (1080p), autosave on close, state badges (pending/synced/failed)."
```

**Generate Dexie schema (FE)**

```
codex generate "Create Dexie v1 with Project, Floorplan, Pin, Photo, Outbox tables (fields per PRD)."
```

**Drive flow (GDrive)**

```
codex generate "Drive client: ensure SST root, ensure project folder, upload floorplans, pins JSONs, photos; write project.json last; exponential backoff."
```

**Docs**

```
codex write "docs/sync.md: Manual Sync flow with screenshots and troubleshooting."
```

---

## 10) Out-of-Scope Watchlist (auto-flag)

If an ask includes: *video capture, PDF reports, multi-user collaboration, geo-referencing, auto-sync, backend DB*, the agent must **label `scope-creep`** and route to PO for a CUT decision. 

---

# Local Dev Checklist (VS Code / Next.js PWA)

* **Node & deps**

  * Node LTS, pnpm
  * Extensions: ESLint, Prettier, Tailwind CSS IntelliSense, Error Lens, GitLens.
* **Env**

  * Create `.env.local` with **Google OAuth client** + **Drive** scope (values above).
  * Use a Google Cloud test project with OAuth consent in testing mode (add your tester account).
* **Brand tokens**

  * Add theme tokens from Visual Identity to Tailwind config; set dark class/root. 
* **Dexie**

  * Define tables exactly as in PRD; add lightweight migration notes. 
* **Service Worker**

  * Cache shell & images; handle background sync **opt-in** or keep user-driven “Sync now” for MVP. 
* **Photo pipeline**

  * Client-side resize to **max 1080p** (longest edge), JPEG q≈0.75; enforce **max 4 photos** at UI level. 
* **Konva/canvas viewer**

  * Store pins as **% coordinates** of intrinsic image (xPct/yPct). 
* **Drive client**

  * Build the exact upload sequence & folder layout; write/patch `project.json` last. Add retries & clear error toasts. 
* **Dark-mode UX**

  * Use state colors for sync; motion ≤150ms; 44×44 touch; Inter font. 
* **Docs**

  * Minimal landing/docs to onboard MVP (as per Next Steps). 

