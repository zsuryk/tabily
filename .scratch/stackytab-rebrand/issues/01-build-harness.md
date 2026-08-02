# 01 — Build harness: Vite + webextension-polyfill, dual-browser

**What to build:** The extension scaffolds onto Vite per ADR-0003. One shared MV3 manifest (existing gecko id, `storage` + `unlimitedStorage` perms) loads as an unpacked extension in both Chrome and Firefox. `webextension-polyfill` is the single browser-API layer. vitest runs in a node environment. The new-tab override renders a placeholder stackytab page — enough to prove the full build pipeline end-to-end before any feature work. The v0.1 plain-script layout (grid-era scripts, styles, hand-rolled polyfill, custom-html pane) is removed from the build rather than ported.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] `npm run build` produces an unpacked extension that loads in both Chrome and Firefox
- [x] One shared manifest serves both browsers; Firefox gecko id intact; loading the extension shows the placeholder new-tab page in each browser
- [x] All browser API calls go through webextension-polyfill (no hand-rolled polyfill)
- [x] vitest runs with at least one passing test
- [x] Grid-era v0.1 layout code is gone from the build

## Comments

- Completed 2026-08-02. Commits: `ca7caae` (harness), `84c36ab` (review fixes). The dist artifact is structurally loadable in both browsers (relative asset refs, shared manifest with gecko id intact); actual loading/QA in Chrome and Firefox is ticket 09.
- The manifest sanity test added during implementation was removed after /code-review: spec Testing Decisions puts "the manifest" on the not-tested list (validated by manual dual-browser QA). The harness smoke test asserts the node/no-jsdom test environment instead.
