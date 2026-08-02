import { defineConfig } from "vite";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: resolve(rootDir, "src/newtab.html"),
      },
    },
  },
  plugins: [
    {
      name: "copy-manifest",
      apply: "build",
      closeBundle() {
        mkdirSync("dist", { recursive: true });
        const html = readFileSync("dist/src/newtab.html", "utf8");
        writeFileSync("dist/newtab.html", html.replaceAll("../assets/", "./assets/"));
        rmSync("dist/src", { recursive: true, force: true });
        copyFileSync("manifest.json", "dist/manifest.json");
      },
    },
  ],
  test: {
    environment: "node",
  },
});
