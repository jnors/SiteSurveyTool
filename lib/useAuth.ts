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
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
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
