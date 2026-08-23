"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Zap,
  Flame,
  Droplets,
  Pipette,
  ShieldCheck,
  Building2,
  Compass,
} from "lucide-react";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

interface AmenityVisualCard {
  title: string;
  image: string;
  icon: React.ElementType;
}

interface AmenityChapter {
  id: string;
  stepNumber: string;
  category: string;
  title: string;
  oneLiner: string;
  heroImage: string;
  cards: AmenityVisualCard[];
}

const amenityChapters: AmenityChapter[] = [
  {
    id: "chapter-utilities",
    stepNumber: "01",
    category: "ESSENTIAL LIVING",
    title: "Uninterrupted Utilities",
    oneLiner: "Power, gas, and clean water — always available.",
    heroImage: "/assets/gallery/luxury-house-about.jpg",
    cards: [
      {
        title: "24/7 Power Grid",
        image: "/assets/amenities/power-grid.jpg",
        icon: Zap,
      },
      {
        title: "Natural Gas Network",
        image: "/assets/amenities/natural-gas.jpg",
        icon: Flame,
      },
      {
        title: "Filtered Potable Water",
        image: "/assets/amenities/clean-water.jpg",
        icon: Droplets,
      },
    ],
  },
  {
    id: "chapter-infrastructure",
    stepNumber: "02",
    category: "TOWN PLANNING",
    title: "Modern Infrastructure",
    oneLiner: "Built for smooth movement and long-term reliability.",
    heroImage: "/assets/amenities/modern-infrastructure-hero.jpg",
    cards: [
      {
        title: "Wide Carpeted Roads",
        image: "/assets/amenities/society-carpeted-road.jpg",
        icon: Compass,
      },
      {
        title: "Underground Sewerage",
        image: "/assets/amenities/underground-sewerage.jpg",
        icon: Pipette,
      },
    ],
  },
  {
    id: "chapter-community",
    stepNumber: "03",
    category: "LIFESTYLE & SECURITY",
    title: "Community Peace",
    oneLiner: "Safe, spiritual, and family-centered living.",
    heroImage: "/assets/gallery/site-best-pic.jpg",
    cards: [
      {
        title: "Jamia Grand Mosque",
        image: "/assets/amenities/grand-mosque-community.jpg",
        icon: Building2,
      },
      {
        title: "24/7 Gated Security",
        image: "/assets/amenities/gated-security.jpg",
        icon: ShieldCheck,
      },
    ],
  },
];

export const AmenitiesSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Observer to track which chapter is currently in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    chapterRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveStep(index);
            }
          });
        },
        {
          rootMargin: "-25% 0px -40% 0px",
          threshold: 0.1,
        }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  const scrollToChapter = (index: number) => {
    setActiveStep(index);
    const target = chapterRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const current = amenityChapters[activeStep];

  return (
    <section className="py-20 sm:py-28 bg-deep-forest text-warm-ivory border-t border-emerald-900/30 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-emerald-500/5 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* ========================================================================= */}
          {/* 1. STICKY LEFT PANEL (Pinned on desktop with High Contrast Palette) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 z-20 space-y-6">
            {/* Main Section Kicker — Bold */}
            <span className="kicker block text-muted-brass font-black text-xs sm:text-sm tracking-widest uppercase font-sans">
              MODERN FACILITIES
            </span>

            {/* Dynamic Step Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={current.stepNumber}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="font-display text-5xl sm:text-6xl text-white font-black tracking-tight"
                  >
                    {current.stepNumber}
                  </motion.span>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.span
                    key={current.category}
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="text-xs font-bold uppercase tracking-wider text-warm-ivory bg-white/10 px-3.5 py-1.5 rounded-lg border border-white/20 shadow-xs"
                  >
                    {current.category}
                  </motion.span>
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-2"
                >
                  <h2 className="font-display text-3xl sm:text-4xl text-white font-bold tracking-tight leading-tight">
                    {current.title}
                  </h2>
                  <p className="font-sans text-sm sm:text-base text-warm-ivory/90 font-normal leading-relaxed">
                    {current.oneLiner}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Interactive Progress Indicator & Chapter Selector (Varied Contrast) */}
            <div className="pt-5 border-t border-white/15 space-y-3">
              <div className="flex items-center justify-between text-xs font-sans mb-1">
                <span className="font-bold text-warm-ivory/80 tracking-wider uppercase text-[11px]">
                  Story Chapters
                </span>
                <span className="font-mono text-warm-ivory font-bold text-xs bg-white/10 px-2.5 py-1 rounded-md border border-white/15">
                  0{activeStep + 1} / 0{amenityChapters.length}
                </span>
              </div>

              <div className="space-y-2">
                {amenityChapters.map((chap, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <button
                      key={chap.id}
                      onClick={() => scrollToChapter(idx)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs sm:text-sm font-sans transition-all duration-200 flex items-center justify-between group ${
                        isActive
                          ? "bg-warm-ivory text-charcoal font-bold border-2 border-white shadow-[0_6px_24px_rgba(0,0,0,0.35)]"
                          : "bg-white/5 border border-white/15 text-warm-ivory hover:bg-white/15 hover:text-white font-medium shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isActive ? "text-verified-green" : "text-muted-brass"
                          }`}
                        >
                          {chap.stepNumber}
                        </span>
                        <span className="tracking-wide">{chap.title}</span>
                      </div>
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          isActive
                            ? "bg-verified-green ring-4 ring-verified-green/20"
                            : "bg-white/20 group-hover:bg-white/50"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. DYNAMIC RIGHT CONTENT (Clean Visuals & Photo Cards) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 space-y-20 lg:space-y-24">
            {amenityChapters.map((chapter, idx) => (
              <div
                key={chapter.id}
                ref={(el) => {
                  chapterRefs.current[idx] = el;
                }}
                className="scroll-mt-32 space-y-4"
              >
                {/* Hero Visual Panel (Pure clean photography without pills on the image) */}
                <div className="relative w-full aspect-[16/8] sm:aspect-[16/7.2] max-h-[350px] rounded-2xl overflow-hidden shadow-xl border border-emerald-500/20 group bg-deep-forest">
                  <Image
                    src={chapter.heroImage}
                    alt={chapter.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </div>

                {/* Visual Photo Cards (Clean photography without overlay icons) */}
                <div
                  className={`grid grid-cols-1 ${
                    chapter.cards.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  } gap-4`}
                >
                  {chapter.cards.map((card) => (
                    <LuxuryCard
                      key={card.title}
                      theme="dark"
                      interactive={true}
                      className="overflow-hidden group p-0 flex flex-col justify-between bg-pine/70 border border-emerald-500/20"
                    >
                      {/* Card Image Thumbnail */}
                      <div
                        className={`relative w-full ${
                          chapter.cards.length === 2
                            ? "aspect-[16/8.5] max-h-[180px]"
                            : "aspect-[16/9.5] max-h-[165px]"
                        } bg-deep-forest overflow-hidden`}
                      >
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                          sizes="(max-width: 768px) 100vw, 30vw"
                        />
                      </div>

                      {/* Crisp Title Footer */}
                      <div className="p-3.5">
                        <h4 className="font-display text-sm sm:text-base text-white font-semibold tracking-tight group-hover:text-emerald-300 transition-colors duration-200">
                          {card.title}
                        </h4>
                      </div>
                    </LuxuryCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
