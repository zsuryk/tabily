# 06 — Theme + brand

**What to build:** The system-following theme layer — `prefers-color-scheme` with dark as the fallback — driving every surface through a token system. The indigo/violet brand accent wires into interactive elements, focus states, and the logo. The SVG stacked-panes logo appears in the welcome card, and manifest icons are shipped as PNG rasters (per settled decision 12).

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The page follows the system color scheme; dark is the fallback when no preference is available
- [ ] All surfaces and interactive elements use the token system; the indigo/violet accent is consistent throughout
- [ ] The stacked-panes logo renders in the welcome card
- [ ] Manifest icons (PNG raster) display correctly in both browsers' extension UI
