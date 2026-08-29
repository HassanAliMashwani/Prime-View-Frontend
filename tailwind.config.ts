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
        charcoal: "#1B1B1B",
        "muted-gray-text": "#5F5A52",
        "accent-green": "#2E6A4F",
        "soft-green": "#5E8F78",
        "green-tint-bg": "#EEF5F1",
        "card-border": "#E8E1D5",
        "secondary-border": "#D8CCB8",
        "secondary-hover-bg": "#F5EFE6",

        // Retained tokens
        "verified-green": "#137547", // Historical brand green reference
        "deep-forest": "#10251E",   // Reserved strictly for single Footer contrast zone
        pine: "#1C342B",
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
