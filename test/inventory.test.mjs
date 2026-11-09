import { test } from "node:test";
import assert from "node:assert/strict";
import { createQuest, resolveChapter, movePlayer } from "../src/game/quest.js";
import {
  collectSupply,
  useItem,
  dropItem,
  packLoad,
  PACK_CAPACITY,
} from "../src/game/inventory.js";
test("supplies occupy pack slots, have useful effects, and cannot be collected twice", () => {
  const state = createQuest();
  assert.equal(packLoad(state), 4);
  state.stamina = 20;
  assert.ok(collectSupply(state, 0));
  assert.equal(state.inventory.water, 2);
  assert.equal(state.gems.length, 1);
  assert.equal(collectSupply(state, 0), false);
  assert.ok(useItem(state, "water"));
  assert.equal(state.stamina, 70);
  assert.equal(state.inventory.water, 1);
  assert.ok(useItem(state, "trailMix"));
  assert.equal(state.stamina, 95);
  assert.equal(state.boostSeconds, 12);
  assert.equal(useItem(state, "trailMix"), false);
  state.stamina = 100;
  const water = state.inventory.water;
  assert.equal(useItem(state, "water"), false);
  assert.equal(state.inventory.water, water);
});
test("capacity limits pickups without losing them; equipment cannot be discarded", () => {
  const state = createQuest();
  for (let i = 0; i < 4; i++) assert.ok(collectSupply(state, i));
  assert.equal(packLoad(state), PACK_CAPACITY);
  assert.equal(collectSupply(state, 4), false);
  assert.equal(state.gems.includes(4), false);
  assert.equal(dropItem(state, "rope"), false);
  assert.equal(useItem(state, "rope"), false);
  assert.ok(dropItem(state, "water"));
  assert.ok(collectSupply(state, 4));
  assert.equal(packLoad(state), PACK_CAPACITY);
});
test("rope is used only on successful bridge/ascent actions, never on retries or duplicate completions", () => {
  const state = createQuest();
  resolveChapter(state, 0, false);
  assert.equal(state.inventory.rope, 2);
  resolveChapter(state, 0, true);
  assert.equal(state.inventory.rope, 1);
  resolveChapter(state, 0, true);
  assert.equal(state.inventory.rope, 1);
  for (let i = 1; i <= 3; i++) resolveChapter(state, i, true);
  assert.equal(state.inventory.rope, 0);
});
test("sprinting drains stamina, rest recovers it, and walking is always possible", () => {
  const state = createQuest();
  movePlayer(state, 0, -1, 0.5, true);
  assert.equal(state.stamina, 90);
  movePlayer(state, 0, 0, 1);
  assert.equal(state.stamina, 100);
  state.stamina = 0;
  const z = state.z;
  movePlayer(state, 0, -1, 0.1, true);
  assert.ok(state.z < z);
  assert.ok(state.stamina > 0);
  state.boostSeconds = 12;
  movePlayer(state, 0, 0, 1);
  assert.equal(state.boostSeconds, 11);
});
