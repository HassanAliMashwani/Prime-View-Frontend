import React from "react";
import Image from "next/image";
import { pagesData } from "@/data/pages";
import { LocationMapCard } from "@/components/map/LocationMapCard";

export const metadata = {
  title: pagesData.map.title,
  description: pagesData.map.description,
};

export default function LocationMapPage() {
  return (
    <div className="bg-[#F8F7F5] text-[#151914] min-h-screen">
      {/* ── HERO HEADER ── */}
      <div className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 lg:pb-28 px-6 sm:px-8 lg:px-12 text-center overflow-hidden w-full">
        {/* Hero Background — Mountain Valley Landscape */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/new assests/our plan assests/hero background.jpeg?v=2"
            alt="Prime View Location Map Hero Background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient: dark at top for text, fades to cream at bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(248,247,245,0.7) 80%, #F8F7F5 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-3 sm:space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight font-bold leading-[1.05] uppercase drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">
            Location Map
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] tracking-wide max-w-xl mx-auto leading-relaxed">
            Direct Access from Hazara Expressway &amp; GT Road, Abbottabad
          </p>
        </div>
      </div>

      <div className="pb-20 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10 -mt-6 sm:-mt-10">
        <LocationMapCard />
      </div>
    </div>
  );
}

