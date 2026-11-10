/* Web Audio の簡易シンセと先読みスケジューラ（外部音源なし） */
(function (g) {
  const PF = (g.PF = g.PF || {});
  let ctx = null, master = null, noise = null, ses = null, timer = null;
  const st = { playing: false, bpm: 120, beat0: 0, t0: 0, idx: 0, loopOff: 0, list: [], total: 0, loop: true, onEnd: null, snd: null };
  const mutes = { lead: false, chord: false, bass: false, drums: false };

  const LEAD = {
    soft: { o: [['triangle', 1, 0, 0.8], ['sine', 2, 0, 0.15]], a: 0.02, d: 0.3, s: 0.7, r: 0.15, lp: 2600 },
    saw: { o: [['sawtooth', 1, -7, 0.4], ['sawtooth', 1, 7, 0.4]], a: 0.01, d: 0.25, s: 0.7, r: 0.12, lp: 3200 },
    square: { o: [['square', 1, 0, 0.4]], a: 0.01, d: 0.2, s: 0.7, r: 0.1, lp: 2200 },
    pluck: { o: [['triangle', 1, 0, 0.8], ['sawtooth', 1, 0, 0.2]], a: 0.005, d: 0.35, s: 0.25, r: 0.15, lp: 3000 },
    bell: { o: [['sine', 1, 0, 0.7], ['sine', 3, 0, 0.2], ['sine', 5.02, 0, 0.08]], a: 0.005, d: 0.6, s: 0.15, r: 0.4, lp: 6000 },
  };
  const KEYS = {
    pad: { o: [['sawtooth', 1, -6, 0.3], ['sawtooth', 1, 6, 0.3]], a: 0.25, d: 0.5, s: 0.8, r: 0.4, lp: 1300 },
    keys: { o: [['triangle', 1, 0, 0.7], ['sine', 2, 0, 0.15]], a: 0.005, d: 0.6, s: 0.3, r: 0.2, lp: 2800 },
    rhodes: { o: [['sine', 1, 0, 0.8], ['sine', 2, 0, 0.12], ['sine', 4, 0, 0.05]], a: 0.005, d: 0.8, s: 0.35, r: 0.3, lp: 3500 },
    pluck: { o: [['sawtooth', 1, 0, 0.45]], a: 0.003, d: 0.18, s: 0.1, r: 0.1, lp: 2200 },
    power: { o: [['sawtooth', 0.5, 0, 0.4], ['square', 1, 5, 0.25]], a: 0.005, d: 0.3, s: 0.8, r: 0.08, lp: 1900 },
  };
  const BASS = {
    sub: { o: [['sine', 1, 0, 1]], a: 0.01, d: 0.3, s: 0.8, r: 0.08, lp: 900 },
    synth: { o: [['sawtooth', 1, 0, 0.6], ['sine', 1, 0, 0.5]], a: 0.005, d: 0.15, s: 0.6, r: 0.06, lp: 700 },
    pick: { o: [['triangle', 1, 0, 0.8], ['sawtooth', 1, 0, 0.2]], a: 0.005, d: 0.25, s: 0.5, r: 0.08, lp: 1100 },
    808: { o: [['sine', 1, 0, 1], ['triangle', 1, 0, 0.15]], a: 0.004, d: 0.9, s: 0.5, r: 0.25, lp: 600 },
  };

  function ensure() {
    if (!ctx) {
      const AC = g.AudioContext || g.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.8;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(dest, t, midi, dur, vel, p) {
    const f = PF.midiFreq(midi), env = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = p.lp;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vel, t + p.a);
    env.gain.setTargetAtTime(vel * p.s, t + p.a, p.d / 3);
    env.gain.setTargetAtTime(0, t + dur, p.r / 3);
    const end = t + dur + p.r * 2;
    p.o.forEach(([type, ratio, det, gain]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = type; o.frequency.value = f * ratio; o.detune.value = det; og.gain.value = gain;
      o.connect(og); og.connect(lp); o.start(t); o.stop(end);
    });
    lp.connect(env); env.connect(dest);
  }
  function burst(dest, t, vel, dec, type, freq, q) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), e = ctx.createGain();
    src.buffer = noise; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    e.gain.setValueAtTime(vel, t); e.gain.exponentialRampToValueAtTime(0.001, t + dec);
    src.connect(f); f.connect(e); e.connect(dest);
    src.start(t, Math.random() * 0.5); src.stop(t + dec + 0.02);
  }
  function blip(dest, t, vel, f0, f1, dec, type) {
    const o = ctx.createOscillator(), e = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dec * 0.5);
    e.gain.setValueAtTime(vel, t); e.gain.exponentialRampToValueAtTime(0.001, t + dec);
    o.connect(e); e.connect(dest); o.start(t); o.stop(t + dec + 0.02);
  }
  function drum(dest, t, kind, vel, el) {
    if (kind === 'kick') blip(dest, t, vel, el ? 170 : 140, 45, el ? 0.42 : 0.28);
    else if (kind === 'snare') { burst(dest, t, vel * 0.55, el ? 0.22 : 0.16, el ? 'bandpass' : 'highpass', el ? 1500 : 1800, 0.8); if (!el) blip(dest, t, vel * 0.4, 220, 160, 0.1, 'triangle'); }
    else if (kind === 'hat') burst(dest, t, vel * 0.3, 0.04, 'highpass', 8000);
    else if (kind === 'ohat') burst(dest, t, vel * 0.3, 0.22, 'highpass', 7000);
    else { blip(dest, t, vel * 0.35, 900, 700, 0.04, 'square'); burst(dest, t, vel * 0.15, 0.03, 'bandpass', 2500, 2); }
  }

  function session() {
    const out = ctx.createGain(); out.connect(master);
    const bus = {};
    [['lead', 0.42], ['chord', 0.2], ['bass', 0.55], ['drums', 0.8]].forEach(([k, v]) => {
      const gn = ctx.createGain(); gn.gain.value = mutes[k] ? 0 : v; gn._v = v; gn.connect(out); bus[k] = gn;
    });
    /* リードに薄いディレイ */
    const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain();
    dl.delayTime.value = 0.27; fb.gain.value = 0.25; wet.gain.value = 0.18;
    bus.lead.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(out);
    return { out, bus };
  }

  const beatNow = () => st.beat0 + ((ctx.currentTime - st.t0) * st.bpm) / 60;
  function fire(e, t) {
    const spb = 60 / st.bpm, b = ses.bus, s = st.snd;
    if (e.part === 'lead') tone(b.lead, t, e.midi, e.d * spb, e.vel * 0.5, LEAD[s.lead]);
    else if (e.part === 'bass') tone(b.bass, t, e.midi, e.d * spb, e.vel * 0.6, BASS[s.bass]);
    else if (e.part === 'chord') e.notes.forEach((m) => tone(b.chord, t, m, e.d * spb, e.vel * 0.45, e.sustain ? KEYS.pad : KEYS[s.keys]));
    else drum(b.drums, t, e.kind, e.vel, s.kit === 'el');
  }
  function tick() {
    if (!st.playing) return;
    const horizon = beatNow() + (0.18 * st.bpm) / 60;
    for (;;) {
      if (st.idx >= st.list.length) {
        if (!st.loop) { if (beatNow() > st.loopOff + st.total + 0.5) { const cb = st.onEnd; PF.audio.stop(); cb && cb(); } return; }
        if (st.loopOff + st.total > horizon) return;
        st.idx = 0; st.loopOff += st.total;
      }
      const e = st.list[st.idx], bt = e.t + st.loopOff;
      if (bt > horizon) return;
      const t = st.t0 + ((bt - st.beat0) * 60) / st.bpm;
      if (t >= ctx.currentTime - 0.03) fire(e, Math.max(t, ctx.currentTime));
      st.idx++;
    }
  }

  PF.audio = {
    unlock: ensure,
    isPlaying: () => st.playing,
    /* パッドを叩いたときの試聴 */
    note(midi, dur, sound) {
      if (!ensure()) return;
      tone(master, ctx.currentTime + 0.005, midi, dur || 0.35, 0.3, LEAD[sound] || LEAD.soft);
    },
    /* モチーフ4音の試聴 */
    phrase(midis, eighths, bpm, sound) {
      if (!ensure()) return;
      let t = ctx.currentTime + 0.03;
      const e8 = 30 / bpm;
      midis.forEach((m, i) => { tone(master, t, m, eighths[i] * e8 * 0.92, 0.3, LEAD[sound] || LEAD.soft); t += eighths[i] * e8; });
    },
    play(ev, o) {
      if (!ensure()) return false;
      this.stop();
      st.list = [].concat(ev.lead.map((e) => Object.assign({ part: 'lead' }, e)), ev.chord.map((e) => Object.assign({ part: 'chord' }, e)),
        ev.bass.map((e) => Object.assign({ part: 'bass' }, e)), ev.drums.map((e) => Object.assign({ part: 'drums' }, e))).sort((a, b) => a.t - b.t);
      const from = o.from || 0;
      st.idx = st.list.findIndex((e) => e.t >= from - 1e-6); if (st.idx < 0) st.idx = st.list.length;
      Object.assign(st, { bpm: o.bpm, total: o.total, loop: !!o.loop, onEnd: o.onEnd, snd: o.sound, loopOff: 0, beat0: from, t0: ctx.currentTime + 0.08, playing: true });
      ses = session();
      timer = setInterval(tick, 25); tick();
      return true;
    },
    stop() {
      if (!st.playing) return;
      st.playing = false; clearInterval(timer);
      const s = ses; ses = null;
      if (s) { s.out.gain.setTargetAtTime(0, ctx.currentTime, 0.015); setTimeout(() => s.out.disconnect(), 250); }
    },
    setBpm(bpm) { if (st.playing) { st.beat0 = beatNow(); st.t0 = ctx.currentTime; } st.bpm = bpm; },
    setLoop(v) { st.loop = v; },
    setMute(part, v) { mutes[part] = v; if (ses) ses.bus[part].gain.setTargetAtTime(v ? 0 : ses.bus[part]._v, ctx.currentTime, 0.01); },
    /* 曲頭からの拍位置（ループ中は折り返す）。停止中は -1 */
    position() { if (!st.playing) return -1; const b = beatNow(); return b < 0 ? 0 : st.loop ? b % st.total : Math.min(b, st.total); },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
