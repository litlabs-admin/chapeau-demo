"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_LINKS, SITE } from "@/lib/content";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  // hide on scroll-down, reveal on scroll-up (kept visible near the top)
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 16);
    if (open) return;
    if (y > prev && y > 240) setHidden(true);
    else setHidden(false);
  });

  // lock body scroll when the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`transition-all duration-300 ${scrolled ? "glass" : ""}`}
        style={{
          borderBottom: scrolled
            ? "1px solid var(--line)"
            : "1px solid transparent",
        }}
      >
        <nav className="mx-auto max-w-[1240px] px-6 lg:px-12">
          <div className="flex h-[76px] items-center justify-between">
            <a href="/" aria-label="Chapeau home" className="shrink-0">
              <Logo />
            </a>

            {/* desktop links with animated cyan underline */}
            <div className="hidden lg:flex items-center gap-9">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="group relative text-sm font-medium text-text1 transition-colors hover:text-text0"
                >
                  {l.label}
                  <span
                    className="absolute -bottom-1.5 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full transition-transform duration-300 ease-out group-hover:scale-x-100"
                    style={{ background: "var(--cyan-deep)" }}
                  />
                </a>
              ))}
            </div>

            {/* desktop CTA */}
            <div className="hidden lg:flex items-center">
              <a
                href="/contact"
                className="shine inline-flex items-center gap-1.5 h-11 px-6 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  color: "#0f172a",
                  background:
                    "linear-gradient(118deg, #00c8d7 0%, #0aa8b5 58%, #0a7d88 100%)",
                  boxShadow: "0 12px 30px -14px rgba(0,200,215,0.5)",
                }}
              >
                {SITE.cta}
                <ArrowUpRight size={15} strokeWidth={2} />
              </a>
            </div>

            {/* mobile toggle */}
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl text-text0"
              style={{ background: "#fff", border: "1px solid var(--line)" }}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </div>

      {/* mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed inset-0 top-[76px] z-40"
            style={{
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="px-6 py-8 flex flex-col gap-1"
            >
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-4 font-serif text-3xl font-medium text-text0 border-b"
                  style={{ borderColor: "var(--line)" }}
                >
                  {l.label}
                </a>
              ))}
              <a
                href="/contact"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex items-center justify-center gap-2 h-14 rounded-full text-base font-medium"
                style={{
                  color: "#0f172a",
                  background:
                    "linear-gradient(118deg, #00c8d7 0%, #0aa8b5 58%, #0a7d88 100%)",
                }}
              >
                {SITE.cta}
                <ArrowUpRight size={18} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
