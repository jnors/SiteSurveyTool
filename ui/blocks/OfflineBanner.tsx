"use client"

import { useEffect, useRef } from 'react'
import { WifiOff } from 'lucide-react'

import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { useOnline } from '@/lib/useOnline'
import { useHasMounted } from '@/lib/useHasMounted'

type OfflineBannerProps = {
  message?: string
  analyticsEventName?: string
  className?: string
}

export function OfflineBanner({
  message = 'Offline. Capture continues but uploads pause until you reconnect.',
  analyticsEventName,
  className,
}: OfflineBannerProps) {
  const isOnline = useOnline()
  const hasMounted = useHasMounted()
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    if (!hasMounted) return
    if (!isOnline && analyticsEventName && !hasTrackedRef.current) {
      track({ event: analyticsEventName, location: 'offline-banner' })
      hasTrackedRef.current = true
    }
    if (isOnline) {
      hasTrackedRef.current = false
    }
  }, [hasMounted, isOnline, analyticsEventName])

  if (!hasMounted || isOnline) {
    return null
  }

  return (
    <div className={cn('pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4', className)}>
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-warning backdrop-blur-md shadow-surface">
        <WifiOff className="h-4 w-4" aria-hidden />
        <p className="text-sm font-medium leading-tight text-warning">{message}</p>
      </div>
    </div>
  )
}
