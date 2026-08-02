# 05 — Pane content: Excalidraw embed + Markdown preview

**What to build:** Excalidraw panes render the hosted excalidraw.com iframe per ADR-0002 (`embed` + `iframe` params); canvas scenes round-trip over postMessage with debounced saves, and the iframe theme follows the page's theme, flipping on system change. Markdown panes gain a preview mode alongside the v0.1-style textarea, toggling between editing and rendered reading without losing the draft.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] An Excalidraw pane shows the embedded canvas; drawn scenes survive a new-tab reload
- [x] The canvas theme matches the page theme and flips when the system scheme changes
- [x] Markdown preview mode toggles and renders the note; switching back preserves the textarea draft
- [x] All saves are debounced — no save button anywhere

## Comments

- Completed 2026-08-02. `src/newtab.js`: `canvasEl` embeds `https://excalidraw.com/?theme=<light|dark>&embed&iframe` per ADR-0002 (sandbox `allow-scripts allow-same-origin allow-popups allow-forms`, `allow` clipboard, lazy loading). A single global `message` listener routes by `e.source` through `canvasRegistry` (contentWindow → `{ paneId, iframe }`), restores scenes on `excalidraw-ready` via `loadScene`, and caches scene payloads normalized to `{elements, appState}` with an 800 ms debounced save (the v0.1-established pattern). `matchMedia("(prefers-color-scheme: light)")` drives `currentTheme()`; on change, mounted iframes re-embed with the new theme (fresh scene comes back from the in-memory cache, so pending unsaved strokes survive the reload). One `save()` path flushes state + scenes, all timers cleared on fire, plus a `pagehide` flush so nothing is lost when the tab dies inside a debounce window.
- Scenes deliberately stay OUT of the domain module (spec decision 2 freezes the pane shape to `{id, type, titleOverride, content}`): the storage adapter (`src/stack/storage.js`) gained a separate `scenes` key (paneId → scene message), loaded at boot alongside `stacks` and pruned of orphaned pane ids on every save. The 53 domain tests are untouched and still pass.
- Markdown preview: `markdownBodyEl` wraps the textarea in `.md-wrap` with a `.pane-preview` div and an eye/pencil icon toggle in the expanded header (`.view-toggle`, focus-visible revealed, aria-label follows state). Switching to preview renders `pane.content` through the vendored `marked` (side-effect-imported; the UMD attaches to `globalThis`); clicking the rendered note (v0.1's click-to-edit model, settled decision 11) or the toggle returns to the textarea with the cursor at the end. The draft is never lost: every keystroke commits to domain state, and the textarea element itself is only hidden, never torn down. Preview is ephemeral UI state — a structural re-render resets to edit mode, which is fine since the draft lives in state.
- Theme interplay with ticket 06: the iframe follows `prefers-color-scheme` with dark fallback; the page itself is still pinned dark until 06 wires the page theme to the same source — on a light OS the canvas will briefly flip light against the dark page. Noted, not fixed here (page theme is 06's deliverable).
- The full-re-render model (spec decision 4) means a structural change elsewhere reloads an open canvas; scenes return via `loadScene` from the cache. Acceptable per spec; noted for ticket 07 if it needs polish.
- Not tested by design (spec Testing Decisions): DOM rendering, the storage adapter, the Excalidraw iframe, theming — all validated manually. `npm test` (53) and `vite build` are green; the bundle carries the vendored `marked` and the excalidraw URL.
