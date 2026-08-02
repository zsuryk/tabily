// PROTOTYPE — throwaway, never ship.
// Plan: multi-stack layout of the stackytab new-tab interaction — a horizontal row of stacks,
// one expanded pane per stack; stacks added via + gutters between/at the sides, per-stack +
// for panes, stacks droppable (x) and draggable to reorder. Within-stack rendering switches
// via ?variant=A|B|C from the floating bar (or arrow keys).
// Run: `npm run prototype` -> http://localhost:8123

// ---------- state (in memory only) ----------

const state = { stacks: [] }; // [{ id, panes: [{ id, type, titleOverride, content }], expandedId }]

let uid = 0;
const nextId = (p) => (p ? "p" : "s") + ++uid;

const TYPES = { markdown: "Markdown", excalidraw: "Excalidraw" };

const firstLine = (text) =>
  (text || "").split("\n").map((s) => s.trim()).find(Boolean)?.replace(/^#+\s*/, "").trim() || "";

function titleOf(stack, pane) {
  if (pane.titleOverride) return pane.titleOverride;
  if (pane.type === "markdown") return firstLine(pane.content) || "Untitled";
  const n = stack.panes.filter((p) => p.type === "excalidraw").findIndex((p) => p.id === pane.id) + 1;
  return "Canvas " + n;
}

// ---------- actions ----------

function addStackAt(index) {
  state.stacks.splice(index, 0, { id: nextId("s"), panes: [], expandedId: null });
  render();
  updateStatePanel();
}

function dropStack(id) {
  const idx = state.stacks.findIndex((s) => s.id === id);
  if (idx !== -1) state.stacks.splice(idx, 1);
  render();
  updateStatePanel();
}

function reorderStack(dragId, targetIdx) {
  const from = state.stacks.findIndex((s) => s.id === dragId);
  if (from === -1 || from === targetIdx) return;
  const [st] = state.stacks.splice(from, 1);
  state.stacks.splice(from < targetIdx ? targetIdx - 1 : targetIdx, 0, st);
  render();
  updateStatePanel();
}

function quickAdd(type) {
  if (!state.stacks.length) addStackAt(0);
  addPane(state.stacks[state.stacks.length - 1].id, type);
}

function addPane(stackId, type) {
  const stack = state.stacks.find((s) => s.id === stackId);
  const pane = { id: nextId("p"), type, titleOverride: null, content: "", scene: null };
  stack.panes.push(pane);
  stack.expandedId = pane.id;
  render();
  updateStatePanel();
}

function dropPane(stackId, paneId) {
  const stack = state.stacks.find((s) => s.id === stackId);
  const idx = stack.panes.findIndex((p) => p.id === paneId);
  if (idx === -1) return;
  stack.panes.splice(idx, 1);
  if (stack.expandedId === paneId) {
    stack.expandedId = stack.panes.length ? stack.panes[Math.max(0, idx - 1)].id : null;
  }
  render();
  updateStatePanel();
}

function setExpanded(stackId, paneId) {
  const stack = state.stacks.find((s) => s.id === stackId);
  stack.expandedId = stack.expandedId === paneId ? null : paneId;
  render();
  updateStatePanel();
}

function reorderPane(stackId, dragId, targetIdx) {
  const stack = state.stacks.find((s) => s.id === stackId);
  const from = stack.panes.findIndex((p) => p.id === dragId);
  if (from === -1 || from === targetIdx) return;
  const [pane] = stack.panes.splice(from, 1);
  stack.panes.splice(from < targetIdx ? targetIdx - 1 : targetIdx, 0, pane);
  render();
  updateStatePanel();
}

function setContent(stackId, paneId, text) {
  state.stacks.find((s) => s.id === stackId).panes.find((p) => p.id === paneId).content = text;
  syncTitles(stackId, paneId);
  updateStatePanel();
}

function setTitle(stackId, paneId, text) {
  state.stacks.find((s) => s.id === stackId).panes.find((p) => p.id === paneId).titleOverride = text.trim() || null;
  syncTitles(stackId, paneId);
  updateStatePanel();
}

// ---------- DOM helpers ----------

const $ = (sel) => document.querySelector(sel);
const app = $("#app");

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const dotEl = (pane) => el("span", "bar-dot " + pane.type);

function dropBtn(stack, pane) {
  const b = el("button", "bar-drop", "✕");
  b.title = "Drop pane";
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    dropPane(stack.id, pane.id);
  });
  return b;
}

