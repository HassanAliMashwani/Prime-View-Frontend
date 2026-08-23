"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface LuxuryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  theme?: "dark" | "light";
  interactive?: boolean;
  className?: string;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({
  children,
  theme = "dark",
  interactive = true,
  className = "",
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const baseStyles =
    "relative rounded-2xl transition-all duration-200 ease-out focus-within:ring-2 focus-within:ring-verified-green focus-within:ring-offset-2";

  const themeStyles =
    theme === "dark"
      ? "bg-pine/70 border border-emerald-500/15 text-warm-ivory backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
      : "bg-white/95 border border-stone/40 text-charcoal shadow-[0_10px_30px_rgba(16,37,30,0.06)]";

  const interactiveStyles = interactive
    ? theme === "dark"
      ? "hover:border-emerald-500/35 hover:bg-pine/90 hover:shadow-[0_14px_35px_rgba(0,0,0,0.35)]"
      : "hover:border-stone hover:shadow-[0_14px_35px_rgba(16,37,30,0.1)]"
    : "";

  return (
    <motion.div
      whileHover={interactive && !shouldReduceMotion ? { y: -3 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`${baseStyles} ${themeStyles} ${interactiveStyles} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
};
