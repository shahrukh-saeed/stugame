import { useItem, dropItem, notify } from "./game/inventory.js";
import { bindPresentation } from "./game/presentation.js";
import { expeditionAudio } from "./game/audio.js";
import { checkMaterial } from "./lib/upload-errors.js";
import { createQuest, resolveChapter, questXP } from "./game/quest.js";
import { layout } from "./views/layout.js";
import { isCorrect } from "./game/answers.js";
import { loadCourses, saveCourses } from "./lib/storage.js";
import { generateQuest } from "./lib/api.js";
import { game } from "./views/game.js";
import { upload } from "./views/upload.js";
import { dashboard } from "./views/dashboard.js";
import { createIcons, icons } from "lucide";
import { $ } from "./lib/html.js";

// Application state and event orchestration. Views and game logic live in their own modules.
export function mountApp() {
  let draft = { title: "", notes: "", file: null };
  let backpackOpen = false;
  let mountWorld;
  let courses = loadCourses();
  let page = "dashboard",
    modal = false,
    busy = false,
    error = "",
    quiz = null,
    active = null,
    index = 0,
    selected = null,
    correct = 0,
    finished = false;
  const save = () => {
    try {
      saveCourses(courses);
    } catch {
      error = "Your browser storage is full. This session will still work.";
    }
  };
  let world = null,
    worldCleanup = null,
    challengeOpen = false,
    answerCorrect = false;
  const levels = ["Foundations", "Connections", "Application", "Mastery"];
  function render() {
    worldCleanup?.();
    worldCleanup = null;
    $("#app").innerHTML = layout({
      page,
      courses,
      content: quiz
        ? game({
            finished,
            correct,
            active,
            busy,
            quiz,
            index,
            world,
            challengeOpen,
            backpackOpen,
            selected,
            answerCorrect,
            levels,
          })
        : dashboard({
            courses,
            page,
            busy,
            active,
            error: modal ? "" : error,
            levels,
          }),
      overlay: modal ? upload({ busy, error, draft }) : "",
    });
    createIcons({ icons });
    bindPresentation(!!quiz);
    document.querySelectorAll("[data-page]").forEach(
      (el) =>
        (el.onclick = () => {
          page = el.dataset.page;
          quiz = null;
          render();
        }),
    );
    document.querySelectorAll("[data-upload]").forEach(
      (el) =>
        (el.onclick = () => {
          modal = true;
          error = "";
          render();
        }),
    );
    document
      .querySelectorAll("[data-play]")
      .forEach((el) => (el.onclick = () => start(el.dataset.play)));
    if ($("#remove-file"))
      $("#remove-file").onclick = () => {
        draft.file = null;
        render();
      };
    if ($("#close"))
      $("#close").onclick = () => {
        if (!busy) {
          modal = false;
          render();
        }
      };
    if ($("#upload-form")) {
      $('#upload-form [name="title"]').oninput = (e) => {
        draft.title = e.target.value;
      };
      $('#upload-form [name="notes"]').oninput = (e) => {
        draft.notes = e.target.value;
      };
    }
    if ($("#upload-form")) $("#upload-form").onsubmit = addCourse;
    if ($("#file"))
      $("#file").onchange = () => {
        $("#file-label").textContent =
          $("#file").files[0]?.name || "Click to choose a file";
        draft.file = $("#file").files[0] || null;
      };
    document
      .querySelectorAll("[data-answer]")
      .forEach(
        (el) =>
          (el.onclick = () =>
            answer(
              quiz[index].type === "true_false"
                ? Number(el.dataset.answer) === 0
                : Number(el.dataset.answer),
            )),
      );
    if ($("#recall-form"))
      $("#recall-form").onsubmit = (e) => {
        e.preventDefault();
        answer($("#recall-input").value);
      };
    if ($("#next"))
      $("#next").onclick = () => {
        if (answerCorrect) {
          resolveChapter(world, index, true);
          expeditionAudio.cue("build");
        }
        challengeOpen = false;
        selected = null;
        render();
        $("#world")?.focus();
      };
    if ($("#backpack"))
      $("#backpack").onclick = () => {
        backpackOpen = !backpackOpen;
        world.target = null;
        render();
        $("#close-backpack")?.focus();
      };
    const panel = $(".backpack-panel");
    if (panel)
      panel.onkeydown = (e) => {
        if (e.key === "Tab") {
          const focusable = [
              ...panel.querySelectorAll("button:not(:disabled)"),
            ],
            first = focusable[0],
            last = focusable.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
    if ($("#close-backpack"))
      $("#close-backpack").onclick = () => {
        backpackOpen = false;
        render();
        $("#world")?.focus();
      };
    document.querySelectorAll("[data-use]").forEach(
      (b) =>
        (b.onclick = () => {
          if (useItem(world, b.dataset.use)) expeditionAudio.cue("pickup");
          render();
          $("#close-backpack")?.focus();
        }),
    );
    document.querySelectorAll("[data-drop]").forEach(
      (b) =>
        (b.onclick = () => {
          dropItem(world, b.dataset.drop);
          render();
          $("#close-backpack")?.focus();
        }),
    );
    if ($("#scout-route"))
      $("#scout-route").onclick = () => {
        world.scouting = !world.scouting;
        backpackOpen = false;
        notify(
          world,
          world.scouting
            ? "Binoculars up. Survey the route ahead."
            : "Binoculars packed.",
        );
        render();
        $("#world")?.focus();
      };
    if ($("#world"))
      worldCleanup = mountWorld(
        $("#world"),
        world,
        (i) => {
          index = i;
          selected = null;
          challengeOpen = true;
          world.target = null;
          render();
          ($("#recall-input") || $(".challenge button"))?.focus();
        },
        () => {
          expeditionAudio.cue("complete");
          finished = true;
          active.sessions = (active.sessions || 0) + 1;
          active.xp = (active.xp || 0) + questXP(world);
          active.best = Math.max(active.best || 0, correct);
          if (correct >= 4) active.level = Math.min(4, (active.level || 1) + 1);
          save();
          render();
        },
        challengeOpen || backpackOpen,
      );
    if ($("#again")) $("#again").onclick = () => start(active.id);
    if ($("#exit"))
      $("#exit").onclick = () => {
        quiz = null;
        render();
      };
    if ($("#delete"))
      $("#delete").onclick = () => {
        if (
          confirm("Remove this material and its progress from this device?")
        ) {
          courses = courses.filter((c) => c.id !== active.id);
          save();
          quiz = null;
          render();
        }
      };
  }
  async function addCourse(e) {
    e.preventDefault();
    const form = new FormData(e.target),
      file = $("#file").files[0] || draft.file;
    const title = String(form.get("title")).trim();
    let text = String(form.get("notes")).trim();
    busy = true;
    error = "";
    render();
    try {
      if (file) {
        const { extract } = await import("./lib/documents.js");
        text = [
          await extract(file, (message) => {
            if ($("#read-progress")) $("#read-progress").textContent = message;
          }),
          text,
        ]
          .filter(Boolean)
          .join("\n\n");
      }
      checkMaterial(text, file);
      courses.unshift({
        id: crypto.randomUUID(),
        title,
        text,
        type: file ? file.name.split(".").pop().toUpperCase() : "NOTES",
        level: 1,
        xp: 0,
        sessions: 0,
        history: [],
      });
      save();
      draft = { title: "", notes: "", file: null };
      modal = false;
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
      render();
    }
  }
  async function start(id) {
    if (busy) return;
    active = courses.find((c) => c.id === id);
    if (!active) return;
    busy = true;
    error = "";
    quiz = null;
    render();
    try {
      const [engine, result] = await Promise.all([
        import("./game/world.js"),
        generateQuest(active),
      ]);
      mountWorld = engine.mountWorld;
      quiz = result.questions;
      active.history = [
        ...(active.history || []),
        ...quiz.map((q) => q.question),
      ].slice(-30);
      save();
      index = 0;
      selected = null;
      correct = 0;
      finished = false;
      world = createQuest();
      backpackOpen = false;
      challengeOpen = false;
    } catch (e) {
      error = e.message;
    } finally {
      busy = false;
      render();
    }
  }
  function answer(value) {
    if (selected !== null) return;
    selected = value;
    const q = quiz[index];
    answerCorrect = isCorrect(q, value);
    expeditionAudio.cue(answerCorrect ? "success" : "retry");
    if (!answerCorrect) resolveChapter(world, index, false);
    if (answerCorrect && !world.missed.includes(index)) correct++;
    render();
  }
  document.addEventListener("keydown", (e) => {
    if (
      !quiz ||
      finished ||
      challengeOpen ||
      /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) ||
      e.repeat
    )
      return;
    if (e.key.toLowerCase() === "b" || (e.key === "Escape" && backpackOpen)) {
      e.preventDefault();
      backpackOpen = !backpackOpen;
      world.target = null;
      render();
      (backpackOpen ? $("#close-backpack") : $("#world"))?.focus();
    }
  });
  render();
}
