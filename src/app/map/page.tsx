import React from "react";
import { pagesData } from "@/data/pages";
import { siteConfig } from "@/data/site";
import { MapPin, Navigation } from "lucide-react";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

export const metadata = {
  title: pagesData.map.title,
  description: pagesData.map.description,
};

export default function LocationMapPage() {
  return (
    <div className="bg-warm-ivory text-charcoal min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
        {/* Header Title Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="kicker block">GEO LOCATION &amp; ACCESS</span>
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
            Location Map
          </h1>
          <p className="font-sans text-sm sm:text-base text-charcoal/75 max-w-xl mx-auto leading-relaxed">
            Direct Access from Hazara Expressway &amp; GT Road, Abbottabad
          </p>
        </div>

        {/* Location Map Luxury Container */}
        <LuxuryCard theme="light" interactive={false} className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone/30 pb-5">
            <div className="flex items-center space-x-3 text-verified-green">
              <MapPin className="w-6 h-6 shrink-0" />
              <div>
                <h2 className="font-display text-xl font-semibold text-charcoal">
                  Prime View Abbottabad Location Pin
                </h2>
                <p className="font-sans text-xs text-charcoal/70 mt-0.5">
                  Takia Sheikhan / Rajoya, Hazara Division, Khyber Pakhtunkhwa
                </p>
              </div>
            </div>

            <a
              href="https://maps.google.com/?q=34.0538,73.1534"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-verified-green hover:bg-[#0e5735] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verified-green"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>
          </div>

          {/* Embedded Interactive Google Map */}
          <div className="relative w-full h-[550px] rounded-xl overflow-hidden border border-stone/40 shadow-inner">
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

          {/* Quick Location Summary Box */}
          <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-charcoal/80">
            <div>
              <span className="font-bold text-charcoal block mb-0.5">Site Location</span>
              <span>Rajoya / Takia Sheikhan, Abbottabad</span>
            </div>
            <div>
              <span className="font-bold text-charcoal block mb-0.5">Accessibility</span>
              <span>15 Mins from Hazara Expressway Interchange</span>
            </div>
            <div>
              <span className="font-bold text-charcoal block mb-0.5">Helpline</span>
              <a href="tel:0333-01-111-12" className="text-verified-green font-bold hover:underline">
                0333-01-111-12
              </a>
            </div>
          </div>
        </LuxuryCard>
      </div>
    </div>
  );
}
