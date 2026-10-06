import { Playfair_Display, Cormorant_Garamond, Outfit } from "next/font/google";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { CookieConsentBanner } from "@/components/ui/CookieConsentBanner";

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

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${serifFont.variable} ${cormorantFont.variable} ${outfitFont.variable}`}>
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />

      {/* Global WhatsApp FAB (automatically hidden on admin and member portals) */}
      <WhatsAppButton />

      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
    </div>
  );
}
