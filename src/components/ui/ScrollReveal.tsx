"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

type RevealVariant = "bounce" | "typewriter" | "blur-word";

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  className?: string;
  delay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = "bounce",
  className = "",
  delay = 0,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px" });
  const shouldReduceMotion = useReducedMotion();

  // Fallback for reduced motion
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  // --- BOUNCE FADE UP ---
  if (variant === "bounce") {
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{
          duration: 0.8,
          delay: delay,
          type: "spring",
          bounce: 0.3,
        }}
      >
        {children}
      </motion.div>
    );
  }

  // --- TYPEWRITER ---
  if (variant === "typewriter") {
    const text = typeof children === "string" ? children : "";
    return (
      <div ref={ref} className={className}>
        {text.split("").map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.05, delay: delay + index * 0.03 }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    );
  }

  // --- BLUR WORD ---
  if (variant === "blur-word") {
    const text = typeof children === "string" ? children : "";
    const words = text.split(" ");
    
    return (
      <div ref={ref} className={className}>
        {words.map((word, index) => (
          <motion.span
            key={index}
            className="inline-block mr-[0.25em]"
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={
              isInView
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: 20, filter: "blur(8px)" }
            }
            transition={{
              duration: 0.6,
              delay: delay + index * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};
