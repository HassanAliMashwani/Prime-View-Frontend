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
        // Phase 2 Rev. 3 Brand Color System
        "pure-white": "#FFFFFF",
        "soft-white": "#FAF9F7",
        "warm-beige": "#EFE7DA",
        "deep-beige": "#E2D6C3",
        "charcoal": "#1B1B1B",
        "stone": "#D9D2C5",
        "muted-brass": "#B29A68",
        
        "deep-forest": "#10251E",
        "pine": "#1C342B",
        "verified-green": "#137547",
        "soft-green": "#5E8F78",
      },
      fontFamily: {
        display: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Manrope", "sans-serif"],
        heading: ["var(--font-heading)", "Plus Jakarta Sans", "sans-serif"],
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
