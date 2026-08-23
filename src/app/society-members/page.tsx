"use client";

import React, { useState } from "react";
import { membershipCriteriaList } from "@/data/team";
import { Search, CheckCircle2 } from "lucide-react";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

export default function SocietyMembersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCriteria = membershipCriteriaList.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-warm-ivory text-charcoal min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <span className="kicker block">BYLAWS &amp; ELIGIBILITY</span>
          <h1 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight">
            Society Members
          </h1>
          <p className="font-sans text-sm sm:text-base text-charcoal/75 max-w-xl mx-auto leading-relaxed">
            Eligibility Rules, Society Bylaws &amp; Member File Verification
          </p>
        </div>

        {/* Main Content Luxury Card */}
        <LuxuryCard theme="light" interactive={false} className="p-6 sm:p-8 space-y-6">
          {/* Search Section */}
          <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label
              htmlFor="member-search"
              className="text-xs font-bold text-charcoal uppercase tracking-wider font-sans"
            >
              Search Criteria:
            </label>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="member-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search eligibility guidelines..."
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-stone/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-verified-green bg-white shadow-xs"
              />
            </div>
          </div>

          {/* Verbatim Eligibility Bullet Points */}
          <div className="space-y-4 pt-2">
            <h3 className="font-display text-lg font-semibold text-charcoal border-b border-stone/30 pb-2">
              Membership Eligibility Criteria
            </h3>
            {filteredCriteria.length > 0 ? (
              <ul className="space-y-3">
                {filteredCriteria.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 bg-white p-4 rounded-xl border border-stone/30 shadow-2xs"
                  >
                    <CheckCircle2 className="w-5 h-5 text-verified-green shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-charcoal/90 leading-relaxed font-medium">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-charcoal/60 py-6 text-center">
                No matching membership guidelines found for &ldquo;{searchTerm}&rdquo;.
              </p>
            )}
          </div>
        </LuxuryCard>

        {/* Bylaws Regulatory Footer */}
        <LuxuryCard theme="light" interactive={false} className="p-5 text-xs text-charcoal/70 space-y-1">
          <p className="font-bold text-charcoal font-sans uppercase tracking-wider text-[11px]">
            Co-Operative Housing Society Ltd Hazara Division
          </p>
          <p className="leading-relaxed">
            Membership applications and file allotment transfers are processed strictly according to the Co-operative Societies Act 1925 (Amended 2020) &amp; Co-operative Societies Rules 1927.
          </p>
        </LuxuryCard>
      </div>
    </div>
  );
}
