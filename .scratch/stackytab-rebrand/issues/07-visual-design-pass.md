# 07 — Visual design pass

**What to build:** The "looks old" requirement, recorded in the spec: the prototype's flat, dated look is the floor, not the target. A proper visual system lands on top of the theme tokens: bundled modern webfont (Inter/Geist-class via fontsource) instead of system-font-only, a coherent icon set replacing glyphs and colored dots, a deliberate radius/spacing scale, soft shadows and glows, frosted/translucent surfaces, subtle motion on expand/collapse, hover, and drag, and polished empty states (welcome card, ghost columns) and the canvas placeholder.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] UI typography comes from the bundled webfont — no system-font fallback look for headings and UI labels
- [ ] Icons are a coherent set; type-glyph letters and colored dots are gone
- [ ] Motion on expand/collapse, hover, and drag is subtle and smooth (no jank)
- [ ] Welcome card, ghost columns, and the Excalidraw placeholder look designed, not scaffolded
- [ ] The design is consistent and legible in both light and dark themes
