"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, Variants } from "framer-motion";

export const HeroSection: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants adhering strictly to max 24px translateY policy
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative w-full h-dvh min-h-[650px] flex flex-col justify-center items-center overflow-hidden">
      {/* Full-bleed background — real Abbottabad landscape */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/hero/prime-site-view-scaled.jpg"
          alt="Panoramic view of green hills and mountains near Abbottabad — Prime View Housing Society site"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Deep forest gradient — centered contrast over landscape */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(16,37,30,0.35) 0%, rgba(16,37,30,0.55) 45%, rgba(16,37,30,0.7) 75%, rgba(16,37,30,0.9) 100%)",
          }}
        />
      </div>

      {/* Hero content — perfectly centered */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6 pt-10"
      >
        {/* Primary headline */}
        <motion.h1
          variants={itemVariants}
          className="font-display text-5xl sm:text-7xl lg:text-8xl text-white leading-[1.05] tracking-tight"
        >
          Close to Heaven
        </motion.h1>

        {/* Secondary headline */}
        <motion.p
          variants={itemVariants}
          className="font-sans text-lg sm:text-xl text-warm-ivory/90 max-w-2xl mx-auto leading-relaxed"
        >
          Get Your Dream House Today in Abbottabad
        </motion.p>

        {/* Clear Conversion Path: Primary + Secondary CTAs */}
        <motion.div
          variants={itemVariants}
          className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-verified-green hover:bg-[#0e5735] text-white font-sans text-base font-bold px-9 py-4 rounded-xl tracking-wide uppercase shadow-[0_10px_28px_-4px_rgba(19,117,71,0.6)] border border-emerald-400/40 transition-all duration-200 ease-out hover:shadow-[0_14px_34px_-2px_rgba(19,117,71,0.75)] hover:-translate-y-1 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Book Now
          </Link>

          <Link
            href="/our-plans"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-warm-ivory font-sans text-base font-semibold px-8 py-4 rounded-xl tracking-wide border border-white/20 backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ivory"
          >
            Explore Properties
          </Link>
        </motion.div>
      </motion.div>

      {/* Static scroll cue — clean, unobtrusive */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-40">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-warm-ivory"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
};
