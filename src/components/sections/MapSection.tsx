"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import { MapPin, Navigation, Layers, Compass, Globe, Map as MapIcon } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export const MapSection: React.FC = () => {
  // View switcher removed by user request

  return (
    <section className="py-16 sm:py-24 bg-soft-white text-charcoal border-b border-stone/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Context & Office Info */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal variant="bounce">
              <span className="kicker block text-xs font-semibold tracking-widest text-verified-green uppercase">
                LOCATION &amp; ACCESSIBILITY
              </span>
            </ScrollReveal>

            <ScrollReveal variant="blur-word" delay={0.2} className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight leading-tight">
              Located Close to Heaven in Abbottabad
            </ScrollReveal>

            <p className="font-sans text-sm sm:text-base text-charcoal/60 leading-relaxed">
              Prime View offers a serene natural setting combined with seamless
              GT Road accessibility. Visit our Islamabad Marketing &amp; Booking
              Office or explore our site location map.
            </p>

            {/* Office Location Box */}
            <div className="bg-pure-white p-5 rounded-2xl border border-stone shadow-xs space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-soft-white text-verified-green flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-verified-green uppercase tracking-wider">
                    Marketing &amp; Booking Office
                  </h4>
                  <p className="font-sans text-xs sm:text-sm text-charcoal/90 mt-0.5 leading-relaxed">
                    {siteConfig.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="https://maps.google.com/?q=34.0538,73.1534"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-verified-green hover:bg-[#137547] text-white font-sans text-xs font-bold px-6 py-3 rounded-xl shadow-xs transition-colors duration-150 uppercase tracking-wider"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>

              <Link
                href="/map-2"
                className="inline-flex items-center gap-2 bg-pure-white border border-stone hover:border-stone hover:bg-warm-beige text-charcoal font-sans text-xs font-semibold px-6 py-3 rounded-xl transition-colors duration-150 uppercase tracking-wider"
              >
                <Layers className="w-3.5 h-3.5 text-verified-green" />
                <span>Masterplan Layout</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Map with Switcher */}
          <div className="lg:col-span-7">
            <div className="bg-pure-white p-4 sm:p-5 rounded-2xl border border-stone shadow-xs overflow-hidden">
              {/* Map Display Container */}
              <div className="relative w-full h-[360px] sm:h-[420px] rounded-xl overflow-hidden border border-stone bg-[#EFE7DA]/40">
                <iframe
                  title="Prime View Abbottabad Satellite Location Map"
                  src="https://maps.google.com/maps?q=34.0538,73.1534&t=k&z=13&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
