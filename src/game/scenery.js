import { expeditionAudio } from "./audio.js";
import * as THREE from "three";
import { CHAPTERS } from "./quest.js";
export function buildScenery(scene, state) {
  const materials = new Map();
  function material(color, glow = false) {
    const key = `${color}:${glow}`;
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.85,
          ...(glow ? { emissive: color, emissiveIntensity: 0.6 } : {}),
        }),
      );
    return materials.get(key);
  }
  function mesh(geometry, color, x, y, z, parent = scene, glow = false) {
    const m = new THREE.Mesh(geometry, material(color, glow));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const box = (w, h, d, c, x, y, z, p) =>
    mesh(new THREE.BoxGeometry(w, h, d), c, x, y, z, p);
  const cone = (r, h, c, x, y, z, p) =>
    mesh(new THREE.ConeGeometry(r, h, 6), c, x, y, z, p);
  // Floating land, separated by a real ravine; only the restored bridge crosses it.
  box(24, 18, 27, 0x6b6e55, 0, -9.1, 2);
  box(24, 18, 86, 0x6b6e55, 0, -9.1, -62);
  box(24, 0.25, 27, 0x82967a, 0, -0.1, 2);
  box(24, 0.25, 86, 0x82967a, 0, -0.1, -62);
  box(4, 0.06, 24, 0xb7b18d, 0, 0.05, 2);
  box(4, 0.06, 83, 0xb7b18d, 0, 0.05, -62);
  // Trail stones and glowing fireflies.
  for (let i = 0; i < 50; i++) {
    const z = 12 - i * 2.3;
    if (z < -11 && z > -19) continue;
    box(0.7, 0.08, 0.9, 0xccc4a3, i % 2 ? -0.65 : 0.7, 0.11, z);
  }
  for (let i = 0; i < 52; i++) {
    const z = 12 - i * 2.3,
      side = i % 2 ? 1 : -1,
      x = side * (8 + ((i * 7) % 4));
    if (z < -10 && z > -20) continue;
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    scene.add(tree);
    box(0.4, 1.8, 0.4, 0x625249, 0, 0.7, 0, tree);
    cone(1.8, 3, 0x3c665c, 0, 2.6, 0, tree);
    cone(1.3, 2.6, 0x4c7c68, 0, 4, 0, tree);
    if (i % 3 === 0)
      mesh(
        new THREE.IcosahedronGeometry(0.16),
        0xffdf9c,
        x * 0.65,
        1,
        z,
        scene,
        true,
      );
  }
  for (let i = 0; i < 30; i++) {
    const x = (i % 2 ? 1 : -1) * (20 + (i % 6) * 5),
      z = 15 - i * 5;
    cone(
      8 + (i % 4) * 3,
      18 + (i % 5) * 5,
      i % 2 ? 0x667d80 : 0x7e9192,
      x,
      -4,
      z,
    );
  }
  const barriers = [];
  CHAPTERS.forEach((c, i) => {
    const group = new THREE.Group();
    group.position.z = c.z;
    scene.add(group);
    for (const x of [-3.5, 3.5])
      box(0.25, 2.4, 0.25, 0x756046, x, 1.2, 0, group);
    const veil = box(7, 0.35, 0.25, 0xc4a05f, 0, 1.2, 0, group);
    veil.material = veil.material.clone();
    veil.material.transparent = true;
    const rune = box(1.6, 0.8, 0.15, 0x465a3c, 0, 1.8, 0.1, group);
    box(0.2, 0.45, 0.02, 0xf1ddab, 0, 1.8, 0.19, group);
    barriers.push({ group, veil, rune });
  });
  const bridge = new THREE.Group();
  scene.add(bridge);
  for (let i = 0; i < 14; i++) {
    box(5, 0.25, 0.65, 0xb5a57e, 0, 0.12, -10.5 - i * 0.65, bridge);
    for (const x of [-2.35, 2.35])
      box(0.12, 1.3, 0.12, 0x8f846b, x, 0.65, -10.5 - i * 0.65, bridge);
  }
  for (const x of [-2.35, 2.35])
    box(0.1, 0.1, 9, 0xdacaaa, x, 1.2, -14.7, bridge);
  const guardian = new THREE.Group();
  guardian.position.set(0, 0, -47);
  scene.add(guardian);
  for (let i = 0; i < 9; i++) {
    const rock = mesh(
      new THREE.DodecahedronGeometry(0.8 + (i % 3) * 0.25),
      i % 2 ? 0x72776b : 0x929184,
      ((i % 3) - 1) * 1.9,
      0.7 + Math.floor(i / 3) * 0.4,
      -Math.floor(i / 3),
      guardian,
    );
    rock.rotation.set(i * 0.3, i * 0.5, i * 0.2);
  }
  const roots = new THREE.Group();
  roots.position.z = -66;
  scene.add(roots);
  for (let i = 0; i < 5; i++)
    box(5, 0.2, 1.3, 0x8f7754, 0, 0.2 + i * 0.09, -i, roots);
  const beacon = new THREE.Group();
  beacon.position.set(0, 0, -87);
  scene.add(beacon);
  box(2, 2, 2, 0x82918c, 0, 1, 0, beacon);
  const flame = mesh(
    new THREE.ConeGeometry(0.7, 2, 7),
    0xffdd88,
    0,
    3,
    0,
    beacon,
    true,
  );
  const beam = mesh(
    new THREE.CylinderGeometry(0.25, 0.8, 24, 12),
    0xffe0a0,
    0,
    15,
    0,
    beacon,
    true,
  );
  beam.material = new THREE.MeshBasicMaterial({
    color: 0x7e8177,
    transparent: true,
    opacity: 0.22,
  });
  const portal = new THREE.Group();
  portal.position.set(0, 0, -99);
  scene.add(portal);
  const tent = mesh(
    new THREE.ConeGeometry(2.5, 3, 4),
    0xd28d48,
    0,
    1.5,
    0,
    portal,
  );
  tent.rotation.y = Math.PI / 4;
  box(1.2, 1.7, 0.1, 0x3f5142, 0, 0.85, 1.8, portal);
  box(0.12, 5, 0.12, 0x6e6655, 3, 2.5, 0, portal);
  box(1.8, 0.9, 0.05, 0xe7c17e, 3.9, 4.5, 0, portal);
  for (let i = 0; i < 8; i++) {
    const stone = mesh(
      new THREE.DodecahedronGeometry(0.35),
      0x6e736b,
      Math.cos(i) * 1.1,
      0.2,
      -86 + Math.sin(i),
    );
  }
  for (let i = 0; i < 3; i++) {
    const log = box(0.3, 0.3, 2.3, 0x66503b, 0, 0.25, -87);
    log.rotation.y = (i * Math.PI) / 3;
  }
  const gems = Array.from({ length: 10 }, (_, i) => {
    const z = 5 - i * 10.3,
      x = i % 2 ? 2.8 : -2.8;
    return mesh(
      new THREE.BoxGeometry(0.45, 0.5, 0.45),
      0xca9e64,
      x,
      1,
      z,
      scene,
      true,
    );
  });
  function update(t, dt) {
    barriers.forEach((b, i) => {
      const open = state.done.includes(i),
        age =
          state.effect?.index === i
            ? (Date.now() - state.effect.time) / 1000
            : 10;
      b.veil.visible = !open || age < 1;
      b.rune.visible = !open || age < 1;
      b.veil.material.opacity = open ? Math.max(0, 1 - age) : 1;
      b.rune.scale.setScalar(1);

      b.group.children.forEach((m) => {
        if (m.geometry.type === "OctahedronGeometry") m.rotation.y = t;
      });
    });
    bridge.visible = state.done.includes(0);
    roots.visible = state.done.includes(3);
    const effectAge = state.effect
      ? (Date.now() - state.effect.time) / 1000
      : 10;
    bridge.position.y =
      state.effect?.index === 0 ? -5 * Math.max(0, 1 - effectAge / 1.5) : 0;
    roots.scale.y =
      state.effect?.index === 3 ? Math.min(1, effectAge / 1.5) : 1;
    guardian.position.y = THREE.MathUtils.damp(
      guardian.position.y,
      state.done.includes(2) ? -5 : 0,
      4,
      dt,
    );

    flame.visible = beam.visible = state.done.includes(4);
    flame.rotation.y = t;
    portal.visible = true;
    gems.forEach((g, i) => {
      g.visible = !state.gems.includes(i);
      g.rotation.y = t;
      g.position.y = 1 + Math.sin(t * 2 + i) * 0.15;
      if (
        g.visible &&
        Math.hypot(state.x - g.position.x, state.z - g.position.z) < 1
      ) {
        state.gems.push(i);
        expeditionAudio.cue("pickup");
        g.visible = false;
      }
    });
  }
  return { update };
}
export function buildCharacter(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const mat = (c) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
  function part(w, h, d, c, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    m.position.set(x, y, z);
    m.castShadow = true;
    root.add(m);
    return m;
  }
  part(0.7, 0.8, 0.5, 0xb98c50, 0, 1.05, 0);
  part(0.52, 0.52, 0.52, 0xf0cba7, 0, 1.75, 0);
  part(0.6, 0.18, 0.6, 0x39465c, 0, 2.03, 0);
  part(0.8, 0.9, 0.4, 0x50634b, 0, 1.2, 0.4);
  part(0.85, 0.12, 0.8, 0x7e694a, 0, 2.04, 0);
  part(0.5, 0.22, 0.5, 0x8c7957, 0, 2.19, 0);
  part(0.16, 0.5, 0.18, 0xd3ba80, -0.55, 1.2, 0.5);
  part(0.24, 0.34, 0.24, 0x748c8b, 0.55, 1.1, 0.4);
  for (const x of [-0.22, 0.22]) part(0.27, 0.2, 0.46, 0x6f5039, x, 0.1, -0.05);
  const legs = [
    part(0.23, 0.65, 0.3, 0x4c5540, -0.22, 0.35, 0),
    part(0.23, 0.65, 0.3, 0x4c5540, 0.22, 0.35, 0),
  ];
  const arms = [
    part(0.2, 0.65, 0.25, 0xb98c50, -0.5, 1.05, 0),
    part(0.2, 0.65, 0.25, 0xb98c50, 0.5, 1.05, 0),
  ];
  part(0.08, 1.4, 0.08, 0xc4a77b, 0.65, 1, 0);
  return {
    root,
    update(t, moving, dx, dz) {
      if (moving) root.rotation.y = Math.atan2(-dx, -dz);
      legs.forEach(
        (l, i) =>
          (l.rotation.x = moving ? Math.sin(t * 12 + i * Math.PI) * 0.5 : 0),
      );
      arms.forEach(
        (l, i) =>
          (l.rotation.x = moving ? Math.sin(t * 12 + i * Math.PI) * 0.35 : 0),
      );
    },
  };
}
