import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";

// Display: Fraunces — a high-contrast variable editorial serif with real
// character (and a distinctive italic), chosen over the default-luxury
// Cormorant Garamond to give the headlines an authored, non-template voice.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Body: Hanken Grotesk — a warm, slightly humanist grotesk used instead of
// the ubiquitous Inter so the body type isn't the web's default sans.
const body = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.chapeau.collective"),
  title: {
    default: "Chapeau · Your collective for marketing",
    template: "%s · Chapeau",
  },
  description:
    "Chapeau is a modern collective of strategists, operators, technologists and growth specialists helping ambitious brands scale smarter — across B2B, B2C, AI Solutions and GTM Engineering.",
  keywords: [
    "marketing collective",
    "B2B growth",
    "B2C marketing",
    "AI SEO",
    "marketing automation",
    "GTM engineering",
    "growth strategy",
  ],
  openGraph: {
    title: "Chapeau · Your collective for marketing",
    description:
      "A curated network of strategists, operators and growth specialists for ambitious brands.",
    type: "website",
    url: "https://www.chapeau.collective",
    siteName: "Chapeau",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chapeau · Your collective for marketing",
    description:
      "A curated network of strategists, operators and growth specialists for ambitious brands.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
