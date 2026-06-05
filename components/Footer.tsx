import { Logo } from "./Logo";
import { FOOTER_COLUMNS, SOCIALS, SITE } from "@/lib/content";

export default function Footer() {
  const year = 2026;
  return (
    <footer
      className="w-full border-t"
      style={{ background: "var(--bg-1)", borderColor: "var(--line)" }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16 lg:px-12 lg:py-20">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          {/* brand */}
          <div className="col-span-2">
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-text1">
              {SITE.description}
            </p>
          </div>

          {/* link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text2">
                {col.title}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-text1 transition-colors hover:text-text0"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* socials */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text2">
              Socials
            </p>
            <ul className="mt-4 space-y-3">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="text-sm text-text1 transition-colors hover:text-text0"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-14 flex flex-col items-start justify-between gap-4 border-t pt-8 sm:flex-row sm:items-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="text-sm text-text2">
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p className="text-sm text-text2">{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
