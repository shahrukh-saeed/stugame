import { icon } from "../lib/html.js";
export function layout({ page, courses, content, overlay }) {
  return `<aside><a class="brand" href="#">${icon("compass")}<span>stu<span class="brand-light">game</span></span></a><nav aria-label="Main navigation">${[
    ["dashboard", "layout-dashboard", "Overview"],
    ["library", "book-open", "My library"],
    ["progress", "chart-no-axes-combined", "My progress"],
  ]
    .map(
      ([id, i, t]) =>
        `<button data-page="${id}" class="${page === id ? "active" : ""}" ${page === id ? 'aria-current="page"' : ""} aria-label="${t}" title="${t}">${icon(i)}<span>${t}</span></button>`,
    )
    .join(
      "",
    )}</nav><small class="sidebar-status">${icon("shield-check")} Saved on this device</small></aside><main><div class="content">${content}</div></main>${overlay}`;
}
