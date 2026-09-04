"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  Car,
  Building2,
  GraduationCap,
  ShoppingBag,
  Leaf,
  Map as MapIcon,
  MountainSnow,
  ArrowRight,
  Maximize2,
  Plus,
  Minus,
} from "lucide-react";

// Highway / Expressway icon matching the reference design
const HighwayRoadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* Road outline with perspective */}
    <path d="M4 21L8 3H10L7.2 21H4ZM14 3H16L20 21H16.8L14 3ZM11 5H13V8H11V5ZM11 11H13V15H11V11ZM11 18H13V22H11V18Z" />
  </svg>
);

// Medical Hospital Cross icon matching the reference design
const HospitalCrossIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 5.5a1 1 0 0 0-2 0V10H7.5a1 1 0 0 0 0 2H11v2.5a1 1 0 0 0 2 0V12h3.5a1 1 0 0 0 0-2H13V7.5z"
    />
  </svg>
);

export const LocationMapCard: React.FC = () => {
  const [mapMode, setMapMode] = useState<"satellite" | "roadmap">("satellite");
  const [zoom, setZoom] = useState<number>(12);

  const coordinates = "34.0538,73.1534";
  const googleMapsUrl = `https://maps.google.com/?q=${coordinates}`;
  const directionsUrl = `https://maps.google.com/maps/dir/?api=1&destination=${coordinates}`;

  // Map embed URL with satellite hybrid (t=h) or roadmap (t=m)
  const mapEmbedUrl = `https://maps.google.com/maps?q=${coordinates}&z=${zoom}&t=${
    mapMode === "satellite" ? "h" : "m"
  }&output=embed`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 1, 10));

  const landmarks = [
    {
      title: "Hazara Expressway",
      duration: "5 mins",
      icon: HighwayRoadIcon,
    },
    {
      title: "GT Road",
      duration: "10 mins",
      icon: HighwayRoadIcon,
    },
    {
      title: "Abbottabad City",
      duration: "20 mins",
      icon: Building2,
    },
    {
      title: "Educational Institutions",
      duration: "Nearby",
      icon: GraduationCap,
    },
    {
      title: "Hospitals",
      duration: "Nearby",
      icon: HospitalCrossIcon,
    },
    {
      title: "Markets & Commercial Area",
      duration: "Nearby",
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      {/* ── MAIN LOCATION CARD ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#E4EAE1] shadow-[0_12px_40px_rgba(0,0,0,0.06)] space-y-6 sm:space-y-8">
        
        {/* Card Header: Title, Subtitle, and Get Directions Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F3EE] pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#1C3E24] text-white flex items-center justify-center shrink-0 shadow-sm">
              <MapPin className="w-5 h-5 fill-white text-[#1C3E24]" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#182315] tracking-tight">
                Prime View Abbottabad Location
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#647160] mt-0.5">
                Tata Suchian, Havelian, Hazara Division, Khyber Pakhtunkhwa
              </p>
            </div>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 bg-[#1C3E24] hover:bg-[#15301B] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(28,62,36,0.3)] transition-all duration-200 shrink-0 group self-start sm:self-center"
          >
            <Navigation className="w-3.5 h-3.5 fill-current text-white -rotate-45 group-hover:translate-x-0.5 transition-transform" />
            <span>Get Directions</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Card Body: Map on Left (approx 68%), Details on Right (approx 32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Interactive Satellite / Hybrid Map */}
          <div className="lg:col-span-8 relative h-[380px] sm:h-[460px] lg:h-[500px] rounded-2xl overflow-hidden border border-black/[0.08] shadow-xs bg-[#243321]">
            <iframe
              title="Prime View Housing Society Satellite Map"
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />

            {/* Top-Right: Fullscreen button */}
            <div className="absolute top-3.5 right-3.5 z-20">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Full Google Maps"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 hover:bg-white text-gray-800 rounded-lg shadow-md border border-black/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <Maximize2 className="w-4 h-4" />
              </a>
            </div>

            {/* Bottom-Left: Map / Satellite Mode Toggle */}
            <div className="absolute bottom-3.5 left-3.5 z-20">
              <div className="bg-white rounded-lg p-1 shadow-lg border border-black/10 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMapMode("roadmap")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    mapMode === "roadmap"
                      ? "bg-[#1C3E24] text-white shadow-xs"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode("satellite")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    mapMode === "satellite"
                      ? "bg-[#1C3E24] text-white shadow-xs"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            {/* Bottom-Right: Zoom +/- Controls */}
            <div className="absolute bottom-3.5 right-3.5 z-20 flex flex-col bg-white rounded-lg shadow-lg border border-black/10 overflow-hidden">
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In"
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors border-b border-black/5"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out"
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Location Details */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-5">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#182315] tracking-tight">
                Location Details
              </h3>

              <div className="space-y-1.5 sm:space-y-2">
                {/* 1. Tata Suchian */}
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group cursor-pointer flex items-center gap-3.5 p-2 sm:p-2.5 -mx-2 sm:-mx-2.5 rounded-2xl transition-all duration-300 hover:bg-[#F3F8F1] border border-transparent hover:border-[#D5E3D2]/80 hover:shadow-xs hover:translate-x-1"
                >
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EAF2E8] text-[#1C3E24] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#1C3E24] group-hover:text-white group-hover:shadow-md group-hover:-rotate-2">
                    <span className="absolute inset-0 rounded-2xl bg-[#1C3E24] opacity-0 group-hover:opacity-15 group-hover:scale-115 transition-all duration-300 pointer-events-none" />
                    <MapPin className="w-5 h-5 sm:w-[22px] sm:h-[22px] fill-current transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div>
                    <h4 className="font-display sm:font-sans font-bold text-[15px] sm:text-base text-[#182315] group-hover:text-[#1C3E24] transition-colors leading-snug">
                      Tata Suchian, Havelian
                    </h4>
                    <p className="text-xs sm:text-[13px] text-[#5B6657] mt-0.5 font-medium group-hover:text-[#384634] transition-colors">
                      Abbottabad, KPK
                    </p>
                  </div>
                </a>

                {/* 2. Direct Access */}
                <div className="group cursor-pointer flex items-center gap-3.5 p-2 sm:p-2.5 -mx-2 sm:-mx-2.5 rounded-2xl transition-all duration-300 hover:bg-[#F3F8F1] border border-transparent hover:border-[#D5E3D2]/80 hover:shadow-xs hover:translate-x-1">
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EAF2E8] text-[#1C3E24] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#1C3E24] group-hover:text-white group-hover:shadow-md group-hover:-rotate-2">
                    <span className="absolute inset-0 rounded-2xl bg-[#1C3E24] opacity-0 group-hover:opacity-15 group-hover:scale-115 transition-all duration-300 pointer-events-none" />
                    <HighwayRoadIcon className="w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div>
                    <h4 className="font-display sm:font-sans font-bold text-[15px] sm:text-base text-[#182315] group-hover:text-[#1C3E24] transition-colors leading-snug">
                      Direct Access
                    </h4>
                    <p className="text-xs sm:text-[13px] text-[#5B6657] mt-0.5 font-medium group-hover:text-[#384634] transition-colors">
                      From Hazara Expressway
                    </p>
                  </div>
                </div>

                {/* 3. Close to GT Road */}
                <div className="group cursor-pointer flex items-center gap-3.5 p-2 sm:p-2.5 -mx-2 sm:-mx-2.5 rounded-2xl transition-all duration-300 hover:bg-[#F3F8F1] border border-transparent hover:border-[#D5E3D2]/80 hover:shadow-xs hover:translate-x-1">
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EAF2E8] text-[#1C3E24] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#1C3E24] group-hover:text-white group-hover:shadow-md group-hover:-rotate-2">
                    <span className="absolute inset-0 rounded-2xl bg-[#1C3E24] opacity-0 group-hover:opacity-15 group-hover:scale-115 transition-all duration-300 pointer-events-none" />
                    <Car className="w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div>
                    <h4 className="font-display sm:font-sans font-bold text-[15px] sm:text-base text-[#182315] group-hover:text-[#1C3E24] transition-colors leading-snug">
                      Close to GT Road
                    </h4>
                    <p className="text-xs sm:text-[13px] text-[#5B6657] mt-0.5 font-medium group-hover:text-[#384634] transition-colors">
                      Easy connectivity
                    </p>
                  </div>
                </div>

                {/* 4. Peaceful Surroundings */}
                <div className="group cursor-pointer flex items-center gap-3.5 p-2 sm:p-2.5 -mx-2 sm:-mx-2.5 rounded-2xl transition-all duration-300 hover:bg-[#F3F8F1] border border-transparent hover:border-[#D5E3D2]/80 hover:shadow-xs hover:translate-x-1">
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EAF2E8] text-[#1C3E24] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#1C3E24] group-hover:text-white group-hover:shadow-md group-hover:-rotate-2">
                    <span className="absolute inset-0 rounded-2xl bg-[#1C3E24] opacity-0 group-hover:opacity-15 group-hover:scale-115 transition-all duration-300 pointer-events-none" />
                    <MountainSnow className="w-5 h-5 sm:w-[22px] sm:h-[22px] transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div>
                    <h4 className="font-display sm:font-sans font-bold text-[15px] sm:text-base text-[#182315] group-hover:text-[#1C3E24] transition-colors leading-snug">
                      Peaceful Surroundings
                    </h4>
                    <p className="text-xs sm:text-[13px] text-[#5B6657] mt-0.5 font-medium group-hover:text-[#384634] transition-colors">
                      Nature &amp; Modern Living
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Bottom Callout Banner */}
            <div className="bg-[#EAF3E7] border border-[#D9E7D5] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs group hover:bg-[#E4EFE0] transition-colors">
              <Leaf className="w-6 h-6 sm:w-7 sm:h-7 text-[#1C3E24] shrink-0 fill-[#1C3E24]/20 group-hover:rotate-12 transition-transform duration-300" />
              <p className="font-display italic text-sm sm:text-base font-medium text-[#1C3E24] leading-snug">
                A prime location for a brighter future.
              </p>
            </div>

          </div>


        </div>

      </div>

      {/* ── NEARBY LANDMARKS SECTION ── */}
      <div className="space-y-4 pt-2">
        {/* Landmarks Header */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-[#1C3E24]">
            <MapIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#182315] tracking-tight">
              Nearby Landmarks
            </h3>
            <p className="font-sans text-xs sm:text-sm text-[#647160] mt-0.5">
              Well connected to key locations and essential facilities.
            </p>
          </div>
        </div>

        {/* 6 Landmark Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pt-2">
          {landmarks.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-[#FAFBF9] hover:bg-white rounded-2xl p-4 sm:p-5 border border-[#E4EAE1] hover:border-[#1C3E24]/30 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-between text-center min-h-[145px] group"
              >
                <div className="text-[#1C3E24] mb-2 group-hover:scale-110 transition-transform duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="my-auto">
                  <h4 className="font-bold text-xs sm:text-[13px] text-[#182315] leading-snug">
                    {item.title}
                  </h4>
                </div>
                <span className="text-xs text-[#6B7566] font-medium mt-2">
                  {item.duration}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
