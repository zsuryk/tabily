// New tab page — a thin projection of the stack domain module.
// Structural changes (add/drop/reorder/expand) re-render the page; typing
// paths update titles in place so input focus is never lost. Persistence
// goes through the storage adapter, debounced for typing.
import * as domain from "./stack/domain.js";
import { loadState, saveState } from "./stack/storage.js";

const TYPES = { markdown: "Markdown", excalidraw: "Excalidraw" };

const app = document.getElementById("app");
const chooser = el("div", "chooser");
chooser.hidden = true;
document.body.appendChild(chooser);

let state = domain.createState();
let chooserStackId = null;
let saveTimer = null;
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
  saveState(state).catch((err) => console.error("stackytab: save failed", err));
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 300);
}

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

function bodyEl(stack, pane) {
  if (pane.type === "excalidraw") {
    const stub = el("div", "canvas-stub");
    stub.appendChild(el("span", null, "Excalidraw canvas — placeholder"));
    return stub;
  }
  const ta = el("textarea", "pane-textarea");
  ta.placeholder = "Write… the first line becomes the pane title.";
  ta.value = pane.content;
  ta.addEventListener("input", () => {
    domain.setContent(state, stack.id, pane.id, ta.value);
    syncTitles(stack.id, pane.id);
    scheduleSave();
  });
  return ta;
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
  head.append(dotEl(pane), titleInput(stack, pane), el("span", "type-chip", TYPES[pane.type]), dropBtn(stack, pane));
  head.addEventListener("click", (e) => {
    if (e.target.closest("input, button")) return;
    toggleExpanded(stack.id, pane.id);
  });
  const body = el("div", "pane-body");
  body.appendChild(bodyEl(stack, pane));
  wrap.append(head, body);
  return wrap;
}

// ---------- drag (collapsed panes within a stack) ----------

let drag = null;

const canDrop = (drag, stack, pane) =>
  !!drag && drag.kind === "pane" && drag.id !== pane.id && drag.stackId === stack.id;

function dropHalf(node, e) {
  const rect = node.getBoundingClientRect();
  return e.clientY - rect.top >= rect.height / 2;
}

function setDropIndicator(node, e) {
  node.classList.toggle("drop-above", !dropHalf(node, e));
  node.classList.toggle("drop-below", dropHalf(node, e));
}

function dropTargetIndex(node, e) {
  return (dropHalf(node, e) ? 1 : 0) + Number(node.dataset.index);
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
    setDropIndicator(node, e);
  });
  node.addEventListener("dragleave", () => node.classList.remove("drop-above", "drop-below"));
  node.addEventListener("drop", (e) => {
    e.preventDefault();
    node.classList.remove("drop-above", "drop-below");
    if (!canDrop(drag, stack, pane)) return;
    reorderPane(stack.id, drag.id, dropTargetIndex(node, e));
    drag = null;
  });
}

// ---------- stack column ----------

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

function stackEl(stack) {
  const s = el("div", "stack");
  s.dataset.stackId = stack.id;
  if (!stack.panes.length) {
    s.appendChild(ghostEl(stack));
  } else {
    stack.panes.forEach((pane, i) => {
      const node = pane.id === stack.expandedId ? expandedPaneEl(stack, pane) : barEl(stack, pane);
      node.dataset.index = i;
      s.appendChild(node);
    });
  }
  s.appendChild(stackAddBtn(stack));
  return s;
}

// ---------- render ----------

function render() {
  app.textContent = "";
  if (!state.stacks.length) {
    app.appendChild(welcomeEl());
    return;
  }
  for (const stack of state.stacks) app.appendChild(stackEl(stack));
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
  .then((loaded) => {
    state = loaded;
    render();
  })
  .catch((err) => {
    console.error("stackytab: load failed, starting empty", err);
    render();
  });
