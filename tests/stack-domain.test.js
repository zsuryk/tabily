import { describe, it, expect } from "vitest";
import {
  createState,
  addStackAt,
  dropStack,
  reorderStack,
  addPane,
  quickAdd,
  dropPane,
  setExpanded,
  reorderPane,
  setContent,
  setTitle,
  titleOf,
  serialize,
  load,
} from "../src/stack/domain.js";

function threeStacks() {
  const state = createState();
  addStackAt(state, 0);
  addStackAt(state, 0);
  addStackAt(state, 0);
  return state;
}

describe("addStackAt", () => {
  it("inserts an empty stack at the given index", () => {
    const state = createState();
    addStackAt(state, 0);
    expect(state.stacks).toHaveLength(1);
    expect(state.stacks[0].panes).toEqual([]);
    expect(state.stacks[0].expandedId).toBeNull();
  });

  it("inserts between stacks at the gutter position", () => {
    const state = createState();
    addStackAt(state, 0);
    addStackAt(state, 1);
    addStackAt(state, 1);
    expect(state.stacks.map((s) => s.id)).toHaveLength(3);
    expect(state.stacks[1].panes).toEqual([]);
  });

  it("appends at the outer edge when index is the length", () => {
    const state = createState();
    addStackAt(state, 0);
    addStackAt(state, 0);
    addStackAt(state, 2);
    expect(state.stacks).toHaveLength(3);
  });
});

describe("dropStack", () => {
  it("drops the stack and all of its panes", () => {
    const state = createState();
    addStackAt(state, 0);
    addStackAt(state, 0);
    const victim = state.stacks[0].id;
    dropStack(state, victim);
    expect(state.stacks).toHaveLength(1);
    expect(state.stacks.some((s) => s.id === victim)).toBe(false);
  });

  it("does nothing for an unknown id", () => {
    const state = createState();
    addStackAt(state, 0);
    dropStack(state, "nope");
    expect(state.stacks).toHaveLength(1);
  });
});

describe("reorderStack", () => {
  it("moves the stack before the target when dropped on the left half", () => {
    const state = threeStacks();
    const [a, b, c] = state.stacks.map((s) => s.id);
    reorderStack(state, c, 0);
    expect(state.stacks.map((s) => s.id)).toEqual([c, a, b]);
  });

  it("moves the stack after the target when dropped on the right half", () => {
    const state = threeStacks();
    const [a, b, c] = state.stacks.map((s) => s.id);
    reorderStack(state, a, 2);
    expect(state.stacks.map((s) => s.id)).toEqual([b, a, c]);
  });

  it("moves a stack forward to the end", () => {
    const state = threeStacks();
    const [a, b, c] = state.stacks.map((s) => s.id);
    reorderStack(state, a, 3);
    expect(state.stacks.map((s) => s.id)).toEqual([b, c, a]);
  });

  it("does nothing when dropped on its own position", () => {
    const state = threeStacks();
    const [a, b, c] = state.stacks.map((s) => s.id);
    reorderStack(state, b, 1);
    expect(state.stacks.map((s) => s.id)).toEqual([a, b, c]);
  });

  it("does nothing for an unknown drag id", () => {
    const state = threeStacks();
    reorderStack(state, "nope", 1);
    expect(state.stacks).toHaveLength(3);
  });
});

describe("addPane", () => {
  it("appends a pane of the given type and expands it", () => {
    const state = createState();
    addStackAt(state, 0);
    const stack = state.stacks[0];
    addPane(state, stack.id, "markdown");
    expect(stack.panes).toHaveLength(1);
    expect(stack.panes[0]).toMatchObject({ type: "markdown", titleOverride: null, content: "" });
    expect(stack.expandedId).toBe(stack.panes[0].id);
  });

  it("appends to the bottom, keeping existing panes", () => {
    const state = createState();
    addStackAt(state, 0);
    const stack = state.stacks[0];
    addPane(state, stack.id, "markdown");
    addPane(state, stack.id, "excalidraw");
    expect(stack.panes.map((p) => p.type)).toEqual(["markdown", "excalidraw"]);
    expect(stack.expandedId).toBe(stack.panes[1].id);
  });

  it("does nothing for an unknown stack id", () => {
    const state = createState();
    addPane(state, "nope", "markdown");
    expect(state.stacks).toHaveLength(0);
  });
});

describe("quickAdd", () => {
  it("adds the first stack and expands the new pane in it", () => {
    const state = createState();
    quickAdd(state, "markdown");
    expect(state.stacks).toHaveLength(1);
    expect(state.stacks[0].panes).toHaveLength(1);
    expect(state.stacks[0].expandedId).toBe(state.stacks[0].panes[0].id);
  });

  it("appends to the last stack when one exists", () => {
    const state = createState();
    quickAdd(state, "excalidraw");
    quickAdd(state, "markdown");
    expect(state.stacks).toHaveLength(1);
    expect(state.stacks[0].panes.map((p) => p.type)).toEqual(["excalidraw", "markdown"]);
  });
});

