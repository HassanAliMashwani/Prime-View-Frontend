"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, MapPin, Building2, Users, TreePine, Award } from "lucide-react";

const STATS = [
  { value: "5–20", label: "Marla Plot Options", icon: Building2 },
  { value: "3.5 Yrs", label: "Easy Installments", icon: Award },
  { value: "KPK", label: "Registered Society", icon: ShieldCheck },
  { value: "100%", label: "On-Ground Infra", icon: TreePine },
];

const TRUST_CHIPS = [
  "Registered with Cooperative Societies Dept. KPK",
  "Hazara Division Approved Masterplan",
  "Active GT Road Frontage Access",
  "Legal Team & Managing Committee",
];

export const AboutHeroSection: React.FC = () => {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — Signature Hero: Beige + Blended House Photo
          (mirrors the home-page AboutSection style, expanded)
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#EFE7DA] text-charcoal pt-32 sm:pt-36 pb-14 sm:pb-20 overflow-hidden border-b border-card-border/60">

        {/* ── Blended house image on the right ── */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-7/12 h-full z-0 pointer-events-none">
          <Image
            src="/assets/gallery/luxury-house-about.jpg"
            alt="Modern luxury villa surrounded by lush nature at Prime View Abbottabad"
            fill
            className="object-cover object-center lg:object-right opacity-90"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
          {/* Horizontal fade left-to-right (desktop) */}
          <div
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, #EFE7DA 0%, #EFE7DA 15%, rgba(239,231,218,0.95) 38%, rgba(239,231,218,0.55) 62%, rgba(239,231,218,0.12) 85%, transparent 100%)",
            }}
          />
          {/* Vertical fade for small screens */}
          <div
            className="absolute inset-0 lg:hidden"
            style={{
              background:
                "linear-gradient(to bottom, #EFE7DA 0%, rgba(239,231,218,0.88) 48%, rgba(239,231,218,0.35) 100%)",
            }}
          />
        </div>

        {/* ── Foreground content ── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="max-w-xl lg:max-w-2xl space-y-4">

            {/* Kicker */}
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="kicker block text-xs font-bold tracking-widest text-accent-green uppercase"
            >
              ABOUT PRIME VIEW
            </motion.span>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-charcoal leading-[1.12] tracking-tight"
            >
              A Modern Living Experience{" "}
              <span className="italic font-normal text-charcoal/70">Surrounded by Nature</span>
            </motion.h1>

            {/* Summary copy */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="text-charcoal/75 font-sans text-sm sm:text-base leading-relaxed max-w-lg"
            >
              At Prime View, natural mountain surroundings meet top-notch infrastructure and modern amenities in Abbottabad, supported by convenient installment plans designed to secure your dream home.
            </motion.p>

            {/* Editorial pull quote */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="border-l-[3px] border-accent-green pl-4 py-0.5"
            >
              <blockquote className="font-display italic text-lg sm:text-xl text-charcoal leading-snug">
                &ldquo;Some places are built. Others are felt.&rdquo;
              </blockquote>
            </motion.div>

            {/* Location micro-tag */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-3 text-xs text-charcoal/60 font-medium"
            >
              <MapPin className="w-3.5 h-3.5 text-accent-green shrink-0" />
              <span>Abbottabad, Hazara Division, KPK — Pakistan</span>
              <span className="text-charcoal/20">|</span>
              <span className="font-bold text-charcoal/80">Cooperative Housing Society</span>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36 }}
              className="pt-1 flex flex-wrap gap-3"
            >
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-[#F2BB84] hover:bg-[#EAAA6D] text-[#1E1E1C] font-sans text-sm font-semibold px-6 py-3 rounded-xl shadow-[0_4px_16px_rgba(242,187,132,0.4)] transition-all duration-200 hover:-translate-y-px"
              >
                <span>Book a Plot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/our-plans"
                className="inline-flex items-center gap-2 bg-white/60 hover:bg-white/90 backdrop-blur-sm text-charcoal font-sans text-sm font-semibold px-6 py-3 rounded-xl border border-charcoal/15 transition-all duration-200 hover:-translate-y-px"
              >
                View Plot Plans
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — Stats Rail
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F4F1EA] border-b border-card-border/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex flex-col items-center text-center gap-1 py-4 px-3 rounded-2xl bg-white/60 border border-white/80 shadow-sm"
              >
                <stat.icon className="w-5 h-5 text-accent-green mb-1" />
                <span className="font-display text-2xl sm:text-3xl font-bold text-charcoal">{stat.value}</span>
                <span className="text-[11px] sm:text-xs text-charcoal/55 font-medium">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — Expanded About Narrative (two-col)
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-white text-charcoal py-20 sm:py-28 border-b border-card-border/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Left: Layered photo */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative h-[360px] sm:h-[440px] rounded-3xl overflow-hidden shadow-xl border border-[#E8E1D5]">
                <Image
                  src="/assets/gallery/site-best-pic.jpg"
                  alt="Prime View society site panorama"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Overlay label */}
                <div className="absolute bottom-5 left-5 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/60 shadow-sm">
                  <span className="text-xs font-bold text-charcoal tracking-wider uppercase">Prime View — Masterplan Site</span>
                </div>
              </div>

              {/* Floating accent card */}
              <div className="absolute -bottom-6 -right-4 sm:-right-8 bg-[#F4F1EA] border border-[#E8E1D5] rounded-2xl shadow-lg px-5 py-4 w-44 text-center z-10">
                <span className="block font-display text-3xl font-bold text-charcoal">3.5</span>
                <span className="text-xs text-charcoal/60 font-medium">Years Easy Installment Plan</span>
              </div>
            </motion.div>

            {/* Right: Extended text */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <span className="kicker block text-xs font-bold tracking-widest text-accent-green uppercase">
                WHO WE ARE
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-charcoal font-bold tracking-tight leading-tight">
                A Community Built on Trust, Nature &amp; Modern Living
              </h2>
              <p className="font-sans text-base text-charcoal/70 leading-relaxed">
                Prime View Co-Operative Housing Society is a legally registered society under the Cooperative Societies Department of KPK, situated in the scenic Hazara Division near Abbottabad. Our mission is to provide residents with a secure, peaceful, and fully serviced community away from the noise of the city.
              </p>
              <p className="font-sans text-base text-charcoal/70 leading-relaxed">
                Every plot in Prime View is backed by a formally approved masterplan, active on-ground development, and transparent cooperative governance. We offer flexible 3.5-year installment plans to ensure that owning a dream home in the mountains is within reach for every Pakistani family.
              </p>

              {/* Trust chips */}
              <div className="pt-2 space-y-2.5">
                {TRUST_CHIPS.map((chip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 text-accent-green flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-charcoal/80 font-medium">{chip}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </>
  );
};
