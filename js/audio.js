(function (global) {
  const Sfx = {
    ctx: null,
    muted: localStorage.getItem("bober-mute") === "1",

    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    },

    beep(freq, dur, type, gain, slide) {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(gain || 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },

    noise(dur, gain) {
      if (this.muted || !this.ctx) return;
      const n = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const d = n.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = this.ctx.createBufferSource();
      src.buffer = n;
      const g = this.ctx.createGain();
      g.gain.value = gain || 0.12;
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 900;
      src.connect(f);
      f.connect(g);
      g.connect(this.ctx.destination);
      src.start();
    },

    twang() {
      this.beep(180, 0.18, "sawtooth", 0.1, 90);
      this.beep(320, 0.12, "square", 0.05, 140);
    },
    wood() {
      this.noise(0.12, 0.16);
      this.beep(140, 0.08, "triangle", 0.07, 70);
    },
    stone() {
      this.noise(0.16, 0.2);
      this.beep(90, 0.14, "square", 0.08, 50);
    },
    splat() {
      this.beep(220, 0.25, "sawtooth", 0.1, 70);
      this.beep(140, 0.35, "triangle", 0.08, 50);
    },
    star() {
      this.beep(660, 0.12, "square", 0.08);
      setTimeout(() => this.beep(880, 0.14, "square", 0.07), 80);
      setTimeout(() => this.beep(1174, 0.18, "square", 0.06), 160);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.16, "square", 0.07), i * 90));
    },
    fail() {
      this.beep(300, 0.2, "sawtooth", 0.09, 120);
      setTimeout(() => this.beep(160, 0.35, "triangle", 0.08, 70), 160);
    },
    tick() {
      this.beep(880, 0.05, "square", 0.05);
    },
    pop() {
      this.beep(700, 0.06, "square", 0.05, 400);
    },

    setMuted(v) {
      this.muted = v;
      localStorage.setItem("bober-mute", v ? "1" : "0");
    },
  };

  global.BoberSfx = Sfx;
})(window);
