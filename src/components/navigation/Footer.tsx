"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import { footerNavigation } from "@/data/navigation";
import { Instagram, Linkedin, Facebook } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FDFCFB] py-8 px-4 sm:px-6 lg:px-8 relative">

      {/* ========================================================================= */}
      {/* 1. OVERLAPPING CTA CARD */}
      {/* ========================================================================= */}
      <div className="max-w-[850px] mx-auto bg-gradient-to-b from-gray-200 to-gray-300 border border-gray-300 rounded-[2rem] p-6 sm:p-8 text-center relative z-10 -mb-12 shadow-[0_8px_30px_rgba(0,0,0,0.12),inset_0_0_40px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-charcoal">
            Secure Your Plot in Prime View Today
          </h2>
          <p className="font-sans text-[13px] sm:text-sm font-medium text-charcoal/70 leading-relaxed">
            Discover serene nature, modern infrastructure, and secure your future investment — all in one seamless community.
          </p>
          <div className="pt-1">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-[#B29A68] text-[#1B1B1B] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl hover:bg-[#B29A68] transition-colors shadow-sm animate-pulse"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN FOOTER WHITE CARD */}
      {/* ========================================================================= */}
      <div className="max-w-[1050px] mx-auto bg-gradient-to-b from-white to-gray-200 border border-gray-200 rounded-[2rem] pt-20 pb-8 px-6 sm:px-8 lg:px-10 shadow-lg relative z-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-4">

          {/* Brand & Socials (Col 1: Span 4) */}
          <div className="lg:col-span-4 flex flex-col items-start pr-4">
            <div className="flex items-center gap-1 -ml-4 -mt-4">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                <Image
                  src={siteConfig.logoPath}
                  alt={siteConfig.name}
                  fill
                  className="object-contain object-left"
                />
              </div>
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-pine -ml-2">
                Prime View
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1DA1F2] text-white hover:opacity-80 transition-opacity shadow-sm" aria-label="X (formerly Twitter)">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="flex items-center justify-center w-9 h-9 rounded-full bg-[#E1306C] text-white hover:opacity-80 transition-opacity shadow-sm" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center justify-center w-9 h-9 rounded-full bg-[#0077B5] text-white hover:opacity-80 transition-opacity shadow-sm" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4 fill-current" />
              </a>
              <a href="#" className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1877F2] text-white hover:opacity-80 transition-opacity shadow-sm" aria-label="Facebook">
                <Facebook className="w-4 h-4 fill-current" />
              </a>
            </div>
          </div>

          {/* Product / Quick Links (Col 2: Span 3) */}
          <div className="lg:col-span-3 lg:ml-8">
            <h4 className="font-display text-[15px] font-bold text-pine mb-3">Product</h4>
            <ul className="space-y-2.5">
              {footerNavigation.quickLinks.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="font-sans text-[13px] text-charcoal/60 hover:text-verified-green font-medium transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources / Maps & Info (Col 3: Span 3) */}
          <div className="lg:col-span-3">
            <h4 className="font-display text-[15px] font-bold text-pine mb-3">Resources</h4>
            <ul className="space-y-2.5">
              {footerNavigation.mapsAndPlans.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="font-sans text-[13px] text-charcoal/60 hover:text-verified-green font-medium transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal (Col 4: Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="font-display text-[15px] font-bold text-pine mb-3">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="#" className="font-sans text-[13px] text-charcoal/60 hover:text-verified-green font-medium transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="font-sans text-[13px] text-charcoal/60 hover:text-verified-green font-medium transition-colors">
                  Privacy Policy / GDPR
                </Link>
              </li>
              <li>
                <Link href="#" className="font-sans text-[13px] text-charcoal/60 hover:text-verified-green font-medium transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

    </footer>
  );
};
