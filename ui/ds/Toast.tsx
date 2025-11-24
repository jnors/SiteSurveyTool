"use client"

import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { IconButton } from './IconButton'

type ToastTone = 'success' | 'info' | 'warning' | 'error'

const TONE_STYLES: Record<ToastTone, { border: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: {
    border: 'border-success/50 bg-success/10 text-success',
    text: 'text-success',
    icon: CheckCircle2,
  },
  info: {
    border: 'border-primary/50 bg-primary/10 text-primary',
    text: 'text-primary',
    icon: Info,
  },
  warning: {
    border: 'border-warning/60 bg-warning/10 text-warning',
    text: 'text-warning',
    icon: AlertCircle,
  },
  error: {
    border: 'border-error/60 bg-error/10 text-error',
    text: 'text-error',
    icon: AlertCircle,
  },
}

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: ToastTone
  title?: string
  description?: string
  onClose?: () => void
  action?: React.ReactNode
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ tone = 'info', title, description, onClose, action, className, ...props }, ref) => {
    const styles = TONE_STYLES[tone]
    const Icon = styles.icon

    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full min-w-[280px] max-w-[420px] items-start gap-3 rounded-2xl border px-4 py-3 shadow-surface backdrop-blur',
          styles.border,
          className,
        )}
        {...props}
      >
        <Icon className={cn('mt-0.5 h-5 w-5', styles.text)} />
        <div className="flex flex-1 flex-col gap-1 text-sm text-foreground">
          {title ? <p className="font-semibold text-base leading-tight">{title}</p> : null}
          {description ? <p className="text-sm text-foreground-muted leading-snug">{description}</p> : null}
          {action}
        </div>
        {onClose ? (
          <IconButton tone="ghost" size="sm" aria-label="Dismiss" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        ) : null}
      </div>
    )
  },
)

Toast.displayName = 'Toast'
