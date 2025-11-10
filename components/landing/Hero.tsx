'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import type { HeroProps } from '@/types/landing'

type HeroSectionProps = {
  data: HeroProps
}

export function Hero({ data }: HeroSectionProps) {
  const handlePrimaryCta = () => {
    if (data.primaryCta.onClickEventName) {
      track({
        event: data.primaryCta.onClickEventName,
        location: 'hero',
        variant: 'primary',
        label: data.primaryCta.label,
      })
    }
  }

  const handleSecondaryCta = () => {
    if (data.secondaryCta?.onClickEventName) {
      track({
        event: data.secondaryCta.onClickEventName,
        location: 'hero',
        variant: 'secondary',
        label: data.secondaryCta.label,
      })
    }
  }

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[380px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(138,180,248,0.20)_0%,rgba(18,18,18,0)_70%)]" />
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr),minmax(0,420px)] lg:items-center">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          {data.eyebrow ? (
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {data.eyebrow}
            </span>
          ) : null}
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-[3.25rem] sm:leading-[1.1]">
            {data.headline}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-foreground-muted">
            {data.subheadline}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/80" onClick={handlePrimaryCta}>
              <Link href="#cta">{data.primaryCta.label}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-primary hover:text-primary/80" onClick={handleSecondaryCta}>
              <Link href={data.secondaryCta?.href ?? '#offline'}>{data.secondaryCta?.label ?? 'Learn how offline works'}</Link>
            </Button>
          </div>
          <p className="text-xs text-foreground-subtle">No auto-sync. Manual uploads to your Drive only.</p>
          {data.trustBadges && data.trustBadges.length > 0 ? (
            <div className="flex flex-wrap items-center gap-4 pt-4 text-xs uppercase tracking-[0.2em] text-foreground-subtle">
              {data.trustBadges.map((badge) => (
                <span key={badge.src}>{badge.alt}</span>
              ))}
            </div>
          ) : null}
        </div>
        {data.media?.type === 'image' ? (
          <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[28px] border border-primary/15 bg-background/60 p-4 shadow-[0_0_40px_rgba(138,180,248,0.08)]">
            <div className="pointer-events-none absolute -inset-10 -z-10 opacity-70 [filter:blur(28px)] bg-[radial-gradient(45%_45%_at_50%_0%,rgba(138,180,248,0.28)_0%,rgba(18,18,18,0)_70%)]" />
            <Image
              src={data.media.src}
              alt={data.media.alt ?? 'FieldPins mobile interface'}
              width={data.media.width ?? 640}
              height={data.media.height ?? 860}
              className={cn('h-auto w-full rounded-[20px] border border-border/20 object-cover')}
              priority
              sizes="(min-width: 1024px) 380px, 100vw"
            />
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10" />
    </section>
  )
}
