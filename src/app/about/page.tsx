import React from "react";
import { pagesData } from "@/data/pages";
import { AboutHeroSection } from "@/components/about/AboutHeroSection";
import { AboutNarrativeSection } from "@/components/about/AboutNarrativeSection";
import { AboutTrustStrip } from "@/components/about/AboutTrustStrip";

export const metadata = {
  title: pagesData.about.title,
  description: pagesData.about.description,
};

export default function AboutPage() {
  return (
    <div className="bg-pure-white min-h-screen text-charcoal">
      <AboutHeroSection />
      <AboutNarrativeSection />
      <AboutTrustStrip />
    </div>
  );
}
