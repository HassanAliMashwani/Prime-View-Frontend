import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, MapPin } from "lucide-react";
import { MagneticWrapper } from "@/components/ui/MagneticWrapper";

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

      {/* Hero Content — Centered Editorial Layout */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6 pt-10">
        
        {/* Primary Headline */}
        <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl text-pure-white leading-[1.05] tracking-tight">
          Close to Heaven
        </h1>

        {/* Secondary Headline */}
        <p className="font-sans text-lg sm:text-xl text-pure-white/90 max-w-2xl mx-auto leading-relaxed">
          Get Your Dream House Today in Abbottabad
        </p>
      </div>

      {/* Conversion Action Buttons (Moved to bottom) */}
      <div className="absolute bottom-12 sm:bottom-16 w-full z-10 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto">
          <MagneticWrapper className="w-full sm:w-auto">
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#F2BB84] hover:bg-[#EAAA6D] text-[#1E1E1C] font-sans text-sm font-bold px-8 py-4 rounded-xl tracking-wider uppercase shadow-md transition-colors duration-200 animate-pulse"
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
