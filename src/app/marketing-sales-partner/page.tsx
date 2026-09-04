import React from "react";
import Image from "next/image";
import { pagesData } from "@/data/pages";
import { executiveTeamProfiles } from "@/data/team";
import { TeamBentoGrid } from "@/components/sections/TeamBentoGrid";

export const metadata = {
  title: pagesData["marketing-sales-partner"].title,
  description: pagesData["marketing-sales-partner"].description,
};

export default function MarketingPartnerPage() {
  const marketingList = executiveTeamProfiles.filter(
    (m) => m.category === "Marketing Partner"
  );

  return (
    <div className="bg-[#F8F7F5] text-[#151914] min-h-screen">
      {/* ── HERO HEADER (SAME AS OUR PLANS PAGE) ── */}
      <div className="relative pt-28 sm:pt-36 pb-16 sm:pb-20 lg:pb-24 px-6 sm:px-8 lg:px-12 text-center overflow-hidden w-full">
        {/* Hero Background — Mountain Valley Landscape */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/new assests/our plan assests/hero background.jpeg?v=2"
            alt="Prime View Marketing & Sales Partner Hero Background"
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

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight font-bold leading-[1.05] uppercase drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">
            Marketing &amp; Sales Partner
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] tracking-wide max-w-2xl mx-auto leading-relaxed">
            Strategic Sales, Booking Allotment &amp; Customer Relations Management
          </p>
        </div>
      </div>

      <div className="pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-6 sm:-mt-8 lg:-mt-10">
        {/* Bento Grid */}
        <TeamBentoGrid members={marketingList} />
      </div>

    </div>
  );
}
