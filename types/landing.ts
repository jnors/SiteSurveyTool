import type React from 'react'

export type CtaVariant = 'primary' | 'secondary' | 'ghost'

export interface CtaButtonProps {
  label: string
  href?: string
  onClickEventName?: string
  iconLeft?: React.ReactNode
  variant?: CtaVariant
  size?: 'sm' | 'md' | 'lg'
  ariaLabel?: string
  as?: 'a' | 'button'
  disabled?: boolean
}

export interface MediaAsset {
  type: 'image' | 'video'
  src: string
  alt?: string
  width?: number
  height?: number
}

export interface HeroProps {
  eyebrow?: string
  headline: string
  subheadline: string
  primaryCta: CtaButtonProps
  secondaryCta?: CtaButtonProps
  media: MediaAsset
  trustBadges?: Array<{ src: string; alt: string }>
}

export interface ProblemValueProps {
  before: string[]
  after: string[]
}

export interface Feature {
  id: string
  title: string
  benefit: string
  icon?: React.ReactNode
  image?: { src: string; alt: string }
  learnMoreHref?: string
}

export interface FeatureGridProps {
  features: Feature[]
  columns?: 3 | 4
}

export interface HowItWorksProps {
  title: string
  steps: string[]
}

export interface SecurityPoint {
  title: string
  description: string
}

export interface SecurityProps {
  title: string
  intro?: string
  items: SecurityPoint[]
}

export interface FaqItem {
  q: string
  a: string
}

export interface FaqProps {
  title: string
  items: FaqItem[]
}

export interface FinalCtaProps {
  headline: string
  subheadline?: string
  primaryCta: CtaButtonProps
  secondaryCta?: CtaButtonProps
}

// New landing sections for refined layout
export interface PillarItem {
  id: string
  title: string
  summary: string
}

export interface PillarsProps {
  items: PillarItem[]
}

export interface DriveProofProps {
  title?: string
  folderPathExample: string
  bullets: string[]
  jsonSample: string
  learnMoreHref?: string
}

export interface SpecsGridProps {
  title?: string
  items: Feature[]
}

export interface ScreenshotItem {
  src: string
  alt?: string
  width?: number
  height?: number
  caption?: string
}

export interface ScreensProps {
  title?: string
  items: ScreenshotItem[]
}

export interface LandingContent {
  hero: HeroProps
  // legacy fields kept for compatibility in case content files still include them
  problemValue?: ProblemValueProps
  features?: Feature[]
  // new sections
  pillars: PillarsProps
  driveProof: DriveProofProps
  specs: SpecsGridProps
  screens?: ScreensProps
  howItWorks: HowItWorksProps
  security: SecurityProps
  faq: FaqProps
  finalCta: FinalCtaProps
}
