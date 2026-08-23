"use client";

import React, { useState } from "react";
import Link from "next/link";
import { propertyPlans } from "@/data/properties";
import { Check, Calendar, ArrowRight } from "lucide-react";
import { SectionReveal } from "@/components/motion/SectionReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

export const PlansSection: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Residential" | "Commercial">("All");

  const filteredPlans =
    selectedFilter === "All"
      ? propertyPlans
      : propertyPlans.filter((p) => p.category === selectedFilter);

  return (
    <section className="py-24 sm:py-32 bg-warm-ivory text-charcoal border-t border-stone/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Section Header */}
        <SectionReveal className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="kicker block">PAYMENT &amp; PLOT OPTIONS</span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight">
            Flexible &amp; Affordable Installment Plans
          </h2>
          <p className="font-sans text-sm sm:text-base text-charcoal/75 leading-relaxed">
            Secure your dream home in Abbottabad today with low down payments and
            convenient monthly installments.
          </p>

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {(["All", "Residential", "Commercial"] as const).map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-5 py-2 rounded-lg text-xs font-sans font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? "bg-verified-green text-white shadow-md"
                      : "bg-white text-charcoal/70 border border-stone/50 hover:border-stone hover:text-charcoal"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </SectionReveal>

        {/* Property Cards Grid */}
        <StaggerContainer
          key={selectedFilter}
          staggerDelay={0.08}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredPlans.map((plan) => (
            <StaggerItem key={plan.id}>
              <LuxuryCard
                theme="light"
                interactive={true}
                className="p-7 h-full flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-verified-green">
                      {plan.category} Plot
                    </span>
                    <span className="font-mono text-xs text-charcoal/50">Verified Plan</span>
                  </div>

                  <h3 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold mb-2 tracking-tight group-hover:text-verified-green transition-colors duration-200">
                    {plan.size}
                  </h3>

                  <div className="flex items-center text-xs text-charcoal/70 mt-1 mb-6 gap-1.5">
                    <Calendar className="w-4 h-4 text-verified-green shrink-0" />
                    <span className="font-medium">{plan.installmentPeriod}</span>
                  </div>

                  <div className="border-t border-stone/30 pt-5 space-y-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/60 block">
                      Included Highlights
                    </span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start text-xs sm:text-sm text-charcoal/80 gap-2.5">
                        <div className="w-4 h-4 rounded bg-verified-green/10 text-verified-green flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-stone/30">
                  <Link
                    href="/contact"
                    className="w-full flex items-center justify-center gap-2 bg-verified-green hover:bg-[#0e5735] text-white font-sans text-sm font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_14px_rgba(19,117,71,0.4)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(19,117,71,0.55)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verified-green"
                  >
                    <span>Inquire About {plan.size}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </LuxuryCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Bottom Catalog Link */}
        <SectionReveal delay={0.2} className="text-center mt-12">
          <Link
            href="/our-plans"
            className="inline-flex items-center gap-2 border border-charcoal/30 hover:border-charcoal hover:bg-charcoal hover:text-white text-charcoal font-sans text-xs sm:text-sm font-semibold px-7 py-3 rounded-full transition-all duration-200"
          >
            <span>View Full Payment Schedule &amp; Brochure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </SectionReveal>
      </div>
    </section>
  );
};
