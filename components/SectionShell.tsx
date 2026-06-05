import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type SectionShellProps = {
  children: ReactNode;
  id?: string;
  /** small uppercase label above the title */
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  /** center the header block */
  centered?: boolean;
  className?: string;
  /** tone of the section background */
  surface?: "bg0" | "bg1";
};

/**
 * Section scaffold: max-width container (content 1200 / max 1400), generous
 * vertical rhythm, optional editorial header (eyebrow + serif title + intro).
 */
export function SectionShell({
  children,
  id,
  eyebrow,
  title,
  intro,
  centered = false,
  className = "",
  surface = "bg0",
}: SectionShellProps) {
  const bg = surface === "bg1" ? "var(--bg-1)" : "var(--bg-0)";
  return (
    <section
      id={id}
      className={`relative w-full py-24 sm:py-28 lg:py-36 ${className}`}
      style={{ background: bg }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-12">
        {(eyebrow || title || intro) && (
          <Reveal
            className={`mb-14 lg:mb-20 max-w-3xl ${centered ? "mx-auto text-center" : ""}`}
          >
            {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
            {title && (
              <h2 className="display text-4xl sm:text-5xl lg:text-6xl">
                {title}
              </h2>
            )}
            {intro && (
              <p className="mt-5 text-lg leading-relaxed text-text1">{intro}</p>
            )}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
