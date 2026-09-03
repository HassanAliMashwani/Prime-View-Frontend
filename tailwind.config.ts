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
        // Phase 2 Rev. 3 Brand Color System — Our Plans Palette
        "pure-white": "#FFFFFF",
        "soft-white": "#F8F7F5",
        "card-ivory": "#FAF9F7",
        "card-inner": "#FAF9F5",
        "warm-beige": "#EFE7DA",
        "deep-beige": "#E2D6C3",
        "charcoal": "#151914",
        "muted-charcoal": "#6B7462",
        "body-charcoal": "#4A5347",
        "stone": "#D9D2C5",
        "muted-brass": "#B29A68",
        
        "deep-forest": "#10251E",
        "dark-evergreen": "#1B4324",
        "pine": "#1C342B",
        "forest-green": "#43612B",
        "verified-green": "#43612B",
        "soft-green": "#5E8F78",
        "alpine-sage": "#A8BBA2",
        "sage-tint": "#EAF0E7",
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
