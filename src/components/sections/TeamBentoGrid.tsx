"use client";

import React, { useState } from "react";
import Image from "next/image";
import { TeamMemberProfile } from "@/data/team";

interface TeamBentoGridProps {
  members: TeamMemberProfile[];
}

export const TeamBentoGrid: React.FC<TeamBentoGridProps> = ({ members }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!members.length) return null;

  return (
    <div className="flex flex-col md:flex-row items-start justify-center gap-3 md:gap-4 max-w-7xl mx-auto px-4 sm:px-6 pb-24 h-auto">
      {members.map((member, index) => {
        let widthClass = "w-full md:w-[25%]";
        let mtClass = "mt-0";
        let zClass = "z-10";
        let borderClass = "border border-charcoal/20";

        if (members.length === 5) {
          // Podium Hierarchy Layout (5 members)
          switch (index) {
            case 0: // Outer Left
              widthClass = "w-full md:w-[19%]";
              mtClass = "md:mt-[8%]";
              break;
            case 1: // Inner Left
              widthClass = "w-full md:w-[21%]";
              mtClass = "md:mt-[5.3%]";
              break;
            case 2: // Center Podium
              widthClass = "w-full md:w-[25%]";
              mtClass = "md:mt-0";
              zClass = "z-30";
              break;
            case 3: // Inner Right
              widthClass = "w-full md:w-[21%]";
              mtClass = "md:mt-[5.3%]";
              break;
            case 4: // Outer Right
              widthClass = "w-full md:w-[19%]";
              mtClass = "md:mt-[8%]";
              break;
          }
        } else if (members.length === 3) {
          // Descending Layout for 3 members (Left is largest)
          switch (index) {
            case 0: // Left (Largest)
              widthClass = "w-full md:w-[26%]";
              mtClass = "md:mt-0";
              zClass = "z-30";
              break;
            case 1: // Middle (Medium)
              widthClass = "w-full md:w-[22%]";
              mtClass = "md:mt-[5.3%]";
              break;
            case 2: // Right (Smallest)
              widthClass = "w-full md:w-[18%]";
              mtClass = "md:mt-[10.6%]";
              break;
          }
        } else if (members.length === 2) {
          // Descending Layout for 2 members (Left is largest)
          switch (index) {
            case 0: // Left (Largest)
              widthClass = "w-full md:w-[28%]";
              mtClass = "md:mt-0";
              zClass = "z-30";
              break;
            case 1: // Right (Smallest)
              widthClass = "w-full md:w-[22%]";
              mtClass = "md:mt-[8%]";
              break;
          }
        } else {
          // Generic fallback
          widthClass = "w-full md:w-[22%]";
          mtClass = "md:mt-0";
        }

        const isExpanded = expandedId === member.id;

        return (
          <div 
            key={member.id} 
            className={`${widthClass} ${mtClass} ${zClass} flex flex-col items-center group`}
          >
            {/* The Card Wrapper (Expands into a pill) */}
            <div 
              className={`relative w-full bg-white flex flex-col ${borderClass} transition-all duration-500 cursor-pointer p-1.5 shadow-sm hover:shadow-xl rounded-t-[1000px] ${
                isExpanded ? "rounded-b-[1000px] pb-8" : "rounded-b-2xl pb-1.5"
              }`}
              onClick={() => setExpandedId(isExpanded ? null : member.id)}
            >
              {/* Image Container */}
              <div className={`relative w-full aspect-[3/4] bg-[#FAF9F7] overflow-hidden transition-all duration-500 rounded-t-[1000px] ${
                isExpanded ? "rounded-b-[100px]" : "rounded-b-2xl"
              }`}>
                <Image
                  src={member.photoPath || "/assets/placeholder.jpg"}
                  alt={member.name}
                  fill
                  className="object-cover object-top transition-all duration-700 ease-out group-hover:scale-[1.03] grayscale-[20%] group-hover:grayscale-0"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              </div>

              {/* Expandable Details Section (Drops down inside the card) */}
              <div 
                className={`grid transition-all duration-500 ease-in-out w-full ${
                  isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
              >
                <div className="overflow-hidden flex flex-col items-center text-center px-2">
                  <h3 className="font-display text-charcoal font-bold text-sm lg:text-base mb-1 leading-tight">
                    {member.name}
                  </h3>
                  <div className="w-6 h-[1px] bg-stone/30 my-2" />
                  <p className="text-charcoal/70 text-[10px] lg:text-xs font-medium mb-4 leading-snug">
                    {member.role}
                  </p>

                  {/* Social Links */}
                  <div className="flex items-center gap-2">
                    <a href={member.facebookUrl || "https://facebook.com/PrimeviewAbbottabad"} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-7 h-7 border border-stone/30 hover:border-verified-green/40 transition-colors rounded-full" aria-label="Facebook">
                      <Image src="/new assests/logos/facebook.svg" alt="Facebook" width={10} height={10} className="w-2.5 h-2.5 object-contain" />
                    </a>
                    <a href={member.twitterUrl || "https://x.com/PrimeViewHousingHazara"} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-7 h-7 border border-stone/30 hover:border-verified-green/40 transition-colors rounded-full" aria-label="X (formerly Twitter)">
                      <Image src="/new assests/logos/x-formerly-twitter.svg" alt="X" width={10} height={10} className="w-2.5 h-2.5 object-contain invert" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* External Title Label */}
            <div className="mt-4 text-center">
              <span className="font-display font-bold text-charcoal text-[13px] lg:text-[15px] tracking-wide">
                {member.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
