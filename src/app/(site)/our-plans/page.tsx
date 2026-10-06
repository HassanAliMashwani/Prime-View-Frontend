"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PlotCarousel, PlotItem, plots } from "@/components/ui/PlotCarousel";
import { fetchPublicContent, ContentBlock } from "@/lib/dal/publicContent";
import { getCache, setCache, reconcileItems } from "@/lib/dal/apiCache";
import { normalizeImagePath, normalizePlanCardImage } from "@/lib/images";
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

const DEFAULT_CARD_IMAGES: Record<number, string> = {
  0: normalizePlanCardImage('/new assests/our plan assests/card 1.webp'),
  1: normalizePlanCardImage('/new assests/our plan assests/card 2.webp'),
  2: normalizePlanCardImage('/new assests/our plan assests/card 3.webp'),
  3: normalizePlanCardImage('/new assests/our plan assests/card 4.webp'),
  4: normalizePlanCardImage('/new assests/our plan assests/card 5.webp'),
  5: normalizePlanCardImage('/new assests/our plan assests/card 6.webp'),
};

function getPlanSortRank(block: { id: string; title?: string; metadata?: any }): number {
  const id = (block.id || '').toLowerCase();
  const size = String(block.metadata?.size || '').toLowerCase();
  const title = (block.title || '').toLowerCase();

  // 1. 05 Marla
  if (
    id === 'plan-05-marla' ||
    size.includes('05 marla') ||
    (size.includes('5 marla') && !size.includes('7.5') && !size.includes('15') && !size.includes('25') && !size.includes('35') && !size.includes('45')) ||
    (title.includes('5 marla') && !title.includes('7.5'))
  ) {
    return 0;
  }
  // 2. 7.5 Marla
  if (id === 'plan-7-5-marla' || size.includes('7.5 marla') || title.includes('7.5 marla')) {
    return 1;
  }
  // 3. 10 Marla
  if (id === 'plan-10-marla' || size.includes('10 marla') || title.includes('10 marla')) {
    return 2;
  }
  // 4. 13 Marla
  if (id === 'plan-13-marla' || size.includes('13 marla') || title.includes('13 marla')) {
    return 3;
  }
  // 5. 01 Kanal
  if (id === 'plan-01-kanal' || size.includes('01 kanal') || size.includes('1 kanal') || (title.includes('1 kanal') && !title.includes('executive villa'))) {
    return 4;
  }
  // 6. 02 Kanal
  if (id === 'plan-02-kanal' || size.includes('02 kanal') || size.includes('2 kanal') || title.includes('2 kanal') || title.includes('02 kanal')) {
    return 5;
  }

  // Any newly added card comes after 02 Kanal
  return 100;
}

function PlansSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center items-center gap-6 overflow-hidden py-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-[320px] sm:w-[360px] h-[540px] rounded-[32px] bg-white border border-black/[0.08] p-6 animate-pulse flex flex-col justify-between shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ${
              i === 1 ? 'scale-105 opacity-100 z-10' : 'opacity-70 hidden sm:flex'
            }`}
          >
            <div className="space-y-4">
              <div className="h-44 w-full bg-black/[0.06] rounded-2xl" />
              <div className="h-5 w-1/2 bg-black/[0.06] rounded-md" />
              <div className="h-8 w-3/4 bg-black/[0.06] rounded-lg" />
              <div className="space-y-2.5 pt-4">
                <div className="h-4 w-full bg-black/[0.06] rounded-md" />
                <div className="h-4 w-5/6 bg-black/[0.06] rounded-md" />
                <div className="h-4 w-4/6 bg-black/[0.06] rounded-md" />
              </div>
            </div>
            <div className="h-11 w-full bg-black/[0.06] rounded-full mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OurPlansPage() {
  const getInit = () => {
    if (typeof window === 'undefined') return plots;
    const cached = getCache<PlotItem[]>('public:plans', true);
    return cached && cached.length > 0 ? cached : plots;
  };
  const [cmsPlans, setCmsPlans] = useState<PlotItem[]>(getInit);

  const loadPlans = React.useCallback(() => {
    fetchPublicContent('plans')
      .then((blocks) => {
        const sortedBlocks = (blocks || []).sort((a, b) => getPlanSortRank(a) - getPlanSortRank(b));
        const mapped: PlotItem[] = [];
        for (const block of sortedBlocks) {
          const m = (block.metadata || {}) as Record<string, any>;
          if (!block.title) {
            console.warn(`[CMS Warning] Block ${block.id} in section plans is missing required field: title`);
            continue;
          }

          const rank = getPlanSortRank(block);
          const fallbackImage = DEFAULT_CARD_IMAGES[rank] || '/new assests/our plan assests/card 6.webp';
          const image = normalizePlanCardImage((m?.imageUrl && String(m.imageUrl).trim()) || fallbackImage);

          // Map subtitle to dimension line when size has no parentheses; keep size as size label
          const sizeMatch = String(m?.size || '').match(/^(.+?)\s*\((.+?)\)$/);
          const dimensions = sizeMatch ? sizeMatch[1].trim() : (block.subtitle || '');
          const size = sizeMatch ? sizeMatch[2].trim() : String(m?.size || block.title || '');

          // Parse payment details without substituting 25, 39, or 8
          const [downPayment, downPaymentPercent] = [
            String(m?.downPayment ?? '').match(/(?:PKR\s*)?([\d,]+)/i)?.[1] || String(m?.downPayment ?? '').trim(),
            String(m?.downPayment ?? '').match(/\(([^)]+)\)/)?.[1] || ''
          ];
          const [monthly, monthlyCount] = [
            String(m?.monthly ?? '').match(/(?:PKR\s*)?([\d,]+)/i)?.[1] || String(m?.monthly ?? '').trim(),
            String(m?.monthly ?? '').match(/x\s*(\d+)/i)?.[1] ? parseInt(String(m?.monthly ?? '').match(/x\s*(\d+)/i)![1], 10) : undefined
          ];
          const [halfYearly, halfYearlyCount] = [
            String(m?.halfYearly ?? '').match(/(?:PKR\s*)?([\d,]+)/i)?.[1] || String(m?.halfYearly ?? '').trim(),
            String(m?.halfYearly ?? '').match(/x\s*(\d+)/i)?.[1] ? parseInt(String(m?.halfYearly ?? '').match(/x\s*(\d+)/i)![1], 10) : undefined
          ];
          const possession = m?.possession ? String(m.possession).replace(/PKR\s*/i, '').trim() : undefined;

          // Format price number → "2,500,000"
          const totalPrice = typeof m?.price === 'number'
            ? m.price.toLocaleString('en-PK')
            : String(m?.price || '');

          const tag = m?.tags?.[0] || block.category || 'Residential';

          mapped.push({
            id: block.id,
            size,
            tag,
            dimensions,
            totalPrice,
            downPayment,
            downPaymentPercent,
            monthly,
            monthlyCount,
            halfYearly,
            halfYearlyCount,
            possession,
            image,
          });
        }
        if (mapped.length > 0) {
          setCmsPlans((prev) => {
            const next = reconcileItems(prev, mapped, (p) => p.id || p.size);
            setCache('public:plans', next);
            return next;
          });
        }
      })
      .catch(() => {
        // Leave existing visible cards on screen if request fails
      });
  }, []);

  useEffect(() => {
    loadPlans();

    const handleRefresh = () => {
      loadPlans();
    };

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('cms-content-updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadPlans();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Auto-refresh saved plans once a minute in the background without clearing the screen
    const interval = setInterval(() => {
      loadPlans();
    }, 60000);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cms_updates');
      channel.onmessage = (e) => {
        if (e.data?.type === 'CONTENT_UPDATED') {
          loadPlans();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('cms-content-updated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [loadPlans]);

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
        <div className="relative pt-28 sm:pt-36 pb-36 sm:pb-52 lg:pb-64 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
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

          <div className="relative z-10 min-h-[580px]">
            <PlotCarousel items={cmsPlans.length > 0 ? cmsPlans : plots} />
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
                  <p className="text-[11.5px] sm:text-xs text-[#313C2F] font-semibold">
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

            {/* 3 Cards — Compact Pure HTML/CSS with aligned left edge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
              {/* Card 1: 10% Discount */}
              <div className="rounded-[18px] p-4 sm:p-5 bg-[#FAF9F5] border border-black/[0.05] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[170px]">
                <div className="flex flex-col items-start gap-2.5">
                  <ScallopedBadge>
                    <Percent className="w-5 h-5 text-white stroke-[2.8]" />
                  </ScallopedBadge>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4324] leading-none tracking-tight">10%</div>
                    <div className="text-[11px] font-extrabold tracking-wider text-[#1B4324] mt-0.5 uppercase">Discount</div>
                  </div>
                </div>

                {/* Accent line with center dot */}
                <div className="flex items-center gap-1 my-2.5">
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8BBA2]" />
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                </div>

                <p className="text-xs font-semibold text-[#242E22] leading-relaxed">
                  On full payment upfront.
                </p>
              </div>

              {/* Card 2: 10% Extra Charges */}
              <div className="rounded-[18px] p-4 sm:p-5 bg-[#FAF9F5] border border-black/[0.05] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[170px]">
                <div className="flex flex-col items-start gap-2.5">
                  <ScallopedBadge>
                    <MapPin className="w-5 h-5 text-white stroke-[2.2]" />
                  </ScallopedBadge>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4324] leading-none tracking-tight">10%</div>
                    <div className="text-[11px] font-extrabold tracking-wider text-[#1B4324] mt-0.5 uppercase">Extra Charges</div>
                  </div>
                </div>

                {/* Accent line with center dot */}
                <div className="flex items-center gap-1 my-2.5">
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8BBA2]" />
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                </div>

                <p className="text-xs font-semibold text-[#242E22] leading-relaxed">
                  For main road and corner plots.
                </p>
              </div>

              {/* Card 3: Installment Deadline */}
              <div className="rounded-[18px] p-4 sm:p-5 bg-[#FAF9F5] border border-black/[0.05] shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[170px]">
                <div className="flex flex-col items-start gap-2.5">
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
                <div className="flex items-center gap-1 my-2.5">
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A8BBA2]" />
                  <span className="h-[1.5px] w-5 bg-[#A8BBA2]" />
                </div>

                <p className="text-xs font-semibold text-[#242E22] leading-relaxed">
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
