import React from "react";
import { pagesData } from "@/data/pages";
import { GallerySection } from "@/components/sections/GallerySection";

export const metadata = {
  title: pagesData["gallery-prime-view"].title,
  description: pagesData["gallery-prime-view"].description,
};

export default function GalleryPage() {
  return (
    <div className="bg-deep-forest min-h-screen">
      {/* Luxury Header Banner */}
      <div className="bg-deep-forest text-warm-ivory py-20 px-6 sm:px-8 lg:px-12 text-center border-b border-emerald-900/40 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="kicker block">MEDIA &amp; VISUAL GALLERY</span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-tight">
            {pagesData["gallery-prime-view"].h1}
          </h1>
          <p className="font-sans text-base text-warm-ivory/80 mt-2 max-w-xl mx-auto leading-relaxed">
            Explore official project photos, brochures, and visual updates
          </p>
        </div>
      </div>

      <GallerySection />
    </div>
  );
}
