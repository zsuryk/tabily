# stackytab rebrand: multi-stack new tab page

Status: ready-for-agent

Sources: grilling sessions (settled decisions 1–21, recorded in `/tmp/opencode/stackytab-handoff.md`), the validated interaction prototype at `prototype/`, and ADRs 0001–0003. Domain vocabulary follows `CONTEXT.md`.

## Problem Statement

The current new tab page (v0.1) is a free-form grid dashboard with draggable/resizable panes — it is dated, and it doesn't match how I actually want to use a new tab page: a stack of editable panes I can scan, open one at a time, and organize in columns. The extension is also built on a hand-rolled, no-build stack that only works in Chrome. I want a modern, multi-stack page: horizontal columns of panes, one expanded per column, with quick add/drop/reorder for both panes and stacks, that works in Chrome and Firefox.

## Solution

The new tab page becomes a horizontal row of **stacks** (columns). Each stack is an independent accordion: **collapsed panes** show as title bars; **exactly one pane per stack** is **expanded** at a time. Stacks are added via `+` buttons in **gutters** between stacks and at both outer edges (the new stack is inserted at that spot), dropped via `✕` at the stack's top-right on hover, and reordered by dragging a grip strip at the stack's top. Panes are added via a per-stack `+` at the bottom of each column, which opens a chooser (Markdown / Excalidraw). Empty stacks appear as slim dashed ghost columns; a page with zero stacks shows a welcome card with quick-adds. Pane titles are derived (Markdown: first non-empty line, fallback "Untitled"; Excalidraw: "Canvas N" per stack) and editable inline in the expanded header. Theme follows the system with dark fallback; brand is indigo/violet with a stacked-panes logo. The whole interaction model was validated in the interaction prototype (`prototype/`) — the user confirmed it matches their idea.

## User Stories

