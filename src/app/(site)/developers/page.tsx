import React from "react";
import Image from "next/image";
import { TeamBentoGrid } from "@/components/sections/TeamBentoGrid";

export const metadata = {
  title: "Developers - PrimeView Cooperative Housing Society Abt",
  description: "Meet the development team that built the Prime View Cooperative Housing Society website.",
};

export default function DevelopersPage() {
  const devTeamList = [
    {
      id: "dev-1",
      name: "Hassan Ali Mashwani",
      role: "Lead Developer",
      category: "Developers",
      bio: "Spearheading the engineering and architecture of the Prime View platform, ensuring robust backend systems and a seamless, high-performance web experience.",
      imageUrl: "/assets/team/placeholder.jpg",
      socialLinks: []
    },
    {
      id: "dev-2",
      name: "Umer Liaqat",
      role: "Software Engineer",
      category: "Developers",
      bio: "Specializes in building modern interfaces and scalable applications, bringing the vision of Prime View to life through clean code and innovative design.",
      imageUrl: "/assets/team/placeholder.jpg",
      socialLinks: []
    },
    {
      id: "dev-3",
      name: "Taifoor Farid",
      role: "Software Engineer",
      category: "Developers",
      bio: "Focuses on crafting intuitive user experiences and optimizing platform performance to deliver a premium digital environment for all members.",
      imageUrl: "/assets/team/placeholder.jpg",
      socialLinks: []
    },
    {
      id: "dev-4",
      name: "Aalyan Mughal",
      role: "Software Engineer",
      category: "Developers",
      bio: "Drives the development of core features and integrations, ensuring the Prime View portals operate smoothly and securely.",
      imageUrl: "/assets/team/placeholder.jpg",
      socialLinks: []
    }
  ];

  return (
    <div className="bg-[#F8F7F5] text-[#151914] min-h-screen">
      {/* ── HERO HEADER ── */}
      <div className="relative pt-28 sm:pt-36 pb-16 sm:pb-20 lg:pb-24 px-6 sm:px-8 lg:px-12 text-center overflow-hidden w-full">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/new assests/our plan assests/hero background.jpeg?v=2"
            alt="Prime View Developers Hero Background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 45%, rgba(248,247,245,0.7) 80%, #F8F7F5 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight font-bold leading-[1.05] uppercase drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">
            Developers
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] tracking-wide max-w-2xl mx-auto leading-relaxed">
            The Technology & Engineering Team Behind the Prime View Platform
          </p>
        </div>
      </div>

      <div className="pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-6 sm:-mt-8 lg:-mt-10">
        {/* Bento Grid */}
        <TeamBentoGrid members={devTeamList} />
      </div>

    </div>
  );
}
