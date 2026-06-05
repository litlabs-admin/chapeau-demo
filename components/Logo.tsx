/* Chapeau brand mark + wordmark. The mark is the provided SVG glyph. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="30"
        height="28"
        viewBox="0 0 65 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M2.53514 27.6283C7.82031 12.3341 19.3523 0.493362 32.3261 0C40.0138 0 43.9251 6.80679 43.3775 19.2411L30.4041 21.7079C30.6812 12.7056 29.5812 9.96716 23.6771 12.3341C17.9108 15.7876 14.0668 21.7079 11.1841 27.1349C7.41056 34.239 3.49582 47.3628 11.1841 51.3097C17.4303 52.2964 21.6901 48.029 32.3261 36.0155C43.8019 24.7275 50.9491 22.9128 65 28.615L53.468 48.3495C44.1332 43.3528 39.5362 43.956 32.3261 50.323C21.8629 59.57 15.5082 62.1637 7.34014 58.2168C-0.828674 52.2964 -1.78972 42.4292 2.53514 27.6283Z"
          fill="currentColor"
        />
      </svg>
      {/* Wordmark carries the brand motif: the circumflex on the "a" is a
          literal chapeau (French: the "^" accent is the accent circonflexe).
          Prose/SEO keep the plain "Chapeau" spelling — this is logo-only. */}
      <span
        className="font-serif text-2xl font-semibold tracking-tight"
        style={{ color: "var(--text-0)" }}
      >
        Ch<span className="italic">â</span>peau
      </span>
    </span>
  );
}
