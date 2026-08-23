"use client";

import React from "react";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { LuxuryCard } from "@/components/ui/LuxuryCard";

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
  facebookUrl = "https://facebook.com/primeview.pk",
  twitterUrl = "https://twitter.com/primeviewpk",
  instagramUrl = "https://instagram.com/primeviewpk",
  theme = "dark",
}) => {
  return (
    <LuxuryCard
      theme={theme}
      interactive={true}
      className="p-4 flex flex-col justify-between group overflow-hidden"
    >
      <div>
        {/* Portrait Image Container with subtle watermark */}
        <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-deep-forest/40 border border-emerald-500/20 flex items-center justify-center mb-4">
          {/* Faint Background Crest Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
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
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-300 bg-deep-forest/90 px-3 py-1 rounded border border-emerald-500/30">
                Official Leadership
              </span>
            </div>
          )}

          {/* Role Tag Overlay */}
          <div className="absolute bottom-2.5 left-2.5 z-20">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-300 bg-deep-forest/95 px-2.5 py-1 rounded border border-emerald-500/30">
              {title}
            </span>
          </div>
        </div>

        {/* Member Name & Role */}
        <div className="space-y-1">
          <h3 className="font-display text-base sm:text-lg text-white font-semibold leading-snug group-hover:text-emerald-300 transition-colors duration-200">
            {name}
          </h3>
          <p className="font-sans text-xs text-emerald-400 font-medium">
            {title}
          </p>
          <p className="font-sans text-[11px] text-warm-ivory/60 leading-relaxed truncate">
            {role}
          </p>
        </div>
      </div>

      {/* Card Footer: Email link & Socials */}
      <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between text-xs text-warm-ivory/60">
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-1 hover:text-white transition-colors duration-200 truncate max-w-[65%]"
          title={email}
        >
          <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate text-[11px]">{email}</span>
        </a>

        {/* Social Icons */}
        <div className="flex items-center gap-2 text-warm-ivory/70">
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors duration-200 p-0.5"
            aria-label={`${name} Facebook`}
          >
            <Facebook className="w-3.5 h-3.5 fill-current stroke-none" />
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors duration-200 p-0.5"
            aria-label={`${name} Twitter`}
          >
            <Twitter className="w-3.5 h-3.5 fill-current stroke-none" />
          </a>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors duration-200 p-0.5"
            aria-label={`${name} Instagram`}
          >
            <Instagram className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </LuxuryCard>
  );
};
