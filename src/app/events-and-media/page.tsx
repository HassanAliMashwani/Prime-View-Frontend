import { EventsMediaTabs } from "@/components/events/EventsMediaTabs";

import { HeroBackground } from "@/components/ui/HeroBackground";

export const metadata = {
  title: "Events & Media - Prime View",
  description: "Explore the latest events, galleries, and media highlights from Prime View Co-Operative Housing Society Ltd.",
};

const mediaVideos = [
  {
    title: "NOC Approved Status",
    src: "/new assests/Vedios/NOC APRROVED VIDEO.mp4"
  },
  {
    title: "Prime View Highlights",
    src: "/new assests/Vedios/PM HIGHLIGHTS.mp4"
  },
  {
    title: "Blue Water Overview",
    src: "/new assests/Vedios/PM BLUE WATER.mp4"
  },
  {
    title: "Drone Footage",
    src: "/new assests/Vedios/low qual vedio drone shoot.mp4"
  }
];

export default function EventsAndMediaPage() {
  return (
    <div className="bg-pure-white text-charcoal min-h-screen">
      
      {/* Light Header Banner */}
      <div className="bg-[#FAF9F7] text-charcoal pt-24 sm:pt-28 pb-8 px-6 sm:px-8 lg:px-12 text-center border-b border-black/[0.06] relative overflow-hidden w-full">
        <HeroBackground />
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-charcoal tracking-tight">
            Events &amp; Media
          </h1>
          <p className="font-sans text-sm sm:text-base text-charcoal/60 leading-relaxed">
            Discover the vibrant community events and official media releases of Prime View Housing Society.
          </p>
        </div>
      </div>

      <div className="py-20 bg-soft-white border-b border-stone/60">
        <EventsMediaTabs mediaVideos={mediaVideos} />
      </div>

    </div>
  );
}
