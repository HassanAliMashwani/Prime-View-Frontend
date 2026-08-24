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
          <span className="kicker block text-xs font-semibold tracking-widest text-accent-green uppercase">
            OFFICIAL TOWN PLANNING
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
            Master Plan
          </h1>
          <p className="font-sans text-sm sm:text-base text-muted-gray-text max-w-xl mx-auto leading-relaxed">
            Prime View Co-Operative Housing Society Ltd Hazara Division Approved Final Master Plan &amp; Block Layout
          </p>
        </div>

        {/* Master Plan Container */}
        <div className="bg-soft-white rounded-2xl border border-card-border p-6 sm:p-8 space-y-6 text-center shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-card-border pb-5 text-left">
            <div>
              <h2 className="font-display text-xl font-semibold text-charcoal">
                Prime View Abbottabad Final Master Plan
              </h2>
              <p className="font-sans text-xs text-muted-gray-text mt-0.5">
                Official layout map registered with the Cooperative Societies Department.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={masterplanWebp}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent-green hover:bg-[#23533e] text-pure-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors duration-150 shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>View Full Size</span>
              </a>
              <a
                href={masterplanPdf}
                download="Prime-View-Abbottabad-Final-Master-Plan-11-08-2026.pdf"
                className="bg-pure-white border border-card-border hover:border-secondary-border hover:bg-secondary-hover-bg text-charcoal text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors duration-150 flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5 text-accent-green" />
                <span>Download PDF Map</span>
              </a>
            </div>
          </div>

          {/* Master Plan Display Box */}
          <div className="relative w-full overflow-hidden rounded-xl border border-card-border bg-pure-white shadow-inner flex items-center justify-center p-3">
            <Image
              src={masterplanWebp}
              alt="Prime View Abbottabad Final Master Plan"
              width={4768}
              height={3368}
              className="w-full h-auto object-contain rounded-lg max-h-[85vh]"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
