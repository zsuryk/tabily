# 03 — Single-stack interaction + persistence

**What to build:** The stack page becomes real, rendering a thin projection of the domain module. Empty page shows the welcome card (logo placeholder, hint, quick-adds that create the first stack + pane). A per-stack `+` opens the Markdown/Excalidraw chooser near the button; choosing appends and expands; outside click or Escape closes it. Title bars expand/collapse as an accordion; collapsed bars drag to reorder with a visible insertion indicator; `✕` on a bar drops the pane. The expanded header shows the title as an inline-editable field, with derived titles updating live while typing. Markdown panes edit in a textarea with debounced saves. Persistence lands on browser.storage.local with the fresh schema from the spec (old v0.1 `layout` key ignored); on load, stacks, panes, content, titles, and the expanded pane are restored.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Empty page shows the welcome card; quick-add creates the first stack with the new pane expanded
- [ ] Add, expand, collapse, drop, and reorder panes behave per spec stories 12–24 (chooser placement, outside-click/Escape close, insertion indicator, expanded-pane drop expands the one above)
- [ ] Titles derive and edit per spec stories 25–31; clearing an edit reverts to the derived title
- [ ] Markdown content, titles, and the expanded pane survive a new-tab reload; v0.1 layout data is ignored
- [ ] Full re-render on structural changes; input focus is never lost while typing (targeted title sync)
