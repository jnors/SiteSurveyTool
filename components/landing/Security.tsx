import { ShieldCheck } from 'lucide-react'

import type { SecurityProps } from '@/types/landing'

type SecuritySectionProps = {
  data: SecurityProps
}

export function Security({ data }: SecuritySectionProps) {
  return (
    <section id="offline" className="relative px-6 py-16 sm:px-8">
      {/* Subtle background accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.72 0.15 65 / 0.05), transparent 70%)'
        }}
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" strokeWidth={2} aria-hidden />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              {data.title}
            </span>
            {data.intro ? (
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                {data.intro}
              </p>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {data.items.map((item, idx) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-xl border-2 border-border/40 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80"
            >
              {/* Subtle pattern overlay */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                <div
                  className="absolute inset-0"
                  style={{
                    background: idx % 2 === 0
                      ? 'radial-gradient(circle at 80% 20%, oklch(0.72 0.15 65 / 0.06), transparent 50%)'
                      : 'radial-gradient(circle at 20% 80%, oklch(0.72 0.14 195 / 0.06), transparent 50%)'
                  }}
                />
              </div>

              <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {item.title}
              </dt>
              <dd className="mt-3 text-base leading-relaxed text-foreground">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
