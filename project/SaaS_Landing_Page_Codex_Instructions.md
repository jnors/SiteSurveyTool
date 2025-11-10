# SaaS Landing Page — Codex CLI Instructions (Implementation Playbook)

**Objective:** Implement a conversion‑optimized SaaS landing page (Next.js + Tailwind + shadcn/ui) using Codex CLI agents.  
**Primary CTA (choose one):** Start free trial • Book demo • Join waitlist • Install app.

---

## 0) Repository assumptions

- Stack: **Next.js (App Router, TypeScript)**, **TailwindCSS**, **shadcn/ui**, **lucide-react**.
- Node ≥ 18, pnpm or npm.
- Folder roots assume `/app` (App Router) and `/components`.
- All code must be **accessible**, **performant**, and **instrumented** (see §7, §9, §10).

---

## 1) Top‑level goals & KPIs

- **Primary goal:** Single dominant action repeated across the page.
- **Secondary goals:** Micro‑conversions (video, pricing, email capture).
- **KPIs:** Primary CTR, sign‑up/demo rate, bounce ≤ 35%, **LCP ≤ 1.8s (4G)**, **INP ≤ 200ms**, **CLS ≤ 0.1**.

---

## 2) Information architecture (rendered order)

1. Sticky **Nav**
2. **Hero** (above the fold)
3. **Trust bar** (logos / ratings)
4. **Problem → Value** (before/after)
5. **Key features** (3–6 benefit‑led cards)
6. **Social proof** (quotes + hard metrics)
7. **Integrations** (logos + search)
8. **How it works** (3 steps)
9. **Interactive proof** (Live demo or ROI calc)
10. **Pricing** (teaser or table)
11. **Comparison** vs alternatives (incl. “Do nothing”)
12. **Security & compliance**
13. **FAQ** (objection handling + schema)
14. **Final CTA**
15. **Footer** (links, legal, contact)

**Rationale:** Mirrors buyer journey: trust → problem fit → solution fit → proof → cost → risk removal → action.

---

## 3) Deliverables (files Codex must create)

> All paths are relative to repo root.

- `app/page.tsx` — Page composition using components below (server component).
- `components/landing/Hero.tsx`
- `components/landing/TrustBar.tsx`
- `components/landing/FeatureGrid.tsx`
- `components/landing/Testimonials.tsx`
- `components/landing/Integrations.tsx`
- `components/landing/HowItWorks.tsx`
- `components/landing/RoiCalculator.tsx` (client component, loads on interaction)
- `components/landing/PricingTable.tsx`
- `components/landing/ComparisonTable.tsx`
- `components/landing/Security.tsx`
- `components/landing/Faq.tsx`
- `components/landing/FinalCta.tsx`
- `lib/analytics.ts` — data‑layer event helper (see §9).
- `lib/roi.ts` — ROI math (see §8).
- `content/landing.json` — content seed (see §11).
- `app/opengraph-image.png` — OG image (placeholder).
- `app/robots.txt`, `app/sitemap.xml` (generated or static).
- `app/layout.tsx` — includes SEO tags (see §7) and font preloads.
- `__tests__/landing.spec.ts` — Playwright smoke tests (see §12).
- `public/logos/*.svg` — sample logos for trust & integrations.

---

## 4) Component contracts (TypeScript props)

Create the following types in `types/landing.ts` and import them in components.

