import type { SpecsGridProps } from '@/types/landing'

type SpecsGridSectionProps = {
  data: SpecsGridProps
}

export function SpecsGrid({ data }: SpecsGridSectionProps) {
  return (
    <section id="benefits" className="px-6 py-16 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{data.title ?? 'Field benefits'}</span>
          <h2 className="text-3xl font-semibold text-foreground">Built for fast, offline capture</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item, idx) => (
            <article
              key={item.id}
              className={`reveal-up ${idx ? `reveal-delay-${idx % 4}` : ''} rounded-xl border border-border/40 bg-background/80 p-6 transition duration-150 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(138,180,248,0.18)]`}
            >
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground-subtle">
                {item.title}
              </div>
              <p className="mt-3 text-base text-foreground-muted">{item.benefit}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
