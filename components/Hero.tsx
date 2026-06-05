"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { MagneticButton } from "./MagneticButton";
import { HERO, SERVICES } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Word-by-word mask reveal; the final word gets the cyan accent. */
function HeadlineReveal({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="display text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem]">
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          // pb gives the overflow-hidden reveal mask room for descenders (g, p, y)
          <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.18em]">
            <motion.span
              className="inline-block"
              style={isLast ? { color: "var(--cyan-deep)" } : undefined}
              initial={{ y: "115%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 + i * 0.09, ease: EASE }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        );
      })}
    </h1>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-6 pb-16 pt-32 lg:px-12 lg:pb-24 lg:pt-40"
    >
      <div className="bg-mesh" aria-hidden />
      <div className="bg-grid bg-grid-fade absolute inset-0 -z-10" aria-hidden />

      <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* ── Left: content ── */}
        <motion.div style={{ y: contentY }} className="lg:col-span-6">
          <motion.div
            className="glass-panel mb-7 inline-flex items-center gap-2.5 rounded-full px-4 py-1.5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span
              className="inline-flex h-2 w-2 rounded-full"
              style={{ background: "var(--cyan)", boxShadow: "0 0 0 4px rgba(0,200,215,0.18)" }}
            />
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-text1">
              Now partnering with select brands
            </span>
          </motion.div>

          <HeadlineReveal text={HERO.headline} />

          <motion.p
            className="mt-7 max-w-lg text-lg leading-relaxed text-text1 sm:text-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
          >
            {HERO.subhead}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
          >
            <MagneticButton href={HERO.primary.href}>{HERO.primary.label}</MagneticButton>
            <MagneticButton href={HERO.secondary.href} variant="ghost" arrow={false}>
              {HERO.secondary.label}
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* ── Right: gradient glass result panel ── */}
        <motion.div
          style={{ y: visualY }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.35, ease: EASE }}
          className="lg:col-span-6"
        >
          <HeroPanel />
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Editorial "collective index" — the four practices set as a numbered
 * masthead ledger (echoing the 001–004 service system) rather than a generic
 * SaaS UI mockup. Subtle pointer-tracked 3D tilt; a circumflex brand stamp
 * (chapeau = the "^" accent in French typography) floats above the panel.
 */
function HeroPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 18 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative aspect-4/3.4 w-full overflow-hidden rounded-[28px] sm:aspect-4/3"
      style={{
        background:
          "radial-gradient(130% 120% at 18% 12%, rgba(0,200,215,0.10), transparent 60%), linear-gradient(160deg, #f8fbfc, #f3f6fa)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-soft)",
        perspective: 1200,
      }}
    >
      {/* faint grid texture for depth */}
      <div className="bg-grid bg-grid-fade absolute inset-0 opacity-60" aria-hidden />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="absolute inset-0 flex items-center justify-center p-6 sm:p-10"
      >
        {/* the index card */}
        <div
          className="glass-panel w-full max-w-110 rounded-[22px] px-6 py-6 sm:px-7"
          style={{ transform: "translateZ(40px)" }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="eyebrow">The collective</span>
            <span
              className="font-serif text-2xl leading-none"
              style={{ color: "var(--cyan-deep)" }}
              aria-hidden
            >
              ˆ
            </span>
          </div>

          <ul className="mt-2">
            {SERVICES.map((s) => (
              <li
                key={s.id}
                className="flex items-baseline justify-between gap-4 border-t py-3.5"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="font-sans text-[0.7rem] font-semibold tracking-[0.2em]"
                  style={{ color: "var(--cyan-deep)" }}
                >
                  {s.number}
                </span>
                <span className="flex-1 text-right font-serif text-xl font-medium text-text0">
                  {s.title}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-text1">Four practices, one team.</span>
            <span
              className="inline-flex h-2 w-2 rounded-full"
              style={{ background: "var(--cyan)", boxShadow: "0 0 0 4px rgba(0,200,215,0.16)" }}
            />
          </div>
        </div>

        {/* floating brand stamp — the chapeau */}
        <motion.div
          className="glass-panel absolute right-5 top-5 flex items-center gap-2.5 rounded-2xl px-4 py-3 sm:right-8 sm:top-8"
          style={{ transform: "translateZ(80px)" }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg font-serif text-lg text-white"
            style={{ background: "var(--cyan-deep)" }}
            aria-hidden
          >
            ˆ
          </span>
          <div>
            <p className="text-[11px] leading-none text-text2">Hats off to</p>
            <p className="mt-1 text-sm font-semibold leading-none text-text0">good growth</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
