import React from "react";
import Image from "next/image";
import { Play, Calendar, MapPin, ArrowRight } from "lucide-react";
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
      className={`group w-full rounded-[28px] bg-white overflow-hidden cursor-pointer transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 border border-black/[0.08] hover:border-[#43612B]/40 flex ${
        isHorizontal ? "flex-col md:flex-row" : "flex-col"
      } justify-between h-full relative`}
    >
      {/* Decorative Green Glow on Hover */}
      <div className="absolute inset-0 bg-[#43612B]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 pointer-events-none" />

      {/* Cover Image Area */}
      <div
        className={`relative overflow-hidden shrink-0 z-10 ${
          isHorizontal
            ? "w-full md:w-[48%] h-64 md:h-auto min-h-[260px] md:min-h-[320px]"
            : "w-full h-56 sm:h-64"
        }`}
      >
        <Image
          src={event.coverImage}
          alt={`${event.title} Cover`}
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-300" />

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
      <div className="p-6 sm:p-8 flex flex-col justify-between flex-1 z-10">

        <div className="flex flex-col">
          {/* Date & Venue Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {event.date && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF0E7] text-[#43612B] text-xs font-bold uppercase tracking-wider border border-[#43612B]/20">
                <Calendar className="w-3.5 h-3.5" />
                {event.date}
              </span>
            )}
            {event.venue && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 text-[#556050] text-xs font-medium border border-black/[0.06]">
                <MapPin className="w-3.5 h-3.5 text-[#43612B]" />
                {event.venue.split(",")[0]}
              </span>
            )}
          </div>

          <h3
            className={`font-display font-bold text-[#151914] mb-1.5 leading-tight transition-colors duration-200 group-hover:text-[#43612B] ${
              isHorizontal ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
            }`}
          >
            {event.title}
          </h3>

          {event.subtitle && (
            <p className="font-sans text-xs sm:text-sm font-semibold text-[#43612B] tracking-wide mb-3 uppercase">
              {event.subtitle}
            </p>
          )}

          <p className="font-sans text-sm sm:text-[15px] text-[#5A6354] leading-relaxed line-clamp-3 mb-4">
            {event.summary || event.fullDescription}
          </p>
        </div>

        <div className="flex flex-col mt-auto pt-2">
          {/* Mini Gallery Preview (For Horizontal Cards) */}
          {isHorizontal && event.gallery.length > 0 && (
            <div className="flex items-center gap-2.5 mb-4">
              {event.gallery.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden border border-black/10 shadow-2xs group/thumb shrink-0"
                >
                  <Image
                    src={img}
                    alt="Gallery Preview"
                    fill
                    className="object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                    sizes="64px"
                  />
                </div>
              ))}
              {event.gallery.length > 4 && (
                <div className="w-14 h-10 sm:w-16 sm:h-11 rounded-lg bg-[#FAF9F5] border border-black/[0.08] flex items-center justify-center text-[#43612B] text-xs font-bold shrink-0">
                  +{event.gallery.length - 4}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#151914] transition-colors group-hover:text-[#43612B]">
              View Event &amp; Gallery
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 stroke-[2.5]" />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
