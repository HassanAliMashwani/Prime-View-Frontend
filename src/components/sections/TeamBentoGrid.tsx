import React from "react";
import Image from "next/image";
import { TeamMemberProfile } from "@/data/team";

interface TeamBentoGridProps {
  members: TeamMemberProfile[];
}

export const TeamBentoGrid: React.FC<TeamBentoGridProps> = ({ members }) => {
  if (!members.length) return null;

  return (
    <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-6 max-w-4xl mx-auto px-4">
      {members.map((member) => {
        return (
          <div 
            key={member.id}
            className="group relative w-full sm:w-48 md:w-52 max-w-[210px] aspect-[3/4] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-100 border border-card-border"
          >
            <Image
              src={member.photoPath || "/assets/placeholder.jpg"}
              alt={member.name}
              fill
              className="transition-transform duration-500 ease-out group-hover:scale-105 object-cover object-top"
              sizes="(max-width: 768px) 190px, 210px"
            />
            
            {/* Subtle Gradient & Info Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 text-center">
              <h3 className="font-display text-white font-bold text-sm leading-tight">
                {member.name}
              </h3>
              <p className="text-emerald-400 text-[11px] font-medium mt-0.5">
                {member.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
