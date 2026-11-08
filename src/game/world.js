const sites = [
  { x: 200, y: 170, name: "Recall shrine", color: "#a89cf0" },
  { x: 470, y: 110, name: "Truth bridge", color: "#7fc9e6" },
  { x: 730, y: 220, name: "Crystal grove", color: "#f0b778" },
  { x: 610, y: 430, name: "Memory ruins", color: "#dba0d4" },
  { x: 300, y: 430, name: "Summit guardian", color: "#edd77e" },
];
export function mountWorld(canvas, state, onChallenge, onFinish) {
  const ctx = canvas.getContext("2d"),
    keys = new Set();
  let frame,
    last = 0,
    ended = false;
  const down = (e) => {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ",
        "w",
        "a",
        "s",
        "d",
        "e",
        "W",
        "A",
        "S",
        "D",
        "E",
      ].includes(e.key)
    ) {
      e.preventDefault();
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" || e.key === " ") interact();
    }
  };
  const up = (e) => keys.delete(e.key.toLowerCase());
  const clear = () => keys.clear();
  function nearby() {
    return sites.findIndex(
      (s) => Math.hypot(state.x - s.x, state.y - s.y) < 65,
    );
  }
  function interact() {
    const i = nearby();
    if (i >= 0 && !state.done.includes(i)) {
      onChallenge(i);
      return;
    }
    if (
      state.done.length === 5 &&
      Math.hypot(state.x - 850, state.y - 465) < 70
    )
      onFinish();
  }
  const pointer = (e) => {
    const rect = canvas.getBoundingClientRect();
    canvas.focus();
    const x = ((e.clientX - rect.left) / rect.width) * 960,
      y = ((e.clientY - rect.top) / rect.height) * 560;
    state.target = {
      x: Math.max(30, Math.min(930, x)),
      y: Math.max(45, Math.min(520, y)),
    };
  };
  canvas.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  canvas.addEventListener("pointerdown", pointer);
  const button = document.querySelector("#interact");
  if (button) button.onclick = interact;
  function circle(x, y, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function draw(t) {
    if (ended) return;
    const dt = Math.min((t - last) / 1000, 0.04);
    last = t;
    let dx =
        (keys.has("arrowright") || keys.has("d") ? 1 : 0) -
        (keys.has("arrowleft") || keys.has("a") ? 1 : 0),
      dy =
        (keys.has("arrowdown") || keys.has("s") ? 1 : 0) -
        (keys.has("arrowup") || keys.has("w") ? 1 : 0);
    if (dx || dy) state.target = null;
    else if (state.target) {
      let x = state.target.x - state.x,
        y = state.target.y - state.y,
        d = Math.hypot(x, y);
      if (d > 4) {
        dx = x / d;
        dy = y / d;
      } else state.target = null;
    }
    const length = Math.hypot(dx, dy) || 1;
    state.x = Math.max(28, Math.min(932, state.x + (dx / length) * 185 * dt));
    state.y = Math.max(45, Math.min(520, state.y + (dy / length) * 185 * dt));
    ctx.fillStyle = "#162b32";
    ctx.fillRect(0, 0, 960, 560);
    ctx.fillStyle = "#203b3c";
    ctx.beginPath();
    ctx.ellipse(475, 285, 445, 250, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#526d5944";
    ctx.lineWidth = 45;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(90, 300);
    for (const s of sites) ctx.lineTo(s.x, s.y);
    ctx.lineTo(850, 465);
    ctx.stroke();
    for (let i = 0; i < 100; i++) {
      const x = (i * 137 + 43) % 940,
        y = (i * 79 + 35) % 540;
      if (
        sites.some((s) => Math.hypot(x - s.x, y - s.y) < 75) ||
        Math.hypot(x - 90, y - 300) < 60
      )
        continue;
      circle(x, y, 2, i % 3 ? "#5e846344" : "#bbcf7b66");
    }
    for (let i = 0; i < 20; i++) {
      const x = (i * 239 + 30) % 940,
        y = (i * 173 + 24) % 540;
      if (
        sites.some((s) => Math.hypot(x - s.x, y - s.y) < 90) ||
        Math.hypot(x - 90, y - 300) < 60
      )
        continue;
      ctx.fillStyle = "#28443c";
      ctx.fillRect(x - 4, y, 8, 22);
      circle(x, y - 7, 19, "#345a48");
      circle(x - 7, y - 13, 12, "#406b51");
    }
    const near = nearby();
    sites.forEach((s, i) => {
      const done = state.done.includes(i);
      circle(s.x, s.y, 39, done ? "#82bc6422" : s.color + "22");
      ctx.strokeStyle = done ? "#8bc787" : s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 13, 27, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = done ? "#709c68" : s.color;
      const bob = done ? 0 : Math.sin(t / 650 + i) * 5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 30 + bob);
      ctx.lineTo(s.x + 13, s.y - 8 + bob);
      ctx.lineTo(s.x, s.y + 8 + bob);
      ctx.lineTo(s.x - 13, s.y - 8 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.font = "600 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#e0e9dc";
      ctx.fillText(done ? "✓ Restored" : s.name, s.x, s.y + 49);
      if (near === i && !done) {
        ctx.fillStyle = "#f5f0c7";
        ctx.fillText("E · Begin challenge", s.x, s.y - 48);
      }
    });
    circle(850, 465, 36, state.done.length === 5 ? "#d5c77f55" : "#83979722");
    ctx.strokeStyle = state.done.length === 5 ? "#ead18f" : "#657c7b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(850, 453, 22, 33, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#d6e2d6";
    ctx.font = "12px sans-serif";
    ctx.fillText(
      state.done.length === 5 ? "E · Enter portal" : "Restore 5 crystals",
      850,
      511,
    );
    const bob = dx || dy ? Math.sin(t / 75) * 2 : Math.sin(t / 500);
    circle(state.x, state.y + 15, 13, "#0c202866");
    ctx.fillStyle = "#c8a174";
    ctx.fillRect(state.x - 9, state.y + 4, 7, 10);
    ctx.fillRect(state.x + 2, state.y + 4, 7, 10);
    ctx.fillStyle = "#bd8fdd";
    ctx.fillRect(state.x - 11, state.y - 12 + bob, 22, 20);
    circle(state.x, state.y - 20 + bob, 10, "#f2cfac");
    ctx.fillStyle = "#403b55";
    ctx.fillRect(state.x - 11, state.y - 29 + bob, 22, 8);
    ctx.fillStyle = "#25363c";
    ctx.fillRect(state.x - 5, state.y - 21 + bob, 3, 3);
    ctx.fillRect(state.x + 3, state.y - 21 + bob, 3, 3);
    ctx.fillStyle = "#e9d48b";
    ctx.fillRect(state.x + 13, state.y - 8 + bob, 3, 22);
    circle(state.x + 14, state.y - 11 + bob, 5, "#e9d48b");
    if (button)
      button.textContent =
        near >= 0 && !state.done.includes(near)
          ? `Explore ${sites[near].name}`
          : state.done.length === 5
            ? "Enter portal"
            : "Move close to a crystal";
    if (button)
      button.disabled =
        !(near >= 0 && !state.done.includes(near)) &&
        !(
          state.done.length === 5 &&
          Math.hypot(state.x - 850, state.y - 465) < 70
        );
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return () => {
    ended = true;
    cancelAnimationFrame(frame);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
    canvas.removeEventListener("keydown", down);
    canvas.removeEventListener("pointerdown", pointer);
  };
}
