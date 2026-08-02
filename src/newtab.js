// New tab page — a thin projection of the stack domain module.
// Structural changes (add/drop/reorder/expand) re-render the page; typing
// paths update titles in place so input focus is never lost. Persistence
// goes through the storage adapter, debounced for typing.
import * as domain from "./stack/domain.js";
import { loadState, saveState } from "./stack/storage.js";
import "./lib/marked.min.js";

const marked = globalThis.marked;

const TYPES = { markdown: "Markdown", excalidraw: "Excalidraw" };

const app = document.getElementById("app");
const chooser = el("div", "chooser");
chooser.hidden = true;
document.body.appendChild(chooser);

let state = domain.createState();
const scenes = {}; // paneId -> excalidraw scene message
const canvasRegistry = new Map(); // iframe contentWindow -> { paneId, iframe }
let chooserStackId = null;
let saveTimer = null;
let sceneSaveTimer = null;
let suppressClickUntil = 0;

// ---------- element helpers ----------

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const NS = "http://www.w3.org/2000/svg";

function icon(paths) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of paths) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.appendChild(p);
  }
  return svg;
}

const ICONS = {
  markdown: icon([
    "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
    "M14 2v4a2 2 0 0 0 2 2h4",
    "M10 9H8",
    "M16 13H8",
    "M16 17H8",
  ]),
  excalidraw: icon([
    "M12 19l7-7 3 3-7 7-3-3z",
    "M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z",
    "M2 2l7.586 7.586",
    "M11 11l3-3",
  ]),
  close: icon(["M18 6 6 18", "m6 6 12 12"]),
  plus: icon(["M12 5v14", "M5 12h14"]),
  eye: icon([
    "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  ]),
  pencil: icon(["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"]),
  grip: icon([
    "M5 9V7c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1Z",
    "M5 15v-2c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1Z",
    "M12 9V7c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1Z",
    "M12 15v-2c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1Z",
    "M19 9V7c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1Z",
    "M19 15v-2c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1Z",
  ]),
};

const dotEl = (pane) => el("span", "dot " + pane.type);

function logo() {
  const wrap = el("div", "logo");
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("fill", "none");
  const defs = document.createElementNS(NS, "defs");
  const g = document.createElementNS(NS, "linearGradient");
  g.setAttribute("id", "stackytab-logo-grad");
  g.setAttribute("x1", "0");
  g.setAttribute("y1", "0");
  g.setAttribute("x2", "1");
  g.setAttribute("y2", "1");
  for (const [off, col] of [[0, "#818cf8"], [1, "#a78bfa"]]) {
    const stop = document.createElementNS(NS, "stop");
    stop.setAttribute("offset", off);
    stop.setAttribute("stop-color", col);
    g.appendChild(stop);
  }
  defs.appendChild(g);
  svg.appendChild(defs);
  for (const [y, w, opacity] of [[10, 40, 0.55], [24, 52, 0.8], [40, 46, 1]]) {
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("x", String((64 - w) / 2));
    r.setAttribute("y", String(y));
    r.setAttribute("width", String(w));
    r.setAttribute("height", "14");
    r.setAttribute("rx", "7");
    r.setAttribute("fill", "url(#stackytab-logo-grad)");
    r.setAttribute("opacity", String(opacity));
    svg.appendChild(r);
  }
  wrap.appendChild(svg);
  return wrap;
}

// ---------- actions ----------

function commit(fn) {
  fn();
  render();
  save();
}

function save() {
  clearTimeout(saveTimer);
  clearTimeout(sceneSaveTimer);
  saveState(state, scenes).catch((err) => console.error("stackytab: save failed", err));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 300);
}

function scheduleSceneSave() {
  clearTimeout(sceneSaveTimer);
  sceneSaveTimer = setTimeout(save, 800);
}

window.addEventListener("pagehide", save);

function quickAdd(type) {
  commit(() => domain.quickAdd(state, type));
}

function addPane(stackId, type) {
  commit(() => domain.addPane(state, stackId, type));
}

function dropPane(stackId, paneId) {
  commit(() => domain.dropPane(state, stackId, paneId));
}

function toggleExpanded(stackId, paneId) {
  commit(() => domain.setExpanded(state, stackId, paneId));
}

function reorderPane(stackId, dragId, targetIdx) {
  commit(() => domain.reorderPane(state, stackId, dragId, targetIdx));
}

function addStackAt(index) {
  commit(() => domain.addStackAt(state, index));
}

function dropStack(stackId) {
  commit(() => domain.dropStack(state, stackId));
}

function reorderStack(dragId, targetIdx) {
  commit(() => domain.reorderStack(state, dragId, targetIdx));
}

// ---------- welcome card ----------

function welcomeEl() {
  const w = el("div", "welcome");
  w.appendChild(logo());
  w.appendChild(el("h1", null, "Start your stack"));
  w.appendChild(
    el(
      "p",
      "welcome-hint",
      "One pane expanded per stack. Add your first note or canvas — the first line becomes the title, and more stacks are one click away."
    )
  );
  const row = el("div", "welcome-actions");
  for (const type of ["markdown", "excalidraw"]) {
    const b = el("button", "btn " + (type === "markdown" ? "btn-primary" : "btn-secondary"));
    b.appendChild(ICONS[type].cloneNode(true));
    b.appendChild(el("span", null, TYPES[type]));
    b.addEventListener("click", () => quickAdd(type));
    row.appendChild(b);
  }
  w.appendChild(row);
  return w;
}

// ---------- chooser ----------

for (const type of ["markdown", "excalidraw"]) {
  const b = el("button", "chooser-option");
  b.appendChild(ICONS[type].cloneNode(true));
  b.appendChild(el("span", null, TYPES[type]));
  b.addEventListener("click", () => {
    chooser.hidden = true;
    if (chooserStackId) addPane(chooserStackId, type);
  });
  chooser.appendChild(b);
}

function openChooserAt(rect, stackId) {
  chooserStackId = stackId;
  chooser.hidden = false;
  const width = chooser.offsetWidth;
  const height = chooser.offsetHeight;
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
  const below = rect.bottom + 8;
  const top = below + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 8) : below;
  chooser.style.left = left + "px";
  chooser.style.top = top + "px";
}

