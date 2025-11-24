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
      {/* Layered atmospheric background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />

        {/* Geometric grid pattern */}
        <div className="absolute inset-0 bg-pattern-grid opacity-30" />

        {/* Amber glow from top */}
        <div
          className="absolute inset-x-0 top-0 h-[600px]"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.72 0.15 65 / 0.12), transparent 70%)'
          }}
        />

        {/* Cyan accent bottom-left */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 20% 100%, oklch(0.72 0.14 195 / 0.08), transparent 40%)'
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Left: Content */}
          <div className="flex flex-col gap-8 text-center lg:text-left">
            {data.eyebrow ? (
              <div className="reveal-up inline-flex items-center justify-center gap-2 lg:justify-start">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {data.eyebrow}
                </span>
              </div>
            ) : null}

            <h1 className="reveal-up reveal-delay-100 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[4.5rem]">
              {data.headline}
            </h1>

            <p className="reveal-up reveal-delay-200 text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {data.subheadline}
            </p>

            <div className="reveal-up reveal-delay-300 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="glow-amber h-12 border-2 border-primary/20 bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:border-primary/40 hover:bg-primary/90"
                onClick={handlePrimaryCta}
              >
                <Link href="#cta">{data.primaryCta.label}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="glow-cyan h-12 border-2 border-secondary/30 bg-secondary/10 px-8 text-base font-semibold text-foreground transition-all hover:border-secondary/50 hover:bg-secondary/20"
                onClick={handleSecondaryCta}
              >
                <Link href={data.secondaryCta?.href ?? "#offline"}>
                  {data.secondaryCta?.label ?? "Learn more"}
                </Link>
              </Button>
            </div>

            <p className="reveal-up reveal-delay-300 text-xs text-muted-foreground">
              No auto-sync • Manual control • Your data stays on your Drive
            </p>
          </div>

          {/* Right: Media */}
          {data.media?.type === "image" ? (
            <div className="reveal-up reveal-delay-400 relative">
              {/* Ambient glow behind image */}
              <div
                className="absolute -inset-8 rounded-[40px] opacity-40 blur-3xl"
                style={{
                  background: 'radial-gradient(ellipse at center, oklch(0.72 0.15 65 / 0.3), oklch(0.72 0.14 195 / 0.2), transparent 70%)'
                }}
              />

              <div className="relative overflow-hidden rounded-[28px] border-2 border-primary/20 bg-card/40 p-2 shadow-2xl backdrop-blur-sm">
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