function titleInput(stack, pane) {
  const input = el("input", "title-input");
  input.type = "text";
  input.value = titleOf(stack, pane);
  input.spellcheck = false;
  input.addEventListener("input", () => setTitle(stack.id, pane.id, input.value));
  input.addEventListener("focus", (e) => e.target.select());
  return input;
}

function bodyEl(pane) {
  if (pane.type === "excalidraw") return el("div", "canvas-stub", "Excalidraw canvas — placeholder");
  const ta = el("textarea", "pane-textarea");
  ta.placeholder = "Write… the first line becomes the pane title.";
  ta.value = pane.content;
  ta.addEventListener("input", () => setContent(stackOf(pane).id, pane.id, ta.value));
  return ta;
}

function stackOf(pane) {
  return state.stacks.find((s) => s.panes.includes(pane));
}

function welcomeEl() {
  const w = el("div", "welcome");
  w.appendChild(logoSVG());
  w.appendChild(el("h1", null, "Start your stack"));
  w.appendChild(
    el("p", "welcome-hint", "One pane expanded per stack. Add your first note or canvas — then grow more stacks with the + between columns.")
  );
  const row = el("div", "welcome-actions");
  for (const type of ["markdown", "excalidraw"]) {
    const b = el("button", type === "markdown" ? "btn btn-primary" : "btn btn-secondary");
    b.appendChild(el("span", "type-glyph " + type, type === "markdown" ? "M" : "◇"));
    b.appendChild(document.createTextNode(" " + TYPES[type]));
    b.addEventListener("click", () => quickAdd(type));
    row.appendChild(b);
  }
  w.appendChild(row);
  return w;
}

function logoSVG() {
  const NS = "http://www.w3.org/2000/svg";
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("width", "64");
  s.setAttribute("height", "64");
  s.setAttribute("viewBox", "0 0 64 64");
  const defs = document.createElementNS(NS, "defs");
  const g = document.createElementNS(NS, "linearGradient");
  g.setAttribute("id", "stackytab-grad");
  g.setAttribute("x1", "0");
  g.setAttribute("y1", "0");
  g.setAttribute("x2", "1");
  g.setAttribute("y2", "1");
  for (const [off, col] of [[0, "#6366f1"], [1, "#8b5cf6"]]) {
    const st = document.createElementNS(NS, "stop");
    st.setAttribute("offset", off);
    st.setAttribute("stop-color", col);
    g.appendChild(st);
  }
  defs.appendChild(g);
  s.appendChild(defs);
  for (const [y, w, opacity] of [[10, 40, 0.55], [24, 52, 0.8], [40, 46, 1]]) {
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("x", String((64 - w) / 2));
    r.setAttribute("y", String(y));
    r.setAttribute("width", String(w));
    r.setAttribute("height", "14");
    r.setAttribute("rx", "7");
    r.setAttribute("fill", "url(#stackytab-grad)");
    r.setAttribute("opacity", String(opacity));
    s.appendChild(r);
  }
  return s;
}

// ---------- drag (panes within a stack, stacks horizontally) ----------

let drag = null; // { kind: 'pane', id, stackId } | { kind: 'stack', id }

function setDropIndicator(node, e, axis) {
  const rect = node.getBoundingClientRect();
  const pos = axis === "x" ? e.clientX - rect.left : e.clientY - rect.top;
  const size = axis === "x" ? rect.width : rect.height;
  node.classList.toggle("drop-above", pos < size / 2);
  node.classList.toggle("drop-below", pos >= size / 2);
}

