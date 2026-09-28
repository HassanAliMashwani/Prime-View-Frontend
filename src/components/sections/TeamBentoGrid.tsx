"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  Mail,
  Users,
  Stethoscope,
  Building2,
  Settings,
  Scale,
  Briefcase,
  Shield,
  Award,
  Crown,
  Factory,
  BookOpen,
  Newspaper,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { TeamMemberProfile, LeadershipMember } from "@/data/team";

interface TeamBentoGridProps {
  members: TeamMemberProfile[];
}

// Top-Left 8-Pointed Star Mark (Matching Reference Image 1)
const GeometricFloralMark = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 8-pointed star with sharp tips */}
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * 45 * Math.PI) / 180;
      const aMid = ((i * 45 + 22.5) * Math.PI) / 180;
      const xTip = Number((50 + 44 * Math.cos(a)).toFixed(2));
      const yTip = Number((50 + 44 * Math.sin(a)).toFixed(2));
      const xValley = Number((50 + 29 * Math.cos(aMid)).toFixed(2));
      const yValley = Number((50 + 29 * Math.sin(aMid)).toFixed(2));
      const aNext = (((i + 1) * 45) * Math.PI) / 180;
      const xNextTip = Number((50 + 44 * Math.cos(aNext)).toFixed(2));
      const yNextTip = Number((50 + 44 * Math.sin(aNext)).toFixed(2));
      return (
        <g key={i}>
          <line x1={xTip} y1={yTip} x2={xValley} y2={yValley} />
          <line x1={xValley} y1={yValley} x2={xNextTip} y2={yNextTip} />
          <line x1="50" y1="50" x2={xTip} y2={yTip} opacity="0.35" />
        </g>
      );
    })}
    {/* Interlocking squares (Octagram) */}
    <rect x="29" y="29" width="42" height="42" strokeWidth="1.2" />
    <rect
      x="29"
      y="29"
      width="42"
      height="42"
      strokeWidth="1.2"
      transform="rotate(45 50 50)"
    />
    {/* Concentric circles */}
    <circle cx="50" cy="50" r="16" strokeWidth="1.1" />
    <circle cx="50" cy="50" r="7" strokeWidth="1.1" />
    {/* Cross spokes inside circle */}
    <line x1="50" y1="34" x2="50" y2="66" opacity="0.45" />
    <line x1="34" y1="50" x2="66" y2="50" opacity="0.45" />
  </svg>
);

