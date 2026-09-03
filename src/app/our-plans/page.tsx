"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { propertyPlans } from "@/data/properties";
import { PlotCarousel } from "@/components/ui/PlotCarousel";
import { Check, Calendar, ArrowUpRight, Star, Info, Percent, MapPin, CalendarDays, ShieldCheck, FileText, ChevronRight } from "lucide-react";

// Static pre-calculated 12-lobed rosette points to prevent SSR/client hydration floating-point precision mismatches
const SCALLOP_POINTS = [
  { cx: 34, cy: 0 },
  { cx: 29.44, cy: 17 },
  { cx: 17, cy: 29.44 },
  { cx: 0, cy: 34 },
  { cx: -17, cy: 29.44 },
  { cx: -29.44, cy: 17 },
  { cx: -34, cy: 0 },
  { cx: -29.44, cy: -17 },
  { cx: -17, cy: -29.44 },
  { cx: 0, cy: -34 },
  { cx: 17, cy: -29.44 },
  { cx: 29.44, cy: -17 },
];

function ScallopedBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center">
      <svg viewBox="-50 -50 100 100" className="absolute inset-0 w-full h-full text-[#1B4324] fill-current">
        <circle r="40" />
        {SCALLOP_POINTS.map((pt, i) => (
          <circle key={i} cx={pt.cx} cy={pt.cy} r="12" />
        ))}
      </svg>
      <div className="relative z-10 text-white flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

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

      <div className="min-h-screen text-charcoal" style={{ background: '#F8F7F5' }}>

        {/* ── HERO HEADER ─────────────────────────── */}
        <div className="relative pt-28 sm:pt-36 pb-36 sm:pb-52 lg:pb-64 px-6 sm:px-8 lg:px-12 text-center overflow-hidden">
          {/* Hero Background — Mountain Valley Landscape */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/new assests/our plan assests/hero background.jpeg?v=2"
              alt="Prime View Mountain Valley Landscape"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Gradient: dark at top for text, fades to cream at bottom so cards blend in */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(248,247,245,0.7) 80%, #F8F7F5 100%)',
              }}
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tight font-bold leading-[1.05] mb-4 uppercase text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]"
            >
              4 Year Payment Plan
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-white/90 text-sm sm:text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] tracking-wide"
            >
              Flexible &amp; Affordable Installments — Prime View, Abbottabad
            </motion.p>
          </div>
        </div>

        {/* ── CARDS SECTION — overlaps the hero ─────────── */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 -mt-32 sm:-mt-44 lg:-mt-52 z-10">

          <div className="relative z-10">
            <PlotCarousel />
          </div>

          {/* Terms & Conditions Block — Compact Size (max-w-[860px]) */}
          <div className="mt-12 max-w-[860px] mx-auto bg-white/95 rounded-[26px] pt-5 pb-6 px-5 sm:px-7 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF0E7] flex items-center justify-center shrink-0 border border-[#1B4324]/10">
                  <ShieldCheck className="w-5 h-5 text-[#1B4324] stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#1B4324] uppercase">
                    Terms &amp; Conditions
                  </h3>
                  <p className="text-[11.5px] sm:text-xs text-[#606A5D] font-medium">
                    Important terms to ensure transparency and trust.
                  </p>
                </div>
              </div>

              {/* Official Policy Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/[0.12] bg-white text-[#1B4324] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase shadow-xs">
                <FileText className="w-3.5 h-3.5 text-[#1B4324]" />
                <span>Official Society Policy</span>
                <ChevronRight className="w-3 h-3 text-[#1B4324] stroke-[2.5]" />
              </div>
            </div>

            {/* 3 Cards — Compact Pure HTML/CSS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
              {/* Card 1: 10% Discount */}
              <div className="rounded-[18px] p-4 sm:p-4.5 bg-[#FAF9F5] border border-black/[0.05] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-3">
                  <ScallopedBadge>
                    <Percent className="w-5 h-5 text-white stroke-[2.8]" />
                  </ScallopedBadge>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4324] leading-none tracking-tight">10%</div>
                    <div className="text-[11px] font-extrabold tracking-wider text-[#1B4324] mt-0.5 uppercase">Discount</div>
                  </div>
                </div>

                {/* Accent line with center dot */}
                <div className="flex items-center gap-1 my-2">
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8BBA2]" />
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                </div>

                <p className="text-xs font-medium text-[#4A5347] leading-relaxed">
                  On full payment upfront.
                </p>
              </div>

              {/* Card 2: 10% Extra Charges */}
              <div className="rounded-[18px] p-4 sm:p-4.5 bg-[#FAF9F5] border border-black/[0.05] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-3">
                  <ScallopedBadge>
                    <MapPin className="w-5 h-5 text-white stroke-[2.2]" />
                  </ScallopedBadge>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4324] leading-none tracking-tight">10%</div>
                    <div className="text-[11px] font-extrabold tracking-wider text-[#1B4324] mt-0.5 uppercase">Extra Charges</div>
                  </div>
                </div>

                {/* Accent line with center dot */}
                <div className="flex items-center gap-1 my-2">
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8BBA2]" />
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                </div>

                <p className="text-xs font-medium text-[#4A5347] leading-relaxed">
                  For main road and corner plots.
                </p>
              </div>

              {/* Card 3: Installment Deadline */}
              <div className="rounded-[18px] p-4 sm:p-4.5 bg-[#FAF9F5] border border-black/[0.05] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center gap-3">
                  <ScallopedBadge>
                    <CalendarDays className="w-5 h-5 text-white stroke-[2.2]" />
                  </ScallopedBadge>
                  <div>
                    <div className="text-[12.5px] sm:text-[13px] font-extrabold tracking-wider text-[#1B4324] leading-tight uppercase">
                      Installment<br />Deadline
                    </div>
                  </div>
                </div>

                {/* Accent line with center dot */}
                <div className="flex items-center gap-1 my-2">
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8BBA2]" />
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                </div>

                <p className="text-xs font-medium text-[#4A5347] leading-relaxed">
                  Must be deposited by the 10th of each month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
