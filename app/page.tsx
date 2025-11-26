import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

import { OfflineBanner, FinalCta, Faq, Hero, HowItWorks, Security, Pillars, DriveProof, SpecsGrid, Screens, Button } from "@/ui"
import { Demo } from "@/components/landing/Demo"
import { Pricing } from "@/components/landing/Pricing"
import type { LandingContent } from "@/types/landing"
import landingContent from "@/content/landing.json"

const content = landingContent as LandingContent

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/projects")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Image src="/images/favicon.svg" alt="FieldPins logo" width={36} height={36} className="h-9 w-9" />
            <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">FieldPins</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="#benefits" className="transition-colors hover:text-primary">
              Product
            </Link>
            <Link href="#offline" className="transition-colors hover:text-primary">
              Offline guide
            </Link>
            <Link href="#faq" className="transition-colors hover:text-primary">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="hidden text-muted-foreground transition-colors hover:text-primary md:inline-flex"
            >
              <Link href="#offline">Learn offline</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="border border-primary/20 bg-primary text-primary-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-primary/90"
            >
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
        <Demo />
        <Pillars data={content.pillars} />
        <HowItWorks data={content.howItWorks} />
        {content.screens ? <Screens data={content.screens} /> : null}
        <DriveProof data={content.driveProof} />
        <SpecsGrid data={content.specs} />
        <Pricing />
        <Security data={content.security} />
        <Faq data={content.faq} />
        <FinalCta data={content.finalCta} />
      </main>
      <footer className="border-t border-border/40 bg-background/95 px-6 py-8 text-sm text-muted-foreground backdrop-blur-md sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-tight text-foreground">FieldPins</span>
            <span className="text-muted-foreground">Manual sync • Offline after sign-in • JSON export</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="#benefits" className="transition-colors hover:text-primary">
              Product
            </Link>
            <Link href="#offline" className="transition-colors hover:text-primary">
              Offline & privacy
            </Link>
            <Link href="#faq" className="transition-colors hover:text-primary">
              FAQ
            </Link>
            <Link href="mailto:hello@sitetrace.app" className="transition-colors hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
