#!/usr/bin/env node
/**
 * Builds the notification panel icons (assets/notifications/<kind>@2x.webp and @3x.webp)
 * from the Kangur drawings in assets/brand. No new art and no image API: each icon is a
 * crop of a drawing the app already shows on the matching screen.
 *
 *   cd mobile && node scripts/build-notification-icons.mjs
 *
 * Steps: remove the pale mint circle behind the drawing (flood fill from the edge),
 * keep the figure and its speech bubble, place head and body with the prop in the
 * same frame for every kind, add a white sticker outline, round the bottom corners
 * like the tile, write 44×56 pt WebP files. The tile colour itself is drawn in code
 * (features/notifications/notification-icon-kind.ts), 12 pt below the top of the file,
 * so the Kangur's head sticks out above the tile.
 *
 * Needs `sharp`. The mobile app does not depend on it; the script borrows the copy
 * installed with the backend (Next.js), or the one given in SHARP_PATH.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = path.join(mobileRoot, "assets/brand");
const OUT = path.join(mobileRoot, "assets/notifications");

function loadSharp() {
  const require = createRequire(import.meta.url);
  if (process.env.SHARP_PATH) return require(process.env.SHARP_PATH);
  const backendNext = require.resolve("next/package.json", {
    paths: [path.join(mobileRoot, "../backend")],
  });
  return createRequire(backendNext)("sharp");
}
const sharp = loadSharp();

const K = 12; // working pixels per point
const TILE = 44; // tile size, pt
const TILE_RADIUS = 10; // radius.sm
const OVERHANG = 12; // how far the drawing reaches above the tile, pt
const OUTLINE = 0.7; // white outline, pt
const FRAME = { face: 18.5, width: TILE, height: TILE + OVERHANG, eyeLine: 21.5 }; // pt

const MINT = [223, 244, 240]; // circle behind the brand drawings
const MINT_TOLERANCE = 24;
const AMBER = [245, 158, 11]; // brand.unavailable

/**
 * headX / eyeY / face: head centre, eye line and face width in the source drawing (px).
 * dx: frame centre offset from the head centre, in face widths. scale: face size factor.
 * eyeLine: eye line in the icon (pt) when it differs from the shared frame.
 */
const ICONS = [
  { kind: "shopping-started", source: "shopping-started.webp", headX: 432, eyeY: 268, face: 175, dx: -0.25 },
  { kind: "shopping-finished", source: "category-complete.webp", headX: 432, eyeY: 305, face: 215, dx: 0.1 },
  {
    kind: "shopping-finished-missing", source: "shopping-finished.webp", headX: 418, eyeY: 322, face: 165, dx: 0.25,
    // the "!" bubble, recoloured amber like unavailable products, in the top right corner
    bubble: { recolor: AMBER, cx: 0.8, cy: 0.2, width: 0.4 },
  },
  { kind: "workspace-invitation", source: "invite-welcome.webp", headX: 238, eyeY: 315, face: 170, dx: 0.3 },
  {
    kind: "workspace-member-joined", source: "invite-welcome.webp", headX: 392, eyeY: 315, face: 170, dx: 0, scale: 0.68,
    // both Kangurs, the yellow one moved closer
    secondFigure: { shiftX: -150, shiftY: -40 },
  },
  { kind: "shopping-list-created", source: "list-created.webp", headX: 455, eyeY: 243, face: 205, dx: 0.3 },
  {
    kind: "shopping-list-deleted", source: "delete-list.webp", headX: 388, eyeY: 275, face: 215, dx: 0.05,
    bubble: { cx: 0.8, cy: 0.21, width: 0.42 },
  },
  { kind: "default", source: "kangur-icon.webp", headX: 420, eyeY: 380, face: 360, dx: 0, scale: 1.36, eyeLine: 26.8 },
];

/** Splits a brand drawing into its parts without the mint circle, biggest part first. */
async function cutOut(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const N = W * H;
  const isBackground = (p) => {
    if (data[p * 4 + 3] < 24) return true;
    const dr = data[p * 4] - MINT[0];
    const dg = data[p * 4 + 1] - MINT[1];
    const db = data[p * 4 + 2] - MINT[2];
    return dr * dr + dg * dg + db * db <= MINT_TOLERANCE * MINT_TOLERANCE;
  };
  const background = new Uint8Array(N);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const p = stack.pop();
    if (background[p] || !isBackground(p)) continue;
    background[p] = 1;
    const x = p % W;
    const y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }
  const part = new Int32Array(N).fill(-1);
  const parts = [];
  for (let s = 0; s < N; s++) {
    if (background[s] || part[s] >= 0) continue;
    const id = parts.length;
    let area = 0;
    let x0 = W;
    let y0 = H;
    let x1 = 0;
    let y1 = 0;
    stack.push(s);
    part[s] = id;
    while (stack.length) {
      const p = stack.pop();
      area++;
      const x = p % W;
      const y = (p / W) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && !background[q] && part[q] < 0) {
          part[q] = id;
          stack.push(q);
        }
      }
    }
    parts.push({ id, area, box: [x0, y0, x1, y1] });
  }
  // confetti and leaves are small; figures and speech bubbles are not
  const kept = parts.filter((p) => p.area >= 1500).sort((a, b) => b.area - a.area);
  return Promise.all(
    kept.map(async (p) => {
      const buf = Buffer.from(data);
      for (let i = 0; i < N; i++) if (part[i] !== p.id) buf[i * 4 + 3] = 0;
      const png = await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
      return { png, width: W, height: H, box: p.box };
    }),
  );
}

