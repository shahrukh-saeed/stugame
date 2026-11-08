import { test } from "node:test";
import assert from "node:assert/strict";
import { isCorrect } from "../src/game/answers.js";
import { validateQuiz } from "../server/validation.js";
const base = {
  question: "Name the energy molecule.",
  explanation: "ATP stores energy.",
  source: "ATP stores energy.",
};
test("mixed challenge contract accepts recall, true/false, and MCQ", () => {
  const questions = [
    {
      ...base,
      type: "recall",
      acceptedAnswers: ["ATP", "adenosine triphosphate"],
    },
    { ...base, type: "true_false", answer: false },
    {
      ...base,
      type: "mcq",
      options: ["ATP", "DNA", "RNA", "Water"],
      answer: 0,
    },
    { ...base, type: "recall", acceptedAnswers: ["ATP"] },
    { ...base, type: "true_false", answer: true },
  ];
  assert.equal(validateQuiz({ questions }).questions.length, 5);
  assert.throws(() =>
    validateQuiz({
      questions: questions.map((q) => ({ ...q, type: "essay" })),
    }),
  );
  assert.throws(() =>
    validateQuiz({
      questions: questions.map((q) => ({
        ...q,
        type: "recall",
        acceptedAnswers: [],
      })),
    }),
  );
  assert.throws(() =>
    validateQuiz({
      questions: questions.map((q) => ({
        ...q,
        type: "true_false",
        answer: "false",
      })),
    }),
  );
});
test("recall accepts explicit synonyms and whitespace/case differences, not partial guesses", () => {
  const q = {
    type: "recall",
    acceptedAnswers: ["ATP", "adenosine triphosphate"],
  };
  assert.ok(isCorrect(q, " atp "));
  assert.ok(isCorrect(q, "Adenosine   triphosphate"));
  assert.equal(isCorrect(q, "triphosphate"), false);
  assert.equal(isCorrect(q, ""), false);
  assert.ok(isCorrect({ type: "true_false", answer: false }, false));
  assert.equal(isCorrect({ type: "true_false", answer: false }, true), false);
  assert.ok(isCorrect({ type: "mcq", answer: 2 }, 2));
});