// Bottom-Right Mughal Floral Rosette Tile Motif (Matching Reference Image 2)
const MughalRosetteMark = ({ className = "w-48 h-48" }: { className?: string }) => (
  <svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 8 Outer Mughal Ogee Petals */}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const angleLeft = ((i * 45 - 22.5) * Math.PI) / 180;
      const angleRight = ((i * 45 + 22.5) * Math.PI) / 180;
      const angleCtrlL = ((i * 45 - 11) * Math.PI) / 180;
      const angleCtrlR = ((i * 45 + 11) * Math.PI) / 180;

      // Tip of outer petal
      const xTip = (100 + 88 * Math.cos(angle)).toFixed(2);
      const yTip = (100 + 88 * Math.sin(angle)).toFixed(2);

      // Base valleys
      const xBaseL = (100 + 52 * Math.cos(angleLeft)).toFixed(2);
      const yBaseL = (100 + 52 * Math.sin(angleLeft)).toFixed(2);
      const xBaseR = (100 + 52 * Math.cos(angleRight)).toFixed(2);
      const yBaseR = (100 + 52 * Math.sin(angleRight)).toFixed(2);

      // Ogee bulge control points
      const xCtrlL = (100 + 82 * Math.cos(angleCtrlL)).toFixed(2);
      const yCtrlL = (100 + 82 * Math.sin(angleCtrlL)).toFixed(2);
      const xCtrlR = (100 + 82 * Math.cos(angleCtrlR)).toFixed(2);
      const yCtrlR = (100 + 82 * Math.sin(angleCtrlR)).toFixed(2);

      // Inner petal leaf contour
      const xInTip = (100 + 72 * Math.cos(angle)).toFixed(2);
      const yInTip = (100 + 72 * Math.sin(angle)).toFixed(2);
      const xInBaseL = (100 + 44 * Math.cos(angleLeft)).toFixed(2);
      const yInBaseL = (100 + 44 * Math.sin(angleLeft)).toFixed(2);
      const xInBaseR = (100 + 44 * Math.cos(angleRight)).toFixed(2);
      const yInBaseR = (100 + 44 * Math.sin(angleRight)).toFixed(2);
      const xInCtrlL = (100 + 66 * Math.cos(angleCtrlL)).toFixed(2);
      const yInCtrlL = (100 + 66 * Math.sin(angleCtrlL)).toFixed(2);
      const xInCtrlR = (100 + 66 * Math.cos(angleCtrlR)).toFixed(2);
      const yInCtrlR = (100 + 66 * Math.sin(angleCtrlR)).toFixed(2);

      return (
        <g key={i}>
          {/* Outer Ogee Petal */}
          <path
            d={`M ${xBaseL} ${yBaseL} Q ${xCtrlL} ${yCtrlL} ${xTip} ${yTip} Q ${xCtrlR} ${yCtrlR} ${xBaseR} ${yBaseR}`}
          />
          {/* Inner Petal Leaf Motif */}
          <path
            d={`M ${xInBaseL} ${yInBaseL} Q ${xInCtrlL} ${yInCtrlL} ${xInTip} ${yInTip} Q ${xInCtrlR} ${yInCtrlR} ${xInBaseR} ${yInBaseR}`}
            opacity="0.8"
          />
          {/* Connecting bracket line */}
          <path
            d={`M ${xBaseL} ${yBaseL} L ${xInBaseL} ${yInBaseL}`}
            opacity="0.6"
          />
        </g>
      );
    })}

    {/* Intersecting Concentric Squares (Octagram) */}
    <rect x="62" y="62" width="76" height="76" strokeWidth="1.4" />
    <rect
      x="62"
      y="62"
      width="76"
      height="76"
      strokeWidth="1.4"
      transform="rotate(45 100 100)"
    />

    {/* Inner Octagram */}
    <rect x="74" y="74" width="52" height="52" strokeWidth="1.2" opacity="0.85" />
    <rect
      x="74"
      y="74"
      width="52"
      height="52"
      strokeWidth="1.2"
      opacity="0.85"
      transform="rotate(45 100 100)"
    />

    {/* Center Concentric Circles */}
    <circle cx="100" cy="100" r="22" strokeWidth="1.2" opacity="0.75" />
    <circle cx="100" cy="100" r="10" strokeWidth="1.2" />

    {/* 8 Radial Spokes */}
    {Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      const x1 = (100 + 10 * Math.cos(angle)).toFixed(2);
      const y1 = (100 + 10 * Math.sin(angle)).toFixed(2);
      const x2 = (100 + 36 * Math.cos(angle)).toFixed(2);
      const y2 = (100 + 36 * Math.sin(angle)).toFixed(2);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity="0.6" />;
    })}
  </svg>
);

