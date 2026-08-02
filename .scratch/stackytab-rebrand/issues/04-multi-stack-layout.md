# 04 — Multi-stack layout

**What to build:** The page becomes a horizontal row of stacks. `+` buttons in gutters — between stacks and at both outer edges — insert a new empty stack at exactly that position. Each stack gets a grip strip at its top (drag to reorder stacks horizontally, with an insertion indicator) and a `✕` at its top-right on hover that drops the whole stack. Each stack column has its own `+` at the bottom for adding panes to that stack. Empty stacks render as slim dashed ghost columns with their own add affordance; dropping a stack's last pane returns it to ghost form. Stack widths flex to fill up to a comfortable maximum and floor at a minimum, with the row scrolling horizontally beyond that. Each stack keeps its own expanded pane, persisted across sessions. Pane drag is scoped to its own stack; stack drag is scoped to other stacks' grips.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Edge and between-stack gutters insert a new empty stack at the correct position
- [ ] Stack `✕` drops the stack with its panes; grip drag reorders stacks with an insertion indicator
- [ ] Empty stacks render as ghost columns; dropping the last pane of a stack returns it to ghost form
- [ ] Widths flex to the per-stack maximum (a single stack is wide), floor at the minimum, and the row scrolls horizontally when stacks exceed the window
- [ ] Each stack's expanded pane persists independently across sessions
- [ ] Pane drag/drop is rejected outside its own stack; stack drag/drop is rejected on the same stack
