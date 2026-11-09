import { expeditionAudio } from "./audio.js";
let immersive = false,
  native = false;
function sync() {
  document.body.classList.toggle("game-immersive", immersive);
  const full = document.querySelector("#fullscreen");
  if (full) {
    full.textContent = immersive ? "Exit fullscreen" : "Fullscreen";
    full.setAttribute("aria-pressed", String(immersive));
  }
  const sound = document.querySelector("#sound");
  if (sound) {
    sound.textContent = expeditionAudio.enabled ? "Sound on" : "Enable sound";
    sound.setAttribute("aria-pressed", String(expeditionAudio.enabled));
  }
}
if (typeof document !== "undefined") {
  document.addEventListener("fullscreenchange", () => {
    if (native && !document.fullscreenElement) {
      immersive = false;
      native = false;
    }
    sync();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && immersive && !document.fullscreenElement) {
      immersive = false;
      sync();
    }
  });
}
export function bindPresentation(active) {
  expeditionAudio.setActive(active);
  if (!active) {
    immersive = false;
    if (native && document.fullscreenElement)
      document.exitFullscreen().catch(() => {});
    native = false;
  }
  sync();
  const full = document.querySelector("#fullscreen");
  if (full)
    full.onclick = async () => {
      if (immersive) {
        immersive = false;
        if (document.fullscreenElement)
          await document.exitFullscreen().catch(() => {});
        native = false;
      } else {
        immersive = true;
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            native = true;
          }
        } catch {
          native = false;
        }
      }
      sync();
    };
  const sound = document.querySelector("#sound");
  if (sound)
    sound.onclick = async () => {
      const ok = await expeditionAudio.toggle();
      sync();
      const message = document.querySelector("#presentation-status");
      if (message)
        message.textContent = ok
          ? ""
          : "Audio could not start in this browser. Check its sound permissions.";
    };
}
