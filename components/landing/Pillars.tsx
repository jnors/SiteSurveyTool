import type { PillarsProps } from '@/types/landing'

type PillarsSectionProps = {
  data: PillarsProps
}

export function Pillars({ data }: PillarsSectionProps) {
  return (
    <section id="pillars" className="px-6 py-14 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {data.items.map((p, idx) => {
            const delay = idx === 0 ? '' : `reveal-delay-${idx}`
            return (
            <article
              key={p.id}
              className={`reveal-up ${delay} rounded-xl border border-border/40 bg-background-elevated/70 p-6 shadow-[0_0_25px_rgba(138,180,248,0.08)]`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-foreground-subtle">
                {p.title}
              </h3>
              <p className="mt-3 text-base text-foreground-muted">{p.summary}</p>
            </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
