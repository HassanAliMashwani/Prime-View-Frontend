"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MagneticWrapper } from "@/components/ui/MagneticWrapper";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export const HeroSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOpacity, setVideoOpacity] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      if (video.duration > 0) {
        // Fade out during the last 0.8 seconds
        if (video.duration - video.currentTime <= 0.8) {
          setVideoOpacity(0);
        } else if (video.currentTime < 0.5) {
          // Fade back in at the start
          setVideoOpacity(1);
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  return (
    <section className="relative w-full h-dvh min-h-[600px] sm:min-h-[650px] flex flex-col justify-center items-center overflow-hidden">
      {/* Full-bleed background — Abbottabad mountain landscape */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          ref={videoRef}
          src="/new assests/Vedios/PV WEBSITE - Trim Home page.mp4"
          autoPlay
          muted
          loop
          playsInline
          style={{ opacity: videoOpacity }}
          className="object-cover object-center w-full h-full transition-opacity duration-700 ease-in-out"
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
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center sm:items-stretch sm:pt-24">

        {/* Primary Headline */}
        <h1 className="w-full text-center sm:text-left sm:ml-8 lg:ml-20">
          <ScrollReveal
            variant="blur-word"
            delay={0.2}
            className="font-display text-5xl min-[390px]:text-6xl sm:text-7xl lg:text-[8rem] text-pure-white leading-[1.05] sm:leading-[1.0] tracking-tight inline-block"
          >
            Close to Heaven
          </ScrollReveal>
        </h1>


        {/* Secondary Headline (Offset) */}
        <div className="w-full flex justify-center sm:justify-end mt-4 sm:mt-16">
          <ScrollReveal
            variant="bounce"
            delay={0.8}
            className="font-sans text-base sm:text-lg sm:text-xl text-pure-white/90 max-w-sm w-fit text-center sm:text-right mx-auto sm:mx-0 sm:mr-16 lg:mr-32 border-r-2 border-[#C4A265] pr-4 sm:pr-6 leading-relaxed"
          >
            Get Your Dream House Today in Abbottabad
          </ScrollReveal>
        </div>
      </div>

      {/* Conversion Action Buttons — positioned below text, at bottom of section */}
      <div className="absolute bottom-10 sm:bottom-16 w-full z-10 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-2xl mx-auto">
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
