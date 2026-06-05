import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type SectionHeadProps = {
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  align?: "split" | "center";
};

/** Section header on the 12-col grid: arrow eyebrow + serif title (+ intro). */
export function SectionHead({
  eyebrow,
  title,
  intro,
  align = "split",
}: SectionHeadProps) {
  if (align === "center") {
    return (
      <Reveal variant="blur" className="mx-auto mb-14 max-w-2xl text-center lg:mb-20">
        {eyebrow && <p className="eyebrow-arrow mb-4 justify-center">{eyebrow}</p>}
        {title && <h2 className="display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>}
        {intro && <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-text1">{intro}</p>}
      </Reveal>
    );
  }
  return (
    <div className="mb-14 grid grid-cols-1 gap-6 lg:mb-20 lg:grid-cols-12 lg:items-end">
      <Reveal variant="blur" className="lg:col-span-7">
        {eyebrow && <p className="eyebrow-arrow mb-4">{eyebrow}</p>}
        {title && <h2 className="display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>}
      </Reveal>
      {intro && (
        <Reveal delay={0.08} className="lg:col-span-5 lg:pb-2">
          <p className="text-lg leading-relaxed text-text1 lg:text-right">{intro}</p>
        </Reveal>
      )}
    </div>
  );
}

type SectionProps = {
  children: ReactNode;
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  align?: "split" | "center";
  /** show the top hairline divider (default true) */
  divider?: boolean;
  className?: string;
  /** horizontal padding (set false for full-bleed inner content) */
  pad?: boolean;
};

/**
 * Standard framed section: top hairline divider, generous vertical rhythm,
 * optional 12-col header. Inner content controls its own grid.
 */
export function Section({
  children,
  id,
  eyebrow,
  title,
  intro,
  align = "split",
  divider = true,
  className = "",
  pad = true,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative ${divider ? "section-divider" : ""} py-20 sm:py-24 lg:py-32 ${
        pad ? "px-6 lg:px-12" : ""
      } ${className}`}
    >
      {(eyebrow || title || intro) && (
        <div className={pad ? "" : "px-6 lg:px-12"}>
          <SectionHead eyebrow={eyebrow} title={title} intro={intro} align={align} />
        </div>
      )}
      {children}
    </section>
  );
}
