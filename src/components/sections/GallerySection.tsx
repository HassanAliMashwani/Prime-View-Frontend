"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { galleryData } from "@/data/gallery";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { LuxuryCard } from "@/components/ui/LuxuryCard";
import { ArrowRight, Eye } from "lucide-react";

export const GallerySection: React.FC = () => {
  return (
    <section className="py-24 sm:py-32 bg-pine text-warm-ivory border-t border-emerald-900/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Section Header */}
        <SectionReveal className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="kicker block">VISUAL HIGHLIGHTS</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Picture Gallery &amp; Media
          </h2>
          <p className="font-sans text-sm sm:text-base text-warm-ivory/75 leading-relaxed">
            Explore official brochures, project logos, masterplans, and site images.
          </p>
        </SectionReveal>

        {/* Gallery Cards Grid */}
        <StaggerContainer
          staggerDelay={0.1}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {galleryData.map((item) => (
            <StaggerItem key={item.id}>
              <LuxuryCard
                theme="dark"
                interactive={true}
                className="overflow-hidden group h-full flex flex-col justify-between"
              >
                <div className="relative w-full aspect-[4/3] bg-deep-forest overflow-hidden border-b border-emerald-500/20">
                  <Image
                    src={item.imagePath}
                    alt={item.title}
                    fill
                    className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-deep-forest/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-deep-forest/95 py-1.5 px-4 rounded border border-emerald-500/40 flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> View Asset
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-between flex-grow">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      {item.category}
                    </span>
                    <h4 className="font-display text-base sm:text-lg text-white font-medium tracking-tight mt-1 group-hover:text-emerald-300 transition-colors duration-200">
                      {item.title}
                    </h4>
                  </div>
                </div>
              </LuxuryCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom Link */}
        <SectionReveal delay={0.2} className="text-center mt-12">
          <Link
            href="/gallery-prime-view"
            className="inline-flex items-center gap-2 border border-emerald-500/30 hover:border-emerald-400 hover:bg-white/5 text-warm-ivory font-sans text-xs sm:text-sm font-semibold px-7 py-3.5 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <span>Open Full Picture Gallery &amp; Documents</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </SectionReveal>
      </div>
    </section>
  );
};
