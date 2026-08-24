import React from "react";
import Image from "next/image";
import Link from "next/link";
import { galleryData } from "@/data/gallery";
import { ArrowRight, Eye } from "lucide-react";

export const GallerySection: React.FC = () => {
  return (
    <section className="bg-pure-white text-charcoal border-b border-card-border/60 relative overflow-hidden">
      
      {/* Light Header Banner */}
      <div className="bg-[#F4F1EA] text-charcoal pt-32 sm:pt-36 pb-10 px-6 sm:px-8 lg:px-12 text-center border-b border-card-border relative overflow-hidden w-full">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="kicker block text-xs font-semibold tracking-widest text-accent-green uppercase">
            VISUAL HIGHLIGHTS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight">
            Picture Gallery &amp; Media
          </h2>
          <p className="font-sans text-sm sm:text-base text-muted-gray-text leading-relaxed">
            Explore official brochures, project logos, masterplans, and site images.
          </p>
        </div>
      </div>

      <div className="py-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {galleryData.map((item) => (
            <div
              key={item.id}
              className="bg-pure-white rounded-2xl border border-card-border overflow-hidden group hover:border-secondary-border hover:shadow-xs transition-colors duration-150 flex flex-col justify-between"
            >
              <div className="relative w-full aspect-[4/3] bg-soft-white overflow-hidden border-b border-card-border/60">
                <Image
                  src={item.imagePath}
                  alt={item.title}
                  fill
                  className="object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-102"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-charcoal/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-semibold uppercase tracking-wider text-pure-white bg-charcoal/90 py-1.5 px-4 rounded-xl shadow-xs flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> View Asset
                  </span>
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between flex-grow">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent-green block mb-1">
                    {item.category}
                  </span>
                  <h4 className="font-display text-base sm:text-lg text-charcoal font-medium tracking-tight mt-1 group-hover:text-accent-green transition-colors duration-150">
                    {item.title}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Link */}
        <div className="text-center mt-12">
          <Link
            href="/gallery-prime-view"
            className="inline-flex items-center gap-2 bg-charcoal hover:bg-black text-pure-white font-sans text-xs sm:text-sm font-semibold px-7 py-3.5 rounded-xl shadow-xs transition-colors duration-150"
          >
            <span>Open Full Picture Gallery &amp; Documents</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>
      </div>
    </section>
  );
};
