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
  const isDisabled = status === 'loading' || !isOnline

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
    <section id="cta" className="border-t border-border/40 bg-[rgba(138,180,248,0.08)] px-6 py-16 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        <h2 className="text-3xl font-semibold text-foreground">{data.headline}</h2>
        {data.subheadline ? (
          <p className="max-w-2xl text-base text-foreground-muted">{data.subheadline}</p>
        ) : null}
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/80"
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
              className="text-primary hover:text-primary/80"
              onClick={handleSecondaryClick}
            >
              <Link href={data.secondaryCta.href ?? '#offline'}>{data.secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
        {!isOnline ? (
          <p className="text-xs text-[var(--color-accent-yellow)]">Reconnect to sign in and unlock offline capture.</p>
        ) : null}
        <p className="text-xs text-foreground-subtle">
          Manual sync only. FieldPin writes to folders you own under <span className="font-medium text-primary">/My Drive/FieldPins/</span>.
        </p>
      </div>
    </section>
  )
}