1. As a user, I want the welcome card (logo placeholder, hint text, quick-add buttons) to show when the page has zero stacks, so that I understand what the page is and how to start.
2. As a new user, I want welcome-card quick-add buttons for Markdown and Excalidraw, so that my first pane is one click away.
3. As a new user, I want welcome-card quick-add to create the first stack with the new pane expanded in it, so that I immediately land inside my first pane.
4. As a user, I want to add a stack by clicking the `+` in the gutter between two stacks, so that the new stack appears at exactly that position.
5. As a user, I want to add a stack by clicking the `+` in the gutters at the outer edges, so that I can append at the start or the end.
6. As a user, I want a newly added stack to be an empty ghost column, so that I can fill it at my own pace.
7. As a user, I want a `✕` to appear at a stack's top-right on hover so that I can drop the whole stack, including all its panes.
8. As a user, I want to drag a stack by the grip strip at its top to reorder stacks horizontally, so that I can arrange my columns.
9. As a user, I want stack widths to flex so they fill the window up to a comfortable maximum, so that panes are as wide and readable as possible.
10. As a user, I want the row of stacks to scroll horizontally when stacks exceed the window width, so that many stacks stay readable at a minimum width.
11. As a user, I want a `+` at the bottom of each stack column, so that I can add a pane to exactly the stack I am looking at.
12. As a user, I want clicking a stack's bottom `+` to open a chooser with Markdown and Excalidraw options near the button, so that I can pick the pane type in context.
13. As a user, I want choosing a type in the chooser to append the new pane at the bottom of that stack and expand it, so that I can start using it immediately.
14. As a user, I want the chooser to close when I click outside it or press Escape, so that I can cancel the add.
15. As a user, I want an empty stack's ghost column to offer its own add-pane `+`, so that the affordance exists in the empty state too.
16. As a user, I want to click a collapsed title bar to expand that pane, so that I can open a pane in its stack.
17. As a user, I want clicking the expanded pane's header to collapse it back to a title bar, so that I can tidy the stack.
18. As a user, I want expanding a pane in one stack to leave other stacks' expanded panes untouched, so that each stack keeps its own open pane.
19. As a user, I want the expanded pane in each stack to persist across new-tab sessions, so that I return to where I left off.
20. As a user, I want to drag a collapsed title bar up or down within its stack to reorder panes, so that I control the order in each column.
21. As a user, I want a visible insertion indicator while dragging a title bar, so that I know where the pane will land.
22. As a user, I want to drop a pane with the `✕` on its title bar, so that I can remove unwanted panes.
23. As a user, I want dropping the currently expanded pane to expand the pane above it, so that the stack never silently loses its expanded pane.
24. As a user, I want a stack to return to its ghost column form when its last pane is dropped, so that empty stacks look consistent.
25. As a user, I want a Markdown pane's title to derive from the first non-empty line of the note, so that titles track content.
26. As a user, I want a Markdown pane with no content to be titled "Untitled", so that it never shows a blank title.
27. As a user, I want Excalidraw panes to be numbered "Canvas N" within their stack, so that they are distinguishable without content.
28. As a user, I want to edit a pane's title inline in the expanded header, so that I can rename without leaving the page.
29. As a user, I want clearing my edited title to revert to the derived title, so that I can undo a rename.
30. As a user, I want the derived title to update live as I type the first line of a note, so that the title always matches the content.
31. As a user, I want title edits to persist across sessions, so that my names survive.
32. As a user, I want to write Markdown in the expanded pane in a plain textarea, so that I can take notes quickly.
33. As a user, I want a preview mode for Markdown panes, so that I can read my notes rendered.
34. As a user, I want my note content and canvas scenes to persist as I work, without a save button, so that I never lose work.
35. As a user, I want an Excalidraw pane to embed the hosted excalidraw.com canvas, so that I can draw without a heavyweight bundle.
36. As a user, I want the embedded canvas to follow the page theme (light/dark), so that the drawing surface matches my setup.
37. As a user, I want the page to follow my system color scheme with dark as the fallback, so that it matches my OS.
38. As a user, I want the indigo/violet accent and stacked-panes logo, so that the page feels like a coherent brand.
39. As a user, I want a modern visual design — proper typography, a real icon set, refined spacing/radius/shadows, and subtle motion — so that the page does not look dated.
40. As a user, I want the extension to work in both Chrome and Firefox (MV3), so that I can use my browser of choice.
41. As an existing v0.1 user, I want my old grid layout data to be ignored safely, so that the new page starts fresh without errors.

## Implementation Decisions

