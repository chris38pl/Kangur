import assert from "node:assert/strict";
import { test } from "node:test";

import { plainSpaces, typeset, typesetCopy, typesetPl } from "./typography";

const N = "\u00a0";

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
  assert.equal(typesetPl("zniknęło 10 000 zł"), `zniknęło 10${N}000${N}zł`);
  assert.equal(typesetPl("ID 6832296080"), "ID 6832296080");
});

test("e-mail is never split at its hyphen", () => {
  const J = "\u2060";
  assert.equal(typesetPl("imienia ani e-maila"), `imienia ani e-${J}maila`);
  assert.equal(typeset("E-mail (e-mail)", "cs"), `E-${J}mail (e-${J}mail)`);
  assert.equal(typesetPl("[[https://a.pl/e-mail|adres]]"), "[[https://a.pl/e-mail|adres]]");
  assert.equal(plainSpaces(typesetPl("ani e-maila")), "ani e-maila");
});

test("other languages keep their own rules", () => {
  assert.equal(typeset("Ty a já v obchodě", "cs"), `Ty a${N}já v${N}obchodě`);
  assert.equal(typeset("Сыр и масло", "ru"), `Сыр и${N}масло`);
  assert.equal(typeset("Сир і масло", "uk"), `Сир і${N}масло`);
  assert.equal(typeset("Сыр і масла", "be"), `Сыр і${N}масла`);
  assert.equal(typeset("Combien ? « ici » : oui", "fr"), `Combien\u202f? «${N}ici${N}»${N}: oui`);
  assert.equal(typeset("a b c", "en"), "a b c");
  assert.equal(typeset("https://a.fr ok", "fr"), "https://a.fr ok");
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
