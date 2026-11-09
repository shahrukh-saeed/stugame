import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createQuest,
  movePlayer,
  resolveChapter,
  canAct,
  currentChapter,
  reachedCamp,
  questXP,
  CHAPTERS,
} from "../src/game/quest.js";
test("unanswered gates physically block movement, including sideways bypasses", () => {
  const state = createQuest();
  movePlayer(state, 1, -1, 50, true);
  assert.equal(state.z, -4);
  assert.equal(state.x, 7);
  assert.ok(canAct(state));
  assert.equal(reachedCamp(state), false);
  assert.equal(resolveChapter(state, 3, true), false);
  assert.equal(state.done.length, 0);
  resolveChapter(state, 0, false);
  movePlayer(state, 0, -1, 50);
  assert.equal(state.z, -4);
  resolveChapter(state, 0, true);
  movePlayer(state, 0, -1, 1);
  assert.ok(state.z < -4);
  assert.ok(Math.abs(state.x) <= 2);
  assert.equal(currentChapter(state), CHAPTERS[1]);
});
test("only solved chapters unlock the portal; retries do not farm XP or advance difficulty score", () => {
  const state = createQuest();
  resolveChapter(state, 0, false);
  resolveChapter(state, 0, false);
  assert.equal(state.missed.length, 1);
  assert.equal(questXP(state), 0);
  // No negative XP is displayed while a challenge remains unsolved.
  for (let i = 0; i < 5; i++) {
    assert.ok(resolveChapter(state, i, true));
    assert.equal(resolveChapter(state, i, true), false);
  }
  assert.equal(questXP(state), 80);
  state.gems.push(0, 1);
  assert.equal(questXP(state), 90);
  assert.equal(reachedCamp(state), false);
  movePlayer(state, 0, -1, 50);
  assert.ok(reachedCamp(state));
});
