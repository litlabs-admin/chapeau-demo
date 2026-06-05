"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  useMotionValueEvent,
  animate,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { CASE_STUDIES, type CaseStudy } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CaseStudies() {
  return (
    <section id="work" className="section-divider relative w-full overflow-hidden py-20 sm:py-24 lg:py-32">
      <div className="bg-mesh opacity-40" aria-hidden />
      <div className="relative px-6 lg:px-12">
        <div className="mb-14 grid grid-cols-1 gap-6 lg:mb-16 lg:grid-cols-12 lg:items-end">
          <Reveal variant="blur" className="lg:col-span-7">
            <p className="eyebrow-arrow mb-4">Selected work</p>
            <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
              Outcomes, not <span className="italic" style={{ color: "var(--cyan-deep)" }}>output</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-5 lg:pb-2">
            <p className="text-lg leading-relaxed text-text1 lg:text-right">
              A few of the brands we&apos;ve helped build smarter growth engines.
            </p>
          </Reveal>
        </div>

        <div className="flex flex-col gap-8 lg:gap-12">
          {CASE_STUDIES.map((cs, i) => (
            <Reveal key={cs.id} variant="up" amount={0.2} delay={i * 0.04}>
              <CaseCard study={cs} flip={i % 2 === 1} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseCard({ study, flip }: { study: CaseStudy; flip: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 18 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 6);
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 6);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.article
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }}
      className="group relative grid grid-cols-1 overflow-hidden rounded-[28px] lg:grid-cols-2"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[28px]"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow-soft)",
        }}
      />
      {/* refined duotone visual (restrained — slate → cyan, no rainbow) */}
      <div
        className={`relative min-h-[280px] overflow-hidden lg:min-h-[380px] ${
          flip ? "lg:order-2" : ""
        }`}
      >
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={{
            background: "linear-gradient(150deg, #0f172a 0%, #0aa8b5 130%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 70% 28%, rgba(255,255,255,0.28), transparent 55%)",
          }}
        />
        {/* floating glass logo mark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-7xl font-semibold text-white/90 drop-shadow-lg">
            {study.name}
          </span>
        </div>
        <span
          className="absolute left-6 top-6 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium"
          style={{
            background: "rgba(255,255,255,0.85)",
            color: "var(--text-0)",
            backdropFilter: "blur(8px)",
          }}
        >
          {study.category}
        </span>
      </div>

      {/* content */}
      <div className="relative flex flex-col justify-center gap-8 p-8 sm:p-12">
        <p className="font-serif text-2xl leading-snug text-text0 sm:text-3xl">
          {study.summary}
        </p>

        <div className="flex flex-wrap gap-10">
          {study.metrics.map((m) => (
            <div key={m.label}>
              <p className="font-serif text-4xl font-semibold text-text0">
                <Counter value={m.value} />
              </p>
              <p className="mt-1 text-sm text-text2">{m.label}</p>
            </div>
          ))}
        </div>

        <a
          href={`/work/${study.id}`}
          className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-text0 transition-colors hover:text-cyan-deep"
        >
          Read the case study
          <ArrowUpRight
            size={16}
            strokeWidth={2}
            className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
          />
        </a>
      </div>
    </motion.article>
  );
}

/** Animates the numeric portion of a metric (e.g. "3.4×", "−38%") on scroll-in. */
function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const mv = useMotionValue(0);

  const match = value.match(/^([^\d-]*-?)(\d+(?:\.\d+)?)(.*)$/);
  const prefix = match?.[1] ?? "";
  const target = parseFloat(match?.[2] ?? "0");
  const suffix = match?.[3] ?? "";
  const decimals = match?.[2]?.includes(".") ? match[2].split(".")[1].length : 0;

  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  useMotionValueEvent(mv, "change", (v) =>
    setDisplay(`${prefix}${v.toFixed(decimals)}${suffix}`)
  );

  useEffect(() => {
    const controls = animate(mv, inView ? target : 0, {
      duration: 1.1,
      ease: EASE,
    });
    return controls.stop;
  }, [inView, mv, target]);

  return <span ref={ref}>{display}</span>;
}
