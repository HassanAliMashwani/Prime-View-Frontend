import React from "react";
import { pagesData } from "@/data/pages";
import { executiveTeamProfiles } from "@/data/team";
import { TeamBentoGrid } from "@/components/sections/TeamBentoGrid";

export const metadata = {
  title: pagesData["legal-team"].title,
  description: pagesData["legal-team"].description,
};

export default function LegalTeamPage() {
  const legalList = executiveTeamProfiles.filter(
    (m) => m.category === "Legal Team"
  );

  return (
    <div className="bg-pure-white text-charcoal min-h-screen pt-28 sm:pt-32 pb-16 overflow-hidden">
      <div className="w-full space-y-12">
        {/* Header Title Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto px-6 sm:px-8">
          <span className="kicker block text-xs font-semibold tracking-widest text-accent-green uppercase">
            LEGAL ADVISORS
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
            Legal Team
          </h1>
          <p className="font-sans text-sm sm:text-base text-muted-gray-text max-w-xl mx-auto leading-relaxed">
            Legal counsel and advisors for Prime View Co-Operative Housing Society Ltd
          </p>
        </div>

        {/* Bento Grid */}
        <TeamBentoGrid members={legalList} />
      </div>
    </div>
  );
}
