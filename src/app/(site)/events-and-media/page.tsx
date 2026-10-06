"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { EventsGrid } from "@/components/events/EventsGrid";
import { EventData, eventsData } from "@/data/events";
import { fetchPublicContent } from "@/lib/dal/publicContent";
import { getCache, setCache, reconcileItems } from "@/lib/dal/apiCache";
import { normalizeImagePath } from "@/lib/images";

function EventsSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="md:col-span-2 lg:col-span-2 rounded-[28px] bg-white border border-black/[0.08] p-6 h-80 animate-pulse flex flex-col md:flex-row gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="w-full md:w-[48%] h-48 md:h-full bg-black/[0.06] rounded-2xl" />
          <div className="flex-1 flex flex-col justify-between py-2 space-y-3">
            <div className="h-4 w-1/3 bg-black/[0.06] rounded-full" />
            <div className="h-7 w-3/4 bg-black/[0.06] rounded-lg" />
            <div className="h-4 w-full bg-black/[0.06] rounded-md" />
            <div className="h-4 w-2/3 bg-black/[0.06] rounded-md" />
            <div className="h-5 w-28 bg-black/[0.06] rounded-md mt-auto" />
          </div>
        </div>
        <div className="col-span-1 rounded-[28px] bg-white border border-black/[0.08] p-6 h-80 animate-pulse flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="w-full h-40 bg-black/[0.06] rounded-2xl" />
          <div className="h-4 w-1/2 bg-black/[0.06] rounded-full" />
          <div className="h-6 w-3/4 bg-black/[0.06] rounded-lg" />
          <div className="h-4 w-full bg-black/[0.06] rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function EventsAndMediaPage() {
  const getInit = () => {
    if (typeof window === 'undefined') return eventsData;
    const cached = getCache<EventData[]>('public:events', true);
    return cached && cached.length > 0 ? cached : eventsData;
  };
  const [cmsEvents, setCmsEvents] = useState<EventData[]>(getInit);

  const loadEvents = useCallback(() => {
    fetchPublicContent('events')
      .then((blocks) => {
        const mapped: EventData[] = [];
        for (const block of blocks) {
          const m = (block.metadata || {}) as Record<string, any>;
          if (!block.title) {
            console.warn(`[CMS Warning] Block ${block.id} in section events is missing required field: title`);
            continue;
          }

          const coverImage = normalizeImagePath(m?.imageUrl ? String(m.imageUrl).trim() : '');
          const rawGallery = Array.isArray(m?.galleryImages) ? m.galleryImages : [];
          const gallery: string[] = rawGallery
            .filter((g: any) => typeof g === 'string' && g.trim())
            .map((g: string) => normalizeImagePath(g.trim()))
            .slice(0, 9);

          mapped.push({
            id: block.id,
            title: block.title,
            subtitle: block.subtitle || undefined,
            date: m?.date ? String(m.date) : '',
            venue: m?.location ? String(m.location) : undefined,
            summary: block.content || '',
            coverImage,
            gallery,
            fullDescription: block.content || '',
            videoPreview: m?.videoUrl && String(m.videoUrl).trim() ? String(m.videoUrl).trim() : undefined,
          });
        }
        if (mapped.length > 0) {
          setCmsEvents((prev) => {
            const next = reconcileItems(prev, mapped, (e) => e.id);
            setCache('public:events', next);
            return next;
          });
        }
      })
      .catch(() => {
        // Leave existing visible events on screen if request fails
      });
  }, []);

  useEffect(() => {
    loadEvents();

    const handleRefresh = () => {
      loadEvents();
    };

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('cms-content-updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadEvents();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Auto-refresh saved events once a minute in the background without clearing the screen
    const interval = setInterval(() => {
      loadEvents();
    }, 60000);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cms_updates');
      channel.onmessage = (e) => {
        if (e.data?.type === 'CONTENT_UPDATED') {
          loadEvents();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('cms-content-updated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [loadEvents]);

  return (
    <div className="bg-[#F8F7F5] text-[#151914] min-h-screen w-full relative">
      
      {/* ── HERO HEADER (SAME AS OUR PLANS PAGE) ── */}
      <div className="relative pt-28 sm:pt-36 pb-28 sm:pb-36 lg:pb-40 px-6 sm:px-8 lg:px-12 text-center overflow-hidden w-full">
        {/* Hero Background — Mountain Valley Landscape */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/new assests/our plan assests/hero background.jpeg?v=2"
            alt="Prime View Events & Media Hero Background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient: dark at top for text, fades to cream at bottom so cards blend in */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(248,247,245,0.7) 80%, #F8F7F5 100%)',
            }}
          />
        </div>

        {/* Content Container */}
        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight font-bold leading-[1.05] drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">
            Events &amp; Media
          </h1>

          <p className="text-white/90 text-sm sm:text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] tracking-wide max-w-xl mx-auto leading-relaxed">
            Discover the vibrant community events and official media releases of Prime View Housing Society.
          </p>
        </div>
      </div>

      {/* Events Grid Section — Overlaps the hero bottom fade */}
      <div className="pb-24 relative z-10 -mt-12 sm:-mt-16 min-h-[480px]">
        <EventsGrid events={cmsEvents.length > 0 ? cmsEvents : eventsData} />
      </div>

    </div>
  );
}
