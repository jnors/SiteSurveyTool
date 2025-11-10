# User Stories — Post MVP (Settings + Billing)

Scope: Collect stories that require features beyond MVP constraints or are intentionally deferred. These include a Settings screen and any Billing/Stripe topics. Implement only after MVP ships and a PO CUT approves scope.

---

## Story — Settings Screen (Account & Device)
- Status: [ ] Backlog
- Tags: state-UX
- Data Contract Touched: none (Dexie operations only)
- UX States: idle, confirm destructive action
- Scenarios (Given/When/Then):
  - Given a user, when I open Settings from the NavBar/menu, then I see sections: Account (Google profile + Sign out), Storage & Sync, Privacy & Docs, Advanced.
  - Given “Advanced,” when I choose “Delete Local Data,” then a confirmation explains local-only deletion and upon confirm Dexie is wiped and the app reloads to a clean state (protects shared devices).
  - Given Storage & Sync, I can view Drive root disclosure (`/My Drive/FieldPins/`) and access “Re-create project folder” links (routes to existing flows where applicable).
- Acceptance Criteria:
  - Settings accessible from all primary screens.
  - “Delete Local Data” wipes Dexie and app caches we own (if applicable) with a single confirm; does not touch Google Drive.
  - Links to Privacy, Offline, Sync docs are present.
  - No backend. No new scopes. No feature gating.
- Test Notes:
  - Verify Dexie wiped on destructive action; app returns to seeded state.
  - Confirm sign-out still works and Settings reflects unauthenticated state.

## Story — Billing Entry (Stripe Placeholder)
- Status: [ ] Backlog
- Tags: scope-creep, state-UX
- Data Contract Touched: none
- UX States: idle
- Scenarios (Given/When/Then):
  - Given Settings, when I view Billing, then I see plan status “Free” and an external “Upgrade” link that opens a Stripe Payment Link or docs page (no entitlements/gating in app).
  - Given offline, when I view Billing, then the external link indicates it requires connectivity.
- Acceptance Criteria:
  - No server-side Stripe integration, no webhooks, no entitlements persisted. Pure external link and explanatory copy.
  - Any future “account tiers” beyond a link require a PO CUT (backend/server needed). Label as `scope-creep` if requested.
- Test Notes:
  - Link opens externally; no impact on app functionality.

---

## Labels & Routing
- PO → UX/FE: Settings (state-UX)
- PO → CUT (scope-creep): Any Billing/Stripe work beyond a simple external link
- Tags: `state-UX`, `scope-creep`
