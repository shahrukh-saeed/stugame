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
  box(24, 3, 27, 0x526e60, 0, -1.6, 2);
  box(24, 4, 86, 0x526e60, 0, -2.1, -62);
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
    for (const x of [-4, 4]) {
      box(1, 5, 1, 0x687e78, x, 2.5, 0, group);
      mesh(new THREE.OctahedronGeometry(0.6), c.color, x, 5.5, 0, group, true);
    }
    box(9, 0.7, 1, 0x687e78, 0, 5, 0, group);
    const veil = mesh(
      new THREE.PlaneGeometry(7, 4),
      c.color,
      0,
      2.4,
      0.1,
      group,
      true,
    );
    veil.material = new THREE.MeshStandardMaterial({
      color: c.color,
      emissive: c.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
    });
    const rune = mesh(
      new THREE.TorusGeometry(0.8, 0.07, 8, 32),
      c.color,
      0,
      2.6,
      0.2,
      group,
      true,
    );
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
  box(2.6, 3, 1.4, 0x505f70, 0, 2.8, 0, guardian);
  box(1.5, 1.4, 1.5, 0x71818a, 0, 5, 0, guardian);
  for (const x of [-0.55, 0.55]) {
    box(0.28, 0.2, 0.1, 0xffc18f, x, 5.1, 0.8, guardian);
    box(0.7, 1.5, 0.8, 0x536574, x, 0.8, 0, guardian);
  }
  for (const x of [-2, 2]) box(0.7, 2, 0.8, 0x71818a, x, 2.8, 0, guardian);
  const shield = mesh(
    new THREE.SphereGeometry(3.6, 20, 12),
    0xffbb88,
    0,
    2.5,
    0,
    guardian,
  );
  shield.material = new THREE.MeshStandardMaterial({
    color: 0xffbb88,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
    emissive: 0xff9955,
    emissiveIntensity: 0.7,
  });
  const roots = new THREE.Group();
  roots.position.z = -66;
  scene.add(roots);
  for (let i = 0; i < 5; i++)
    box(5, 0.2, 1.3, 0x86b391, 0, 0.2 + i * 0.09, -i, roots);
  const beacon = new THREE.Group();
  beacon.position.set(0, 0, -87);
  scene.add(beacon);
  box(2, 2, 2, 0x82918c, 0, 1, 0, beacon);
  const flame = mesh(
    new THREE.OctahedronGeometry(1.1),
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
    color: 0xffe0a0,
    transparent: true,
    opacity: 0.32,
  });
  const portal = mesh(
    new THREE.TorusGeometry(2, 0.2, 10, 40),
    0xffda8c,
    0,
    2.2,
    -98,
    scene,
    true,
  );
  const gems = Array.from({ length: 10 }, (_, i) => {
    const z = 5 - i * 10.3,
      x = i % 2 ? 2.8 : -2.8;
    return mesh(
      new THREE.OctahedronGeometry(0.3),
      0xc4b7ff,
      x,
      1,
      z,
      scene,
      true,
    );
  });
  // A little companion follows the player through the valley.
  const companion = mesh(
    new THREE.IcosahedronGeometry(0.22),
    0xb8f4e1,
    1.5,
    2,
    10,
    scene,
    true,
  );
  const pulse = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.08, 6, 40),
    new THREE.MeshBasicMaterial({
      color: 0xc2f9e3,
      transparent: true,
      opacity: 0,
    }),
  );
  pulse.rotation.x = -Math.PI / 2;
  scene.add(pulse);
  let previousDone = state.done.length,
    pulseAge = 100;
  function update(t, dt) {
    if (
      previousDone !== state.done.length ||
      (pulseAge === 100 &&
        state.effect &&
        Date.now() - state.effect.time < 1500)
    ) {
      previousDone = state.done.length;
      pulseAge = 0;
      pulse.position.set(state.x, 0.3, state.z - 3);
    }
    pulseAge += dt;
    pulse.scale.setScalar(1 + pulseAge * 9);
    pulse.material.opacity = Math.max(0, 1 - pulseAge);
    barriers.forEach((b, i) => {
      const open = state.done.includes(i),
        age =
          state.effect?.index === i
            ? (Date.now() - state.effect.time) / 1000
            : 10;
      b.veil.visible = !open || age < 1;
      b.rune.visible = !open || age < 1;
      b.veil.material.opacity = open ? Math.max(0, 0.34 * (1 - age)) : 0.34;
      b.rune.scale.setScalar(open ? 1 + Math.min(age, 1) * 3 : 1);
      b.rune.rotation.z = t * 0.5;
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
    guardian.rotation.z = THREE.MathUtils.damp(
      guardian.rotation.z,
      state.done.includes(2) ? Math.PI / 2 : 0,
      4,
      dt,
    );
    shield.visible = !state.done.includes(2);
    flame.visible = beam.visible = state.done.includes(4);
    flame.rotation.y = t;
    portal.visible = state.done.length === 5;
    portal.rotation.z = t * 0.2;
    gems.forEach((g, i) => {
      g.visible = !state.gems.includes(i);
      g.rotation.y = t;
      g.position.y = 1 + Math.sin(t * 2 + i) * 0.15;
      if (
        g.visible &&
        Math.hypot(state.x - g.position.x, state.z - g.position.z) < 1
      ) {
        state.gems.push(i);
        g.visible = false;
      }
    });
    companion.position.lerp(
      new THREE.Vector3(state.x + 1.2, 2 + Math.sin(t * 3) * 0.2, state.z + 1),
      0.04,
    );
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
  part(0.7, 0.8, 0.5, 0xa59ad3, 0, 1.05, 0);
  part(0.52, 0.52, 0.52, 0xf0cba7, 0, 1.75, 0);
  part(0.6, 0.18, 0.6, 0x39465c, 0, 2.03, 0);
  part(0.65, 0.75, 0.1, 0x5e6d92, 0, 1.1, 0.32);
  const legs = [
    part(0.23, 0.65, 0.3, 0x384b56, -0.22, 0.35, 0),
    part(0.23, 0.65, 0.3, 0x384b56, 0.22, 0.35, 0),
  ];
  const arms = [
    part(0.2, 0.65, 0.25, 0xa59ad3, -0.5, 1.05, 0),
    part(0.2, 0.65, 0.25, 0xa59ad3, 0.5, 1.05, 0),
  ];
  part(0.08, 1.4, 0.08, 0xc4a77b, 0.65, 1, 0);
  const jewel = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18),
    new THREE.MeshStandardMaterial({
      color: 0xc4f7de,
      emissive: 0x8ddec0,
      emissiveIntensity: 0.8,
    }),
  );
  jewel.position.set(0.65, 1.8, 0);
  root.add(jewel);
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
