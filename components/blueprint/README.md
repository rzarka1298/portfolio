# Blueprint primitives

The building blocks of the "Blueprint" redesign: a living engineering
schematic. Navy sheet, drafting grid, cyan linework, orange for whatever is
**active**, and mono annotations (part numbers, dimension lines, corner marks).

Import from the barrel:

```tsx
import { Section, BlueprintFrame, SignalEdge, useGsapContext } from '../blueprint';
```

## Design tokens

Colours are CSS variables (HSL triples) in `styles/globals.css`, exposed to
Tailwind as `bp-*` with opacity support (`bg-bp-line/10`). Dark ("blueprint")
is the default; `.light` on `<html>` switches to "blueprint paper".

| Token | Tailwind | Dark | Light | Use |
|---|---|---|---|---|
| `--bp-bg` | `bg-bp-bg` | `#0B2341` | `#FBFCFE` | page / sheet |
| `--bp-bg-deep` | `bg-bp-deep` | deeper navy | pale blue | vignettes, wells |
| `--bp-panel` | `bg-bp-panel` | `#0F2C50` | `#FFFFFF` | solid panels over the grid |
| `--bp-panel-2` | `bg-bp-panel-2` | `#14365E` | `#EEF3F9` | hover / raised |
| `--bp-grid` | `bg-bp-grid` | `#1E4466` | `#DCE6F2` | drafting grid |
| `--bp-ink` | `text-bp-ink` | `#E8F1FA` | `#0B2A5B` | primary text |
| `--bp-ink-dim` | `text-bp-ink-dim` | `#9DB8D3` | `#4A6285` | secondary text (AA) |
| `--bp-line` | `stroke-bp-line` | `#5CE1E6` cyan | `#0B3D91` navy | linework, links, labels |
| `--bp-line-soft` | `*-bp-line-soft` | muted blue | muted blue | idle wires, hairlines |
| `--bp-signal` | `bg-bp-signal` | `#FF8A3D` | bright orange | **active** state, marks, dots |
| `--bp-signal-ink` | `text-bp-signal-ink` | `#FF8A3D` | `#C2410C` | orange *text* (AA on paper) |

The shadcn tokens (`--background`, `--primary`, `--card`, `--border`...) map
onto these, so `components/ui` keeps working. `primary` is the line colour.

**Type:** `font-display` Space Grotesk (headings), `font-sans` Inter (body),
`font-mono` JetBrains Mono (labels). The `.bp-label` class is the standard
small uppercase mono annotation. **Easing:** `ease-blueprint` /
`[0.22, 1, 0.36, 1]` everywhere. **Static grid:** the `.bp-grid` class.

**Rules of thumb:** orange means "active/selected", never decoration. Keep
body copy on a solid panel (`bg-bp-panel`), not straight over the grid.
Corners are square; avoid `rounded-*` on new work.

## Motion

- Wrap-once gate: `MotionProvider` (already in `App.tsx`) sets framer-motion's
  `MotionConfig reducedMotion="user"` and starts Lenis only when motion is
  allowed. The CSS in `globals.css` stops loops under reduced motion.
- **framer-motion** for component and state transitions. **GSAP +
  ScrollTrigger** for scroll-scrubbed scenes, through `useGsapContext` only
  (it lazy-loads GSAP, so it never lands in the main chunk).
- In-page navigation: `scrollToId(id)` from `lib/motion/lenis` (goes through
  Lenis when running; honours `scroll-margin-top`). Don't call
  `scrollIntoView` directly.
- Inner scrollers (canvases, code blocks, modals) need `data-lenis-prevent`.
- Every component's unanimated DOM must be the finished, readable state.

## Components

### `Section`
Annotated section scaffold: `02 / EXPERIENCE` rule, an h2 with a dimension
line, optional intro, content in the site container.

```tsx
<Section id="experience" index={2} label="Experience" title="Where I've worked" intro="...">
  ...
</Section>
```
Props: `id`, `index`, `label`, `title`, `intro?`, `dimension?` (defaults to the
measured title width, `W 412`), `containerClassName?`, plus `<section>` attrs.
The id is the nav/scroll-spy target; keep the existing ids (`about`,
`experience`, `projects`, `skills`, `contact`). When you adopt `Section`,
remove the wrapping `<section id>` for that block in `HomePage.tsx`.

`DimensionedTitle` (same file) is the heading + dimension line on its own:
`<DimensionedTitle as="h3" className="text-2xl">Title</DimensionedTitle>`.

### `BlueprintFrame` / `CornerMarks`
Box with registration marks at the corners and an optional label notched
into the top edge.

```tsx
<BlueprintFrame label="FIG. 03 / STACK" meta="P-07" solid bordered className="p-6">...</BlueprintFrame>
```
Props: `label?`, `meta?`, `tone?: 'line' | 'signal' | 'muted'`, `solid?`
(opaque panel), `bordered?`, `as?`. `CornerMarks` alone:
`<CornerMarks size={8} className="text-bp-line" />` inside a `relative` box.