describe("dropPane", () => {
  function stackWithThree() {
    const state = createState();
    addStackAt(state, 0);
    addPane(state, state.stacks[0].id, "markdown");
    addPane(state, state.stacks[0].id, "excalidraw");
    addPane(state, state.stacks[0].id, "markdown");
    return state;
  }

  it("drops the pane from its stack", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    const victim = stack.panes[0].id;
    dropPane(state, stack.id, victim);
    expect(stack.panes.map((p) => p.id)).not.toContain(victim);
    expect(stack.panes).toHaveLength(2);
  });

  it("expands the pane above when the expanded pane is dropped", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    const [a, b] = stack.panes.map((p) => p.id);
    setExpanded(state, stack.id, a);
    dropPane(state, stack.id, a);
    expect(stack.expandedId).toBe(b);
  });

  it("expands the first remaining pane when the top pane is dropped", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    const [, b] = stack.panes.map((p) => p.id);
    setExpanded(state, stack.id, stack.panes[0].id);
    dropPane(state, stack.id, stack.panes[0].id);
    expect(stack.expandedId).toBe(b);
  });

  it("leaves a collapsed pane's expanded pane untouched", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    const [a, , c] = stack.panes.map((p) => p.id);
    setExpanded(state, stack.id, a);
    dropPane(state, stack.id, c);
    expect(stack.expandedId).toBe(a);
  });

  it("leaves the stack empty and expandedId null when the last pane is dropped", () => {
    const state = createState();
    addStackAt(state, 0);
    const stack = state.stacks[0];
    addPane(state, stack.id, "markdown");
    dropPane(state, stack.id, stack.panes[0].id);
    expect(stack.panes).toEqual([]);
    expect(stack.expandedId).toBeNull();
  });

  it("does nothing for an unknown pane id", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    dropPane(state, stack.id, "nope");
    expect(stack.panes).toHaveLength(3);
  });
});

describe("setExpanded", () => {
  it("toggles a collapsed pane to expanded", () => {
    const state = createState();
    addStackAt(state, 0);
    const stack = state.stacks[0];
    addPane(state, stack.id, "markdown");
    addPane(state, stack.id, "markdown");
    const first = stack.panes[0].id;
    setExpanded(state, stack.id, first);
    expect(stack.expandedId).toBe(first);
  });

  it("collapses when the expanded pane's own bar is clicked", () => {
    const state = createState();
    addStackAt(state, 0);
    const stack = state.stacks[0];
    addPane(state, stack.id, "markdown");
    addPane(state, stack.id, "markdown");
    const expanded = stack.expandedId;
    setExpanded(state, stack.id, expanded);
    expect(stack.expandedId).toBeNull();
  });

  it("leaves other stacks' expanded panes untouched", () => {
    const state = createState();
    addStackAt(state, 0);
    addStackAt(state, 0);
    addPane(state, state.stacks[0].id, "markdown");
    addPane(state, state.stacks[0].id, "markdown");
    addPane(state, state.stacks[1].id, "markdown");
    const second = state.stacks[0].panes[0].id;
    const before = state.stacks[1].expandedId;
    setExpanded(state, state.stacks[0].id, second);
    expect(state.stacks[0].expandedId).toBe(second);
    expect(state.stacks[1].expandedId).toBe(before);
  });
});

describe("reorderPane", () => {
  function stackWithThree() {
    const state = createState();
    addStackAt(state, 0);
    addPane(state, state.stacks[0].id, "markdown");
    addPane(state, state.stacks[0].id, "excalidraw");
    addPane(state, state.stacks[0].id, "markdown");
    return state;
  }

  it("moves a pane before the target when dropped on the top half", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    const [a, b, c] = stack.panes.map((p) => p.id);
    reorderPane(state, stack.id, c, 0);
    expect(stack.panes.map((p) => p.id)).toEqual([c, a, b]);
  });

  it("moves a pane after the target when dropped on the bottom half", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    const [a, b, c] = stack.panes.map((p) => p.id);
    reorderPane(state, stack.id, a, 3);
    expect(stack.panes.map((p) => p.id)).toEqual([b, c, a]);
  });

  it("does not disturb other stacks' panes", () => {
    const state = stackWithThree();
    addStackAt(state, 1);
    const first = state.stacks[0];
    const other = state.stacks[1];
    const before = other.panes.map((p) => p.id);
    const [a, b] = first.panes.map((p) => p.id);
    reorderPane(state, first.id, a, 2);
    expect(state.stacks[1].panes.map((p) => p.id)).toEqual(before);
    expect(first.panes.map((p) => p.id)).toEqual([b, a, first.panes[2].id]);
  });

  it("keeps the expanded pane expanded after reordering", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    const expanded = stack.expandedId;
    const [a] = stack.panes.map((p) => p.id);
    reorderPane(state, stack.id, a, 2);
    expect(stack.expandedId).toBe(expanded);
  });

  it("does nothing when dropped on its own position", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    const before = stack.panes.map((p) => p.id);
    reorderPane(state, stack.id, before[1], 1);
    expect(stack.panes.map((p) => p.id)).toEqual(before);
  });

  it("does nothing for an unknown drag id", () => {
    const state = stackWithThree();
    const stack = state.stacks[0];
    reorderPane(state, stack.id, "nope", 1);
    expect(stack.panes).toHaveLength(3);
  });
});

