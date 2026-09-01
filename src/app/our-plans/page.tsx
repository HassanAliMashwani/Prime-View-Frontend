"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { propertyPlans } from "@/data/properties";
import { PlotCarousel } from "@/components/ui/PlotCarousel";
import { Check, Calendar, ArrowUpRight, Star, Info, Percent, MapPin, CalendarClock } from "lucide-react";
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

          <div className="relative z-10 max-w-4xl mx-auto">
            
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-charcoal tracking-tight font-bold leading-[1.1] mb-4 uppercase"
            >
              <span className="text-[#B29A68]">4 Year</span> Payment Plan
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-sans text-base sm:text-lg text-charcoal/60 max-w-2xl mx-auto leading-relaxed uppercase tracking-wider font-medium"
            >
             
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

          {/* Terms & Conditions Block */}
          <div className="mt-8 bg-white rounded-2xl border border-black/[0.08] shadow-sm max-w-4xl mx-auto relative overflow-hidden">
            {/* Top Indicator */}
            <div className="bg-[#B29A68]/10 border-b border-[#B29A68]/20 px-4 py-2.5 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#B29A68]/20 flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5 text-[#B29A68]" />
              </div>
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                Terms &amp; Conditions
              </h4>
            </div>

            {/* Terms List */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 bg-[#FAF9F7] p-3.5 rounded-xl border border-black/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-white border border-black/[0.06] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Percent className="w-4 h-4 text-[#B29A68]" />
                </div>
                <div>
                  <h5 className="font-display text-sm text-charcoal font-bold mb-0.5">
                    10% Discount
                  </h5>
                  <p className="text-xs text-charcoal/70 leading-relaxed">
                    On full payment upfront.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#FAF9F7] p-3.5 rounded-xl border border-black/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-white border border-black/[0.06] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <MapPin className="w-4 h-4 text-[#B29A68]" />
                </div>
                <div>
                  <h5 className="font-display text-sm text-charcoal font-bold mb-0.5">
                    10% Extra Charges
                  </h5>
                  <p className="text-xs text-charcoal/70 leading-relaxed">
                    For main road and corner plots.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#FAF9F7] p-3.5 rounded-xl border border-black/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-white border border-black/[0.06] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <CalendarClock className="w-4 h-4 text-[#B29A68]" />
                </div>
                <div>
                  <h5 className="font-display text-sm text-charcoal font-bold mb-0.5">
                    Installment Deadline
                  </h5>
                  <p className="text-xs text-charcoal/70 leading-relaxed">
                    Must be deposited by the 10th of each month.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
