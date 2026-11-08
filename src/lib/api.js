export async function generateQuest(course) {
  const response = await fetch("/api/quiz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: course.text,
      level: course.level || 1,
      previous: course.history || [],
    }),
  });
  const result = await response.json();
  if (!response.ok)
    throw Error(result.error || "Could not generate your quest.");
  return result;
}
