import React from "react";
import Image from "next/image";

export const AboutPartnersSection: React.FC = () => {
  return (
    <section className="py-24 bg-soft-white border-t border-card-border/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16 space-y-4 max-w-2xl mx-auto">
          <span className="kicker block text-xs font-semibold tracking-widest text-[#d08535] uppercase">
            Official Approvals &amp; Partners
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-charcoal">
            Certified Excellence
          </h2>
          <p className="font-sans text-sm sm:text-base text-muted-gray-text leading-relaxed">
            Prime View is backed by official NOC approvals and trusted partners, ensuring a secure and reliable investment for your future.
          </p>
        </div>

        {/* Image Grid for JPEGs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-card-border hover:shadow-md transition-shadow bg-white flex justify-center">
            <Image
              src="/new assests/about page logos/partner-1.jpeg"
              alt="Partner Logo 1"
              width={1200}
              height={1600}
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-card-border hover:shadow-md transition-shadow bg-white flex justify-center">
            <Image
              src="/new assests/about page logos/partner-2.jpeg"
              alt="Partner Logo 2"
              width={1600}
              height={1200}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
