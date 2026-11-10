import { createInventory } from "./inventory.js";
import { CHECKPOINTS } from "./course.js";
export const CHAPTERS = [
  {
    title: "Stepping stones",
    story: "Jump across the stepping stones to reach the first question gate.",
  },
  {
    title: "The narrow crossing",
    story:
      "Keep your footing on the narrow platforms. A new question is waiting across the gap.",
  },
  {
    title: "Switchback trail",
    story:
      "Strafe and jump between the staggered ledges to reach the next checkpoint.",
  },
  {
    title: "High-country hops",
    story:
      "Clear the raised stepping blocks and land on the checkpoint platform.",
  },
  {
    title: "The summit run",
    story:
      "One last stretch of platforms. Clear the final question to finish the course.",
  },
].map((c, i) => ({
  ...c,
  x: CHECKPOINTS[i].x,
  z: CHECKPOINTS[i].z,
  action: "Answer checkpoint question",
  reward:
    "Checkpoint cleared. +1 Insight" +
    (i % 2 === 1 ? " and +1 Focus." : ".") +
    " " +
    [
      "Turn right onto the narrow crossing.",
      "Turn left towards the switchback trail.",
      "Turn left towards the high-country hops.",
      "Turn right onto the summit run.",
      "Cross the finish line.",
    ][i],
}));
export function createQuest() {
  return {
    x: 0,
    y: 0,
    z: 8,
    vy: 0,
    yaw: 0,
    pitch: -0.12,
    grounded: true,
    coyote: 0.12,
    done: [],
    missed: [],
    inventory: createInventory(),
    hints: {},
    falls: 0,
    prompted: -1,
  };
}
export function currentChapter(state) {
  return CHAPTERS[state.done.length] || null;
}
export function canAct(state) {
  const c = currentChapter(state);
  return (
    !!c && state.grounded && Math.hypot(state.x - c.x, state.z - c.z) < 2.6
  );
}
export function resolveChapter(state, index, correct) {
  if (index !== state.done.length || index >= CHAPTERS.length) return false;
  if (!correct) {
    if (!state.missed.includes(index)) state.missed.push(index);
    return false;
  }
  state.done.push(index);
  state.inventory.insight++;
  if (state.done.length % 2 === 0) state.inventory.focus++;
  state.effect = { index, time: Date.now() };
  return true;
}
export function questXP(state) {
  return state.done.filter((i) => !state.missed.includes(i)).length * 20;
}
export function reachedCamp(state) {
  return (
    state.done.length === 5 &&
    state.grounded &&
    state.z < -54.3 &&
    Math.abs(state.x) < 3.8
  );
}
