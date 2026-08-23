import React from "react";
import { pagesData } from "@/data/pages";
import { executiveTeamProfiles } from "@/data/team";
import { TeamMemberCard } from "@/components/ui/TeamMemberCard";

export const metadata = {
  title: pagesData["marketing-sales-partner"].title,
  description: pagesData["marketing-sales-partner"].description,
};

export default function MarketingPartnerPage() {
  const marketingList = executiveTeamProfiles.filter(
    (m) => m.category === "Marketing Partner"
  );

  return (
    <div className="bg-deep-forest text-warm-ivory min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
        {/* Header Title Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="kicker block">OFFICIAL PARTNER</span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-tight">
            Marketing &amp; Sales Partner
          </h1>
          <p className="font-sans text-sm sm:text-base text-warm-ivory/80 max-w-xl mx-auto leading-relaxed">
            Strategic Sales, Booking Allotment &amp; Customer Relations Management
          </p>
        </div>

        {/* Members Grid with LuxuryCard styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {marketingList.map((member) => (
            <TeamMemberCard key={member.id} {...member} theme="dark" />
          ))}
        </div>
      </div>
    </div>
  );
}
