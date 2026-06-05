import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import LogoStrip from "@/components/LogoStrip";
import CaseStudies from "@/components/CaseStudies";
import Testimonials from "@/components/Testimonials";
import FooterCTA from "@/components/FooterCTA";
import Footer from "@/components/Footer";
import { Frame } from "@/components/Frame";
import { ScrollProgress } from "@/components/ScrollProgress";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Nav />
      <Frame>
        <main className="relative z-[2] flex-1">
          <Hero />
          <LogoStrip />
          <ServicesSection />
          <CaseStudies />
          <Testimonials />
          <FooterCTA />
        </main>
        <Footer />
      </Frame>
    </>
  );
}
