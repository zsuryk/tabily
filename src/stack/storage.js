// Thin adapter between the domain module and browser.storage.local.
// Untested by design (spec Testing Decisions); validated manually.
// The v0.1 "layout" key is never read or written — this schema is fresh.
// Excalidraw scenes live under their own key, keyed by pane id; scenes of
// dropped panes are pruned on save so the domain module stays scene-free.
import browser from "webextension-polyfill";
import { load, serialize } from "./domain.js";

const KEY = "stacks";
const SCENES_KEY = "scenes";

export async function loadState() {
  const stored = await browser.storage.local.get([KEY, SCENES_KEY]);
  return {
    state: load(stored[KEY]),
    scenes: stored[SCENES_KEY] ?? {},
  };
}

export function saveState(state, scenes) {
  const live = new Set(state.stacks.flatMap((s) => s.panes.map((p) => p.id)));
  const pruned = {};
  for (const [id, scene] of Object.entries(scenes)) {
    if (live.has(id)) pruned[id] = scene;
  }
  return browser.storage.local.set({ [KEY]: serialize(state), [SCENES_KEY]: pruned });
}
