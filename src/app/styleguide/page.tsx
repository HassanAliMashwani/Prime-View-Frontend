import React from "react";

export const metadata = {
  title: "Phase 2 Rev. 3 Visual System Styleguide",
  description: "Color tokens, typography scale, and static-first architecture for Prime View Housing Society Phase 2 Rev. 3",
};

export default function StyleguidePage() {
  return (
    <div className="bg-pure-white min-h-screen py-16 px-4 sm:px-6 lg:px-8 text-charcoal">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Styleguide Header */}
        <div className="border-b border-card-border pb-6 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent-green bg-green-tint-bg px-3 py-1 rounded-full border border-accent-green/20">
            Phase 2 Rev. 3 Design System
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-normal tracking-tight text-charcoal">
            Visual System &amp; Design Tokens
          </h1>
          <p className="text-sm text-muted-gray-text max-w-xl mx-auto font-sans">
            &ldquo;A View Worth Building a Life Around.&rdquo; — Single Source of Truth Styleguide
          </p>
        </div>

        {/* 1. Color Palette Tokens */}
        <section className="space-y-4">
          <h2 className="text-xl font-display text-charcoal border-b border-card-border pb-2">
            1. Rev. 3 Color System (White Dominant, Beige Support, Green Accent)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-pure-white p-4 rounded-xl border border-card-border space-y-2 shadow-xs">
              <div className="w-full h-16 rounded-lg bg-pure-white border border-card-border" />
              <div className="text-xs font-mono font-bold">Pure White</div>
              <div className="text-[10px] text-muted-gray-text">#FFFFFF (65–75% Dominant)</div>
            </div>
            <div className="bg-soft-white p-4 rounded-xl border border-card-border space-y-2 shadow-xs">
              <div className="w-full h-16 rounded-lg bg-soft-white border border-card-border" />
              <div className="text-xs font-mono font-bold">Soft White</div>
              <div className="text-[10px] text-muted-gray-text">#FAF9F7 (Soft Surfaces)</div>
            </div>
            <div className="bg-warm-beige p-4 rounded-xl border border-card-border space-y-2 shadow-xs">
              <div className="w-full h-16 rounded-lg bg-warm-beige" />
              <div className="text-xs font-mono font-bold">Warm Beige</div>
              <div className="text-[10px] text-muted-gray-text">#EFE7DA (20–30% Support)</div>
            </div>
            <div className="bg-deep-beige p-4 rounded-xl border border-card-border space-y-2 shadow-xs">
              <div className="w-full h-16 rounded-lg bg-deep-beige" />
              <div className="text-xs font-mono font-bold">Deep Beige</div>
              <div className="text-[10px] text-muted-gray-text">#E2D6C3 (Section Contrast)</div>
            </div>
            <div className="bg-accent-green text-pure-white p-4 rounded-xl border border-card-border space-y-2 shadow-xs">
              <div className="w-full h-16 rounded-lg bg-accent-green" />
              <div className="text-xs font-mono font-bold">Accent Green</div>
              <div className="text-[10px] text-emerald-100">#2E6A4F (5–10% CTAs &amp; Chips)</div>
            </div>
            <div className="bg-green-tint-bg p-4 rounded-xl border border-card-border space-y-2 shadow-xs">
              <div className="w-full h-16 rounded-lg bg-green-tint-bg border border-accent-green/20" />
              <div className="text-xs font-mono font-bold">Green Tint BG</div>
              <div className="text-[10px] text-accent-green">#EEF5F1 (Chip/Badge Fill)</div>
            </div>
            <div className="bg-charcoal text-pure-white p-4 rounded-xl border border-card-border space-y-2 shadow-xs">
              <div className="w-full h-16 rounded-lg bg-charcoal" />
              <div className="text-xs font-mono font-bold">Charcoal</div>
              <div className="text-[10px] text-gray-300">#1B1B1B (Primary Body Text)</div>
            </div>
            <div className="bg-deep-forest text-pure-white p-4 rounded-xl border border-card-border space-y-2 shadow-xs">
              <div className="w-full h-16 rounded-lg bg-deep-forest" />
              <div className="text-xs font-mono font-bold">Deep Forest</div>
              <div className="text-[10px] text-gray-400">#10251E (Footer Zone Only)</div>
            </div>
          </div>
        </section>

        {/* 2. Typography Scale */}
        <section className="space-y-6">
          <h2 className="text-xl font-display text-charcoal border-b border-card-border pb-2">
            2. Typography Hierarchy (Display Serif vs Interface Sans)
          </h2>
          <div className="space-y-6 bg-soft-white p-6 rounded-2xl border border-card-border">
            <div>
              <span className="text-[10px] font-mono uppercase text-accent-green block mb-1">
                Display Headline (Playfair Display / Serif)
              </span>
              <p className="text-3xl sm:text-5xl font-display leading-tight text-charcoal">
                &ldquo;Close to Heaven&rdquo;
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-accent-green block mb-1">
                Atmospheric Sub-Headline (Playfair Display)
              </span>
              <p className="text-xl sm:text-2xl font-display italic text-muted-gray-text">
                &ldquo;Some places are built. Others are felt.&rdquo;
              </p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-accent-green block mb-1">
                Interface Subtitle &amp; Body (Plus Jakarta Sans)
              </span>
              <p className="text-sm font-sans text-charcoal/85 leading-relaxed max-w-2xl">
                Get Your Dream House Today in Abbottabad. Prime View Co-Operative Housing Society Ltd Hazara Division offers registered residential and commercial plots with 24/7 security and underground utilities.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
