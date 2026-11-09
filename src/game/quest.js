import { createInventory, updateStamina } from "./inventory.js";
export const CHAPTERS = [
  {
    title: "Ravine crossing",
    action: "Secure the rope bridge",
    story:
      "A washed-out bridge cuts off the trail. Use your field knowledge to secure a safe crossing.",
    reward: "Ropes secured. The crossing is safe. Keep moving.",
    z: -6,
    color: 0x8ee5cc,
  },
  {
    title: "The ranger outpost",
    action: "Open the trail gate",
    story:
      "A locked ranger gate protects the mountain pass. Work out the access code from your course material.",
    reward: "Gate unlocked. You have reached the high-country trail.",
    z: -25,
    color: 0xd7bcff,
  },
  {
    title: "Rockfall ahead",
    action: "Clear the rockfall",
    story:
      "Loose boulders block the route. Choose a safe plan to clear the trail.",
    reward: "The rockfall is cleared. Watch your footing on the way through.",
    z: -44,
    color: 0xffb987,
  },
  {
    title: "The steep ascent",
    action: "Rig the climbing route",
    story:
      "The ridge is too steep to cross without a secured route. Put your knowledge to work.",
    reward: "Climbing route secured. The summit is within reach.",
    z: -63,
    color: 0xb8ef8a,
  },
  {
    title: "Summit signal",
    action: "Light the rescue signal",
    story:
      "Clouds are closing in. Set up your signal fire, then follow the trail back to base camp.",
    reward:
      "Signal fire lit. Follow the trail to the expedition tent at base camp.",
    z: -82,
    color: 0xffdc8a,
  },
];
export function createQuest() {
  return {
    x: 0,
    z: 10,
    done: [],
    missed: [],
    gems: [],
    target: null,
    inventory: createInventory(),
    stamina: 100,
    boostSeconds: 0,
    scouting: false,
  };
}
export function currentChapter(state) {
  return CHAPTERS[state.done.length] || null;
}
export function canAct(state) {
  const c = currentChapter(state);
  return !!c && state.z <= c.z + 9;
}
export function movePlayer(state, dx, dz, dt, sprint = false) {
  const length = Math.hypot(dx, dz) || 1,
    speed =
      sprint && state.stamina > 0 && !state.exhausted
        ? state.boostSeconds > 0
          ? 15
          : 12
        : 8;
  const startX = state.x,
    startZ = state.z;
  state.x = Math.max(-7, Math.min(7, state.x + (dx / length) * speed * dt));
  const frontier = currentChapter(state) ? currentChapter(state).z + 2 : -100;
  state.z = Math.max(
    frontier,
    Math.min(13, state.z + (dz / length) * speed * dt),
  );
  if (state.z < -10 && state.z > -19)
    state.x = Math.max(-2, Math.min(2, state.x));
  const moving = Math.hypot(state.x - startX, state.z - startZ) > 0.001;
  updateStamina(state, moving, sprint && moving && speed > 8, dt);
}
export function resolveChapter(state, index, correct) {
  if (index !== state.done.length || index >= CHAPTERS.length) return false;
  if (!correct) {
    if (!state.missed.includes(index)) state.missed.push(index);
    return false;
  }
  if ((index === 0 || index === 3) && state.inventory.rope > 0)
    state.inventory.rope--;
  state.done.push(index);
  state.effect = { index, time: Date.now() };
  return true;
}
export function questXP(state) {
  return (
    state.done.filter((i) => !state.missed.includes(i)).length * 20 +
    state.gems.length * 5
  );
}
export function reachedCamp(state) {
  return (
    state.done.length === CHAPTERS.length &&
    state.z < -95 &&
    Math.abs(state.x) < 3
  );
}
