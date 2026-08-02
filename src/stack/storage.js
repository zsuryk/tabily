// Thin adapter between the domain module and browser.storage.local.
// Untested by design (spec Testing Decisions); validated manually.
// The v0.1 "layout" key is never read or written — this schema is fresh.
import browser from "webextension-polyfill";
import { load, serialize } from "./domain.js";

const KEY = "stacks";

export async function loadState() {
  const stored = await browser.storage.local.get(KEY);
  return load(stored[KEY]);
}

export function saveState(state) {
  return browser.storage.local.set({ [KEY]: serialize(state) });
}
