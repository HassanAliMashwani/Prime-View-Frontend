"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, CheckCircle2 } from "lucide-react";
import { TeamMemberProfile } from "@/data/team";

interface TeamBentoGridProps {
  members: TeamMemberProfile[];
}

// Asymmetric Editorial Team Card
const TeamCard = ({
  member,
  index,
  totalMembers,
  isMobile,
  isInView,
  onOpenBio,
}: {
  member: TeamMemberProfile;
  index: number;
  totalMembers: number;
  isMobile: boolean;
  isInView: boolean;
  onOpenBio: (member: TeamMemberProfile) => void;
}) => {
  const getDelay = () => {
    return isMobile ? index * 0.15 : index * 0.12;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 70,
        damping: 15,
        delay: getDelay(),
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      className="w-full relative h-[250px] md:h-[220px] lg:h-[260px] group cursor-pointer flex items-center"
      onClick={() => onOpenBio(member)}
      layoutId={`card-container-${member.id}`}
    >
      {/* Layer 1: Portrait */}
      <motion.div 
        layoutId={`card-image-${member.id}`}
        className="absolute left-0 w-[55%] h-full rounded-2xl md:rounded-[20px] overflow-hidden shadow-lg z-0"
      >
        <Image
          src={member.photoPath || "/assets/placeholder.jpg"}
          alt={member.name}
          fill
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 300px"
        />
        {/* Subtle gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2119]/50 via-transparent to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-20" />
      </motion.div>

      {/* Layer 2: Editorial Information Panel */}
      <motion.div
        layoutId={`card-info-${member.id}`}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] bg-[#F3F0E6] rounded-xl md:rounded-[16px] p-5 md:p-6 shadow-xl border border-[#FAF9F4]/80 z-10 transition-all duration-500 ease-out md:group-hover:translate-x-1.5 group-hover:shadow-2xl overflow-hidden"
      >
        {/* Decorative background element */}
        <svg
          className="absolute right-0 bottom-0 w-32 h-32 text-[#B99A5B] opacity-[0.04] pointer-events-none transform translate-x-8 translate-y-8"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M0,100 L50,0 L100,100 Z" />
        </svg>

        <motion.div layoutId={`card-content-${member.id}`} className="relative z-10 h-full flex flex-col justify-center py-2">
          {/* Name */}
          <h3 className="font-display text-[#0B2119] text-xl md:text-xl lg:text-2xl font-bold leading-tight mt-4 max-w-[90%]">
            {member.name}
          </h3>

          {/* Role */}
          <p 
            className="font-sans text-[#12352A] text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase mt-2 line-clamp-3 lg:line-clamp-4"
            title={member.title}
          >
            {member.title}
          </p>

          {/* Decorative Divider */}
          <div className="w-10 h-[1px] bg-[#B99A5B] my-4 opacity-70" />

          {/* Read Bio Link */}
          <div className="mt-1 flex items-center">
            <span className="inline-flex items-center gap-1.5 text-[#12352A] text-[11px] md:text-xs font-semibold group-hover:text-[#0B2119] transition-colors">
              <span className="border-b border-transparent group-hover:border-[#12352A]/30 pb-0.5 transition-colors">
                Read Bio
              </span>
              <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Expanded Biography State
const BioExpanded = ({
  member,
  onClose,
}: {
  member: TeamMemberProfile;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/40 backdrop-blur-sm cursor-pointer overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-container-${member.id}`}
        className="relative w-full max-w-6xl h-auto flex flex-col md:flex-row bg-[#F3F0E6] rounded-[20px] md:rounded-[24px] overflow-hidden shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 rounded-full bg-white/50 hover:bg-white border border-[#B99A5B]/30 flex items-center justify-center text-[#12352A] transition-colors shadow-sm z-50 cursor-pointer"
          aria-label="Close biography"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Large Portrait */}
        <motion.div 
          layoutId={`card-image-${member.id}`}
          className="w-full md:w-[35%] h-64 md:h-auto md:min-h-[500px] relative shrink-0 z-10"
        >
          <Image
            src={member.photoPath || "/assets/placeholder.jpg"}
            alt={member.name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          {/* Email overlay if exists */}
          {member.email && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-white hover:border-[#B99A5B]/50 text-[#12352A] text-xs font-semibold hover:text-[#0B2119] transition-all shadow-lg group"
                title={`Send email to ${member.name}`}
              >
                <Image
                  src="/new assests/logos/gmail.svg"
                  alt="Gmail"
                  width={16}
                  height={16}
                  className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
                />
                <span className="font-sans tracking-wide">{member.email}</span>
              </a>
            </div>
          )}
        </motion.div>

        {/* Right: Full Information Panel */}
        <motion.div 
          layoutId={`card-info-${member.id}`}
          className="w-full md:w-[65%] bg-[#F3F0E6] flex flex-col relative z-20"
        >
          {/* Subtle decoration */}
          <svg
            className="absolute right-0 bottom-0 w-64 h-64 text-[#B99A5B] opacity-[0.03] pointer-events-none transform translate-x-16 translate-y-16"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <path fill="currentColor" d="M0,100 L50,0 L100,100 Z" />
          </svg>

          <div className="flex-1 p-6 md:p-10 lg:p-12 relative z-10 flex flex-col justify-center">
            <motion.div layoutId={`card-content-${member.id}`}>
              {/* Role Badge */}
              <p className="font-sans text-[#12352A] text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
                {member.title}
              </p>
              
              {/* Name */}
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B2119] mt-2 tracking-tight leading-none">
                {member.name}
              </h2>
              
              {/* Divider */}
              <div className="w-16 h-[2px] bg-[#B99A5B] my-5 md:my-6 opacity-80" />
              
              {/* Full Bio */}
              <p className="font-sans text-[#17221D] text-sm md:text-base leading-relaxed">
                {member.bio || member.role}
              </p>

              {/* Bio Sections */}
              {member.bioSections && member.bioSections.length > 0 && (
                <div className="mt-6 space-y-4">
                  {member.bioSections.map((section, sIdx) => (
                    <div key={sIdx} className="space-y-2">
                      <h4 className="font-display text-[16px] md:text-lg font-bold text-[#0B2119] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B99A5B]" />
                        {section.heading}
                      </h4>
                      <ul className="space-y-1.5 md:space-y-2">
                        {section.bullets.map((bullet, bIdx) => (
                          <li
                            key={bIdx}
                            className="flex items-start gap-3 text-[13px] md:text-[15px] text-[#17221D] font-medium leading-relaxed"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#B99A5B] shrink-0 mt-0.5 md:mt-1" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Bullet Points Fallback */}
              {(!member.bioSections || member.bioSections.length === 0) &&
                member.bioBullets &&
                member.bioBullets.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-display text-[16px] md:text-lg font-bold text-[#0B2119] flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B99A5B]" />
                      Specialized Credentials
                    </h4>
                    <ul className="space-y-1.5 md:space-y-2">
                      {member.bioBullets.map((bullet, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-[13px] md:text-[15px] text-[#17221D] font-medium leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#B99A5B] shrink-0 mt-0.5 md:mt-1" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </motion.div>

            {/* Read Less Link */}
            <div className="mt-8 pt-5 border-t border-[#B99A5B]/20">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 text-[#12352A] text-[13px] font-bold uppercase tracking-wider hover:text-[#0B2119] transition-colors group"
              >
                <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">
                  ←
                </span>
                <span className="border-b border-transparent group-hover:border-[#12352A]/30 pb-0.5 transition-colors">
                  Close Profile
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export const TeamBentoGrid: React.FC<TeamBentoGridProps> = ({ members }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedBioMember, setSelectedBioMember] = useState<TeamMemberProfile | null>(
    null
  );

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.1, once: true });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check on mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!members.length) return null;

  return (
    <>
      <motion.div
        ref={sectionRef}
        className="flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-24 h-auto"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {members.map((member, index) => (
          <div 
            key={member.id} 
            className="w-full max-w-[420px] md:max-w-none md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.7rem)] flex-shrink-0"
          >
            <TeamCard
              member={member}
              index={index}
              totalMembers={members.length}
              isMobile={isMobile}
              isInView={isInView}
              onOpenBio={setSelectedBioMember}
            />
          </div>
        ))}
      </motion.div>

      <AnimatePresence>
        {selectedBioMember && (
          <BioExpanded
            member={selectedBioMember}
            onClose={() => setSelectedBioMember(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
