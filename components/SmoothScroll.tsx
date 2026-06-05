"use client";

import { type ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "framer-motion";

/**
 * Momentum smooth-scroll wrapper (Lenis) + global MotionConfig. Gives the page
 * the fluid, weighted scroll feel of high-end Framer sites. When the user
 * prefers reduced motion, Lenis is disabled and `MotionConfig reducedMotion`
 * makes every Framer Motion component drop transform/scroll animation.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  const content = (
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
  );

  if (reduced) return content;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.2,
      }}
    >
      {content}
    </ReactLenis>
  );
}
