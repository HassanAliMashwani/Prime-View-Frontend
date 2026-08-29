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

  return (
    <div className="w-full">
      {/* Toggle */}
      <div className="flex justify-center mb-16">
        <div className="inline-flex bg-soft-white border border-card-border p-1.5 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab("event")}
            className={`px-10 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "event"
                ? "bg-white text-charcoal shadow-md"
                : "text-muted-gray-text hover:text-charcoal hover:bg-black/5"
            }`}
          >
            Event
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`px-10 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "media"
                ? "bg-white text-charcoal shadow-md"
                : "text-muted-gray-text hover:text-charcoal hover:bg-black/5"
            }`}
          >
            Media
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        {activeTab === "event" && (
          <section className="relative overflow-hidden animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mb-10 text-center space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl text-charcoal font-semibold tracking-tight">Event Gallery</h2>
              <p className="text-muted-gray-text text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Browse through our photo gallery featuring meetings, dinners, and community gatherings.
              </p>
            </div>
            <MasonryGrid />
          </section>
        )}

        {activeTab === "media" && (
          <section className="relative overflow-hidden animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mb-10 text-center space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl text-charcoal font-semibold tracking-tight">Official Media</h2>
              <p className="text-muted-gray-text text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Watch our latest project updates, NOC approvals, and drone tours.
              </p>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {mediaVideos.map((video, idx) => (
                <div key={idx} className="bg-pure-white rounded-3xl border border-card-border p-4 shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative">
                    <video
                      src={video.src}
                      controls
                      preload="metadata"
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="font-sans text-base font-semibold text-charcoal mt-5 mb-2 text-center">
                    {video.title}
                  </h3>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
