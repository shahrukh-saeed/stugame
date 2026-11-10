import { esc, icon } from "../lib/html.js";

export function dashboard({ courses, page, busy, active, error, levels }) {
  const progress = page === "progress",
    library = page === "library";
  const title = progress
    ? "Your progress"
    : library
      ? "Study materials"
      : courses.length
        ? "Ready for your next quest?"
        : "Start your first expedition";
  const description = progress
    ? "A look at the ground you’ve covered."
    : courses.length
      ? "Choose your material and head back to the trail."
      : "Add your course notes or slides to create a study adventure.";
  const xp = courses.reduce((s, c) => s + (c.xp || 0), 0),
    sessions = courses.reduce((s, c) => s + (c.sessions || 0), 0);
  const visible = library || progress ? courses : courses.slice(0, 1);
  return `<section class="heading"><div><h1>${title}</h1><p>${description}</p></div>${courses.length && !progress ? `<button class="secondary" data-upload>${icon("plus")} Add material</button>` : ""}</section>
 ${error ? `<div class="error" role="alert">${esc(error)}</div>` : ""}
 ${progress ? `<section class="stats" aria-label="Completed progress"><div>${icon("flag")}<span>Expeditions completed<b>${sessions}</b></span></div><div>${icon("zap")}<span>Total XP earned<b>${xp}</b></span></div></section>` : ""}
 ${!courses.length ? `<section class="empty action-empty"><div class="empty-icon">${icon("map")}</div><h2>Bring your notes. Find your adventure.</h2><p>Upload a file or paste your notes.<br>We’ll turn the material into your next quest.</p><button class="primary" data-upload>${icon("plus")} Add study material</button><small>PDF, PowerPoint, Word, or plain text</small></section>` : `<section class="library ${!library && !progress ? "next-quest" : ""}">${!library && !progress ? '<div class="eyebrow">YOUR NEXT EXPEDITION</div>' : ""}<div class="course-grid">${visible.map((c) => `<article class="course"><div class="course-summary"><div class="course-icon">${icon("notebook-text")}</div><div><h3>${esc(c.title)}</h3><p>Level ${c.level || 1} · ${levels[(c.level || 1) - 1]}</p></div></div>${progress ? `<div class="progress-track"><span style="width:${(((c.level || 1) - 1) / 3) * 100}%"></span></div><p>${c.sessions || 0} expeditions completed · ${c.xp || 0} XP</p>` : `<button class="${library ? "secondary" : "primary"}" data-play="${c.id}" ${busy ? "disabled" : ""}>${busy && active?.id === c.id ? "Preparing your quest…" : "Start quest"} ${icon("arrow-right")}</button>`}</article>`).join("")}</div></section>`}
 ${progress && courses.length ? `<button class="secondary page-link" data-page="library">Choose your next quest ${icon("arrow-right")}</button>` : !library && !progress && courses.length > 1 ? `<button class="text-button page-link" data-page="library">View all ${courses.length} materials ${icon("arrow-right")}</button>` : ""}`;
}
