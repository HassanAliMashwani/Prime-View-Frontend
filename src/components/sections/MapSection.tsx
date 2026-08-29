"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import { MapPin, Navigation, Layers, Compass, Globe, Map as MapIcon } from "lucide-react";

export const MapSection: React.FC = () => {
  const [mapView, setMapView] = useState<"satellite" | "roadmap" | "masterplan">("satellite");

  return (
    <section className="py-16 sm:py-24 bg-[#F4F1EA] text-charcoal border-b border-card-border/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Context & Office Info */}
          <div className="lg:col-span-5 space-y-6">
            <span className="kicker block text-xs font-semibold tracking-widest text-accent-green uppercase">
              LOCATION &amp; ACCESSIBILITY
            </span>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight leading-tight">
              Located Close to Heaven in Abbottabad
            </h2>

            <p className="font-sans text-sm sm:text-base text-muted-gray-text leading-relaxed">
              Prime View offers a serene natural setting combined with seamless
              GT Road accessibility. Visit our Islamabad Marketing &amp; Booking
              Office or explore our site location map.
            </p>

            {/* Office Location Box */}
            <div className="bg-pure-white p-5 rounded-2xl border border-card-border shadow-xs space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-accent-green uppercase tracking-wider">
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
                className="inline-flex items-center gap-2 bg-accent-green hover:bg-[#23533e] text-white font-sans text-xs font-bold px-6 py-3 rounded-xl shadow-xs transition-colors duration-150 uppercase tracking-wider"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>

              <Link
                href="/map-2"
                className="inline-flex items-center gap-2 bg-pure-white border border-card-border hover:border-secondary-border hover:bg-secondary-hover-bg text-charcoal font-sans text-xs font-semibold px-6 py-3 rounded-xl transition-colors duration-150 uppercase tracking-wider"
              >
                <Layers className="w-3.5 h-3.5 text-accent-green" />
                <span>Masterplan Layout</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Map with Switcher */}
          <div className="lg:col-span-7">
            <div className="bg-pure-white p-4 sm:p-5 rounded-2xl border border-card-border shadow-xs overflow-hidden">
              {/* Header & View Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 text-xs">
                <div className="flex items-center gap-2 text-accent-green font-semibold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Prime View Abbottabad Site Pin</span>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center gap-1.5 bg-soft-white p-1 rounded-xl border border-card-border">
                  <button
                    onClick={() => setMapView("satellite")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors duration-150 ${
                      mapView === "satellite"
                        ? "bg-accent-green text-pure-white shadow-xs"
                        : "text-muted-gray-text hover:text-charcoal"
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Satellite</span>
                  </button>

                  <button
                    onClick={() => setMapView("roadmap")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors duration-150 ${
                      mapView === "roadmap"
                        ? "bg-accent-green text-pure-white shadow-xs"
                        : "text-muted-gray-text hover:text-charcoal"
                    }`}
                  >
                    <MapIcon className="w-3 h-3" />
                    <span>Roadmap</span>
                  </button>

                  <button
                    onClick={() => setMapView("masterplan")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors duration-150 ${
                      mapView === "masterplan"
                        ? "bg-accent-green text-pure-white shadow-xs"
                        : "text-muted-gray-text hover:text-charcoal"
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Masterplan</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Map Display Container */}
              <div className="relative w-full h-[360px] sm:h-[420px] rounded-xl overflow-hidden border border-card-border bg-[#EFE7DA]/40">
                {mapView === "satellite" && (
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
                )}

                {mapView === "roadmap" && (
                  <iframe
                    title="Prime View Abbottabad Roadmap Location Map"
                    src="https://maps.google.com/maps?q=34.0538,73.1534&z=13&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                )}

                {mapView === "masterplan" && (
                  <div className="relative w-full h-full p-2 flex items-center justify-center bg-pure-white">
                    <Image
                      src="/assets/masterplan/prime-view-abbottabad-final-master-plan-11-08-2026.webp"
                      alt="Prime View Final Master Plan"
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
