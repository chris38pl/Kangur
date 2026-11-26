import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { FILMS, FILM_GROUPS, filmGroup, filmTopic } from "@/lib/marketing/films";
import { ROUTES } from "@/lib/marketing/routes";

const PUBLIC = path.resolve(__dirname, "../../public");

test("every film and every size of its cover is on the site", () => {
  assert.ok(FILMS.length > 0);
  for (const item of FILMS) {
    const covers = item.poster.avif.split(", ").map((entry) => entry.split(" ")[0]);
    for (const file of [item.src, item.poster.src, ...covers]) {
      assert.ok(fs.existsSync(path.join(PUBLIC, file)), `${item.id}: ${file}`);
    }
  }
});

test("films are short, light and named once", () => {
  const titles = new Set<string>();
  for (const item of FILMS) {
    assert.ok(item.seconds >= 10 && item.seconds <= 30, `${item.id}: ${item.seconds} s`);
    assert.ok(item.kb < 2500, `${item.id}: ${item.kb} KB, a phone on mobile data waits`);
    assert.ok(!titles.has(item.title), `${item.id}: the title is taken`);
    titles.add(item.title);
  }
});

test("what the narrator says is plain text, without the marks of the script", () => {
  for (const item of FILMS) {
    assert.doesNotMatch(item.transcript, /[{}[\]|]/, item.id);
    assert.doesNotMatch(`${item.title} ${item.transcript}`, /[–—]/, item.id);
  }
});

test("every film belongs to a part of the films page", () => {
  const ids = new Set<string>(FILM_GROUPS.map((group) => group.id));
  assert.equal(ids.size, FILM_GROUPS.length);
  for (const item of FILMS) assert.ok(ids.has(filmGroup(item).id), item.id);
});

test("films and parts have anchors of their own on the films page", () => {
  const anchors = [...FILM_GROUPS.map((group) => group.id), ...FILMS.map((item) => item.slug)];
  assert.equal(new Set(anchors).size, anchors.length);
  for (const anchor of anchors) assert.match(anchor, /^[a-z0-9-]+$/);
});

test("a film leads to a Polish page that exists", () => {
  for (const item of FILMS) {
    const topic = filmTopic(item.id);
    if (topic) assert.ok(ROUTES[topic.id].paths.pl, `${item.id}: ${topic.id}`);
  }
});
