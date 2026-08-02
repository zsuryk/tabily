# 02 — Stack domain module + tests

**What to build:** The pure domain module behind the whole interaction model — the single test seam from the spec. It owns the multi-stack state (stacks, panes, per-stack `expandedId`), every action (add stack at a gutter index, drop stack, reorder stack, add pane to a stack, drop pane, toggle expand within a stack, reorder pane, set content, set title, quick-add from the welcome card), derived titles (Markdown: first non-empty line stripped of leading `#`s, fallback "Untitled"; Excalidraw: "Canvas N" numbered within its stack), and serialize/load for storage. It must import nothing from the DOM or browser APIs so vitest runs it in a plain node environment. The state shape and action semantics are settled — see the spec's Implementation Decisions (inlined from the prototype).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] All actions produce the observable state the spec describes: add appends and expands; drop of the expanded pane expands the one above (or none); expand toggles within a stack only; reorder uses the drop-before/after splice semantics
- [ ] Derived titles correct, including "Canvas N" renumbering after drops/reorders and reversion when a title override is cleared
- [ ] serialize/load round-trips panes, content, title overrides, and per-stack expanded panes
- [ ] The module imports nothing from DOM or browser APIs (tests run in pure node)
- [ ] Edge cases covered per the spec's Testing Decisions: drop last pane → empty stack, reorder to the ends, empty content → "Untitled"
