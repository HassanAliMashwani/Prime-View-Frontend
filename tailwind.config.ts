import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Phase 2 Brand Extended Palette
        "deep-forest": "#10251E", // --color-bg-dark
        pine: "#1C342B",        // --color-surface-dark
        "verified-green": "#137547", // --color-brand (Real verified green)
        "warm-ivory": "#F4F0E7",  // --color-surface-light
        stone: "#D9D2C5",       // --color-muted
        charcoal: "#171816",    // --color-text-dark
        "muted-brass": "#B29A68", // --color-accent-gold
      },
      fontFamily: {
        display: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Manrope", "sans-serif"],
        heading: ["var(--font-heading)", "Plus Jakarta Sans", "sans-serif"],
      },
      transitionTimingFunction: {
        paper: "cubic-bezier(0.22, 1, 0.36, 1)",
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      aspectRatio: {
        "3/4": "3 / 4",
        "4/5": "4 / 5",
        "16/9": "16 / 9",
        "21/9": "21 / 9",
      },
    },
  },
  plugins: [],
};

export default config;
