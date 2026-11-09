export const CHAPTERS = [
  {
    title: "The broken crossing",
    action: "Weave a bridge",
    story:
      "The path has fallen into the mist. Recall what you know to weave a crossing.",
    reward: "A bridge rises from the ravine. Your journey can continue.",
    z: -6,
    color: 0x8ee5cc,
  },
  {
    title: "The sealed archive",
    action: "Unseal the archive",
    story:
      "An ancient inscription seals the mountain pass. Your knowledge is the key.",
    reward: "The archive opens. You have learned the light spell.",
    z: -25,
    color: 0xd7bcff,
  },
  {
    title: "The hollow sentinel",
    action: "Cast a light spell",
    story:
      "A sentinel blocks the valley. Break its shield with a spell powered by understanding.",
    reward: "Your spell shatters the shield. The sentinel returns to stone.",
    z: -44,
    color: 0xffb987,
  },
  {
    title: "The sleeping forest",
    action: "Awaken the forest",
    story:
      "The forest has forgotten how to grow. Give it a spark of understanding.",
    reward: "Roots unfurl into a staircase. The summit is within reach.",
    z: -63,
    color: 0xb8ef8a,
  },
  {
    title: "The heart of the mountain",
    action: "Ignite the beacon",
    story:
      "One final spark will bring the valley back to life. Light the beacon and return home.",
    reward: "The beacon is lit. Follow the golden trail into the portal.",
    z: -82,
    color: 0xffdc8a,
  },
];
export function createQuest() {
  return { x: 0, z: 10, done: [], missed: [], gems: [], target: null };
}
export function currentChapter(state) {
  return CHAPTERS[state.done.length] || null;
}
export function canCast(state) {
  const c = currentChapter(state);
  return !!c && state.z <= c.z + 9;
}
export function movePlayer(state, dx, dz, dt, sprint = false) {
  const length = Math.hypot(dx, dz) || 1,
    speed = sprint ? 12 : 8;
  state.x = Math.max(-7, Math.min(7, state.x + (dx / length) * speed * dt));
  const frontier = currentChapter(state) ? currentChapter(state).z + 2 : -100;
  state.z = Math.max(
    frontier,
    Math.min(13, state.z + (dz / length) * speed * dt),
  );
  if (state.z < -10 && state.z > -19)
    state.x = Math.max(-2, Math.min(2, state.x));
}
export function resolveChapter(state, index, correct) {
  if (index !== state.done.length || index >= CHAPTERS.length) return false;
  if (!correct) {
    if (!state.missed.includes(index)) state.missed.push(index);
    return false;
  }
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
export function reachedPortal(state) {
  return (
    state.done.length === CHAPTERS.length &&
    state.z < -95 &&
    Math.abs(state.x) < 3
  );
}
