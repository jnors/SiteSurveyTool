# QA Checklist — Story 1: Google OAuth + Token Handling

## Environments
- Desktop Chrome latest (macOS/Windows)
- Android Chrome (PWA install + in-tab)
- iOS Safari PWA (Add to Home Screen)

## Test Scenarios
1. **Initial Sign-in (redirect flow)**
   - Launch `/projects` unauthenticated; verify Sign In card copy + `/My Drive/SST/` disclosure.
   - Tap `Sign in with Google`; ensure consent shows requested scopes exactly and callback returns to `/projects`.
   - Confirm Projects view remains loaded after redirect.

2. **Manual Sync CTA States**
   - Signed out: `Sync Now` button disabled with message “Sign in to sync with Google Drive”.
   - Signed in: button enabled when online.
   - Offline: toggle airplane mode, reload → OfflineBanner visible, `Sync Now` disabled with offline copy.

3. **Sign-out**
   - Tap `Sign out` in NavBar; expect session cleared, CTA returns to sign-in copy without losing project list.

4. **Token Refresh**
   - Shorten `expiresAt` via DevTools (`localStorage.setItem('nextauth.message',…)` or editing cookie) to force refresh.
   - Trigger page navigation; verify silent refresh occurs (network call to `oauth2.googleapis.com/token`) and `Sync Now` remains enabled.
   - Validate error toast/log when refresh returns 400 (temporarily revoke token in Google dashboard).

5. **Session Persistence**
   - Close and reopen PWA; user remains authenticated until explicit sign-out.
   - Expired refresh token (simulate by revoking in Google console) prompts sign-in on next interaction.

6. **Security & Disclosure**
   - Inspect cookies/storage: ensure only NextAuth session cookie present; no refresh token in Dexie.
   - Verify Privacy doc matches runtime behaviour.

## Regression Smoke
- Add pin + photo (≤4 photos, 1080p) still works offline.
- Local outbox queue unaffected when signing in/out.
