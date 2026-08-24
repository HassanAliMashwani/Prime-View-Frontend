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
}

export const TeamMemberCard: React.FC<TeamCardProps> = ({
  name,
  title,
  role,
  email,
  photoPath,
  photoDiscovered,
}) => {
  return (
    <div className="bg-pure-white p-4 rounded-2xl border border-card-border flex flex-col justify-between group hover:border-secondary-border hover:shadow-xs transition-colors duration-150 overflow-hidden">
      <div>
        {/* Portrait Image Container */}
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-soft-white border border-card-border/70 flex items-center justify-center mb-4">
          {/* Faint Background Crest Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
            <Image
              src={siteConfig.logoPath}
              alt="Crest Watermark"
              width={160}
              height={160}
              className="object-contain filter grayscale"
            />
          </div>

          {photoDiscovered && photoPath ? (
            <Image
              src={photoPath}
              alt={name}
              fill
              className="object-cover object-top transition-transform duration-300 ease-out group-hover:scale-102"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-accent-green bg-green-tint-bg px-3 py-1 rounded-full border border-accent-green/20">
                Official Leadership
              </span>
            </div>
          )}

          {/* Role Tag Overlay */}
          <div className="absolute bottom-2.5 left-2.5 z-20">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-charcoal bg-pure-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-card-border shadow-xs">
              {title}
            </span>
          </div>
        </div>

        {/* Member Name & Role */}
        <div className="space-y-1">
          <h3 className="font-display text-base sm:text-lg text-charcoal font-semibold leading-snug group-hover:text-accent-green transition-colors duration-150">
            {name}
          </h3>
          <p className="font-sans text-xs text-accent-green font-medium">
            {title}
          </p>
          <p className="font-sans text-[11px] text-muted-gray-text leading-relaxed truncate">
            {role}
          </p>
        </div>
      </div>

      {/* Card Footer: Email link */}
      <div className="mt-4 pt-3 border-t border-card-border/60 flex items-center justify-between text-xs text-muted-gray-text">
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-1.5 hover:text-accent-green transition-colors duration-150 truncate max-w-[80%]"
          title={email}
        >
          <Mail className="w-3.5 h-3.5 text-accent-green shrink-0" />
          <span className="truncate">{email}</span>
        </a>
      </div>
    </div>
  );
};
