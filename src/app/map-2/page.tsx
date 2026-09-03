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
      {/* Light Header Banner */}
      <div className="bg-[#FAF9F7] pt-24 sm:pt-28 pb-8 px-6 sm:px-8 lg:px-12 text-center border-b border-black/[0.06] relative overflow-hidden w-full">
        <HeroBackground />
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <h1 className="font-display text-4xl sm:text-5xl text-[#151914] tracking-tight font-bold">
            Master Plan
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#6B7462] max-w-xl mx-auto leading-relaxed mb-4">
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
              className="bg-white hover:bg-black/5 text-[#151914] text-xs font-bold px-6 py-3 rounded-xl transition-colors duration-150 border border-black/10 flex items-center gap-2 uppercase tracking-wider shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </a>
          </div>
        </div>
      </div>

      <div className="py-16 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
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
