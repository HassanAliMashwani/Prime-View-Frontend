"use client";

import React from "react";
import Image from "next/image";
import { PlotCarousel } from "@/components/ui/PlotCarousel";

export const CarouselSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-white border-b border-gray-100 relative overflow-hidden">
      {/* ══════════════════════════════════════════════════════════════
          AMBIENT TREE CANOPY STRIPS
      ══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-between">
        <div className="relative w-32 md:w-48 h-full opacity-10 blur-2xl -ml-16">
          <Image src="/images/decorative/tree-canopy-edge.jpg" alt="Tree Canopy" fill className="object-cover" />
        </div>
        <div className="relative w-32 md:w-48 h-full opacity-10 blur-2xl -mr-16 scale-x-[-1]">
          <Image src="/images/decorative/tree-canopy-edge.jpg" alt="Tree Canopy" fill className="object-cover" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-4 space-y-3 px-6">
          <span className="block text-xs font-semibold tracking-widest text-indigo-500 uppercase">
            Payment &amp; Plot Options
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-gray-900 tracking-tight font-medium">
            Find the perfect plan for you
          </h2>
          <p className="font-sans text-sm sm:text-base text-gray-500 leading-relaxed">
            Choose from our premium residential and commercial plots.
          </p>
        </div>

        <PlotCarousel />
      </div>
    </section>
  );
};
