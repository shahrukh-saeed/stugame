// The route changes direction at every checkpoint. Rendering and physics share it.
export const START = { x: 0, z: 8 };
export const CHECKPOINTS = [
  { x: 0, z: -12 },
  { x: 20, z: -12 },
  { x: 20, z: -32 },
  { x: 0, z: -32 },
  { x: 0, z: -52 },
];
export function leg(index) {
  const start = index ? CHECKPOINTS[index - 1] : START,
    end = CHECKPOINTS[index],
    length = Math.hypot(end.x - start.x, end.z - start.z);
  return {
    start,
    end,
    dx: (end.x - start.x) / length,
    dz: (end.z - start.z) / length,
    length,
  };
}
export function exitDirection(index) {
  return index < 4 ? leg(index + 1) : leg(index);
}
const platforms = [
  { ...START, width: 8, depth: 8, top: 0, kind: "start", section: 0 },
];
CHECKPOINTS.forEach((cp, i) => {
  const l = leg(i);
  [6, 10.5, 15].forEach((distance, j) => {
    const offset = j === 0 ? 0 : (j === 1 ? -1.3 : 1.3) * (i % 2 ? -1 : 1),
      w = i === 1 && j === 0 ? 2.7 : j === 1 ? 3 : 3.8,
      d = 3.5;
    platforms.push({
      x: l.start.x + l.dx * distance - l.dz * offset,
      z: l.start.z + l.dz * distance + l.dx * offset,
      width: l.dx ? d : w,
      depth: l.dx ? w : d,
      top: j === 1 ? 0.3 : 0,
      kind: j === 1 ? "step" : "stone",
      section: i,
      dx: l.dx,
      dz: l.dz,
    });
  });
  platforms.push({
    ...cp,
    width: 8,
    depth: 8,
    top: 0,
    kind: "checkpoint",
    section: i,
    index: i,
  });
});
export const PLATFORMS = platforms;
export function onPlatform(x, z, p, radius = 0) {
  return (
    Math.abs(x - p.x) <= p.width / 2 + radius &&
    Math.abs(z - p.z) <= p.depth / 2 + radius
  );
}
export function respawn(state) {
  const index = state.done.length - 1,
    p = index < 0 ? START : CHECKPOINTS[index],
    direction = leg(Math.min(state.done.length, 4));
  Object.assign(state, {
    x: p.x,
    z: p.z,
    y: 0,
    vy: 0,
    grounded: true,
    coyote: 0.12,
    yaw: Math.atan2(-direction.dx, -direction.dz),
    pitch: -0.12,
  });
  state.falls++;
  state.notice = {
    message: "Back at your last checkpoint. Your earned power-ups are safe.",
    until: Date.now() + 4000,
  };
}
export function stepPhysics(
  state,
  forward,
  strafe,
  dt,
  { sprint = false, jump = false } = {},
) {
  dt = Math.min(Math.max(dt, 0), 0.05);
  const speed = sprint ? 8 : 6.5,
    len = Math.hypot(forward, strafe) || 1;
  const dx =
      ((-Math.sin(state.yaw) * forward + Math.cos(state.yaw) * strafe) / len) *
      speed *
      dt,
    dz =
      ((-Math.cos(state.yaw) * forward - Math.sin(state.yaw) * strafe) / len) *
      speed *
      dt;
  if (jump && (state.grounded || state.coyote > 0)) {
    state.vy = 8;
    state.grounded = false;
    state.coyote = 0;
  }
  const previousY = state.y;
  state.x += dx;
  state.z += dz;
  const index = state.done.length,
    cp = CHECKPOINTS[index];
  if (cp && Math.hypot(state.x - cp.x, state.z - cp.z) < 6) {
    const dir = exitDirection(index),
      past = (state.x - cp.x) * dir.dx + (state.z - cp.z) * dir.dz;
    if (past > 1.8) {
      state.x -= dir.dx * (past - 1.8);
      state.z -= dir.dz * (past - 1.8);
    }
  }
  state.vy -= 22 * dt;
  state.y += state.vy * dt;
  const landing = PLATFORMS.filter(
    (p) =>
      p.section <= state.done.length &&
      onPlatform(state.x, state.z, p, 0.12) &&
      previousY >= p.top - 0.08 &&
      state.y <= p.top &&
      state.vy <= 0,
  ).sort((a, b) => b.top - a.top)[0];
  if (landing) {
    state.y = landing.top;
    state.vy = 0;
    state.grounded = true;
    state.coyote = 0.12;
  } else {
    if (state.grounded) state.coyote = 0.12;
    else state.coyote = Math.max(0, state.coyote - dt);
    state.grounded = false;
  }
  if (state.y < -8 || Math.abs(state.x) > 60 || state.z > 30) respawn(state);
  return Math.hypot(dx, dz) > 0.001;
}
