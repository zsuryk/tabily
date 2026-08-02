# 05 — Pane content: Excalidraw embed + Markdown preview

**What to build:** Excalidraw panes render the hosted excalidraw.com iframe per ADR-0002 (`embed` + `iframe` params); canvas scenes round-trip over postMessage with debounced saves, and the iframe theme follows the page's theme, flipping on system change. Markdown panes gain a preview mode alongside the v0.1-style textarea, toggling between editing and rendered reading without losing the draft.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] An Excalidraw pane shows the embedded canvas; drawn scenes survive a new-tab reload
- [ ] The canvas theme matches the page theme and flips when the system scheme changes
- [ ] Markdown preview mode toggles and renders the note; switching back preserves the textarea draft
- [ ] All saves are debounced — no save button anywhere
