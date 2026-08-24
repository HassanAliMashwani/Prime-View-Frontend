"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import { mainNavigation, NavItem } from "@/data/navigation";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { MagneticWrapper } from "@/components/ui/MagneticWrapper";
import { motion } from "framer-motion";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  const isLinkActive = (item: NavItem) => {
    if (item.href === "/" && pathname === "/") return true;
    if (item.href !== "/" && pathname.startsWith(item.href)) return true;
    if (item.children?.some((child) => pathname.startsWith(child.href))) return true;
    return false;
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full pt-5 sm:pt-6 pb-2 px-4 sm:px-8 bg-transparent pointer-events-none transition-none">
      {/* 3-Pill Floating Container with High-Contrast Smoky Glass on Any Background */}
      <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3 relative">
        
        {/* ========================================================================= */}
        {/* 1. LEFT PILL: Brand Logo */}
        {/* ========================================================================= */}
        <Link
          href="/"
          className="pointer-events-auto flex items-center group shrink-0 mix-blend-difference transition-all duration-180 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Prime View Home"
        >
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-180 group-hover:scale-105">
            <Image
              src={siteConfig.logoPath}
              alt="Prime View Emblem"
              fill
              className="object-contain filter brightness-0 invert"
              priority
            />
          </div>
        </Link>

        {/* ========================================================================= */}
        {/* 2. CENTER PILL: Pages Nav Links in Frosted Glass Pill */}
        {/* ========================================================================= */}
        <nav
          aria-label="Main Navigation"
          className="pointer-events-auto hidden md:flex fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 items-center h-[50px] px-3 lg:px-4 rounded-full bg-white/60 backdrop-blur-md border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.06)] z-[60]"
        >
          <ul className="flex items-center gap-1 lg:gap-2 text-[13.5px] lg:text-[14.5px] font-medium tracking-normal text-charcoal whitespace-nowrap">
            {mainNavigation.map((item) => {
              const active = isLinkActive(item);

              if (item.children) {
                return (
                  <li
                    key={item.title}
                    className="relative group py-1.5 px-3 rounded-full cursor-pointer"
                    onMouseEnter={() => setActiveDropdown(item.title)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div
                      className={`relative z-10 flex items-center gap-1 transition-all duration-180 ${
                        active ? "text-black" : "text-charcoal/70 hover:text-black"
                      }`}
                    >
                      <span className="whitespace-nowrap">{item.title}</span>
                      <ChevronDown className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:rotate-180 transition-transform duration-180" />
                    </div>

                    {/* Submenu Dropdown */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 w-64 z-50 transition-all duration-180 ${
                        activeDropdown === item.title
                          ? "opacity-100 visible translate-y-0"
                          : "opacity-0 invisible -translate-y-2 pointer-events-none"
                      }`}
                    >
                      <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-xl py-2">
                        {item.children.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.title}
                              href={sub.href}
                              className={`block px-4 py-2 text-xs transition-colors duration-150 ${
                                isSubActive
                                  ? "bg-black/5 text-black font-semibold"
                                  : "text-charcoal/80 hover:bg-black/5 hover:text-black"
                              }`}
                            >
                              {isSubActive && <span className="mr-1.5 text-emerald-600">•</span>}
                              {sub.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.title} className="relative px-4 py-1.5 rounded-full">
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-black/[0.03]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Link
                    href={item.href}
                    className={`relative z-10 inline-flex items-center transition-colors duration-180 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black rounded-md whitespace-nowrap ${
                      active ? "text-black font-semibold" : "text-charcoal/70 hover:text-black"
                    }`}
                  >
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ========================================================================= */}
        {/* 3. RIGHT PILL: “Book Now ↗” Peach Pill */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2.5 shrink-0">
          <MagneticWrapper className="pointer-events-auto">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-1.5 h-[46px] px-6 rounded-full bg-[#F2BB84] hover:bg-[#EAAA6D] text-[#1E1E1C] text-xs sm:text-[13.5px] font-semibold tracking-normal shadow-[0_4px_16px_rgba(242,187,132,0.4)] transition-all duration-180 ease-out hover:-translate-y-[1px] whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F2BB84] animate-pulse"
              aria-label="Book Now"
            >
              <span>Book Now</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </MagneticWrapper>

          {/* Mobile Menu Smoky Pill Toggle (< 768px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="pointer-events-auto md:hidden flex items-center justify-center w-[46px] h-[46px] rounded-full bg-white/70 backdrop-blur-md border border-white/40 shadow-sm text-charcoal hover:bg-white/90 transition-colors duration-180 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MOBILE MENU DRAWER */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto max-w-[1240px] mx-auto mt-2 md:hidden bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl p-5 space-y-3 shadow-2xl">
          <nav aria-label="Mobile Navigation" className="space-y-1">
            {mainNavigation.map((item) => {
              const active = isLinkActive(item);

              if (item.children) {
                return (
                  <div key={item.title} className="py-2 border-b border-black/10">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#d08535] mb-1.5 px-2">
                      {item.title}
                    </div>
                    <div className="pl-3 border-l-2 border-black/15 space-y-1">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.title}
                          href={sub.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block py-1.5 px-2 text-xs rounded-lg transition-colors ${
                            pathname === sub.href
                              ? "bg-black/5 text-black font-semibold"
                              : "text-charcoal/70 hover:bg-black/5"
                          }`}
                        >
                          {pathname === sub.href && "• "}
                          {sub.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 px-3 text-xs sm:text-sm rounded-xl transition-colors ${
                    active
                      ? "bg-black/5 text-black font-semibold"
                      : "text-charcoal/70 hover:bg-black/5"
                  }`}
                >
                  {active && "• "}
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
