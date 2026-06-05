"use client";

import Image from "next/image";
import { LOGOS } from "@/lib/content";

/**
 * Trust band: a left label + an infinite, smooth colored logo marquee that
 * never pauses. Sits in its own framed band right under the hero.
 */
export default function LogoStrip() {
  const row = [...LOGOS, ...LOGOS]; // duplicate for a seamless -50% loop

  return (
    <section className="section-divider px-6 py-10 lg:px-12 lg:py-12">
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">
        <p className="text-sm leading-snug text-text2 lg:col-span-3">
          Trusted by teams
          <br className="hidden lg:block" /> who lead growth.
        </p>

        <div
          className="relative w-full overflow-hidden lg:col-span-9"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
          }}
        >
          <div className="animate-marquee flex w-max items-center gap-14">
            {row.map((logo, i) => (
              <div
                key={i}
                className="relative flex h-8 w-[120px] shrink-0 items-center justify-center"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={32}
                  className="h-full w-auto object-contain opacity-90 transition-opacity duration-300 hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