### `DrawPath`
An SVG `<path>` that draws its stroke. Render inside an `<svg>`.

```tsx
<svg viewBox="0 0 400 40"><DrawPath d="M0 20 H400" draw="scroll" className="stroke-bp-line" /></svg>
```
`draw`: `'load' | 'view'` (framer-motion), `'scroll'` (scrubbed with GSAP
ScrollTrigger; trigger is the parent svg; `start` / `end` props), `'none'`.
Also `duration`, `delay`, any SVG path props.

### `SignalEdge`
A schematic wire: faint dashed trace, a stroke that draws itself, and
glowing dots that travel along it (SMIL, no per-frame JS).

```tsx
<SignalEdge d="M10 10 H200 V80" state={hovered ? 'active' : 'idle'} dots={2} delay={0.3} />
```
Props: `d`, `state?: 'idle' | 'active' | 'dimmed'`, `draw?` (as DrawPath,
default `'load'`), `duration?`, `delay?`, `dots?`, `speed?` (s per crossing),
`reverse?`. Dots are dropped under reduced motion.

### `SplitReveal`
Masked word (or character) reveal, split at render time; screen readers get
the whole string.

```tsx
<SplitReveal as="h3" text="Durable runs that survive crashes" trigger="view" />
```
Props: `text`, `as?`, `by?: 'word' | 'char'`, `trigger?: 'view' | 'load'`,
`delay?`, `stagger?`. It starts hidden, so never use it on the hero or
anything that must be readable immediately.

### `MagneticButton`
A link (with `href`) or button that leans toward the pointer. Off on touch
and under reduced motion. Bring your own styles.

```tsx
<MagneticButton href="/resume.pdf" className="h-11 bg-bp-signal px-5">Résumé</MagneticButton>
```
Props: `strength?` (0.3), `max?` px (10), plus anchor or button props.

### `Annotation`
Drafting callout: dot, leader line to an elbow, shelf, mono note. Position it
at an anchor inside a `relative` parent.

```tsx
<div className="relative">
  <img ... />
  <Annotation x="62%" y="30%" dx={48} dy={-36} tone="signal">Temporal workflow</Annotation>
</div>
```
Props: `x`, `y` (CSS lengths), `dx`, `dy`, `shelf?`, `tone?: 'line' | 'signal'`.
Hide it (`hidden md:block`) where it would collide on small screens.

### `Marquee`
One ticker band per page at most. CSS-driven; pauses on hover/focus and has
a pause button; reduced motion renders a static wrapped list.

```tsx
<Marquee label="Venues" items={['ACM IMWUT', 'CHI', 'UbiComp']} duration={40} />
```
Props: `items`, `duration?`, `reverse?`, `separator?`, `label?`.

### `ScrollProgress`, `CursorCrosshair`, `BlueprintGrid`, `MotionProvider`
App-level pieces, already mounted. `ScrollProgress`: ruler on the right edge
(lg+) or a hairline under the header. `CursorCrosshair`: hairlines and
coordinates on fine pointers only. `BlueprintGrid`: the hero's WebGL grid;
fills its positioned parent, falls back to `.bp-grid` without WebGL or under
reduced motion, and reports `data-bp-grid="webgl" | "static"`.

## Hooks (`hooks.ts`)

- `useReducedMotion()`: true when the visitor prefers reduced motion. Gate
  loops, parallax, WebGL and cursor effects on it.
- `usePointerFine()`: true for mouse/trackpad (hover-capable) devices.
- `useMediaQuery(query)`
- `useGsapContext(setup, deps, { scope?, enabled? })`: returns a ref; GSAP
  selectors resolve inside it; everything is reverted on unmount; skipped
  under reduced motion.

```tsx
const ref = useGsapContext<HTMLDivElement>(({ gsap }) => {
  gsap.from('.row', { y: 24, opacity: 0, stagger: 0.06,
    scrollTrigger: { trigger: '.rows', start: 'top 80%' } });
}, []);
return <div ref={ref}>...</div>;
```

## Project selection (hero → Projects)

`lib/projectSelection.ts` is a tiny shared store. The hero's project nodes
call `select(id, { scroll: true, source: 'hero' })`, which scrolls to
`#projects`. The Projects section should show the selected tab:

```tsx
import { useProjectSelection } from '../lib/projectSelection';

const { selectedId, seq, source, select } = useProjectSelection();
useEffect(() => { if (selectedId) setTab(selectedId); }, [selectedId, seq]);
// and when the user changes tabs:
select(id, { source: 'projects' });
```

Ids are `FeaturedProjectId` from `content/featured.ts`: `harnessflow`,
`claudeos`, `lane-optimize`, `calico`, `biasgpt` (deep-dive ids equal their
route slugs). `seq` increments on every select, so repeat clicks can be
detected.
