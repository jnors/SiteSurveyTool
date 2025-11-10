'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import type { SyncStatus } from '@/lib/types'
import { getSyncStatusColor, getSyncStatusText } from '@/lib/utils/sync-status'

interface SyncBannerProps {
  status: SyncStatus
  onSync?: () => void
  actionDisabled?: boolean
  disabledReason?: string
}

export function SyncBanner({ status, onSync, actionDisabled, disabledReason }: SyncBannerProps) {
  const [prevStatus, setPrevStatus] = useState<SyncStatus>(status)

  useEffect(() => {
    if (prevStatus !== status) {
      const timer = setTimeout(() => {
        setPrevStatus(status)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [status, prevStatus])

  const getIcon = () => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 className="h-4 w-4" />
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin" />
    }
  }

  const getAnimationClass = () => {
    switch (status) {
      case 'synced':
        return 'animate-[subtle-pulse_2s_ease-in-out_infinite]'
      case 'pending':
        return ''
      case 'error':
        return 'animate-[shake_150ms_ease-in-out]'
      case 'syncing':
        return ''
      default:
        return ''
    }
  }

  const showSyncButton = Boolean(onSync)

  return (
    <div
      className={`
        flex flex-wrap items-center justify-center gap-2 px-4 py-2
        ${getSyncStatusColor(status)}
        ${getAnimationClass()}
        transition-all duration-150 ease-in-out
        animate-[slide-down_150ms_ease-out]
      `}
    >
      <span className="text-black">{getIcon()}</span>
      <span className="text-sm font-medium text-black">{getSyncStatusText(status)}</span>
      {showSyncButton && (
        <button
          onClick={onSync}
          disabled={actionDisabled}
          className="ml-3 rounded bg-black/10 px-3 py-1 text-xs font-semibold text-black hover:bg-black/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Sync Now
        </button>
      )}
      {actionDisabled && disabledReason && (
        <span className="ml-3 text-xs font-medium text-black/70">{disabledReason}</span>
      )}
    </div>
  )
}
