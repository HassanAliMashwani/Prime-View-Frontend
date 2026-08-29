import React from "react";
import { ShieldCheck, FileCheck, Check } from "lucide-react";

export const AboutTrustStrip: React.FC = () => {
  return (
    <section className="bg-warm-beige text-charcoal py-16 sm:py-20 border-b border-card-border/70">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading + Sentence */}
          <div className="lg:col-span-5 space-y-3">
            <span className="kicker block text-xs font-bold tracking-widest text-accent-green uppercase">
              LEGAL &amp; COOPERATIVE STANDARDS
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight leading-tight">
              Official Cooperative Governance
            </h2>
            <p className="font-sans text-sm sm:text-base text-muted-gray-text leading-relaxed">
              Prime View operates under the formal Cooperative Societies Department framework with full legal title, transparent administration, and verified town planning.
            </p>
          </div>

          {/* Right Column: Compact Factual Chips List */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-pure-white border border-card-border shadow-2xs flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-charcoal font-medium">
                Registered with Cooperative Societies Department KPK
              </span>
            </div>

            <div className="p-4 rounded-xl bg-pure-white border border-card-border shadow-2xs flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-charcoal font-medium">
                Hazara Division Approved Final Master Plan
              </span>
            </div>

            <div className="p-4 rounded-xl bg-pure-white border border-card-border shadow-2xs flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-charcoal font-medium">
                100% On-Ground Infrastructure &amp; Paved Boulevards
              </span>
            </div>

            <div className="p-4 rounded-xl bg-pure-white border border-card-border shadow-2xs flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-tint-bg text-accent-green flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-charcoal font-medium">
                Dedicated Legal, Committee &amp; Management Oversight
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
