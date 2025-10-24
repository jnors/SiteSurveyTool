'use client'

import { WifiOff } from 'lucide-react'

import { useOnline } from '@/lib/useOnline'

export function OfflineBanner() {
  const isOnline = useOnline()

  if (isOnline) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-[rgba(249,171,0,0.12)] px-4 py-2 text-[var(--color-accent-yellow)]">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Offline mode: capture continues, sync disabled.</span>
    </div>
  )
}
