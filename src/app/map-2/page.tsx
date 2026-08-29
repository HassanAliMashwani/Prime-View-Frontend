import React from "react";
import Image from "next/image";
import { pagesData } from "@/data/pages";
import { Download, ZoomIn } from "lucide-react";

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
    <div className="bg-pure-white text-charcoal min-h-screen pt-28 sm:pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
        {/* Header Title Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
            Master Plan
          </h1>
          <p className="font-sans text-sm sm:text-base text-charcoal/60 max-w-xl mx-auto leading-relaxed mb-4">
            Prime View Co-Operative Housing Society Ltd Hazara Division Approved Final Master Plan &amp; Block Layout
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href={masterplanWebp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-verified-green hover:bg-[#137547] text-pure-white text-xs font-bold px-6 py-3 rounded-xl transition-colors duration-150 shadow-sm flex items-center gap-2 uppercase tracking-wider"
            >
              <ZoomIn className="w-4 h-4" />
              <span>View Full Size</span>
            </a>
            <a
              href={masterplanPdf}
              download="Prime-View-Abbottabad-Final-Master-Plan-11-08-2026.pdf"
              className="bg-pure-white border border-stone hover:border-stone hover:bg-soft-white text-charcoal text-xs font-semibold px-6 py-3 rounded-xl transition-colors duration-150 flex items-center gap-2 uppercase tracking-wider shadow-sm"
            >
              <Download className="w-4 h-4 text-verified-green" />
              <span>Download PDF Map</span>
            </a>
          </div>
        </div>

        {/* Master Plan Display Box */}
        <div className="relative w-full overflow-hidden rounded-3xl border border-stone bg-soft-white shadow-xl p-2 sm:p-4">
          <div className="relative w-full h-full bg-pure-white rounded-2xl overflow-hidden border border-stone/50 flex items-center justify-center">
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
