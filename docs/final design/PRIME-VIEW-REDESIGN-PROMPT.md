# Prime View — Consistency & Polish Pass — Multi-Actor Execution Prompt

**Context:** Prime View is ~90% complete (Next.js + Tailwind, real estate/housing society site). This is a *consistency and polish pass*, not a rebuild. `docs/REDESIGN-NOTES.md` (Rev.3) is the single source of truth for palette and animation rules — every actor below must read it before touching any file.

**Hard constraint that overrides every actor's instructions below:** Do not change functionality. No behavior, data, routing, or content logic changes — visual/styling/animation only.

**Two files are permanently locked, no exceptions, no actor may touch them:**
- `src/components/navigation/Header.tsx` — glassmorphism nav (`bg-white/75 backdrop-blur-md border border-white/50`) stays exactly as-is.
- `src/components/sections/AmenitiesSection.tsx` — its existing scroll animations stay exactly as-is. No actor adds, removes, or modifies animation code here.

---

## Actor 1 — Design Token Auditor

**Role:** Find every place the codebase deviates from the Rev.3 palette in `docs/REDESIGN-NOTES.md` §2.1.

**Responsibilities:**
- Scan all `.tsx`/`.ts` files for hardcoded hex values and Tailwind arbitrary-value color classes (`bg-[#...]`, `text-[#...]`, `border-[#...]`).
- For each match, determine which Rev.3 token it should map to (or flag as a legitimate exception — WhatsApp green, social brand icons).
- Produce a file-by-file replacement list: `old class/value → new token class`.
- The violet/blue/orange badge trio in `our-plans/page.tsx` is explicitly excluded from migration — leave it exactly as-is, do not include it in the replacement list.
- Do not edit any files yet. Output the replacement list only, for review.

**Constraint:** Never invent a new color. Every replacement must map to a token already defined in Rev.3 §2.1.

---

## Actor 2 — Spacing & Grouping Specialist

**Role:** Apply proximity-based grouping — **tight gaps inside a group, big gaps between groups, related = close, unrelated = far.**

**Responsibilities:**
- Audit current spacing (`gap-*`, `p-*`, `m-*`) inside each section against this rule: elements that belong to the same idea (e.g. an icon + its label, a stat + its caption) must sit closer together than the gap separating that group from the next group.
- Where a section currently uses uniform spacing between visually-unrelated elements (a common symptom of the generic "3-feature card" pattern this project already bans — see Rev.3 §2.4), tighten intra-group spacing and widen inter-group spacing.
- Do not touch overall section padding/margins that define page rhythm unless they directly violate the rule.
- Do not touch `AmenitiesSection.tsx` or `Header.tsx`.

**Deliverable:** Per-component before/after spacing diff with a one-line reason for each change.

---

## Actor 3 — Contrast Specialist (Color, Shape, Size)

**Role:** Ensure every section reads with deliberate contrast, not visual sameness.

**Responsibilities:**
- **Color contrast:** Apply the Rev.3 §2.1a background rule — alternate `soft-white`/`pure-white` sections against `deep-forest`/`pine`/`warm-beige` sections. No two adjacent sections in near-identical off-white tones.
- **Shape contrast:** Where multiple elements in a row/grid currently share identical shape and size (bounding box, corner radius), introduce deliberate variation — one dominant element, others subordinate — rather than uniform grid cells. This reinforces the "no generic 3-card grid" rule already in Rev.3 §2.4.
- **Size contrast:** Typographic and element scale should reflect hierarchy — the single most important item in a section should be visibly larger/heavier than supporting items, not just bolded.
- Skip `Header.tsx` and `AmenitiesSection.tsx` entirely.

**Deliverable:** Section-by-section list of contrast adjustments (color pairing, shape variation, size hierarchy) with the specific before/after classes.

---

## Actor 4 — Bold Minimalism Editor

**Role:** Enforce clean layout, strong typography, low noise, high impact.

**Responsibilities:**
- Identify decorative elements that add visual noise without communicating anything (redundant borders, unnecessary shadows stacked with borders and rounded corners and icons — already flagged as an anti-pattern in Rev.3 §2.4).
- Strengthen typographic hierarchy using the existing type scale (`font-display` for emotional headlines, `font-sans` for interface/body) rather than introducing new sizes.
- Remove or simplify any element that doesn't serve either information or navigation.
- Consolidate the four team layout variants (`TeamSection.tsx`, `TeamBentoGrid.tsx`, `TeamMarquee.tsx`, `TeamWaveSection.tsx`) into one canonical component, and the two about-page variants (`AboutHeroSection.tsx`, `ReferenceAboutView.tsx`) into one — pick whichever best fits bold-minimalism, archive the rest.

