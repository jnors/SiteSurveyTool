import Link from 'next/link'

import type { DriveProofProps } from '@/types/landing'

type DriveProofSectionProps = {
  data: DriveProofProps
}

export function DriveProof({ data }: DriveProofSectionProps) {
  return (
    <section id="drive-proof" className="border-t border-border/40 bg-background/80 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid w-full gap-4 md:grid-cols-2 md:gap-6">
          {/* Your Drive Card */}
          <div className="min-w-0 rounded-xl border border-border/40 bg-background-elevated/70 p-4 sm:p-6">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm">
              Your Drive
            </span>
            <p className="mt-2 w-full break-words text-sm text-foreground-muted sm:mt-3 sm:text-base">
              We sync to folders you own. You can verify and share directly from Drive.
            </p>
            <div className="mt-3 w-full overflow-x-auto sm:mt-4">
              <pre className="w-max max-w-full rounded-lg border border-border/40 bg-background p-3 text-xs text-foreground-subtle sm:p-4 sm:text-sm">
                <code>{data.folderPathExample}</code>
              </pre>
            </div>
            <ul className="mt-3 w-full space-y-1.5 text-xs text-foreground-muted sm:mt-4 sm:space-y-2 sm:text-sm">
              {data.bullets.map((b) => (
                <li key={b} className="flex w-full gap-2">
                  <span aria-hidden className="shrink-0">
                    •
                  </span>
                  <span className="min-w-0 flex-1 break-words">{b}</span>
                </li>
              ))}
            </ul>
            {data.learnMoreHref ? (
              <div className="mt-3 text-xs sm:mt-4 sm:text-sm">
                <Link href={data.learnMoreHref} className="text-primary hover:text-primary/80">
                  See what we write →
                </Link>
              </div>
            ) : null}
          </div>

          {/* Project JSON Card */}
          <div className="min-w-0 rounded-xl border border-border/40 bg-background-elevated/70 p-4 sm:p-6">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground-subtle sm:text-sm">
              project.json
            </span>
            <p className="mt-2 w-full break-words text-sm text-foreground-muted sm:mt-3 sm:text-base">
              Written last to ensure consistency.
            </p>
            <div className="mt-3 w-full overflow-x-auto sm:mt-4">
              <pre className="max-h-[200px] overflow-y-auto rounded-lg border border-border/40 bg-background p-3 text-[10px] leading-relaxed text-foreground-subtle sm:max-h-[280px] sm:p-4 sm:text-xs">
                <code className="block whitespace-pre-wrap break-all">{data.jsonSample}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
