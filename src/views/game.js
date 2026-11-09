import { esc, icon } from "../lib/html.js";
import { CHAPTERS, currentChapter, questXP } from "../game/quest.js";

export function game({
  finished,
  correct,
  active,
  busy,
  quiz,
  index,
  world,
  challengeOpen,
  selected,
  answerCorrect,
  levels,
}) {
  if (finished)
    return `<section class="result"><div class="result-icon">${icon("mountain-snow")}</div><div class="eyebrow">THE VALLEY REMEMBERS</div><h1>You brought the light back.</h1><p>Five obstacles overcome. ${correct} challenges solved on your first attempt.</p><h3>${questXP(world)} XP earned · ${world.gems.length} gems discovered</h3><p>${correct >= 4 ? `Next expedition: ${levels[(active.level || 1) - 1]}` : "Keep practicing to unlock a harder expedition. Solve 4 challenges on the first try to advance."}</p><button id="again" class="primary" ${busy ? "disabled" : ""}>Begin another expedition ${icon("arrow-right")}</button><button id="exit" class="secondary">Back to study space</button></section>`;
  const q = quiz[index],
    chapter = currentChapter(world) || CHAPTERS[4];
  return `<div class="game-top"><button id="exit" class="text-button">${icon("arrow-left")} Leave expedition</button><span>${esc(active.title)} · Level ${active.level || 1}</span></div>
 <section class="adventure"><div class="adventure-hud"><div><div class="eyebrow">A 3D KNOWLEDGE QUEST</div><h2>${esc(chapter.title)}</h2></div><div id="journey-progress" class="crystal-count" aria-live="off">${world.done.length} / 5 paths restored · ${questXP(world)} XP</div></div>
 <div class="world-viewport"><canvas id="world" tabindex="0" aria-label="3D valley. WASD or arrows to walk, shift to sprint, E or space to cast a knowledge spell. Drag to orbit the camera."></canvas><div class="world-vignette"></div><div class="quest-tracker"><span>CHAPTER ${Math.min(world.done.length + 1, 5)} / 5</span><b>${world.done.length === 5 ? "Return through the portal" : esc(chapter.action)}</b><small>✦ Knowledge changes the world</small></div><div class="companion-caption">${icon("sparkles")} Your light grows with every discovery.</div></div>
 <div class="world-controls"><div><p id="world-status" role="status">${esc(chapter.story)}</p><small>WASD / arrows · Shift to sprint · E / Space to cast · Drag or Q / R to orbit</small></div><button id="interact" class="primary">Follow the trail</button></div>
 <div class="touch-controls" aria-label="Movement controls"><button data-move="w" aria-label="Move forward">↑</button><div><button data-move="a" aria-label="Move left">←</button><button data-move="s" aria-label="Move backward">↓</button><button data-move="d" aria-label="Move right">→</button></div></div>
 </section>${challengeOpen ? challenge(q, index, selected, answerCorrect, world) : ""}`;
}
function challenge(q, index, selected, answerCorrect, world) {
  const chapter = CHAPTERS[index];
  return `<div class="spell-overlay"><section class="quiz challenge spell-panel" role="dialog" aria-modal="true" aria-labelledby="challenge-title"><div class="eyebrow">${esc(chapter.action.toUpperCase())} · ${q.type === "recall" ? "RECALL SPELL" : q.type === "true_false" ? "DISPEL AN ILLUSION" : "CHOOSE YOUR RUNE"}</div><p class="spell-story">${esc(chapter.story)}</p><h2 id="challenge-title">${esc(q.question)}</h2>
 ${
   q.type === "recall"
     ? `<form id="recall-form"><label for="recall-input">Speak the missing knowledge (a short term or phrase)</label><input id="recall-input" maxlength="200" required autocomplete="off" ${selected !== null ? "disabled" : ""} value="${selected !== null ? esc(selected) : ""}" placeholder="Your spell…"><button class="primary" ${selected !== null ? "disabled" : ""}>Cast spell ${icon("wand-sparkles")}</button></form>`
     : `<div class="answers">${(q.type === "true_false"
         ? ["True", "False"]
         : q.options
       )
         .map((o, i) => {
           const v = q.type === "true_false" ? i === 0 : i;
           return `<button data-answer="${i}" ${selected !== null ? "disabled" : ""} class="answer ${selected !== null ? (v === q.answer ? "right" : v === selected ? "wrong" : "") : ""}"><span>${q.type === "true_false" ? (i === 0 ? "✓" : "✕") : "ABCD"[i]}</span>${esc(o)}</button>`;
         })
         .join("")}</div>`
 }
 ${selected !== null ? `<div class="feedback"><h3>${answerCorrect ? esc(chapter.reward) : "Your spell flickers. The path is still sealed."}</h3>${!answerCorrect ? `<p>Learn the spell: <strong>${esc(q.type === "recall" ? q.acceptedAnswers[0] : q.type === "true_false" ? (q.answer ? "True" : "False") : q.options[q.answer])}</strong></p>` : ""}<p>${esc(q.explanation)}</p><details><summary>Read the supporting passage</summary><blockquote>“${esc(q.source)}”<small>From your material</small></blockquote></details><button id="next" class="primary">${answerCorrect ? "Release the spell" : "Return and try casting again"} ${icon("arrow-right")}</button></div>` : '<p class="quiz-hint">A correct spell transforms the world. No time limit.</p>'}</section></div>`;
}
