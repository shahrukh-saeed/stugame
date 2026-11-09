import { expeditionAudio } from "./audio.js";
import * as THREE from "three";
import { buildScenery, buildCharacter } from "./scenery.js";
import {
  currentChapter,
  canAct,
  movePlayer,
  reachedCamp,
  questXP,
} from "./quest.js";

export function mountWorld(
  canvas,
  state,
  onChallenge,
  onFinish,
  paused = false,
) {
  let renderer;
  const status = document.querySelector("#world-status"),
    button = document.querySelector("#interact");
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
  } catch {
    status.textContent =
      "3D graphics could not start. Enable WebGL / hardware acceleration in your browser, then reload.";
    button.disabled = true;
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc4bda4);
  scene.fog = new THREE.Fog(0xc4bda4, 35, 105);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 180);
  scene.add(new THREE.HemisphereLight(0xe7f4ff, 0x55634b, 2.6));
  const sun = new THREE.DirectionalLight(0xffe9c4, 3);
  sun.position.set(-15, 30, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);
  scene.add(sun.target);
  const scenery = buildScenery(scene, state),
    player = buildCharacter(scene),
    keys = new Set();
  let frame,
    last = 0,
    ended = false,
    yaw = 0,
    drag = null;
  const cameraOffset = new THREE.Vector3(10, 9, 14),
    look = new THREE.Vector3(state.x, 1, state.z - 4);
  camera.position.set(state.x + 10, 9, state.z + 14);
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  function interact() {
    if (paused || ended) return;
    if (canAct(state)) onChallenge(state.done.length);
  }
  const movementKeys = [
    "w",
    "a",
    "s",
    "d",
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "shift",
    "q",
    "r",
  ];
  function keydown(e) {
    expeditionAudio.unlock();
    const k = e.key.toLowerCase();
    if (movementKeys.includes(k) || k === "e" || k === " ") {
      e.preventDefault();
      keys.add(k);
      if (!e.repeat && (k === "e" || k === " ")) interact();
    }
  }
  const keyup = (e) => keys.delete(e.key.toLowerCase()),
    clear = () => {
      keys.clear();
      drag = null;
    };
  const down = (e) => {
    if (paused) return;
    expeditionAudio.unlock();
    canvas.focus();
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  };
  const pointer = (e) => {
    if (!drag) return;
    yaw += (e.clientX - drag.x) * 0.008;
    drag = { x: e.clientX, y: e.clientY };
  };
  canvas.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  canvas.addEventListener("blur", clear);
  window.addEventListener("blur", clear);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", pointer);
  canvas.addEventListener("pointerup", clear);
  canvas.addEventListener("pointercancel", clear);
  if (button) button.onclick = interact;
  const touchListeners = [];
  document.querySelectorAll("[data-move]").forEach((b) => {
    const start = (e) => {
      expeditionAudio.unlock();
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      keys.add(b.dataset.move);
    };
    const stop = () => keys.delete(b.dataset.move);
    b.addEventListener("pointerdown", start);
    b.addEventListener("pointerup", stop);
    b.addEventListener("pointercancel", stop);
    b.addEventListener("lostpointercapture", stop);
    touchListeners.push(() => {
      b.removeEventListener("pointerdown", start);
      b.removeEventListener("pointerup", stop);
      b.removeEventListener("pointercancel", stop);
      b.removeEventListener("lostpointercapture", stop);
    });
  });
  function draw(now) {
    if (ended) return;
    const t = now / 1000,
      dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    let dx =
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
      dz =
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
        (keys.has("w") || keys.has("arrowup") ? 1 : 0);
    if (paused || document.hidden) {
      dx = 0;
      dz = 0;
    } else {
      if (keys.has("q")) yaw -= dt;
      if (keys.has("r")) yaw += dt;
      movePlayer(state, dx, dz, dt, keys.has("shift"));
    }
    expeditionAudio.tick(!!(dx || dz), dt, keys.has("shift"));
    player.root.position.set(state.x, 0, state.z);
    player.update(t, !!(dx || dz), dx, dz);
    cameraOffset.set(
      Math.sin(yaw) * 16 + Math.cos(yaw) * 7,
      9,
      Math.cos(yaw) * 16 - Math.sin(yaw) * 7,
    );
    camera.position.lerp(
      cameraOffset.add(new THREE.Vector3(state.x, 0, state.z)),
      1 - Math.exp(-5 * dt),
    );
    look.lerp(
      new THREE.Vector3(state.x, 1, state.z - 4),
      1 - Math.exp(-5 * dt),
    );
    camera.lookAt(look);
    sun.position.set(state.x - 15, 30, state.z + 10);
    sun.target.position.set(state.x, 0, state.z - 8);
    sun.target.updateMatrixWorld();
    scenery.update(t, paused ? 0 : dt);
    const chapter = currentChapter(state),
      ready = canAct(state);
    if (button) {
      button.disabled = paused || !ready;
      button.textContent = chapter
        ? ready
          ? chapter.action
          : "Follow the trail"
        : "Reach base camp";
    }
    if (status && !paused)
      status.textContent = chapter
        ? ready
          ? chapter.story
          : "Follow the stone trail deeper into the valley."
        : "The rescue signal is active. Follow the trail to base camp.";
    const position = document.querySelector("#journey-progress");
    if (position)
      position.textContent = `${state.done.length} / 5 paths restored · ${questXP(state)} XP · ${state.gems.length} supplies`;
    // Semantic location also makes progress available to assistive tools.
    canvas.setAttribute(
      "aria-description",
      `Valley position ${state.x.toFixed(1)}, ${state.z.toFixed(1)}. ${chapter?.title || "Base camp ahead"}`,
    );
    renderer.render(scene, camera);
    if (!paused && reachedCamp(state)) {
      onFinish();
      return;
    }
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return () => {
    ended = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    canvas.removeEventListener("blur", clear);
    window.removeEventListener("blur", clear);
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", pointer);
    canvas.removeEventListener("pointerup", clear);
    canvas.removeEventListener("pointercancel", clear);
    touchListeners.forEach((fn) => fn());
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
