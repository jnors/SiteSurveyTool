# Landing Page Content Plan — Story 1 (Sprint 4)

Source alignment: project/SaaS_Landing_Page_Codex_Instructions.md and AGENTS.md (FieldPins PRD constraints).

Primary CTA: Continue with Google
Secondary CTA: Learn how offline works (docs link)

Notes
- Dark‑mode first. Motion ≤150ms. 8‑pt grid. Inter font.
- No videos, no auto‑sync, no backend DB, JSON export only.
- End goal: Sign‑in required. Offline capture is available after initial Google sign‑in. `/projects` is gated behind auth.

## Information Architecture & Scope

1) Nav — In scope (Story 1)
- Links: Product, Docs, Privacy
- Right side: Sign in, Primary CTA (Continue with Google)

2) Hero — In scope (Story 1)
- Eyebrow: Field‑friendly, offline‑first PWA
- H1 (≤9 words): Capture site surveys offline
- Subhead (≤18 words): Sign in to capture online or offline. Sync later to your Google Drive.
- Primary CTA: Continue with Google (scope disclosure)
- Secondary CTA: Learn how offline works (routes to `/docs/offline` or section anchor)
- Media: Static image/illustration (no video), ≤180KB

3) Trust Bar — Optional placeholder (Backlog)
- Placeholder for future logos. Omit for Story 1 if none approved.

4) Problem → Value — In scope (Story 1)
- Before (≤12 words each)
  - Lose context when offline; notes split across apps
  - Paper plans get messy and misplaced
  - Photos scatter across devices and chats
- After (≤12 words each)
  - Capture pins, notes, photos online or offline
  - One‑tap manual sync to your Google Drive
  - Export JSON; keep data portable

5) Key Features — In scope (Story 1)
- Online and offline capture (after sign‑in): Projects, floorplans, pins, notes, photos
- Manual sync: Idempotent uploads, clear states (Pending/Synced/Failed)
- Google Drive ownership: `/My Drive/FieldPins/<Project>` structure
- Photos pipeline: ≤4 photos per pin, 1080p JPEG
- Precision pins: % coordinates based on intrinsic image
- Dark‑mode mobile UI: Field‑friendly, fast, accessible

6) Social Proof — Backlog
- Testimonials/metrics held until available. Leave space for future.

7) Integrations — Cut (PO CUT for MVP)
- Only Google Drive is supported (explicit). Avoid broader “integrations”.

8) How It Works — In scope (Story 1)
1. Sign in with Google (one‑time setup)
2. Capture online or offline in the field
3. Tap Sync to upload to your Google Drive
4. Share JSON and photos from your Drive

9) Interactive Proof — Cut (PO CUT)
- No live sandbox or videos per constraints.

10) Pricing — Defer / Placeholder only
- Copy note: “MVP preview — no subscription. Your data lives in your Drive.” (Confirm with PO.)

11) Comparison — Backlog
- Template available; not needed for Story 1.

12) Security & Privacy — In scope (Story 1)
- Scopes: `openid email profile` + Drive
- Storage: Dexie/IndexedDB offline; uploads to user’s Drive only
- No server‑side PII; tokens stored locally
- Transparency: Show exactly what syncs and where

13) FAQ — In scope (Story 1)
- Do I need a new account?
  - No. Continue with Google; we only request basic profile and Drive access.
- Does it work offline?
  - Yes. Capture everything offline; sync later when online.
- Where is my data stored?
  - In your Google Drive under `/My Drive/FieldPins/<Project>`.
- Is there auto‑sync?
  - No. Manual sync only for MVP.
- How many photos per pin?
  - Up to 4 photos; resized to 1080p JPEG.
- What file format is the export?
  - JSON (`project.json`) written last during sync.

14) Final CTA — In scope (Story 1)
- Continue with Google (primary)
- Learn how offline works (secondary)

15) Footer — In scope (Story 1)
- Links: Docs, Privacy, FAQ
- Contact: mailto placeholder

## Copy Drafts (Editable)

### Hero
- Eyebrow: Offline‑first site surveys
- H1: Capture site surveys offline
- Subhead: Sign in to capture online or offline. Sync later to your Google Drive.
- Primary CTA label: Continue with Google
- Primary CTA note: Sign‑in required. We request basic profile and Drive access.
- Secondary CTA label: Learn how offline works
- Secondary CTA note: Read the short guide to offline capture.

### Problem → Value
- Before
  - Lose context when offline; notes split across apps
  - Paper plans get messy and misplaced
  - Photos scatter across devices and chats
- After
  - Capture pins, notes, photos online or offline
  - One‑tap manual sync to your Google Drive
  - Export JSON; keep data portable

### Features (Benefit‑led)
- Online + offline capture — Keep working with or without signal (after sign‑in)
- Manual sync — You control what and when to upload
- Google Drive ownership — Your content never leaves your account
- Photo pipeline — 4 photos per pin, 1080p JPEG for speed
- Precision pins — Percent‑based coordinates for reliable re‑rendering
- Field‑ready UI — Dark‑mode, fast, accessible on mobile