document.addEventListener("click", (e) => {
  if (!chooser.hidden && !chooser.contains(e.target)) chooser.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") chooser.hidden = true;
});

// ---------- pane chrome ----------

function dropBtn(stack, pane) {
  const b = el("button", "icon-btn drop-btn");
  b.title = "Drop pane";
  b.setAttribute("aria-label", "Drop pane");
  b.appendChild(ICONS.close.cloneNode(true));
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    dropPane(stack.id, pane.id);
  });
  return b;
}

function titleInput(stack, pane) {
  const input = el("input", "title-input");
  input.type = "text";
  input.value = domain.titleOf(stack, pane);
  input.spellcheck = false;
  input.addEventListener("input", () => {
    domain.setTitle(state, stack.id, pane.id, input.value);
    syncTitles(stack.id, pane.id);
    scheduleSave();
  });
  input.addEventListener("focus", (e) => e.target.select());
  input.addEventListener("blur", () => {
    if (!pane.titleOverride) input.value = domain.titleOf(stack, pane);
  });
  return input;
}

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderMarkdown(text) {
  try {
    return marked.parse(text || "");
  } catch (err) {
    console.error("stackytab: markdown render failed", err);
    return "<pre>" + escapeHtml(text || "") + "</pre>";
  }
}

function markdownBodyEl(stack, pane) {
  const wrap = el("div", "md-wrap");
  const ta = el("textarea", "pane-textarea");
  ta.placeholder = "Write… the first line becomes the pane title.";
  ta.value = pane.content;
  ta.addEventListener("input", () => {
    domain.setContent(state, stack.id, pane.id, ta.value);
    syncTitles(stack.id, pane.id);
    scheduleSave();
  });
  const preview = el("div", "pane-preview");
  const toggle = el("button", "icon-btn view-toggle");
  const setView = (on) => {
    wrap.classList.toggle("preview", on);
    toggle.replaceChildren(on ? ICONS.pencil.cloneNode(true) : ICONS.eye.cloneNode(true));
    toggle.title = on ? "Edit note" : "Preview note";
    toggle.setAttribute("aria-label", toggle.title);
    if (on) {
      preview.innerHTML = renderMarkdown(pane.content);
    } else {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = ta.value.length;
    }
  };
  toggle.addEventListener("click", () => setView(!wrap.classList.contains("preview")));
  preview.addEventListener("click", () => setView(false));
  wrap.append(ta, preview);
  return { node: wrap, headExtra: toggle };
}

const excalidrawSrc = (theme) => `https://excalidraw.com/?theme=${theme}&embed&iframe`;

function currentTheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function canvasEl(stack, pane) {
  const frame = el("div", "canvas-frame");
  const iframe = document.createElement("iframe");
  iframe.className = "excalidraw-iframe";
  iframe.src = excalidrawSrc(currentTheme());
  iframe.allow = "clipboard-read; clipboard-write";
  iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";
  iframe.loading = "lazy";
  frame.appendChild(iframe);
  canvasRegistry.set(iframe.contentWindow, { paneId: pane.id, iframe });
  return { node: frame };
}

