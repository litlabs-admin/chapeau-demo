import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Frame } from "@/components/Frame";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Start a project",
  description:
    "Tell Chapeau what's slowing growth. We reply within two working days with where we'd start — no deck, no discovery retainer.",
};

export default function ContactPage() {
  return (
    <>
      <Nav />
      <Frame>
        <main className="relative z-2 flex-1 px-6 pb-24 pt-32 lg:px-12 lg:pb-32 lg:pt-40">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-12">
            {/* left: pitch */}
            <div className="lg:col-span-5">
              <Reveal variant="blur">
                <p className="eyebrow-arrow mb-5">Start a project</p>
                <h1 className="display text-4xl sm:text-5xl lg:text-[3.4rem]">
                  Send us the bottleneck you can&apos;t crack.
                </h1>
                <p className="mt-6 max-w-md text-lg leading-relaxed text-text1">
                  {SITE.description}
                </p>
              </Reveal>

              <Reveal delay={0.08} className="mt-10">
                <dl className="space-y-6">
                  <div>
                    <dt className="eyebrow mb-1.5">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${SITE.email}`}
                        className="text-text0 underline-offset-4 hover:underline"
                      >
                        {SITE.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow mb-1.5">What happens next</dt>
                    <dd className="max-w-sm text-text1">
                      A founder reads your note, not a bot. We reply within two
                      working days with a candid take on where we&apos;d start.
                    </dd>
                  </div>
                </dl>
              </Reveal>
            </div>

            {/* right: form */}
            <div className="lg:col-span-7">
              <Reveal delay={0.12}>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </main>
        <Footer />
      </Frame>
    </>
  );
}
