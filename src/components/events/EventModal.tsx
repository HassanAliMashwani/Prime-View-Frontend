"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Play } from "lucide-react";
import { EventData } from "@/data/events";

interface EventModalProps {
  event: EventData;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-charcoal/80 backdrop-blur-md animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[95vh] flex flex-col bg-[#FAF9F7] rounded-[2rem] shadow-2xl border border-black/[0.08] cursor-default overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-10 h-10 rounded-full bg-white hover:bg-black/5 text-[#151914] flex items-center justify-center transition-colors cursor-pointer shadow-xs border border-black/5"
          aria-label="Close Event Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Inner Content */}
        <div className="overflow-y-auto w-full h-full p-6 sm:p-8 custom-modal-scrollbar">
          {/* Modal Content - Bento Layout */}
          <div className="flex flex-col gap-6 sm:gap-8 pt-4 sm:pt-0">
            
            {/* Header Info */}
            <div className="max-w-3xl pr-12">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#151914] mb-4 tracking-tight">
                {event.title}
              </h2>
              <p className="font-sans text-base sm:text-lg text-[#6B7462] leading-relaxed">
                {event.fullDescription}
              </p>
            </div>

            {/* Media Gallery */}
            <div className="pt-2 border-t border-black/[0.06]">
              <h3 className="font-display text-2xl font-bold text-[#151914] mb-4">Event Gallery</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Video First */}
                {event.videoPreview && (
                  <div className="relative aspect-square sm:aspect-auto sm:col-span-2 lg:col-span-2 rounded-2xl overflow-hidden bg-black/5 border border-white">
                    <video
                      src={event.videoPreview}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Other Images */}
                {event.gallery.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-black/5 border border-white">
                    <Image
                      src={img}
                      alt={`${event.title} Gallery ${idx + 1}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
