/* 曲データ＋グルーヴ → 再生／MIDI用のイベント列（時間は拍単位、スウィング反映済み） */
(function (g) {
  const PF = (g.PF = g.PF || {});

  function voicing(ch) {
    let iv = ch.iv.slice();
    if (iv.length > 4) iv = iv.filter((x) => x !== 7).slice(0, 5);
    const out = iv.map((i) => { let m = 48 + ch.root + i; while (m >= 70) m -= 12; while (m < 53) m += 12; return m; });
    return [...new Set(out)].sort((a, b) => a - b);
  }

  PF.arrange = function (song) {
    const gv = song.meter.groove || PF.GROOVES[song.roles.drive.groove] || PF.GROOVES.pop;
    const BB = song.bb, N = song.meter.e * 2; // 1小節の拍数と16分ステップ数
    const sw = gv.swing || 0.5, U = gv.unit || 2;
    /* 小節内のステップ位置(16分=1)をスウィングさせる */
    const warp = (p) => {
      if (sw === 0.5) return p;
      const base = Math.floor(p / U) * U, x = p - base, h = U / 2;
      return base + (x < h ? (x * sw * U) / h : sw * U + ((x - h) * (1 - sw) * U) / h);
    };
    const at = (bar, step) => bar * BB + warp(step) / 4;
    const ev = { lead: [], chord: [], bass: [], drums: [] };

    song.melody.forEach((n) => {
      const bar = Math.floor(n.t / BB + 1e-9), s0 = (n.t - bar * BB) * 4, s1 = s0 + n.dur * 4;
      const t = at(bar, s0);
      let d = at(bar, s1) - t;
      if (n.end && n.dur >= 1.5) d -= 0.5; // 句末に息継ぎの隙間
      ev.lead.push({ t, d: Math.max(0.2, d * 0.96), midi: n.midi, vel: n.motif ? 0.95 : 0.85, lyric: n.lyric || '' });
    });

    song.sections.forEach((sec, si) => {
      const quiet = sec.type === 'intro' || sec.type === 'outro';
      const next = song.sections[si + 1];
      for (let b = 0; b < sec.nBars; b++) {
        const bar = sec.bar0 + b, chs = sec.chords[b];
        const chordAtStep = (s) => chs[Math.min(chs.length - 1, Math.floor((s * chs.length) / N))];
        const pat = (str) => (str ? str.slice(((b % (str.length / N)) | 0) * N).slice(0, N) : '');

        /* 和音 */
        if (quiet || !gv.comp || song.roles.color.keys === 'pad') {
          chs.forEach((c, ci) => ev.chord.push({ t: bar * BB + (ci * BB) / chs.length, d: BB / chs.length - 0.05, notes: voicing(c), vel: 0.6, sustain: true }));
        } else {
          const cp = pat(gv.comp), hits = [];
          for (let s = 0; s < N; s++) if (cp[s] === 'x') hits.push(s);
          hits.forEach((s, i) => {
            const v = voicing(chordAtStep(s)), nx = i + 1 < hits.length ? hits[i + 1] : N;
            const notes = gv.arp ? [v[i % v.length] + (i % (v.length * 2) >= v.length ? 12 : 0)] : v;
            ev.chord.push({ t: at(bar, s), d: Math.max(0.2, at(bar, nx) - at(bar, s) - 0.03), notes, vel: s % 4 === 0 ? 0.7 : 0.55 });
          });
        }

        /* ベース */
        const bp = quiet ? 'r' + '-'.repeat(N - 1) : pat(gv.bass);
        for (let s = 0; s < N; s++) {
          const c = bp[s];
          if (!c || c === '.' || c === '-') continue;
          let e = s + 1;
          while (e < N && bp[e] === '-') e++;
          const ch = chordAtStep(s);
          let m = 36 + ch.root; if (m > 45) m -= 12;
          if (c === '5') m += 7; else if (c === '8') m += 12;
          ev.bass.push({ t: at(bar, s), d: Math.max(0.15, (at(bar, e) - at(bar, s)) * 0.92), midi: m, vel: s === 0 ? 0.95 : 0.8 });
        }

        /* ドラム（Intro/Outroは休み。サビ前の最終小節に短いフィル） */
        if (quiet) continue;
        const fill = b === sec.nBars - 1 && next && next.type === 'chorus' && gv.s;
        [['k', 'kick', 1], ['s', 'snare', 0.9], ['h', 'hat', 0.5], ['o', 'ohat', 0.5], ['p', 'perc', 0.6]].forEach(([key, kind, vel]) => {
          const dp = pat(gv[key]);
          for (let s = 0; s < N; s++) {
            if (fill && s >= N - 4 && kind !== 'kick') continue;
            if (dp[s] === 'x') ev.drums.push({ t: at(bar, s), kind, vel: kind === 'hat' && s % 4 ? vel * 0.7 : vel });
          }
        });
        if (fill) [N - 4, N - 3, N - 2, N - 1].forEach((s, i) => ev.drums.push({ t: at(bar, s), kind: 'snare', vel: 0.5 + i * 0.13 }));
      }
    });
    Object.values(ev).forEach((a) => a.sort((x, y) => x.t - y.t));
    return ev;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