**Constraint:** "Less noise" never means "less information" — content and functionality are preserved; only decorative excess is removed.

---

## Actor 5 — Imperfection Artist

**Role:** Introduce intentional, controlled imperfection so the site doesn't read as a generic template.

**Responsibilities:**
- Apply small deliberate asymmetries: slightly uneven column widths instead of perfect grids, a heading that breaks the baseline grid on purpose, an image that bleeds slightly past its container edge.
- Keep every imperfection subtle and clearly intentional (not a bug) — this is texture, not sloppiness.
- Apply sparingly — 1–2 imperfection touches per page maximum, concentrated where they'll be noticed (hero, section openers), not scattered everywhere.
- Never apply to functional UI (forms, buttons, nav) — imperfection is a content/layout device only, never at the cost of usability.

**Deliverable:** List of proposed imperfection touches with the specific section and CSS approach.

---

## Actor 6 — Motion Designer

**Role:** Implement the three approved scroll-entrance effects from Rev.3 §2.3 — bounce fade-up, typewriter, and blur-fade-up word-by-word.

**Responsibilities:**
- Build each as a reusable component/hook (e.g. `<ScrollReveal variant="bounce" | "typewriter" | "blur-word">`), not copy-pasted per section.
- Trigger via Intersection Observer or Framer Motion's `whileInView`, `once: true`.
- Respect `prefers-reduced-motion`: all three effects degrade to instant, non-animated appearance.
- Assign effects deliberately per content type — don't apply all three effects on one page arbitrarily:
  - Bounce fade-up → section headers, hero copy, stat callouts.
  - Typewriter → short standalone headlines/labels only, never paragraphs.
  - Blur fade-up word-by-word → short emotional statements (1–2 lines max).
- **Absolutely do not touch `AmenitiesSection.tsx`** — its current `whileInView` opacity/y animations stay exactly as they are; this actor's new system runs everywhere else.
- **Absolutely do not touch `Header.tsx`.**

**Deliverable:** The reusable animation component(s), plus a list of which sections received which effect and why.

---

## Actor 7 — Media Page Architect (CC Cylinder)

**Role:** Redesign the video layout on `/events-and-media` (`EventsMediaTabs.tsx`) into a "CC cylinder" presentation — a curved, rotating/carousel-style 3D cylinder arrangement of video thumbnails, rather than the current flat grid/tab layout.

**Responsibilities:**
- Preserve all existing functionality: video playback, tab switching, any filtering/categorization currently in `EventsMediaTabs.tsx` — the cylinder is a *layout and presentation* change only.
- Arrange video thumbnails along a curved/cylindrical path (CSS 3D transforms — `perspective`, `rotateY`, `translateZ` — or a lightweight carousel library already in the project's dependencies if one exists; check `package.json` before adding a new dependency).
- Support click/tap to bring a thumbnail to the front and play it — same interaction outcome as today, new visual arrangement.
- Ensure keyboard navigation and focus states still work (arrow keys or tab order to move through the cylinder) — do not regress accessibility.
- Provide a graceful fallback for reduced-motion or if 3D transforms aren't well supported: a simpler static arc or row layout that preserves the same content and functionality.

**Deliverable:** The updated `EventsMediaTabs.tsx` (or a new component it renders), plus a note on any new dependency added and why.

---

## Actor 8 — Consistency QA Reviewer (final pass)

**Role:** Verify the combined output of Actors 1–7 against `docs/REDESIGN-NOTES.md` Rev.3 checklist (§9) before anything ships.

**Responsibilities:**
- Confirm every color class in changed files resolves to a Rev.3 token — no leftover hardcoded hex.
- Confirm `Header.tsx` and `AmenitiesSection.tsx` have zero diffs.
- Confirm all new scroll animations are `once: true` and respect `prefers-reduced-motion`.
- Confirm no functionality changed — click through every interactive element (nav, forms, video playback, masterplan hotspots if present, tab switching) and confirm identical behavior to before the pass.
- Confirm section backgrounds alternate per §2.1a and no two adjacent sections share a near-duplicate off-white.
- Run `npx tsc --noEmit` and `npm run build`; both must pass cleanly.
- File a short report: what passed, what didn't, what needs another pass.

---

## Execution Order

1. Actor 1 (token audit) → review its output before any code changes.
2. Actor 4 (consolidate duplicate components) — do this early so later actors aren't styling components about to be deleted.
3. Actors 2, 3, 5 (spacing, contrast, imperfection) — layout/visual pass, can run together per-section.
4. Actor 6 (motion) — after layout is settled, so animations target final DOM structure.
5. Actor 7 (media page) — independent, can run in parallel with 2/3/5.
6. Actor 8 (QA) — always last, always after every other actor.
