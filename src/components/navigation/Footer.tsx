"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import { footerNavigation } from "@/data/navigation";
import { Phone, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="relative">

      {/* ================================================================= */}
      {/* 1. CTA CARD — footer pic as faded background watermark */}
      {/* ================================================================= */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8" style={{ background: '#F8F7F5' }}>
        <div
          className="max-w-[1050px] mx-auto rounded-[2rem] overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
          style={{ background: '#EFEEEA', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          {/* Faded landscape background */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
            <Image
              src="/new assests/footer/Prime footer Image.jpg"
              alt="Prime View Footer Pine Forest"
              fill
              quality={85}
              className="object-cover object-center"
            />
          </div>

          {/* CTA content overlaid on background */}
          <div className="relative z-10 text-center px-6 sm:px-8 py-8 sm:py-10">


            <h2
              className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-2"
              style={{ color: '#151914' }}
            >
              Secure Your Plot in <span style={{ color: '#43612B' }}>Prime View</span> Today
            </h2>
            <p className="font-sans text-sm font-bold mb-1" style={{ color: '#151914' }}>
              {siteConfig.tagline}
            </p>
            <p
              className="font-sans text-[13px] sm:text-sm leading-relaxed max-w-xl mx-auto mb-5"
              style={{ color: '#6B7462' }}
            >
              Discover serene nature, modern infrastructure, and secure your future
              investment — all in one seamless community.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md animate-pulse"
              style={{ background: '#43612B', color: '#fff' }}
            >
              Book Now <span className="ml-1.5">↗</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. FLAT BEIGE FOOTER — logo, links, socials outside the container */}
      {/* ================================================================= */}
      <div className="pt-10 pb-8 px-4 sm:px-6 lg:px-8" style={{ background: '#F8F7F5' }}>
        <div className="max-w-[1050px] mx-auto">
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
                <span
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight -ml-2"
                  style={{ color: '#43612B' }}
                >
                  Prime View
                </span>
              </div>

              {/* Contact Details */}
              <div className="space-y-2 mt-2 mb-4">
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity text-[13px] font-sans font-bold"
                  style={{ color: '#151914' }}
                >
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp: {siteConfig.phone}</span>
                </a>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity text-[13px] font-sans font-bold"
                  style={{ color: '#151914' }}
                >
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
              <h4 className="font-display text-[15px] font-bold mb-3 underline underline-offset-4 decoration-2" style={{ color: '#43612B', textDecorationColor: 'rgba(67,97,43,0.3)' }}>Product</h4>
              <ul className="space-y-2.5">
                {footerNavigation.quickLinks.map((item) => (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className="font-sans text-[13px] font-bold transition-opacity hover:opacity-70"
                      style={{ color: '#151914' }}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources / Maps & Info (Col 3: Span 3) */}
            <div className="lg:col-span-3">
              <h4 className="font-display text-[15px] font-bold mb-3 underline underline-offset-4 decoration-2" style={{ color: '#43612B', textDecorationColor: 'rgba(67,97,43,0.3)' }}>Resources</h4>
              <ul className="space-y-2.5">
                {footerNavigation.mapsAndPlans.map((item) => (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className="font-sans text-[13px] font-bold transition-opacity hover:opacity-70"
                      style={{ color: '#151914' }}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal (Col 4: Span 2) */}
            <div className="lg:col-span-2">
              <h4 className="font-display text-[15px] font-bold mb-3 underline underline-offset-4 decoration-2" style={{ color: '#43612B', textDecorationColor: 'rgba(67,97,43,0.3)' }}>Legal</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="#" className="font-sans text-[13px] font-bold transition-opacity hover:opacity-70" style={{ color: '#151914' }}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-sans text-[13px] font-bold transition-opacity hover:opacity-70" style={{ color: '#151914' }}>
                    Privacy Policy / GDPR
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-sans text-[13px] font-bold transition-opacity hover:opacity-70" style={{ color: '#151914' }}>
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

    </footer>
  );
};
