'use client'

import { useCallback } from 'react'
import { useSupabase } from '@/components/supabase-provider'

type SignInOptions = {
  callbackUrl?: string
}

export function useAuth(callbackUrl: string = '/') {
  const { supabase, session, user, subscriptionStatus } = useSupabase()

  const handleSignIn = useCallback(
    async (options?: SignInOptions) => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_SCOPE ?? 'openid email profile https://www.googleapis.com/auth/drive',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
    },
    [supabase]
  )

  const handleSignOut = useCallback(async (callbackUrl?: string) => {
    console.log('🔄 [useAuth] handleSignOut called')
    try {
      console.log('🔄 [useAuth] Calling supabase.auth.signOut()...')
      // Race between signOut and 2s timeout to prevent hanging
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timed out')), 2000))
      ])
      console.log('✅ [useAuth] supabase.auth.signOut() completed')
    } catch (error) {
      console.error('❌ [useAuth] Error signing out:', error)
    } finally {
      console.log('🔄 [useAuth] Redirecting to:', callbackUrl ?? '/')
      window.location.href = callbackUrl ?? '/'
    }
  }, [supabase])

  return {
    status: (session ? 'authenticated' : 'unauthenticated') as 'authenticated' | 'unauthenticated',
    isAuthenticated: !!session,
    user: user,
    // Supabase stores the provider token in the session object
    accessToken: session?.provider_token,
    refreshToken: session?.provider_refresh_token,
    expiresAt: session?.expires_at,
    error: null,
    signIn: handleSignIn,
    signOut: handleSignOut,
    subscriptionStatus: subscriptionStatus,
  }
}
