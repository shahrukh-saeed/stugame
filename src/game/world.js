import * as THREE from "three";
import { expeditionAudio } from "./audio.js";
import { buildScenery } from "./scenery.js";
import { stepPhysics } from "./course.js";
import { currentChapter, canAct, reachedCamp } from "./quest.js";
export function mountWorld(
  canvas,
  state,
  onChallenge,
  onFinish,
  paused = false,
) {
  const tip = document.querySelector(".first-person-tip");
  if (tip && matchMedia("(pointer:coarse)").matches)
    tip.textContent = "Drag left to move · Drag right to look · Tap Jump";
  const status = document.querySelector("#world-status"),
    button = document.querySelector("#interact");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    status.textContent =
      "First-person graphics require WebGL. Enable hardware acceleration and reload.";
    return () => {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa7c0be);
  scene.fog = new THREE.Fog(0xa7c0be, 35, 100);
  scene.add(new THREE.HemisphereLight(0xe6f4ff, 0x526346, 2.5));
  const sun = new THREE.DirectionalLight(0xffe4b2, 3);
  sun.position.set(-15, 30, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  scene.add(sun.target);
  const camera = new THREE.PerspectiveCamera(76, 1, 0.05, 180);
  camera.rotation.order = "YXZ";
  const scenery = buildScenery(scene, state),
    keys = new Set(),
    touches = new Map();
  let ended = false,
    frame,
    last = 0,
    jumpRequested = false;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const look = (x, y) => {
    state.yaw -= x * 0.0025;
    state.pitch = Math.max(-1.3, Math.min(1.3, state.pitch - y * 0.0025));
  };
  const clear = () => {
    keys.clear();
    touches.clear();
    jumpRequested = false;
  };
  const interact = () => {
    if (paused || !canAct(state)) return;
    state.prompted = state.done.length;
    onChallenge(state.done.length);
  };
  const keydown = (e) => {
    if (paused) return;
    const k = e.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "shift",
        " ",
        "e",
        "q",
        "r",
      ].includes(k)
    ) {
      e.preventDefault();
      keys.add(k);
      expeditionAudio.unlock();
      if (k === " " && !e.repeat) jumpRequested = true;
      if (k === "e" && !e.repeat) interact();
    }
  };
  const keyup = (e) => keys.delete(e.key.toLowerCase());
  const down = (e) => {
    if (paused) return;
    canvas.focus();
    expeditionAudio.unlock();
    if (e.pointerType === "touch") {
      const r = canvas.getBoundingClientRect();
      touches.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        dx: 0,
        dy: 0,
        move: e.clientX < r.left + r.width * 0.48,
      });
      canvas.setPointerCapture(e.pointerId);
    } else if (document.pointerLockElement !== canvas) {
      try {
        canvas.requestPointerLock()?.catch(() => {});
      } catch {}
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY, move: false });
      canvas.setPointerCapture(e.pointerId);
    }
  };
  const pointer = (e) => {
    const p = touches.get(e.pointerId);
    if (!p || document.pointerLockElement === canvas) return;
    if (p.move) {
      p.dx = Math.max(-1, Math.min(1, (e.clientX - p.x) / 50));
      p.dy = Math.max(-1, Math.min(1, (e.clientY - p.y) / 50));
    } else {
      look(e.clientX - p.x, e.clientY - p.y);
      p.x = e.clientX;
      p.y = e.clientY;
    }
  };
  const mouse = (e) => {
    if (!paused && document.pointerLockElement === canvas)
      look(e.movementX, e.movementY);
  };
  const up = (e) => touches.delete(e.pointerId),
    lockChange = () => {
      clear();
    };
  canvas.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", pointer);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("blur", clear);
  window.addEventListener("blur", clear);
  document.addEventListener("mousemove", mouse);
  document.addEventListener("pointerlockchange", lockChange);
  if (button) button.onclick = interact;
  const jump = document.querySelector("#jump");
  if (jump) {
    jump.onpointerdown = (e) => {
      e.preventDefault();
      jumpRequested = true;
      expeditionAudio.unlock();
    };
    jump.onclick = (e) => {
      if (e.detail === 0) {
        jumpRequested = true;
        expeditionAudio.unlock();
      }
    };
  }
  const retry = document.querySelector("#respawn");
  if (retry)
    retry.onclick = () => {
      state.y = -10;
      canvas.focus();
    };
  function draw(now) {
    if (ended) return;
    const t = now / 1000,
      dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    let moved = false;
    if (!paused && !document.hidden) {
      let forward =
          (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
          (keys.has("s") || keys.has("arrowdown") ? 1 : 0),
        strafe = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
      for (const touch of touches.values())
        if (touch.move) {
          forward = -touch.dy;
          strafe = touch.dx;
        }
      if (keys.has("arrowleft") || keys.has("q")) state.yaw += dt * 1.5;
      if (keys.has("arrowright") || keys.has("r")) state.yaw -= dt * 1.5;
      const oldFalls = state.falls;
      moved = stepPhysics(state, forward, strafe, dt, {
        sprint: keys.has("shift"),
        jump: jumpRequested,
      });
      jumpRequested = false;
      if (oldFalls !== state.falls) expeditionAudio.cue("retry");
    }
    expeditionAudio.tick(moved && state.grounded, dt, keys.has("shift"));
    camera.position.set(state.x, state.y + 1.65, state.z);
    camera.rotation.set(state.pitch, state.yaw, 0, "YXZ");
    sun.position.set(state.x - 15, 30, state.z + 15);
    sun.target.position.set(state.x, 0, state.z - 5);
    sun.target.updateMatrixWorld();
    scenery.update(t, paused ? 0 : dt);
    const chapter = currentChapter(state),
      ready = canAct(state);
    if (button) {
      button.disabled = paused || !ready;
      button.textContent = ready
        ? "Answer question"
        : chapter
          ? "Reach the checkpoint"
          : "Cross the finish line";
    }
    if (status && !paused)
      status.textContent =
        state.notice?.until > Date.now()
          ? state.notice.message
          : chapter
            ? chapter.story
            : "All gates cleared. Walk under the finish banner.";
    const bearing = document.querySelector("#trail-bearing");
    if (bearing && chapter)
      bearing.textContent = `${Math.round(Math.hypot(state.x - chapter.x, state.z - chapter.z))} m · checkpoint ${state.done.length + 1} of 5`;
    canvas.setAttribute(
      "aria-description",
      `First-person position ${state.x.toFixed(1)}, ${state.y.toFixed(1)}, ${state.z.toFixed(1)}. ${state.grounded ? "Grounded" : "Airborne"}. Checkpoints ${state.done.length}/5. Falls ${state.falls}. Heading ${state.yaw.toFixed(2)}.`,
    );
    renderer.render(scene, camera);
    if (!paused && reachedCamp(state)) {
      onFinish();
      return;
    }
    if (!paused && ready && state.prompted !== state.done.length) {
      state.prompted = state.done.length;
      onChallenge(state.done.length);
      return;
    }
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return () => {
    ended = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    clear();
    if (document.pointerLockElement === canvas) document.exitPointerLock();
    canvas.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", pointer);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    canvas.removeEventListener("blur", clear);
    window.removeEventListener("blur", clear);
    document.removeEventListener("mousemove", mouse);
    document.removeEventListener("pointerlockchange", lockChange);
    const geometries = new Set(),
      materials = new Set();
    scene.traverse((o) => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.material)
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          materials.add(m),
        );
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
