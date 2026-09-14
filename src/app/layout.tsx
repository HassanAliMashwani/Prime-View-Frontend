import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/navigation/Footer";
import { siteConfig } from "@/data/site";
import { GlobalVideoPreloader } from "@/components/ui/GlobalVideoPreloader";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

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

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["Prime View", "Abbottabad", "Housing Society", "Plots", "Real Estate Pakistan"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sansFont.variable} ${serifFont.variable} scroll-smooth`}>
      <body className="font-sans antialiased bg-[#F8F7F5] text-[#151914] min-h-screen flex flex-col justify-between selection:bg-[#43612B] selection:text-white">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <GlobalVideoPreloader />

        {/* Global WhatsApp FAB (automatically hidden on admin and member portals) */}
        <WhatsAppButton />
      </body>
    </html>
  );
}
