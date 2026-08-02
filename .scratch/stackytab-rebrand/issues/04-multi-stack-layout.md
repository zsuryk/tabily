# 04 — Multi-stack layout

**What to build:** The page becomes a horizontal row of stacks. `+` buttons in gutters — between stacks and at both outer edges — insert a new empty stack at exactly that position. Each stack gets a grip strip at its top (drag to reorder stacks horizontally, with an insertion indicator) and a `✕` at its top-right on hover that drops the whole stack. Each stack column has its own `+` at the bottom for adding panes to that stack. Empty stacks render as slim dashed ghost columns with their own add affordance; dropping a stack's last pane returns it to ghost form. Stack widths flex to fill up to a comfortable maximum and floor at a minimum, with the row scrolling horizontally beyond that. Each stack keeps its own expanded pane, persisted across sessions. Pane drag is scoped to its own stack; stack drag is scoped to other stacks' grips.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Edge and between-stack gutters insert a new empty stack at the correct position
- [x] Stack `✕` drops the stack with its panes; grip drag reorders stacks with an insertion indicator
- [x] Empty stacks render as ghost columns; dropping the last pane of a stack returns it to ghost form
- [x] Widths flex to the per-stack maximum (a single stack is wide), floor at the minimum, and the row scrolls horizontally when stacks exceed the window
- [x] Each stack's expanded pane persists independently across sessions
- [x] Pane drag/drop is rejected outside its own stack; stack drag/drop is rejected on the same stack

## Comments

- Completed 2026-08-02. `src/newtab.js` gained the row chrome: `gutterEl` (dashed gutters with `+` at both outer edges and between stacks, splicing an empty stack at exactly that index via the already-tested `domain.addStackAt`), `stackChrome` (grip strip with a lucide grip icon + hover `✕` that calls `domain.dropStack`), and `wireStackDrag` (horizontal reorder using the same half-based drop-half/insertion-indicator mechanics as pane drag, generalized to an `axis` parameter). `render()` now emits `gutter stack gutter … stack gutter`.
- Layout follows the validated prototype: `.stack` is `flex: 1 1 0` with a 320px floor and a 1280px per-stack maximum; `#app` uses `justify-content: safe center` with `overflow-x: auto`, so a single stack grows wide and centered while many stacks floor at 320px and scroll.
- Scope decisions: `addStackAt`/`dropStack`/`reorderStack` already existed in the pure domain module with tests (ticket 02) — no domain changes were needed. Per-stack `expandedId` persistence was already delivered by ticket 03's storage adapter. UI remains untested by design (spec Testing Decisions); the 53 domain tests pass and `vite build` is green.
- CSS ordering fix noted for future reviewers: `.stack-drop:hover` must come after `.icon-btn:hover` in `newtab.css` or the danger hover style loses at equal specificity.
- No stack titles (ADR-0004 / spec decision 11): the grip strip is unnamed, matching the prototype's validated chrome.
- Deviation from the prototype, a bug fixed rather than carried over: the prototype's `stackChrome` never sets `draggable` on the grip strip, so stack drag could never start there (the interaction was never exercised). The implementation sets `strip.draggable = true` (found by /code-review's spec axis).
