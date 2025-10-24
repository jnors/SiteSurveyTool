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