function dropTargetIndex(node, e, axis) {
  const rect = node.getBoundingClientRect();
  const pos = axis === "x" ? e.clientX - rect.left : e.clientY - rect.top;
  const size = axis === "x" ? rect.width : rect.height;
  return (pos >= size / 2 ? 1 : 0) + Number(node.dataset.index);
}

function clearDropIndicators() {
  document.querySelectorAll(".drop-above, .drop-below").forEach((n) => n.classList.remove("drop-above", "drop-below"));
}

function wirePaneDrag(node, stack, pane, axis = "y") {
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
  });
  node.addEventListener("dragover", (e) => {
    if (!drag || drag.kind !== "pane" || drag.id === pane.id || drag.stackId !== stack.id) return;
    e.preventDefault();
    setDropIndicator(node, e, axis);
  });
  node.addEventListener("dragleave", () => node.classList.remove("drop-above", "drop-below"));
  node.addEventListener("drop", (e) => {
    e.preventDefault();
    node.classList.remove("drop-above", "drop-below");
    if (!drag || drag.kind !== "pane" || drag.id === pane.id || drag.stackId !== stack.id) return;
    reorderPane(stack.id, drag.id, dropTargetIndex(node, e, axis));
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
    if (!drag || drag.kind !== "stack" || drag.id === stack.id) return;
    e.preventDefault();
    setDropIndicator(node, e, "x");
  });
  node.addEventListener("dragleave", () => node.classList.remove("drop-above", "drop-below"));
  node.addEventListener("drop", (e) => {
    e.preventDefault();
    node.classList.remove("drop-above", "drop-below");
    if (!drag || drag.kind !== "stack" || drag.id === stack.id) return;
    reorderStack(drag.id, dropTargetIndex(node, e, "x"));
    drag = null;
  });
}

// ---------- stack chrome: strip (drag + drop), gutter (+), per-stack add (+) ----------

function stackDropBtn(stack) {
  const b = el("button", "bar-drop stack-drop", "✕");
  b.title = "Drop stack";
  b.addEventListener("click", () => dropStack(stack.id));
  return b;
}

function stackChrome(stack) {
  const strip = el("div", "stack-strip");
  strip.dataset.index = state.stacks.indexOf(stack);
  strip.append(el("span", "stack-grip", "⠿"), stackDropBtn(stack));
  wireStackDrag(strip, stack);
  return strip;
}

function gutterEl(index) {
  const g = el("div", "gutter");
  const b = el("button", "gutter-plus", "+");
  b.title = "Add stack here";
  b.addEventListener("click", () => addStackAt(index));
  g.appendChild(b);
  return g;
}

function stackAddBtn(stack) {
  const b = el("button", "stack-add", "+");
  b.title = "Add pane";
  b.addEventListener("click", (e) => openChooserAt(b.getBoundingClientRect(), stack.id));
  return b;
}

function ghostEl(stack) {
  const ghost = el("button", "ghost");
  ghost.title = "Add pane";
  ghost.append(el("span", "ghost-plus", "+"), el("span", "ghost-hint", "add pane"));
  ghost.addEventListener("click", (e) => openChooserAt(ghost.getBoundingClientRect(), stack.id));
  return ghost;
}

// ---------- pane rendering ----------

function barEl(stack, pane, { expanded = false } = {}) {
  const bar = el("div", "bar" + (expanded ? " bar--active" : ""));
  bar.draggable = !expanded;
  bar.dataset.paneId = pane.id;
  const t = el("span", "bar-title", titleOf(stack, pane));
  t.dataset.title = "";
  bar.append(dotEl(pane), t, dropBtn(stack, pane));
  bar.addEventListener("click", () => setExpanded(stack.id, pane.id));
  if (!expanded) wirePaneDrag(bar, stack, pane);
  return bar;
}

