import React from "react";
import { pagesData } from "@/data/pages";
import { ContactSection } from "@/components/sections/ContactSection";
import { HeroBackground } from "@/components/ui/HeroBackground";

export const metadata = {
  title: pagesData.contact.title,
  description: pagesData.contact.description,
};

export default function ContactPage() {
  return (
    <div className="bg-pure-white min-h-screen text-charcoal">
      {/* Light Header Banner */}
      <div className="bg-[#FAF9F7] text-charcoal pt-24 sm:pt-28 pb-8 px-6 sm:px-8 lg:px-12 text-center border-b border-black/[0.06] relative overflow-hidden w-full">
        <HeroBackground />
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          
          <h1 className="font-display text-4xl sm:text-6xl text-charcoal tracking-tight">
            {pagesData.contact.h1}
          </h1>
          <p className="font-sans text-base text-charcoal/60 mt-2 max-w-xl mx-auto leading-relaxed">
            {pagesData.contact.h2}
          </p>
        </div>
      </div>

      <ContactSection />
    </div>
  );
}
