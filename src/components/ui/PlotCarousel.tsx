"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import Image from "next/image";

const plots = [
  { 
    size: "05 Marla", 
    tag: "Residential",
    dimensions: "25 x 50",
    totalPrice: "2,500,000",
    downPayment: "625,000",
    monthly: "24,500",
    monthlyTotal: "955,500",
    halfYearly: "90,000",
    halfYearlyTotal: "720,000",
    possession: "200,000",
    image: "/new assests/new pic/1.jpeg" 
  },
  { 
    size: "7.5 Marla", 
    tag: "Residential",
    dimensions: "30 x 60",
    totalPrice: "3,600,000",
    downPayment: "900,000",
    monthly: "35,000",
    monthlyTotal: "1,365,000",
    halfYearly: "130,000",
    halfYearlyTotal: "1,040,000",
    possession: "295,000",
    image: "/new assests/new pic/2.jpg" 
  },
  { 
    size: "10 Marla", 
    tag: "Residential",
    dimensions: "35 x 70",
    totalPrice: "4,900,000",
    downPayment: "1,225,000",
    monthly: "48,000",
    monthlyTotal: "1,872,000",
    halfYearly: "175,000",
    halfYearlyTotal: "1,400,000",
    possession: "400,000",
    image: "/new assests/new pic/3.jpeg" 
  },
  { 
    size: "13 Marla", 
    tag: "Residential",
    dimensions: "40 x 80",
    totalPrice: "6,400,000",
    downPayment: "1,600,000",
    monthly: "60,000",
    monthlyTotal: "2,340,000",
    halfYearly: "230,000",
    halfYearlyTotal: "1,840,000",
    possession: "620,000",
    image: "/new assests/new pic/1.jpeg" 
  },
  { 
    size: "01 Kanal", 
    tag: "Residential",
    dimensions: "50 x 100",
    totalPrice: "10,000,000",
    downPayment: "2,500,000",
    monthly: "98,000",
    monthlyTotal: "3,822,000",
    halfYearly: "360,000",
    halfYearlyTotal: "2,880,000",
    possession: "800,000",
    image: "/new assests/new pic/2.jpg" 
  },
];

export function PlotCarousel() {
  const [activeIndex, setActiveIndex] = useState(2); // Center 10 Marla by default
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
    }, 4000);

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

    const gap = isMobile ? 320 : 340; // Slightly wider gap for new content
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
      className="w-full overflow-hidden flex flex-col items-center pb-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Carousel Container */}
      <div className="relative w-full max-w-6xl h-[640px] mx-auto">
        {plots.map((plot, index) => {
          let offset = index - activeIndex;
          if (offset < -2) offset += plots.length;
          if (offset > 2) offset -= plots.length;
          const isActive = offset === 0;

          return (
            <div
              key={index}
              className="absolute top-1/2 left-1/2 transition-all duration-500 ease-in-out w-[320px] cursor-pointer"
              style={getPositionStyles(index)}
              onClick={() => setActiveIndex(index)}
            >
              <div
                className={`relative w-full h-[520px] rounded-[2rem] border transition-all duration-500
                ${isActive ? 'shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/40' : 'border-white/10 hover:border-white/30'}
              `}
              >
                {/* Full Background Image */}
                <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem]">
                  <Image
                    src={plot.image}
                    alt={plot.size}
                    fill
                    className="object-cover"
                  />
                  {/* Heavy dark gradient to make white text readable */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95" />
                </div>

                {/* Floating Badge */}
                <div
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-[#B29A68] text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-lg transition-opacity duration-500 z-20
                  ${isActive ? 'opacity-100' : 'opacity-0'}`}
                >
                  Recommended
                </div>

                {/* Card Content Wrapper */}
                <div className="relative w-full h-full flex flex-col z-10 text-white p-6">
                  {/* Content */}
                  <div className="flex items-end justify-between mb-2">
                    <h3 className="text-[1.1rem] font-medium tracking-tight opacity-90">{plot.tag}</h3>
                    <span className="text-sm font-medium opacity-70 bg-white/10 px-2 py-0.5 rounded-md">{plot.dimensions}</span>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold tracking-tight">{plot.size}</span>
                  </div>

                  <hr className="border-white/20 mb-4" />

                  <div className="mb-5">
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Total Price</p>
                    <p className="text-3xl font-bold text-[#B29A68]">Rs {plot.totalPrice}</p>
                  </div>

                  <ul className="space-y-3 flex-1 text-sm">
                    <li className="flex justify-between items-center border-b border-white/10 pb-2">
                      <span className="text-white/70">Down Payment (25%)</span>
                      <span className="font-semibold text-white">Rs {plot.downPayment}</span>
                    </li>
                    <li className="flex flex-col border-b border-white/10 pb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white/70">Monthly Installment (x39)</span>
                        <span className="font-semibold text-white">Rs {plot.monthly}</span>
                      </div>
                    </li>
                    <li className="flex flex-col border-b border-white/10 pb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white/70">Half Yearly (x8)</span>
                        <span className="font-semibold text-white">Rs {plot.halfYearly}</span>
                      </div>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-white/70">On Possession</span>
                      <span className="font-semibold text-white">Rs {plot.possession}</span>
                    </li>
                  </ul>

                  <Link
                    href="/contact"
                    className="w-full mt-6 py-3.5 px-4 bg-white/10 hover:bg-[#B29A68] hover:text-white hover:border-[#B29A68] backdrop-blur-md border border-white/20 text-white font-semibold rounded-full transition-all duration-300 text-sm text-center block shadow-lg"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
