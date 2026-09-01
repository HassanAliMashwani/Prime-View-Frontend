import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, MapPin } from "lucide-react";
import { MagneticWrapper } from "@/components/ui/MagneticWrapper";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full h-dvh min-h-[650px] flex flex-col justify-center items-center overflow-hidden">
      {/* Full-bleed background — Abbottabad mountain landscape */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/hero/prime-site-view-scaled.jpg"
          alt="Panoramic view of green hills and mountains near Abbottabad — Prime View Housing Society site"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Subtle balanced gradient overlay for contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(27,27,27,0.3) 0%, rgba(27,27,27,0.5) 50%, rgba(27,27,27,0.78) 100%)",
          }}
        />
      </div>

      {/* Hero Content — Asymmetrical Editorial Layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-16 sm:pt-24 flex flex-col">

        {/* Primary Headline */}
        <ScrollReveal variant="blur-word" delay={0.2} className="font-display text-5xl sm:text-7xl lg:text-[8rem] text-pure-white leading-[1.0] tracking-tight text-left sm:ml-8 lg:ml-20">
          Close to Heaven
        </ScrollReveal>

        {/* Secondary Headline (Offset) */}
        <div className="w-full flex justify-end mt-8 sm:mt-16">
          <ScrollReveal variant="bounce" delay={0.8} className="font-sans text-lg sm:text-xl text-pure-white/90 max-w-sm text-right mr-4 sm:mr-16 lg:mr-32 border-r-2 border-muted-brass pr-6 leading-relaxed">
            Get Your Dream House Today in Abbottabad
          </ScrollReveal>
        </div>
      </div>

      {/* Conversion Action Buttons (Moved to bottom) */}
      <div className="absolute bottom-12 sm:bottom-16 w-full z-10 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
          <MagneticWrapper className="w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#B29A68] hover:bg-[#B29A68] text-[#1B1B1B] font-sans text-sm font-bold px-8 py-4 rounded-xl tracking-wider uppercase shadow-md transition-colors duration-200 animate-pulse"
            >
              Book Now
            </Link>
          </MagneticWrapper>

          <Link
            href="/our-plans"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white/15 hover:bg-white/25 text-white font-sans text-sm font-semibold px-8 py-4 rounded-xl tracking-wider uppercase border border-white/30 backdrop-blur-xs transition-colors duration-200"
          >
            Explore Properties
          </Link>
        </div>
      </div>
    </section>
  );
};
