import React from "react";

export const metadata = {
  title: "Phase 2 Visual System Styleguide",
  description: "Color tokens, typography scale, and motion easings for Prime View Housing Society Phase 2",
};

export default function StyleguidePage() {
  return (
    <div className="bg-[#10251E] min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-[#F4F0E7]">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Styleguide Header */}
        <div className="border-b border-[#B29A68]/30 pb-6 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#137547] bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
            Phase 2 System Foundation
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-normal tracking-tight text-[#F4F0E7]">
            Visual System & Design Tokens
          </h1>
          <p className="text-sm text-[#D9D2C5] max-w-xl mx-auto font-sans">
            "A View Worth Building a Life Around." — Single Source of Truth Styleguide
          </p>
        </div>

        {/* 1. Color Palette Tokens */}
        <section className="space-y-4">
          <h2 className="text-xl font-display text-[#F4F0E7] border-b border-[#D9D2C5]/20 pb-2">
            1. Extended Color System
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#10251E] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-full h-16 rounded-lg bg-[#10251E] border border-white/20" />
              <div className="text-xs font-mono">Deep Forest</div>
              <div className="text-[10px] text-gray-400">#10251E (Primary Dark)</div>
            </div>
            <div className="bg-[#1C342B] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-full h-16 rounded-lg bg-[#1C342B]" />
              <div className="text-xs font-mono">Pine</div>
              <div className="text-[10px] text-gray-400">#1C342B (Secondary Dark)</div>
            </div>
            <div className="bg-[#137547] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-full h-16 rounded-lg bg-[#137547]" />
              <div className="text-xs font-mono text-white">Verified Green</div>
              <div className="text-[10px] text-emerald-100">#137547 (Brand Accent)</div>
            </div>
            <div className="bg-[#F4F0E7] text-[#171816] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-full h-16 rounded-lg bg-[#F4F0E7] border border-gray-300" />
              <div className="text-xs font-mono font-bold">Warm Ivory</div>
              <div className="text-[10px] text-gray-600">#F4F0E7 (Light Surface)</div>
            </div>
            <div className="bg-[#D9D2C5] text-[#171816] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-full h-16 rounded-lg bg-[#D9D2C5]" />
              <div className="text-xs font-mono font-bold">Stone</div>
              <div className="text-[10px] text-gray-700">#D9D2C5 (Muted Neutral)</div>
            </div>
            <div className="bg-[#171816] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-full h-16 rounded-lg bg-[#171816] border border-white/20" />
              <div className="text-xs font-mono">Charcoal</div>
              <div className="text-[10px] text-gray-400">#171816 (Text/Dark UI)</div>
            </div>
            <div className="bg-[#B29A68] text-black p-4 rounded-xl border border-white/10 space-y-2">
              <div className="w-full h-16 rounded-lg bg-[#B29A68]" />
              <div className="text-xs font-mono font-bold">Muted Brass</div>
              <div className="text-[10px] text-yellow-950">#B29A68 (Hairline Accent)</div>
            </div>
          </div>
        </section>

        {/* 2. Typography Scale */}
        <section className="space-y-6">
          <h2 className="text-xl font-display text-[#F4F0E7] border-b border-[#D9D2C5]/20 pb-2">
            2. Typography Hierarchy (Display Serif vs Interface Sans)
          </h2>
          <div className="space-y-6 bg-[#1C342B] p-6 rounded-2xl border border-white/10">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#B29A68] block mb-1">
                Display Headline (Playfair Display / Serif) — "Feel This"
              </span>
              <p className="text-3xl sm:text-5xl font-display leading-tight text-[#F4F0E7]">
                "Close to Heaven"
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#B29A68] block mb-1">
                Atmospheric Sub-Headline (Playfair Display)
              </span>
              <p className="text-xl sm:text-2xl font-display italic text-[#D9D2C5]">
                "Some places are built. Others are felt."
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#B29A68] block mb-1">
                Interface Subtitle & Body (Plus Jakarta Sans) — "Here Are The Facts"
              </span>
              <p className="text-sm font-sans text-[#F4F0E7] leading-relaxed max-w-2xl">
                Get Your Dream House Today in Abbottabad. Prime View Co-Operative Housing Society Ltd Hazara Division offers registered residential and commercial plots with 24/7 security and underground utilities.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Surface Light (Warm Ivory) Preview */}
        <section className="space-y-4">
          <h2 className="text-xl font-display text-[#F4F0E7] border-b border-[#D9D2C5]/20 pb-2">
            3. Light Surface Contrast (Paper Reveal Surface)
          </h2>
          <div className="bg-[#F4F0E7] text-[#171816] p-8 rounded-2xl border border-[#D9D2C5] space-y-4 shadow-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#137547]">
              Transition B Preview
            </span>
            <h3 className="text-3xl font-display font-normal text-[#171816]">
              Room to Breathe.
            </h3>
            <p className="text-sm font-sans text-[#171816]/80 leading-relaxed max-w-xl">
              Spacious residential plots surrounded by natural pine valleys and clear mountain skies. Designed for peace, security, and long-term community value.
            </p>
            <button className="bg-[#137547] hover:bg-[#0e5735] text-white font-bold text-xs px-6 py-3 rounded-full transition shadow-md">
              Explore Properties
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
