// Procedural audio: no downloads, tracking, or external sound assets.
class ExpeditionAudio {
  constructor() {
    try {
      this.enabled = localStorage.getItem("stugame-sound") === "on";
    } catch {
      this.enabled = false;
    }
    this.active = false;
    this.stepTime = 0;
    this.birdTime = 0;
  }
  async unlock() {
    if (!this.enabled || !this.active) return;
    try {
      if (!this.context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return false;
        this.context = new Audio();
        this.master = this.context.createGain();
        this.master.gain.value = 0.32;
        this.master.connect(this.context.destination);
        const buffer = this.context.createBuffer(
            1,
            this.context.sampleRate * 3,
            this.context.sampleRate,
          ),
          data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noise = buffer;
        const wind = this.context.createBufferSource();
        wind.buffer = buffer;
        wind.loop = true;
        const filter = this.context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 260;
        const gain = this.context.createGain();
        gain.gain.value = 0.12;
        wind.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        wind.start();
      }
      await this.context.resume();
      return this.context.state === "running";
    } catch {
      return false;
    }
  }
  setActive(active) {
    this.active = active;
    if (!active) this.context?.suspend().catch(() => {});
  }
  async toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem("stugame-sound", this.enabled ? "on" : "off");
    } catch {}
    if (this.enabled) {
      const ok = await this.unlock();
      if (!ok) {
        this.enabled = false;
        return false;
      }
    } else await this.context?.suspend();
    return true;
  }
  tone(hz, delay = 0, duration = 0.14, volume = 0.16) {
    if (!this.ready()) return;
    const t = this.context.currentTime + delay,
      o = this.context.createOscillator(),
      g = this.context.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(hz, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration + 0.02);
  }
  ready() {
    return (
      this.active &&
      this.enabled &&
      this.context?.state === "running" &&
      !document.hidden
    );
  }
  cue(name) {
    if (!this.ready()) return;
    const notes =
      {
        success: [440, 554, 659],
        retry: [220, 185],
        pickup: [880, 1175],
        build: [330, 440, 660],
        complete: [392, 494, 587, 784],
      }[name] || [];
    notes.forEach((n, i) =>
      this.tone(n, i * 0.12, 0.23, name === "retry" ? 0.12 : 0.18),
    );
  }
  tick(moving, dt, sprint = false) {
    if (!this.ready()) return;
    this.stepTime += dt;
    this.birdTime += dt;
    if (moving && this.stepTime > (sprint ? 0.22 : 0.38)) {
      this.stepTime = 0;
      const t = this.context.currentTime,
        source = this.context.createBufferSource(),
        filter = this.context.createBiquadFilter(),
        gain = this.context.createGain();
      source.buffer = this.noise;
      filter.type = "bandpass";
      filter.frequency.value = 450 + Math.random() * 300;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(t, Math.random(), 0.1);
    }
    if (this.birdTime > 9) {
      this.birdTime = 0;
      this.tone(1800, 0, 0.08, 0.035);
      this.tone(2300, 0.13, 0.1, 0.025);
    }
  }
}
export const expeditionAudio = new ExpeditionAudio();
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) expeditionAudio.context?.suspend().catch(() => {});
    else expeditionAudio.unlock();
  });