describe("titleOf", () => {
  function stackWithPanes(content, extra = []) {
    const state = createState();
    addStackAt(state, 0);
    const pane = { id: "p0", type: "markdown", titleOverride: null, content };
    state.stacks[0].panes = [pane, ...extra];
    return { state, pane };
  }

  it("uses the first non-empty line of markdown content", () => {
    const { state, pane } = stackWithPanes("\n\nGrocery run\n- coffee");
    expect(titleOf(state.stacks[0], pane)).toBe("Grocery run");
  });

  it("strips leading # characters from the first line", () => {
    const { state, pane } = stackWithPanes("##  Deep Thoughts\n\nbody");
    expect(titleOf(state.stacks[0], pane)).toBe("Deep Thoughts");
  });

  it("falls back to Untitled for empty markdown content", () => {
    const { state, pane } = stackWithPanes("");
    expect(titleOf(state.stacks[0], pane)).toBe("Untitled");
  });

  it("falls back to Untitled for whitespace-only content", () => {
    const { state, pane } = stackWithPanes("   \n\n  ");
    expect(titleOf(state.stacks[0], pane)).toBe("Untitled");
  });

  it("returns the override when set", () => {
    const { state, pane } = stackWithPanes("# First line");
    pane.titleOverride = "My name";
    expect(titleOf(state.stacks[0], pane)).toBe("My name");
  });

  it("numbers excalidraw panes within their stack", () => {
    const state = createState();
    addStackAt(state, 0);
    state.stacks[0].panes = [
      { id: "a", type: "excalidraw", titleOverride: null, content: "" },
      { id: "b", type: "markdown", titleOverride: null, content: "" },
      { id: "c", type: "excalidraw", titleOverride: null, content: "" },
    ];
    const [a, b, c] = state.stacks[0].panes;
    expect(titleOf(state.stacks[0], a)).toBe("Canvas 1");
    expect(titleOf(state.stacks[0], b)).toBe("Untitled");
    expect(titleOf(state.stacks[0], c)).toBe("Canvas 2");
  });

  it("renumbers canvases after a drop", () => {
    const state = createState();
    addStackAt(state, 0);
    state.stacks[0].panes = [
      { id: "a", type: "excalidraw", titleOverride: null, content: "" },
      { id: "b", type: "excalidraw", titleOverride: null, content: "" },
      { id: "c", type: "excalidraw", titleOverride: null, content: "" },
    ];
    dropPane(state, state.stacks[0].id, "a");
    const [b, c] = state.stacks[0].panes;
    expect(titleOf(state.stacks[0], b)).toBe("Canvas 1");
    expect(titleOf(state.stacks[0], c)).toBe("Canvas 2");
  });

  it("renumbers canvases after a reorder", () => {
    const state = createState();
    addStackAt(state, 0);
    state.stacks[0].panes = [
      { id: "a", type: "excalidraw", titleOverride: null, content: "" },
      { id: "b", type: "excalidraw", titleOverride: null, content: "" },
    ];
    reorderPane(state, state.stacks[0].id, "a", 2);
    const [b, a] = state.stacks[0].panes;
    expect(titleOf(state.stacks[0], b)).toBe("Canvas 1");
    expect(titleOf(state.stacks[0], a)).toBe("Canvas 2");
  });

  it("reverts to the derived title when an override is cleared", () => {
    const { state, pane } = stackWithPanes("# First line");
    pane.titleOverride = "My name";
    pane.titleOverride = null;
    expect(titleOf(state.stacks[0], pane)).toBe("First line");
  });
});

