# 09 — Dual-browser QA

**What to build:** The final verification gate: a full manual pass against the spec's user stories in both Chrome and Firefox — interactions (add/expand/collapse/drop/reorder for panes and stacks, gutters, chooser, ghost columns), persistence across new-tab sessions, theming, icons, permissions, the Firefox gecko id, and edge cases (dropping the expanded pane, empty stacks, many-stack scrolling). Any defect found becomes a follow-up ticket; this one closes the feature.

**Blocked by:** 04, 05, 07

**Status:** ready-for-agent

- [ ] All spec user stories verified manually in both Chrome and Firefox
- [ ] No console errors in either browser; storage uses the new schema and the old `layout` key is ignored
- [ ] Extension name, icon, and branding render correctly in both browsers' extension UI
