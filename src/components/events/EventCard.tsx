import React from "react";
import Image from "next/image";
import { Play, Calendar, ArrowRight } from "lucide-react";
import { EventData } from "@/data/events";

interface EventCardProps {
  event: EventData;
  layout?: "horizontal" | "vertical";
  onClick: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, layout = "vertical", onClick }) => {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      onClick={onClick}
      className={`group w-full rounded-[24px] bg-white overflow-hidden cursor-pointer transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] hover:-translate-y-1 border border-black/[0.08] hover:border-[#43612B]/35 flex ${
        isHorizontal ? "flex-col sm:flex-row" : "flex-col"
      } justify-between h-full relative`}
    >
      {/* Decorative Green Glow on Hover */}
      <div className="absolute inset-0 bg-[#43612B]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none" />

      {/* Cover Image Area */}
      <div
        className={`relative overflow-hidden shrink-0 z-10 ${
          isHorizontal
            ? "w-full sm:w-[48%] h-52 sm:h-auto min-h-[220px]"
            : "w-full h-48 sm:h-52"
        }`}
      >
        <Image
          src={event.coverImage}
          alt={`${event.title} Cover`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Play button overlay if the event has a video */}
        {event.videoPreview && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-[#43612B]/90 backdrop-blur-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg border border-white/40 relative overflow-hidden">
              <Play className="w-5 h-5 text-white ml-0.5 fill-white relative z-10" />
            </div>
          </div>
        )}
      </div>

      {/* Details Area — flex-col justify-between flex-1 ensures uniform stretch */}
      <div className="p-6 flex flex-col justify-between flex-1 z-10">

        <div className="flex flex-col">
          <h3
            className={`font-display font-bold text-[#151914] mb-2 leading-tight transition-colors duration-200 group-hover:text-[#43612B] ${
              isHorizontal ? "text-xl lg:text-2xl" : "text-lg sm:text-xl"
            }`}
          >
            {event.title}
          </h3>
          <p className="font-sans text-sm text-[#6B7462] leading-relaxed line-clamp-3 mb-4">
            {event.fullDescription}
          </p>
        </div>

        <div className="flex flex-col mt-auto pt-2">
          {/* Mini Gallery Preview (For Horizontal Cards) */}
          {isHorizontal && event.gallery.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              {event.gallery.slice(0, 3).map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-12 h-8 sm:w-14 sm:h-10 rounded-md overflow-hidden border border-black/5 shadow-xs group/thumb shrink-0"
                >
                  <Image
                    src={img}
                    alt="Gallery Preview"
                    fill
                    className="object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                    sizes="56px"
                  />
                </div>
              ))}
              {event.gallery.length > 3 && (
                <div className="w-12 h-8 sm:w-14 sm:h-10 rounded-md bg-[#FAF9F5] border border-black/[0.08] flex items-center justify-center text-[#6B7462] text-[10px] font-bold shrink-0">
                  +{event.gallery.length - 3}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#151914] transition-colors group-hover:text-[#43612B]">
              View Event
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 stroke-[2.5]" />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
