function normalizeAnswer(value) {
  return String(value)
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}
export function isCorrect(question, value) {
  return question.type === "recall"
    ? question.acceptedAnswers.some(
        (answer) => normalizeAnswer(answer) === normalizeAnswer(value),
      )
    : value === question.answer;
}
