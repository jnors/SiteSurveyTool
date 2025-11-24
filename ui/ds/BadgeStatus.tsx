import { AlertCircle, CheckCircle2, Clock, Loader2, MinusCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { SyncStatus } from '@/core'

type BadgeState = Extract<SyncStatus, 'pending' | 'syncing' | 'error' | 'synced'> | 'uploading' | 'blocked'

const STATUS_MAP: Record<BadgeState, { label: string; className: string; dotClass: string; Icon?: React.ComponentType<{ className?: string }> }> = {
  pending: {
    label: 'Pending sync',
    className: 'border-warning/40 bg-warning/10 text-warning',
    dotClass: 'bg-warning',
    Icon: Clock,
  },
  uploading: {
    label: 'Uploading…',
    className: 'border-primary/40 bg-primary/10 text-primary',
    dotClass: 'bg-primary',
    Icon: Loader2,
  },
  syncing: {
    label: 'Syncing…',
    className: 'border-primary/40 bg-primary/10 text-primary',
    dotClass: 'bg-primary',
    Icon: Loader2,
  },
  synced: {
    label: 'Synced',
    className: 'border-success/40 bg-success/10 text-success',
    dotClass: 'bg-success',
    Icon: CheckCircle2,
  },
  error: {
    label: 'Sync failed',
    className: 'border-error/50 bg-error/10 text-error',
    dotClass: 'bg-error',
    Icon: AlertCircle,
  },
  blocked: {
    label: 'Blocked',
    className: 'border-foreground/30 bg-foreground/5 text-foreground-muted',
    dotClass: 'bg-foreground-muted',
    Icon: MinusCircle,
  },
}

export interface BadgeStatusProps {
  status: BadgeState
  label?: string
  className?: string
  subdued?: boolean
}

export function BadgeStatus({ status, label, className, subdued = false }: BadgeStatusProps) {
  const state = STATUS_MAP[status]
  const Icon = state.Icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        subdued ? 'opacity-70' : 'opacity-100',
        state.className,
        className,
      )}
    >
      <span className={cn('h-2.5 w-2.5 rounded-full', state.dotClass)} />
      {Icon ? (
        <Icon className={cn('h-3.5 w-3.5', status === 'syncing' || status === 'uploading' ? 'animate-spin' : '')} />
      ) : null}
      <span>{label ?? state.label}</span>
    </span>
  )
}

