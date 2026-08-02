# 07 — Visual design pass

**What to build:** The "looks old" requirement, recorded in the spec: the prototype's flat, dated look is the floor, not the target. A proper visual system lands on top of the theme tokens: bundled modern webfont (Inter/Geist-class via fontsource) instead of system-font-only, a coherent icon set replacing glyphs and colored dots, a deliberate radius/spacing scale, soft shadows and glows, frosted/translucent surfaces, subtle motion on expand/collapse, hover, and drag, and polished empty states (welcome card, ghost columns) and the canvas placeholder.

**Blocked by:** 06

**Status:** ready-for-agent

- [x] UI typography comes from the bundled webfont — no system-font fallback look for headings and UI labels
- [x] Icons are a coherent set; type-glyph letters and colored dots are gone
- [x] Motion on expand/collapse, hover, and drag is subtle and smooth (no jank)
- [x] Welcome card, ghost columns, and the Excalidraw placeholder look designed, not scaffolded
- [x] The design is consistent and legible in both light and dark themes

## Comments

- Completed 2026-08-02.
- Typography: `@fontsource-variable/inter` (5.3.0) is now a dependency; `newtab.js` imports it so Vite bundles the woff2 subsets into `dist/assets/` (browsers download only the latin subset via unicode-range, ~48 kB). `body` sets `font-family: "Inter Variable", <system stack>`; headings, bars, buttons, chips, chooser all inherit. Monospace (textarea, preview code) intentionally stays ui-monospace — the ticket targets UI typography.
- Icons: the colored `.dot` markers are gone. `typeIconEl()` renders the existing lucide-style markdown/excalidraw icons in a tinted 26px chip (`--accent-soft`/`--accent-2-soft`), used in both collapsed bars and the expanded header. The ghost column's text `+` glyph is now the same `plus` icon set (18px) in a shadowed circle. `rg`-checked: no `.dot`, `dotEl`, or `+` text glyph remains.
- Motion:
  - Expand/collapse: a FLIP helper (`flipInto`) measures the bar/pane before the re-render and animates the incoming element from the outgoing one's rect with a `scaleY` + `translateY` Web Animation (compositor-only properties, `transform-origin: top center`), plus an opacity fade — the accordion reads as one continuous grow/shrink at 240ms `cubic-bezier(0.2, 0.7, 0.2, 1)`. `addPane` on an empty stack grows the pane from the ghost's rect; `quickAdd`/`addPane` elsewhere fade-rise. The old CSS `rise` keyframes were removed from `.pane` (they'd override WAAPI in the composite order).
  - Hover: bars lift 1px with a soft shadow (`--shadow-sm`), the type icon scales 1.08, ghost columns glow/lift on hover; gutters and stack-add already had color transitions. All hover motion is transform/opacity/shadow only.
  - Drag: dragging elements drop to `opacity: .45` with a subtle scale + `cursor: grabbing`; drop indicators transition in.
  - `prefers-reduced-motion: reduce` kills all CSS animation/transition durations (`.01ms !important`), and `flipInto` bails early on the same media query.
- Designed empty states: the welcome card is now a frosted panel (`--surface` translucent + `backdrop-filter: blur(18px)`, 24px radius, top accent tint, larger logo glow, constrained hint width); the chooser menu matches the same frosted surface. Ghost columns are two-line ("Add a pane" / "Notes and canvases start here") with a glowing dashed frame and an icon circle. The Excalidraw pane shows a designed loading state — icon chip + "Loading canvas…" over a shimmer sweep — hidden on `excalidraw-ready`, re-shown when the theme flips reload the iframe.
- Themes: all new surfaces read tokens; light overrides added for `--accent-2-soft`, `--shadow-sm`, `--surface`. `color-mix()` (Chrome 111+/Firefox 113+) is used for border tints and surface blends — acceptable for current MV3 browsers.
- One build trap hit: a transient duplicate `function addPane` (from my own edit sequence) made rolldown silently drop the HTML entry and fail in `assemble-dist` with ENOENT on `dist/src/newtab.html`; once removed, the build emits `dist/src/newtab.html` + `dist/assets/` with all 7 font subsets, JS 60.9 kB (18.9 gzip). `npm test` (53 domain tests) and `vite build` are green.
- Not tested by design (spec Testing Decisions: DOM rendering, theming). Visual polish validated by review; dual-browser QA is ticket 09.

## Comments (code-review)

- /code-review (2026-08-02), fixed point c9aafc0. Standards axis: no hard violations (token-only colors verified, ticket conventions, domain language). Spec axis: one real bug + two partials.
- Real bug fixed: `quickAdd`'s FLIP targeted `document.querySelector(".pane")` — the *first* pane in DOM order — while `domain.quickAdd` appends to the *last* stack, so the entrance animation played on the wrong pane on multi-stack pages. Extracted `flipNewPane(stackId, fromRect)` (scoped selector; unscoped only when the page was empty and the pane is unique) and routed `quickAdd`/`addPane`/`toggleExpanded`-expand through it — which also collapsed the repeated measure/commit/query/flip dance into one helper.
- Radius scale: "deliberate radius/spacing scale" (spec decision 8) was only partially met — new surfaces used hardcoded radii. Added `--radius-sm: 8px` / `--radius-xl: 24px` tokens (both theme blocks) and applied them to the type icon chip, welcome card, and canvas placeholder icon; pre-existing radii (10/14px) left as-is.
- "Type-glyph letters and colored dots are gone": the redundant `MARKDOWN`/`EXCALIDRAW` text chip in the expanded header is removed — the tinted type icon now carries the type in both collapsed and expanded states (welcome/chooser keep their icon+label buttons, which are actions, not type glyphs). `.type-chip` CSS deleted.
- Duplicated Code (Standards): the canvas placeholder hand-rolled the icon chip that `typeIconEl` already builds — it now calls `typeIconEl({ type: "excalidraw" })` and overrides size via `.canvas-placeholder-icon` (whose duplicated bg/color rules were dropped — they come from `.type-icon.excalidraw`).
- Judgement calls adopted: removed the inert `.pane { transition: border-color }` (nothing changes that property), moved `.ghost-hint`'s transition to the base rule (symmetric hover-in/out). Acknowledged, not fixed: collapse FLIP uses `scaleY > 1` top-origin (the bar covers the pane's old rect then squishes — symmetric with expand; the re-render can't preserve the pane's actual content anyway).
- Re-verified: `npm test` (53) and `vite build` green; dist emits `newtab.html` + assets with the 7 Inter subsets (latin 48 kB, unicode-range limits download).
