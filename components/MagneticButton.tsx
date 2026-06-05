"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  /** visual style */
  variant?: "primary" | "ghost";
  /** show the trailing arrow icon */
  arrow?: boolean;
  className?: string;
  newTab?: boolean;
  /** button type when not rendered as a link */
  type?: "button" | "submit";
};

/**
 * Primary CTA: subtle pointer-tracking "magnetic" pull plus a glow shadow
 * that intensifies on hover. Primary = single-accent cyan gradient pill.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = "primary",
  arrow = true,
  className = "",
  newTab = false,
  type = "button",
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  function handleMove(e: MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    setPos({ x: relX * 0.25, y: relY * 0.35 });
  }

  function reset() {
    setPos({ x: 0, y: 0 });
    setHovered(false);
  }

  const isPrimary = variant === "primary";

  const base =
    "shine relative inline-flex items-center justify-center gap-2 h-12 px-7 text-sm font-medium rounded-full select-none whitespace-nowrap";

  // Primary = confident single-accent cyan→deep-teal pill, slate ink text.
  const primaryStyle = {
    color: "#0f172a",
    background: "linear-gradient(118deg, #00c8d7 0%, #0aa8b5 58%, #0a7d88 100%)",
    boxShadow: hovered
      ? "0 18px 40px -12px rgba(0,200,215,0.55), 0 1px 0 rgba(255,255,255,0.4) inset"
      : "0 12px 30px -14px rgba(0,200,215,0.45), 0 1px 0 rgba(255,255,255,0.4) inset",
    transition: "box-shadow 0.35s ease",
  };

  // Ghost = clean white bordered pill.
  const ghostStyle = {
    color: "var(--text-0)",
    background: "#fff",
    border: "1px solid var(--line-strong)",
    boxShadow: hovered ? "var(--shadow-soft)" : "0 1px 2px rgba(15,23,42,0.04)",
    transition: "box-shadow 0.35s ease, border-color 0.35s ease",
  };

  const inner = (
    <>
      <span className="relative z-[1]">{children}</span>
      {arrow && (
        <motion.span
          className="relative z-[1] inline-flex"
          animate={{ x: hovered ? 3 : 0, y: hovered ? -3 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <ArrowUpRight size={16} strokeWidth={2} />
        </motion.span>
      )}
    </>
  );

  const motionProps = {
    onMouseMove: handleMove,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: reset,
    animate: { x: pos.x, y: pos.y },
    transition: { type: "spring" as const, stiffness: 250, damping: 18, mass: 0.4 },
    whileTap: { scale: 0.96 },
    className: `${base} ${className}`,
    style: isPrimary ? primaryStyle : ghostStyle,
  };

  if (href) {
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        {...motionProps}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      {...motionProps}
    >
      {inner}
    </motion.button>
  );
}
