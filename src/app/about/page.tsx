import React from "react";
import { pagesData } from "@/data/pages";
import { AboutSection } from "@/components/sections/AboutSection";
import { AmenitiesSection } from "@/components/sections/AmenitiesSection";

export const metadata = {
  title: pagesData.about.title,
  description: pagesData.about.description,
};

export default function AboutPage() {
  return (
    <div className="bg-deep-forest">
      {/* Editorial Luxury Header Banner */}
      <div className="bg-deep-forest text-warm-ivory py-20 px-6 sm:px-8 lg:px-12 text-center border-b border-emerald-900/40 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="kicker block">ABOUT PRIME VIEW</span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-tight">
            {pagesData.about.h1}
          </h1>
          <p className="font-sans text-base text-warm-ivory/80 mt-2 max-w-xl mx-auto leading-relaxed">
            {pagesData.about.h2}
          </p>
        </div>
      </div>

      <AboutSection />
      <AmenitiesSection />
    </div>
  );
}