describe("setContent", () => {
  it("updates the pane content in place", () => {
    const state = createState();
    addStackAt(state, 0);
    addPane(state, state.stacks[0].id, "markdown");
    const stack = state.stacks[0];
    setContent(state, stack.id, stack.panes[0].id, "Hello world\nbody");
    expect(stack.panes[0].content).toBe("Hello world\nbody");
  });

  it("drives the derived title from the first line", () => {
    const state = createState();
    addStackAt(state, 0);
    addPane(state, state.stacks[0].id, "markdown");
    const stack = state.stacks[0];
    setContent(state, stack.id, stack.panes[0].id, "# Note!\nbody");
    expect(titleOf(stack, stack.panes[0])).toBe("Note!");
  });

  it("does nothing for an unknown pane", () => {
    const state = createState();
    addStackAt(state, 0);
    setContent(state, state.stacks[0].id, "nope", "text");
    expect(state.stacks[0].panes).toEqual([]);
  });
});

describe("setTitle", () => {
  it("sets a trimmed title override", () => {
    const state = createState();
    addStackAt(state, 0);
    addPane(state, state.stacks[0].id, "markdown");
    const stack = state.stacks[0];
    setTitle(state, stack.id, stack.panes[0].id, "  My name  ");
    expect(stack.panes[0].titleOverride).toBe("My name");
    expect(titleOf(stack, stack.panes[0])).toBe("My name");
  });

  it("clears the override when emptied, reverting to the derived title", () => {
    const state = createState();
    addStackAt(state, 0);
    addPane(state, state.stacks[0].id, "markdown");
    const stack = state.stacks[0];
    setContent(state, stack.id, stack.panes[0].id, "# Derived title");
    setTitle(state, stack.id, stack.panes[0].id, "My name");
    setTitle(state, stack.id, stack.panes[0].id, "");
    expect(stack.panes[0].titleOverride).toBeNull();
    expect(titleOf(stack, stack.panes[0])).toBe("Derived title");
  });
});

describe("serialize / load", () => {
  function populatedState() {
    const state = createState();
    addStackAt(state, 0);
    addStackAt(state, 1);
    addPane(state, state.stacks[0].id, "markdown");
    addPane(state, state.stacks[0].id, "excalidraw");
    addPane(state, state.stacks[1].id, "markdown");
    setContent(state, state.stacks[0].id, state.stacks[0].panes[0].id, "# Note one\nbody");
    setTitle(state, state.stacks[0].id, state.stacks[0].panes[0].id, "Renamed");
    return state;
  }

  it("round-trips stacks, panes, content, overrides, and expanded panes", () => {
    const state = populatedState();
    const restored = load(serialize(state));
    expect(restored.stacks).toEqual(state.stacks);
    expect(restored.stacks[0].expandedId).toBe(state.stacks[0].expandedId);
    expect(restored.stacks[0].panes[0].content).toBe("# Note one\nbody");
    expect(restored.stacks[0].panes[0].titleOverride).toBe("Renamed");
  });

  it("returns a JSON-safe deep copy that is detached from the state", () => {
    const state = populatedState();
    const out = serialize(state);
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
    out.stacks[0].panes[0].content = "mutated";
    expect(state.stacks[0].panes[0].content).toBe("# Note one\nbody");
  });

  it("loads a blank object as an empty state", () => {
    expect(load({}).stacks).toEqual([]);
  });

  it("defaults missing stack fields", () => {
    const restored = load({ stacks: [{ id: "s1" }, { id: "s2", panes: null }] });
    expect(restored.stacks).toEqual([
      { id: "s1", panes: [], expandedId: null },
      { id: "s2", panes: [], expandedId: null },
    ]);
  });

  it("skips malformed stacks and panes", () => {
    const restored = load({
      stacks: [
        null,
        "stack",
        { panes: [] },
        {
          id: "good",
          panes: [null, { id: 42 }, { id: "p1", type: "markdown", content: "ok" }, {}],
        },
      ],
    });
    expect(restored.stacks).toHaveLength(1);
    expect(restored.stacks[0].panes).toEqual([
      { id: "p1", type: "markdown", titleOverride: null, content: "ok" },
    ]);
  });

  it("drops an expandedId that points at a dropped pane", () => {
    const restored = load({
      stacks: [{ id: "s1", panes: [{ id: "p1", type: "markdown", titleOverride: null, content: "" }], expandedId: "gone" }],
    });
    expect(restored.stacks[0].expandedId).toBeNull();
  });

  it("ignores v0.1 grid-era keys safely", () => {
    const restored = load({ layout: [{ x: 0, y: 0 }], stacks: [] });
    expect(restored.stacks).toEqual([]);
  });
});

describe("module purity", () => {
  it("runs without a DOM or browser globals", () => {
    expect(typeof globalThis.document).toBe("undefined");
    expect(typeof globalThis.window).toBe("undefined");
  });
});
