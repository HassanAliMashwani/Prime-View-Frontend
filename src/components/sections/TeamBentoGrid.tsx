"use client";

import { motion, useInView } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, CheckCircle2 } from "lucide-react";
import { TeamMemberProfile } from "@/data/team";

interface TeamBentoGridProps {
  members: TeamMemberProfile[];
}

// Reusable TeamCard Component
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
  onOpenBio?: (member: TeamMemberProfile) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Standardized pill size across all team pages (same as Marketing & Sales Partner)
  const widthClass = "w-full md:w-[25%] max-w-[270px]";
  const mtClass = "mt-0";
  const zClass = "z-10";
  const borderClass = "border border-black/[0.08]";

  // Calculate animation delay
  const getDelay = () => {
    if (isMobile) return index * 0.15;
    return index * 0.12;
  };

  // Auto-Expand this specific card after its entrance animation
  useEffect(() => {
    if (isInView && !isMobile) {
      // Entrance delay + 400ms for a seamless drop-down follow-through
      const timer = setTimeout(() => {
        setIsExpanded(true);
      }, (getDelay() * 1000) + 400);
      return () => clearTimeout(timer);
    }
  }, [isInView, isMobile]);

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        delay: getDelay(), // Dynamic delay based on hierarchy
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      className={`${widthClass} ${mtClass} ${zClass} flex flex-col items-center group`}
    >
      {/* The Card Wrapper (Expands into a pill) */}
      <div
        className={`relative w-full bg-[#FAF9F7] flex flex-col ${borderClass} transition-all duration-700 ease-in-out cursor-pointer p-1.5 shadow-xs hover:shadow-xl rounded-t-[1000px] ${
          isExpanded ? "rounded-b-[1000px] pb-7" : "rounded-b-2xl pb-1.5"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Image Container */}
        <div
          className={`relative w-full aspect-[3/4] bg-[#FAF9F5] overflow-hidden transition-all duration-700 ease-in-out rounded-t-[1000px] ${
            isExpanded ? "rounded-b-[100px]" : "rounded-b-2xl"
          }`}
        >
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
          className={`grid transition-all duration-700 ease-in-out w-full ${
            isExpanded
              ? "grid-rows-[1fr] opacity-100 mt-3.5"
              : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden flex flex-col items-center text-center px-2">
            {/* Fixed-height name container: fits 1-line and 2-line names with identical height */}
            <h3 className="font-display text-[#151914] font-bold text-xs sm:text-sm lg:text-[14px] leading-snug h-10 flex items-center justify-center text-center px-1">
              {member.name}
            </h3>

            <div className="w-6 h-[1px] bg-black/[0.08] my-1.5 shrink-0" />

            {/* Fixed-height role container: keeps identical spacing across all cards */}
            <p className="text-[#6B7462] text-[10px] lg:text-[11px] font-medium leading-tight h-6 flex items-center justify-center text-center px-1">
              {member.role}
            </p>

            {/* Read Bio Link — elegant non-pill text style with animated underline and floating arrow */}
            <div className="h-7 flex items-center justify-center mt-2 shrink-0">
              {member.bioBullets && onOpenBio ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBio(member);
                  }}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#43612B] hover:text-[#1b2b11] transition-colors group cursor-pointer"
                >
                  <span className="relative pb-0.5 border-b-[1.5px] border-[#43612B]/50 group-hover:border-[#43612B] group-hover:border-b-2 transition-all">
                    Read Bio
                  </span>
                  <span className="text-[12px] inline-block transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* External Title Label — uniform height ensures all titles align on the exact same baseline */}
      <motion.div 
        className="mt-4 flex items-center justify-center w-full text-center h-8"
        variants={{
          hidden: { 
            opacity: 0, 
            y: 10
          },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.4,
              delay: getDelay() + 0.15,
              ease: "easeOut"
            }
          }
        }}
      >
        <span className="font-display font-bold text-[#151914] text-[13px] lg:text-[14px] tracking-wide leading-tight">
          {member.title}
        </span>
      </motion.div>
    </motion.div>
  );
};