1. **Architecture rewrite** — the extension is rebuilt on Vite + `webextension-polyfill`, one shared MV3 manifest for Chrome and Firefox (ADR-0003). v0.1's plain-script layout, `src/main.js` (grid rendering), `src/storage.js`, hand-rolled `src/browser-polyfill.js`, and grid-era `css/styles.css` are replaced wholesale. The custom-html pane module is deleted (settled decision 4).
2. **Single test seam: a pure domain module** — all multi-stack state and actions live in one dependency-free module (no DOM, no browser APIs), roughly `src/stack/`. The UI is a thin projection that subscribes to state changes; storage and browser APIs sit behind a thin untested adapter. This matches the prototype's in-memory model (prototype/stack.js), whose state shape is preserved as-is:
   ```ts
   // state shape, from the prototype
   type State = { stacks: Stack[] };
   type Stack = { id: string; panes: Pane[]; expandedId: string | null };
   type Pane  = { id: string; type: "markdown" | "excalidraw";
                  titleOverride: string | null; content: string };
   ```
   Action semantics (from the prototype): `addStackAt(index)` inserts an empty stack; `dropStack(id)` removes stack + panes; `reorderStack(dragId, targetIdx)` moves with splice semantics (drop before vs after the target depends on the pointer's half of the target element); `addPane(stackId, type)` appends and sets that stack's `expandedId`; `dropPane` sets `expandedId` to the pane above (or null when none); `setExpanded` toggles within a stack only; `setContent`/`setTitle` update in place, and an emptied `titleOverride` reverts to the derived title.
3. **Derived titles** — `titleOf(stack, pane)`: an override if set; else for Markdown the first non-empty line (leading `#`s stripped) or "Untitled"; else "Canvas N" where N is the pane's 1-based ordinal among Excalidraw panes in its stack.
4. **Rendering** — thin projection of state. Full re-render on structural changes (add/drop/reorder/expand); targeted title updates while typing so input focus is never lost (prototype `syncTitles` pattern).
5. **Persistence** — a fresh storage schema under `browser.storage.local` (settled decision 9: old `layout` key is ignored, no migration). Stores stacks with panes (type, content, titleOverride) and each stack's `expandedId`. Markdown typing and canvas scene saves are debounced (v0.1's `excalidraw.js` already established the debounced postMessage pattern).
6. **Excalidraw** — hosted iframe embed per ADR-0002 (`?theme=dark&embed&iframe` on excalidraw.com), scenes round-trip over postMessage, theme flips with the system scheme.
7. **Markdown** — keep v0.1's click-to-edit textarea + preview model (settled decision 11); the vendored `marked` engine stays.
8. **Visual design is a requirement, not a nicety** — the user's only critique of the prototype was that "the interface looks old"; this must be prevented in the implementation. At minimum: a real webfont (fontsource-bundled, Inter/Geist-class), a coherent icon set (lucide-style) instead of glyphs and dots, a deliberate radius/spacing scale, soft shadows and glows, frosted/translucent surfaces, subtle motion on expand/hover/drag, and polished empty states and canvas placeholders.
9. **Brand** — indigo/violet accent and an SVG stacked-panes logo for in-page UI; manifest icons must be PNG rasters (settled decision 12).
10. **Theme** — system-following via `prefers-color-scheme` with dark as the fallback; the Excalidraw iframe follows.
11. **No stack titles in v1** — stacks are unnamed columns (prototype grilling decision 21); revisit in a later spec.
12. **No cross-stack pane dragging in v1** — pane drag/drop targets are scoped to their own stack (prototype behavior), and stack drag targets are scoped to other stacks' grips.

## Testing Decisions

- **What makes a good test**: tests exercise only the domain module's external behavior — given a state and an action, assert the resulting observable state (stacks, panes, expandedIds, derived titles, serialized output). Never assert internal implementation details (loop mechanics, intermediate arrays).
- **What is tested**: all actions (`addStackAt`, `dropStack`, `reorderStack`, `addPane`, `dropPane`, `setExpanded`, `reorderPane`, `setContent`, `setTitle`), title derivation (first line, `#` stripping, "Untitled", "Canvas N" numbering including renumbering after drops/reorders), serialization round-trips, and edge cases: dropping the expanded pane (expands the one above, or none), dropping the last pane (stack becomes empty), reordering to the ends, empty-title revert, title override persistence.
- **What is not tested**: DOM rendering, the browser API / storage adapter, the Excalidraw iframe, the manifest, theming. These stay thin and are validated by manual testing in both browsers.
- **Prior art**: none — v0.1 has no tests. These will be the repo's first; the prototype's state readout was the manual equivalent and its behavior tables become the test cases. Tests run under vitest in a node environment (no jsdom); the domain module's zero-import rule is what makes this possible.

## Out of Scope

- Stack titles / renaming stacks
- Dragging panes between stacks
- Offline Excalidraw (revisit per ADR-0002 if it becomes a requirement)
- custom-html panes (removed)
- Search / command palette over panes
- Resizable pane heights or any grid-era drag/resize
- Multi-window or multi-device sync
- i18n
- The prototype's variant switcher and state readout (prototype-only, never ships)

## Further Notes

- **ADR-0001 is superseded** by the multi-stack model — it must be revised (or a superseding ADR written) and `CONTEXT.md`'s glossary updated ("there is exactly one stack" → any number of stacks; expand/collapse per stack; new terms: gutter, stack drop, stack reorder, ghost column). Do this as part of the implementation, not deferred.
- **Prototype as primary source**: per the prototype skill, `prototype/` lands on a throwaway branch (not main) once the implementation captures its decisions, with a pointer on the relevant implementation ticket.
- Route to ship: `/to-tickets` next, then `/implement` per ticket (each drives `/tdd` internally and closes with `/code-review` — Standards + Spec axes).
