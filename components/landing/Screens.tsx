import Image from 'next/image'

import type { ScreensProps } from '@/types/landing'

type ScreensSectionProps = {
  data: ScreensProps
}

export function Screens({ data }: ScreensSectionProps) {
  const items = data.items.slice(0, 2) // show up to two
  return (
    <section id="screens" className="px-6 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {data.title ? (
          <div className="mb-8">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">{data.title}</span>
          </div>
        ) : null}
        <div className={`grid gap-6 ${items.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
          {items.map((it, idx) => (
            <div key={it.src} className={`reveal-up ${idx ? `reveal-delay-${idx}` : ''} relative overflow-hidden rounded-[28px] border border-primary/15 bg-background/60 p-4 shadow-[0_0_40px_rgba(138,180,248,0.08)]`}>
              <div className="pointer-events-none absolute -inset-10 -z-10 opacity-70 [filter:blur(28px)] bg-[radial-gradient(45%_45%_at_50%_0%,rgba(138,180,248,0.22)_0%,rgba(18,18,18,0)_70%)]" />
              <Image
                src={it.src}
                alt={it.alt ?? 'App screenshot'}
                width={it.width ?? 640}
                height={it.height ?? 860}
                className="h-auto w-full rounded-[20px] border border-border/20 object-cover"
                sizes="(min-width: 1024px) 520px, 100vw"
                priority={false}
              />
              {it.caption ? (
                <p className="mt-3 text-center text-sm text-foreground-subtle">{it.caption}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

