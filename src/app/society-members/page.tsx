"use client";

import React, { useState } from "react";
import Image from "next/image";
import { membershipCriteriaList } from "@/data/team";
import { Search, CheckCircle2 } from "lucide-react";

export default function SocietyMembersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCriteria = membershipCriteriaList.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#F8F7F5] text-[#151914] min-h-screen">
      {/* ── HERO HEADER (SAME AS OUR PLANS PAGE) ── */}
      <div className="relative pt-28 sm:pt-36 pb-32 sm:pb-44 lg:pb-52 px-6 sm:px-8 lg:px-12 text-center overflow-hidden w-full">
        {/* Hero Background — Mountain Valley Landscape */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/new assests/our plan assests/hero background.jpeg?v=2"
            alt="Prime View Society Members Hero Background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient: dark at top for text, fades to cream at bottom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(248,247,245,0.7) 80%, #F8F7F5 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight font-bold leading-[1.05] uppercase drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">
            Society Members
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] tracking-wide max-w-2xl mx-auto leading-relaxed">
            Eligibility Rules, Society Bylaws &amp; Member File Verification
          </p>
        </div>
      </div>

      <div className="pb-20 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10 relative z-10 -mt-12 sm:-mt-18 lg:-mt-24">

        {/* Main Content Container */}
        <div className="bg-[#FAF9F7] rounded-[2rem] border border-black/[0.08] p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          {/* Search Section */}
          <div className="bg-white/80 p-4 sm:p-5 rounded-xl border border-[#43612B]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label
              htmlFor="member-search"
              className="text-xs font-bold text-[#151914] uppercase tracking-wider font-sans"
            >
              Search Criteria:
            </label>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#6B7462] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="member-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search eligibility guidelines..."
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#43612B] bg-white shadow-xs text-[#151914] placeholder-[#6B7462]/60"
              />
            </div>
          </div>

          {/* Verbatim Eligibility Bullet Points */}
          <div className="space-y-4 pt-2">
            <h3 className="font-display text-lg font-bold text-[#151914] border-b border-black/[0.06] pb-2">
              Membership Eligibility Criteria
            </h3>
            {filteredCriteria.length > 0 ? (
              <ul className="space-y-3">
                {filteredCriteria.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 bg-white p-4 rounded-xl border border-black/[0.06] shadow-xs"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#43612B] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-[#151914] leading-relaxed font-medium">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#6B7462] py-6 text-center">
                No matching membership guidelines found for &ldquo;{searchTerm}&rdquo;.
              </p>
            )}
          </div>
        </div>

        {/* Bylaws Regulatory Footer Box */}
        <div className="bg-[#FAF9F7] rounded-2xl border border-black/[0.06] p-5 text-xs text-[#6B7462] space-y-1">
          <p className="font-bold text-[#151914] font-sans uppercase tracking-wider text-[11px]">
            Co-Operative Housing Society Ltd Hazara Division
          </p>
          <p className="leading-relaxed">
            Membership applications and file allotment transfers are processed strictly according to the Co-operative Societies Act 1925 (Amended 2020) &amp; Co-operative Societies Rules 1927.
          </p>
        </div>
      </div>
    </div>
  );
}