function expandedPaneEl(stack, pane) {
  const wrap = el("div", "pane");
  const head = el("div", "pane-head");
  head.dataset.paneId = pane.id;
  const chip = el("span", "type-chip", TYPES[pane.type]);
  head.append(dotEl(pane), titleInput(stack, pane), chip, dropBtn(stack, pane));
  const body = el("div", "pane-body");
  body.appendChild(bodyEl(pane));
  wrap.append(head, body);
  return wrap;
}

function renderAccordionStack(host, stack) {
  for (const pane of stack.panes) {
    const node = pane.id === stack.expandedId ? expandedPaneEl(stack, pane) : barEl(stack, pane);
    node.dataset.index = stack.panes.indexOf(pane);
    host.appendChild(node);
  }
}

function renderSplitStack(host, stack) {
  const bars = el("div", "split-bars");
  for (const pane of stack.panes) {
    const bar = barEl(stack, pane, { expanded: pane.id === stack.expandedId });
    bar.dataset.index = stack.panes.indexOf(pane);
    bars.appendChild(bar);
  }
  host.appendChild(bars);
  const editor = el("div", "split-editor");
  const expanded = stack.panes.find((p) => p.id === stack.expandedId);
  if (expanded) {
    const head = el("div", "pane-head");
    const chip = el("span", "type-chip", TYPES[expanded.type]);
    head.append(dotEl(expanded), titleInput(stack, expanded), chip, dropBtn(stack, expanded));
    const body = el("div", "pane-body");
    body.appendChild(bodyEl(expanded));
    editor.append(head, body);
  } else {
    editor.appendChild(el("div", "split-empty", "No expanded pane — click a bar above"));
  }
  host.appendChild(editor);
}

function renderTabsStack(host, stack) {
  const strip = el("div", "strip");
  for (const pane of stack.panes) {
    const active = pane.id === stack.expandedId;
    const tab = el("div", "tab" + (active ? " tab--active" : ""));
    tab.dataset.paneId = pane.id;
    tab.dataset.index = stack.panes.indexOf(pane);
    if (active) {
      tab.append(dotEl(pane), titleInput(stack, pane), dropBtn(stack, pane));
    } else {
      tab.draggable = true;
      const t = el("span", "bar-title", titleOf(stack, pane));
      t.dataset.title = "";
      tab.append(dotEl(pane), t, dropBtn(stack, pane));
      tab.addEventListener("click", () => setExpanded(stack.id, pane.id));
      wirePaneDrag(tab, stack, pane, "x");
    }
    strip.appendChild(tab);
  }
  host.appendChild(strip);
  const view = el("div", "view");
  const expanded = stack.panes.find((p) => p.id === stack.expandedId);
  if (expanded) view.appendChild(bodyEl(expanded));
  host.appendChild(view);
}

const STYLE_RENDERERS = {
  A: renderAccordionStack,
  B: renderSplitStack,
  C: renderTabsStack,
};

// ---------- variants ----------

const VARIANTS = {
  A: { label: "A — Accordion stacks" },
  B: { label: "B — Split stacks" },
  C: { label: "C — Tab stacks" },
};

function render() {
  app.dataset.variant = variant;
  app.textContent = "";
  if (!state.stacks.length) {
    app.appendChild(welcomeEl());
    return;
  }
  state.stacks.forEach((stack, i) => {
    app.appendChild(gutterEl(i));
    const s = el("div", "stack");
    s.dataset.stackId = stack.id;
    s.dataset.index = i;
    s.appendChild(stackChrome(stack));
    if (!stack.panes.length) s.appendChild(ghostEl(stack));
    else STYLE_RENDERERS[variant](s, stack);
    s.appendChild(stackAddBtn(stack));
    app.appendChild(s);
  });
  app.appendChild(gutterEl(state.stacks.length));
}

