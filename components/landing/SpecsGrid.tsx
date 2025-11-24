import type { SpecsGridProps } from '@/types/landing'

type SpecsGridSectionProps = {
  data: SpecsGridProps
}

export function SpecsGrid({ data }: SpecsGridSectionProps) {
  return (
    <section id="benefits" className="relative px-6 py-20 sm:px-8">
      {/* Subtle background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.72 0.15 65 / 0.06), transparent 70%)'
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Field Benefits
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {data.title ?? 'Built for fast, offline capture'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, idx) => (
            <article
              key={item.id}
              className={`reveal-up reveal-delay-${400 + (idx % 3) * 100} group rounded-xl border-2 border-border/40 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80`}
            >
              {/* Subtle hover glow */}
              <div className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100">
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: idx % 2 === 0
                      ? 'radial-gradient(circle at 50% 50%, oklch(0.72 0.15 65 / 0.06), transparent 70%)'
                      : 'radial-gradient(circle at 50% 50%, oklch(0.72 0.14 195 / 0.06), transparent 70%)'
                  }}
                />
              </div>

              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {item.title}
              </div>
              <p className="mt-3 text-base leading-relaxed text-foreground">
                {item.benefit}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
