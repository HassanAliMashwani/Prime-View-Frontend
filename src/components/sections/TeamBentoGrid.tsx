import React from "react";
import Image from "next/image";
import { TeamMemberProfile } from "@/data/team";

interface TeamBentoGridProps {
  members: TeamMemberProfile[];
}

export const TeamBentoGrid: React.FC<TeamBentoGridProps> = ({ members }) => {
  if (!members.length) return null;

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 gap-8 max-w-6xl mx-auto px-6">
      {members.map((member, i) => {
        // Add subtle staggered offset
        const marginTop = i % 3 === 1 ? 'sm:mt-12' : i % 3 === 2 ? 'sm:mt-24' : '';
        
        return (
          <div 
            key={member.id}
            className={`group relative w-full mb-8 break-inside-avoid ${marginTop} cursor-pointer`}
          >
            <div className="relative w-full aspect-[3/4] bg-warm-beige overflow-hidden">
              <Image
                src={member.photoPath || "/assets/placeholder.jpg"}
                alt={member.name}
                fill
                className="transition-all duration-700 ease-out object-cover object-top scale-100 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              
              {/* Overlay that dims the image slightly on hover to boost text contrast */}
              <div className="absolute inset-0 bg-pine/0 group-hover:bg-pine/20 transition-colors duration-500" />
              
              {/* Info Overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end translate-y-4 group-hover:translate-y-0">
                <h3 className="font-display text-pure-white font-bold text-lg leading-tight">
                  {member.name}
                </h3>
                <p className="text-soft-white/80 text-xs font-semibold tracking-wider uppercase mt-1">
                  {member.title}
                </p>
              </div>
            </div>
            {/* Minimalist hairline under the image */}
            <div className="h-px w-full bg-stone mt-4 opacity-50 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        );
      })}
    </div>
  );
};
