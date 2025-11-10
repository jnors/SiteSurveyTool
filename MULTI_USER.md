# Multiple Users in FieldPins — MVP-Compliant Approaches

This doc clarifies what “multiple users” means for FieldPins today, the gap you’re noticing, and practical options to address it without violating MVP constraints (no backend DB, manual sync, Google Drive as the source of truth).

## Scope Clarification

- Supported now: Multiple independent users, each signing in with their own Google account. The app writes only to that user’s My Drive under `/My Drive/FieldPins/<ProjectName>__<projectId>`.
- Not in MVP: Real-time or shared editing (“collaboration”) on the same project across users. That is out-of-scope; label requests as `scope-creep` for a PO CUT decision.

## Current Behavior (as implemented)

- Auth: NextAuth Google OAuth with Drive scope. Writes to the signed-in user’s Drive.
  - Code: `app/api/auth/[...nextauth]/route.ts`, `lib/auth.ts` (Google provider setup)
- Local-first data: IndexedDB via Dexie named `FieldPins_db`.
  - Code: `lib/db.ts` (constructor uses `super('FieldPins_db')`)
- Sync: Manual, last-write-wins, Drive folder ensure + uploads + write `project.json` last.
  - Code: `lib/google.ts`, `lib/sync.ts`, `lib/hooks/use-projects.ts`

### The Gap You Noticed

On a shared device, if User A signs in, creates offline data, signs out, and User B signs in using the same browser profile, all local data persists in the same Dexie DB (`FieldPins_db`). This can cause cross-account bleed of local drafts. Cloud sync still goes to the currently signed-in user’s Drive, but local separation is not enforced.

## Options to Handle “Multiple Users” Safely (No Collaboration)

Both options stay within MVP constraints. Choose one based on effort vs. safety.

### Option B — Wipe Local DB on Sign Out (lowest effort)

- What: When a user signs out, delete the local Dexie database and clear cached session. Prevents any carry-over to the next user on the same device.
- Pros: Minimal code change; no schema changes; no runtime DB re-init complexity.
- Cons: The previous user’s offline drafts are lost on sign out (expected/acceptable on shared devices).

Implementation notes:

1) Clear Dexie and caches on sign out
   - Where: `lib/useAuth.ts` in `handleSignOut`
   - Add before calling `signOut(...)`:
     - `await db.delete()` (and close DB instances, if needed)
     - Clear any SW caches you own (optional, if you cache user data)
     - Existing code already clears the cached session key `FieldPins:last-session`

2) QA acceptance
   - Given User A creates offline pins/photos, when A signs out, then local data is removed and not visible to User B after B signs in.
   - Given A syncs to Drive, then signs out, B signs in, B sees only B’s projects (fresh local store) and syncs to B’s Drive.

### Option A — User‑Scoped Dexie DB (more robust)

- What: Use a unique DB name per Google account (stable `sub`), e.g. `FieldPins_db_<sub>`. Instantiate after sign-in and switch on account changes.
- Pros: Preserves each user’s offline drafts across sessions on shared devices; prevents cross-user bleed.
- Cons: Requires a small refactor to avoid a global DB singleton; add an identity to the session.

Implementation steps:

1) Expose a stable user identifier to the client
   - Use Google’s `sub` from the JWT and include it in the session.
   - Where: `lib/auth.ts` in `session` callback; add `session.userId = token.sub as string | undefined`.
   - Types: extend `Session` in `types/next-auth.d.ts` with `userId?: string`.

2) Scope Dexie per user
   - Refactor `lib/db.ts` from a process‑wide singleton to a user‑scoped instance.
   - Example approach:
     - Export a small factory `createDB(name: string)` that constructs `new Dexie(name)` and sets up tables.
     - Hold a current `db` reference in a module or provider, initialized after sign-in with `name = "FieldPins_db_" + session.userId`.
     - On account switch or sign out, close/delete the old DB and re‑initialize (or null it when unauthenticated).

3) Wire up after sign-in
   - Where: an app-level provider (`app/providers.tsx`) or auth hook (`lib/useAuth.ts`). Once `userId` is available and authenticated, initialize the per‑user DB.
   - Guard UI against DB being uninitialized during the brief switch.

4) QA acceptance
   - Sign in as User A → only A’s local projects; reload app; still only A’s projects.
   - Sign out; sign in as User B → only B’s local projects.
   - Switch back to A → A’s local data still present; no cross-account bleed.

## Out-of-Scope: Collaboration

- Sharing or co-editing the same project across users is out of MVP and should be labeled `scope-creep` for PO CUT.
- If considered later, a safe progression:
  1) Import from a shared Drive folder (read-only).
  2) Drive-only optimistic updates with ETag/generation checks and manual conflict resolution.
  3) Add a backend for real-time collaboration (post-MVP).

## Rollout Recommendation

- Immediate: Implement Option B (wipe DB on sign out) to remove shared-device bleed risk with minimal change.
- Next sprint (if needed): Implement Option A (user-scoped DB) to preserve per-user offline state across sessions on shared devices.

## Test Matrix (QA)

- Two Google accounts on one device/browser:
  - Create offline data as A → sign out → sign in as B → verify separation based on chosen option.
  - Ensure sync writes to the correct Drive path for each account (`/My Drive/FieldPins/<ProjectName>__<projectId>`).
- Offline-first:
  - Capture pins/photos while offline pre-sign-in → sign in as a user → confirm uploads target that user’s Drive only.
- Regressions:
  - 4-photo limit enforced; 1080p JPEG compression; manual sync; `project.json` written last.

## Routing & Labels

- PO → FE: Implement Option B or Option A (tag `state-UX` if adding sign-out confirmations; tag `data-contract` only if you touch export schema — not needed here).
- QA: Validate shared-device and offline cases above.
- Any collaboration ask: label `scope-creep` and route to PO for CUT.
