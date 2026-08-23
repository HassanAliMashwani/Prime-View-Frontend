"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { LuxuryCard } from "@/components/ui/LuxuryCard";
import { ArrowRight } from "lucide-react";

export const AboutSection: React.FC = () => {
  return (
    <section className="relative bg-warm-ivory text-charcoal py-16 sm:py-24 overflow-hidden">
      {/* Blended House Image on Right — Fades to Left */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-7/12 h-full z-0 pointer-events-none">
        <Image
          src="/assets/gallery/luxury-house-about.jpg"
          alt="Modern luxury house villa surrounded by lush nature"
          fill
          priority
          className="object-cover object-center lg:object-right"
          sizes="(max-width: 1024px) 100vw, 60vw"
        />

        {/* Gradient Mask: Solid warm-ivory on left, transitioning to clear image on right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #F4F0E7 0%, #F4F0E7 12%, rgba(244,240,231,0.95) 30%, rgba(244,240,231,0.6) 55%, rgba(244,240,231,0.15) 80%, transparent 100%)",
          }}
        />

        {/* Vertical fade for small screens */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(to bottom, #F4F0E7 0%, rgba(244,240,231,0.85) 45%, rgba(244,240,231,0.3) 100%)",
          }}
        />
      </div>

      {/* Content Container on Left */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="max-w-xl lg:max-w-2xl space-y-5">
          <StaggerContainer>
            {/* Kicker */}
            <StaggerItem>
              <span className="kicker block mb-1">ABOUT</span>
            </StaggerItem>

            {/* Headline */}
            <StaggerItem yOffset={16}>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-charcoal leading-[1.15] tracking-tight">
                A Modern Living Experience Surrounded by Nature
              </h2>
            </StaggerItem>

            {/* Concise summary copy */}
            <StaggerItem yOffset={12}>
              <p className="text-charcoal/85 font-sans text-sm sm:text-base leading-relaxed pt-1">
                At Prime View, natural mountain surroundings meet top-notch
                infrastructure and modern amenities in Abbottabad, supported by
                convenient installment plans designed to secure your dream home.
              </p>
            </StaggerItem>

            {/* Pull quote card */}
            <StaggerItem yOffset={12}>
              <LuxuryCard
                theme="light"
                interactive={false}
                className="p-4 my-2 border-l-4 border-l-muted-brass border-t-0 border-r-0 border-b-0 rounded-r-xl rounded-l-none bg-white/80 backdrop-blur-xs shadow-xs"
              >
                <blockquote className="font-display italic text-base sm:text-lg text-charcoal/90 leading-snug">
                  &ldquo;Some places are built. Others are felt.&rdquo;
                </blockquote>
              </LuxuryCard>
            </StaggerItem>

            {/* CTA action */}
            <StaggerItem>
              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 bg-charcoal hover:bg-black text-warm-ivory font-sans text-xs sm:text-sm font-semibold px-6 py-3 rounded-full shadow-md transition-all duration-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
                >
                  <span>Read More About Us</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
};
