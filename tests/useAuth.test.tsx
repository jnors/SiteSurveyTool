// This test file is obsolete - it tests next-auth integration which is no longer used.
// The app now uses Supabase for authentication.
// See tests/hooks/useAuth.test.ts for the current useAuth hook tests.

import { describe, it } from 'vitest'

describe('useAuth (legacy next-auth tests)', () => {
  it.skip('obsolete - app now uses Supabase auth', () => {
    // These tests are skipped because the app migrated from next-auth to Supabase
  })
})
