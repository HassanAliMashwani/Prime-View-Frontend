import React from "react";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import { Mail } from "lucide-react";

export interface TeamCardProps {
  id: string;
  name: string;
  title: string;
  role: string;
  email: string;
  photoPath: string | null;
  photoDiscovered: boolean;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  theme?: "dark" | "light";
  index?: number;
  staggered?: boolean;
}

export const TeamMemberCard: React.FC<TeamCardProps> = ({
  name,
  title,
  role,
  email,
  photoPath,
  photoDiscovered,
  facebookUrl,
  twitterUrl,
  index = 0,
  staggered = false,
}) => {
  // If staggered is true, we apply a wave offset. For a 3-column layout, index % 3 === 1 (middle item) goes up.
  // Alternatively, just alternating even/odd like before: index % 2 === 0. Let's use index % 2 for a general wave.
  const isEven = index % 2 === 0;
  const translateY = staggered 
    ? (isEven ? "lg:translate-y-6" : "lg:-translate-y-6") 
    : "";

  return (
    <div className={`relative w-full max-w-[210px] mx-auto group overflow-hidden rounded-2xl bg-soft-white shadow-sm hover:shadow-xl transition-all duration-300 ${translateY}`}>
      <div className="relative aspect-[3/4] w-full bg-gray-100">
        <Image
          src={photoDiscovered && photoPath ? photoPath : "/assets/placeholder.jpg"}
          alt={name}
          fill
          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 210px"
        />
        
        {/* Gradient Overlay for Text - Hidden by default, shows on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Text & Socials Overlay - Hidden by default, slides up and shows on hover */}
        <div className="absolute bottom-0 left-0 w-full p-3.5 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <h3 className="font-display text-white font-bold text-sm sm:text-base leading-tight mb-0.5">
            {name}
          </h3>
          <p className="text-emerald-400 text-[11px] sm:text-xs font-medium mb-2.5">
            {title}
          </p>
          
          {/* Socials */}
          <div className="flex items-center gap-1.5 transition-opacity duration-300 delay-100">
            <a href={`mailto:${email}`} className="text-white hover:text-emerald-400 transition-colors bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-sm" title={email}>
              <Mail className="w-3.5 h-3.5" />
            </a>
            <a href={facebookUrl || "#"} className="text-white hover:text-emerald-400 transition-colors bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-sm" title="Facebook">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href={twitterUrl || "#"} className="text-white hover:text-emerald-400 transition-colors bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-sm" title="Twitter">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
