# Single-stack accordion model

**Superseded by ADR-0004 (multi-stack row of accordions).**

The new tab page is one vertical stack of panes with exactly one pane expanded at a time; pressing any title bar collapses the current expanded pane and expands that one. This replaces the v0.1 grid dashboard (free-form draggable/resizable panes), which was abandoned as part of the stackytab rebrand. A single stack keeps the interaction model to one question per gesture (add/expand/drop/reorder) and fits the product's name; multiple stacks were considered and rejected for v1 scope.
