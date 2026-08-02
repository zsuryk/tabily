import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync(new URL("../manifest.json", import.meta.url), "utf8"),
);

describe("manifest", () => {
  it("is a single shared MV3 manifest", () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it("overrides the new tab page with the built entry", () => {
    expect(manifest.chrome_url_overrides.newtab).toBe("newtab.html");
  });

  it("declares storage and unlimitedStorage permissions", () => {
    expect(manifest.permissions).toContain("storage");
    expect(manifest.permissions).toContain("unlimitedStorage");
  });

  it("keeps the existing Firefox gecko id", () => {
    expect(manifest.browser_specific_settings.gecko.id).toBe(
      "{4b53e80a-c5f8-452a-a9c2-7e292e13020a}",
    );
  });
});
