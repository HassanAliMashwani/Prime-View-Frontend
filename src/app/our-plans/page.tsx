import React from "react";
import Link from "next/link";
import { pagesData } from "@/data/pages";
import { propertyPlans } from "@/data/properties";
import { Check, Calendar, ArrowRight } from "lucide-react";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

export const metadata = {
  title: pagesData["our-plans"].title,
  description: pagesData["our-plans"].description,
};

export default function OurPlansPage() {
  return (
    <div className="bg-warm-ivory text-charcoal min-h-screen">
      {/* Luxury Header Banner */}
      <div className="bg-deep-forest text-warm-ivory py-20 px-6 sm:px-8 lg:px-12 text-center border-b border-emerald-900/40 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="kicker block">PROPERTY CATALOG &amp; INSTALLMENTS</span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-tight">
            {pagesData["our-plans"].h1}
          </h1>
          <p className="font-sans text-base text-warm-ivory/80 mt-2 max-w-xl mx-auto leading-relaxed">
            {pagesData["our-plans"].h2}
          </p>
        </div>
      </div>

      {/* Property Listing Grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {propertyPlans.map((plan) => (
            <LuxuryCard
              key={plan.id}
              theme="light"
              interactive={true}
              className="p-7 flex flex-col justify-between group h-full"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-verified-green">
                    {plan.category} Plot
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-charcoal/60 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-verified-green" />
                    <span>{plan.installmentPeriod}</span>
                  </div>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl text-charcoal font-semibold mb-3 tracking-tight group-hover:text-verified-green transition-colors duration-200">
                  {plan.size}
                </h3>

                <div className="border-t border-stone/30 pt-4 space-y-2.5 mb-6">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal/60 block mb-1">
                    Features Included
                  </span>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start text-xs sm:text-sm text-charcoal/80 gap-2">
                      <div className="w-4 h-4 rounded bg-verified-green/10 text-verified-green flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone/30">
                <Link
                  href="/contact"
                  className="w-full flex items-center justify-center gap-2 bg-verified-green hover:bg-[#0e5735] text-white font-sans text-sm font-bold py-3.5 px-4 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verified-green"
                >
                  <span>Inquire &amp; Book {plan.size}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </LuxuryCard>
          ))}
        </div>
      </div>
    </div>
  );
}
