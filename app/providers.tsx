'use client'

import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ServiceWorkerRegistrar } from '@/components/sw-registrar'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      {children}
      <ServiceWorkerRegistrar />
    </SessionProvider>
  )
}
