import Image from "next/image";
import { EventsGrid } from "@/components/events/EventsGrid";

export const metadata = {
  title: "Events & Media - Prime View",
  description: "Explore the latest events, galleries, and media highlights from Prime View Co-Operative Housing Society Ltd.",
};

export default function EventsAndMediaPage() {
  return (
    <div className="bg-[#F8F7F5] text-[#151914] min-h-screen w-full relative">
      
      {/* ── HERO HEADER (SAME AS OUR PLANS PAGE) ── */}
      <div className="relative pt-28 sm:pt-36 pb-28 sm:pb-36 lg:pb-40 px-6 sm:px-8 lg:px-12 text-center overflow-hidden w-full">
        {/* Hero Background — Mountain Valley Landscape */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/new assests/our plan assests/hero background.jpeg?v=2"
            alt="Prime View Events & Media Hero Background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient: dark at top for text, fades to cream at bottom so cards blend in */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(248,247,245,0.7) 80%, #F8F7F5 100%)',
            }}
          />
        </div>

        {/* Content Container */}
        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight font-bold leading-[1.05] drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">
            Events &amp; Media
          </h1>

          <p className="text-white/90 text-sm sm:text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] tracking-wide max-w-xl mx-auto leading-relaxed">
            Discover the vibrant community events and official media releases of Prime View Housing Society.
          </p>
        </div>
      </div>

      {/* Events Grid Section — Overlaps the hero bottom fade */}
      <div className="pb-24 relative z-10 -mt-12 sm:-mt-16">
        <EventsGrid />
      </div>

    </div>
  );
}
