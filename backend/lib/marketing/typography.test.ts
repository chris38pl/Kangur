import assert from "node:assert/strict";
import { test } from "node:test";

import { plainSpaces, typesetCopy, typesetPl } from "./typography";

const N = " ";

test("one-letter words stick to the next word", () => {
  assert.equal(typesetPl("Screen i po krzyku."), `Screen i${N}po krzyku.`);
  assert.equal(typesetPl("W prawo: kupione"), `W${N}prawo: kupione`);
  assert.equal(typesetPl("a i w domu"), `a${N}i${N}w${N}domu`);
  assert.equal(typesetPl("(z AI)"), `(z${N}AI)`);
  assert.equal(typesetPl("[[faq|O Kangurze]]"), `[[faq|O${N}Kangurze]]`);
});

test("letters inside words and marks stay as they are", () => {
  assert.equal(typesetPl("kawa i"), "kawa i");
  assert.equal(typesetPl("mama ma kota"), "mama ma kota");
  assert.equal(typesetPl("[[https://a.pl/x y|z]]"), "[[https://a.pl/x y|z]]");
});

test("numbers keep their unit", () => {
  assert.equal(typesetPl("9,99 zł miesięcznie"), `9,99${N}zł miesięcznie`);
  assert.equal(typesetPl("1 kg mąki, 500 ml mleka"), `1${N}kg mąki, 500${N}ml mleka`);
  assert.equal(typesetPl("10 lat"), "10 lat");
  assert.equal(typesetPl("2 gramy"), "2 gramy");
});

test("copy objects are typeset all the way down and can be undone", () => {
  const copy = { lines: ["i po", "krzyku"], rows: [{ a: "w domu", n: 2 }], on: true };
  assert.deepEqual(typesetCopy(copy), {
    lines: [`i${N}po`, "krzyku"],
    rows: [{ a: `w${N}domu`, n: 2 }],
    on: true,
  });
  assert.equal(plainSpaces(typesetPl("Screen i po krzyku.")), "Screen i po krzyku.");
});
