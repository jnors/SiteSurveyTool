import Link from 'next/link'

import type { DriveProofProps } from '@/types/landing'

type DriveProofSectionProps = {
  data: DriveProofProps
}

export function DriveProof({ data }: DriveProofSectionProps) {
  return (
    <section id="drive-proof" className="border-t border-border/40 bg-background/80 px-6 py-16 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border/40 bg-background-elevated/70 p-6">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Your Drive</span>
          <p className="mt-3 text-base text-foreground-muted">We sync to folders you own. You can verify and share directly from Drive.</p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border/40 bg-background p-4 text-sm text-foreground-subtle"><code>{data.folderPathExample}</code></pre>
          <ul className="mt-4 space-y-2 text-sm text-foreground-muted">
            {data.bullets.map((b) => (
              <li key={b} className="flex gap-2"><span aria-hidden>•</span><span>{b}</span></li>
            ))}
          </ul>
          {data.learnMoreHref ? (
            <div className="mt-4 text-sm">
              <Link href={data.learnMoreHref} className="text-primary hover:text-primary/80">
                See what we write →
              </Link>
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border border-border/40 bg-background-elevated/70 p-6">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground-subtle">project.json</span>
          <p className="mt-3 text-base text-foreground-muted">Written last to ensure consistency.</p>
          <pre className="mt-4 max-h-[280px] overflow-auto rounded-lg border border-border/40 bg-background p-4 text-xs leading-relaxed text-foreground-subtle"><code>{data.jsonSample}</code></pre>
        </div>
      </div>
    </section>
  )
}

