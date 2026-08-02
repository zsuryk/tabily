# 03 — Single-stack interaction + persistence

**What to build:** The stack page becomes real, rendering a thin projection of the domain module. Empty page shows the welcome card (logo placeholder, hint, quick-adds that create the first stack + pane). A per-stack `+` opens the Markdown/Excalidraw chooser near the button; choosing appends and expands; outside click or Escape closes it. Title bars expand/collapse as an accordion; collapsed bars drag to reorder with a visible insertion indicator; `✕` on a bar drops the pane. The expanded header shows the title as an inline-editable field, with derived titles updating live while typing. Markdown panes edit in a textarea with debounced saves. Persistence lands on browser.storage.local with the fresh schema from the spec (old v0.1 `layout` key ignored); on load, stacks, panes, content, titles, and the expanded pane are restored.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [x] Empty page shows the welcome card; quick-add creates the first stack with the new pane expanded
- [x] Add, expand, collapse, drop, and reorder panes behave per spec stories 12–24 (chooser placement, outside-click/Escape close, insertion indicator, expanded-pane drop expands the one above)
- [x] Titles derive and edit per spec stories 25–31; clearing an edit reverts to the derived title
- [x] Markdown content, titles, and the expanded pane survive a new-tab reload; v0.1 layout data is ignored
- [x] Full re-render on structural changes; input focus is never lost while typing (targeted title sync)

## Comments

- Completed 2026-08-02. `src/newtab.js` is the thin projection (welcome card, per-stack chooser, accordion bars, in-stack pane drag with drop-above/below indicator, inline title editing, markdown textarea); `src/stack/storage.js` is the untested adapter over `browser.storage.local` (key `stacks`, never touches v0.1's `layout`); `src/newtab.html`/`src/newtab.css` rewritten for the stack page. Structure mirrors the validated prototype's variant A.
- Untested by design per the spec's Testing Decisions (no DOM/browser-API tests); the 53 domain tests still pass and `vite build` is green. Manual QA is ticket 09.
- Deviations from the prototype, both bugs fixed rather than carried over: (1) clicking the expanded pane's header now collapses it (story 17; the prototype's expanded head had no click handler); (2) after a drag ends, the browser's trailing click is suppressed for 300ms so a reorder never accidentally expands a bar.
- /code-review found and this ticket fixed a chooser bug that is also latent in the prototype: the document-level outside-click handler fires on the same bubbling click that opens the chooser, so it closed instantly. The opening buttons now `stopPropagation()`. Chooser options are built in JS from the shared icon/label tables (single source of truth; the prototype's static HTML chooser with duplicate glyph markup is not carried over).
- Chooser placement improved over the prototype: it flips above the anchor when it would overflow the viewport bottom, and clamps horizontally.
- Empty stacks render a plain dashed ghost with its own add `+` (story 15); the full ghost-column polish, gutters, grip/stack reorder, stack drop, and the flex/maximum/floor width behavior are ticket 04's scope (this ticket only keeps stacks side by side with a readability floor).
- Excalidraw panes render a placeholder body (story 35's hosted embed is ticket 05's scope), and pane types choose via the chooser / welcome quick-adds only.
