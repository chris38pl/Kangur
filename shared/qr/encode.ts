/**
 * A QR code drawn in the browser, so that what is in it never leaves the device. Bytes only,
 * the smallest size that fits, error correction L, raised to M when that costs nothing.
 * Follows ISO/IEC 18004. Checked with a decoder in encode.test.ts and in the browser tests.
 */
export type QrMatrix = { size: number; dark: boolean[][] };

type Level = "L" | "M";

/** Versions 1 to 22: 105 modules across is as much as a phone comfortably reads from a screen. */
const MAX_VERSION = 22;
const EC_PER_BLOCK: Record<Level, readonly number[]> = {
  L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28],
  M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28],
};
const BLOCKS: Record<Level, readonly number[]> = {
  L: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9],
  M: [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17],
};
const FORMAT_BITS: Record<Level, number> = { L: 1, M: 0 };

/** Every eight modules left after the fixed patterns carry one codeword. */
function rawCodewords(version: number): number {
  let modules = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    modules -= (25 * align - 10) * align - 55;
    if (version >= 7) modules -= 36;
  }
  return Math.floor(modules / 8);
}

const dataCodewords = (version: number, level: Level) =>
  rawCodewords(version) - EC_PER_BLOCK[level][version - 1] * BLOCKS[level][version - 1];

const countBits = (version: number) => (version < 10 ? 8 : 16);

const fits = (bytes: number, version: number, level: Level) =>
  4 + countBits(version) + bytes * 8 <= dataCodewords(version, level) * 8;

// ── Reed-Solomon over GF(256) ────────────────────────────────────────────────
function multiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function divisor(degree: number): number[] {
  const result: number[] = Array.from({ length: degree }, (_, i) => (i === degree - 1 ? 1 : 0));
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = multiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = multiply(root, 2);
  }
  return result;
}

function remainder(data: readonly number[], by: readonly number[]): number[] {
  const result = by.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    by.forEach((coefficient, i) => {
      result[i] ^= multiply(coefficient, factor);
    });
  }
  return result;
}

// ── Codewords ────────────────────────────────────────────────────────────────
function toCodewords(bytes: Uint8Array, version: number, level: Level): number[] {
  const capacity = dataCodewords(version, level) * 8;
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, countBits(version));
  for (const byte of bytes) push(byte, 8);
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  }
  return interleave(data, version, level);
}

function interleave(data: readonly number[], version: number, level: Level): number[] {
  const count = BLOCKS[level][version - 1];
  const ecLength = EC_PER_BLOCK[level][version - 1];
  const raw = rawCodewords(version);
  const shortBlocks = count - (raw % count);
  const shortData = Math.floor(raw / count) - ecLength;
  const by = divisor(ecLength);

  const blocks: { data: readonly number[]; ec: readonly number[] }[] = [];
  let from = 0;
  for (let i = 0; i < count; i += 1) {
    const part = data.slice(from, from + shortData + (i < shortBlocks ? 0 : 1));
    from += part.length;
    blocks.push({ data: part, ec: remainder(part, by) });
  }

  const result: number[] = [];
  for (let i = 0; i <= shortData; i += 1) {
    for (const block of blocks) if (i < block.data.length) result.push(block.data[i]);
  }
  for (let i = 0; i < ecLength; i += 1) {
    for (const block of blocks) result.push(block.ec[i]);
  }
  return result;
}

// ── Modules ──────────────────────────────────────────────────────────────────
function alignmentPositions(version: number, size: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.ceil((size - 13) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let position = size - 7; result.length < count; position -= step) result.splice(1, 0, position);
  return result;
}

const MASKS: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

const bit = (value: number, i: number) => ((value >>> i) & 1) !== 0;

function drawFormat(dark: boolean[][], size: number, level: Level, mask: number) {
  const data = (FORMAT_BITS[level] << 3) | mask;
  let rest = data;
  for (let i = 0; i < 10; i += 1) rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
  const bits = ((data << 10) | rest) ^ 0x5412;
  for (let i = 0; i <= 5; i += 1) dark[i][8] = bit(bits, i);
  dark[7][8] = bit(bits, 6);
  dark[8][8] = bit(bits, 7);
  dark[8][7] = bit(bits, 8);
  for (let i = 9; i < 15; i += 1) dark[8][14 - i] = bit(bits, i);
  for (let i = 0; i < 8; i += 1) dark[8][size - 1 - i] = bit(bits, i);
  for (let i = 8; i < 15; i += 1) dark[size - 15 + i][8] = bit(bits, i);
  dark[size - 8][8] = true;
}

