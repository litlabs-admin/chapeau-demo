"use client";

import { Reveal } from "./Reveal";
import { MagneticButton } from "./MagneticButton";
import { FOOTER_CTA } from "@/lib/content";

/** Full-width CTA — clean, restrained, with a whisper-faint cyan wash. */
export default function FooterCTA() {
  return (
    <section className="section-divider relative w-full overflow-hidden py-28 lg:py-40">
      {/* whisper-faint wash for a hint of depth (no colored orbs) */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(0,200,215,0.05) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="mx-auto w-full max-w-3xl px-6 text-center lg:px-12">
        <Reveal variant="blur">
          <p className="eyebrow-arrow mb-5 justify-center">Let&apos;s talk growth</p>
          <h2 className="display text-4xl text-text0 sm:text-5xl lg:text-6xl">
            Tell us what&apos;s{" "}
            <span className="italic" style={{ color: "var(--cyan-deep)" }}>
              slowing growth.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text1">
            {FOOTER_CTA.subhead}
          </p>
          <div className="mt-10 flex justify-center">
            <MagneticButton href={FOOTER_CTA.cta.href} className="h-13 px-9 text-base">
              {FOOTER_CTA.cta.label}
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
