"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

const plots = [
  { size: "4 Marla", tag: "Commercial", features: ["Main GT Road Access", "High Footfall Commercial Hub", "Ample Parking"] },
  { size: "5 Marla", tag: "Residential", features: ["Corner & Main Boulevard Options", "24/7 Utilities Access", "Gated Security Zone"] },
  { size: "7 Marla", tag: "Residential", features: ["Mountain View Location", "Carpeted Road Access", "Underground Electricity"] },
  { size: "10 Marla", tag: "Residential", features: ["Near Grand Mosque & Park", "Potable Clean Water", "24/7 Security Patrol"] },
  { size: "1 Kanal", tag: "Residential", features: ["Executive Block", "Scenic Panoramic Surroundings", "Spacious Street Frontage"] },
];

export function PlotCarousel() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % plots.length);
    }, 3500); // Change card every 3.5 seconds
    
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % plots.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + plots.length) % plots.length);
  };

  const getPositionStyles = (index: number) => {
    let offset = index - activeIndex;
    // Adjust for circularity
    if (offset < -2) offset += plots.length;
    if (offset > 2) offset -= plots.length;

    const gap = isMobile ? 300 : 320; // Pixels to offset each card
    const isActive = offset === 0;
    const isVisible = Math.abs(offset) <= (isMobile ? 0 : 1);
    const scale = isActive && !isMobile ? 1.05 : (isMobile ? 1 : 0.95);

    return {
      transform: `translate(-50%, -50%) translateX(${offset * gap}px) scale(${scale})`,
      opacity: isVisible ? 1 : 0,
      zIndex: isActive ? 20 : 10 - Math.abs(offset),
      pointerEvents: (isActive || (!isMobile && Math.abs(offset) === 1)) ? "auto" as const : "none" as const,
    };
  };

  return (
    <div 
      className="w-full overflow-hidden flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Carousel Container */}
      <div className="relative w-full max-w-6xl h-[600px] mx-auto">
        {plots.map((plot, index) => {
          let offset = index - activeIndex;
          if (offset < -2) offset += plots.length;
          if (offset > 2) offset -= plots.length;
          const isActive = offset === 0;

          return (
            <div
              key={index}
              className="absolute top-1/2 left-1/2 transition-all duration-500 ease-in-out w-[300px] cursor-pointer"
              style={getPositionStyles(index)}
              onClick={() => setActiveIndex(index)}
            >
              <div 
                className={`relative w-full h-[460px] bg-white rounded-[2rem] border border-gray-200 transition-all duration-500
                ${isActive ? 'shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-gray-200/50' : 'hover:border-gray-300'}
              `}
              >
                {/* Floating Badge */}
                <div 
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-md transition-opacity duration-500 z-20
                  ${isActive ? 'opacity-100' : 'opacity-0'}`}
                >
                  Best Investment
                </div>

                {/* Card Content Wrapper */}
                <div className="relative w-full h-full overflow-hidden rounded-[2rem] flex flex-col z-10">
                  {/* Soft Gradient for active card */}
                  <div 
                    className={`absolute top-0 right-0 w-full h-[60%] bg-gradient-to-b from-purple-50/40 via-transparent to-transparent transition-opacity duration-500 -z-10
                    ${isActive ? 'opacity-100' : 'opacity-0'}`} 
                  />
                  <div 
                    className={`absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-bl from-purple-300/40 via-blue-200/40 to-transparent rounded-full blur-3xl transition-opacity duration-500 -z-10
                    ${isActive ? 'opacity-100' : 'opacity-0'}`} 
                  />

                  {/* Content */}
                  <div className="p-6 flex flex-col h-full z-10">
                    <h3 className="text-[1.35rem] font-medium text-gray-900 tracking-tight mb-2">{plot.tag}</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl font-bold text-gray-900 tracking-tight">{plot.size}</span>
                    </div>
                    
                    <hr className="border-gray-100 mb-6" />
                    
                    <p className="text-[12px] font-bold tracking-wider text-gray-500 mb-6 uppercase">
                      What's included
                    </p>
                    
                    <ul className="space-y-4 flex-1">
                      {plot.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-[18px] h-[18px] text-gray-400 shrink-0 mt-[2px]" strokeWidth={2} />
                          <span className="text-gray-600 font-medium text-[14px] leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link 
                      href="/contact" 
                      className="w-full mt-8 py-3.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-900 font-semibold rounded-full transition-colors text-sm text-center block"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
