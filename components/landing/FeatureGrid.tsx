import { cn } from '@/lib/utils'
import type { FeatureGridProps } from '@/types/landing'

type FeatureGridSectionProps = {
  data: FeatureGridProps
}

export function FeatureGrid({ data }: FeatureGridSectionProps) {
  const largeCols = data.columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'

  return (
    <section id="features" className="px-6 py-16 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Key benefits</span>
          <h2 className="text-3xl font-semibold text-foreground">Built for fast, offline capture</h2>
          <p className="max-w-2xl text-base text-foreground-muted">
            Every flow prioritises offline work after your first sign-in—manual sync keeps you in control of uploads and retries.
          </p>
        </div>
        <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2', largeCols)}>
          {data.features.map((feature) => (
            <article
              key={feature.id}
              className="group relative overflow-hidden rounded-xl border border-border/40 bg-background/80 p-6 transition duration-150 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(138,180,248,0.18)]"
            >
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground-subtle">
                {feature.title}
              </div>
              <p className="mt-4 text-base text-foreground-muted">{feature.benefit}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
