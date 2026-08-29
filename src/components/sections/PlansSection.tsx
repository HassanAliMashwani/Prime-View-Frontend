"use client";

import React, { useState } from "react";
import Link from "next/link";
import { propertyPlans } from "@/data/properties";
import { Check, Calendar, ArrowRight } from "lucide-react";

export const PlansSection: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Residential" | "Commercial">("All");

  const filteredPlans =
    selectedFilter === "All"
      ? propertyPlans
      : propertyPlans.filter((p) => p.category === selectedFilter);

  return (
    <section className="py-20 sm:py-28 bg-soft-white text-charcoal border-b border-stone/60 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="kicker block text-xs font-semibold tracking-widest text-verified-green uppercase">
            PAYMENT &amp; PLOT OPTIONS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal tracking-tight">
            Flexible &amp; Affordable Installment Plans
          </h2>
          <p className="font-sans text-sm sm:text-base text-charcoal/60 leading-relaxed">
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
                  className={`px-5 py-2 rounded-xl text-xs font-sans font-semibold tracking-wide transition-colors duration-150 ${
                    isActive
                      ? "bg-verified-green text-pure-white shadow-xs"
                      : "bg-pure-white text-charcoal/80 border border-stone hover:border-stone hover:bg-warm-beige"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Property Plot Editorial Panels (Bespoke layout, no card-grid box anti-pattern) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-pure-white rounded-2xl border border-stone p-7 flex flex-col justify-between hover:border-stone hover:shadow-xs transition-colors duration-150"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-verified-green">
                    {plan.category} Plot
                  </span>
                  <span className="font-mono text-[11px] text-charcoal/60">Verified Plan</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold mb-2 tracking-tight">
                  {plan.size}
                </h3>

                <div className="flex items-center text-xs text-charcoal/60 mt-1 mb-6 gap-1.5">
                  <Calendar className="w-4 h-4 text-verified-green shrink-0" />
                  <span className="font-medium">{plan.installmentPeriod}</span>
                </div>

                <div className="border-t border-stone/60 pt-5 space-y-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/60 block">
                    Included Highlights
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start text-xs sm:text-sm text-charcoal/85 gap-2.5">
                      <div className="w-4 h-4 rounded bg-soft-white text-verified-green flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-stone/60">
                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 bg-charcoal hover:bg-black text-pure-white text-xs font-semibold py-3 rounded-xl transition-colors duration-150"
                >
                  <span>Inquire About This Plan</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