```ts
// Buttons
export type CtaVariant = "primary" | "secondary" | "ghost";
export interface CtaButtonProps {
  label: string;
  href?: string;
  onClickEventName?: string; // e.g., "cta_click_hero_primary"
  iconLeft?: React.ReactNode;
  variant?: CtaVariant;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
  as?: "a" | "button";
  disabled?: boolean;
}

// Hero
export interface HeroProps {
  eyebrow?: string;
  headline: string;          // ≤ 9 words
  subheadline: string;       // ≤ 18 words
  primaryCta: CtaButtonProps;
  secondaryCta?: CtaButtonProps;
  media: { type: "image" | "video"; src: string; alt?: string; width?: number; height?: number };
  trustBadges?: Array<{ src: string; alt: string }>;
}

// Feature card
export interface Feature {
  id: string;
  title: string;
  benefit: string;           // measurable if possible
  icon?: React.ReactNode;
  image?: { src: string; alt: string };
  learnMoreHref?: string;
}
export interface FeatureGridProps { features: Feature[]; columns?: 3 | 4; }

// Testimonial
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarSrc?: string;
  metric?: { label: string; value: string }; // e.g., {label: "Resolution time", value: "-42%"}
}
export interface TestimonialCarouselProps { items: Testimonial[]; auto?: boolean; }

// Pricing
export interface Plan {
  id: string;
  name: string;
  priceMonthly?: number;
  priceYearly?: number;
  priceNote?: string;        // “Contact sales”
  mostPopular?: boolean;
  cta: CtaButtonProps;
  includes: string[];
  excludes?: string[];
}
export interface PricingTableProps { plans: Plan[]; yearlyDefault?: boolean; featureRows?: string[]; }

// ROI
export interface RoiInput {
  teamSize: number; avgHourlyCost: number; baselineHoursPerWeek: number; expectedReductionPct: number;
}
export interface RoiCalculatorProps {
  defaults: RoiInput;
  onCalculate?: (input: RoiInput) => { weeklySavingsHours: number; annualSavingsEUR: number };
}

// FAQ
export interface FaqItem { q: string; a: string; }
export interface FaqProps { items: FaqItem[]; }
```

---

## 5) Acceptance criteria per section

### Nav
- Minimal links: Product, Pricing, Customers, Docs, Blog, **Sign in**, **Primary CTA**.
- Sticky; reduces height on scroll; mobile drawer.
- **Primary CTA visible ≥ 90% of viewport time**.

### Hero
- H1 ≤ 9 words; subhead ≤ 18 words; buttons above the fold on 360px width.
- Media is ≤ 180KB; `priority` LCP (image or H1).
- Include trust badges inline.

### Trust bar
- 5–10 logos; inline SVG or sprite; no carousels on mobile.

### Problem → Value
- 3 “Before” bullets and 3 “After” bullets; each ≤ 12 words; verbs first.

### Key features
- 3–6 cards; copy is benefit‑led and measurable; screenshots lazy‑load with blur‑up.

### Social proof
- At least one hard metric per block; alt text for avatars; company + role present.

### Integrations
- 8–20 logos; searchable; tooltip shows name + one‑line value.

### How it works
- 3 steps (< 20 words each); no step requires sales call unless primary goal is demo.

### Interactive proof
- **Option A** live sandbox (read‑only tour 3–5 steps) **or** **Option B** ROI calculator.
- Analytics events fire on interactions (see §9).

### Pricing
- 3 tiers if self‑serve; Monthly/Yearly toggle; one plan marked **Most popular**.
- Benefit‑led rows; clear “What’s included” and “What’s not.”

### Comparison
- Table includes Your SaaS vs two competitors vs “Do nothing.”
- No unverifiable claims; link to “How we compare” page if available.

### Security & compliance
- SOC2/ISO/GDPR badges as applicable; link to security whitepaper and DPA contact.

### FAQ
- 5–10 Q&A; answers ≤ 80 words; marked up with FAQPage schema (§7).

### Final CTA
- Repeats primary goal; above footer; no extra links.

### Footer
- Product, Company, Resources, Legal; address; language switcher; social links.

---

## 6) Design & UX tokens (Tailwind)

- Spacing: 4/8/12/16/24/32/48/64
- Type: H1 48–56/1.1, H2 32/1.15, Body 16/1.6, Caption 14/1.4
- Buttons: 44×44 px min tap; contrast ≥ 4.5:1
- Grid: max‑w 1200px; 12‑col; 24px gutters; mobile 1‑col
- States: `:hover`, `:focus-visible`, `:disabled`; async buttons show spinners

---

## 7) SEO & social (must‑haves)

- Title ≤ 60 chars: “{Outcome} for {Persona} | {Brand}”
- Meta description ≤ 155 chars with primary keyword.
- Canonical set; avoid duplicate param indexing.
- Schema JSON‑LD: **SoftwareApplication**, **Organization**, and **FAQPage** (if used).
- OpenGraph/Twitter: og:title/description/image (1200×630), `twitter:card=summary_large_image`.
- Sitemap includes `/`, `/pricing`, `/customers`, `/integrations`, `/security`, `/blog/*`.
- Robots: allow default; disallow `/api`, `/admin`.

