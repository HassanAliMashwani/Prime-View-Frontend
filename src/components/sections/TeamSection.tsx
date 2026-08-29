import React from "react";
import Link from "next/link";
import { executiveTeamProfiles } from "@/data/team";
import { TeamMarquee } from "@/components/sections/TeamMarquee";
import { ArrowRight } from "lucide-react";

export const TeamSection: React.FC = () => {
  const allMembers = executiveTeamProfiles.filter(m => m.category === "Managing Committee");

  return (
    <section className="py-20 sm:py-28 bg-pure-white text-charcoal border-b border-card-border/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="kicker block text-xs font-semibold tracking-widest text-accent-green uppercase">
            LEADERSHIP &amp; MANAGEMENT
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight">
            Our Management &amp; Partners
          </h2>
          <p className="font-sans text-sm sm:text-base text-muted-gray-text leading-relaxed">
            Dedicated leadership guiding Prime View Co-Operative Housing Society Ltd Hazara Division.
          </p>
        </div>

        {/* Members Marquee Carousel */}
        <div className="w-full">
          <TeamMarquee members={allMembers} speed={3000} />
        </div>

        {/* Action Button */}
        <div className="text-center pt-4">
          <Link
            href="/owners"
            className="inline-flex items-center gap-2 bg-charcoal hover:bg-black text-pure-white font-sans font-semibold text-xs sm:text-sm px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <span>View All Managing Committee &amp; Partners</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>
      </div>
    </section>
  );
};
