import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { printingIn } from "@/lib/marketing/no-printing";

const ROOT = path.resolve(__dirname, "../..");

function sources(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(file);
    return /\.(tsx?|css)$/.test(entry.name) && !/no-printing|\.generated\./.test(entry.name) ? [file] : [];
  });
}

test("printing words are caught, the idiom is not", () => {
  for (const word of ["Drukuj", "wydruk", "do druku", "drukarka", "na drukarce", "wydruki", "druczek", "PDF", "nadruk"]) {
    assert.ok(printingIn(word), word);
  }
  for (const text of ["małym drukiem", "Małym drukiem", "drużyna", "odruch", "pdfy w adresie"]) {
    assert.equal(printingIn(text), null, text);
  }
});

test("nothing on the site prints, also what only the browser draws", () => {
  const files = ["app", "components", "lib/marketing"].flatMap(sources);
  assert.ok(files.length > 100);
  const found = files.flatMap((file) => {
    const text = fs
      .readFileSync(path.join(ROOT, file), "utf8")
      // Sources quoted in the copy are other people's PDFs.
      .replace(/https?:\/\/[^\s"'|\]]+/g, "")
      // An old address that leads elsewhere is not copy.
      .replace(/"\/[\w/-]*"/g, "")
      .replace(/@media print/g, "");
    const hit = printingIn(text);
    return hit ? [`${file}: ${text.slice(Math.max(0, hit.index - 40), hit.index + 40)}`] : [];
  });
  assert.deepEqual(found, []);
});
