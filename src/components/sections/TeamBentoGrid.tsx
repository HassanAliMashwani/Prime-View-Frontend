"use client";

import { motion, useInView } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
}: {
  member: TeamMemberProfile;
  index: number;
  totalMembers: number;
  isMobile: boolean;
  isInView: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  let widthClass = "w-full md:w-[22%]";
  let mtClass = "mt-0";
  let zClass = "z-10";
  let borderClass = "border border-charcoal/20";

  // Calculate layout widths and margins
  if (totalMembers === 5) {
    switch (index) {
      case 0:
        widthClass = "w-full md:w-[19%]";
        mtClass = "md:mt-[8%]";
        break;
      case 1:
        widthClass = "w-full md:w-[21%]";
        mtClass = "md:mt-[5.3%]";
        break;
      case 2:
        widthClass = "w-full md:w-[25%]";
        mtClass = "md:mt-0";
        zClass = "z-30";
        break;
      case 3:
        widthClass = "w-full md:w-[21%]";
        mtClass = "md:mt-[5.3%]";
        break;
      case 4:
        widthClass = "w-full md:w-[19%]";
        mtClass = "md:mt-[8%]";
        break;
    }
  } else if (totalMembers === 3) {
    switch (index) {
      case 0:
        widthClass = "w-full md:w-[26%]";
        mtClass = "md:mt-0";
        zClass = "z-30";
        break;
      case 1:
        widthClass = "w-full md:w-[22%]";
        mtClass = "md:mt-[5.3%]";
        break;
      case 2:
        widthClass = "w-full md:w-[18%]";
        mtClass = "md:mt-[10.6%]";
        break;
    }
  } else if (totalMembers === 2) {
    switch (index) {
      case 0:
        widthClass = "w-full md:w-[25%]";
        mtClass = "md:mt-0";
        zClass = "z-30";
        break;
      case 1:
        widthClass = "w-full md:w-[22%]";
        mtClass = "md:mt-[4%]";
        break;
    }
  }

  // Calculate animation delay
  // Center-Out for 5 members on desktop, Left-to-Right otherwise
  const getDelay = () => {
    if (isMobile) return index * 0.15;
    if (totalMembers === 5) return Math.abs(index - 2) * 0.15;
    return index * 0.15;
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
        className={`relative w-full bg-white flex flex-col ${borderClass} transition-all duration-700 ease-in-out cursor-pointer p-1.5 shadow-sm hover:shadow-xl rounded-t-[1000px] ${
          isExpanded ? "rounded-b-[1000px] pb-8" : "rounded-b-2xl pb-1.5"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Image Container */}
        <div
          className={`relative w-full aspect-[3/4] bg-[#FAF9F7] overflow-hidden transition-all duration-700 ease-in-out rounded-t-[1000px] ${
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
              ? "grid-rows-[1fr] opacity-100 mt-4"
              : "grid-rows-[0fr] opacity-0 mt-0"
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
              <a
                href={member.facebookUrl || "https://facebook.com/PrimeviewAbbottabad"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-7 h-7 border border-stone/30 hover:border-verified-green/40 transition-colors rounded-full"
                aria-label="Facebook"
              >
                <Image
                  src="/new assests/logos/facebook.svg"
                  alt="Facebook"
                  width={10}
                  height={10}
                  className="w-2.5 h-2.5 object-contain"
                />
              </a>
              <a
                href={member.twitterUrl || "https://x.com/PrimeViewHousingHazara"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-7 h-7 border border-stone/30 hover:border-verified-green/40 transition-colors rounded-full"
                aria-label="X (formerly Twitter)"
              >
                <Image
                  src="/new assests/logos/x-formerly-twitter.svg"
                  alt="X"
                  width={10}
                  height={10}
                  className="w-2.5 h-2.5 object-contain invert"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* External Title Label */}
      <motion.div 
        className="mt-4 flex justify-center w-full text-center"
        variants={{
          hidden: { 
            opacity: 0, 
            scale: (!isMobile && totalMembers === 5) ? 0.8 : 1,
            x: (!isMobile && totalMembers === 5) ? 0 : -20
          },
          visible: {
            opacity: 1,
            scale: 1,
            x: 0,
            transition: {
              duration: 0.5,
              delay: getDelay() + 0.2, // Offset by 0.2s after card
              ease: "easeOut"
            }
          }
        }}
      >
        <span className="font-display font-bold text-charcoal text-[13px] lg:text-[15px] tracking-wide">
          {member.title}
        </span>
      </motion.div>
    </motion.div>
  );
};

export const TeamBentoGrid: React.FC<TeamBentoGridProps> = ({ members }) => {
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <motion.div
      ref={sectionRef}
      className="flex flex-col md:flex-row items-start justify-center gap-3 md:gap-4 max-w-7xl mx-auto px-4 sm:px-6 pb-24 h-auto"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      // We don't use staggerChildren directly because we need custom center-out delays for the 5-member layout,
      // so delays are handled individually in the TeamCard component variants.
    >
      {members.map((member, index) => (
        <TeamCard
          key={member.id}
          member={member}
          index={index}
          totalMembers={members.length}
          isMobile={isMobile}
          isInView={isInView}
        />
      ))}
    </motion.div>
  );
};
