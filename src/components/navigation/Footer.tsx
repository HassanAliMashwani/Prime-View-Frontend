import React from "react";
import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import { footerNavigation } from "@/data/navigation";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-deep-forest text-warm-ivory pt-16 pb-12 border-t border-emerald-900/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-14">
          {/* Col 1: Brand & Tagline — lg:col-span-4 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                <Image
                  src={siteConfig.logoPath}
                  alt={siteConfig.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-wider text-white block">
                  PRIME VIEW
                </span>
                <span className="font-sans text-[10px] text-emerald-400 uppercase tracking-widest block">
                  Abbottabad
                </span>
              </div>
            </div>

            <p className="font-sans text-xs text-warm-ivory/80 leading-relaxed max-w-sm">
              {siteConfig.fullName}
            </p>
            <p className="font-display italic text-xs text-emerald-300/90 pt-1">
              &ldquo;Close to Heaven&rdquo;
            </p>
          </div>

          {/* Col 2: Quick Links — lg:col-span-2 */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-emerald-300/90 border-b border-emerald-500/20 pb-2">
              Quick Links
            </h3>
            <ul className="space-y-2 font-sans text-xs">
              {footerNavigation.quickLinks.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="text-warm-ivory/70 hover:text-white hover:underline transition-colors duration-200"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Maps & Info — lg:col-span-3 */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-emerald-300/90 border-b border-emerald-500/20 pb-2">
              Maps &amp; Info
            </h3>
            <ul className="space-y-2 font-sans text-xs">
              {footerNavigation.mapsAndPlans.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className="text-warm-ivory/70 hover:text-white hover:underline transition-colors duration-200"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact Info — lg:col-span-3 */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-emerald-300/90 border-b border-emerald-500/20 pb-2">
              Booking Office
            </h3>
            <ul className="space-y-3 font-sans text-xs text-warm-ivory/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{siteConfig.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="hover:text-white hover:underline"
                >
                  {siteConfig.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-white hover:underline truncate"
                >
                  {siteConfig.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="border-t border-emerald-500/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-warm-ivory/50">
          <p>© {new Date().getFullYear()} {siteConfig.fullName}. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-warm-ivory transition-colors">
              About Society
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-warm-ivory transition-colors">
              Contact &amp; Map
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
