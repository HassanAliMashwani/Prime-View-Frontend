
# Prime View - Website Design Audit

This document serves as a comprehensive audit of the design system, typography, color palette, and layout structure of the Prime View real estate website.

## 1. Color Palette 
The website relies heavily on an earthy, natural, and premium aesthetic, aiming to evoke a feeling of "serene nature, modern infrastructure, and secure future investment". 

### Base & Background Colors
- **Pure White** (`#FFFFFF`): Primary background for the body and main cards.
- **Soft White** (`#FAF9F7`): Alternate clean background for subtle layering.
- **Warm Beige** (`#EFE7DA`): Used for soft contrast areas.
- **Deep Beige** (`#E2D6C3`): Used for stronger contrast, hovering on beige buttons.
- **Green Tint Bg** (`#EEF5F1`): A very soft, translucent green for light thematic sections.
- **Footer Background** (`#F4F1EA`): The warm beige tone specifically wrapping the footer.

### Text & Accents (The "Pine" & "Charcoal" Family)
- **Charcoal** (`#1B1B1B`): Main deep black used for standard high-contrast text.
- **Muted Gray Text** (`#5F5A52`): Used for secondary body text, links, and sub-descriptions to ensure legibility without harsh contrast.
- **Pine** (`#1C342B`): A deep, rich, organic green used heavily for prominent headers (e.g., in the footer). 

### Greens (Brand Colors)
- **Accent Green** (`#2E6A4F`): Primary interactive brand color used for hover states, social icons, and text highlights.
- **Soft Green** (`#5E8F78`): A gentler hue for non-dominant interactive elements.
- **Verified Green** (`#137547`): Historical brand green.
- **Deep Forest** (`#10251E`): Highly specific, ultra-dark green reserved strictly for maximum contrast (used in the Footer CTA card).

## 2. Typography
The typography contrasts an elegant serif font for display/headings with a highly legible, modern sans-serif for body copy, achieving a "modern luxury" look.

- **Display (Headings):** `Playfair Display` (Serif). Used for all major page headers (H1, H2, Footer headers, Section titles). Imparts a classic, premium, architectural feel.
- **Sans (Body Text):** `Plus Jakarta Sans` (Sans-Serif). Clean, geometric, and very readable. Used for paragraphs, navigation links, and small UI elements. 

## 3. Global Design Language & Style
The website relies on a specific modern web design aesthetic characterized by:
- **"Contoured Bento" Layout:** Sections are rarely full bleed flat colors. Instead, content is housed in soft, generously rounded containers (e.g. `rounded-[2rem]`, `rounded-3xl`), floating on top of base backgrounds.
- **Glassmorphism:** Navigation menus and interactive pills use translucent backgrounds (`bg-white/75` or `bg-white/20`) combined with intense backdrop blur (`backdrop-blur-md`). This allows background photography to bleed through beautifully. 
- **Subtle Depth:** Heavy reliance on varied drop shadows. The site uses very soft, large-spread shadows (`shadow-[0_8px_30px_rgba(0,0,0,0.04)]`) to lift cards off the background without making them look "boxy". 
- **Cinematic Photography:** Full bleed imagery with carefully controlled overlay gradients (e.g., `bg-gradient-to-b from-black/70 via-black/20 to-black/80`) to ensure text remains perfectly readable while showcasing architectural and natural beauty.

## 4. Page Layout Structure

### A. Global Elements
- **Header:** Broken away from traditional solid bars. It is composed of floating "pills" at the top of the screen. The logo floats on the far left, while the navigation links reside in a center-aligned frosted glass pill. 
- **Floating WhatsApp FAB:** Fixed at the bottom right (`bottom-6 right-6`), rendered in standard WhatsApp green (`#25D366`), with a pulse/scale animation on hover.
- **Footer:** 
  - Starts with an overlapping "CTA Card" (`bg-deep-forest`) pushing upwards into the preceding section with a `-mb-12` margin.
  - The main footer is a massive white contoured card (`rounded-[2rem]`) sitting on a beige background. 
  - Multi-column grid containing the large logo, product links, resources, and legal links.
  - Social icons sit directly beneath the logo, utilizing the brand's original colors (Twitter Blue, Instagram Magenta, etc.) for high recognition.

### B. Home Page (`/src/app/page.tsx`)
The home page acts as a continuous scroll of modular components, deeply relying on the contoured style:
1. **Hero Section (`HeroSection`):** High-impact entry point. Presumably utilizes full-screen imagery/video with a central value proposition.
2. **About / Overview (`ReferenceAboutView`):** Recently consolidated from a standalone page. It employs a "bento grid" structure of pills and rounded cards to quickly deliver features and project philosophy.
3. **Amenities (`AmenitiesSection`):** Showcases features of the society (parks, security, infrastructure) using grid layouts.
4. **Map / Location (`MapSection`):** A simplified, static satellite map view showing the location of the housing society relative to major roads.
5. **Contact (`ContactSection`):** A dual-column layout. The left side features a full-height cinematic architectural photograph with a dark gradient overlay, housing the "Get In Touch" heading and contact details. The right side contains the interactive contact form.

### C. Other Route Structures
While currently simplified, the application structure supports deep diving into specific project elements:
- `/our-plans`: Floor plans and masterplan breakdowns.
- `/events-and-media`: Galleries, video updates, and PR.
- `/owners`, `/society-members`, `/legal-team`, `/marketing-sales-partner`: Team breakdowns and organizational transparency.
- `/map`, `/map-2`: Dedicated deeper-dives into location and masterplan topography.

## 5. Interaction & Animation
- **Hover States:** Links transition to `accent-green`. Buttons employ scaling (`hover:scale-105`) and color shifts.
- **Transitions:** Most interactive elements use Tailwind's `transition-all duration-300 ease-out` for buttery smooth state changes.
- **Micro-interactions:** The CTA button in the footer uses a subtle `animate-pulse` to draw the eye, and the WhatsApp FAB scales playfully on hover. 

---
*Audit completed on August 29, 2026. This document should serve as the source of truth for new components being introduced to the Prime View ecosystem.*
