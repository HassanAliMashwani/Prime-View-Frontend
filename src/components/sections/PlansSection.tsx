"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { propertyPlans } from "@/data/properties";
import { Check, Calendar, ArrowRight, Info, Percent, MapPin, CalendarClock } from "lucide-react";

export const PlansSection: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Residential" | "Commercial">("All");

  const filteredPlans =
    selectedFilter === "All"
      ? propertyPlans
      : propertyPlans.filter((p) => p.category === selectedFilter);

  return (
    <section className="py-20 sm:py-28 bg-soft-white text-charcoal border-b border-stone/60 relative overflow-hidden">
      {/* ══════════════════════════════════════════════════════════════
          AMBIENT FOLIAGE BACKGROUND
      ══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] opacity-[0.06] blur-[100px]">
          <Image
            src="/images/decorative/foliage-bokeh.jpg"
            alt="Foliage Ambience"
            fill
            className="object-cover rounded-full"
          />
        </div>
      </div>

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

          <p className="font-sans text-xs sm:text-sm font-semibold text-charcoal/80 bg-stone-100 p-3 rounded-lg border border-stone/50 inline-block mt-4">
            Available Blocks: Abbott Block · Royal Block · Overseas Block · Elite Block · Chalet Block · NPF Phase 1 · NPF Phase 2
          </p>

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {(["All", "Residential", "Commercial"] as const).map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-5 py-2 rounded-xl text-xs font-sans font-semibold tracking-wide transition-colors duration-150 ${isActive
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
              className="bg-pure-white rounded-2xl border border-stone p-7 flex flex-col justify-between hover:border-stone hover:shadow-xs transition-colors duration-150 tilt-card-hover"
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

        {/* Terms & Conditions Block */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="relative bg-white rounded-2xl border border-stone shadow-sm overflow-hidden">
            {/* Top Indicator */}
            <div className="bg-verified-green/10 border-b border-verified-green/20 px-6 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-verified-green/20 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-verified-green" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-charcoal tracking-wide">
                  Important to Read
                </h4>
                <p className="text-xs text-charcoal/70">
                  Please review the following terms & conditions regarding payments
                </p>
              </div>
            </div>

            {/* Terms List */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-soft-white border border-stone flex items-center justify-center shrink-0 text-charcoal mt-0.5">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-display text-lg text-charcoal font-semibold mb-1">
                    10% Discount
                  </h5>
                  <p className="text-sm text-charcoal/70 leading-relaxed">
                    Enjoy a 10% discount on the total amount when making a full payment upfront.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-soft-white border border-stone flex items-center justify-center shrink-0 text-charcoal mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-display text-lg text-charcoal font-semibold mb-1">
                    10% Extra Charges
                  </h5>
                  <p className="text-sm text-charcoal/70 leading-relaxed">
                    An additional 10% charge applies for plots located on the main road or corner plots.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-soft-white border border-stone flex items-center justify-center shrink-0 text-charcoal mt-0.5">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-display text-lg text-charcoal font-semibold mb-1">
                    Monthly Installments
                  </h5>
                  <p className="text-sm text-charcoal/70 leading-relaxed">
                    All installments must be deposited by the 10th of each month to avoid any late fees.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