function over(dst, src, n) {
  for (let i = 0; i < n; i++) {
    const sa = src[i * 4 + 3] / 255;
    if (sa === 0) continue;
    const da = dst[i * 4 + 3] / 255;
    const oa = sa + da * (1 - sa);
    for (let c = 0; c < 3; c++) {
      dst[i * 4 + c] = Math.round((src[i * 4 + c] * sa + dst[i * 4 + c] * da * (1 - sa)) / oa);
    }
    dst[i * 4 + 3] = Math.round(oa * 255);
  }
}

function blit(W, H, src, sw, sh, ox, oy) {
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < sh; y++) {
    const ty = y + oy;
    if (ty < 0 || ty >= H) continue;
    for (let x = 0; x < sw; x++) {
      const tx = x + ox;
      if (tx < 0 || tx >= W) continue;
      src.copy(out, (ty * W + tx) * 4, (y * sw + x) * 4, (y * sw + x) * 4 + 4);
    }
  }
  return out;
}

/** White disc dilation of the alpha mask with a soft edge. */
function outline(src, W, H, r) {
  const out = Buffer.alloc(W * H * 4);
  const reach = Math.ceil(r + 1);
  const offsets = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= r + 1) offsets.push([dx, dy, Math.min(1, Math.max(0, r + 0.5 - d))]);
    }
  }
  const alpha = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) alpha[i] = src[i * 4 + 3] / 255;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let m = 0;
      for (const [dx, dy, weight] of offsets) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const v = alpha[yy * W + xx] * weight;
        if (v > m) {
          m = v;
          if (m >= 1) break;
        }
      }
      const i = (y * W + x) * 4;
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = Math.round(m * 255);
    }
  }
  return out;
}

async function scaled(png, width, height) {
  return sharp(png).resize(width, height, { kernel: "lanczos3" }).ensureAlpha().raw().toBuffer();
}

async function buildIcon(icon, parts) {
  const W = Math.round(FRAME.width * K);
  const H = Math.round(FRAME.height * K);
  const n = W * H;
  const s = (FRAME.face * K * (icon.scale ?? 1)) / icon.face; // source px -> working px
  const centreX = icon.headX + icon.dx * icon.face;
  const eyeLine = (icon.eyeLine ?? FRAME.eyeLine) * K;
  const figure = Buffer.alloc(n * 4);

  const layers = [{ part: parts[0], shiftX: 0, shiftY: 0 }];
  if (icon.secondFigure) layers.push({ part: parts[1], ...icon.secondFigure });
  for (const layer of layers) {
    const rw = Math.round(layer.part.width * s);
    const rh = Math.round(layer.part.height * s);
    const buf = await scaled(layer.part.png, rw, rh);
    const ox = Math.round(W / 2 - (centreX - layer.shiftX) * s);
    const oy = Math.round(eyeLine - (icon.eyeY - layer.shiftY) * s);
    over(figure, blit(W, H, buf, rw, rh, ox, oy), n);
  }

  if (icon.bubble) {
    const bubble = parts[1];
    const [x0, y0, x1, y1] = bubble.box;
    const bw = Math.round(icon.bubble.width * FRAME.width * K);
    const bh = Math.round((bw * (y1 - y0 + 1)) / (x1 - x0 + 1));
    const buf = await sharp(bubble.png)
      .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
      .resize(bw, bh, { kernel: "lanczos3" })
      .ensureAlpha()
      .raw()
      .toBuffer();
    if (icon.bubble.recolor) {
      // grey bubble -> colour, light "!" -> white
      for (let i = 0; i < bw * bh; i++) {
        const L = 0.299 * buf[i * 4] + 0.587 * buf[i * 4 + 1] + 0.114 * buf[i * 4 + 2];
        const t = Math.min(1, Math.max(0, (L - 165) / (232 - 165)));
        for (let c = 0; c < 3; c++) buf[i * 4 + c] = Math.round(icon.bubble.recolor[c] * (1 - t) + 255 * t);
      }
    }
    const ox = Math.round(icon.bubble.cx * FRAME.width * K - bw / 2);
    const oy = Math.round((OVERHANG + icon.bubble.cy * TILE) * K - bh / 2);
    const placed = blit(W, H, buf, bw, bh, ox, oy);
    over(figure, outline(placed, W, H, OUTLINE * K), n);
    over(figure, placed, n);
  }

  const out = outline(figure, W, H, OUTLINE * K);
  over(out, figure, n);

  // Free above the tile's top corners, rounded like the tile below them.
  const top = OVERHANG * K;
  const bottom = (OVERHANG + TILE) * K;
  const r = TILE_RADIUS * K;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let a = 1;
      if (py >= top + r) {
        const qx = Math.max(r - px, px - (W - r), 0);
        const qy = Math.max(top + r - py, py - (bottom - r), 0);
        const d = Math.sqrt(qx * qx + qy * qy) - r;
        a = py <= bottom ? Math.min(1, Math.max(0, 0.5 - d)) : 0;
      }
      const i = (y * W + x) * 4 + 3;
      out[i] = Math.round(out[i] * a);
    }
  }

  const master = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  for (const scale of [2, 3]) {
    const file = path.join(OUT, `${icon.kind}@${scale}x.webp`);
    await sharp(master)
      .resize(Math.round(FRAME.width * scale), Math.round(FRAME.height * scale), { kernel: "lanczos3" })
      .webp({ quality: 90, alphaQuality: 100, effort: 6, smartSubsample: true })
      .toFile(file);
    console.log(path.relative(mobileRoot, file));
  }
}

mkdirSync(OUT, { recursive: true });
const cache = new Map();
for (const icon of ICONS) {
  if (!cache.has(icon.source)) cache.set(icon.source, await cutOut(path.join(BRAND, icon.source)));
  await buildIcon(icon, cache.get(icon.source));
}
