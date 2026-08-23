# Prime View — Phase 2 Master Design Specification (Rev. 2)
> **"A View Worth Building a Life Around."**

**Status:** Design direction & single source of truth for Phase 2 Redesign.
**Depends on:** Phase 1 (audit, extraction, faithful recreation) — APPROVED & Complete.

---

## REVISION NOTE

Rev. 1 was built around scroll-driven cinematic motion (parallax, pinned sections, scroll-triggered reveals, image morphing). Rev. 2 changes the core interaction philosophy:

> The site is **static-first**. There is no scroll-driven animation anywhere — no parallax, no pinning, no scroll-triggered reveals, no scroll-jacking, no image morphing on scroll. Emotional pacing comes entirely from **layout, spacing, typography, and photography**. The only motion permitted is **simple, fast CSS transitions on hover/focus/click** (color shifts, underlines, opacity changes) — ordinary functional UI feedback.

---

## 1. Design Philosophy & Concept

The site reads as **a place you are shown**, not a brochure pitching at you.

```
Curiosity → Calm → Trust → Belonging → Desire → Confidence → Action
```

This arc is built through **what appears, in what order, at what visual weight** — strong photography, considered typographic hierarchy, deliberate whitespace, and section-to-section pacing. Think **printed architecture magazine**, not motion showreel.

"Close to Heaven" remains the real, existing brand tagline (confirmed in Phase 1) and anchors the hero.

---

## 2. Visual System

### 2.1 Color

| Role | Hex | Note |
|---|---|---|
| Deep Forest | `#10251E` | Primary dark surface |
| Pine | `#1C342B` | Secondary dark surface |
| Verified Green | `#137547` | Real brand color, kept exactly |
| Warm Ivory | `#F4F0E7` | Light narrative surface |
| Stone | `#D9D2C5` | Dividers, secondary surfaces |
| Charcoal | `#171816` | Body text on light surfaces |
| Muted Brass | `#B29A68` | Rare accent — hairlines, underlines, small labels |

### 2.2 Typography

- **Display (serif — Playfair Display):** large emotional headlines only.
- **Interface (sans — Plus Jakarta Sans):** navigation, data, buttons, body copy.

### 2.3 Interaction Principle

```
Every visual state change must be triggered by the user
(hover, focus, click, tap) — never by scroll position or timers.
```

**Allowed:** button darkening on hover, link underline appearing, photo overlay brightening on hover, accordion/panel opening on click. Use short CSS transitions (150–250ms, ease-out).

**Not allowed anywhere:** parallax, scroll-triggered fade/slide-ins, pinned/sticky scroll sections, scroll-scrubbed progress, auto-playing motion, staggered entrance sequences, image morphing, camera-like zoom/pan.

### 2.4 Anti-Patterns — Explicitly Banned

- **The generic "3-feature card" pattern** — rounded-corner bordered box, centered icon, heading, short text, repeated in equal-width columns. Never use it.
- Stock icon sets inside colored circle backgrounds.
- Any box with shadow + border + rounded corners + centered icon (if >1 of these four traits appear together, reconsider the component).
- Scroll-triggered reveal animations of any kind.

**What replaces cards:** hairline dividers instead of borders; typographic hierarchy (numerals, labels, size contrast) instead of icons; asymmetric widths instead of uniform grids; content sitting directly on the section's background.

---

## 3. Section Composition Language

Each section is a **static composition** — fully visible and complete the moment it's in view.

| Device | What it is | Where it's used |
|---|---|---|
| Hard color-block cut | One section ends, next begins in a different tone | Hero → Story, Masterplan → Amenities |
| Hairline rule | Thin brass or stone divider line | Between list-style sections |
| Overlapping static image | Image bridges two sections without moving | Story chapter, Land section |

Interaction states (hover/click only):
- **Buttons:** background/border color shift, ~200ms
- **Links:** underline or color shift on hover
- **Masterplan zones:** hover/tap brightens zone, reveals info panel (opacity transition)
- **Team members:** hover/focus reveals name/title/email via opacity/color-state change
- **Property selector:** click reveals details inline (instant or quick fade)

---

## 4. Content Integrity Rules

