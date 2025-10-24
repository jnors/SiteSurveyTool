'use client'

import { useCallback, useEffect, useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

import { useOnline } from '@/lib/useOnline'

type SignInOptions = {
  callbackUrl?: string
}

type StoredSession = {
  user: any
  accessToken?: string
  refreshToken?: string
  expiresAt?: string | number | null
}

const SESSION_STORAGE_KEY = 'sst:last-session'

const readCachedSession = (): StoredSession | null => {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

const writeCachedSession = (session: StoredSession | null) => {
  if (typeof window === 'undefined') return
  try {
    if (!session) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    }
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

export function useAuth(callbackUrl: string = '/') {
  const { data, status } = useSession()
  const isOnline = useOnline()
  const [cachedSession, setCachedSession] = useState<StoredSession | null>(() => readCachedSession())

  useEffect(() => {
    if (status === 'authenticated' && data) {
      const normalized: StoredSession = {
        user: data.user,
        accessToken: (data as any)?.accessToken,
        refreshToken: (data as any)?.refreshToken,
        expiresAt: (data as any)?.expiresAt ?? (data as any)?.expires ?? null,
      }
      setCachedSession(normalized)
      writeCachedSession(normalized)
    }

    if (status === 'unauthenticated' && isOnline) {
      setCachedSession(null)
      writeCachedSession(null)
    }
  }, [status, data, isOnline])

  const sessionLike: StoredSession | null = status === 'authenticated'
    ? {
        user: data?.user,
        accessToken: (data as any)?.accessToken,
        refreshToken: (data as any)?.refreshToken,
        expiresAt: (data as any)?.expiresAt ?? (data as any)?.expires ?? null,
      }
    : !isOnline
      ? cachedSession
      : null

  const effectiveStatus = sessionLike ? 'authenticated' : status
  const isAuthenticated = Boolean(sessionLike)

  const handleSignIn = useCallback(
    (options?: SignInOptions) =>
      signIn('google', { callbackUrl, ...options }),
    [callbackUrl],
  )

  const handleSignOut = useCallback(() => {
    writeCachedSession(null)
    setCachedSession(null)
    return signOut({ callbackUrl })
  }, [callbackUrl])

  return {
    status: effectiveStatus,
    isAuthenticated,
    user: sessionLike?.user ?? null,
    accessToken: sessionLike?.accessToken,
    refreshToken: sessionLike?.refreshToken,
    expiresAt: sessionLike?.expiresAt,
    error: isOnline ? (data as any)?.error ?? null : null,
    signIn: handleSignIn,
    signOut: handleSignOut,
  }
}
