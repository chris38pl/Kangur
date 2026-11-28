import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  HOLD_HINT_STORAGE_KEY,
  HOLD_HINT_TIMES,
  getHoldHintCount,
  loadHoldHintCount,
  noteHoldHintShown,
  noteSuggestionHeld,
  parseHoldHintCount,
  resetHoldHintForTests,
  shouldShowHoldHint,
  subscribeHoldHint,
} from "./suggestion-hold-hint.ts";

describe("parseHoldHintCount", () => {
  it("starts from zero", () => {
    assert.equal(parseHoldHintCount(null), 0);
    assert.equal(parseHoldHintCount("abc"), 0);
    assert.equal(parseHoldHintCount("-2"), 0);
  });

  it("reads a stored count and caps it", () => {
    assert.equal(parseHoldHintCount("3"), 3);
    assert.equal(parseHoldHintCount("99"), HOLD_HINT_TIMES);
  });
});

describe("shouldShowHoldHint", () => {
  it("shows the line the first five times", () => {
    assert.equal(HOLD_HINT_TIMES, 5);
    for (let count = 0; count < HOLD_HINT_TIMES; count += 1) {
      assert.equal(shouldShowHoldHint(count), true);
    }
    assert.equal(shouldShowHoldHint(HOLD_HINT_TIMES), false);
  });
});

describe("hold hint count", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetHoldHintForTests();
  });

  it("counts the times shown and remembers them after a restart", async () => {
    assert.equal(await loadHoldHintCount(), 0);
    for (let shown = 0; shown < HOLD_HINT_TIMES; shown += 1) {
      assert.equal(shouldShowHoldHint(getHoldHintCount() ?? 0), true);
      noteHoldHintShown();
    }
    assert.equal(shouldShowHoldHint(getHoldHintCount() ?? 0), false);

    noteHoldHintShown();
    assert.equal(getHoldHintCount(), HOLD_HINT_TIMES);

    resetHoldHintForTests();
    assert.equal(await loadHoldHintCount(), HOLD_HINT_TIMES);
  });

  it("stops after the first hold", async () => {
    await loadHoldHintCount();
    noteHoldHintShown();
    noteSuggestionHeld();
    assert.equal(shouldShowHoldHint(getHoldHintCount() ?? 0), false);

    resetHoldHintForTests();
    assert.equal(await loadHoldHintCount(), HOLD_HINT_TIMES);
  });

  it("does not count before storage is read", async () => {
    await AsyncStorage.setItem(HOLD_HINT_STORAGE_KEY, "2");
    noteHoldHintShown();
    assert.equal(getHoldHintCount(), null);
    assert.equal(await loadHoldHintCount(), 2);
  });

  it("keeps a hold made while storage is still being read", async () => {
    await AsyncStorage.setItem(HOLD_HINT_STORAGE_KEY, "1");
    const reading = loadHoldHintCount();
    noteSuggestionHeld();
    assert.equal(await reading, HOLD_HINT_TIMES);
  });

  it("tells subscribers when the count is read and when it changes", async () => {
    await AsyncStorage.setItem(HOLD_HINT_STORAGE_KEY, "3");
    let calls = 0;
    const unsubscribe = subscribeHoldHint(() => {
      calls += 1;
    });
    await loadHoldHintCount();
    assert.equal(getHoldHintCount(), 3);
    assert.equal(calls, 1);

    noteHoldHintShown();
    assert.equal(getHoldHintCount(), 4);
    assert.equal(calls, 2);

    unsubscribe();
    noteSuggestionHeld();
    assert.equal(getHoldHintCount(), HOLD_HINT_TIMES);
    assert.equal(calls, 2);
  });
});
