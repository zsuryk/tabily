# Vite build with WebExtension cross-browser support

The extension builds with Vite and targets both Chrome and Firefox (MV3). The `webextension-polyfill` npm package is the single browser-API layer, replacing the hand-rolled `browser-polyfill.js` from v0.1. The same manifest serves both browsers; Firefox-only keys (`browser_specific_settings.gecko`) live in it and are ignored by Chrome. The previous plain-script, no-build layout died with the rebrand.
