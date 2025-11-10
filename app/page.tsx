import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { OfflineBanner } from '@/components/offline-banner'
import { FinalCta } from '@/components/landing/FinalCta'
import { Faq } from '@/components/landing/Faq'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Security } from '@/components/landing/Security'
import { Pillars } from '@/components/landing/Pillars'
import { DriveProof } from '@/components/landing/DriveProof'
import { SpecsGrid } from '@/components/landing/SpecsGrid'
import { Screens } from '@/components/landing/Screens'
import { Button } from '@/components/ui/button'
import { authOptions } from '@/lib/auth'
import type { LandingContent } from '@/types/landing'
import landingContent from '@/content/landing.json'

const content = landingContent as LandingContent

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/projects')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/favicon.svg" alt="FieldPin logo" width={36} height={36} className="h-9 w-9" />
            <span className="text-base font-semibold text-foreground sm:text-lg">FieldPin</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-foreground-muted md:flex">
            <Link href="#benefits" className="transition hover:text-foreground">
              Product
            </Link>
            <Link href="#offline" className="transition hover:text-foreground">
              Offline guide
            </Link>
            <Link href="#faq" className="transition hover:text-foreground">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex text-primary hover:text-primary/80">
              <Link href="#offline">Learn offline</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80">
              <Link href="#cta">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>
      <OfflineBanner
        message="You're offline. Sign-in requires connectivity. Capture resumes after you reconnect."
        analyticsEventName="offline_banner_seen"
      />
      <main className="flex flex-1 flex-col">
        <Hero data={content.hero} />
        <Pillars data={content.pillars} />
        <HowItWorks data={content.howItWorks} />
        {content.screens ? <Screens data={content.screens} /> : null}
        <DriveProof data={content.driveProof} />
        <SpecsGrid data={content.specs} />
        <Security data={content.security} />
        <Faq data={content.faq} />
        <FinalCta data={content.finalCta} />
      </main>
      <footer className="border-t border-border/40 bg-background/80 px-6 py-8 text-sm text-foreground-muted sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground">FieldPin</span>
            <span className="text-foreground-subtle">Manual sync • Offline after sign-in • JSON export</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="#benefits" className="hover:text-foreground">
              Product
            </Link>
            <Link href="#offline" className="hover:text-foreground">
              Offline & privacy
            </Link>
            <Link href="#faq" className="hover:text-foreground">
              FAQ
            </Link>
            <Link href="mailto:hello@sitetrace.app" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
