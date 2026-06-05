"use client";

import { useState, type ReactNode, type CSSProperties } from "react";
import { motion } from "framer-motion";

type GlowCardProps = {
  children: ReactNode;
  className?: string;
  /** accent color for the hover border glow */
  glow?: "cyan" | "gold";
  style?: CSSProperties;
};

/**
 * Glassmorphic editorial card: hover lifts 4px, shadow deepens, and a
 * soft cyan/gold border glow appears. House interaction for cards.
 */
export function GlowCard({
  children,
  className = "",
  glow = "cyan",
  style,
}: GlowCardProps) {
  const [hovered, setHovered] = useState(false);
  const glowColor =
    glow === "gold" ? "rgba(10,125,136,0.45)" : "rgba(0,200,215,0.45)";
  const glowShadow = "var(--shadow-lift)";

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{ y: hovered ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`relative rounded-2xl ${className}`}
      style={{
        background: "var(--bg-2)",
        border: `1px solid ${hovered ? glowColor : "var(--line)"}`,
        boxShadow: hovered ? glowShadow : "var(--shadow-soft)",
        transition: "box-shadow 0.4s ease, border-color 0.4s ease",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
