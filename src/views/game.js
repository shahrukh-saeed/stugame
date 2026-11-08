import { esc, icon } from "../lib/html.js";
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
    return `<section class="result"><div class="result-icon">${icon(correct >= 4 ? "trophy" : "sprout")}</div><div class="eyebrow">QUEST COMPLETE</div><h1>${correct >= 4 ? "A new level of you." : "Every answer is progress."}</h1><p>You answered ${correct} of 5 correctly and earned ${correct * 20} XP.</p><h3>${correct >= 4 ? `Next up: ${levels[(active.level || 1) - 1]}` : "Get 4 of 5 correct to unlock the next level."}</h3><button id="again" class="primary">${busy ? "Generating…" : "Play another quest"} ${icon("arrow-right")}</button><button id="exit" class="secondary">Back to study space</button></section>`;
  const q = quiz[index];
  return `<div class="game-top"><button id="exit" class="text-button">${icon("arrow-left")} Leave island</button><span>${esc(active.title)} · Level ${active.level || 1}</span></div><section class="adventure"><div class="adventure-hud"><div><div class="eyebrow">THE FORGOTTEN ISLAND</div><h2>Bring knowledge back to life.</h2></div><div class="crystal-count">✦ ${world.done.length} / 5 crystals <span>⚡ ${correct * 20} XP</span></div></div><canvas id="world" width="960" height="560" tabindex="0" aria-label="Island exploration game. Use arrow keys or WASD to move, E to interact. Click or tap the map to move."></canvas><div class="world-controls"><p>Click the map or use <b>WASD / arrows</b> to move. <b>E</b> to interact.<br>Restore the five crystals, then reach the golden portal.</p><button id="interact" class="primary">Explore</button></div></section>${
    challengeOpen
      ? `<div class="overlay"><section class="quiz challenge" role="dialog" aria-modal="true" aria-labelledby="challenge-title"><div class="eyebrow">CRYSTAL ${index + 1} · ${q.type === "recall" ? "RECALL SPELL" : q.type === "true_false" ? "TRUTH OR ILLUSION" : "RIDDLE GATE"}</div><h2 id="challenge-title">${esc(q.question)}</h2>${
          q.type === "recall"
            ? `<form id="recall-form"><label for="recall-input">Cast your answer (a short term or phrase)</label><input id="recall-input" maxlength="200" required autocomplete="off" ${selected !== null ? "disabled" : ""} value="${selected !== null ? esc(selected) : ""}" placeholder="Type your answer…"><button class="primary" ${selected !== null ? "disabled" : ""}>Cast spell ${icon("wand-sparkles")}</button></form>`
            : `<div class="answers">${(q.type === "true_false"
                ? ["True", "False"]
                : q.options
              )
                .map((o, i) => {
                  const v = q.type === "true_false" ? i === 0 : i;
                  return `<button data-answer="${i}" ${selected !== null ? "disabled" : ""} class="answer ${selected !== null ? (v === q.answer ? "right" : v === selected ? "wrong" : "") : ""}"><span>${q.type === "true_false" ? (i === 0 ? "✓" : "✕") : "ABCD"[i]}</span>${esc(o)}</button>`;
                })
                .join("")}</div>`
        }${selected !== null ? `<div class="feedback"><h3>${answerCorrect ? "Crystal restored! +20 XP" : "Knowledge recovered. Keep exploring!"}</h3>${!answerCorrect ? `<p>Answer: <strong>${esc(q.type === "recall" ? q.acceptedAnswers[0] : q.type === "true_false" ? (q.answer ? "True" : "False") : q.options[q.answer])}</strong></p>` : ""}<p>${esc(q.explanation)}</p><blockquote>“${esc(q.source)}”<small>From your material</small></blockquote><button id="next" class="primary">Return to island ${icon("arrow-right")}</button></div>` : '<p class="quiz-hint">There’s no timer. Think it through, explorer.</p>'}</section></div>`
      : ""
  }`;
}
