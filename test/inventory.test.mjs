import { test } from "node:test";
import assert from "node:assert/strict";
import { createQuest, resolveChapter, questXP } from "../src/game/quest.js";
import { useHint, hintText, removedChoices } from "../src/game/inventory.js";
test("correct checkpoints grant rewards once; missed attempts cannot farm rewards", () => {
  const s = createQuest();
  resolveChapter(s, 0, false);
  assert.deepEqual(s.inventory, { insight: 0, focus: 0 });
  assert.ok(resolveChapter(s, 0, true));
  assert.equal(s.inventory.insight, 1);
  assert.equal(resolveChapter(s, 0, true), false);
  assert.equal(s.inventory.insight, 1);
  resolveChapter(s, 1, true);
  assert.deepEqual(s.inventory, { insight: 2, focus: 1 });
  assert.equal(questXP(s), 20);
});
test("hints spend one charge, persist on retry, and cannot be used on completed or future questions", () => {
  const s = createQuest();
  assert.equal(useHint(s, 0, "insight"), false);
  resolveChapter(s, 0, true);
  assert.equal(useHint(s, 0, "insight"), false);
  assert.equal(useHint(s, 2, "insight"), false);
  assert.ok(useHint(s, 1, "insight"));
  assert.equal(s.inventory.insight, 0);
  s.inventory.insight = 1;
  assert.equal(useHint(s, 1, "insight"), false);
  assert.equal(s.inventory.insight, 1);
  resolveChapter(s, 1, false);
  assert.ok(s.hints[1].insight);
});
test("Focus removes only incorrect choices and supports non-MCQ hints", () => {
  const q = { type: "mcq", options: ["A", "B", "C", "D"], answer: 1 };
  assert.deepEqual(removedChoices(q, true), [0, 2]);
  assert.equal(removedChoices(q, true).includes(q.answer), false);
  assert.match(
    hintText({ type: "recall", acceptedAnswers: ["ATP synthase"] }, "focus"),
    /A _ _ \/ s _ _ _ _ _ _/,
  );
  assert.match(
    hintText({ source: "Plants need light." }, "insight"),
    /Plants need light/,
  );
});
