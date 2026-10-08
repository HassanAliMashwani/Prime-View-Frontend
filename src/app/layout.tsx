import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/data/site";
import { ToastContainer } from "@/components/ui/ToastContainer";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
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
      className={`${sansFont.variable} scroll-smooth`}
    >
      <body className="font-sans antialiased bg-[#F8F7F5] text-[#151914] min-h-screen flex flex-col justify-between selection:bg-[#43612B] selection:text-white">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}


