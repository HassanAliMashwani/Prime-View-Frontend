"use client";

import React, { useState, useEffect } from "react";
import { MasonryGrid } from "@/components/gallery/MasonryGrid";

interface VideoData {
  title: string;
  src: string;
}

interface EventsMediaTabsProps {
  mediaVideos: VideoData[];
}

export const EventsMediaTabs: React.FC<EventsMediaTabsProps> = ({ mediaVideos }) => {
  const [activeTab, setActiveTab] = useState<"event" | "media">("event");
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const displayVideos = React.useMemo(() => {
    let videos = [...mediaVideos];
    if (videos.length > 0) {
      while (videos.length < 5) {
        videos = [...videos, ...mediaVideos];
      }
    }
    return videos;
  }, [mediaVideos]);

  useEffect(() => {
    if (activeTab !== "media" || displayVideos.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % displayVideos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab, displayVideos.length]);

  return (
    <div className="w-full">
      {/* Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-12 border-b border-stone/60">
          <button
            onClick={() => setActiveTab("event")}
            className={`pb-4 text-xl sm:text-2xl font-display font-bold transition-colors relative ${activeTab === "event" ? "text-charcoal" : "text-charcoal/30 hover:text-charcoal/60"
              }`}
          >
            Event Gallery
            {activeTab === "event" && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-charcoal rounded-t-sm" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`pb-4 text-xl sm:text-2xl font-display font-bold transition-colors relative ${activeTab === "media" ? "text-charcoal" : "text-charcoal/30 hover:text-charcoal/60"
              }`}
          >
            Official Media
            {activeTab === "media" && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-charcoal rounded-t-sm" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        {activeTab === "event" && (
          <section className="relative overflow-hidden animate-in fade-in duration-500 pt-4">
            <MasonryGrid />
          </section>
        )}

        {activeTab === "media" && (
          <section className="relative overflow-x-hidden overflow-y-visible animate-in fade-in duration-500 py-10 sm:py-16 w-full flex justify-center">
            <div
              className="relative w-full max-w-6xl h-[280px] sm:h-[450px] flex items-center justify-center perspective-[1200px]"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
              }}
            >
              {displayVideos.map((video, idx) => {
                const diff = (idx - carouselIndex + displayVideos.length) % displayVideos.length;
                const offset = diff > displayVideos.length / 2 ? diff - displayVideos.length : diff;
                const isActive = offset === 0;

                const getStyles = () => {
                  if (isActive) return { transform: "translateX(0) scale(1)", zIndex: 30, opacity: 1 };
                  if (offset === 1) return { transform: "translateX(50%) scale(0.8) rotateY(-15deg)", zIndex: 20, opacity: 0.7 };
                  if (offset === -1) return { transform: "translateX(-50%) scale(0.8) rotateY(15deg)", zIndex: 20, opacity: 0.7 };
                  if (offset === 2) return { transform: "translateX(95%) scale(0.6) rotateY(-25deg)", zIndex: 10, opacity: 0.3 };
                  if (offset === -2) return { transform: "translateX(-95%) scale(0.6) rotateY(25deg)", zIndex: 10, opacity: 0.3 };
                  return { transform: "translateX(0) scale(0)", zIndex: 0, opacity: 0 };
                };

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isActive) setSelectedVideo(video);
                      else setCarouselIndex(idx);
                    }}
                    className={`absolute top-0 w-[260px] sm:w-[450px] h-full rounded-[2.5rem] transition-all duration-700 ease-out cursor-pointer ${isActive ? 'shadow-2xl' : 'shadow-md hover:opacity-80'
                      }`}
                    style={getStyles()}
                  >
                    <div className="w-full h-full bg-pure-white rounded-[2.5rem] border border-stone relative group">
                      <div className="absolute inset-3 rounded-3xl overflow-hidden bg-black">
                        {/* Play Icon Overlay */}
                        <div className={`absolute inset-0 z-10 flex items-center justify-center transition-colors ${isActive ? 'bg-black/20 group-hover:bg-black/40' : 'bg-black/0'}`}>
                          <div className={`w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 transition-transform shadow-lg ${isActive ? 'scale-100 group-hover:scale-110' : 'scale-0'}`}>
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        </div>
                        <video
                          src={selectedVideo?.src === video.src ? undefined : video.src}
                          preload="metadata"
                          playsInline
                          muted
                          loop
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className={`absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white/50 text-center transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                          <h3 className="font-sans text-sm font-bold text-charcoal tracking-wide">
                            {video.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedVideo(null)}
          />
          <div className="relative z-10 w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="aspect-video w-full bg-charcoal flex items-center justify-center">
              <video
                src={selectedVideo.src}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
              <h3 className="text-white font-display text-2xl sm:text-3xl font-bold tracking-tight">{selectedVideo.title}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
