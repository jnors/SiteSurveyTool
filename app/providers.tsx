'use client'

import type { ReactNode } from 'react'
import SupabaseProvider from '@/components/supabase-provider'
import { ServiceWorkerRegistrar } from '@/ui'

export function Providers({
  children,
  initialSession,
  initialSubscriptionStatus
}: {
  children: ReactNode
  initialSession?: any
  initialSubscriptionStatus?: string | null
}) {
  return (
    <SupabaseProvider initialSession={initialSession} initialSubscriptionStatus={initialSubscriptionStatus}>
      {children}
      <ServiceWorkerRegistrar />
    </SupabaseProvider>
  )
}
