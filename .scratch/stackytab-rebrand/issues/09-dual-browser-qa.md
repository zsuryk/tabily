# 09 — Dual-browser QA

**What to build:** The final verification gate: a full manual pass against the spec's user stories in both Chrome and Firefox — interactions (add/expand/collapse/drop/reorder for panes and stacks, gutters, chooser, ghost columns), persistence across new-tab sessions, theming, icons, permissions, the Firefox gecko id, and edge cases (dropping the expanded pane, empty stacks, many-stack scrolling). Any defect found becomes a follow-up ticket; this one closes the feature.

**Blocked by:** 04, 05, 07

**Status:** ready-for-agent

- [ ] All spec user stories verified manually in both Chrome and Firefox
- [ ] No console errors in either browser; storage uses the new schema and the old `layout` key is ignored
- [ ] Extension name, icon, and branding render correctly in both browsers' extension UI

## Comments

### Automated QA pass (2026-08-02, agent)

Everything verifiable without a browser was checked; one defect found and fixed:

- **Tests**: 53/53 pass (`npm test`) — all domain actions, title derivation, serialization round-trips, edge cases.
- **Build**: `npm run build` is clean; `dist/` is fully assembled (newtab.html, assets, manifest.json, 4 PNG icons).
- **Manifest**: MV3; name/description "stackytab"; icons 16/32/48/128 all valid PNGs; gecko id `{4b53e80a-c5f8-452a-a9c2-7e292e13020a}` present; permissions `storage` + `unlimitedStorage` (both fine in Chrome and Firefox).
- **Old `layout` key**: `src/stack/storage.js` only ever touches keys `stacks` and `scenes`; the only "layout" reference in `src/` is a comment. `load()` also tolerates any non-object, so a v0.1 grid payload is ignored safely.
- **Defect → follow-up ticket 10**: `color-mix()` in CSS requires Firefox 113+, but `strict_min_version` claimed 109.0 (Firefox 109–112 would drop ghost/welcome/canvas backgrounds as invalid). Fixed in-session: `strict_min_version` → `113.0`, verified in `dist/manifest.json`.
- **User stories**: 41/41 mapped to code paths; 39 verified by static review. Two need a live browser: the Excalidraw iframe handshake + scene round-trip and theme flip (35, 36), and the visual design pass (39).

### Manual checklist (user)

The three unchecked boxes above are the remaining human pass. Suggested drill, per browser (load unpacked from `dist/`):

1. Fresh profile: welcome card → quick-add Markdown and Excalidraw (first stack created, pane expanded).
2. Gutters: `+` at both outer edges and between stacks; new stack is a ghost column.
3. Ghost column `+` and stack-bottom `+`: chooser opens near the button, closes on outside click / Escape.
4. Expand/collapse: bar click, header click; each stack keeps its own expanded pane.
5. Reorder: drag bars within a stack (insertion indicator visible); drag grips across the row.
6. Edge cases: drop the expanded pane (expands the one above), drop the last pane (stack → ghost column), drop a whole stack, many stacks → horizontal scroll.
7. Titles: first-line derivation, `#` stripping, "Untitled", "Canvas N", inline edit, clear → revert, live update while typing the first line.
8. Markdown preview toggle; Excalidraw canvas loads, scene survives tab reload; OS theme flip updates the canvas.
9. Persistence: reload the new-tab page — stacks, expanded panes, titles, content, scenes all survive; check `browser.storage.local` shows `stacks` + `scenes` keys only (no `layout`).
10. No console errors; check `about:debugging` (Firefox) / `chrome://extensions` (Chrome) for name, icon, description.
