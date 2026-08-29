import React from "react";
import Image from "next/image";
import { executiveTeamProfiles } from "@/data/team";
import { Mail, Facebook, Twitter } from "lucide-react";

export const TeamWaveSection = () => {
  const team = executiveTeamProfiles.slice(0, 5); // Get the 5 MC members

  return (
    <section className="py-24 sm:py-32 bg-pure-white text-charcoal border-t border-card-border/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16 sm:mb-24 space-y-3">
          <span className="kicker block text-xs font-semibold tracking-widest text-accent-green uppercase">
            MEET THE TEAM
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-charcoal tracking-tight font-bold">
            Our Management
          </h2>
          <p className="text-muted-gray-text text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Dedicated leadership guiding Prime View Co-Operative Housing Society Ltd.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-6 sm:gap-4 md:gap-6 lg:gap-8">
          {team.map((member, idx) => {
            // Wave offset: even index = high (visually lower margin or higher visually), odd index = low
            // In the image, Card 1 starts at normal position, Card 2 is higher up, Card 3 normal, etc.
            // Using -translate-y-8 for odd indices (1, 3) makes them go UP.
            // Using translate-y-8 for even indices (0, 2, 4) makes them go DOWN.
            const isEven = idx % 2 === 0;
            const translateY = isEven ? "sm:translate-y-6 lg:translate-y-10" : "sm:-translate-y-6 lg:-translate-y-10";

            return (
              <div 
                key={member.id} 
                className={`relative w-full sm:w-44 md:w-48 lg:w-48 max-w-[200px] group overflow-hidden rounded-2xl bg-soft-white shadow-sm hover:shadow-xl transition-all duration-300 ${translateY}`}
              >
                {/* Photo Aspect Ratio (tall pill) */}
                <div className="relative aspect-[3/4] w-full bg-gray-100">
                  <Image
                    src={member.photoPath || "/assets/placeholder.jpg"}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Gradient Overlay for Text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Text & Socials Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-3.5 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="font-display text-white font-bold text-sm sm:text-base leading-tight mb-0.5">
                      {member.name}
                    </h3>
                    <p className="text-emerald-400 text-[11px] font-medium mb-2.5">
                      {member.title}
                    </p>
                    
                    {/* Socials */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      <a href={`mailto:${member.email}`} className="text-white hover:text-emerald-400 transition-colors bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-sm">
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                      <a href="#" className="text-white hover:text-emerald-400 transition-colors bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-sm">
                        <Facebook className="w-3.5 h-3.5" />
                      </a>
                      <a href="#" className="text-white hover:text-emerald-400 transition-colors bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-sm">
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
    </section>
  );
};
