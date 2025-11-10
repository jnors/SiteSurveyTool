import { ShieldCheck } from 'lucide-react'

import type { SecurityProps } from '@/types/landing'

type SecuritySectionProps = {
  data: SecurityProps
}

export function Security({ data }: SecuritySectionProps) {
  return (
    <section id="offline" className="px-6 py-16 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{data.title}</span>
            {data.intro ? (
              <p className="max-w-2xl text-base text-foreground-muted">{data.intro}</p>
            ) : null}
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {data.items.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border/40 bg-background-elevated/60 p-6 shadow-[0_0_25px_rgba(138,180,248,0.08)]"
            >
              <dt className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
                {item.title}
              </dt>
              <dd className="mt-3 text-base text-foreground-muted">{item.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
