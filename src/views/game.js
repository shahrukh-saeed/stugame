import { inventory } from "./inventory.js";
import { esc, icon } from "../lib/html.js";
import { CHAPTERS, currentChapter, questXP } from "../game/quest.js";
import { hintAvailable, hintText, removedChoices } from "../game/inventory.js";
export function game({
  finished,
  correct,
  active,
  busy,
  quiz,
  index,
  world,
  challengeOpen,
  inventoryOpen,
  selected,
  answerCorrect,
  levels,
}) {
  const toolbar = `<div class="expedition-tools"><span class="kit-slot"></span><button id="inventory" ${finished || challengeOpen ? "disabled" : ""} aria-label="Open power-up inventory" aria-expanded="${inventoryOpen}">${icon("sparkles")} Power-ups <span>${world.inventory.insight + world.inventory.focus}</span></button><details class="game-settings"><summary>Options</summary><div class="settings-menu"><button id="sound" aria-pressed="false">Enable sound</button><button id="fullscreen" aria-pressed="false">Fullscreen</button></div></details></div><p id="presentation-status" role="status"></p>`;
  if (finished)
    return `${toolbar}<section class="result"><div class="result-icon">${icon("flag")}</div><div class="eyebrow">COURSE COMPLETE</div><h1>You conquered the course.</h1><p>${correct} questions solved on the first attempt · ${world.falls} falls</p><h3>${questXP(world)} XP earned</h3><p>${correct >= 4 ? `Next course: ${levels[(active.level || 1) - 1]}` : "Clear four questions on the first try to unlock a harder course."}</p><button id="again" class="primary" ${busy ? "disabled" : ""}>Run a new course ${icon("arrow-right")}</button><button id="exit" class="secondary">Back to study space</button></section>`;
  const c = currentChapter(world) || CHAPTERS[4];
  return `${toolbar}<div class="game-top"><button id="exit" class="text-button">${icon("arrow-left")} Leave course</button><span>${esc(active.title)}</span></div><section class="adventure"><div class="adventure-hud"><h2>${esc(c.title)}</h2><span class="course-stage">${world.done.length} / 5 gates cleared</span></div><div class="world-viewport"><canvas id="world" tabindex="0" aria-label="First-person obstacle course. WASD to move, mouse drag or arrow keys to look, Space to jump, E to answer, I for power-ups. On touch screens drag the left half to move and right half to look."></canvas><div class="world-vignette"></div><div class="crosshair" aria-hidden="true">+</div><div class="quest-tracker"><b>Reach the next question gate</b><small id="trail-bearing"></small></div><span class="first-person-tip">Click to capture mouse · Esc to release · Drag also works</span><button id="jump" class="touch-jump" aria-label="Jump">Jump</button></div><div class="world-controls"><div><p id="world-status" role="status">${esc(c.story)}</p><details class="control-help"><summary>Controls & help</summary><p>WASD move · Space jump · Shift sprint · Mouse or arrow keys look · E answer · I power-ups. Touch: drag left to move, right to look, and tap Jump. Falls return you to your last cleared gate.</p><button id="respawn" class="text-button">Return to checkpoint</button></details></div><button id="interact" class="primary">Reach the checkpoint</button></div></section>${inventoryOpen ? inventory(world) : challengeOpen ? challenge(quiz[index], index, selected, answerCorrect, world) : ""}`;
}
function challenge(q, index, selected, correct, state) {
  const removed = removedChoices(q, state.hints[index]?.focus);
  const hintSection = `<div class="question-powerups"><span>Need a hint?</span>${["insight", "focus"].map((type) => `<button data-hint="${type}" ${selected !== null || !hintAvailable(state, index, type) ? "disabled" : ""}>${type === "insight" ? "Insight" : "Focus"} (${state.inventory[type]})</button>`).join("")}<small>Correct answers earn Insight. Every second cleared gate also earns Focus.</small></div>${[
    "insight",
    "focus",
  ]
    .filter((type) => state.hints[index]?.[type])
    .map(
      (type) =>
        `<p class="hint-reveal" role="status">${esc(hintText(q, type))}</p>`,
    )
    .join("")}`;
  return `<div class="spell-overlay"><section class="quiz challenge spell-panel" role="dialog" aria-modal="true" aria-labelledby="challenge-title"><div class="eyebrow">QUESTION GATE ${index + 1} / 5</div><h2 id="challenge-title">${esc(q.question)}</h2>${q.type === "recall" ? `<form id="recall-form"><label for="recall-input">Your answer</label><input id="recall-input" required maxlength="200" autocomplete="off" ${selected !== null ? "disabled" : ""} value="${selected !== null ? esc(selected) : ""}" placeholder="Type a term or short phrase…"><button class="primary" ${selected !== null ? "disabled" : ""}>Submit answer ${icon("arrow-right")}</button></form>` : `<div class="answers">${(q.type === "true_false" ? ["True", "False"] : q.options).map((o, i) => (removed.includes(i) ? '<div class="eliminated-choice">Choice removed by Focus</div>' : `<button data-answer="${i}" ${selected !== null ? "disabled" : ""} class="answer ${selected !== null ? ((q.type === "true_false" ? i === 0 : i) === q.answer ? "right" : (q.type === "true_false" ? i === 0 : i) === selected ? "wrong" : "") : ""}"><span>${q.type === "true_false" ? (i === 0 ? "✓" : "✕") : "ABCD"[i]}</span>${esc(o)}</button>`)).join("")}</div>`}${hintSection}${selected !== null ? `<div class="feedback"><h3>${correct ? esc(CHAPTERS[index].reward) : "Not quite. Review the explanation and try again."}</h3>${!correct ? `<p>Answer: <strong>${esc(q.type === "recall" ? q.acceptedAnswers[0] : q.type === "true_false" ? (q.answer ? "True" : "False") : q.options[q.answer])}</strong></p>` : ""}<p>${esc(q.explanation)}</p><details><summary>Supporting passage</summary><blockquote>${esc(q.source)}</blockquote></details><button id="next" class="primary">${correct ? "Open the gate" : "Try again"} ${icon("arrow-right")}</button></div>` : ""}</section></div>`;
}
