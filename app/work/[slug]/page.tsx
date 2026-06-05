import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Frame } from "@/components/Frame";
import { Reveal } from "@/components/Reveal";
import { CASE_STUDIES } from "@/lib/content";

export function generateStaticParams() {
  return CASE_STUDIES.map((cs) => ({ slug: cs.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cs = CASE_STUDIES.find((c) => c.id === slug);
  if (!cs) return { title: "Work" };
  return { title: `${cs.name} — ${cs.category}`, description: cs.summary };
}

const SECTIONS = [
  { key: "challenge", label: "The challenge" },
  { key: "approach", label: "What we did" },
  { key: "outcome", label: "The outcome" },
] as const;

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cs = CASE_STUDIES.find((c) => c.id === slug);
  if (!cs) notFound();

  return (
    <>
      <Nav />
      <Frame>
        <main className="relative z-2 flex-1 px-6 pb-24 pt-32 lg:px-12 lg:pb-32 lg:pt-40">
          <Reveal variant="blur" className="mx-auto max-w-3xl">
            <a
              href="/#work"
              className="inline-flex items-center gap-1.5 text-sm text-text1 transition-colors hover:text-text0"
            >
              <ArrowLeft size={15} /> All work
            </a>
            <p className="eyebrow-arrow mb-4 mt-8">{cs.category}</p>
            <h1 className="display text-5xl sm:text-6xl lg:text-7xl">{cs.name}</h1>
            <p className="mt-6 text-xl leading-snug text-text0 sm:text-2xl">
              {cs.summary}
            </p>
          </Reveal>

          {/* metrics band */}
          <Reveal delay={0.06} className="mx-auto mt-12 max-w-3xl">
            <div
              className="grid grid-cols-2 overflow-hidden rounded-[22px] border"
              style={{ borderColor: "var(--line)", boxShadow: "var(--shadow-soft)" }}
            >
              {cs.metrics.map((m, i) => (
                <div
                  key={m.label}
                  className="p-7 sm:p-9"
                  style={{
                    borderLeft: i > 0 ? "1px solid var(--line)" : undefined,
                    background: "var(--bg-2)",
                  }}
                >
                  <p className="font-serif text-4xl font-semibold text-text0 sm:text-5xl">
                    {m.value}
                  </p>
                  <p className="mt-1.5 text-sm text-text2">{m.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* narrative */}
          <div className="mx-auto mt-16 max-w-3xl space-y-12">
            {SECTIONS.map((s, i) => {
              const body = cs[s.key];
              if (!body) return null;
              return (
                <Reveal key={s.key} delay={i * 0.04}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-8">
                    <p className="eyebrow sm:col-span-4 sm:pt-1">{s.label}</p>
                    <p className="text-lg leading-relaxed text-text1 sm:col-span-8">
                      {body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* CTA */}
          <Reveal className="mx-auto mt-20 max-w-3xl">
            <div
              className="flex flex-col items-start justify-between gap-5 rounded-[22px] border p-8 sm:flex-row sm:items-center"
              style={{ borderColor: "var(--line)", background: "var(--bg-1)" }}
            >
              <p className="font-serif text-2xl text-text0">
                Got a bottleneck that looks like this?
              </p>
              <a
                href="/contact"
                className="shine inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full px-7 text-sm font-medium"
                style={{
                  color: "#0f172a",
                  background:
                    "linear-gradient(118deg, #00c8d7 0%, #0aa8b5 58%, #0a7d88 100%)",
                  boxShadow: "0 12px 30px -14px rgba(0,200,215,0.5)",
                }}
              >
                Start a project <ArrowUpRight size={15} />
              </a>
            </div>
          </Reveal>
        </main>
        <Footer />
      </Frame>
    </>
  );
}
