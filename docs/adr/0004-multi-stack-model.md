# Multi-stack row of accordions (supersedes ADR-0001)

The new tab page is a horizontal row of **stacks** (columns), each an independent accordion with exactly one expanded pane at a time. Stacks are added via `+` buttons in the gutters between and beside stacks, dropped via a hover `✕`, and reordered by dragging a grip strip. Panes are added per stack, dropped per pane, and reordered within their own stack. This **supersedes ADR-0001**, which fixed a single vertical stack: with multiple stacks the expand question is per stack, and the page needs its own empty state (the welcome card) distinct from a single empty stack's ghost column.

The full state shape and action semantics live in the pure domain module `src/stack/domain.js`, the single test seam for the interaction model.
