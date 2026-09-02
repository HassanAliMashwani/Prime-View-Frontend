"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import { footerNavigation } from "@/data/navigation";
import { Instagram, Linkedin, Facebook, Phone, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FDFCFB] py-8 px-4 sm:px-6 lg:px-8 relative">

      {/* ========================================================================= */}
      {/* 1. OVERLAPPING CTA CARD */}
      {/* ========================================================================= */}
      <div className="max-w-[850px] mx-auto bg-gradient-to-b from-[#FDFBF7] to-[#F4EFE6] border border-[#E8DCC2] rounded-[2rem] p-6 sm:p-8 text-center relative z-10 -mb-12 shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-charcoal">
            Secure Your Plot in Prime View Today
          </h2>
          <p className="font-sans text-[13px] sm:text-sm font-medium text-charcoal/70 leading-relaxed">
            <span className="font-bold text-pine block mb-1">{siteConfig.tagline}</span>
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
      <div className="max-w-[1050px] mx-auto bg-white border border-gray-200 rounded-[2rem] pt-20 pb-8 px-6 sm:px-8 lg:px-10 shadow-lg relative z-0 overflow-hidden">
        {/* Footer Card Background */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <Image
            src="/new assests/about page logos/footer.jpg"
            alt="Footer card background"
            fill
            quality={80}
            className="object-cover object-bottom scale-110"
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-4">

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

            {/* Contact Details */}
            <div className="space-y-2 mt-2 mb-4">
              <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-charcoal/80 hover:text-verified-green transition-colors text-[13px] font-sans font-bold">
                <Phone className="w-4 h-4" />
                <span>WhatsApp: {siteConfig.phone}</span>
              </a>
              <a href={`mailto:${siteConfig.email}`} className="flex items-center gap-2 text-charcoal/80 hover:text-verified-green transition-colors text-[13px] font-sans font-bold">
                <Mail className="w-4 h-4" />
                <span>{siteConfig.email}</span>
              </a>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <a href="https://x.com/PrimeViewHousingHazara" target="_blank" rel="noopener noreferrer" className="social-hover-btn flex items-center justify-center w-9 h-9 rounded-full" aria-label="X (formerly Twitter)">
                <Image src="/new assests/logos/x-formerly-twitter.svg" alt="X" width={16} height={16} className="w-4 h-4 object-contain invert" />
              </a>
              <a href="#" className="social-hover-btn flex items-center justify-center w-9 h-9 rounded-full" aria-label="Instagram">
                <Image src="/new assests/logos/instagram.svg" alt="Instagram" width={16} height={16} className="w-4 h-4 object-contain" />
              </a>
              <a href="#" className="social-hover-btn flex items-center justify-center w-9 h-9 rounded-full" aria-label="YouTube">
                <Image src="/new assests/logos/youtube.svg" alt="YouTube" width={16} height={16} className="w-4 h-4 object-contain" />
              </a>
              <a href="https://facebook.com/PrimeviewAbbottabad" target="_blank" rel="noopener noreferrer" className="social-hover-btn flex items-center justify-center w-9 h-9 rounded-full" aria-label="Facebook">
                <Image src="/new assests/logos/facebook.svg" alt="Facebook" width={16} height={16} className="w-4 h-4 object-contain" />
              </a>
            </div>
          </div>

          {/* Product / Quick Links (Col 2: Span 3) */}
          <div className="lg:col-span-3 lg:ml-8">
            <h4 className="font-display text-[15px] font-bold text-pine mb-3 underline underline-offset-4 decoration-2 decoration-pine/30">Product</h4>
            <ul className="space-y-2.5">
              {footerNavigation.quickLinks.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="font-sans text-[13px] text-charcoal/80 hover:text-verified-green font-bold transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources / Maps & Info (Col 3: Span 3) */}
          <div className="lg:col-span-3">
            <h4 className="font-display text-[15px] font-bold text-pine mb-3 underline underline-offset-4 decoration-2 decoration-pine/30">Resources</h4>
            <ul className="space-y-2.5">
              {footerNavigation.mapsAndPlans.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="font-sans text-[13px] text-charcoal/80 hover:text-verified-green font-bold transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal (Col 4: Span 2) */}
          <div className="lg:col-span-2">
            <h4 className="font-display text-[15px] font-bold text-pine mb-3 underline underline-offset-4 decoration-2 decoration-pine/30">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="#" className="font-sans text-[13px] text-charcoal/80 hover:text-verified-green font-bold transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="font-sans text-[13px] text-charcoal/80 hover:text-verified-green font-bold transition-colors">
                  Privacy Policy / GDPR
                </Link>
              </li>
              <li>
                <Link href="#" className="font-sans text-[13px] text-charcoal/80 hover:text-verified-green font-bold transition-colors">
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
