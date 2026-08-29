import React from "react";
import Image from "next/image";
import Link from "next/link";
import { galleryData } from "@/data/gallery";
import { ArrowRight, Eye } from "lucide-react";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";

export const GallerySection: React.FC = () => {
  return (
    <section className="bg-pure-white text-charcoal border-b border-stone/60 relative overflow-hidden">
      
      {/* Light Header Banner */}
      <div className="bg-[#FAF9F7] text-charcoal pt-32 sm:pt-36 pb-10 px-6 sm:px-8 lg:px-12 text-center border-b border-stone relative overflow-hidden w-full">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="kicker block text-xs font-semibold tracking-widest text-verified-green uppercase">
            VISUAL HIGHLIGHTS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight">
            Picture Gallery &amp; Media
          </h2>
          <p className="font-sans text-sm sm:text-base text-charcoal/60 leading-relaxed">
            Explore official brochures, project logos, masterplans, and site images.
          </p>
        </div>
      </div>

      <div className="py-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Masonry Layout replaced the old grid */}
        <div className="pt-6">
          <MasonryGrid />
        </div>

      </div>
    </section>
  );
};
