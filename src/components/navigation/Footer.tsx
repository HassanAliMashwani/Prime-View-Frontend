"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import { footerNavigation } from "@/data/navigation";
import { Phone, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Hide marketing footer on member portal and admin views
  if (
    pathname.startsWith('/society-members/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/verify')
  ) {
    return null;
  }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">

            {/* Brand & Socials (Col 1: Span 5) */}
            <div className="lg:col-span-5 flex flex-col items-start">
              {/* Crest and Prime View vertically centered on one line */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0">
                  <Image
                    src={siteConfig.logoPath}
                    alt={siteConfig.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <span
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-none"
                  style={{ color: '#43612B' }}
                >
                  Prime View
                </span>
              </div>

              {/* Contact Details sharing icon column and text edge */}
              <div className="space-y-2.5 mb-4">
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:opacity-70 transition-opacity text-sm font-sans font-bold"
                  style={{ color: '#151914' }}
                >
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>WhatsApp: {siteConfig.phone}</span>
                </a>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-2.5 hover:opacity-70 transition-opacity text-sm font-sans font-bold"
                  style={{ color: '#151914' }}
                >
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>{siteConfig.email}</span>
                </a>
                <div className="flex items-center gap-2.5 text-xs text-[#6B7462] pt-1">
                  <div className="w-5 shrink-0 flex items-center justify-center">📍</div>
                  <span>Main Secretariat, Supply Road, Abbottabad, Pakistan</span>
                </div>
              </div>


              {/* Social icons starting on that text edge (pl-[30px]), one row, equal gaps, 44px each */}
              <div className="flex items-center gap-2.5 pl-[30px] mt-1">
                <a href="https://x.com/PrimeViewHousingHazara" target="_blank" rel="noopener noreferrer" className="social-hover-btn flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full" aria-label="X (formerly Twitter)">
                  <Image src="/new assests/logos/x-formerly-twitter.svg" alt="X" width={18} height={18} className="w-4 h-4 object-contain invert" />
                </a>
                <a href="#" className="social-hover-btn flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full" aria-label="Instagram">
                  <Image src="/new assests/logos/instagram.svg" alt="Instagram" width={18} height={18} className="w-4 h-4 object-contain" />
                </a>
                <a href="#" className="social-hover-btn flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full" aria-label="YouTube">
                  <Image src="/new assests/logos/youtube.svg" alt="YouTube" width={18} height={18} className="w-4 h-4 object-contain" />
                </a>
                <a href="https://facebook.com/PrimeviewAbbottabad" target="_blank" rel="noopener noreferrer" className="social-hover-btn flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full" aria-label="Facebook">
                  <Image src="/new assests/logos/facebook.svg" alt="Facebook" width={18} height={18} className="w-4 h-4 object-contain" />
                </a>
              </div>
            </div>

            {/* Product / Quick Links (Col 2: Span 2) */}
            <div className="lg:col-span-2">
              <h4 className="font-display text-[15px] font-bold mb-3 underline underline-offset-4 decoration-2" style={{ color: '#43612B', textDecorationColor: 'rgba(67,97,43,0.3)' }}>Product</h4>
              <ul className="space-y-2.5">
                {footerNavigation.quickLinks.map((item) => (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className="font-sans text-sm font-bold transition-opacity hover:opacity-70"
                      style={{ color: '#151914' }}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources / Maps & Info (Col 3: Span 2) */}
            <div className="lg:col-span-2">
              <h4 className="font-display text-[15px] font-bold mb-3 underline underline-offset-4 decoration-2" style={{ color: '#43612B', textDecorationColor: 'rgba(67,97,43,0.3)' }}>Resources</h4>
              <ul className="space-y-2.5">
                {footerNavigation.mapsAndPlans.map((item) => (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className="font-sans text-sm font-bold transition-opacity hover:opacity-70"
                      style={{ color: '#151914' }}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal (Col 4: Span 3) */}
            <div className="lg:col-span-3">
              <h4 className="font-display text-[15px] font-bold mb-3 underline underline-offset-4 decoration-2" style={{ color: '#43612B', textDecorationColor: 'rgba(67,97,43,0.3)' }}>Legal & Governance</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/terms" className="font-sans text-sm font-bold transition-opacity hover:opacity-70" style={{ color: '#151914' }}>
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="font-sans text-sm font-bold transition-opacity hover:opacity-70" style={{ color: '#151914' }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="font-sans text-sm font-bold transition-opacity hover:opacity-70" style={{ color: '#151914' }}>
                    Cookies Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="font-sans text-sm font-bold transition-opacity hover:opacity-70" style={{ color: '#151914' }}>
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/login"
                    className="font-sans text-sm font-bold transition-opacity hover:opacity-70 flex items-center gap-1.5"
                    style={{ color: '#43612B' }}
                  >
                    <span>Admin Portal</span>
                    <span className="text-[11px]">↗</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/society-members/login"
                    className="font-sans text-sm font-bold transition-opacity hover:opacity-70 flex items-center gap-1.5"
                    style={{ color: '#43612B' }}
                  >
                    <span>Member Portal</span>
                    <span className="text-[11px]">↗</span>
                  </Link>
                </li>
              </ul>


              {/* Project of Roman Builders */}
              <div className="mt-6 pt-1">
                <a
                  href="https://roman-builders.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-sans text-sm font-extrabold whitespace-nowrap tracking-tight hover:opacity-85 transition-opacity"
                  style={{ color: '#70c729ff' }}
                >
                  <span>Project of Roman Builders</span>
                  <span className="text-[11px]">↗</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

    </footer>
  );
};
