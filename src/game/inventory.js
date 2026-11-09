export const PACK_CAPACITY = 8;
export const ITEMS = {
  water: {
    name: "Water flask",
    icon: "droplets",
    description: "Recover 50 stamina. Save it for a long sprint.",
  },
  trailMix: {
    name: "Trail mix",
    icon: "nut",
    description: "Recover 25 stamina and boost sprint speed for 12 seconds.",
  },
  rope: {
    name: "Climbing rope",
    icon: "cable",
    description: "Automatically used to secure the bridge and climbing route.",
  },
};
export function createInventory() {
  return { water: 1, trailMix: 1, rope: 2 };
}
export function packLoad(state) {
  return Object.values(state.inventory).reduce((sum, count) => sum + count, 0);
}
export function notify(state, message) {
  state.notice = { message, until: Date.now() + 4500 };
}
export function collectSupply(state, id) {
  if (state.gems.includes(id)) return false;
  if (packLoad(state) >= PACK_CAPACITY) {
    notify(
      state,
      "Backpack full. Use water or trail mix, or drop a consumable to free a slot.",
    );
    return false;
  }
  const item = id % 2 === 0 ? "water" : "trailMix";
  state.inventory[item]++;
  state.gems.push(id);
  notify(state, `${ITEMS[item].name} packed. +5 XP`);
  return true;
}
export function useItem(state, item) {
  if (!["water", "trailMix"].includes(item) || state.inventory[item] <= 0)
    return false;
  if (item === "water" && state.stamina >= 99) {
    notify(state, "You are already rested. Save your water for later.");
    return false;
  }
  state.inventory[item]--;
  state.stamina = Math.min(100, state.stamina + (item === "water" ? 50 : 25));
  if (state.stamina >= 20) state.exhausted = false;
  if (item === "trailMix") state.boostSeconds = 12;
  notify(
    state,
    item === "water"
      ? "Water break. +50 stamina."
      : "Trail mix eaten. Sprint boosted for 12 seconds.",
  );
  return true;
}
export function dropItem(state, item) {
  if (!["water", "trailMix"].includes(item) || state.inventory[item] <= 0)
    return false;
  state.inventory[item]--;
  notify(state, `${ITEMS[item].name} removed from your pack.`);
  return true;
}
export function updateStamina(state, moving, sprinting, dt) {
  state.boostSeconds = Math.max(0, state.boostSeconds - dt);
  state.stamina = Math.max(
    0,
    Math.min(
      100,
      state.stamina + (moving && sprinting ? -20 : moving ? 5 : 12) * dt,
    ),
  );
  if (state.stamina <= 0) state.exhausted = true;
  else if (state.stamina >= 20) state.exhausted = false;
}
