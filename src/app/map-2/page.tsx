import React from "react";
import Image from "next/image";
import { pagesData } from "@/data/pages";
import { Download, ZoomIn } from "lucide-react";

import { HeroBackground } from "@/components/ui/HeroBackground";

export const metadata = {
  title: pagesData["map-2"].title,
  description: pagesData["map-2"].description,
};

export default function MasterplanPage() {
  const masterplanWebp =
    "/assets/masterplan/prime-view-abbottabad-final-master-plan-11-08-2026.webp";
  const masterplanPdf =
    "/assets/masterplan/prime-view-abbottabad-final-master-plan-11-08-2026.pdf";

  return (
    <div className="bg-[#F8F7F5] text-[#151914] min-h-screen">
      {/* ── HERO HEADER (SAME AS OUR PLANS PAGE) ── */}
      <div className="relative pt-28 sm:pt-36 pb-28 sm:pb-36 lg:pb-40 px-6 sm:px-8 lg:px-12 text-center overflow-hidden w-full">
        {/* Hero Background — Mountain Valley Landscape */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/new assests/our plan assests/hero background.jpeg?v=2"
            alt="Prime View Master Plan Hero Background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient: dark at top for text, fades to cream at bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(248,247,245,0.7) 80%, #F8F7F5 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight font-bold leading-[1.05] uppercase drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">
            Master Plan
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] tracking-wide max-w-2xl mx-auto leading-relaxed">
            Prime View Co-Operative Housing Society Ltd Hazara Division Approved Final Master Plan &amp; Block Layout
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href={masterplanWebp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#43612B] hover:bg-[#324920] text-white text-xs font-bold px-6 py-3 rounded-xl transition-all duration-150 shadow-[0_4px_14px_rgba(67,97,43,0.35)] flex items-center gap-2 uppercase tracking-wider"
            >
              <ZoomIn className="w-4 h-4" />
              View HD Map
            </a>
            <a
              href={masterplanPdf}
              download
              className="bg-white/90 hover:bg-white text-[#151914] text-xs font-bold px-6 py-3 rounded-xl transition-colors duration-150 border border-white/50 backdrop-blur-md flex items-center gap-2 uppercase tracking-wider shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </div>
        </div>
      </div>

      <div className="pb-16 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10 relative z-10 -mt-10 sm:-mt-16">
        {/* Master Plan Display Box */}
        <div className="relative w-full overflow-hidden rounded-3xl border border-black/[0.08] bg-[#FAF9F7] shadow-lg p-2 sm:p-4">
          <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden border border-black/[0.06] flex items-center justify-center">
            <Image
              src={masterplanWebp}
              alt="Prime View Abbottabad Final Master Plan"
              width={4768}
              height={3368}
              className="w-full h-auto object-contain rounded-xl max-h-[85vh]"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
