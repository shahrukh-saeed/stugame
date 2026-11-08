import { icon } from "../lib/html.js";
export function layout({ page, courses, content, overlay }) {
  return `<aside><a class="brand" href="#">${icon("layers")}<span>stu<span class="brand-light">game</span><small>MAKE KNOWLEDGE STICK.</small></span></a><div class="nav-label">WORKSPACE</div><nav>${[
    ["dashboard", "layout-dashboard", "Overview"],
    ["library", "book-open", "My library"],
    ["progress", "chart-no-axes-combined", "My progress"],
  ]
    .map(
      ([id, i, t]) =>
        `<button data-page="${id}" class="${page === id ? "active" : ""}">${icon(i)}${t}${id === "library" ? `<span class="count">${courses.length}</span>` : ""}</button>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-bottom"><div class="tiny-orbit">${icon("sparkles")}</div><h4>A little every day.<br>A lot further tomorrow.</h4><p>Your next breakthrough starts<br>with one study session.</p><div class="profile"><span class="avatar">Y</span><div>You<small>Personal workspace</small></div>${icon("chevrons-up-down")}</div></div></aside><main><header><div class="breadcrumb">Your workspace <span>/</span> <b>${page === "dashboard" ? "Overview" : page === "library" ? "My library" : "My progress"}</b></div><span class="private">${icon("shield-check")} Stored on this device</span></header><div class="content">${content}</div><footer>Built for curious minds. <span>A little progress, every day. ${icon("sprout")}</span></footer></main>${overlay}`;
}
