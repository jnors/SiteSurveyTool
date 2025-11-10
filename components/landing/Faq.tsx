'use client'

import { useId } from 'react'

import type { FaqProps } from '@/types/landing'

type FaqSectionProps = {
  data: FaqProps
}

export function Faq({ data }: FaqSectionProps) {
  const baseId = useId()

  return (
    <section id="faq" className="border-t border-border/40 bg-background-elevated/30 px-6 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{data.title}</span>
        <div className="mt-8 space-y-4">
          {data.items.map((item, index) => {
            const summaryId = `${baseId}-summary-${index}`
            const detailId = `${baseId}-detail-${index}`
            return (
              <details
                key={item.q}
                className="group rounded-xl border border-border/50 bg-background/70 p-5 transition duration-150 hover:border-primary/40"
              >
                <summary
                  id={summaryId}
                  className="cursor-pointer list-none text-base font-medium text-foreground"
                  aria-controls={detailId}
                >
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-primary/70 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <div
                  id={detailId}
                  role="region"
                  aria-labelledby={summaryId}
                  className="mt-3 text-sm leading-6 text-foreground-muted"
                >
                  {item.a}
                </div>
              </details>
            )
          })}
        </div>
      </div>
    </section>
  )
}
