import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const AboutFinalCta: React.FC = () => {
  return (
    <section className="bg-pure-white text-charcoal py-20 sm:py-28 border-b border-card-border/60">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
        <span className="kicker block text-xs font-bold tracking-widest text-accent-green uppercase">
          JOIN PRIME VIEW ABBOTTABAD
        </span>
        
        <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-charcoal tracking-tight leading-tight">
          Start Building Your Future in Abbottabad
        </h2>

        <p className="font-sans text-sm sm:text-base text-muted-gray-text max-w-xl mx-auto leading-relaxed">
          Explore residential plot sizes, verified masterplan layouts, or schedule an on-site visit with our representative team today.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent-green hover:bg-[#23533e] text-pure-white text-xs sm:text-sm font-bold uppercase tracking-wider px-8 py-4 rounded-xl shadow-xs transition-colors duration-180"
          >
            <span>Book Now</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          <Link
            href="/our-plans"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-pure-white hover:bg-secondary-hover-bg text-charcoal border border-[#E8E1D5] text-xs sm:text-sm font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-colors duration-180"
          >
            Explore Plans
          </Link>
        </div>
      </div>
    </section>
  );
};
