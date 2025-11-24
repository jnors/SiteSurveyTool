import { Zap, RefreshCw, Lock } from 'lucide-react'
import type { PillarsProps } from "@/types/landing"

type PillarsSectionProps = {
  data: PillarsProps
}

export function Pillars({ data }: PillarsSectionProps) {
  const icons = [Zap, RefreshCw, Lock]
  const iconColors = [
    'bg-gradient-to-br from-primary/20 to-primary/10',
    'bg-gradient-to-br from-secondary/20 to-secondary/10',
    'bg-gradient-to-br from-primary/15 to-secondary/15'
  ]

  return (
    <section
      id="pillars"
      className="relative border-t border-border/30 px-6 py-20 sm:px-8"
    >
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for field teams
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three core principles that make FieldPins different
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {data.items.map((p, idx) => {
            const Icon = icons[idx]
            const iconBg = iconColors[idx]

            return (
              <article
                key={p.id}
                className={`reveal-up reveal-delay-${400 + idx * 100} group relative overflow-hidden rounded-2xl border-2 border-border/40 bg-card/60 p-8 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card/80`}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: idx === 0
                        ? 'radial-gradient(circle at 50% 50%, oklch(0.72 0.15 65 / 0.08), transparent 70%)'
                        : idx === 1
                          ? 'radial-gradient(circle at 50% 50%, oklch(0.72 0.14 195 / 0.08), transparent 70%)'
                          : 'radial-gradient(circle at 50% 50%, oklch(0.72 0.15 65 / 0.05), oklch(0.72 0.14 195 / 0.05), transparent 70%)'
                    }}
                  />
                </div>

                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-7 w-7 text-primary" strokeWidth={2} />
                </div>

                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {p.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {p.summary}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
