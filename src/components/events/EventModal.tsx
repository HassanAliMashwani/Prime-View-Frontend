"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, MapPin, Maximize2, Play } from "lucide-react";
import { EventData } from "@/data/events";
import { formatYouTubeEmbedUrl } from "@/lib/dal/youtube";
import { getEventImageUrls } from "@/lib/images";

interface EventModalProps {
  event: EventData;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const videoEmbedUrl = event.videoPreview
    ? formatYouTubeEmbedUrl(event.videoPreview) ||
      (event.videoPreview.includes("youtube.com/embed") ? event.videoPreview : null)
    : null;

  useEffect(() => {
    setMounted(true);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxImage) {
          setLightboxImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxImage, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#FAF9F7] rounded-[2rem] shadow-2xl border border-black/[0.08] cursor-default overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-10 h-10 rounded-full bg-white hover:bg-black/5 text-[#151914] flex items-center justify-center transition-colors cursor-pointer shadow-xs border border-black/10"
          aria-label="Close Event Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Inner Content */}
        <div className="overflow-y-auto w-full h-full p-6 sm:p-9 custom-modal-scrollbar">
          <div className="flex flex-col gap-6 sm:gap-8 pt-2 sm:pt-0">
            
            {/* Header Info */}
            <div className="max-w-3xl pr-10">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                {event.date && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EAF0E7] text-[#43612B] text-xs font-bold uppercase tracking-wider border border-[#43612B]/20">
                    <Calendar className="w-4 h-4" />
                    {event.date}
                  </span>
                )}
                {event.venue && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/5 text-[#4A5347] text-xs font-medium border border-black/[0.06]">
                    <MapPin className="w-4 h-4 text-[#43612B]" />
                    {event.venue}
                  </span>
                )}
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#151914] mb-2 tracking-tight">
                {event.title}
              </h2>

              {event.subtitle && (
                <p className="font-sans text-sm sm:text-base font-semibold text-[#43612B] tracking-wide mb-4 uppercase">
                  {event.subtitle}
                </p>
              )}

              <p className="font-sans text-sm sm:text-base text-[#5A6354] leading-relaxed whitespace-pre-line">
                {event.fullDescription}
              </p>
            </div>

            {/* Video Section — Shown FIRST if video is added */}
            {event.videoPreview && (
              <div className="pt-4 border-t border-black/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center text-red-600 shadow-2xs">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[#151914]">
                      Event Video
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    Video
                  </span>
                </div>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-black/10 shadow-lg">
                  {videoEmbedUrl ? (
                    <iframe
                      src={videoEmbedUrl}
                      title={`${event.title} Video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <video
                      src={event.videoPreview}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Photo Gallery — Rest of the pictures as it is now */}
            {event.gallery && event.gallery.length > 0 && (
              <div className="pt-4 border-t border-black/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#151914]">
                    Event Photo Gallery
                  </h3>
                  <span className="text-xs font-semibold text-[#6B7462] bg-black/5 px-2.5 py-1 rounded-full">
                    {event.gallery.length} Photos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {event.gallery.slice(0, 9).map((img, idx) => {
                    const { thumb: thumbUrl, full: fullUrl } = getEventImageUrls(img);
                    const displayThumb = thumbUrl || img;
                    const displayFull = fullUrl || img;

                    // Custom layout logic to fit each photo without any cropping
                  let colSpan = "col-span-1";
                  let aspect = "aspect-[3/4]";
                  let bg = "bg-[#F3F2ED]";
                  let fit = "object-contain p-1.5 sm:p-2";

                  if (idx === 0 || img.includes("WhatsApp")) {
                    // Pic 1: Full-width invitation banner
                    colSpan = "col-span-1 sm:col-span-2 lg:col-span-3";
                    aspect = "aspect-[2/1] sm:aspect-[2.3/1]";
                    bg = "bg-[#2f4d41]";
                    fit = "object-contain p-3 sm:p-5";
                  } else if (idx === 4 || img.includes("QAS07562")) {
                    // Pic 5: 5 leaders on stage (wide landscape 3:2)
                    colSpan = "col-span-1 sm:col-span-2";
                    aspect = "aspect-[16/10]";
                  } else if (idx === 5 || img.includes("QAS07590")) {
                    // Pic 6: Shield presentation with Dr. Roman Gul (wide landscape 16:10)
                    colSpan = "col-span-1 sm:col-span-2";
                    aspect = "aspect-[16/10]";
                  } else if (idx === 3 || img.includes("QAS07033")) {
                    // Pic 4: 3 leaders bouquet presentation (landscape 4:3)
                    colSpan = "col-span-1";
                    aspect = "aspect-[4/3] sm:aspect-[3/4]";
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => setLightboxImage(displayFull)}
                      className={`group relative ${colSpan} ${aspect} ${bg} rounded-2xl overflow-hidden border border-black/[0.08] shadow-xs cursor-pointer hover:shadow-xl transition-all duration-300 flex items-center justify-center`}
                    >
                      {displayThumb && (
                        <img
                          src={displayThumb}
                          alt={`${event.title} Photo ${idx + 1}`}
                          loading="lazy"
                          decoding="async"
                          className={`w-full h-full ${fit} object-center transition-transform duration-500 group-hover:scale-[1.02]`}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center text-[#151914] shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Image Zoom */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxImage(null);
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
            aria-label="Close Preview"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-5xl max-h-[88vh] w-full h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxImage && (
              <img
                src={lightboxImage}
                alt="Enlarged Preview"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
