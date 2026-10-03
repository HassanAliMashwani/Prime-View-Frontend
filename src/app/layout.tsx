import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { siteConfig } from "@/data/site";
import { GlobalVideoPreloader } from "@/components/ui/GlobalVideoPreloader";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CookieConsentBanner } from "@/components/ui/CookieConsentBanner";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serifFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const cormorantFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const outfitFont = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prime-view-livid.vercel.app"),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Prime View", "Abbottabad", "Housing Society", "Plots", "Real Estate Pakistan"],
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: "https://prime-view-livid.vercel.app",
    siteName: siteConfig.name,
    images: [
      {
        url: "/master-plan/Master Plan.png",
        width: 1200,
        height: 630,
        alt: "Prime View Cooperative Housing Society Abbottabad Master Plan",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ["/master-plan/Master Plan.png"],
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
      className={`${sansFont.variable} ${serifFont.variable} ${cormorantFont.variable} ${outfitFont.variable} scroll-smooth`}
    >
      <body className="font-sans antialiased bg-[#F8F7F5] text-[#151914] min-h-screen flex flex-col justify-between selection:bg-[#43612B] selection:text-white">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <GlobalVideoPreloader />

        {/* Global WhatsApp FAB (automatically hidden on admin and member portals) */}
        <WhatsAppButton />

        {/* Cookie Consent Banner */}
        <CookieConsentBanner />
      </body>
    </html>
  );
}

