import React from "react";
import { pagesData } from "@/data/pages";
import { executiveTeamProfiles } from "@/data/team";
import { TeamBentoGrid } from "@/components/sections/TeamBentoGrid";
import { HeroBackground } from "@/components/ui/HeroBackground";

export const metadata = {
  title: pagesData.owners.title,
  description: pagesData.owners.description,
};

export default function OwnersPage() {
  const ownersList = executiveTeamProfiles.filter(
    (m) => m.category === "Managing Committee"
  );

  return (
    <div className="bg-[#F8F7F5] text-[#151914] min-h-screen">
      {/* Light Header Banner */}
      <div className="bg-[#FAF9F7] pt-24 sm:pt-28 pb-8 px-6 sm:px-8 lg:px-12 text-center border-b border-black/[0.06] relative overflow-hidden w-full">
        <HeroBackground />
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <h1 className="font-display text-4xl sm:text-5xl text-[#151914] tracking-tight font-bold">
            Managing Committee &amp; Owners
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#6B7462] max-w-xl mx-auto leading-relaxed">
            Prime View Co-Operative Housing Society Ltd Hazara Division Executive Management
          </p>
        </div>
      </div>

      <div className="pt-8 pb-16 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bento Grid */}
        <TeamBentoGrid members={ownersList} />
      </div>
    </div>
  );
}
