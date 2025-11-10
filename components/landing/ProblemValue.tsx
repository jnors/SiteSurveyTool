import type { ProblemValueProps } from '@/types/landing'

type ProblemValueSectionProps = {
  data: ProblemValueProps
}

export function ProblemValue({ data }: ProblemValueSectionProps) {
  return (
    <section id="problem" className="border-t border-border/40 bg-background/80 px-6 py-16 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-foreground-subtle">Before</h2>
          <ul className="mt-6 space-y-3 text-base text-foreground-muted">
            {data.before.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-destructive" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-primary">After</h2>
          <ul className="mt-6 space-y-3 text-base text-foreground-muted">
            {data.after.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
