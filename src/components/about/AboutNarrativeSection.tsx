"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Compass,
  HardHat,
  Users,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

interface NarrativePhase {
  id: string;
  step: string;
  badge: string;
  title: string;
  summary: string;
  image: string;
  icon: React.ElementType;
  tag: string;
}

const phases: NarrativePhase[] = [
  {
    id: "phase-1",
    step: "01",
    badge: "Origin",
    title: "Foundation & Registration",
    summary: "Formally chartered and legally registered under the Cooperative Societies Department of KPK, Hazara Division.",
    image: "/assets/gallery/hero-collage-editorial.jpg",
    icon: ShieldCheck,
    tag: "Legal Inception",
  },
  {
    id: "phase-2",
    step: "02",
    badge: "Planning",
    title: "Masterplan Approved",
    summary: "Government-approved layout mapping carpeted arterial roads, scenic parks, mosques, and underground utilities.",
    image: "/assets/masterplan/prime-view-abbottabad-final-master-plan-11-08-2026.webp",
    icon: Compass,
    tag: "Statutory Approval",
  },
  {
    id: "phase-3",
    step: "03",
    badge: "Execution",
    title: "On-Ground Development",
    summary: "Heavy earthworks, paved road networks, engineered sewerage, and complete perimeter boundary security walls.",
    image: "/new assests/about page logos/drone pic.jpg",
    icon: HardHat,
    tag: "Active Construction",
  },
  {
    id: "phase-4",
    step: "04",
    badge: "Expansion",
    title: "Community Growth",
    summary: "Hundreds of families and overseas Pakistani members joined Prime View on the bedrock of cooperative transparency.",
    image: "/assets/gallery/meeting-prime-view.jpg",
    icon: Users,
    tag: "Member Allotments",
  },
  {
    id: "phase-5",
    step: "05",
    badge: "Future",
    title: "The Vision Ahead",
    summary: "Grand mosque inauguration, eco-parks, community club, and phased plot possession for Abbottabad's signature address.",
    image: "/assets/hero/prime-site-view-scaled.jpg",
    icon: Sparkles,
    tag: "Possession Handover",
  },
];

const AUTOPLAY_DURATION = 3800; // 3.8s per phase

export const AboutNarrativeSection: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % phases.length);
    }, AUTOPLAY_DURATION);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activePhase = phases[activeIdx];
  const IconComponent = activePhase.icon;

  return (
    <section
      className="py-14 sm:py-18 bg-[#FAF9F6] text-charcoal border-b border-card-border/60 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10">

        {/* ── Compact Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Our Story &amp; Journey</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl text-charcoal font-bold tracking-tight">
              Our Narrative
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal/50 font-medium">Phase</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-card-border shadow-2xs text-charcoal">
              {activePhase.step} / 0{phases.length}
            </span>
          </div>
        </div>

        {/* ── Auto-Playing Phase Navigation Pills ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
          {phases.map((phase, idx) => {
            const isActive = activeIdx === idx;
            const PIcon = phase.icon;

            return (
              <button
                key={phase.id}
                onClick={() => setActiveIdx(idx)}
                className={`relative text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? "bg-white border-[#d08535] shadow-sm ring-1 ring-[#d08535]/30"
                    : "bg-white/70 hover:bg-white border-card-border/70 text-charcoal/70"
                }`}
                aria-label={`Phase ${phase.step}: ${phase.title}`}
              >
                {/* Progress countdown bar for active step */}
                {isActive && !isPaused && (
                  <motion.div
                    key={activeIdx}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: AUTOPLAY_DURATION / 1000, ease: "linear" }}
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-[#d08535]"
                  />
                )}

                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span className={`text-[11px] font-bold ${isActive ? "text-[#d08535]" : "text-charcoal/50"}`}>
                    Phase {phase.step}
                  </span>
                  <PIcon className={`w-3.5 h-3.5 ${isActive ? "text-[#d08535]" : "text-charcoal/40"}`} />
                </div>

                <p className={`text-xs font-semibold line-clamp-1 ${isActive ? "text-charcoal" : "text-charcoal/70"}`}>
                  {phase.title}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Compact Animated Split Visual Card ── */}
        <div className="bg-white rounded-2xl border border-card-border shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch min-h-[300px] sm:min-h-[320px]">

            {/* Left: Concise Text Info */}
            <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePhase.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-3"
                >
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{activePhase.tag}</span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-bold text-charcoal tracking-tight">
                    {activePhase.title}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-muted-gray-text leading-relaxed">
                    {activePhase.summary}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress Dots Indicator */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-card-border/50">
                {phases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeIdx === i ? "w-6 bg-[#d08535]" : "w-1.5 bg-gray-200 hover:bg-gray-300"
                    }`}
                    aria-label={`Jump to phase ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right: High-Impact Visual Image Panel */}
            <div className="md:col-span-7 relative min-h-[220px] md:min-h-full bg-gray-100 overflow-hidden border-t md:border-t-0 md:border-l border-card-border/60">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePhase.id}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={activePhase.image}
                    alt={activePhase.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 55vw"
                  />
                  {/* Subtle corner vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-black/20 md:to-transparent" />

                  {/* Floating Phase Pill on Image */}
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-sm">
                      <IconComponent className="w-3.5 h-3.5 text-[#F2BB84]" />
                      <span>Phase {activePhase.step}</span>
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};