function syncTitles(stackId, paneId) {
  const stack = state.stacks.find((s) => s.id === stackId);
  const title = titleOf(stack, stack.panes.find((p) => p.id === paneId));
  document.querySelectorAll(`[data-stack-id="${stackId}"] [data-pane-id="${paneId}"] [data-title]`).forEach((n) => {
    n.textContent = title;
  });
}

// ---------- chooser ----------

const chooser = $("#chooser");
let chooserStackId = null;

function openChooserAt(rect, stackId) {
  chooserStackId = stackId;
  chooser.style.left = Math.max(8, rect.left + rect.width / 2 - 110) + "px";
  chooser.style.top = Math.max(8, rect.bottom + 8) + "px";
  chooser.style.right = "auto";
  chooser.hidden = false;
}

document.addEventListener("click", (e) => {
  if (!chooser.hidden && !chooser.contains(e.target)) chooser.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") chooser.hidden = true;
});
chooser.querySelectorAll(".chooser-option").forEach((b) =>
  b.addEventListener("click", () => {
    chooser.hidden = true;
    if (chooserStackId) addPane(chooserStackId, b.dataset.type);
  })
);

// ---------- state readout ----------

const panel = $("#state-panel");

function updateStatePanel() {
  $("#state-json").textContent = JSON.stringify(
    {
      stacks: state.stacks.map((s) => ({
        id: s.id,
        expandedId: s.expandedId,
        panes: s.panes.map((p) => ({
          id: p.id,
          type: p.type,
          title: titleOf(s, p),
          override: p.titleOverride,
        })),
      })),
    },
    null,
    2
  );
}

$("#state-toggle").addEventListener("click", () => panel.classList.toggle("hidden"));
$("#demo-btn").addEventListener("click", demoStacks);
$("#clear-btn").addEventListener("click", () => {
  state.stacks = [];
  render();
  updateStatePanel();
});

function demoStacks() {
  const s1 = { id: nextId("s"), expandedId: null, panes: [] };
  s1.panes = [
    { id: nextId("p"), type: "markdown", titleOverride: null,
      content: "# Welcome to stackytab\n\nYour new tab page is a row of stacks.\n\n- Click a bar to expand it\n- Drag bars to reorder, ✕ drops a pane\n- The first line becomes the title\n- Drag the grip above a stack to reorder stacks" },
    { id: nextId("p"), type: "excalidraw", titleOverride: null, scene: null },
  ];
  s1.expandedId = s1.panes[0].id;
  const s2 = { id: nextId("s"), expandedId: null, panes: [
    { id: nextId("p"), type: "markdown", titleOverride: null, content: "Shopping list\n\n- coffee\n- bread\n- granola" },
    { id: nextId("p"), type: "excalidraw", titleOverride: null, scene: null },
  ] };
  state.stacks = [s1, s2, { id: nextId("s"), expandedId: null, panes: [] }];
  render();
  updateStatePanel();
}

// ---------- variant switcher ----------

const KEYS = Object.keys(VARIANTS);
const param = new URLSearchParams(location.search).get("variant");
let variant = KEYS.includes(param) ? param : "A";

function setVariant(v) {
  variant = v;
  history.replaceState(null, "", "?variant=" + v);
  $("#variant-label").textContent = VARIANTS[v].label;
  render();
  updateStatePanel();
}

$("#prev-variant").addEventListener("click", () =>
  setVariant(KEYS[(KEYS.indexOf(variant) + KEYS.length - 1) % KEYS.length])
);
$("#next-variant").addEventListener("click", () =>
  setVariant(KEYS[(KEYS.indexOf(variant) + 1) % KEYS.length])
);

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = document.activeElement && document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable)) return;
  if (e.key === "ArrowLeft") setVariant(KEYS[(KEYS.indexOf(variant) + KEYS.length - 1) % KEYS.length]);
  if (e.key === "ArrowRight") setVariant(KEYS[(KEYS.indexOf(variant) + 1) % KEYS.length]);
});

// ---------- boot ----------

setVariant(variant);
