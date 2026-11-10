import { icon } from "../lib/html.js";
import { POWERUPS } from "../game/inventory.js";
export function inventory(state) {
  return `<div class="spell-overlay"><section class="inventory-panel" role="dialog" aria-modal="true" aria-labelledby="inventory-title"><button id="close-inventory" class="close" aria-label="Close inventory">${icon("x")}</button><div class="eyebrow">QUESTION POWER-UPS · I TO CLOSE</div><h2 id="inventory-title">Knowledge earns an edge.</h2><p class="pack-subtitle">Use these at a question checkpoint when you need a hand.</p><div class="pack-items">${Object.entries(
    POWERUPS,
  )
    .map(
      ([id, p]) =>
        `<article class="pack-item"><div class="pack-item-icon">${icon(p.icon)}</div><div><h4>${p.name}<b>×${state.inventory[id]}</b></h4><p>${p.description}</p></div></article>`,
    )
    .join(
      "",
    )}</div><p class="pack-message">One reward per cleared checkpoint. Falling keeps your earned power-ups. Used clues stay revealed when retrying the same question.</p></section></div>`;
}
