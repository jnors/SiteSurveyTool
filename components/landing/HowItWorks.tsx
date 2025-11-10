import type { HowItWorksProps } from '@/types/landing'

type HowItWorksSectionProps = {
  data: HowItWorksProps
}

// Vertical timeline variant for clearer step-by-step flow
export function HowItWorks({ data }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="border-t border-border/40 bg-background-elevated/40 px-6 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{data.title}</span>
        <ol className="relative mt-8 border-l border-border/50 pl-10">
          {data.steps.map((step, index) => (
            <li key={step} className={`reveal-up ${index ? `reveal-delay-${index % 4}` : ''} relative mb-6 last:mb-0`}>
              <div className="absolute -left-5 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold leading-none text-primary">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="rounded-xl border border-border/40 bg-background/80 p-5">
                <p className="text-base leading-relaxed text-foreground-muted">{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
