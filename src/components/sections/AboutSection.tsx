import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export const AboutSection: React.FC = () => {
  return (
    <section className="relative bg-warm-beige text-charcoal py-16 sm:py-24 overflow-hidden border-b border-stone/60">
      {/* Blended House Image on Right */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-7/12 h-full z-0 pointer-events-none">
        <Image
          src="/assets/gallery/luxury-house-about.jpg"
          alt="Modern luxury house villa surrounded by lush nature"
          fill
          className="object-cover object-center lg:object-right opacity-90"
          sizes="(max-width: 1024px) 100vw, 60vw"
        />

        {/* Gradient Mask: Solid warm-beige on left, transitioning to clear image on right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #EFE7DA 0%, #EFE7DA 15%, rgba(239,231,218,0.95) 35%, rgba(239,231,218,0.6) 60%, rgba(239,231,218,0.2) 85%, transparent 100%)",
          }}
        />

        {/* Vertical fade for small screens */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, #EFE7DA 0%, rgba(239,231,218,0.9) 45%, rgba(239,231,218,0.4) 100%)",
          }}
        />
      </div>

      {/* Content Container on Left */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="max-w-xl lg:max-w-2xl space-y-6">
          {/* Kicker */}
          <ScrollReveal variant="bounce">
            <span className="kicker block text-xs font-semibold tracking-widest text-verified-green uppercase">
              ABOUT PRIME VIEW
            </span>
          </ScrollReveal>

          {/* Headline */}
          <ScrollReveal variant="blur-word" delay={0.2} className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal leading-[1.15] tracking-tight">
            A Modern Living Experience Surrounded by Nature
          </ScrollReveal>

          {/* Summary Copy */}
          <p className="text-charcoal/60 font-sans text-sm sm:text-base leading-relaxed">
            At Prime View, natural mountain surroundings meet top-notch
            infrastructure and modern amenities in Abbottabad, supported by
            convenient installment plans designed to secure your dream home.
          </p>

          {/* Bespoke Editorial Pull Quote (No generic card box) */}
          <div className="border-l-3 border-verified-green pl-5 py-2 my-4">
            <blockquote className="font-display italic text-lg sm:text-xl text-charcoal leading-snug">
              &ldquo;Some places are built. Others are felt.&rdquo;
            </blockquote>
          </div>

          {/* CTA Action */}
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-charcoal hover:bg-black text-pure-white font-sans text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-xs transition-colors duration-200"
            >
              <span>Contact Us Today</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
