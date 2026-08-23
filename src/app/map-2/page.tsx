import React from "react";
import Image from "next/image";
import { pagesData } from "@/data/pages";
import { Download, ZoomIn } from "lucide-react";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

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
    <div className="bg-warm-ivory text-charcoal min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
        {/* Header Title Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="kicker block">OFFICIAL TOWN PLANNING</span>
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
            Master Plan
          </h1>
          <p className="font-sans text-sm sm:text-base text-charcoal/75 max-w-xl mx-auto leading-relaxed">
            Prime View Co-Operative Housing Society Ltd Hazara Division Approved Final Master Plan &amp; Block Layout
          </p>
        </div>

        {/* Master Plan Container */}
        <LuxuryCard theme="light" interactive={false} className="p-6 sm:p-8 space-y-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone/30 pb-5 text-left">
            <div>
              <h2 className="font-display text-xl font-semibold text-charcoal">
                Prime View Abbottabad Final Master Plan
              </h2>
              <p className="font-sans text-xs text-charcoal/70 mt-0.5">
                Official layout map registered with the Cooperative Societies Department.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={masterplanWebp}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-verified-green hover:bg-[#0e5735] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verified-green"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>View Full Size</span>
              </a>
              <a
                href={masterplanPdf}
                download="Prime-View-Abbottabad-Final-Master-Plan-11-08-2026.pdf"
                className="border border-stone/60 hover:border-stone hover:bg-stone/10 text-charcoal text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Map</span>
              </a>
            </div>
          </div>

          {/* Master Plan Display Box */}
          <div className="relative w-full overflow-hidden rounded-xl border border-stone/30 bg-white shadow-inner flex items-center justify-center p-3">
            <Image
              src={masterplanWebp}
              alt="Prime View Abbottabad Final Master Plan"
              width={4768}
              height={3368}
              className="w-full h-auto object-contain rounded-lg max-h-[85vh]"
              priority
            />
          </div>
        </LuxuryCard>
      </div>
    </div>
  );
}