/** How hard it is to read, the lower the better. Any mask is correct, this one is nicer. */
function penalty(dark: readonly (readonly boolean[])[], size: number): number {
  let points = 0;
  let total = 0;
  const line = (at: (i: number) => boolean) => {
    let text = "";
    for (let i = 0; i < size; i += 1) text += at(i) ? "1" : "0";
    for (const run of text.match(/0{5,}|1{5,}/g) ?? []) points += run.length - 2;
    for (const pattern of ["10111010000", "00001011101"]) {
      for (let i = text.indexOf(pattern); i >= 0; i = text.indexOf(pattern, i + 1)) points += 40;
    }
  };
  for (let a = 0; a < size; a += 1) {
    line((i) => dark[a][i]);
    line((i) => dark[i][a]);
  }
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const color = dark[y][x];
      if (color) total += 1;
      if (
        x + 1 < size &&
        y + 1 < size &&
        color === dark[y][x + 1] &&
        color === dark[y + 1][x] &&
        color === dark[y + 1][x + 1]
      ) {
        points += 3;
      }
    }
  }
  return points + Math.floor(Math.abs((total / (size * size)) * 100 - 50) / 5) * 10;
}

/** Null when the text is too long for a code a phone can read. */
export function encodeQr(text: string): QrMatrix | null {
  const bytes = new TextEncoder().encode(text);
  let version = 1;
  while (version <= MAX_VERSION && !fits(bytes.length, version, "L")) version += 1;
  if (version > MAX_VERSION) return null;
  const level: Level = fits(bytes.length, version, "M") ? "M" : "L";

  const size = version * 4 + 17;
  const blank = () => Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const dark = blank();
  const fixed = blank();
  const set = (x: number, y: number, value: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    dark[y][x] = value;
    fixed[y][x] = true;
  };

  for (let i = 0; i < size; i += 1) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const ring = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, ring !== 2 && ring !== 4);
      }
    }
  }
  const positions = alignmentPositions(version, size);
  const last = positions.length - 1;
  positions.forEach((cx, i) => {
    positions.forEach((cy, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    });
  });
  if (version >= 7) {
    let rest = version;
    for (let i = 0; i < 12; i += 1) rest = (rest << 1) ^ ((rest >>> 11) * 0x1f25);
    const bits = (version << 12) | rest;
    for (let i = 0; i < 18; i += 1) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, bit(bits, i));
      set(b, a, bit(bits, i));
    }
  }
  // The format strip belongs to nobody's data. Its values come with the mask.
  for (let i = 0; i < 9; i += 1) {
    fixed[8][i] = true;
    fixed[i][8] = true;
  }
  for (let i = 0; i < 8; i += 1) {
    fixed[8][size - 1 - i] = true;
    fixed[size - 1 - i][8] = true;
  }

  const codewords = toCodewords(bytes, version, level);
  let next = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step += 1) {
      const y = ((right + 1) & 2) === 0 ? size - 1 - step : step;
      for (const x of [right, right - 1]) {
        if (fixed[y][x] || next >= codewords.length * 8) continue;
        dark[y][x] = bit(codewords[next >>> 3], 7 - (next & 7));
        next += 1;
      }
    }
  }

  let best: boolean[][] = dark;
  let lowest = Infinity;
  MASKS.forEach((masked, mask) => {
    const candidate = dark.map((row, y) => row.map((value, x) => value !== (!fixed[y][x] && masked(x, y))));
    drawFormat(candidate, size, level, mask);
    const points = penalty(candidate, size);
    if (points < lowest) {
      lowest = points;
      best = candidate;
    }
  });
  return { size, dark: best };
}

/** One SVG path: a rectangle for every run of dark modules. */
export function qrPath({ size, dark }: QrMatrix): string {
  let path = "";
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!dark[y][x]) continue;
      let run = 1;
      while (x + run < size && dark[y][x + run]) run += 1;
      path += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return path;
}
