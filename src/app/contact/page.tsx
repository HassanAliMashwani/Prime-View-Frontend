import React from "react";
import { pagesData } from "@/data/pages";
import { ContactSection } from "@/components/sections/ContactSection";

export const metadata = {
  title: pagesData.contact.title,
  description: pagesData.contact.description,
};

export default function ContactPage() {
  return (
    <div className="bg-warm-ivory min-h-screen">
      {/* Luxury Header Banner */}
      <div className="bg-deep-forest text-warm-ivory py-20 px-6 sm:px-8 lg:px-12 text-center border-b border-emerald-900/40 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="kicker block">CONNECT WITH US</span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-tight">
            {pagesData.contact.h1}
          </h1>
          <p className="font-sans text-base text-warm-ivory/80 mt-2 max-w-xl mx-auto leading-relaxed">
            {pagesData.contact.h2}
          </p>
        </div>
      </div>

      <ContactSection />
    </div>
  );
}
