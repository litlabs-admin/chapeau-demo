/**
 * Chapeau — single source of truth for site copy.
 *
 * VOICE: specific, confident, anti-agency. We sell a senior collective and
 * the systems it builds — not "scale smarter" filler. Avoid: "ambitious",
 * "compounding engine", "world-class", empty superlatives.
 *
 * DATA NOTE: client names, quotes and metrics below are ILLUSTRATIVE
 * PLACEHOLDERS. Replace with real, attributable references before launch —
 * fabricated proof is the fastest way to lose trust (and an awards jury).
 * Keep this file framework-agnostic (no JSX).
 */

export const SITE = {
  name: "Chapeau",
  tagline: "A marketing collective, not an agency.",
  email: "engineering@litlabs.io",
  description:
    "A senior collective of strategists, operators and growth engineers who plug into your team and build the demand systems most companies never get around to.",
  cta: "Start a project",
} as const;

export type NavLink = { label: string; href: string };

export const NAV_LINKS: NavLink[] = [
  { label: "Work", href: "/#work" },
  { label: "Practices", href: "/#services" },
  { label: "Collective", href: "/#testimonials" },
  { label: "Contact", href: "/contact" },
];

/* ── Hero ─────────────────────────────────────────────── */
export const HERO = {
  eyebrow: "The marketing collective",
  // The headline reveal accents the final word — keep the punch word last.
  headline: "Your collective for marketing.",
  subhead:
    "Chapeau assembles strategists, operators and growth engineers into one team that plugs into yours — and builds the demand systems most companies never get to.",
  primary: { label: "Start a project", href: "/contact" },
  secondary: { label: "See the work", href: "/#work" },
} as const;

/* ── Services — the "What we do" centerpiece ──────────── */
export type Service = {
  id: string;
  number: string;
  /** lucide-react icon name */
  icon: string;
  title: string;
  description: string;
  /** "What's Included" tag chips */
  tags: string[];
  /** gradient endpoints for the supporting visual panel */
  visual: [string, string];
};

export const SERVICES_HEADER = {
  bracketLabel: "Practices",
  title: "Four practices. One team.",
  description:
    "We field the four functions that actually move revenue — staffed by people who've done it before, not a pod of juniors learning on your budget.",
} as const;

export const SERVICES: Service[] = [
  {
    id: "b2b",
    number: "001",
    icon: "Building2",
    title: "B2B Growth",
    description:
      "Demand, pipeline and sales enablement for complex sales — built around how your buyers actually decide, not last year's playbook.",
    tags: [
      "Demand generation",
      "Account-based marketing",
      "Sales enablement",
      "Revenue strategy",
      "Pipeline acceleration",
    ],
    visual: ["#00c8d7", "#0f172a"],
  },
  {
    id: "b2c",
    number: "002",
    icon: "Sparkles",
    title: "B2C Marketing",
    description:
      "Acquisition, creative and lifecycle that earn their CAC — performance and brand run as one system instead of two arguing teams.",
    tags: [
      "Performance marketing",
      "Creative campaigns",
      "Lifecycle & retention",
      "Brand growth",
      "Paid social",
    ],
    visual: ["#0aa8b5", "#0f172a"],
  },
  {
    id: "ai",
    number: "003",
    icon: "BrainCircuit",
    title: "AI Solutions",
    description:
      "Agentic workflows, AI-assisted SEO and content systems that take the repetitive 80% off your team's plate — and keep a human on the 20% that matters.",
    tags: [
      "Agentic workflows",
      "AI SEO",
      "Content automation",
      "Marketing automation",
      "AI analytics",
    ],
    visual: ["#00c8d7", "#0a7d88"],
  },
  {
    id: "gtm",
    number: "004",
    icon: "Workflow",
    title: "GTM Engineering",
    description:
      "The plumbing behind growth: lead routing, CRM, attribution and data pipelines wired so your team can trust the numbers and ship weekly.",
    tags: [
      "Lead infrastructure",
      "CRM systems",
      "Data pipelines",
      "Attribution",
      "Growth engineering",
    ],
    visual: ["#0aa8b5", "#0f172a"],
  },
];

/* ── Logo strip ───────────────────────────────────────── */
export const LOGO_STRIP_TITLE = "Trusted by teams who lead growth.";
export const LOGOS = [
  { src: "/logo-stripe1.svg", alt: "Client logo" },
  { src: "/logo-stripe2.svg", alt: "Client logo" },
  { src: "/logo-stripe3.svg", alt: "Client logo" },
  { src: "/logo-stripe4.webp", alt: "Client logo" },
  { src: "/logo-stripe5.webp", alt: "Client logo" },
];

