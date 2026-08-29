import React from "react";
import { pagesData } from "@/data/pages";
import { ContactSection } from "@/components/sections/ContactSection";

export const metadata = {
  title: pagesData.contact.title,
  description: pagesData.contact.description,
};

export default function ContactPage() {
  return (
    <div className="bg-pure-white min-h-screen text-charcoal">
      {/* Light Header Banner */}
      <div className="bg-soft-white text-charcoal pt-28 sm:pt-32 pb-16 px-6 sm:px-8 lg:px-12 text-center border-b border-card-border relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          
          <h1 className="font-display text-4xl sm:text-6xl text-charcoal tracking-tight">
            {pagesData.contact.h1}
          </h1>
          <p className="font-sans text-base text-muted-gray-text mt-2 max-w-xl mx-auto leading-relaxed">
            {pagesData.contact.h2}
          </p>
        </div>
      </div>

      <ContactSection />
    </div>
  );
}
