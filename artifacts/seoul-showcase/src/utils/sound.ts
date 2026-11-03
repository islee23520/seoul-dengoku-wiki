/** Zero-dependency Web Audio synthesizer: typewriter blips + subway ambient hum. */
class SubwaySound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private muted = false;
  private lastClick = 0;

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.9;
    master.connect(ctx.destination);
    this.master = master;

    const amb = ctx.createGain();
    amb.gain.value = 0;
    amb.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 180;
    amb.connect(master);
    lp.connect(amb);
    this.ambientGain = amb;

    // Two detuned low hums (rail traction motor)
    [48, 50.7, 96.3].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "triangle" : "sawtooth";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.08 : 0.22;
      o.connect(g).connect(lp);
      o.start();
      this.sources.push(o);
    });
    // Slow LFO for passing-train swell
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 70;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    this.sources.push(lfo);
    // Filtered noise for tunnel air
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const ng = ctx.createGain();
    ng.gain.value = 0.5;
    noise.connect(ng).connect(lp);
    noise.start();
    this.sources.push(noise);

    // Wind and blown snow: white noise through a wandering band-pass, gusting via slow LFOs.
    const wbuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const wd = wbuf.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    const wind = ctx.createBufferSource();
    wind.buffer = wbuf; wind.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 520; bp.Q.value = 0.9;
    const wg = ctx.createGain();
    wg.gain.value = 0.05;
    wind.connect(bp).connect(wg).connect(amb);
    const gust = ctx.createOscillator(); gust.frequency.value = 0.11;
    const gustAmt = ctx.createGain(); gustAmt.gain.value = 0.035;
    gust.connect(gustAmt).connect(wg.gain);
    const sweep = ctx.createOscillator(); sweep.frequency.value = 0.043;
    const sweepAmt = ctx.createGain(); sweepAmt.gain.value = 260;
    sweep.connect(sweepAmt).connect(bp.frequency);
    // Fine hiss of snow grains, high band, very soft.
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4200;
    const hg = ctx.createGain(); hg.gain.value = 0.012;
    wind.connect(hp).connect(hg).connect(amb);
    [wind, gust, sweep].forEach((s) => { s.start(); this.sources.push(s); });
  }

  click() {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted) return;
    const now = ctx.currentTime;
    if (now - this.lastClick < 0.035) return;
    this.lastClick = now;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 1500 + Math.random() * 500;
    g.gain.setValueAtTime(0.025, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    o.connect(g).connect(this.master);
    o.start(now);
    o.stop(now + 0.035);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  }

  chime() {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted) return;
    const now = ctx.currentTime;
    [659.25, 523.25].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = now + i * 0.22;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 0.65);
      o.onended = () => { o.disconnect(); g.disconnect(); };
    });
  }

  /** Lower ambience while narration plays. */
  duck(on: boolean) {
    if (!this.ctx || !this.ambientGain) return;
    const t = this.ctx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(t);
    this.ambientGain.gain.setTargetAtTime(on ? 0.05 : 0.16, t, 0.25);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  dispose() {
    this.sources.forEach((s) => { try { s.stop(); s.disconnect(); } catch { /* already stopped */ } });
    this.sources = [];
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.ambientGain = null;
  }
}

export const sound = new SubwaySound();