// Mountain Ridge Line Backdrop
const MountainBackdrop = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 700 420"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMax slice"
  >
    {/* Distant soft mountain silhouette */}
    <path
      d="M0 240 L45 205 L95 225 L165 175 L235 220 L315 155 L385 205 L455 135 L530 185 L605 125 L675 160 L700 150 L700 420 L0 420 Z"
      fill="currentColor"
      opacity="0.32"
    />
    {/* Midground mountain silhouette */}
    <path
      d="M0 270 Q55 225 120 245 T255 205 T395 235 T525 175 T645 205 L700 195 L700 420 L0 420 Z"
      fill="currentColor"
      opacity="0.45"
    />
    {/* Foreground rolling ridge */}
    <path
      d="M20 310 Q110 265 200 285 T370 245 T540 265 T660 225 L700 235 L700 420 L0 420 Z"
      fill="currentColor"
      opacity="0.55"
    />
    {/* Primary ridge contour lines */}
    <path
      d="M0 240 L45 205 L95 225 L165 175 L235 220 L315 155 L385 205 L455 135 L530 185 L605 125 L675 160 L700 150"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M0 270 Q55 225 120 245 T255 205 T395 235 T525 175 T645 205 L700 195"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M20 310 Q110 265 200 285 T370 245 T540 265 T660 225 L700 235"
      stroke="currentColor"
      strokeWidth="1.1"
    />
    {/* Crag & ravine hatch lines */}
    <path
      d="M165 175 L190 235 M315 155 L345 215 M455 135 L490 210 M605 125 L595 195 M235 220 L270 265 M385 205 L420 250"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="3 3"
      opacity="0.75"
    />
  </svg>
);

// Helper for highlight icons
const getHighlightIcon = (text: string, index: number, memberName?: string) => {
  const lower = text.toLowerCase();
  const name = (memberName || "").toLowerCase();
  const iconProps = { className: "w-3.5 h-3.5 text-[#A6843D] stroke-[1.5]" };

  // 1. Doctor / Medical Icon — STRICTLY and ONLY for Dr. Roman Gul
  const isDrRoman = name.includes("roman") || name.includes("gul");
  if (
    isDrRoman &&
    (lower.includes("medical") ||
      lower.includes("doctor") ||
      lower.includes("curative") ||
      lower.includes("health"))
  ) {
    return <Stethoscope {...iconProps} />;
  }

  // 2. Concrete, Construction Materials, Industry (Chaudhary Mohsin Azad — Chairman Perfect Concrete Solutions)
  if (
    lower.includes("concrete") ||
    lower.includes("material") ||
    lower.includes("industry") ||
    lower.includes("factory")
  ) {
    return <Factory {...iconProps} />;
  }

  // 3. Track Record, Years of Experience, Project Delivery (Chaudhary Mohsin Azad — 26 years of experience)
  if (
    lower.includes("experience") ||
    lower.includes("built several") ||
    lower.includes("projects with") ||
    lower.includes("landmark") ||
    lower.includes("award") ||
    lower.includes("distinction")
  ) {
    return <Award {...iconProps} />;
  }

  // 4. Housing Society Chairman / President Leadership (e.g. Chairman — Prime View Housing Society)
  if (
    lower.includes("chairman — prime view") ||
    lower.includes("president — prime view") ||
    lower.includes("chairman") ||
    lower.includes("president")
  ) {
    return <Crown {...iconProps} />;
  }

  // 5. Corporate Groups, Directors (Chaudhary Mohsin Azad — Group Director J7 Group)
  if (
    lower.includes("j7") ||
    lower.includes("group director") ||
    lower.includes("director")
  ) {
    return <Building2 {...iconProps} />;
  }

  // 6. CEO, Builders & Developers, Executive Business (Chaudhary Mohsin Azad — CEO Nexus Builders)
  if (
    lower.includes("ceo") ||
    lower.includes("builder") ||
    lower.includes("developer") ||
    lower.includes("construction") ||
    lower.includes("managing director") ||
    lower.includes("businessman")
  ) {
    return <Briefcase {...iconProps} />;
  }

  // 7. Publications, News, Media, Education (Ahmed Nawaz Khan Jadoon)
  if (lower.includes("publication") || lower.includes("dost") || lower.includes("book")) {
    return <BookOpen {...iconProps} />;
  }
  if (
    lower.includes("news") ||
    lower.includes("newspaper") ||
    lower.includes("publisher") ||
    lower.includes("editor") ||
    lower.includes("media")
  ) {
    return <Newspaper {...iconProps} />;
  }
  if (
    lower.includes("school") ||
    lower.includes("education") ||
    lower.includes("academic") ||
    lower.includes("university")
  ) {
    return <GraduationCap {...iconProps} />;
  }

  // 8. Secretary, Housing Society, Community, Social & Political Governance
  if (
    lower.includes("secretary") ||
    lower.includes("society") ||
    lower.includes("community") ||
    lower.includes("social") ||
    lower.includes("party") ||
    lower.includes("qwp") ||
    lower.includes("candidate")
  ) {
    return <Users {...iconProps} />;
  }

  // 9. Operations, Management, Planning (Qazi Safeer Hashmi Qureshi)
  if (
    lower.includes("governance") ||
    lower.includes("management") ||
    lower.includes("operation") ||
    lower.includes("planning")
  ) {
    return <Settings {...iconProps} />;
  }

  // 10. Legal, Court, Counsel, Advocate, Justice (Legal team)
  if (
    lower.includes("legal") ||
    lower.includes("court") ||
    lower.includes("advocate") ||
    lower.includes("counsel") ||
    lower.includes("justice") ||
    lower.includes("judge") ||
    lower.includes("law")
  ) {
    return <Scale {...iconProps} />;
  }

  // 11. Tactical, Military, Sky Diver, Deep Sea Diver, Submarine (Liaqat Khan Jadoon)
  if (
    lower.includes("diver") ||
    lower.includes("sky") ||
    lower.includes("special operations") ||
    lower.includes("submarine") ||
    lower.includes("safeties") ||
    lower.includes("damage control")
  ) {
    return <Shield {...iconProps} />;
  }

  // Fallback icons — Notice: completely free of Stethoscope / doctor icons
  const fallbacks = [
    <Briefcase key="0" {...iconProps} />,
    <Building2 key="1" {...iconProps} />,
    <Award key="2" {...iconProps} />,
    <Users key="3" {...iconProps} />,
    <CheckCircle2 key="4" {...iconProps} />,
  ];
  return fallbacks[index % fallbacks.length];
};

