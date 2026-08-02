// Generates the extension's PNG icons from the stacked-panes logo geometry
// (the same 64-space shape as `logo()` in src/newtab.js: three rounded rects
// filled with the indigo→violet gradient at decreasing opacity). Pure Node —
// no image dependencies: pixels are composited straight into an RGBA buffer,
// antialiased with a rounded-rect signed distance function, and encoded as
// PNG via zlib + a hand-rolled CRC32.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const RECTS = [
  { y: 10, w: 40, opacity: 0.55 },
  { y: 24, w: 52, opacity: 0.8 },
  { y: 40, w: 46, opacity: 1 },
];
const H = 14; // rect height (64-space)
const RX = 7; // corner radius (64-space)
const CENTER_X = 32; // rect center x (64-space)
const GRAD_STOPS = [
  { r: 0x81, g: 0x8c, b: 0xf8 }, // #818cf8
  { r: 0xa7, g: 0xbb, b: 0xfa }, // #a78bfa
];

function distRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

function render(size) {
  const s = size / 64;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / s;
      const py = (y + 0.5) / s;
      const t = (px + py) / 128;
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (const rc of RECTS) {
        const d = distRoundRect(px, py, CENTER_X, rc.y + H / 2, rc.w / 2, H / 2, RX);
        const cov = Math.max(0, Math.min(1, 0.5 - d));
        const alpha = rc.opacity * cov;
        if (alpha <= 0) continue;
        const from = GRAD_STOPS[0];
        const to = GRAD_STOPS[1];
        const cr = from.r + (to.r - from.r) * t;
        const cg = from.g + (to.g - from.g) * t;
        const cb = from.b + (to.b - from.b) * t;
        r = cr * alpha + r * (1 - alpha);
        g = cg * alpha + g * (1 - alpha);
        b = cb * alpha + b * (1 - alpha);
        a = alpha + a * (1 - alpha);
      }
      const i = (y * size + x) * 4;
      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(g);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = Math.round(a * 255);
    }
  }
  return buf;
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const dir = join(rootDir, "icons");
mkdirSync(dir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const out = join(dir, `icon-${size}.png`);
  writeFileSync(out, encodePng(size, render(size)));
  console.log(`wrote ${out}`);
}
