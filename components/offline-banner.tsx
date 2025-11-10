'use client'

import { useEffect, useRef } from 'react'
import { WifiOff } from 'lucide-react'

import { track } from '@/lib/analytics'
import { useOnline } from '@/lib/useOnline'

type OfflineBannerProps = {
  message?: string
  analyticsEventName?: string
}

export function OfflineBanner({
  message = 'Offline mode: capture continues, sync disabled.',
  analyticsEventName,
}: OfflineBannerProps) {
  const isOnline = useOnline()
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    if (!isOnline && analyticsEventName && !hasTrackedRef.current) {
      track({ event: analyticsEventName, location: 'banner' })
      hasTrackedRef.current = true
    }

    if (isOnline) {
      hasTrackedRef.current = false
    }
  }, [isOnline, analyticsEventName])

  if (isOnline) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-[rgba(249,171,0,0.12)] px-4 py-2 text-[var(--color-accent-yellow)]">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
