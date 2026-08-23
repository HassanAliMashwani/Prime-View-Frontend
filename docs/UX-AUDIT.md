# UI/UX Audit — Prime View (Document Only)

Audit of current design system, color palette, typography, visual hierarchy, and user experience issues.

## Color System
- Primary Green: `#137547` (used for buttons, links, highlights)
- Dark Green / Hover: `#0e5735`
- Deep Forest Accent: `#1f362b`
- Background Base: `#ffffff` & `#fafafa`
- Text Colors: Dark Charcoal (`#000000` / `#111111`), Muted Gray (`#555555`)

## Typography
- Primary Body Font: **Manrope** (sans-serif)
- Primary Headings Font: **Plus Jakarta Sans** (sans-serif)
- Sizes: H1 (76px desktop, 54px mobile), H2 (54px desktop, 42px mobile), H3 (26px), Body (16px)

## UX Friction Points & Weaknesses (Preserved in Phase 1 Baseline)
1. **Redundant Map Routes**: `/map/` and `/map-2/` duplicate masterplan presentation.
2. **Inconsistent Section Padding**: Variable vertical spacing due to inline Elementor column paddings.
3. **Heavy Image Assets**: Uncompressed PNGs and high-resolution brochure images served without modern WebP/AVIF srcset optimization.
4. **Mobile Navigation Spacing**: Overly large padding on touch targets causing vertical scroll overflow on smaller screens.
