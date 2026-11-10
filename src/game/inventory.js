export const POWERUPS = {
  insight: {
    name: "Insight",
    icon: "lightbulb",
    description:
      "Reveal a supporting passage from your material. Earn one for every cleared question checkpoint.",
  },
  focus: {
    name: "Focus",
    icon: "scan-eye",
    description:
      "Reveal an answer pattern for recall, remove two wrong choices, or inspect the evidence for true/false. Earn one every two cleared checkpoints.",
  },
};
export function createInventory() {
  return { insight: 0, focus: 0 };
}
export function hintAvailable(state, index, type) {
  return (
    !!POWERUPS[type] &&
    state.inventory[type] > 0 &&
    !state.hints[index]?.[type] &&
    !state.done.includes(index) &&
    index === state.done.length
  );
}
export function useHint(state, index, type) {
  if (!hintAvailable(state, index, type)) return false;
  state.inventory[type]--;
  state.hints[index] ??= {};
  state.hints[index][type] = true;
  return true;
}
export function hintText(question, type) {
  if (type === "insight") return `From your material: “${question.source}”`;
  if (question.type === "recall") {
    const words = question.acceptedAnswers[0].trim().split(/\s+/);
    return `Answer pattern: ${words.map((w) => [...w].map((c, i) => (i === 0 || !/[\p{L}\p{N}]/u.test(c) ? c : "_")).join(" ")).join(" / ")} (${words.length} ${words.length === 1 ? "word" : "words"}).`;
  }
  if (question.type === "true_false")
    return `Compare the claim with this evidence: “${question.source}”`;
  return "Two incorrect choices have been removed.";
}
export function removedChoices(question, focused) {
  if (!focused || question.type !== "mcq") return [];
  return question.options
    .map((_, i) => i)
    .filter((i) => i !== question.answer)
    .slice(0, 2);
}
