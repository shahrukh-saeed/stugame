import { icon, esc } from "../lib/html.js";
import { PACK_CAPACITY, ITEMS, packLoad } from "../game/inventory.js";
export function backpack(state) {
  return `<div class="spell-overlay backpack-overlay"><section class="backpack-panel" role="dialog" aria-modal="true" aria-labelledby="backpack-title"><button id="close-backpack" class="close" aria-label="Close backpack">${icon("x")}</button><div class="eyebrow">YOUR TRAIL KIT · B TO CLOSE</div><h2 id="backpack-title">Ready for the next mile.</h2><p class="pack-subtitle">Choose what you carry. Make it count.</p><div class="pack-summary"><span>${icon("backpack")} ${packLoad(state)} / ${PACK_CAPACITY} slots</span><span>${Math.round(state.stamina)}% stamina</span></div><div class="stamina-track"><span style="width:${state.stamina}%"></span></div><h3>Supplies</h3><div class="pack-items">${Object.entries(
    ITEMS,
  )
    .map(
      ([id, item]) =>
        `<article class="pack-item"><div class="pack-item-icon">${icon(item.icon)}</div><div><h4>${item.name}<b>×${state.inventory[id]}</b></h4><p>${item.description}</p>${id === "rope" ? "<small>Reserved gear · cannot be dropped</small>" : `<div class="pack-item-actions"><button data-use="${id}" ${state.inventory[id] === 0 || (id === "water" && state.stamina >= 99) ? "disabled" : ""}>${id === "water" ? "Drink water" : "Eat trail mix"}</button><button data-drop="${id}" ${state.inventory[id] === 0 ? "disabled" : ""}>Drop one</button></div>`}</div></article>`,
    )
    .join(
      "",
    )}</div><h3>Equipment <small>doesn’t use pack slots</small></h3><div class="pack-equipment"><article>${icon("compass")}<div><b>Trail compass</b><p>Distance and direction to your next objective are shown on the trail.</p></div></article><article>${icon("binoculars")}<div><b>Binoculars</b><p>Look ahead along the route before you set out.</p><button id="scout-route">${state.scouting ? "Put binoculars away" : "Scout the route"}</button></div></article></div><p class="pack-message" role="status">${state.notice?.until > Date.now() ? esc(state.notice.message) : "Time pauses while you check your pack."}</p></section></div>`;
}
