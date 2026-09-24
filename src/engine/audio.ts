export class AudioEngine {
  private context: AudioContext | null = null;
  enabled = false;
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
    } catch {
      this.enabled = false;
    }
  }
  play(
    kind:
      | "signal"
      | "correct"
      | "rare"
      | "combo"
      | "fail"
      | "warning"
      | "finish"
      | "type",
  ) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    const patterns = {
      signal: [440, 660],
      correct: [520, 780],
      rare: [660, 880, 1100],
      combo: [440, 660, 880, 1320],
      fail: [180, 110],
      warning: [300],
      finish: [330, 440, 660, 880],
      type: [260],
    };
    const ctx = this.context;
    patterns[kind].forEach((hz, i) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = kind === "fail" ? "triangle" : "sine";
      o.frequency.value = hz;
      const start = ctx.currentTime + i * 0.06;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(
        kind === "type" ? 0.012 : 0.045,
        start + 0.008,
      );
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(start);
      o.stop(start + 0.16);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    });
  }
}
