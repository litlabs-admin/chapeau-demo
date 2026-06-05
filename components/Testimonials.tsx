"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { TESTIMONIALS } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Agentik-style "client success" carousel: a large two-column block
 * (portrait + quote + 2×2 stat grid), 3 testimonials auto-advancing with
 * smooth transitions, plus dots + prev/next. Pauses on hover; static under
 * reduced motion.
 */
export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const count = TESTIMONIALS.length;

  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => clearInterval(id);
  }, [paused, reduced, count]);

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);
  const t = TESTIMONIALS[index];

  return (
    <section
      id="testimonials"
      className="section-divider w-full py-20 sm:py-24 lg:py-32"
      style={{ background: "var(--bg-1)" }}
    >
      <div className="mx-auto w-full px-6 lg:px-12">
        <Reveal variant="blur" className="mb-14 max-w-2xl text-center mx-auto lg:mb-16">
          <p className="eyebrow-arrow mb-4 justify-center">Client success</p>
          <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
            Trusted by the people who{" "}
            <span className="italic" style={{ color: "var(--cyan-deep)" }}>lead growth</span>
          </h2>
        </Reveal>

        <Reveal
          className="relative mx-auto max-w-[1040px] overflow-hidden rounded-[28px]"
        >
          <div
            className="relative"
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              boxShadow: "var(--shadow-soft)",
              borderRadius: "28px",
            }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: reduced ? 0 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduced ? 0 : -40 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="grid grid-cols-1 lg:grid-cols-2"
              >
                {/* portrait */}
                <div className="relative min-h-[280px] lg:min-h-[460px]">
                  <Image
                    src={t.portrait}
                    alt={t.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 55%, rgba(15,23,42,0.45))",
                    }}
                  />
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                    <div>
                      <p className="font-medium text-white">{t.name}</p>
                      <p className="text-sm text-white/75">{t.role}</p>
                    </div>
                  </div>
                </div>

                {/* content */}
                <div className="flex flex-col justify-center gap-6 p-8 sm:p-10 lg:p-12">
                  <blockquote className="font-serif text-2xl leading-snug text-text0 sm:text-3xl">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <p className="text-base leading-relaxed text-text1">{t.blurb}</p>

                  {/* 2×2 stat grid */}
                  <div
                    className="mt-2 grid grid-cols-2 overflow-hidden rounded-2xl"
                    style={{ border: "1px solid var(--line)" }}
                  >
                    {t.stats.map((s, i) => (
                      <div
                        key={s.label}
                        className="p-4 sm:p-5"
                        style={{
                          borderLeft: i % 2 === 1 ? "1px solid var(--line)" : "none",
                          borderTop: i >= 2 ? "1px solid var(--line)" : "none",
                        }}
                      >
                        <p className="font-serif text-2xl font-semibold text-text0 sm:text-3xl">
                          {s.value}
                        </p>
                        <p className="mt-1 text-xs text-text2 sm:text-sm">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* controls */}
          <div className="mt-6 flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={() => go(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text1 transition-colors hover:text-text0"
              style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
            >
              <ArrowLeft size={16} />
            </button>

            <div className="flex items-center gap-2.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: i === index ? 26 : 8,
                    background: i === index ? "var(--cyan-deep)" : "var(--line-strong)",
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next testimonial"
              onClick={() => go(1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text1 transition-colors hover:text-text0"
              style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
