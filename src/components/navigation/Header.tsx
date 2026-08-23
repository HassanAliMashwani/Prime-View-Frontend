"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import { mainNavigation } from "@/data/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#1f362b] text-white border-b border-[#137547] shadow-md">

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo with Crest */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
              <Image
                src={siteConfig.logoPath}
                alt={siteConfig.name}
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-bold font-heading text-white block leading-tight tracking-wider">
                PRIME VIEW
              </span>
              <span className="text-[10px] text-emerald-300 uppercase tracking-widest block">
                Abbottabad
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {mainNavigation.map((item) => (
              <div key={item.title} className="relative group">
                {item.children ? (
                  <div className="flex items-center cursor-pointer text-sm font-medium text-white hover:text-emerald-300 py-2">
                    <span>{item.title}</span>
                    <ChevronDown className="w-4 h-4 ml-1 text-emerald-400" />

                    {/* Submenu Dropdown */}
                    <div className="absolute left-0 top-full hidden group-hover:block w-64 bg-white text-gray-900 border border-gray-200 shadow-xl rounded-md py-2 z-50">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.title}
                          href={sub.href}
                          className="block px-4 py-2.5 text-xs font-medium border-b border-gray-100 last:border-0 hover:bg-[#137547] hover:text-white transition"
                        >
                          {sub.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-white hover:text-emerald-300 py-2 transition"
                  >
                    {item.title}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Call to Action Button */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              href="/contact"
              className="bg-verified-green hover:bg-[#0e5735] text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all duration-200 shadow-[0_4px_16px_rgba(19,117,71,0.5)] border border-emerald-400/40 hover:scale-105 uppercase tracking-wider"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1f362b] border-t border-emerald-800 px-4 pt-2 pb-6 space-y-3">
          {mainNavigation.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <div>
                  <div className="font-semibold text-emerald-300 py-1 text-sm">{item.title}</div>
                  <div className="pl-4 space-y-1 mt-1 border-l-2 border-[#137547]">
                    {item.children.map((sub) => (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1 text-xs text-gray-200 hover:text-emerald-400"
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1 text-sm font-medium text-white hover:text-emerald-400"
                >
                  {item.title}
                </Link>
              )}
            </div>
          ))}
          <div className="pt-2">
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center bg-verified-green hover:bg-[#0e5735] text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider shadow-md"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