### How It Works
1) Sign in with Google and create a project
2) Drop pins and attach notes/photos — online or offline
3) Tap Sync to Google Drive; export JSON written last

### Security & Privacy
- Scopes requested: `openid email profile` and Drive
- Storage model: Offline data in IndexedDB; sync uploads to `/My Drive/FieldPins/`
- No server database; tokens stored locally; no server‑side PII
- Clear surfacing of what’s uploaded and where

### FAQ (≤80 words each)
Q: Do I need a new account?
A: Sign‑in with Google is required. We request basic profile and Drive permissions to create an `/FieldPins/` folder in your My Drive for sync.

Q: Can I start offline before sign‑in?
A: No. First sign‑in requires connectivity. After you sign in once, you can capture online or offline.

Q: Does it work offline?
A: Yes, after initial sign‑in. The app works offline for capture. Add floorplans, pins, notes, and photos. When back online, trigger manual sync.

Q: Where is my data stored?
A: On your device while offline (IndexedDB). When you sync, files write to your Google Drive under `/My Drive/FieldPins/<ProjectName>__<projectId>/`.

Q: Is there auto‑sync?
A: No. Sync is manual in MVP so you stay in control in the field. Retries and backoff handle transient errors.

Q: How many photos per pin and what size?
A: Up to four photos per pin. Photos are resized client‑side to max 1080p JPEG (~q0.75) for speed and storage efficiency.

Q: What formats are exported?
A: A JSON file (`project.json`) that describes your project, floorplans, pins, and photos. It’s written last in the upload sequence for consistency.

## Content Seed (for future `content/landing.json`)

\`\`\`json
{
  "hero": {
    "eyebrow": "Offline‑first site surveys",
    "headline": "Capture site surveys offline",
    "subheadline": "Sign in to capture online or offline. Sync later to your Google Drive.",
    "primaryCta": { "label": "Continue with Google", "href": "/signin", "onClickEventName": "cta_click_hero_primary" },
    "secondaryCta": { "label": "Learn how offline works", "href": "/docs/offline", "onClickEventName": "cta_click_hero_secondary" },
    "media": { "type": "image", "src": "/img/hero-FieldPins.webp", "alt": "FieldPins mobile UI" }
  },
  "features": [
    { "id": "offline", "title": "Offline capture", "benefit": "Keep working with zero signal" },
    { "id": "sync", "title": "Manual sync", "benefit": "You control what and when to upload" },
    { "id": "drive", "title": "Google Drive ownership", "benefit": "Your content stays in your account" },
    { "id": "photos", "title": "4 photos per pin", "benefit": "1080p JPEG for speed and clarity" },
    { "id": "pins", "title": "Precision pins", "benefit": "Percent‑based coordinates render consistently" }
  ],
  "faq": [
    { "q": "Do I need a new account?", "a": "Sign‑in with Google is required. We request basic profile and Drive to create an /FieldPins/ folder in your My Drive for sync." },
    { "q": "Can I start offline before sign‑in?", "a": "No. First sign‑in requires connectivity. After you sign in once, you can capture online or offline." },
    { "q": "Where is my data stored?", "a": "In your Google Drive under /My Drive/FieldPins/<Project>." }
  ]
}
\`\`\`

## Analytics Events (to wire later)
- cta_click: { location: hero|final, variant: primary|secondary, label: continue_with_google|learn_offline }
- offline_banner_seen: { location: hero }
- tooltip_opened: { id: google_cta_offline_gated }

## SEO & JSON‑LD (copy only; no code)
- Title: Offline Site Surveys | FieldPins
- Meta description: Capture floorplans, pins, notes, and photos offline. Sync later to your Google Drive.
- Schema: SoftwareApplication (Web), Organization, FAQPage (when FAQ present)

## Accessibility & Performance Notes
- LCP target ≤ 1.8s (H1 or hero image). Hero image ≤ 180KB.
- Buttons ≥ 44×44 touch targets; visible focus. Contrast ≥ 4.5:1.
- Disable Google CTA when offline; provide aria‑describedby tooltip text.

## Story 1 — Suggested Additions (for PO review)
- Gate `/projects` behind auth; redirect unauthenticated users to `Sign in`.
- Scope disclosure under Google CTA: “Requests basic profile + Drive to write `/My Drive/FieldPins/`.”
- Offline banner copy: “You’re offline. Sign‑in required to capture. Try again when online.”
- Final CTA repeats “Continue with Google” and “Learn how offline works”.
- Analytics: Track hero and final CTA clicks; track offline banner visibility; track offline‑gated tooltip.
- QA note: Verify disabled state of Google CTA with tooltip in offline mode (unauthenticated) on iOS Safari PWA and Android Chrome.

## Implementation Plan (follow‑up PR; no code in this step)
- Compose `app/page.tsx` with Hero, Problem→Value, FeatureGrid, HowItWorks, Security, FAQ, FinalCta, Footer.
- Reuse existing `SignInCard` for Google CTA; remove unauthenticated access to `/projects`.
- Add tooltip and disabled state for Google CTA when offline (unauthenticated).
- Content source: create `content/landing.json` from the seed above.
- Ensure SW caches page shell and assets; verify offline banner and CTA states.
