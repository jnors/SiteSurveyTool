"use client"

import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'

import type { SyncStatus } from '@/core'
import { BadgeStatus } from '@/ui/ds/BadgeStatus'
import { Button } from '@/ui/ds/Button'
import { useHasMounted } from '@/lib/useHasMounted'

type SyncBarProps = {
  status: SyncStatus
  pendingCount?: number
  errorCount?: number
  lastSyncedIso?: string
  onSync?: () => void | Promise<void>
  disabledReason?: string
  isSyncing?: boolean
  syncProgress?: string
  onViewIssues?: () => void
}

export function SyncBar({
  status,
  pendingCount = 0,
  errorCount = 0,
  lastSyncedIso,
  onSync,
  disabledReason,
  isSyncing,
  syncProgress,
  onViewIssues,
}: SyncBarProps) {
  const hasMounted = useHasMounted()
  const queueText = useMemo(() => {
    // Show progress message during sync
    if (syncProgress) {
      return syncProgress
    }
    const parts: string[] = []
    if (pendingCount > 0) {
      parts.push(`${pendingCount} pending`)
    }
    if (errorCount > 0) {
      parts.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`)
    }
    if (!parts.length) {
      return 'All items synced'
    }
    return `Queue: ${parts.join(' | ')}`
  }, [pendingCount, errorCount, syncProgress])

  const formattedLastSynced = hasMounted && lastSyncedIso ? new Date(lastSyncedIso).toLocaleString() : null

  return (
    <div className="border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm text-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <BadgeStatus status={status === 'syncing' ? 'syncing' : status} />
          <span className="text-foreground-muted">{queueText}</span>
          {lastSyncedIso ? (
            <span className="text-foreground-subtle">
              Last sync: {formattedLastSynced ?? '--'}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {errorCount > 0 && onViewIssues ? (
            <Button variant="outline" size="sm" onClick={onViewIssues}>
              View issues
            </Button>
          ) : null}
          {onSync ? (
            <Button
              size="sm"
              className="gap-2"
              onClick={onSync}
              disabled={Boolean(disabledReason) || isSyncing}
              title={disabledReason}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync now'
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
