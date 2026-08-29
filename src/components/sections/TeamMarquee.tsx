"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { TeamMemberProfile } from "@/data/team";
import { Mail, Facebook, Twitter } from "lucide-react";

interface TeamMarqueeProps {
  members: TeamMemberProfile[];
  speed?: number; // duration between slides in ms
}

export const TeamMarquee: React.FC<TeamMarqueeProps> = ({ members, speed = 3000 }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Ensure we have at least 7 items for a smooth wrapping coverflow
  // This ensures the item wrapping from far-left to far-right happens off-screen/invisible
  let displayMembers = [...members];
  if (displayMembers.length > 0 && displayMembers.length < 7) {
    const timesToDuplicate = Math.ceil(7 / displayMembers.length);
    displayMembers = [];
    for (let i = 0; i < timesToDuplicate; i++) {
      displayMembers = displayMembers.concat(members);
    }
  }

  // Auto slide
  useEffect(() => {
    if (displayMembers.length <= 1) return;
    
    // If speed is less than 100, assume it's in seconds (from the old prop), otherwise ms.
    const intervalSpeed = speed < 100 ? speed * 1000 : speed;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % displayMembers.length);
    }, intervalSpeed);
    return () => clearInterval(interval);
  }, [displayMembers.length, speed]);

  const getCardStyles = (index: number) => {
    const total = displayMembers.length;
    let diff = (index - activeIndex) % total;
    if (diff > Math.floor(total / 2)) diff -= total;
    if (diff < -Math.floor(total / 2)) diff += total;

    const absDiff = Math.abs(diff);
    
    // Position, scaling, and fading math
    const translateX = diff * 115; // move by 115% of width
    const scale = absDiff === 0 ? 1.05 : absDiff === 1 ? 0.9 : 0.78;
    const opacity = absDiff === 0 ? 1 : absDiff === 1 ? 0.6 : 0.2;
    const zIndex = 30 - absDiff;
    const isCenter = absDiff === 0;
    
    // Hide items that are too far out
    if (absDiff > 2) {
      return { opacity: 0, zIndex: 0, transform: `translateX(${diff * 115}%) scale(0.75)`, pointerEvents: 'none' as const };
    }

    return {
      transform: `translateX(${translateX}%) scale(${scale})`,
      zIndex,
      opacity,
      filter: isCenter ? "grayscale(0%)" : "grayscale(100%)",
      isCenter,
    };
  };

  if (!displayMembers.length) return null;

  return (
    <div className="relative w-full overflow-hidden py-12 flex items-center justify-center">
      {/* Container holding the absolute items */}
      <div className="relative w-full max-w-[200px] sm:max-w-[220px] aspect-[3/4]">
        {displayMembers.map((member, index) => {
          const styleProps = getCardStyles(index);

          return (
            <div 
              key={`${member.id}-${index}`}
              className="absolute top-0 left-0 w-full h-full transition-all duration-700 ease-out cursor-pointer"
              style={{
                transform: styleProps.transform,
                zIndex: styleProps.zIndex,
                opacity: styleProps.opacity,
                filter: styleProps.filter,
                pointerEvents: styleProps.pointerEvents,
              }}
              onClick={() => setActiveIndex(index)}
            >
              {/* Card Body */}
              <div className="relative w-full h-full bg-soft-white rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={member.photoPath || "/assets/placeholder.jpg"}
                  alt={member.name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 200px, 220px"
                />
                
                {/* Glassmorphism Text Overlay (Only visible on the center card) */}
                <div 
                  className={`absolute bottom-2.5 left-2.5 right-2.5 bg-white/30 backdrop-blur-md border border-white/40 rounded-xl p-3 transition-all duration-500 flex flex-col items-center justify-center text-center shadow-md
                  ${styleProps.isCenter ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
                >
                  <h3 className="font-display font-bold text-charcoal text-sm sm:text-base leading-tight mb-0.5">
                    {member.name}
                  </h3>
                  <p className="font-sans text-charcoal/90 text-[11px] sm:text-xs font-semibold mb-2">
                    {member.title}
                  </p>
                  
                  {/* Socials */}
                  <div className="flex items-center gap-1.5">
                    <a href={`mailto:${member.email}`} className="text-charcoal hover:text-accent-green transition-colors bg-white/60 hover:bg-white/80 p-1.5 rounded-full">
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                    <a href={member.facebookUrl || "#"} className="text-charcoal hover:text-accent-green transition-colors bg-white/60 hover:bg-white/80 p-1.5 rounded-full">
                      <Facebook className="w-3.5 h-3.5" />
                    </a>
                    <a href={member.twitterUrl || "#"} className="text-charcoal hover:text-accent-green transition-colors bg-white/60 hover:bg-white/80 p-1.5 rounded-full">
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
