"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import { MapPin, Navigation, Layers, Compass, Globe, Map as MapIcon } from "lucide-react";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

export const MapSection: React.FC = () => {
  const [mapView, setMapView] = useState<"satellite" | "roadmap" | "masterplan">("satellite");

  return (
    <section className="py-16 sm:py-24 bg-pine text-warm-ivory border-t border-emerald-900/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Context & Office Info */}
          <div className="lg:col-span-5 space-y-5">
            <StaggerContainer>
              <StaggerItem>
                <span className="kicker block mb-1">LOCATION &amp; ACCESSIBILITY</span>
              </StaggerItem>

              <StaggerItem yOffset={16}>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
                  Located Close to Heaven in Abbottabad
                </h2>
              </StaggerItem>

              <StaggerItem yOffset={12}>
                <p className="font-sans text-xs sm:text-sm text-warm-ivory/80 leading-relaxed pt-1">
                  Prime View offers a serene natural setting combined with seamless
                  GT Road accessibility. Visit our Islamabad Marketing &amp; Booking
                  Office or explore our site location map.
                </p>
              </StaggerItem>

              {/* Office Location Card */}
              <StaggerItem yOffset={14}>
                <LuxuryCard theme="dark" interactive={false} className="p-4 my-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-verified-green/20 border border-verified-green/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-sans text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                        Marketing &amp; Booking Office
                      </h4>
                      <p className="font-sans text-xs text-warm-ivory/90 mt-0.5 leading-relaxed">
                        {siteConfig.address}
                      </p>
                    </div>
                  </div>
                </LuxuryCard>
              </StaggerItem>

              {/* Navigation Action Buttons */}
              <StaggerItem>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="https://maps.google.com/?q=34.0538,73.1534"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-verified-green hover:bg-[#0e5735] text-white font-sans text-xs font-bold px-5 py-3 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verified-green"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>

                  <Link
                    href="/map-2"
                    className="inline-flex items-center gap-2 border border-stone/30 hover:border-stone hover:bg-white/5 text-warm-ivory font-sans text-xs font-semibold px-5 py-3 rounded-xl transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ivory"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Masterplan Layout</span>
                  </Link>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>

          {/* Right Column: Interactive Map with Default Satellite & Switcher */}
          <div className="lg:col-span-7">
            <SectionReveal yOffset={20}>
              <LuxuryCard theme="dark" interactive={false} className="p-4 sm:p-5 overflow-hidden">
                {/* Header & View Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold uppercase tracking-wider">
                    <Compass className="w-4 h-4" />
                    <span>Prime View Abbottabad Site Pin</span>
                  </div>

                  {/* View Mode Toggle Buttons */}
                  <div className="flex items-center gap-1.5 bg-deep-forest/90 p-1 rounded-lg border border-emerald-500/20">
                    <button
                      onClick={() => setMapView("satellite")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                        mapView === "satellite"
                          ? "bg-verified-green text-white shadow-xs"
                          : "text-warm-ivory/60 hover:text-white"
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>Satellite</span>
                    </button>

                    <button
                      onClick={() => setMapView("roadmap")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                        mapView === "roadmap"
                          ? "bg-verified-green text-white shadow-xs"
                          : "text-warm-ivory/60 hover:text-white"
                      }`}
                    >
                      <MapIcon className="w-3 h-3" />
                      <span>Roadmap</span>
                    </button>

                    <button
                      onClick={() => setMapView("masterplan")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold transition-all ${
                        mapView === "masterplan"
                          ? "bg-verified-green text-white shadow-xs"
                          : "text-warm-ivory/60 hover:text-white"
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Masterplan</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Map Display Container */}
                <div className="relative w-full h-[360px] sm:h-[420px] rounded-xl overflow-hidden border border-emerald-500/20 shadow-inner bg-deep-forest">
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
                    <div className="relative w-full h-full p-2 flex items-center justify-center">
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
              </LuxuryCard>
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
