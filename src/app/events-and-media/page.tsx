import { EventsMediaTabs } from "@/components/events/EventsMediaTabs";

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
      <div className="bg-[#FAF9F7] text-charcoal pt-32 sm:pt-36 pb-12 px-6 sm:px-8 lg:px-12 text-center border-b border-stone relative overflow-hidden w-full">
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <span className="kicker block text-xs font-semibold tracking-widest text-verified-green uppercase">
            COMMUNITY HIGHLIGHTS
          </span>
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
