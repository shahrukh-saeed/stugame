// Normalize presentation only. Preserve case, numbers, operators, and wording.
export function normalizeSource(text) {
  return text
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/gu, " ")
    .trim();
}
export function sourceMatches(material, quote) {
  const normalizedQuote = normalizeSource(quote);
  return (
    normalizedQuote.length > 0 &&
    normalizeSource(material).includes(normalizedQuote)
  );
}
export function validateQuiz(value) {
  if (!Array.isArray(value?.questions) || value.questions.length !== 5)
    throw new Error("Provider must return exactly five questions.");
  for (const q of value.questions) {
    const text = (x) => typeof x === "string" && x.trim().length > 0;
    if (!text(q.question) || !text(q.explanation) || !text(q.source))
      throw new Error("Provider returned an invalid question.");
    if (!q.type) q.type = "mcq"; // Compatibility with existing provider responses.
    if (q.type === "mcq") {
      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !q.options.every(text) ||
        new Set(q.options).size !== 4 ||
        !Number.isInteger(q.answer) ||
        q.answer < 0 ||
        q.answer > 3
      )
        throw new Error(
          "Provider returned an invalid multiple-choice challenge.",
        );
    } else if (q.type === "true_false") {
      if (typeof q.answer !== "boolean")
        throw new Error("Provider returned an invalid true/false challenge.");
    } else if (q.type === "recall") {
      if (
        !Array.isArray(q.acceptedAnswers) ||
        !q.acceptedAnswers.length ||
        q.acceptedAnswers.length > 10 ||
        !q.acceptedAnswers.every((a) => text(a) && a.length <= 200)
      )
        throw new Error("Provider returned an invalid recall challenge.");
    } else throw new Error("Provider returned an unsupported challenge type.");
  }
  return value;
}