/* ── Case studies ─────────────────────────────────────── */
export type CaseStudy = {
  id: string;
  name: string;
  category: string;
  summary: string;
  /** longer narrative for the detail page */
  challenge?: string;
  approach?: string;
  outcome?: string;
  metrics: { value: string; label: string }[];
  /** gradient endpoints for the abstract placeholder visual */
  gradient: [string, string];
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "roswell",
    name: "Roswell",
    category: "B2B · AI Growth",
    summary:
      "A flat enterprise pipeline that demand gen couldn't unstick — until we rebuilt targeting around intent, not job titles.",
    challenge:
      "Roswell's outbound was spraying a 40,000-account list with one message. Reps chased noise; pipeline stalled two quarters running.",
    approach:
      "We cut the list to 1,200 high-intent accounts, wired intent signals into the CRM, and gave sales a sequence built from their own won-deal language.",
    outcome:
      "Pipeline more than tripled in two quarters and the sales cycle shortened by over a third as reps stopped working dead accounts.",
    metrics: [
      { value: "3.4×", label: "Qualified pipeline" },
      { value: "37%", label: "Shorter sales cycle" },
    ],
    gradient: ["#00c8d7", "#0f172a"],
  },
  {
    id: "openbook",
    name: "OpenBook",
    category: "B2C · Acquisition",
    summary:
      "Paid social was buying installs, not customers. We rebuilt the funnel around the moment users actually saw value.",
    challenge:
      "CAC was climbing 20% a quarter and 60% of new signups never reached the product's core action.",
    approach:
      "We re-sequenced onboarding around first value, moved spend from broad prospecting to lookalikes of activated users, and automated lifecycle nudges.",
    outcome:
      "Conversion roughly doubled and blended CAC fell as spend followed users who actually stuck around.",
    metrics: [
      { value: "2.1×", label: "Signup → activation" },
      { value: "−38%", label: "Blended CAC" },
    ],
    gradient: ["#0aa8b5", "#0f172a"],
  },
  {
    id: "racam",
    name: "Racam",
    category: "GTM · Engineering",
    summary:
      "A growth team buried in manual ops. We engineered the plumbing so the work runs itself and people do the thinking.",
    challenge:
      "Leads were routed by hand, attribution was a spreadsheet nobody trusted, and campaigns took a week to ship.",
    approach:
      "We rebuilt routing, CRM and attribution into one pipeline, then layered agentic workflows over the repetitive steps.",
    outcome:
      "The team got back roughly 31 hours a week and finally measured spend against revenue it could defend.",
    metrics: [
      { value: "31 hrs", label: "Reclaimed weekly" },
      { value: "4.2×", label: "Return on spend" },
    ],
    gradient: ["#00c8d7", "#0a7d88"],
  },
];

/* ── Testimonials ─────────────────────────────────────── */
export type Testimonial = {
  quote: string;
  blurb: string;
  name: string;
  role: string;
  /** portrait image (mock) */
  portrait: string;
  /** supporting outcome metrics */
  stats: { value: string; label: string }[];
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "They learned our business in a week and shipped in three.",
    blurb:
      "We'd interviewed two agencies that wanted a six-week discovery phase. Chapeau sat in our standups, found the leak in our funnel, and fixed it before the others would have finished their decks.",
    name: "Elena Voss",
    role: "Founder, Vantage",
    portrait:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80&auto=format&fit=crop",
    stats: [
      { value: "3.4×", label: "Qualified pipeline" },
      { value: "30 hrs", label: "Reclaimed / week" },
      { value: "37%", label: "Shorter sales cycle" },
      { value: "4.2×", label: "Return on spend" },
    ],
  },
  {
    quote: "Senior people on every front, none of the agency overhead.",
    blurb:
      "I got a strategist, a performance lead and an AI engineer who actually talk to each other. No account manager relaying messages, no junior learning on our budget. It's the model I wish existed at my last three companies.",
    name: "Marcus Reed",
    role: "CMO, Northwind",
    portrait:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&q=80&auto=format&fit=crop",
    stats: [
      { value: "2.1×", label: "Activation rate" },
      { value: "−38%", label: "Blended CAC" },
      { value: "$240k", label: "Saved vs. agency" },
      { value: "6 wks", label: "To first results" },
    ],
  },
  {
    quote: "A year later the systems they built are still paying us back.",
    blurb:
      "Leads route themselves, campaigns ship weekly, and my team spends its time on strategy instead of spreadsheets. The infrastructure didn't decay the moment they left — that's the part most agencies can't do.",
    name: "Priya Nair",
    role: "VP Growth, Meridian",
    portrait:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=900&q=80&auto=format&fit=crop",
    stats: [
      { value: "31 hrs", label: "Reclaimed / week" },
      { value: "5.0×", label: "Qualified leads" },
      { value: "3.2×", label: "Faster response" },
      { value: "120%", label: "Net revenue retention" },
    ],
  },
];

/* ── Footer CTA ───────────────────────────────────────── */
export const FOOTER_CTA = {
  headline: "Tell us what's slowing growth.",
  subhead:
    "Send us the bottleneck you can't crack. We'll come back with where we'd start — no deck, no discovery retainer.",
  cta: { label: "Start a project", href: "/contact" },
} as const;

/* ── Footer ───────────────────────────────────────────── */
export type FooterColumn = { title: string; links: NavLink[] };

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Company",
    links: [
      { label: "The collective", href: "/#testimonials" },
      { label: "Selected work", href: "/#work" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Practices",
    links: [
      { label: "B2B Growth", href: "/#services" },
      { label: "B2C Marketing", href: "/#services" },
      { label: "AI Solutions", href: "/#services" },
      { label: "GTM Engineering", href: "/#services" },
    ],
  },
  {
    title: "Work",
    links: [
      { label: "Roswell", href: "/work/roswell" },
      { label: "OpenBook", href: "/work/openbook" },
      { label: "Racam", href: "/work/racam" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "engineering@litlabs.io", href: "mailto:engineering@litlabs.io" },
      { label: "Start a project", href: "/contact" },
    ],
  },
];

export const SOCIALS: NavLink[] = [
  { label: "LinkedIn", href: "#" },
  { label: "X / Twitter", href: "#" },
  { label: "Instagram", href: "#" },
];
