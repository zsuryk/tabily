# 01 — Build harness: Vite + webextension-polyfill, dual-browser

**What to build:** The extension scaffolds onto Vite per ADR-0003. One shared MV3 manifest (existing gecko id, `storage` + `unlimitedStorage` perms) loads as an unpacked extension in both Chrome and Firefox. `webextension-polyfill` is the single browser-API layer. vitest runs in a node environment. The new-tab override renders a placeholder stackytab page — enough to prove the full build pipeline end-to-end before any feature work. The v0.1 plain-script layout (grid-era scripts, styles, hand-rolled polyfill, custom-html pane) is removed from the build rather than ported.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `npm run build` produces an unpacked extension that loads in both Chrome and Firefox
- [ ] One shared manifest serves both browsers; Firefox gecko id intact; loading the extension shows the placeholder new-tab page in each browser
- [ ] All browser API calls go through webextension-polyfill (no hand-rolled polyfill)
- [ ] vitest runs with at least one passing test
- [ ] Grid-era v0.1 layout code is gone from the build
