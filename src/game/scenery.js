import * as THREE from "three";
import { PLATFORMS, CHECKPOINTS, exitDirection } from "./course.js";
export function buildScenery(scene, state) {
  const mats = new Map();
  const mat = (color) => {
    if (!mats.has(color))
      mats.set(
        color,
        new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
      );
    return mats.get(color);
  };
  function box(w, h, d, color, x, y, z, parent = scene) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  for (const p of PLATFORMS) {
    box(
      p.width,
      0.7,
      p.depth,
      p.kind === "checkpoint" ? 0x42655a : 0x747767,
      p.x,
      p.top - 0.35,
      p.z,
    );
    box(
      p.width,
      0.06,
      p.depth,
      p.kind === "checkpoint" ? 0xd4b777 : 0xb9b397,
      p.x,
      p.top + 0.02,
      p.z,
    );
    // Edge stripes communicate gaps from the first-person view.
    box(
      p.width,
      0.07,
      0.13,
      0xf4c66a,
      p.x,
      p.top + 0.06,
      p.z - p.depth / 2 + 0.1,
    );
    if (p.kind === "checkpoint" || p.kind === "start") {
      for (const x of [-p.width / 2 + 0.2, p.width / 2 - 0.2])
        for (const z of [-p.depth / 2 + 0.25, p.depth / 2 - 0.25])
          box(0.12, 1.1, 0.12, 0x755c3e, p.x + x, p.top + 0.55, p.z + z);
    }
  }
  const gates = CHECKPOINTS.map((cp, i) => {
    const dir = exitDirection(i),
      group = new THREE.Group();
    group.position.set(cp.x + dir.dx * 1.8, 0, cp.z + dir.dz * 1.8);
    group.rotation.y = Math.atan2(-dir.dx, -dir.dz);
    scene.add(group);
    for (const x of [-3.7, 3.7])
      box(0.3, 3.5, 0.3, 0x6f6551, x, 1.75, 0, group);
    box(7.7, 0.3, 0.3, 0x6f6551, 0, 3.5, 0, group);
    const barrier = box(7.2, 2.3, 0.15, 0x69b8ad, 0, 1.2, 0, group);
    barrier.material = new THREE.MeshStandardMaterial({
      color: 0x73c8b9,
      transparent: true,
      opacity: 0.36,
      emissive: 0x245b4b,
      side: THREE.DoubleSide,
    });
    const sign = box(1.2, 0.7, 0.12, 0xf3c778, 0, 2.9, 0.2, group);
    for (let n = 0; n <= i; n++)
      box(0.1, 0.25, 0.05, 0x344e45, (n - i / 2) * 0.2, 2.9, 0.29, group);
    return { barrier, sign };
  });
  for (let i = 0; i < 34; i++) {
    const side = i % 2 ? 1 : -1,
      x = (side < 0 ? -18 : 40) + side * (i % 4) * 6,
      z = 15 - i * 3;
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(6 + (i % 3) * 2, 15 + (i % 5) * 3, 5),
      mat(i % 2 ? 0x637c75 : 0x7d8c80),
    );
    mountain.position.set(x, -7, z);
    scene.add(mountain);
  }
  for (let i = 0; i < 12; i++) {
    const x = i % 2 ? -9 : 30,
      z = 8 - i * 6;
    box(0.3, 2, 0.3, 0x6e6046, x, -0.3, z);
    const tree = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 4, 6),
      mat(0x35594b),
    );
    tree.position.set(x, 2, z);
    scene.add(tree);
  }
  const finish = new THREE.Group();
  finish.position.z = -54.7;
  scene.add(finish);
  for (const x of [-3, 3]) box(0.18, 4, 0.18, 0xbba574, x, 2, 0, finish);
  box(6, 1, 0.12, 0xf1be68, 0, 3.4, 0, finish);
  // Floor arrows point around the bends after each gate is opened.
  const routeArrows = [];
  for (const p of PLATFORMS) {
    const dir =
      p.kind === "checkpoint"
        ? exitDirection(p.index)
        : { dx: p.dx || 0, dz: p.dz || -1 };
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.9, 3),
      mat(0xffd182),
    );
    arrow.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dir.dx, 0, dir.dz),
    );
    arrow.position.set(p.x, p.top + 0.16, p.z - 0.15);
    scene.add(arrow);
    if (p.kind === "checkpoint") routeArrows.push({ arrow, index: p.index });
  }
  return {
    update(t) {
      routeArrows.forEach(
        ({ arrow, index }) => (arrow.visible = state.done.includes(index)),
      );
      gates.forEach((g, i) => {
        const age =
          state.effect?.index === i
            ? (Date.now() - state.effect.time) / 1000
            : 1;
        g.barrier.visible = !state.done.includes(i) || age < 0.7;
        g.barrier.scale.y = state.done.includes(i)
          ? Math.max(0.01, 1 - age / 0.7)
          : 1;
        g.sign.material = mat(state.done.includes(i) ? 0xa8d290 : 0xf3c778);
      });
    },
  };
}
