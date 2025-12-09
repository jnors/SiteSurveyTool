import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'

import './globals.css'
import { Providers } from './providers'
import landingContent from '@/content/landing.json'
import type { LandingContent } from '@/types/landing'
import { PromotionalBanner } from '@/components/promotional-banner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'] })

const landing = landingContent as LandingContent

export const metadata: Metadata = {
  title: 'Offline Site Surveys | FieldPins',
  description: 'Capture floorplans, pins, notes, and photos offline after sign-in. Manual sync keeps everything under your Google Drive.',
  openGraph: {
    title: 'Offline Site Surveys | FieldPins',
    description: 'Capture floorplans, pins, notes, and photos offline after sign-in. Manual sync keeps everything under your Google Drive.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Offline Site Surveys | FieldPins',
    description: 'Capture floorplans, pins, notes, and photos offline after sign-in. Manual sync keeps everything under your Google Drive.',
  },
  generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side fetch for instant initial load
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  let initialSubscriptionStatus = null
  if (session?.user) {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single()
    initialSubscriptionStatus = data?.subscription_status ?? null
  }

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FieldPins',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    publisher: { '@type': 'Organization', name: 'FieldPins' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '214' },
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FieldPins',
    url: 'https://FieldPins.app',
    sameAs: [],
    contactPoint: [{ '@type': 'ContactPoint', email: 'fieldpins@jnors.eu', contactType: 'customer support' }],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: landing.faq.items.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <Providers initialSession={session} initialSubscriptionStatus={initialSubscriptionStatus}>
          <PromotionalBanner subscriptionStatus={initialSubscriptionStatus} />
          {children}
        </Providers>
        <Script id="jsonld-software" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
        <Script id="jsonld-organization" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <Script id="jsonld-faq" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      </body>
    </html>
  )
}
