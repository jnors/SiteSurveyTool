import type { HowItWorksProps } from "@/types/landing"

type HowItWorksSectionProps = {
  data: HowItWorksProps
}

export function HowItWorks({ data }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="relative border-t border-border/30 px-6 py-20 sm:px-8">
      {/* Subtle background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, oklch(0.72 0.14 195 / 0.06), transparent 70%)'
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {data.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get started in four simple steps
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.steps.map((step, index) => (
            <div
              key={step}
              className={`reveal-up reveal-delay-${400 + index * 100} relative flex flex-col gap-4 rounded-2xl border-2 border-border/40 bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-base font-bold text-primary">
                {index + 1}
              </div>
              <p className="leading-relaxed text-foreground">
                {step}
              </p>

              {/* Connector line for desktop */}
              {index < data.steps.length - 1 && (
                <div className="absolute right-0 top-1/2 hidden w-6 -translate-y-1/2 translate-x-full lg:block">
                  <div
                    className="h-1 w-full"
                    style={{
                      background: 'linear-gradient(to right, oklch(0.72 0.15 65 / 0.5), transparent)'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
