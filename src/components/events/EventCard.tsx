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
      className={`group w-full rounded-[24px] bg-gradient-to-br from-white/90 to-verified-green/5 backdrop-blur-md overflow-hidden cursor-pointer transition-all duration-500 shadow-[0_4px_20px_rgba(46,106,79,0.08)] hover:shadow-[0_8px_30px_rgba(46,106,79,0.15)] hover:-translate-y-1 border-[1.5px] border-verified-green/20 hover:border-verified-green/40 flex ${isHorizontal ? "flex-col sm:flex-row" : "flex-col"
        } h-full relative`}
    >
      {/* Decorative Green Glow on Hover */}
      <div className="absolute inset-0 bg-verified-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 pointer-events-none" />

      {/* Cover Image Area */}
      <div
        className={`relative overflow-hidden shrink-0 z-10 ${isHorizontal
            ? "w-full sm:w-[48%] h-48 sm:h-full min-h-[200px]"
            : "w-full h-44"
          }`}
      >
        <Image
          src={event.coverImage}
          alt={`${event.title} Cover`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Play button overlay if the event has a video */}
        {event.videoPreview && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-lg border border-white/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-verified-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Play className="w-5 h-5 text-white ml-1 fill-white relative z-10" />
            </div>
          </div>
        )}
      </div>

      {/* Details Area */}
      <div className={`p-5 sm:p-6 flex flex-col ${isHorizontal ? "justify-between" : ""} flex-1 z-10`}>

        <div className="flex flex-col">
          <h3 className={`font-display font-bold text-charcoal mb-2 leading-tight transition-colors duration-300 group-hover:text-verified-green ${isHorizontal ? "text-xl lg:text-2xl" : "text-lg sm:text-xl"
            }`}>
            {event.title}
          </h3>
          <p className={`font-sans text-sm text-charcoal/60 leading-relaxed ${isHorizontal ? "line-clamp-5 mb-2" : "line-clamp-3 mb-5"
            }`}>
            {event.fullDescription}
          </p>
        </div>

        <div className="flex flex-col mt-auto">
          {/* Mini Gallery Preview (Only for Large Cards) */}
          {isHorizontal && event.gallery.length > 0 && (
            <div className="flex items-center gap-2 mb-4 pt-2">
              {event.gallery.slice(0, 3).map((img, idx) => (
                <div key={idx} className="relative w-12 h-8 sm:w-14 sm:h-10 rounded-md overflow-hidden border border-black/5 shadow-sm group/thumb">
                  <Image src={img} alt="Gallery Preview" fill className="object-cover group-hover/thumb:scale-110 transition-transform duration-300" />
                </div>
              ))}
              {event.gallery.length > 3 && (
                <div className="w-12 h-8 sm:w-14 sm:h-10 rounded-md bg-stone-100 border border-black/5 flex items-center justify-center text-charcoal/60 text-[10px] font-bold">
                  +{event.gallery.length - 3}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center pt-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-charcoal transition-colors group-hover:text-verified-green">
              View Event
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
