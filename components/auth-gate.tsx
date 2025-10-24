'use client'

import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useOnline } from '@/lib/useOnline'

import { SignInCard } from '@/components/sign-in-card'

type AuthGateProps = {
  children: ReactNode
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isAuthenticated: boolean
}

export function AuthGate({ children, status, isAuthenticated }: AuthGateProps) {
  const isOnline = useOnline()

  return (
    <>
      {children}
      {/* Non-blocking sign-in prompt when unauthenticated */}
      {!isAuthenticated && (
        <div className="mx-auto mt-6 w-full max-w-4xl px-4">
          <SignInCard />
        </div>
      )}
      {/* Lightweight inline spinner only when online */}
      {isOnline && status === 'loading' && (
        <div className="flex w-full items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
    </>
  )
}
