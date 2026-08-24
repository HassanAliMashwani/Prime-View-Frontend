import React from "react";
import { pagesData } from "@/data/pages";
import { siteConfig } from "@/data/site";
import { MapPin, Navigation } from "lucide-react";

export const metadata = {
  title: pagesData.map.title,
  description: pagesData.map.description,
};

export default function LocationMapPage() {
  return (
    <div className="bg-pure-white text-charcoal min-h-screen pt-28 sm:pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
        {/* Header Title Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="kicker block text-xs font-semibold tracking-widest text-accent-green uppercase">
            GEO LOCATION &amp; ACCESS
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
            Location Map
          </h1>
          <p className="font-sans text-sm sm:text-base text-muted-gray-text max-w-xl mx-auto leading-relaxed">
            Direct Access from Hazara Expressway &amp; GT Road, Abbottabad
          </p>
        </div>

        {/* Location Map Container */}
        <div className="bg-soft-white rounded-2xl border border-card-border p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-card-border pb-5">
            <div className="flex items-center space-x-3 text-accent-green">
              <MapPin className="w-6 h-6 shrink-0" />
              <div>
                <h2 className="font-display text-xl font-semibold text-charcoal">
                  Prime View Abbottabad Location Pin
                </h2>
                <p className="font-sans text-xs text-muted-gray-text mt-0.5">
                  Takia Sheikhan / Rajoya, Hazara Division, Khyber Pakhtunkhwa
                </p>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=34.0538,73.1534"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent-green hover:bg-[#23533e] text-pure-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors duration-150 shadow-xs flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>
          </div>

          {/* Embedded Interactive Google Map */}
          <div className="relative w-full h-[550px] rounded-xl overflow-hidden border border-card-border shadow-inner">
            <iframe
              title="Prime View Housing Society Location Map"
              src="https://maps.google.com/maps?q=34.0538,73.1534&z=13&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-gray-text pt-2">
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
