// Pure domain module: multi-stack state and actions. No DOM, no browser APIs.

let uid = 0;
const nextId = (prefix) => prefix + ++uid;

export function createState() {
  return { stacks: [] };
}

export function addStackAt(state, index) {
  state.stacks.splice(index, 0, { id: nextId("s"), panes: [], expandedId: null });
}

export function dropStack(state, id) {
  const idx = state.stacks.findIndex((s) => s.id === id);
  if (idx !== -1) state.stacks.splice(idx, 1);
}

export function reorderStack(state, dragId, targetIdx) {
  const from = state.stacks.findIndex((s) => s.id === dragId);
  if (from === -1 || from === targetIdx) return;
  const [stack] = state.stacks.splice(from, 1);
  state.stacks.splice(from < targetIdx ? targetIdx - 1 : targetIdx, 0, stack);
}

export function addPane(state, stackId, type) {
  const stack = state.stacks.find((s) => s.id === stackId);
  if (!stack) return;
  const pane = { id: nextId("p"), type, titleOverride: null, content: "" };
  stack.panes.push(pane);
  stack.expandedId = pane.id;
}

export function quickAdd(state, type) {
  if (!state.stacks.length) addStackAt(state, 0);
  addPane(state, state.stacks[state.stacks.length - 1].id, type);
}

export function dropPane(state, stackId, paneId) {
  const stack = state.stacks.find((s) => s.id === stackId);
  if (!stack) return;
  const idx = stack.panes.findIndex((p) => p.id === paneId);
  if (idx === -1) return;
  stack.panes.splice(idx, 1);
  if (stack.expandedId === paneId) {
    stack.expandedId = stack.panes.length ? stack.panes[Math.max(0, idx - 1)].id : null;
  }
}

export function setExpanded(state, stackId, paneId) {
  const stack = state.stacks.find((s) => s.id === stackId);
  if (!stack) return;
  stack.expandedId = stack.expandedId === paneId ? null : paneId;
}

export function reorderPane(state, stackId, dragId, targetIdx) {
  const stack = state.stacks.find((s) => s.id === stackId);
  if (!stack) return;
  const from = stack.panes.findIndex((p) => p.id === dragId);
  if (from === -1 || from === targetIdx) return;
  const [pane] = stack.panes.splice(from, 1);
  stack.panes.splice(from < targetIdx ? targetIdx - 1 : targetIdx, 0, pane);
}

const firstLine = (text) =>
  (text || "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean)
    ?.replace(/^#+\s*/, "")
    .trim() || "";

export function titleOf(stack, pane) {
  if (pane.titleOverride) return pane.titleOverride;
  if (pane.type === "markdown") return firstLine(pane.content) || "Untitled";
  const n = stack.panes.filter((p) => p.type === "excalidraw").findIndex((p) => p.id === pane.id) + 1;
  return "Canvas " + n;
}

export function setContent(state, stackId, paneId, text) {
  const pane = state.stacks.find((s) => s.id === stackId)?.panes.find((p) => p.id === paneId);
  if (!pane) return;
  pane.content = text;
}

export function setTitle(state, stackId, paneId, text) {
  const pane = state.stacks.find((s) => s.id === stackId)?.panes.find((p) => p.id === paneId);
  if (!pane) return;
  pane.titleOverride = text.trim() || null;
}

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

export function serialize(state) {
  return JSON.parse(JSON.stringify(state));
}

export function load(raw) {
  const data = isPlainObject(raw) ? raw : {};
  const stacks = Array.isArray(data.stacks) ? data.stacks : [];
  return {
    stacks: stacks
      .filter((s) => isPlainObject(s) && typeof s.id === "string")
      .map((stack) => {
        const panes = Array.isArray(stack.panes) ? stack.panes : [];
        const clean = panes
          .filter((p) => isPlainObject(p) && typeof p.id === "string")
          .map((p) => ({
            id: p.id,
            type: p.type === "excalidraw" ? "excalidraw" : "markdown",
            titleOverride: typeof p.titleOverride === "string" ? p.titleOverride : null,
            content: typeof p.content === "string" ? p.content : "",
          }));
        return {
          id: stack.id,
          panes: clean,
          expandedId: clean.some((p) => p.id === stack.expandedId) ? stack.expandedId : null,
        };
      }),
  };
}
