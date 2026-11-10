import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createQuest,
  resolveChapter,
  canAct,
  reachedCamp,
} from "../src/game/quest.js";
import {
  START,
  CHECKPOINTS,
  PLATFORMS,
  leg,
  stepPhysics,
  respawn,
} from "../src/game/course.js";
test("the course turns at every gate and questions cannot be triggered in mid-air", () => {
  assert.ok(CHECKPOINTS.some((p) => p.x > 0));
  for (let i = 1; i < 5; i++)
    assert.notDeepEqual([leg(i).dx, leg(i).dz], [leg(i - 1).dx, leg(i - 1).dz]);
  const s = createQuest();
  Object.assign(s, CHECKPOINTS[0]);
  assert.ok(canAct(s));
  s.grounded = false;
  assert.equal(canAct(s), false);
});
test("jumping lands on platform tops; walking off an edge respawns without losing power-ups", () => {
  const s = createQuest();
  stepPhysics(s, 0, 0, 0.05, { jump: true });
  assert.ok(s.y > 0);
  for (let i = 0; i < 60; i++) stepPhysics(s, 0, 0, 0.016);
  assert.ok(s.grounded);
  assert.equal(s.y, 0);
  resolveChapter(s, 0, true);
  s.x = 50;
  for (let i = 0; i < 150; i++) stepPhysics(s, 0, 0, 0.016);
  assert.ok(s.falls > 0);
  assert.equal(s.inventory.insight, 1);
  assert.equal(s.x, CHECKPOINTS[0].x);
  assert.equal(s.z, CHECKPOINTS[0].z);
});
test("uncleared gates block the outgoing route and future platforms are not safe checkpoints", () => {
  const s = createQuest();
  Object.assign(s, CHECKPOINTS[0]);
  s.yaw = -Math.PI / 2;
  for (let i = 0; i < 30; i++) stepPhysics(s, 1, 0, 0.05, { sprint: true });
  assert.ok(s.x <= 1.80001);
  assert.equal(s.done.length, 0);
  s.x = CHECKPOINTS[1].x;
  s.z = CHECKPOINTS[1].z;
  s.y = 2;
  s.grounded = false;
  for (let i = 0; i < 100; i++) stepPhysics(s, 0, 0, 0.05);
  assert.ok(s.falls > 0);
  assert.equal(s.done.length, 0);
  assert.equal(reachedCamp(s), false);
});
test("every winding course leg is traversable with jumping and cleared gates", () => {
  const s = createQuest();
  for (let section = 0; section < 5; section++) {
    const targets = PLATFORMS.filter(
      (p) => p.section === section && p.kind !== "start",
    );
    for (const target of targets) {
      let count = 0;
      while (
        Math.hypot(s.x - target.x, s.z - target.z) > 0.15 &&
        count++ < 300
      ) {
        const distance = Math.hypot(s.x - target.x, s.z - target.z);
        s.yaw = Math.atan2(-(target.x - s.x), -(target.z - s.z));
        stepPhysics(s, 1, 0, 0.016, {
          sprint: true,
          jump: s.grounded && distance > 2,
        });
      }
      assert.ok(
        count < 300,
        `could not reach section ${section} ${target.kind}`,
      );
      assert.equal(s.falls, 0, `fell in section ${section}`);
    }
    for (let n = 0; n < 60; n++) stepPhysics(s, 0, 0, 0.016);
    assert.ok(canAct(s));
    resolveChapter(s, section, true);
  }
  Object.assign(s, { x: 0, z: -54.5, grounded: true });
  assert.ok(reachedCamp(s));
});
