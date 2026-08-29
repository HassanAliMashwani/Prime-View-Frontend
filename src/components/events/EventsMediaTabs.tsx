"use client";

import React, { useState } from "react";
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

  return (
    <div className="w-full">
      {/* Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-12 border-b border-stone/60">
          <button
            onClick={() => setActiveTab("event")}
            className={`pb-4 text-xl sm:text-2xl font-display font-bold transition-colors relative ${
              activeTab === "event" ? "text-charcoal" : "text-charcoal/30 hover:text-charcoal/60"
            }`}
          >
            Event Gallery
            {activeTab === "event" && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-charcoal rounded-t-sm" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`pb-4 text-xl sm:text-2xl font-display font-bold transition-colors relative ${
              activeTab === "media" ? "text-charcoal" : "text-charcoal/30 hover:text-charcoal/60"
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

        {activeTab === "media" && (() => {
          let displayVideos = [...mediaVideos];
          if (mediaVideos.length > 0) {
            while (displayVideos.length < 8) {
              displayVideos = [...displayVideos, ...mediaVideos];
            }
          }
          const N = displayVideos.length;
          const theta = 360 / N;
          // Calculate radius for a 400px wide panel (200px half-width) + 120px gap
          const radius = Math.round(200 / Math.tan(Math.PI / N)) + 120;

          return (
            <section className="relative overflow-hidden animate-in fade-in duration-500">
              
              
              <div 
                className="w-full flex justify-center mt-4 mb-8 relative overflow-hidden perspective-[600px] py-4"
                style={{
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                  maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
                }}
              >
                <style>{`
                  @keyframes cinematic-spin {
                    0% { transform: translateZ(-${radius - 150}px) rotateY(0deg); }
                    100% { transform: translateZ(-${radius - 150}px) rotateY(-360deg); }
                  }
                  .animate-cinematic {
                    animation: cinematic-spin 45s linear infinite;
                    transform-style: preserve-3d;
                  }
                  .animate-cinematic:hover {
                    animation-play-state: paused;
                  }
                `}</style>
                
                {/* 3D Cylinder Container */}
                <div className="relative w-[320px] sm:w-[400px] h-[240px] sm:h-[300px] animate-cinematic">
                  {displayVideos.map((video, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedVideo(video)}
                      className="absolute top-0 left-0 w-full h-full bg-pure-white rounded-[2rem] border border-stone p-3 shadow-2xl flex flex-col justify-between cursor-pointer group"
                      style={{
                        transform: `rotateY(${idx * theta}deg) translateZ(${radius}px)`,
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-black flex-shrink-0 relative">
                        {/* Play Icon Overlay */}
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform shadow-lg">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                        <video
                          src={selectedVideo?.src === video.src ? undefined : video.src}
                          preload="metadata"
                          playsInline
                          muted
                          loop
                          autoPlay
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white/50 text-center">
                          <h3 className="font-sans text-sm font-bold text-charcoal tracking-wide">
                            {video.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}
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
