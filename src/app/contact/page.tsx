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
    <div className="bg-[#F8F7F5] min-h-screen text-[#151914]">
      {/* Light Header Banner */}
      <div className="bg-[#FAF9F7] pt-24 sm:pt-28 pb-8 px-6 sm:px-8 lg:px-12 text-center border-b border-black/[0.06] relative overflow-hidden w-full">
        <HeroBackground />
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          
          <h1 className="font-display text-4xl sm:text-6xl text-[#151914] tracking-tight font-bold">
            {pagesData.contact.h1}
          </h1>
          <p className="font-sans text-base text-[#6B7462] mt-2 max-w-xl mx-auto leading-relaxed">
            {pagesData.contact.h2}
          </p>
        </div>
      </div>

      <ContactSection />
    </div>
  );
}
