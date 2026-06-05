"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { Reveal } from "./Reveal";
import { SERVICES, SERVICES_HEADER, type Service } from "@/lib/content";

const N = SERVICES.length; // 4

/**
 * Stacked-deck "What we do" — re-skin of the nuvara services block.
 * The 4 services are full-width alternating light/dark cards that pin and
 * stack on top of one another as you scroll; each card scales down + dims as
 * the next lands over it, so the deck edges peek behind. Reduced motion falls
 * back to a plain static column.
 */
export default function ServicesSection() {
  const reduced = useReducedMotion();
  // Gate the reduced-motion swap behind mount so the first client render
  // matches the server (useReducedMotion reads the media query client-side).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const staticOnly = mounted && reduced;

  return (
    <section id="services" className="section-divider relative">
      <div className="bg-mesh opacity-40" aria-hidden />
      {/* header */}
      <div className="relative px-6 pt-20 sm:pt-24 lg:px-12 lg:pt-28">
        <Reveal variant="blur" className="mx-auto max-w-2xl text-center">
          <p className="eyebrow-arrow mb-4 justify-center">{SERVICES_HEADER.bracketLabel}</p>
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            {SERVICES_HEADER.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-text1">
            {SERVICES_HEADER.description}
          </p>
        </Reveal>
      </div>

      {staticOnly ? <StaticColumn /> : <Deck />}
    </section>
  );
}

/* ============================================================
   Stacked deck
   ============================================================ */

function Deck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    // clear lead-in gap below the header before the first card pins
    <div ref={containerRef} className="relative mt-[6vh]">
      {SERVICES.map((s, i) => (
        <DeckCard key={s.id} service={s} index={i} progress={scrollYProgress} />
      ))}
    </div>
  );
}

function DeckCard({
  service,
  index,
  progress,
}: {
  service: Service;
  index: number;
  progress: MotionValue<number>;
}) {
  // Scale down + dim as later cards stack on top. Deeper cards (lower index)
  // shrink more so the stack reads as depth. Input range clamped to [0,1].
  const targetScale = 1 - (N - 1 - index) * 0.04;
  const start = index / N;
  const scale = useTransform(progress, [start, 1], [1, targetScale]);
  const overlay = useTransform(progress, [start, 1], [0, index === N - 1 ? 0 : 0.06]);

  // Canonical stacking deck: each card lives in its own h-screen sticky wrapper
  // (contiguous, so the NEXT card slides up and tightly covers the current one).
  // A per-card downward `top` stagger lets earlier cards peek behind. The last
  // card's wrapper ends the container, so Case Studies scrolls up over it — no
  // gap. (Requires NO overflow-hidden ancestor, or sticky silently breaks.)
  return (
    <div className="sticky top-0 flex h-screen items-center justify-center px-6 lg:px-12">
      <motion.div
        style={{ scale, top: index * 22, transformOrigin: "top center" }}
        className="relative mx-auto w-full max-w-[940px]"
      >
        <Card service={service} index={index} overlay={overlay} />
      </motion.div>
    </div>
  );
}

/* ============================================================
   Card (shared by deck + static fallback)
   ============================================================ */

function Card({
  service,
  index,
  overlay,
}: {
  service: Service;
  index: number;
  overlay?: MotionValue<number>;
}) {
  // Clean white cards, hairline border, soft neutral shadow. Cyan number only.
  return (
    <article
      className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[28px] px-6 py-14 text-center sm:px-12 sm:py-16 lg:min-h-[460px]"
      style={{
        background: "var(--bg-0)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-lift)",
      }}
    >
      {/* subtle recede veil as cards stack behind the next (deck only) */}
      {overlay && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[28px]"
          style={{ background: "#0f172a", opacity: overlay }}
        />
      )}

      <div className="relative max-w-xl">
        <span
          className="font-sans text-sm font-semibold tracking-[0.24em]"
          style={{ color: "var(--cyan-deep)" }}
        >
          {service.number}
        </span>

        <h3
          className="mt-5 font-serif text-4xl font-semibold leading-[1.04] text-text0 sm:text-5xl lg:text-6xl"
        >
          {service.title}
        </h3>

        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-text1 sm:text-lg">
          {service.description}
        </p>

        <p className="mt-9 text-xs font-semibold uppercase tracking-[0.18em] text-text2">
          What&apos;s Included
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          {service.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-sm text-text1"
              style={{ background: "var(--bg-1)", border: "1px solid var(--line)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   Reduced-motion fallback — plain static column
   ============================================================ */

function StaticColumn() {
  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 px-6 py-20 lg:px-12">
      {SERVICES.map((s, i) => (
        <Card key={s.id} service={s} index={i} />
      ))}
    </div>
  );
}
