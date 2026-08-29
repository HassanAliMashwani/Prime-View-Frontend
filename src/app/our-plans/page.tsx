"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { propertyPlans } from "@/data/properties";
import { PlotCarousel } from "@/components/ui/PlotCarousel";
import { Check, Calendar, ArrowUpRight, Star } from "lucide-react";

/* ─────────────────────────────────────────────
   Per-card accent palette
───────────────────────────────────────────── */
const ACCENTS: Record<string, { orb: string; badge: string; border: string; glow: string; featured?: boolean }> = {
  "com-4marla": {
    orb: "radial-gradient(circle at 60% 30%, rgba(242,187,132,0.55) 0%, rgba(234,170,109,0.15) 55%, transparent 80%)",
    badge: "bg-[#B29A68]/20 text-[#B29A68] border-[#B29A68]/40",
    border: "border-[#B29A68]/60",
    glow: "shadow-[0_0_60px_rgba(242,187,132,0.25)]",
    featured: true,
  },
  "res-5marla": {
    orb: "radial-gradient(circle at 60% 30%, rgba(110,196,158,0.45) 0%, rgba(16,185,129,0.1) 55%, transparent 80%)",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-emerald-200/60",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.12)]",
  },
  "res-7marla": {
    orb: "radial-gradient(circle at 60% 30%, rgba(167,139,250,0.4) 0%, rgba(139,92,246,0.1) 55%, transparent 80%)",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    border: "border-violet-200/60",
    glow: "shadow-[0_0_40px_rgba(139,92,246,0.12)]",
  },
  "res-10marla": {
    orb: "radial-gradient(circle at 60% 30%, rgba(96,165,250,0.4) 0%, rgba(59,130,246,0.1) 55%, transparent 80%)",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-200/60",
    glow: "shadow-[0_0_40px_rgba(59,130,246,0.12)]",
  },
  "res-1kanal": {
    orb: "radial-gradient(circle at 60% 30%, rgba(244,163,135,0.45) 0%, rgba(249,115,22,0.1) 55%, transparent 80%)",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    border: "border-orange-200/60",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.12)]",
  },
};

/* ─────────────────────────────────────────────
   Individual plan card
───────────────────────────────────────────── */
function PlanCard({ plan, index }: { plan: (typeof propertyPlans)[0]; index: number }) {
  const accent = ACCENTS[plan.id] ?? ACCENTS["res-5marla"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`relative group flex flex-col rounded-[28px] border bg-white/70 backdrop-blur-sm
        ${accent.border} ${accent.glow}
        p-7 transition-all duration-500 ease-out
        hover:-translate-y-2 hover:scale-[1.018]
        ${accent.featured ? "ring-2 ring-[#B29A68]/60" : ""}
        overflow-hidden`}
    >
      {/* Animated background orb */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]" aria-hidden>
        <div className="absolute inset-0 animate-[orb-float_7s_ease-in-out_infinite]" style={{ background: accent.orb }} />
      </div>

      {/* "Best Investment" badge for featured */}
      {accent.featured && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1.5 bg-[#1B1B1B] text-[#B29A68] text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-b-xl shadow-lg">
            <Star className="w-3 h-3 fill-[#B29A68]" />
            Best Investment
          </div>
        </div>
      )}

      {/* Top row */}
      <div className="relative z-10 flex items-center justify-between mb-5 mt-3">
        <span className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${accent.badge}`}>
          {plan.category}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-charcoal/50 font-medium">
          <Calendar className="w-3 h-3" />
          <span>{plan.installmentPeriod}</span>
        </div>
      </div>

      {/* Plot size */}
      <div className="relative z-10 mb-6">
        <h3 className="font-display text-3xl sm:text-[2.6rem] text-charcoal font-bold tracking-tight leading-none">
          {plan.size}
        </h3>
        <div className="h-[2px] w-10 rounded-full bg-charcoal/10 mt-3" />
      </div>

      {/* Features */}
      <div className="relative z-10 flex-1 space-y-2.5 mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/40 mb-3">
          What&apos;s included
        </p>
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm text-charcoal/80">
            <div className="w-5 h-5 rounded-full bg-charcoal/8 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-charcoal/60" strokeWidth={2.5} />
            </div>
            <span className="leading-tight">{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="relative z-10">
        <Link
          href="/contact"
          className={`
            group/btn w-full inline-flex items-center justify-center gap-2
            py-3.5 rounded-2xl text-sm font-semibold tracking-wide
            transition-all duration-300
            ${accent.featured
              ? "bg-[#1B1B1B] text-[#B29A68] hover:bg-black shadow-lg hover:shadow-xl hover:shadow-black/20"
              : "bg-black/5 hover:bg-charcoal text-charcoal hover:text-white border border-charcoal/10 hover:border-transparent"
            }
          `}
        >
          <span>Book This Plot</span>
          <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </Link>
      </div>
    </motion.div>
  );
}


/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
import { HeroBackground } from "@/components/ui/HeroBackground";

export default function OurPlansPage() {
  return (
    <>
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translate(0,0) scale(1); opacity: .9; }
          33%       { transform: translate(8px,-12px) scale(1.04); opacity: 1; }
          66%       { transform: translate(-6px,8px) scale(.97); opacity: .85; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-charcoal">

        {/* ── HERO HEADER ─────────────────────────────── */}
        <div className="relative bg-[#FAF9F7] pt-24 sm:pt-28 pb-8 px-6 sm:px-8 lg:px-12 text-center overflow-hidden border-b border-black/[0.06]">
          <HeroBackground />

          <div className="relative z-10 max-w-3xl mx-auto">
            

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-6xl text-charcoal tracking-tight font-bold leading-[1.1] mb-4"
            >
              Our Payment &amp; Plot Plans
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-sans text-base text-charcoal/60 max-w-xl mx-auto leading-relaxed"
            >
              Flexible &amp; Affordable Installments Without Financial Strain
            </motion.p>
          </div>
        </div>



        {/* ── CARDS GRID ──────────────────────────────── */}
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-8 pt-8">
          {/* Ambient blobs */}
          <div className="absolute top-1/4 left-0 w-72 h-72 bg-[#B29A68]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-violet-300/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 -mx-6">
            <PlotCarousel />
          </div>


        </div>
      </div>
    </>
  );
}
