"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

/** Premium reveal easing. */
const EASE = [0.22, 1, 0.36, 1] as const;
/** Framer-template easing (kept for the stacked deck). */
const EASE_FRAMER = [0.44, 0, 0.56, 1] as const;

type Variant = "up" | "fade" | "blur" | "scale" | "left" | "right";

function hiddenFor(variant: Variant, y: number): Record<string, number | string> {
  switch (variant) {
    case "fade":
      return { opacity: 0 };
    case "blur":
      return { opacity: 0, filter: "blur(10px)", y: y * 0.6 };
    case "scale":
      return { opacity: 0, scale: 0.94 };
    case "left":
      return { opacity: 0, x: -40 };
    case "right":
      return { opacity: 0, x: 40 };
    case "up":
    default:
      return { opacity: 0, y };
  }
}

function shownFor(variant: Variant): Record<string, number | string> {
  switch (variant) {
    case "blur":
      return { opacity: 1, filter: "blur(0px)", y: 0 };
    case "scale":
      return { opacity: 1, scale: 1 };
    case "left":
    case "right":
      return { opacity: 1, x: 0 };
    case "fade":
      return { opacity: 1 };
    case "up":
    default:
      return { opacity: 1, y: 0 };
  }
}

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
  as?: "div" | "span" | "li" | "section";
  variant?: Variant;
  /** fraction of element visible before triggering */
  amount?: number;
  /** if true, animate only once; default false → recedes on scroll-up */
  once?: boolean;
};

/**
 * Bidirectional scroll reveal: fades/translates in on enter and gracefully
 * recedes on scroll-up. Several `variant`s for fade / blur / scale / slide.
 */
export function Reveal({
  children,
  delay = 0,
  y = 36,
  duration = 0.7,
  className,
  as = "div",
  variant = "up",
  amount = 0.3,
  once = false,
}: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={hiddenFor(variant, y)}
      whileInView={shownFor(variant)}
      viewport={{ once, amount, margin: "-60px" }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/* ── Staggered groups ─────────────────────────────────── */

export const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Stagger({
  children,
  className,
  amount = 0.25,
  once = false,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/* Back-compat aliases for earlier call-sites */
export const RevealGroup = Stagger;
export const RevealItem = StaggerItem;

export { EASE, EASE_FRAMER };