**JSON‑LD templates (add in `app/layout.tsx` or per page):**

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ProductName",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
  "publisher": { "@type": "Organization", "name": "Company Name" },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "214" }
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type":"Question","name":"Do I need a credit card?","acceptedAnswer":{"@type":"Answer","text":"No. The 14-day trial requires no card."}}
  ]
}
```

---

## 8) ROI calculator logic (`lib/roi.ts`)

```ts
export type RoiInput = {
  teamSize: number;
  avgHourlyCost: number;
  baselineHoursPerWeek: number;
  expectedReductionPct: number;
};

export function calcRoi(input: RoiInput) {
  const weeklyHoursSaved = input.baselineHoursPerWeek * (input.expectedReductionPct / 100);
  const annualSavingsEUR = weeklyHoursSaved * input.teamSize * input.avgHourlyCost * 48; // 48 working weeks
  return { weeklySavingsHours: Math.round(weeklyHoursSaved), annualSavingsEUR: Math.round(annualSavingsEUR) };
}
```

---

## 9) Analytics & experimentation (`lib/analytics.ts`)

- Add a simple data‑layer emitter and call it from CTA clicks, ROI events, video plays, pricing toggles.

```ts
type AnalyticsPayload = Record<string, unknown> & { event: string };

export function track(payload: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(payload);
}
```

**Event examples:**

```js
track({ event: "cta_click", location: "hero", variant: "primary", label: "start_free_trial" });
track({ event: "roi_calculated", teamSize: 12, reductionPct: 40 });
track({ event: "pricing_toggle", yearly: true });
```

**Experiment flags:** expose `process.env.NEXT_PUBLIC_EXP_HERO_VARIANT` and branch in `Hero`.

---

## 10) Performance & accessibility budgets

- **Budgets:** LCP ≤ 1.8s (4G), CLS ≤ 0.1, INP ≤ 200ms, TTI ≤ 3.5s.
- **Assets:** Hero ≤ 180KB; total ≤ 1600KB; defer non‑critical JS; `next/image` w/ AVIF/WebP.
- **Fonts:** Preload; use `display=swap`; system fallback.
- **A11y:** Keyboard navigation, `:focus-visible`, semantic landmarks, aria labels, color contrast ≥ 4.5:1.
- **Testing:** Run Lighthouse CI and Axe; fix all critical issues.

---

## 11) Content seed (`content/landing.json`)

```json
{
  "hero": {
    "headline": "Ship features 3× faster",
    "subheadline": "Coordinate product, design, and engineering without the handoff chaos.",
    "primaryCta": { "label": "Start free — no card", "href": "/signup", "onClickEventName": "cta_click_hero_primary" },
    "secondaryCta": { "label": "Watch 2‑min demo", "href": "#demo", "onClickEventName": "cta_click_hero_secondary" },
    "media": { "type": "image", "src": "/img/hero-ui.avif", "alt": "Product UI" },
    "trustBadges": [{ "src": "/logos/acme.svg", "alt": "Acme" }]
  },
  "features": [
    { "id": "workflows", "title": "Automated workflows", "benefit": "Remove handoffs and cut cycle time by 65%", "image": { "src": "/img/feat-workflows.webp", "alt": "Workflow builder" } },
    { "id": "ai-insights", "title": "AI insights", "benefit": "Spot blockers before they delay releases", "image": { "src": "/img/feat-ai.webp", "alt": "AI insights" } }
  ],
  "testimonials": [
    { "quote": "We ship in days, not weeks.", "author": "Ana Costa", "role": "VP Product", "company": "ZebraPay", "metric": { "label": "Cycle time", "value": "-42%" } }
  ],
  "faq": [
    { "q": "Do I need a credit card?", "a": "No. The 14‑day trial requires no credit card." },
    { "q": "Can I cancel anytime?", "a": "Yes. Cancel from your account with no fees." }
  ]
}
```

---

## 12) Testing (Playwright smoke)

Create `__tests__/landing.spec.ts` to validate core conversion paths.

- Page loads and LCP element exists.
- Primary CTA visible above the fold on 360px width.
- Pricing toggle works and fires `pricing_toggle`.
- ROI calculator computes a value and fires `roi_calculated`.
- FAQ expands/collapses and has JSON‑LD in DOM.

---

## 13) Definition of Ready (DoR)

- [ ] Primary CTA chosen and copy approved.
- [ ] Trust logos provided (SVG) and permitted for use.
- [ ] At least 3 measurable benefits and 1 case metric available.
- [ ] Pricing model decision (self‑serve vs sales‑led).
- [ ] Security posture (badges/claims) validated with legal.

---

## 14) Definition of Done (DoD)

- [ ] Above‑the‑fold shows H1 + CTA on 360px.
- [ ] Trust bar ≥ 5 logos; compressed SVG.
- [ ] ≥ 1 testimonial with hard metric.
- [ ] Pricing “Most popular” present; yearly toggle (if self‑serve).
- [ ] FAQ with schema; answers ≤ 80 words.
- [ ] Data layer events visible in GTM preview.
- [ ] LCP ≤ 1.8s (4G), CLS ≤ 0.1 (emulated).
- [ ] Axe: 0 critical a11y issues.
- [ ] Robots/sitemap working; 404/500 branded.
- [ ] Cookie consent implemented (if using ads/trackers).

---

## 15) Codex CLI — Agent tasks

> Use your existing agents (e.g., **ProductOwner**, **Developer**, **SEOAnalyst**, **QA**) and paste tasks below into Codex CLI.

### 15.1 ProductOwner — Brief & acceptance
- Align on goal, persona, primary CTA.
- Approve copy skeleton (H1, subhead, 3 benefits, 1 hard metric).
- Output: Update `content/landing.json` with approved copy.

### 15.2 Developer — Scaffolding & components
- Install deps: `tailwindcss`, `@radix-ui/react-*`, `lucide-react`, `class-variance-authority`, `next`.
- Init shadcn/ui and Tailwind; set base tokens (see §6).
- Create files listed in §3 with prop contracts (§4).
- Wire events using `lib/analytics.ts` (§9).
- Lazy‑hydrate ROI only on interaction; `next/dynamic` if needed.
- Enforce budgets (§10).

### 15.3 SEOAnalyst — Metadata & schema
- Implement meta title/description; canonical.
- Add JSON‑LD for SoftwareApplication, Organization, FAQPage.
- Verify OpenGraph/Twitter tags.

### 15.4 QA — Perf, a11y, E2E
- Run Lighthouse and Axe; fix critical issues.
- Implement Playwright tests (§12).
- Verify data‑layer events in browser.

---

## 16) Copywriting rules (apply across components)

- H1 ≤ 9 words; sentences ≤ 18 words; bullets ≤ 12 words.
- Benefit‑first copy with numbers where possible.
- CTA examples: “Start free — no card”, “Book a 20‑min demo”.

---

## 17) Comparison table template (Markdown)

| Criteria | Your SaaS | Competitor A | Competitor B | Doing nothing |
|---|---|---|---|---|
| Setup time | Under 10 minutes | Weeks | Days | 0 |
| Automation depth | Advanced (branching) | Basic | Medium | None |
| SSO/SAML | Yes | Add‑on | No | N/A |
| Cost (team of 20) | €…/mo | €…/mo | €…/mo | Hidden time cost |

---

## 18) A/B test backlog (hypothesis → metric → target)

1. **Short vs long hero subhead** → CTR ↑ → +10% hero clicks.
2. **“No card” badge presence** → Signup rate ↑ → +8% trials.
3. **ROI inline vs modal** → Lead submit rate ↑ → +12%.
4. **Social proof near hero vs mid page** → Time‑to‑first‑click ↓ 15%.
5. **Pricing “Most popular” badge** → Plan selection ↑ 10%.

---

## 19) Implementation notes (Next.js)

- App Router with server components; `next/image` for media.
- Preload hero image; defer non‑critical JS; avoid large client bundles.
- Use shadcn/ui for Card/Accordion/Dialog; `prefetch={false}` for non‑critical links.
- External links `rel="noopener"`.

---

### End of Playbook
