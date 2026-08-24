"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import { footerNavigation } from "@/data/navigation";
import { Twitter, Instagram, Linkedin, Facebook } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F4F1EA] pt-12 pb-12 px-4 sm:px-6 lg:px-8 relative mt-20">
      
      {/* ========================================================================= */}
      {/* 1. OVERLAPPING CTA CARD */}
      {/* ========================================================================= */}
      <div className="max-w-[950px] mx-auto bg-[#D0CECD] rounded-[2rem] p-8 sm:p-12 text-center relative z-10 -mb-16 shadow-2xl overflow-hidden">
        {/* Subtle Background Pattern / Wave */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg viewBox="0 0 800 400" className="w-full h-full object-cover">
            <path
              d="M-50 150 C 150 300, 300 0, 500 150 C 700 300, 850 100, 900 150 L 900 450 L -50 450 Z"
              fill="#2B3A55"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2B3A55]">
            Secure Your Plot in Prime View Today
          </h2>
          <p className="font-sans text-sm font-medium text-[#2B3A55]/90 leading-relaxed">
            Discover serene nature, modern infrastructure, and secure your future investment — all in one seamless community.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-[#F2BB84] text-[#1E1E1C] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#EAAA6D] transition-colors shadow-sm animate-pulse"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN FOOTER WHITE CARD */}
      {/* ========================================================================= */}
      <div className="max-w-[1050px] mx-auto bg-white rounded-[2rem] pt-28 pb-12 px-6 sm:px-10 lg:px-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative z-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
          
          {/* Brand & Description (Col 1: Span 4) */}
          <div className="lg:col-span-4 space-y-6 pr-4">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src={siteConfig.logoPath}
                  alt={siteConfig.name}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-[#2B3A55]">
                Prime View
              </span>
            </div>
            
            <p className="font-sans text-[13px] leading-relaxed text-gray-600">
              A modern real estate platform that combines curated listings, market intelligence, and smart matching to help buyers and investors make confident property decisions in Abbottabad.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B4C68] text-white hover:bg-[#2B3A55] transition-colors">
                <Twitter className="w-4 h-4 fill-current" />
              </a>
              <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B4C68] text-white hover:bg-[#2B3A55] transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B4C68] text-white hover:bg-[#2B3A55] transition-colors">
                <Linkedin className="w-4 h-4 fill-current" />
              </a>
              <a href="#" className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B4C68] text-white hover:bg-[#2B3A55] transition-colors">
                <Facebook className="w-4 h-4 fill-current" />
              </a>
            </div>
          </div>

          {/* Product / Quick Links (Col 2: Span 3) */}
          <div className="lg:col-span-3 lg:ml-8">
            <h4 className="font-display text-[15px] font-bold text-[#2B3A55] mb-5">Product</h4>
            <ul className="space-y-3.5">
              {footerNavigation.quickLinks.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="font-sans text-[13px] text-gray-500 hover:text-[#3B4C68] font-medium transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources / Maps & Info (Col 3: Span 3) */}
          <div className="lg:col-span-3">
            <h4 className="font-display text-[15px] font-bold text-[#2B3A55] mb-5">Resources</h4>
            <ul className="space-y-3.5">
              {footerNavigation.mapsAndPlans.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="font-sans text-[13px] text-gray-500 hover:text-[#3B4C68] font-medium transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal (Col 4: Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="font-display text-[15px] font-bold text-[#2B3A55] mb-5">Legal</h4>
            <ul className="space-y-3.5">
              <li>
                <Link href="#" className="font-sans text-[13px] text-gray-500 hover:text-[#3B4C68] font-medium transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="font-sans text-[13px] text-gray-500 hover:text-[#3B4C68] font-medium transition-colors">
                  Privacy Policy / GDPR
                </Link>
              </li>
              <li>
                <Link href="#" className="font-sans text-[13px] text-gray-500 hover:text-[#3B4C68] font-medium transition-colors">
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
