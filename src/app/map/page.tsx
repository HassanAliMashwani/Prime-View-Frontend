import React from "react";
import { pagesData } from "@/data/pages";
import { siteConfig } from "@/data/site";
import { MapPin, Navigation } from "lucide-react";

import { HeroBackground } from "@/components/ui/HeroBackground";

export const metadata = {
  title: pagesData.map.title,
  description: pagesData.map.description,
};

export default function LocationMapPage() {
  return (
    <div className="bg-pure-white text-charcoal min-h-screen">
      {/* Light Header Banner */}
      <div className="bg-[#FAF9F7] text-charcoal pt-24 sm:pt-28 pb-8 px-6 sm:px-8 lg:px-12 text-center border-b border-black/[0.06] relative overflow-hidden w-full">
        <HeroBackground />
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
            Location Map
          </h1>
          <p className="font-sans text-sm sm:text-base text-charcoal/60 max-w-xl mx-auto leading-relaxed">
            Direct Access from Hazara Expressway &amp; GT Road, Abbottabad
          </p>
        </div>
      </div>

      <div className="py-16 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">

        {/* Location Map Container */}
        <div className="bg-soft-white rounded-2xl border border-stone p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone pb-5">
            <div className="flex items-center space-x-3 text-verified-green">
              <MapPin className="w-6 h-6 shrink-0" />
              <div>
                <h2 className="font-display text-xl font-semibold text-charcoal">
                  Prime View Abbottabad Location Pin
                </h2>
                <p className="font-sans text-xs text-charcoal/60 mt-0.5">
                  Takia Sheikhan / Rajoya, Hazara Division, Khyber Pakhtunkhwa
                </p>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=34.0538,73.1534"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-verified-green hover:bg-[#137547] text-pure-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors duration-150 shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>
          </div>

          {/* Embedded Interactive Google Map */}
          <div className="relative w-full h-[550px] rounded-xl overflow-hidden border border-stone shadow-inner">
            <iframe
              title="Prime View Housing Society Location Map"
              src="https://maps.google.com/maps?q=34.0538,73.1534&z=13&t=k&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-charcoal/60 pt-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-charcoal">Hazara Expressway:</span>
              <span>15 Minutes drive</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-charcoal">Islamabad Marketing Office:</span>
              <span>{siteConfig.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