window.addEventListener("message", (e) => {
  const entry = canvasRegistry.get(e.source);
  if (!entry) return;
  const msg = e.data;
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "excalidraw-ready") {
    const scene = scenes[entry.paneId];
    if (scene) e.source.postMessage({ type: "loadScene", sceneData: scene }, "*");
    return;
  }
  if (msg.elements && msg.appState) {
    scenes[entry.paneId] = { elements: msg.elements, appState: msg.appState };
    scheduleSceneSave();
  }
});

window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
  const src = excalidrawSrc(currentTheme());
  for (const { iframe } of canvasRegistry.values()) iframe.src = src;
});

function bodyEl(stack, pane) {
  if (pane.type === "excalidraw") return canvasEl(stack, pane);
  return markdownBodyEl(stack, pane);
}

function barEl(stack, pane) {
  const bar = el("div", "bar");
  bar.draggable = true;
  bar.dataset.paneId = pane.id;
  const t = el("span", "bar-title", domain.titleOf(stack, pane));
  t.dataset.title = "";
  bar.append(dotEl(pane), t, dropBtn(stack, pane));
  bar.addEventListener("click", () => {
    if (Date.now() < suppressClickUntil) return;
    toggleExpanded(stack.id, pane.id);
  });
  wirePaneDrag(bar, stack, pane);
  return bar;
}

function expandedPaneEl(stack, pane) {
  const wrap = el("div", "pane");
  const head = el("div", "pane-head");
  head.dataset.paneId = pane.id;
  const { node, headExtra } = bodyEl(stack, pane);
  head.append(dotEl(pane), titleInput(stack, pane), el("span", "type-chip", TYPES[pane.type]));
  if (headExtra) head.appendChild(headExtra);
  head.appendChild(dropBtn(stack, pane));
  head.addEventListener("click", (e) => {
    if (e.target.closest("input, button")) return;
    toggleExpanded(stack.id, pane.id);
  });
  const body = el("div", "pane-body");
  body.appendChild(node);
  wrap.append(head, body);
  return wrap;
}

// ---------- drag (collapsed panes within a stack) ----------

let drag = null;

const canDrop = (drag, stack, pane) =>
  !!drag && drag.kind === "pane" && drag.id !== pane.id && drag.stackId === stack.id;

const canDropStack = (drag, stack) => !!drag && drag.kind === "stack" && drag.id !== stack.id;

function dropHalf(node, e, axis) {
  const rect = node.getBoundingClientRect();
  const pos = axis === "x" ? e.clientX - rect.left : e.clientY - rect.top;
  const size = axis === "x" ? rect.width : rect.height;
  return pos >= size / 2;
}

function setDropIndicator(node, e, axis) {
  node.classList.toggle("drop-above", !dropHalf(node, e, axis));
  node.classList.toggle("drop-below", dropHalf(node, e, axis));
}

function dropTargetIndex(node, e, axis) {
  return (dropHalf(node, e, axis) ? 1 : 0) + Number(node.dataset.index);
}

function clearDropIndicators() {
  document.querySelectorAll(".drop-above, .drop-below").forEach((n) =>
    n.classList.remove("drop-above", "drop-below")
  );
}

function wirePaneDrag(node, stack, pane) {
  node.addEventListener("dragstart", (e) => {
    drag = { kind: "pane", id: pane.id, stackId: stack.id };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", pane.id);
    node.classList.add("dragging");
  });
  node.addEventListener("dragend", () => {
    drag = null;
    clearDropIndicators();
    node.classList.remove("dragging");
    suppressClickUntil = Date.now() + 300;
  });
  node.addEventListener("dragover", (e) => {
    if (!canDrop(drag, stack, pane)) return;
    e.preventDefault();
    setDropIndicator(node, e, "y");
  });
  node.addEventListener("dragleave", () => node.classList.remove("drop-above", "drop-below"));
  node.addEventListener("drop", (e) => {
    e.preventDefault();
    node.classList.remove("drop-above", "drop-below");
    if (!canDrop(drag, stack, pane)) return;
    reorderPane(stack.id, drag.id, dropTargetIndex(node, e, "y"));
    drag = null;
  });
}

