# 02 — Stack domain module + tests

**What to build:** The pure domain module behind the whole interaction model — the single test seam from the spec. It owns the multi-stack state (stacks, panes, per-stack `expandedId`), every action (add stack at a gutter index, drop stack, reorder stack, add pane to a stack, drop pane, toggle expand within a stack, reorder pane, set content, set title, quick-add from the welcome card), derived titles (Markdown: first non-empty line stripped of leading `#`s, fallback "Untitled"; Excalidraw: "Canvas N" numbered within its stack), and serialize/load for storage. It must import nothing from the DOM or browser APIs so vitest runs it in a plain node environment. The state shape and action semantics are settled — see the spec's Implementation Decisions (inlined from the prototype).

**Blocked by:** 01

**Status:** ready-for-agent

- [x] All actions produce the observable state the spec describes: add appends and expands; drop of the expanded pane expands the one above (or none); expand toggles within a stack only; reorder uses the drop-before/after splice semantics
- [x] Derived titles correct, including "Canvas N" renumbering after drops/reorders and reversion when a title override is cleared
- [x] serialize/load round-trips panes, content, title overrides, and per-stack expanded panes
- [x] The module imports nothing from DOM or browser APIs (tests run in pure node)
- [x] Edge cases covered per the spec's Testing Decisions: drop last pane → empty stack, reorder to the ends, empty content → "Untitled"

## Comments

- Completed 2026-08-02. Module at `src/stack/domain.js` (createState, addStackAt, dropStack, reorderStack, addPane, quickAdd, dropPane, setExpanded, reorderPane, setContent, setTitle, titleOf, serialize, load); 53 tests pass in pure node. Per the spec's Further Notes, ADR-0001 is marked superseded by the new ADR-0004 and CONTEXT.md's glossary was rewritten for the multi-stack model (gutter, stack drop, stack reorder, ghost column; "Empty stack" merged into "Ghost column").
- Spec ambiguities resolved as the prototype's written shape/semantics win (both flagged in /code-review's Spec axis): the prototype's `addPane` sets `scene: null`, but the spec's state shape (spec lines 63–69) and persistence decision omit it — domain.js follows the spec, no `scene` field; and `dropPane` on the top pane expands the first remaining pane (`Math.max(0, idx-1)`, prototype behavior), which the spec's "the pane above (or null when none)" wording doesn't capture.
- `load` is defensively shaped (skips non-object/missing-id stacks and panes, defaults missing fields, drops dangling expandedIds) so foreign/corrupt storage data can't break the UI — user story 41 "ignored safely". Per /code-review, id-less stacks are skipped rather than minting ids (avoids id collisions with the module's monotonic counter).
