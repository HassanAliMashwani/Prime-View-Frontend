# Accessibility Audit — Prime View

Audit of accessibility compliance (WCAG 2.1 Level AA baseline).

## Key Findings
1. **Missing Alt Text**: Several gallery images and background banners lack descriptive `alt` attributes or use filenames as alt text (`Artboard 28@4x-100.jpg`).
2. **Heading Hierarchy Gaps**: Skipping from `<h1>` directly to `<h4>` in specific Elementor widgets.
3. **Color Contrast**: Primary green `#137547` on white `#ffffff` achieves a contrast ratio of 4.6:1 (passes AA for normal text), but lighter text overlays on hero images lack sufficient dark overlays.
4. **Form Labels**: Contact form input fields rely heavily on placeholder text rather than explicit `<label>` elements.
5. **Focus States**: Default browser outline states without custom high-contrast focus rings.
