'use client'

import { useCallback } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { logger } from '@/lib/logger'
import { db } from '@/lib/db'

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
          scopes: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_SCOPE ?? 'openid email profile https://www.googleapis.com/auth/drive.file',
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })
    },
    [supabase]
  )

  const handleSignOut = useCallback(async (callbackUrl?: string) => {
    logger.auth('handleSignOut called')
    try {
      logger.auth('Calling supabase.auth.signOut()...')
      // Race between signOut and 2s timeout to prevent hanging
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timed out')), 2000))
      ])
      logger.auth('supabase.auth.signOut() completed')
    } catch (error) {
      logger.error('Error signing out', error)
      // Force clear local storage if signOut fails/times out
      logger.auth('Force clearing local storage tokens...')
      const keyToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
          keyToRemove.push(key)
        }
      }
      keyToRemove.forEach(k => localStorage.removeItem(k))
      localStorage.removeItem('subscription_status')
      logger.auth('Local storage cleared')
    } finally {
      // Clear IndexedDB to prevent data leakage between accounts
      try {
        logger.auth('Clearing IndexedDB...')
        await db.delete()
        logger.auth('IndexedDB cleared successfully')
      } catch (dbError) {
        logger.error('Error clearing IndexedDB', dbError)
        // Continue with sign-out even if DB clearing fails
      }

      logger.auth('Redirecting to server-side signout...')
      // Always redirect to the server-side sign-out route to ensure cookies are cleared
      window.location.href = '/auth/signout'
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
    refreshSubscriptionStatus: useSupabase().refreshSubscriptionStatus,
  }
}