- Never alter verified names, titles, emails, roles, prices, plot sizes, addresses, phone numbers, or business claims.
- Never replace, re-crop, recolor, or regenerate any real photo.
- Never invent statistics, approvals, testimonials, legal claims.
- New copy marked **[NEW COPY — NEEDS APPROVAL]** requires sign-off.
- `src/data/*.ts` schemas may gain new fields, never lose or rename existing ones.
- No page outside a pass's stated scope gets touched.

---

## 5. Section-by-Section Specification (Static-First)

### 5.1 HERO
Full-viewport real photograph, white logo, both headlines present. Single CTA button. Everything visible on load — no parallax, no fade-in, no scroll-linked movement. Static scroll cue at bottom, itself unanimated.

### 5.2 HERO → STORY
Hard cut. Hero ends, Story begins — clean color-block cut (dark → warm ivory). No panel "rises." Optional static overlapping image at seam.

### 5.3 STORY CHAPTER
Editorial, fully static. Trust pillars: no cards — use horizontal row with hairline dividers, serif numerals (01/02/03), no box/shadow/border/fill.

### 5.4 THE LAND
Full-viewport real photography with static text annotations. [NEW COPY] "Room to Breathe."

### 5.5 MASTERPLAN (the one interactive section)
Real masterplan, fixed scale. Hotspots on real zones. Hover/tap reveals info panel (opacity transition). Full keyboard access. No camera zoom/pan.

### 5.6 MASTERPLAN → LIFESTYLE
No morph. Connected through captioning/content, not visual transition.

### 5.7 "A DAY AT PRIME VIEW"
Static editorial grid of real daily-life photos. All visible at once.

### 5.8 AMENITIES
Static vertical list, hairline rules, no cards, no icons-in-boxes. [NEW COPY] "Everything Within Reach."

### 5.9 PROPERTIES
Large typographic selectors. Click reveals details inline. [NEW COPY] "Find Your Place."

### 5.10 INVESTMENT
Dark background, real numbers, thin lines, no motion. Most visually still section.

### 5.11 TRUST
Real approvals only. Unverifiable items omitted.

### 5.12 GALLERY
Editorial, varied-size grid. Fixed composition.

### 5.13 TEAM
Static staggered sequence. Hover/focus reveals detail via opacity change.

### 5.14 FINAL CTA
Quiet, static. Large whitespace. [NEW COPY] "Your View Starts Here."

### 5.15 FOOTER
Real wordmark/contact/nav. Closes with "Close to Heaven."

---

## 6. Inner / Utility Pages

Same visual system, simpler/scannable. Static and functional by nature.

---

## 7. Accessibility & Performance

- All interactive elements keyboard-focusable with visible focus states.
- No layout shift (CLS): reserve image space before load.
- WCAG AA color contrast on all surfaces.
- Hover-only reveals must have focus-triggered equivalents.
- `prefers-reduced-motion`: shorten CSS transitions to near-instant.

---

## 8. Build Order

1. Visual system foundation (tokens, typography, patterns)
2. Hero + Story chapter (5.1–5.3)
3. Masterplan (5.5–5.6)
4. Team sections (5.13)
5. The Land + Day moments (5.4, 5.7)
6. Amenities + Properties + Investment (5.8–5.10)
7. Trust + Gallery (5.11–5.12)
8. Final CTA + Footer (5.14–5.15)
9. Inner/utility pages (Section 6)

---

## 9. Verification Checklist (Every Pass)

- [ ] Every real fact matches Phase 1 verified data exactly.
- [ ] No real photo replaced, recolored, or regenerated.
- [ ] New copy marked and approved beforehand.
- [ ] **No scroll-triggered animation** — no GSAP ScrollTrigger, no Framer Motion scroll/whileInView, no IntersectionObserver reveals, no CSS scroll-driven animations.
- [ ] **No card-grid anti-pattern** anywhere.
- [ ] All motion limited to hover/focus/click CSS transitions, ≤250ms.
- [ ] Keyboard navigation and focus states work correctly.
- [ ] No layout shift on load.
- [ ] `npx tsc --noEmit` and `npm run build` both pass cleanly.
- [ ] No page/section outside this pass's scope was modified.

---

## 10. Open Decisions

1. Hero headline hierarchy — "Close to Heaven" vs "Get Your Dream House Today in Abbottabad" as primary/secondary.
2. Day-moments content depth — confirm real photo inventory before committing.
3. New atmospheric copy approval — review each [NEW COPY] line before its pass.
4. Properties list completeness — confirm 5/7/10 Marla + 1 Kanal is the full real lineup.
