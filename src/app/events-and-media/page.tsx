import { EventsGrid } from "@/components/events/EventsGrid";
import { HeroBackground } from "@/components/ui/HeroBackground";

export const metadata = {
  title: "Events & Media - Prime View",
  description: "Explore the latest events, galleries, and media highlights from Prime View Co-Operative Housing Society Ltd.",
};

export default function EventsAndMediaPage() {
  return (
    <div className="bg-pure-white text-charcoal min-h-screen w-full relative">
      
      {/* Light Header Banner */}
      <div className="bg-[#FAF9F7] pt-24 sm:pt-28 pb-12 px-6 sm:px-8 lg:px-12 text-center relative overflow-hidden w-full border-b border-black/[0.06]">
        <div className="absolute inset-0 opacity-100 pointer-events-none">
          <HeroBackground />
        </div>
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-charcoal tracking-tight">
            Events &amp; Media
          </h1>
          <p className="font-sans text-sm sm:text-base text-charcoal/60 leading-relaxed">
            Discover the vibrant community events and official media releases of Prime View Housing Society.
          </p>
        </div>
      </div>

      <div className="py-12 pb-24 relative z-10">
        <EventsGrid />
      </div>

    </div>
  );
}
