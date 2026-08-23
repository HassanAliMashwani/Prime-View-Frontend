"use client";

import React from "react";
import Link from "next/link";
import { executiveTeamProfiles } from "@/data/team";
import { TeamMemberCard } from "@/components/ui/TeamMemberCard";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { ArrowRight } from "lucide-react";

export const TeamSection: React.FC = () => {
  return (
    <section className="py-24 sm:py-32 bg-deep-forest text-warm-ivory border-t border-emerald-900/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-14 relative z-10">
        {/* Section Header */}
        <SectionReveal className="text-center max-w-3xl mx-auto space-y-3">
          <span className="kicker block">LEADERSHIP &amp; MANAGEMENT</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Our Management &amp; Partners
          </h2>
          <p className="font-sans text-sm sm:text-base text-warm-ivory/75 leading-relaxed">
            Dedicated leadership guiding Prime View Co-Operative Housing Society Ltd Hazara Division.
          </p>
        </SectionReveal>

        {/* Member Cards Grid */}
        <StaggerContainer
          staggerDelay={0.08}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {executiveTeamProfiles.slice(0, 4).map((member) => (
            <StaggerItem key={member.id}>
              <TeamMemberCard {...member} theme="dark" />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Action Button */}
        <SectionReveal delay={0.2} className="text-center pt-2">
          <Link
            href="/owners"
            className="inline-flex items-center gap-2 bg-verified-green hover:bg-emerald-600 text-white font-sans font-semibold text-xs sm:text-sm px-7 py-3.5 rounded-full transition-all duration-200 shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verified-green"
          >
            <span>View All Managing Committee &amp; Partners</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </SectionReveal>
      </div>
    </section>
  );
};
