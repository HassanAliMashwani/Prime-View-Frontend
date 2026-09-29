import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, MapPin } from "lucide-react";
import { MagneticWrapper } from "@/components/ui/MagneticWrapper";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full min-h-[100dvh] sm:h-dvh sm:min-h-[650px] flex flex-col justify-center items-center overflow-hidden py-20 sm:py-0">
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
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-6 sm:pt-24 flex flex-col items-center sm:items-stretch">

        {/* Mobile-Only Location & Society Badge */}
        <div className="inline-flex sm:hidden items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 text-white/95 text-xs font-medium self-center mb-3.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Galyat Bypass, Abbottabad</span>
        </div>

        {/* Primary Headline */}
        <ScrollReveal variant="blur-word" delay={0.2} className="font-display text-5xl sm:text-7xl lg:text-[8rem] text-pure-white leading-[1.05] sm:leading-[1.0] tracking-tight text-center sm:text-left sm:ml-8 lg:ml-20">
          Close to Heaven
        </ScrollReveal>

        {/* Secondary Headline (Offset) */}
        <div className="w-full flex justify-center sm:justify-end mt-4 sm:mt-16">
          <ScrollReveal variant="bounce" delay={0.8} className="font-sans text-base sm:text-lg sm:text-xl text-pure-white/90 max-w-sm text-center sm:text-right mx-auto sm:mx-0 sm:mr-16 lg:mr-32 border-b-2 sm:border-b-0 sm:border-r-2 border-[#43612B] pb-2 sm:pb-0 sm:pr-6 leading-relaxed">
            Get Your Dream House Today in Abbottabad
          </ScrollReveal>
        </div>

        {/* Mobile-Only Key Highlights Glass Strip */}
        <div className="sm:hidden grid grid-cols-3 gap-2 w-full max-w-sm mx-auto mt-6 p-2 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 text-center shadow-lg">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[11px] font-bold text-white leading-tight">NOC</span>
            <span className="text-[9px] text-white/70">Approved</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-black text-emerald-400 mb-0.5">5, 10, 20</span>
            <span className="text-[11px] font-bold text-white leading-tight">Marla</span>
            <span className="text-[9px] text-white/70">Plots</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs font-black text-emerald-400 mb-0.5">4-Year</span>
            <span className="text-[11px] font-bold text-white leading-tight">Easy</span>
            <span className="text-[9px] text-white/70">Plans</span>
          </div>
        </div>
      </div>

      {/* Conversion Action Buttons */}
      <div className="relative sm:absolute sm:bottom-16 w-full z-10 px-6 mt-6 sm:mt-0">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto">
          <MagneticWrapper className="w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#43612B] hover:bg-[#324920] text-white font-sans text-sm font-bold px-8 py-3.5 sm:py-4 rounded-xl tracking-wider uppercase shadow-[0_4px_20px_rgba(67,97,43,0.4)] transition-colors duration-200 animate-pulse"
            >
              Book Now
            </Link>
          </MagneticWrapper>

          <Link
            href="/our-plans"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white/15 hover:bg-white/25 text-white font-sans text-sm font-semibold px-8 py-3.5 sm:py-4 rounded-xl tracking-wider uppercase border border-white/30 backdrop-blur-xs transition-colors duration-200"
          >
            Explore Properties
          </Link>
        </div>
      </div>
    </section>
  );
};
