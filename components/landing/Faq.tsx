"use client"

import { useId } from "react"
import { ChevronDown } from "lucide-react"

import type { FaqProps } from "@/types/landing"

type FaqSectionProps = {
  data: FaqProps
}

export function Faq({ data }: FaqSectionProps) {
  const baseId = useId()

  return (
    <section
      id="faq"
      className="border-t border-border/30 bg-gradient-to-b from-background via-background-elevated/10 to-background px-6 py-20 sm:px-8"
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">{data.title}</h2>
          <p className="mt-4 text-lg text-foreground-muted">Everything you need to know about FieldPin</p>
        </div>

        <div className="space-y-4">
          {data.items.map((item, index) => {
            const summaryId = `${baseId}-summary-${index}`
            const detailId = `${baseId}-detail-${index}`
            return (
              <details
                key={item.q}
                className="group reveal-up rounded-xl border border-border/40 transition hover:border-primary/40"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <summary
                  id={summaryId}
                  className="flex cursor-pointer items-center justify-between gap-4 bg-background/60 px-6 py-4 font-semibold text-foreground backdrop-blur-sm transition group-hover:bg-background/80"
                  aria-controls={detailId}
                >
                  <span className="text-balance text-left">{item.q}</span>
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-primary/70 transition group-open:rotate-180" />
                </summary>
                <div
                  id={detailId}
                  role="region"
                  aria-labelledby={summaryId}
                  className="border-t border-border/30 bg-background/40 px-6 py-4 text-sm leading-relaxed text-foreground-muted backdrop-blur-sm"
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
