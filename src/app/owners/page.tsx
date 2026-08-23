import React from "react";
import { pagesData } from "@/data/pages";
import { executiveTeamProfiles } from "@/data/team";
import { TeamMemberCard } from "@/components/ui/TeamMemberCard";

export const metadata = {
  title: pagesData.owners.title,
  description: pagesData.owners.description,
};

export default function OwnersPage() {
  const ownersList = executiveTeamProfiles.filter(
    (m) => m.category === "Managing Committee"
  );

  return (
    <div className="bg-deep-forest text-warm-ivory min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
        {/* Header Title Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="kicker block">MANAGING COMMITTEE</span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-tight">
            Managing Committee &amp; Owners
          </h1>
          <p className="font-sans text-sm sm:text-base text-warm-ivory/80 max-w-xl mx-auto leading-relaxed">
            Prime View Co-Operative Housing Society Ltd Hazara Division Executive Management
          </p>
        </div>

        {/* Members Grid with LuxuryCard styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {ownersList.map((member) => (
            <TeamMemberCard key={member.id} {...member} theme="dark" />
          ))}
        </div>
      </div>
    </div>
  );
}
