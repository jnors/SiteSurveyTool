import type { PillarsProps } from "@/types/landing"

type PillarsSectionProps = {
  data: PillarsProps
}

export function Pillars({ data }: PillarsSectionProps) {
  const icons = ["⚡", "🔄", "🔒"]

  return (
    <section
      id="pillars"
      className="border-t border-border/30 bg-gradient-to-b from-background via-background to-background-elevated/20 px-6 py-20 sm:px-8"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">Built for field teams</h2>
          <p className="mt-4 text-lg text-foreground-muted">Three core principles that make FieldPin different</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {data.items.map((p, idx) => (
            <article
              key={p.id}
              className="group reveal-up relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-8 backdrop-blur-sm transition hover:border-primary/40 hover:bg-background/80"
              style={{
                animationDelay: `${idx * 100}ms`,
              }}
            >
              <div className="absolute inset-0 -z-10 opacity-0 transition group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
              </div>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-2xl">
                {icons[idx]}
              </div>

              <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-foreground-muted">{p.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
