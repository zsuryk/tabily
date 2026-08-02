# 10 — Firefox min version mismatch: `color-mix()` needs 113, manifest claims 109

**What:** Found during ticket 09's QA sweep. `src/newtab.css` uses `color-mix()` in four places (bar hover border, canvas-placeholder shimmer, ghost column background, welcome card background); `color-mix()` shipped in Firefox 113. `manifest.json`'s `browser_specific_settings.gecko.strict_min_version` says `109.0`, so Firefox 109–112 would drop those declarations as invalid — ghost columns and the welcome card would lose their backgrounds entirely.

**Why it matters:** It is the only binding CSS requirement above 109 (everything else — `backdrop-filter` 103, `:is()` 78, `safe center` 63, `:focus-visible` 85 — is ≤109-compatible), but the manifest must not claim versions the stylesheet doesn't support.

**Status:** ready-for-agent

**Fix:** Bump `strict_min_version` to `113.0`. Firefox 109–112 are long EOL (2026 ESRs are ≥128); keeping 109 would mean silently degraded rendering on browsers nobody is expected to run.

- [x] `strict_min_version` bumped to `113.0` and verified in the built `dist/manifest.json`

## Comments

- Found in ticket 09's automated QA sweep; fixed in the same session.
- Resolved 2026-08-02: manifest `strict_min_version` → `113.0` (commit `ebd661f`). Rebuilt `dist/` so the shipped manifest carries the bump.
