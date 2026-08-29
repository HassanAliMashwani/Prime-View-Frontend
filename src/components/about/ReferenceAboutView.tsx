"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  ArrowRight,
  X,
  ShieldCheck,
  MapPin,
  Building2,
  Check,
  Star,
  Eye,
} from "lucide-react";
import { siteConfig } from "@/data/site";

/**
 * Prime View About Us Page — Contoured Bento Blueprint
 * 
 * Accurately implements the exact wireframe geometry:
 * - NO duplicate navbar (site global Header handles navigation).
 * - Upper Left: 3 horizontal pill bars (Headline & Subtext) nestled into the top-left shoulder notch.
 * - Upper Right: 2 vertical stat cards side-by-side nestled into the top-right notch.
 * - Central Media Canvas: Custom interlocking contoured canvas with video tour launcher.
 * - Bottom Left: Reassurance checkmark lines + Primary CTA pill in bottom-left notch.
 * - Bottom Right: Floating Social Proof & Governance review widget in bottom-right notch.
 */

export function ReferenceAboutView() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="bg-[#F7F4EE] text-charcoal py-16 sm:py-24 px-3 sm:px-6 md:px-8 lg:px-10 flex flex-col items-center justify-center font-sans antialiased">
      {/* ══════════════════════════════════════════════════════════════
          OUTER CONTAINER / MAIN BOARD FRAME (Border removed)
      ══════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-[1360px] flex flex-col gap-6 sm:gap-7 transition-all">

        {/* ══════════════════════════════════════════════════════════════
            DESKTOP CONTOURED BENTO CANVAS & SLOTS (lg+)
        ══════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block relative w-full h-[660px]">

          {/* ── 1. CENTRAL CONTOURED MEDIA CANVAS (Interlocking Silhouette) ── */}
          <div className="absolute inset-0 z-0 drop-shadow-md">
            {/* Clipped Media Content (Luxury Villa Photo + Gradient + Video Trigger) */}
            <div
              className="absolute inset-0 pointer-events-none bg-[#1E1E1E]"
              style={{
                WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 660' preserveAspectRatio='none'%3E%3Cpath d='M 420 0 H 728 A 28 28 0 0 1 756 28 V 212 A 28 28 0 0 0 784 240 H 1172 A 28 28 0 0 1 1200 268 V 460 A 28 28 0 0 1 1172 488 H 788 A 28 28 0 0 0 760 516 V 632 A 28 28 0 0 1 732 660 H 508 A 28 28 0 0 1 480 632 V 588 A 28 28 0 0 0 452 560 H 28 A 28 28 0 0 1 0 532 V 308 A 28 28 0 0 1 28 280 H 364 A 28 28 0 0 0 392 252 V 28 A 28 28 0 0 1 420 0 Z' /%3E%3C/svg%3E")`,
                WebkitMaskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 660' preserveAspectRatio='none'%3E%3Cpath d='M 420 0 H 728 A 28 28 0 0 1 756 28 V 212 A 28 28 0 0 0 784 240 H 1172 A 28 28 0 0 1 1200 268 V 460 A 28 28 0 0 1 1172 488 H 788 A 28 28 0 0 0 760 516 V 632 A 28 28 0 0 1 732 660 H 508 A 28 28 0 0 1 480 632 V 588 A 28 28 0 0 0 452 560 H 28 A 28 28 0 0 1 0 532 V 308 A 28 28 0 0 1 28 280 H 364 A 28 28 0 0 0 392 252 V 28 A 28 28 0 0 1 420 0 Z' /%3E%3C/svg%3E")`,
                maskSize: "100% 100%",
                maskRepeat: "no-repeat",
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src="/assets/gallery/luxury-house-about.jpg"
                  alt="Prime View Luxury Mountain Villa"
                  fill
                  priority
                  className="object-cover object-center opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/25" />
              </div>
            </div>
            {/* Watch Society Tour Button Removed */}
          </div>

          {/* ── 2. UPPER-LEFT GAP: HEADING & SUBTEXT (Two Pills) ── */}
          <div className="absolute top-0 left-0 w-[375px] h-auto z-10 flex flex-col gap-3">
            <div className="bg-[#1B1B1B] shadow-lg rounded-[24px] px-6 py-5 border border-white/5">
              <h2 className="font-display text-2xl lg:text-3xl text-white leading-[1.1] tracking-tight">
                A Modern Living Experience Surrounded by Nature
              </h2>
            </div>
            <div className="bg-[#2E6A4F] shadow-lg rounded-[24px] px-6 py-4 flex-1 flex items-center border border-[#2E6A4F]/20">
              <p className="text-white/90 font-sans text-[13px] leading-relaxed">
                Natural mountain surroundings meet modern infrastructure in Abbottabad, with convenient installment plans to secure your dream home.
              </p>
            </div>
          </div>

          {/* ── 3. UPPER-RIGHT GAP: 2 VERTICAL STAT CARDS ── */}
          <div className="absolute top-0 right-0 w-[36%] grid grid-cols-2 gap-3.5 z-10">
            <div
              onClick={() => setSelectedPhoto("/new assests/about page logos/partner-1.jpeg")}
              className="relative h-[235px] p-3.5 rounded-[22px] bg-[#F4F1EA] border-2 border-[#E2D6C3] shadow-xs hover:shadow-md hover:border-[#2E6A4F] transition-all cursor-pointer flex flex-col group overflow-hidden"
            >
              <div className="mb-2 w-full text-center shrink-0">
                <h4 className="text-[11px] font-extrabold text-charcoal uppercase tracking-wider">Renewal Certificate</h4>
              </div>
              <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-white">
                <Image
                  src="/new assests/about page logos/partner-1.jpeg"
                  alt="Renewal Certificate"
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                  <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full bg-black/50 flex items-center gap-1.5 border border-white/20 shadow-lg">
                    <Eye className="w-3.5 h-3.5" />
                    View Preview
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Partner 2 */}
            <div
              onClick={() => setSelectedPhoto("/new assests/about page logos/partner-2.jpeg")}
              className="relative h-[235px] p-3.5 rounded-[22px] bg-[#F4F1EA] border-2 border-[#E2D6C3] shadow-xs hover:shadow-md hover:border-[#2E6A4F] transition-all cursor-pointer flex flex-col group overflow-hidden"
            >
              <div className="mb-2 w-full text-center shrink-0">
                <h4 className="text-[11px] font-extrabold text-charcoal uppercase tracking-wider">Registration Cert.</h4>
              </div>
              <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-white">
                <Image
                  src="/new assests/about page logos/partner-2.jpeg"
                  alt="Registration Certificate"
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                  <span className="text-white text-xs font-bold px-3 py-1.5 rounded-full bg-black/50 flex items-center gap-1.5 border border-white/20 shadow-lg">
                    <Eye className="w-3.5 h-3.5" />
                    View Preview
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. BOTTOM-LEFT GAP: CALL TO ACTION & DETAILS ── */}
          <div className="absolute bottom-0 left-0 w-[36%] flex items-center justify-between gap-3 p-3.5 rounded-[24px] bg-white border border-[#E2D6C3] shadow-xs z-10">
            {/* Reassurance Checkmarks */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-charcoal">
                <div className="w-3.5 h-3.5 rounded-full bg-[#2E6A4F]/15 flex items-center justify-center shrink-0">
                  <Check className="w-2 h-2 text-[#2E6A4F]" />
                </div>
                <span>Registered Society KPK</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-charcoal">
                <div className="w-3.5 h-3.5 rounded-full bg-[#2E6A4F]/15 flex items-center justify-center shrink-0">
                  <Check className="w-2 h-2 text-[#2E6A4F]" />
                </div>
                <span>Hazara Division Approved</span>
              </div>
            </div>

            {/* Primary CTA Button */}
            <Link
              href="/our-plans"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1B1B1B] hover:bg-[#2E6A4F] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 shrink-0"
            >
              <span>Explore Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ── 5. BOTTOM-RIGHT GAP: SOCIAL PROOF / REVIEW WIDGET ── */}
          <div className="absolute bottom-0 right-14 w-[calc(35%-56px)] min-h-[105px] z-10">
            {/* Masked Background Layer */}
            <div
              className="absolute inset-0 bg-[#1E1E1E] rounded-[24px] shadow-md border border-white/10"
              style={{ WebkitMaskImage: 'radial-gradient(circle at 100% 50%, transparent 64px, black 65px)' }}
            />

            {/* Content Container (unmasked) */}
            <div className="relative h-full flex flex-col justify-between gap-2.5 p-3.5 text-white">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 pr-16">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-400">
                    NOC &amp; Statutory Approval
                  </span>
                  <h3 className="font-display text-xs font-bold text-white leading-snug">
                    Official Cooperative Governance
                  </h3>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              {/* Bottom Nested Pill */}
              <div className="relative flex items-center justify-between p-2 px-3 rounded-full bg-[#2A2A2A] border border-white/10 mt-1 h-11 w-[calc(100%-60px)]">
                {/* Left: Avatars */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1.5">
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-[#1E1E1E]">
                      <Image
                        src="/assets/team/huzaifa-150x150.jpg"
                        alt="Allottee"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-[#1E1E1E]">
                      <Image
                        src="/assets/team/kamran-150x150.jpg"
                        alt="Allottee"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-[#1E1E1E]">
                      <Image
                        src="/assets/team/secre-150x150.jpg"
                        alt="Allottee"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold text-white/90">
                    500+ Allottees
                  </span>
                </div>
              </div>
            </div>

            {/* Right Overlapping NOC Image Badge (Stamp Effect inside cutout) */}
            <div className="absolute -right-14 top-1/2 -translate-y-1/2 z-20 transform rotate-[-8deg] hover:scale-105 transition-transform cursor-pointer drop-shadow-2xl flex items-center justify-center">
              <div className="relative w-28 h-28">
                <Image
                  src="/new assests/about page logos/noc-11.jpg.png"
                  alt="NOC Approved Badge"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════
            MOBILE & TABLET RESPONSIVE FALLBACK (< lg)
        ══════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden flex flex-col gap-5">

          {/* Mobile Header (Two Pills) */}
          <div className="flex flex-col gap-3">
            <div className="bg-[#1B1B1B] shadow-md rounded-[24px] p-5 border border-white/5">
              <h2 className="font-display text-2xl sm:text-3xl text-white leading-[1.1] tracking-tight">
                A Modern Living Experience Surrounded by Nature
              </h2>
            </div>
            <div className="bg-[#2E6A4F] shadow-md rounded-[24px] p-5 border border-[#2E6A4F]/20">
              <p className="text-white/90 font-sans text-sm leading-relaxed">
                Natural mountain surroundings meet modern infrastructure in Abbottabad, with convenient installment plans to secure your dream home.
              </p>
            </div>
          </div>
          {/* Central Media Canvas */}
          <div className="relative w-full rounded-3xl overflow-hidden bg-[#1E1E1E] min-h-[300px] shadow-md border border-[#E2D6C3]">
            <Image
              src="/assets/gallery/luxury-house-about.jpg"
              alt="Prime View Villa"
              fill
              className="object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
            {/* Center Video Button Removed */}
          </div>

          {/* Dual Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div
              onClick={() => setSelectedPhoto("/new assests/about page logos/partner-1.jpeg")}
              className="relative p-3.5 rounded-2xl bg-white border-2 border-[#E2D6C3] shadow-xs hover:border-[#2E6A4F] flex flex-col items-center h-36 cursor-pointer group overflow-hidden transition-colors"
            >
              <div className="mb-2 w-full text-center shrink-0">
                <h4 className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider">Renewal Cert.</h4>
              </div>
              <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-white">
                <Image
                  src="/new assests/about page logos/partner-1.jpeg"
                  alt="Renewal Certificate"
                  fill
                  className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                  <span className="text-white text-[10px] font-bold px-2 py-1 rounded-full bg-black/50 flex items-center gap-1 border border-white/20 shadow-sm">
                    <Eye className="w-3 h-3" />
                    Preview
                  </span>
                </div>
              </div>
            </div>

            <div
              onClick={() => setSelectedPhoto("/new assests/about page logos/partner-2.jpeg")}
              className="relative p-3.5 rounded-2xl bg-white border-2 border-[#E2D6C3] shadow-xs hover:border-[#2E6A4F] flex flex-col items-center h-36 cursor-pointer group overflow-hidden transition-colors"
            >
              <div className="mb-2 w-full text-center shrink-0">
                <h4 className="text-[10px] font-extrabold text-charcoal uppercase tracking-wider">Registration Cert.</h4>
              </div>
              <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-white">
                <Image
                  src="/new assests/about page logos/partner-2.jpeg"
                  alt="Registration Certificate"
                  fill
                  className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl backdrop-blur-[2px]">
                  <span className="text-white text-[10px] font-bold px-2 py-1 rounded-full bg-black/50 flex items-center gap-1 border border-white/20 shadow-sm">
                    <Eye className="w-3 h-3" />
                    Preview
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA & Reassurance */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2D6C3] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-xs font-bold text-charcoal">
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#2E6A4F]" />
                Registered Society KPK
              </p>
              <p className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#2E6A4F]" />
                Hazara Division Approved
              </p>
            </div>
            <Link
              href="/our-plans"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#1B1B1B] text-white text-xs font-bold"
            >
              <span>Explore Plot Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bottom Social Proof Widget */}
          <div className="p-4 rounded-2xl bg-[#1E1E1E] text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-emerald-400 uppercase font-extrabold">NOC &amp; Approval</p>
                <p className="text-xs font-bold">Official Cooperative Governance</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between p-2 rounded-full bg-[#2A2A2A]">
              <span className="text-[11px] font-bold text-white/90">500+ Allottees</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-[#1B1B1B] px-2 py-0.5 rounded-full">
                Verified Land Bank
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════
          VIDEO TOUR MODAL
      ══════════════════════════════════════════════════════════════ */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white text-white hover:text-black flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
              aria-label="Close Video"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-video w-full bg-black">
              <video
                src="/assets/video.mp4"
                controls
                autoPlay
                className="w-full h-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PHOTO LIGHTBOX PREVIEW MODAL
      ══════════════════════════════════════════════════════════════ */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-md animate-fade-in cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative w-fit max-w-[95vw] sm:max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl p-3 sm:p-6 cursor-default flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/5 hover:bg-black/10 text-charcoal flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close Photo Lightbox"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="relative flex items-center justify-center rounded-2xl overflow-hidden bg-white">
              <img
                src={selectedPhoto}
                alt="Enlarged photo preview"
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