function wireStackDrag(node, stack) {
  node.addEventListener("dragstart", (e) => {
    drag = { kind: "stack", id: stack.id };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", stack.id);
    node.classList.add("dragging");
  });
  node.addEventListener("dragend", () => {
    drag = null;
    clearDropIndicators();
    node.classList.remove("dragging");
  });
  node.addEventListener("dragover", (e) => {
    if (!canDropStack(drag, stack)) return;
    e.preventDefault();
    setDropIndicator(node, e, "x");
  });
  node.addEventListener("dragleave", () => node.classList.remove("drop-above", "drop-below"));
  node.addEventListener("drop", (e) => {
    e.preventDefault();
    node.classList.remove("drop-above", "drop-below");
    if (!canDropStack(drag, stack)) return;
    reorderStack(drag.id, dropTargetIndex(node, e, "x"));
    drag = null;
  });
}

// ---------- stack column ----------

function stackDropBtn(stack) {
  const b = el("button", "icon-btn stack-drop");
  b.title = "Drop stack";
  b.setAttribute("aria-label", "Drop stack");
  b.appendChild(ICONS.close.cloneNode(true));
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    dropStack(stack.id);
  });
  return b;
}

function stackChrome(stack) {
  const strip = el("div", "stack-strip");
  strip.draggable = true;
  const grip = el("span", "stack-grip");
  grip.appendChild(ICONS.grip.cloneNode(true));
  strip.append(grip, stackDropBtn(stack));
  wireStackDrag(strip, stack);
  return strip;
}

function gutterEl(index) {
  const g = el("div", "gutter");
  const b = el("button", "gutter-plus");
  b.title = "Add stack";
  b.setAttribute("aria-label", "Add stack here");
  b.appendChild(ICONS.plus.cloneNode(true));
  b.addEventListener("click", () => addStackAt(index));
  g.appendChild(b);
  return g;
}

function ghostEl(stack) {
  const g = el("button", "ghost");
  g.title = "Add pane";
  g.appendChild(el("span", "ghost-plus", "+"));
  g.appendChild(el("span", "ghost-hint", "add pane"));
  g.addEventListener("click", (e) => {
    e.stopPropagation();
    openChooserAt(g.getBoundingClientRect(), stack.id);
  });
  return g;
}

function stackAddBtn(stack) {
  const b = el("button", "stack-add");
  b.title = "Add pane";
  b.setAttribute("aria-label", "Add pane to this stack");
  b.appendChild(ICONS.plus.cloneNode(true));
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    openChooserAt(b.getBoundingClientRect(), stack.id);
  });
  return b;
}

function stackEl(stack, i) {
  const s = el("div", "stack");
  s.dataset.stackId = stack.id;
  const chrome = stackChrome(stack);
  chrome.dataset.index = i;
  s.appendChild(chrome);
  if (!stack.panes.length) {
    s.appendChild(ghostEl(stack));
  } else {
    stack.panes.forEach((pane, j) => {
      const node = pane.id === stack.expandedId ? expandedPaneEl(stack, pane) : barEl(stack, pane);
      node.dataset.index = j;
      s.appendChild(node);
    });
  }
  s.appendChild(stackAddBtn(stack));
  return s;
}

// ---------- render ----------

function render() {
  canvasRegistry.clear();
  const live = new Set();
  for (const s of state.stacks) for (const p of s.panes) live.add(p.id);
  for (const id of Object.keys(scenes)) if (!live.has(id)) delete scenes[id];
  app.textContent = "";
  if (!state.stacks.length) {
    app.appendChild(welcomeEl());
    return;
  }
  state.stacks.forEach((stack, i) => {
    app.appendChild(gutterEl(i));
    app.appendChild(stackEl(stack, i));
  });
  app.appendChild(gutterEl(state.stacks.length));
}

function syncTitles(stackId, paneId) {
  const stack = state.stacks.find((s) => s.id === stackId);
  if (!stack) return;
  const pane = stack.panes.find((p) => p.id === paneId);
  if (!pane) return;
  const title = domain.titleOf(stack, pane);
  document
    .querySelectorAll(`[data-stack-id="${stackId}"] [data-pane-id="${paneId}"] [data-title]`)
    .forEach((n) => {
      n.textContent = title;
    });
  const input = document.querySelector(
    `[data-stack-id="${stackId}"] [data-pane-id="${paneId}"] .title-input`
  );
  if (input && input !== document.activeElement && !pane.titleOverride) input.value = title;
}

// ---------- boot ----------

loadState()
  .then(({ state: loaded, scenes: loadedScenes }) => {
    state = loaded;
    Object.assign(scenes, loadedScenes);
    render();
  })
  .catch((err) => {
    console.error("stackytab: load failed, starting empty", err);
    render();
  });
