'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'
import { useAuth } from '@/lib/useAuth'
import { useOnline } from '@/lib/useOnline'
import type { FinalCtaProps } from '@/types/landing'

type FinalCtaSectionProps = {
  data: FinalCtaProps
}

export function FinalCta({ data }: FinalCtaSectionProps) {
  const { status, signIn } = useAuth('/projects')
  const isOnline = useOnline()
  const isDisabled = !isOnline

  const handlePrimaryClick = () => {
    if (isDisabled) return
    if (data.primaryCta.onClickEventName) {
      track({
        event: data.primaryCta.onClickEventName,
        location: 'final-cta',
        variant: 'primary',
        label: data.primaryCta.label,
      })
    }
    void signIn()
  }

  const handleSecondaryClick = () => {
    if (data.secondaryCta?.onClickEventName) {
      track({
        event: data.secondaryCta.onClickEventName,
        location: 'final-cta',
        variant: 'secondary',
        label: data.secondaryCta.label,
      })
    }
  }

  return (
    <section id="cta" className="relative overflow-hidden border-t border-border/40 px-6 py-24 sm:px-8">
      {/* Dramatic layered background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />

        {/* Geometric grid */}
        <div className="absolute inset-0 bg-pattern-grid opacity-20" />

        {/* Amber glow top-right */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 80% 20%, oklch(0.72 0.15 65 / 0.15), transparent 50%)'
          }}
        />

        {/* Cyan glow bottom-left */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 20% 80%, oklch(0.72 0.14 195 / 0.12), transparent 50%)'
          }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {data.headline}
        </h2>
        {data.subheadline ? (
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {data.subheadline}
          </p>
        ) : null}

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="glow-amber min-w-[200px] border-2 border-primary/20 bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:border-primary/40 hover:bg-primary/90"
            onClick={handlePrimaryClick}
            disabled={isDisabled}
            title={!isOnline ? 'Sign-in requires connectivity. Reconnect to continue.' : undefined}
          >
            {data.primaryCta.label}
          </Button>
          {data.secondaryCta ? (
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="glow-cyan border-2 border-secondary/30 bg-secondary/10 px-8 text-base font-semibold text-foreground transition-all hover:border-secondary/50 hover:bg-secondary/20"
              onClick={handleSecondaryClick}
            >
              <Link href={data.secondaryCta.href ?? '#offline'}>
                {data.secondaryCta.label}
              </Link>
            </Button>
          ) : null}
        </div>

        {!isOnline ? (
          <p className="text-sm font-medium text-primary">
            Reconnect to sign in and unlock offline capture.
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Manual sync only. FieldPins writes to folders you own under{' '}
          <span className="font-mono font-medium text-primary">/My Drive/FieldPins/</span>.
        </p>
      </div>
    </section>
  )
}
