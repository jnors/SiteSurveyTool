'use client'

import { LogIn } from 'lucide-react'
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/lib/useAuth'
import { useOnline } from '@/lib/useOnline'
import { cn } from '@/lib/utils'

type SignInCardProps = {
  ctaLabel?: string
  onCtaClick?: () => void
  offlineTooltip?: string
  className?: string
}

export function SignInCard({
  ctaLabel = 'Sign in with Google',
  onCtaClick,
  offlineTooltip = 'Sign-in requires connectivity. Reconnect to continue.',
  className,
}: SignInCardProps = {}) {
  const descriptionId = useId()
  const { status, signIn } = useAuth('/projects')
  const isOnline = useOnline()
  const isLoading = status === 'loading'
  const isDisabled = isLoading || !isOnline

  const handleSignIn = () => {
    if (isDisabled) return
    onCtaClick?.()
    void signIn()
  }

  const tooltip = !isOnline ? offlineTooltip : undefined

  return (
    <Card className={cn('w-full max-w-md border-primary/30 bg-background-elevated/80 backdrop-blur', className)}>
      <CardHeader>
        <CardTitle className="text-foreground text-xl">Sign in to continue</CardTitle>
        <CardDescription className="text-foreground-muted">
          Connect your Google account to sync survey data and exports to
          <span className="ml-1 font-medium text-primary">/My Drive/FieldPins/</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed text-foreground-muted">
        <p>
          We only request the scopes your surveys need:
          <code className="ml-2 inline-block rounded bg-background-elevated px-2 py-1 text-xs text-primary/90">
            openid email profile https://www.googleapis.com/auth/drive
          </code>
        </p>
        <p>
          Exports are written to folders named
          <span className="ml-1 font-medium text-foreground">
            {'<ProjectName>__<projectId>'}
          </span>
          with
          <code className="mx-1 inline-flex items-center rounded bg-background-elevated px-2 py-1 text-xs text-foreground">
            project.json
          </code>
          written last so your Drive stays consistent.
        </p>
        <div className="space-y-2">
          <Button
            aria-describedby={!isOnline ? descriptionId : undefined}
            className="mt-4 w-full gap-2 bg-primary hover:bg-primary/80"
            size="lg"
            onClick={handleSignIn}
            disabled={isDisabled}
            title={tooltip}
          >
            <LogIn className="h-4 w-4" />
            {ctaLabel}
          </Button>
          {!isOnline && (
            <p id={descriptionId} className="text-xs text-[var(--color-accent-yellow)]">
              {offlineTooltip}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
