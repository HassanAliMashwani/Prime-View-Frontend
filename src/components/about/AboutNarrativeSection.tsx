"use client";

import React from "react";
import { motion } from "framer-motion";

const milestones = [
  { year: "2020", title: "Foundation", body: "Registered under the Cooperative Societies Department of KPK, Hazara Division." },
  { year: "2022", title: "Masterplan Approved", body: "Official government approval received, mapping roads, blocks, mosques, parks & utilities." },
  { year: "2023", title: "On-Ground Development", body: "Carpeted roads, sewerage, boundary walls & utility connections installed." },
  { year: "2024", title: "Community Growth", body: "Hundreds of plot owners joined; transparent reporting built lasting trust." },
  { year: "2025+", title: "The Vision Ahead", body: "Mosque inauguration, park development & full possession — Abbottabad's premier community." },
];

export const AboutNarrativeSection: React.FC = () => {
  return (
    <section className="py-14 sm:py-16 bg-white border-b border-card-border/60 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <div className="mb-8">
          <span className="kicker block text-xs font-bold tracking-widest text-accent-green uppercase mb-2">
            OUR STORY
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-charcoal font-bold tracking-tight">
            Our Narrative
          </h2>
        </div>

        {/* Timeline — horizontal on desktop, vertical on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {milestones.map((m, i) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="relative bg-[#F4F1EA] rounded-2xl border border-[#E8E1D5] p-4 flex flex-col gap-1.5"
            >
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-accent-green bg-white border border-accent-green/20 px-2.5 py-0.5 rounded-full w-fit">
                {m.year}
              </span>
              <h3 className="font-display text-sm font-bold text-charcoal leading-snug">{m.title}</h3>
              <p className="font-sans text-xs text-charcoal/60 leading-relaxed">{m.body}</p>
              {/* Connector dot */}
              {i < milestones.length - 1 && (
                <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent-green/20 border-2 border-accent-green/40 z-10" />
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
