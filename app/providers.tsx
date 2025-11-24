'use client'

import type { ReactNode } from 'react'
import SupabaseProvider from '@/components/supabase-provider'
import { ServiceWorkerRegistrar } from '@/ui'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      {children}
      <ServiceWorkerRegistrar />
    </SupabaseProvider>
  )
}
