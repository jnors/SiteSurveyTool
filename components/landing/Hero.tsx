"use client"

import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { track } from "@/lib/analytics"
import type { HeroProps } from "@/types/landing"

type HeroSectionProps = {
  data: HeroProps
}

export function Hero({ data }: HeroSectionProps) {
  const handlePrimaryCta = () => {
    if (data.primaryCta.onClickEventName) {
      track({
        event: data.primaryCta.onClickEventName,
        location: "hero",
        variant: "primary",
        label: data.primaryCta.label,
      })
    }
  }

  const handleSecondaryCta = () => {
    if (data.secondaryCta?.onClickEventName) {
      track({
        event: data.secondaryCta.onClickEventName,
        location: "hero",
        variant: "secondary",
        label: data.secondaryCta.label,
      })
    }
  }

  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-8 md:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(138,180,248,0.25),rgba(52,168,83,0.08),rgba(18,18,18,0))]" />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Left: Content */}
          <div className="flex flex-col gap-8 text-center lg:text-left">
            {data.eyebrow ? (
              <div className="inline-flex items-center justify-center gap-2 lg:justify-start">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{data.eyebrow}</span>
              </div>
            ) : null}

            <h1 className="text-balance text-5xl font-bold leading-[1.1] text-foreground sm:text-6xl lg:text-[4rem]">
              {data.headline}
            </h1>

            <p className="text-balance text-lg leading-relaxed text-foreground-muted sm:text-xl">{data.subheadline}</p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="h-12 bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
                onClick={handlePrimaryCta}
              >
                <Link href="#cta">{data.primaryCta.label}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 border border-border/50 px-8 text-base font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/5"
                onClick={handleSecondaryCta}
              >
                <Link href={data.secondaryCta?.href ?? "#offline"}>{data.secondaryCta?.label ?? "Learn more"}</Link>
              </Button>
            </div>

            <p className="text-xs text-foreground-subtle">
              No auto-sync • Manual control • Your data stays on your Drive
            </p>
          </div>

          {/* Right: Media */}
          {data.media?.type === "image" ? (
            <div className="relative">
              <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-primary/10 via-success/5 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-background/40 p-2 shadow-2xl backdrop-blur-sm">
                <Image
                  src={data.media.src || "/placeholder.svg"}
                  alt={data.media.alt ?? "FieldPins mobile interface"}
                  width={data.media.width ?? 640}
                  height={data.media.height ?? 860}
                  className="h-auto w-full rounded-[24px] object-cover"
                  priority
                  sizes="(min-width: 1024px) 500px, 100vw"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
