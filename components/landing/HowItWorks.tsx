import type { HowItWorksProps } from "@/types/landing"

type HowItWorksSectionProps = {
  data: HowItWorksProps
}

export function HowItWorks({ data }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="border-t border-border/30 px-6 py-20 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">{data.title}</h2>
          <p className="mt-4 text-lg text-foreground-muted">Get started in four simple steps</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.steps.map((step, index) => (
            <div
              key={step}
              className="reveal-up relative flex flex-col gap-4 rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur-sm"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                {index + 1}
              </div>
              <p className="leading-relaxed text-foreground-muted">{step}</p>

              {/* Connector line for desktop */}
              {index < data.steps.length - 1 && (
                <div className="absolute right-0 top-1/2 hidden w-6 -translate-y-1/2 translate-x-full lg:block">
                  <div className="h-1 w-full bg-gradient-to-r from-primary/50 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
