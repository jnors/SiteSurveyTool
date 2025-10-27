# User Stories — Sprint 4 (Landing + Docs)

Scope: Add a mobile-first Landing page that highlights offline-first usage before sign-in. Refresh docs to emphasize offline-first, first sync, and privacy. Keep all MVP guardrails: Google OAuth only, manual sync, no backend DB, no auto-sync, JSON export, Drive as source of truth.

---

## Story 1 — Landing Page (Offline-First, Google CTA)
- Status: [ ] Pending
- Tags: state-UX
- Data Contract Touched: none
- UX States: online/unauthenticated, offline/unauthenticated, authenticated
- Scenarios (Given/When/Then):
  - Given unauthenticated and online, when I visit `/`, then I see a hero, brief value props, and a primary CTA “Continue with Google,” plus a secondary “Use Offline Now” link that routes to `/projects` without auth.
  - Given unauthenticated and offline, when I visit `/`, then I see an offline banner; the Google CTA is disabled with an explanatory tooltip; “Use Offline Now” remains enabled.
  - Given authenticated, when I visit `/`, then I’m redirected to `/projects` automatically.
- Acceptance Criteria:
  - Landing reuses `SignInCard` for Google CTA and scope disclosure; adds “Use Offline Now” and highlights offline capture/sync-later benefits.
  - Clear copy: “No account to create — continue with Google. Offline works without sign-in; sync later to your Drive.”
  - Motion ≤150ms, dark-mode tokens, 8-pt grid, Inter font.
  - Page shell and brand assets are cached by the SW for quick repeat loads.
- Test Notes:
  - iOS Safari PWA and Android Chrome: verify offline-unauth flow, CTA disabled state, and navigation to `/projects` works offline.
  - Lighthouse PWA: page cached; no blocking network calls in offline state.

## Story 2 — Offline Floorplan Switching (Client-Only)
- Status: [ ] Pending
- Tags: state-UX, data-contract
- Data Contract Touched: none (uses existing Dexie tables)
- UX States: online, offline, switching-disabled
- Problem: In Sprint 3, switching between floorplans while offline is not supported and can cause navigation bounce. Users need to review different floorplans and their pins offline within a project without network calls.
- Scenarios (Given/When/Then):
  - Given I am viewing a project with multiple floorplans and I am offline, when I tap another floorplan chip, then the main canvas updates to that floorplan and the pin list updates accordingly, without network requests or route reloads.
  - Given I switch floorplans offline, then the selection persists locally for this project and is restored on reload; when back online, the URL’s `fp` query reflects the active floorplan without forcing a full navigation.
  - Given a project route was never opened online (assets not cached), when offline, then navigation to that project is blocked with an explanatory banner; already-opened projects remain navigable offline.
  - Given I am offline and a floorplan image asset is not available locally, then a placeholder is shown with “Loads when online” copy; no spinner hang.
- Approach (client-only):
  - Selection: keep `activeFloorplanId` in memory + Dexie; when offline, apply `history.replaceState` to update `fp` without triggering navigation; when online, router updates can resume.
  - Data: read pins/photos strictly from Dexie scoped by `activeFloorplanId`; avoid any server/data dependencies coupled to searchParams.
  - Caching (P2 dependency): pre-cache detail route shell and assets in SW; not a hard blocker for this story but recommended.
- Acceptance Criteria:
  - Offline floorplan switching updates canvas + pins within ≤150ms; no page bounce; no network calls while offline.
  - Selection persists across reloads offline and reconciles to URL `fp` when back online.
  - If route not cached, prevent offline navigation and present a clear message; current project remains usable.
  - Dark-mode tokens, 8‑pt grid, Inter, state feedback as per AGENTS.md.
- Test Notes:
  - Unit: selection hook persists to Dexie; offline URL updates use `history.replaceState`.
  - Component: chips reflect active state via `aria-pressed`; pins/canvas reflect the selected floorplan.
  - Device: iOS Safari PWA + Android Chrome — switch floorplans offline repeatedly; verify no bounce and zero network.

## Story 4 — Docs & Links Refresh
- Status: [ ] Pending
- Tags: docs
- Data Contract Touched: none
- Scenarios:
  - Given Landing, when users look for clarity, then docs provide concise guidance for: Offline-first, First Sync, and Privacy.
- Acceptance Criteria:
  - Update `/docs/onboarding.md` with landing screenshots and “Use Offline Now.”
  - Update `/docs/offline.md` to emphasize full offline capture without sign-in; sync later with Google.
  - Update `/docs/privacy.md` to restate Drive-only storage and requested scopes.
  - Remove any Billing/Stripe references from docs for MVP.
- Test Notes:
  - Mobile readability, dark/light inversion for docs as needed.

---

## Notes on Constraints & Phasing (Aligns with AGENTS.md)
- Auth/Storage: Google OAuth (openid email profile) + Drive scope; Manual sync; No backend DB.
- Visual identity: Dark-mode first, Inter, tokens in styleguide; motion ≤150ms; state colors.
- Offline-first: Fully available without sign-in. Landing must showcase this.

## Risks & Mitigations
- Users expect “sign up” with email/password → clear copy: Google-only, no extra account to create.
- Confusion about offline availability → “Use Offline Now” prominent on landing; disable Google CTA while offline with a clear reason.

## QA Matrix
- Landing: online/unauth → Google CTA works; offline/unauth → CTA disabled, Offline banner shown; authenticated → redirect to `/projects`.
- Docs: links open; on mobile they’re readable and quick.

## Labels & Routing
- PO → UX/FE: Story 1 (Landing), Story 4 (Docs).
- Tags: `state-UX`, `docs`.
