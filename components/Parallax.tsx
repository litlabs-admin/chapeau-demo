"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** total vertical travel in px across the element's scroll pass (+down / −up) */
  distance?: number;
};

/**
 * Subtle scroll parallax: translates its children vertically as the element
 * passes through the viewport. Input range is the full [0,1] element-progress
 * (WAAPI-safe — out-of-range offsets crash the page).
 */
export function Parallax({ children, className, distance = 60 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