// Biography Modal Dialog
const BioModal: React.FC<{
  member: TeamMemberProfile | null;
  onClose: () => void;
}> = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FAF9F7] rounded-[28px] border border-black/[0.08] shadow-2xl p-6 sm:p-8 overflow-hidden text-[#151914] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white border border-black/[0.08] hover:bg-black/5 flex items-center justify-center text-[#151914] transition-colors shadow-xs z-10 cursor-pointer"
          aria-label="Close bio modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-7">
          {/* Member Photo & Email below profile pic */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-36 h-48 sm:w-44 sm:h-56 rounded-[22px] overflow-hidden bg-[#FAF9F5] border border-black/[0.08] shadow-md">
              <Image
                src={member.photoPath || "/assets/placeholder.jpg"}
                alt={member.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 150px, 200px"
              />
            </div>

            {/* Email with Gmail SVG below photo */}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] hover:border-[#43612B]/40 text-[#151914] text-xs font-semibold hover:text-[#43612B] transition-all shadow-xs group"
                title={`Send email to ${member.name}`}
              >
                <Image
                  src="/new assests/logos/gmail.svg"
                  alt="Gmail"
                  width={16}
                  height={16}
                  className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"
                />
                <span className="font-mono text-[11px] sm:text-xs">{member.email}</span>
              </a>
            )}
          </div>

          {/* Details & Biography */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#EAF0E7] text-[#43612B] text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-[#43612B]/20">
                {member.title}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#151914] tracking-tight">
                {member.name}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-[#6B7462]">
                {member.role}
              </p>
            </div>

            <div className="w-full h-[1px] bg-black/[0.06]" />

            {member.bio && (
              <p className="font-sans text-xs sm:text-sm text-[#4A5347] leading-relaxed">
                {member.bio}
              </p>
            )}

            {member.bioBullets && member.bioBullets.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#151914] mb-2">
                  Specialized Credentials &amp; Background:
                </p>
                <ul className="space-y-1.5">
                  {member.bioBullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs sm:text-[13px] text-[#2C3529] font-medium leading-snug"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#43612B] shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TeamBentoGrid: React.FC<TeamBentoGridProps> = ({ members }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedBioMember, setSelectedBioMember] = useState<TeamMemberProfile | null>(null);

  // Reference for the auto-scroll magnet effect and in-view detection
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Detects when section crosses the 10% viewport threshold
  const isInView = useInView(sectionRef, { amount: 0.1, once: true });

  // Handle mobile detection for responsive animation logic
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check on mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!members.length) return null;

  if (members.length === 5) {
    const topRow = members.slice(0, 3);
    const bottomRow = members.slice(3, 5);

    return (
      <>
        <motion.div
          ref={sectionRef}
          className="flex flex-col items-center gap-8 sm:gap-10 max-w-7xl mx-auto px-4 sm:px-6 pb-24 h-auto"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Row 1: 3 cards centered */}
          <div className="flex flex-col md:flex-row items-start justify-center gap-4 sm:gap-6 w-full">
            {topRow.map((member, index) => (
              <TeamCard
                key={member.id}
                member={member}
                index={index}
                totalMembers={3}
                isMobile={isMobile}
                isInView={isInView}
                onOpenBio={setSelectedBioMember}
              />
            ))}
          </div>

          {/* Row 2: 2 cards centered below */}
          <div className="flex flex-col md:flex-row items-start justify-center gap-4 sm:gap-6 w-full">
            {bottomRow.map((member, index) => (
              <TeamCard
                key={member.id}
                member={member}
                index={index + 3}
                totalMembers={3}
                isMobile={isMobile}
                isInView={isInView}
                onOpenBio={setSelectedBioMember}
              />
            ))}
          </div>
        </motion.div>

        {/* Bio Modal Dialog */}
        <BioModal
          member={selectedBioMember}
          onClose={() => setSelectedBioMember(null)}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        ref={sectionRef}
        className="flex flex-col md:flex-row items-start justify-center gap-4 sm:gap-6 max-w-7xl mx-auto px-4 sm:px-6 pb-24 h-auto"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {members.map((member, index) => (
          <TeamCard
            key={member.id}
            member={member}
            index={index}
            totalMembers={members.length}
            isMobile={isMobile}
            isInView={isInView}
            onOpenBio={setSelectedBioMember}
          />
        ))}
      </motion.div>

      {/* Bio Modal Dialog */}
      <BioModal
        member={selectedBioMember}
        onClose={() => setSelectedBioMember(null)}
      />
    </>
  );
};
