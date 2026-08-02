import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs in a node environment without jsdom", () => {
    expect(globalThis.window).toBeUndefined();
  });
});