// Helper to extract clean highlights
const getMemberHighlights = (member: TeamMemberProfile): string[] => {
  if (member.bioBullets && member.bioBullets.length > 0) {
    return member.bioBullets;
  }
  if (member.bioSections && member.bioSections.length > 0) {
    return member.bioSections.flatMap((s) => s.bullets);
  }
  if (member.role) {
    return member.role
      .split(/[,|/•]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// Closed Team Card
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
  const getDelay = () => (isMobile ? index * 0.15 : index * 0.12);

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
    >
      {/* Layer 1: Portrait */}
      <div className="absolute left-0 w-[55%] h-full rounded-2xl md:rounded-[20px] overflow-hidden shadow-lg z-0">
        <Image
          src={member.photoPath || "/assets/placeholder.jpg"}
          alt={member.name}
          fill
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 300px"
        />
        {/* Subtle gradient for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2119]/50 via-transparent to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-20" />
      </div>

      {/* Layer 2: Cream Editorial Information Panel (Rock-solid vertical centering via box-model auto margins) */}
      <div
        className="absolute right-0 top-0 bottom-0 my-auto h-fit w-[55%] bg-[#F6F3EA] rounded-xl md:rounded-[16px] p-5 md:p-6 shadow-xl border border-[#E4DCC8] z-10 transition-transform duration-300 ease-out md:group-hover:translate-x-1.5 group-hover:shadow-2xl overflow-hidden"
      >
        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 text-[#C4A265] opacity-[0.05] pointer-events-none transform translate-x-6 translate-y-6">
          <GeometricFloralMark className="w-28 h-28" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center py-2">
          {/* Role / Title in Gold Outfit */}
          <p
            className="text-[9px] md:text-[10px] font-semibold tracking-[0.2em] uppercase text-[#A6843D]"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            title={member.title}
          >
            {member.title}
          </p>

          {/* Name in Serif Cormorant */}
          <h3
            className="text-xl md:text-xl lg:text-2xl font-semibold leading-tight text-[#1C3D32] mt-2 max-w-[95%]"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
              lineHeight: 1.1,
            }}
          >
            {member.name}
          </h3>

          {/* Decorative Divider */}
          <div className="w-8 h-[1px] bg-[#C4A265] my-3.5 opacity-60" />

          {/* Read Bio Control */}
          <div className="flex items-center">
            <span
              className="inline-flex items-center gap-1.5 text-[#1C3D32] text-[11px] md:text-xs font-semibold group-hover:text-[#A6843D] transition-colors"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              <span className="border-b border-transparent group-hover:border-[#A6843D]/40 pb-0.5 transition-colors">
                Read Bio
              </span>
              <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Expanded Biography State — Compact Modal Panel matching reference specification
const BioExpanded = ({
  member,
  onClose,
}: {
  member: TeamMemberProfile;
  onClose: () => void;
}) => {
  const highlights = getMemberHighlights(member);

  // Close on Escape key, lock body scroll, and hide WhatsApp FAB
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("leadership-modal-open");
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("leadership-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/65 backdrop-blur-sm cursor-pointer overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 320 }}
        className="relative w-full max-w-[780px] lg:max-w-[800px] bg-[#F6F3EA] rounded-[22px] border border-[#E4DCC8] shadow-[0_24px_60px_rgba(20,28,24,0.22)] overflow-hidden flex flex-col md:flex-row cursor-default z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Plain × Close Button in Top-Right Corner */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-3.5 md:right-3.5 w-7 h-7 rounded-full border border-[#E4DCC8] hover:border-[#C4A265] bg-[#F6F3EA]/90 hover:bg-[#F6F3EA] flex items-center justify-center text-[#1C3D32] transition-colors shadow-sm z-40 cursor-pointer"
          aria-label="Close profile"
        >
          <X className="w-3.5 h-3.5 stroke-[1.6]" />
        </button>

        {/* ── LEFT COLUMN (Portrait: 38% desktop, full width mobile) ── */}
        <div
          className="w-full md:w-[38%] relative self-stretch min-h-[280px] md:min-h-[440px] shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-[#C4A265] bg-[#F6F3EA]"
        >
          {/* Portrait Photo */}
          <Image
            src={member.photoPath || "/assets/placeholder.jpg"}
            alt={member.name}
            fill
            priority
            className="object-cover object-[center_15%]"
            sizes="(max-width: 768px) 100vw, 340px"
          />

          {/* Geometric Floral Mark in Top-Left Corner (at ~40% opacity) */}
          <div className="absolute top-3.5 left-3.5 md:top-4 md:left-4 pointer-events-none z-10 text-[#C4A265] opacity-40">
            <GeometricFloralMark className="w-12 h-12" />
          </div>

          {/* Email Pill: white/ivory pill centered across bottom */}
          {member.email && (
            <div className="absolute bottom-3.5 left-0 right-0 flex justify-center z-20 px-2 pointer-events-none">
              <a
                href={`mailto:${member.email}`}
                className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-sm border-[1.5px] border-[#C4A265] shadow-md hover:bg-white hover:shadow-lg transition-all group shrink-0"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                <Mail className="w-3.5 h-3.5 text-[#A6843D] shrink-0 stroke-[1.8] group-hover:scale-110 transition-transform" />
                <span className="text-[11.5px] sm:text-[12px] font-medium text-[#1C3D32] leading-none tracking-tight whitespace-nowrap">
                  {member.email}
                </span>
              </a>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (Text: 62% desktop) ── */}
        <div
          className="w-full md:w-[62%] relative bg-[#F6F3EA] flex flex-col justify-between p-5 sm:p-6 md:p-[26px_30px] overflow-hidden"
        >
          {/* Real Photographic Mountain Landscape behind text blended into beige */}
          <div className="absolute right-0 bottom-0 w-full h-[85%] pointer-events-none select-none overflow-hidden z-0">
            <Image
              src="/new assests/our plan assests/hero background.jpeg"
              alt="Mountain Landscape"
              fill
              className="object-cover object-[88%_12%] opacity-[0.22] mix-blend-multiply"
              style={{
                filter:
                  "grayscale(100%) sepia(55%) brightness(1.02) contrast(1.05)",
                WebkitMaskImage:
                  "radial-gradient(ellipse at 85% 65%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 80%)",
                maskImage:
                  "radial-gradient(ellipse at 85% 65%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 80%)",
              }}
            />
          </div>

          {/* Content Wrapper */}
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              {/* 1. Title in Outfit, 10.5px, uppercase, letter-spacing 0.22em, color #A6843D */}
              <p
                className="text-[10px] md:text-[10.5px] uppercase font-semibold text-[#A6843D]"
                style={{
                  fontFamily: "var(--font-outfit), Outfit, sans-serif",
                  letterSpacing: "0.22em",
                }}
              >
                {member.title}
              </p>

              {/* 2. Name in Cormorant Garamond, weight 600, line-height 1.05, color #1C3D32 */}
              <h2
                className="text-[28px] sm:text-[32px] md:text-[35px] font-semibold text-[#1C3D32] mt-1 mb-2 tracking-tight leading-[1.05]"
                style={{
                  fontFamily:
                    "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  lineHeight: 1.05,
                }}
              >
                {member.name}
              </h2>

              {/* 3. Full bio in Outfit, 13.5px, line-height 1.6, color #5E6862 */}
              <p
                className="text-[13px] md:text-[13.5px] text-[#5E6862] mb-3.5 leading-[1.6]"
                style={{
                  fontFamily: "var(--font-outfit), Outfit, sans-serif",
                  maxWidth: "54ch",
                }}
              >
                {member.bio || member.role}
              </p>

              {/* 4. A gold diamond ◆ then “Leadership & Service” in Cormorant Garamond */}
              <div className="flex items-center gap-2 mb-2.5 md:mb-3">
                <span className="text-[#C4A265] text-xs leading-none select-none">
                  ◆
                </span>
                <h3
                  className="text-[17px] md:text-[18px] text-[#1C3D32] font-semibold leading-none"
                  style={{
                    fontFamily:
                      "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                    fontWeight: 600,
                  }}
                >
                  Leadership &amp; Service
                </h3>
              </div>

              {/* 5. Member’s highlights: 24px circle, 1px #C4A265 outline, simple line icon, Outfit 13px, #3E4A44 */}
              {highlights.length > 0 && (
                <div className="space-y-[9px] mb-4 md:mb-5">
                  {highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-[24px] h-[24px] min-w-[24px] min-h-[24px] rounded-full border border-[#C4A265] flex items-center justify-center text-[#A6843D] shrink-0">
                        {getHighlightIcon(highlight, idx, member.name)}
                      </div>
                      <span
                        className="text-[12.5px] md:text-[13px] text-[#3E4A44] leading-snug"
                        style={{
                          fontFamily: "var(--font-outfit), Outfit, sans-serif",
                        }}
                      >
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Bottom: Divider line & CLOSE PROFILE in Outfit */}
            <div className="pt-2 mt-auto">
              <div className="w-full h-[1px] bg-[#E4DCC8] mb-3 opacity-60" />
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 text-[11px] uppercase font-semibold text-[#1C3D32] hover:opacity-75 transition-opacity group cursor-pointer"
                style={{
                  fontFamily: "var(--font-outfit), Outfit, sans-serif",
                  letterSpacing: "0.18em",
                }}
              >
                <span className="text-[13px] transition-transform duration-200 group-hover:-translate-x-1">
                  ←
                </span>
                <span>CLOSE PROFILE</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const TeamBentoGrid: React.FC<TeamBentoGridProps> = ({ members }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedBioMember, setSelectedBioMember] = useState<TeamMemberProfile | null>(
    null
  );

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.1, once: true });

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
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

      {mounted &&
        createPortal(
          <AnimatePresence>
            {selectedBioMember && (
              <BioExpanded
                member={selectedBioMember}
                onClose={() => setSelectedBioMember(null)}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
export type { LeadershipMember };
