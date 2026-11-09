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
            selected,
            answerCorrect,
            levels,
          })
        : dashboard({ courses, page, busy, active, error, levels }),
      overlay: modal ? upload({ busy, error }) : "",
    });
    createIcons({ icons });
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
    if ($("#close"))
      $("#close").onclick = () => {
        if (!busy) {
          modal = false;
          render();
        }
      };
    if ($("#upload-form")) $("#upload-form").onsubmit = addCourse;
    if ($("#file"))
      $("#file").onchange = () => {
        $("#file-label").textContent =
          $("#file").files[0]?.name || "Click to choose a file";
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
        if (answerCorrect) resolveChapter(world, index, true);
        challengeOpen = false;
        selected = null;
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

          render();
          ($("#recall-input") || $(".challenge button"))?.focus();
        },
        () => {
          finished = true;
          active.sessions = (active.sessions || 0) + 1;
          active.xp = (active.xp || 0) + questXP(world);
          active.best = Math.max(active.best || 0, correct);
          if (correct >= 4) active.level = Math.min(4, (active.level || 1) + 1);
          save();
          render();
        },
        challengeOpen,
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
      file = $("#file").files[0];
    const title = String(form.get("title")).trim();
    let text = String(form.get("notes")).trim();
    busy = true;
    error = "";
    render();
    try {
      if (file) {
        const { extract } = await import("./lib/documents.js");
        text = [await extract(file), text].filter(Boolean).join("\n\n");
      }
      if (text.trim().length < 100)
        throw Error(
          "Add at least 100 characters of readable text. Scanned PDFs need text recognition first.",
        );
      if (text.length > 60000)
        throw Error(
          "Use a shorter section of material (up to 60,000 characters).",
        );
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
    if (!answerCorrect) resolveChapter(world, index, false);
    if (answerCorrect && !world.missed.includes(index)) correct++;
    render();
  }
  render();
}
