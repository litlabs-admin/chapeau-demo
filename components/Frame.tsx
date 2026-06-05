import type { ReactNode } from "react";

/**
 * Framed-grid "sheet": a centered max-width column with hairline side rails
 * on a slightly cooler canvas — the iTechai/Agentik boxy structure. Everything
 * (sections + footer) lives inside so the whole page reads as one elegant frame.
 */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="frame-canvas w-full">
      <div className="frame-rail mx-auto w-full max-w-[1240px]">{children}</div>
    </div>
  );
}
