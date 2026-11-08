import { SYSTEM_PROMPT } from "./server/prompt.js";
import { validateQuiz, sourceMatches } from "./server/validation.js";
export {
  validateQuiz,
  sourceMatches,
  normalizeSource,
} from "./server/validation.js";
import http from "node:http";
const port = Number(process.env.API_PORT || 3001);
const difficulties = [
  "Foundations: recognize and understand core definitions",
  "Connections: compare concepts and explain relationships",
  "Application: apply concepts to a new scenario",
  "Mastery: analyze multi-step problems and subtle distinctions",
];
export const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const send = (code, data) => {
    res.statusCode = code;
    res.end(JSON.stringify(data));
  };
  if (req.url === "/api/status" && req.method === "GET")
    return send(200, {
      configured: !!process.env.AI_BASE_URL && !!process.env.AI_MODEL,
      model: process.env.AI_MODEL || null,
    });
  if (req.url !== "/api/quiz" || req.method !== "POST")
    return send(404, { error: "Not found" });
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 250000)
        return send(413, {
          error: "Material is too large. Use a shorter document.",
        });
    }
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return send(400, { error: "Invalid JSON." });
    }
    if (
      typeof data.text !== "string" ||
      data.text.trim().length < 100 ||
      data.text.length > 60000 ||
      !Number.isInteger(data.level) ||
      data.level < 1 ||
      data.level > 4
    )
      return send(400, {
        error:
          "Provide 100–60,000 characters of material and a level from 1 to 4.",
      });
    const base = process.env.AI_BASE_URL,
      model = process.env.AI_MODEL;
    if (!base || !model)
      return send(503, {
        error:
          "Connect your AI provider: set AI_BASE_URL, AI_MODEL, and optionally AI_API_KEY on the server, then restart it.",
      });
    const endpoint = new URL(base.replace(/\/$/, "") + "/chat/completions");
    if (!["http:", "https:"].includes(endpoint.protocol))
      throw new Error("Invalid provider URL");
    const upstream = await fetch(endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(90000),
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AI_API_KEY
          ? { Authorization: `Bearer ${process.env.AI_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              difficulty: difficulties[data.level - 1],
              material: data.text,
              previousQuestions: Array.isArray(data.previous)
                ? data.previous
                    .slice(-30)
                    .filter((x) => typeof x === "string")
                    .map((x) => x.slice(0, 500))
                : [],
            }),
          },
        ],
      }),
    });
    if (!upstream.ok)
      return send(502, {
        error: `AI provider returned HTTP ${upstream.status}. Check the endpoint, model, and server credentials.`,
      });
    const result = await upstream.json();
    let content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string")
      throw new Error("Provider returned no text.");
    content = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    const quiz = validateQuiz(JSON.parse(content));
    if (quiz.questions.some((q) => !sourceMatches(data.text, q.source)))
      throw new Error(
        "Provider returned a source quote whose wording could not be found in your material, even after normalizing spacing and quotation marks. Try generating again.",
      );
    send(200, quiz);
  } catch (err) {
    send(502, {
      error:
        err.name === "TimeoutError"
          ? "AI provider timed out. Please retry."
          : err instanceof SyntaxError
            ? "Provider returned invalid JSON. Please retry."
            : err.message || "Question generation failed.",
    });
  }
});
if (process.argv[1] === new URL(import.meta.url).pathname)
  server.listen(port, "127.0.0.1", () =>
    console.log(`Study API listening on ${port}`),
  );
