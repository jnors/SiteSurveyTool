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

  if (status === 'loading') {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto mt-20 w-full max-w-md px-4">
        <SignInCard />
      </div>
    )
  }

  return <>{children}</>
}
