/* 4音モチーフ＋歌詞＋スケール＋ジャンル → コード進行とメロディ
   方針（資料05・06・07）：モチーフを核に固定し、移高・反行・逆行・断片化で展開。
   反復しつつ末尾だけ変え、句末はコードトーン、サビの最後は主音へ着地させる。 */
(function (g) {
  const PF = (g.PF = g.PF || {});
  const LO = 52, HI = 84;

  /* 選んだ順に 主語（形式と進行）・動力（ドラム/ベース）・色（音色） */
  PF.roles = function (ids) {
    const gs = ids.map((id) => PF.GENRE[id]).filter(Boolean);
    if (!gs.length) gs.push(PF.GENRE.pop);
    return { subject: gs[0], drive: gs[1] || gs[0], color: gs[2] || gs[0], all: gs };
  };

  /* ジャンルから使えるスケールを順位付きで返す */
  PF.scaleOptions = function (ids) {
    const gs = ids.map((id) => PF.GENRE[id]).filter(Boolean);
    if (!gs.length) return Object.keys(PF.SCALES).map((id) => ({ id, score: 0, from: [] }));
    const m = {};
    gs.forEach((ge, gi) => ge.scales.forEach((id, i) => {
      const e = (m[id] = m[id] || { id, score: 0, from: [] });
      e.score += ((ge.scales.length - i) / ge.scales.length) * (gi === 0 ? 1.5 : 1) + 1;
      e.from.push(ge.name);
    }));
    return Object.values(m).sort((a, b) => b.score - a.score);
  };

  /* 資料07の作例のうち、いまのキーとスケールのパッドに乗るもの */
  PF.fittingPresets = function (rootPc, scale) {
    const lay = PF.padLayout(rootPc, scale);
    const out = [];
    PF.PRESETS.forEach((p) => {
      for (const oct of [0, 12, -12]) {
        const pads = p.n.map((n) => lay.pads.indexOf(lay.rootMidi + (n - p.c) + oct));
        if (pads.every((x) => x >= 0)) { out.push({ name: p.name, pads, r: p.r }); break; }
      }
    });
    return out;
  };

  /* モチーフのリズム型を、その小節で歌う音数 k に合わせて分割／結合する */
  function cellsFor(R, k) {
    if (k <= 0) return [];
    let c = R.map((d, i) => ({ d, o: i }));
    while (c.length < k) {
      let bi = -1, bd = 1;
      c.forEach((x, i) => { if (x.d > bd) { bd = x.d; bi = i; } });
      if (bi < 0) break;
      const x = c[bi], a = Math.ceil(x.d / 2);
      c.splice(bi, 1, { d: a, o: x.o }, { d: x.d - a, o: x.o });
    }
    while (c.length > k && c.length > 1) {
      let bi = 0, bs = 1e9;
      for (let i = 0; i < c.length - 1; i++) { const s = c[i].d + c[i + 1].d; if (s < bs) { bs = s; bi = i; } }
      c.splice(bi, 2, { d: bs, o: c[bi].o });
    }
    if (c.length < R.length) c[c.length - 1].o = R.length - 1;
    let pos = 0;
    c.forEach((x, i) => { x.p = i && c[i - 1].o === x.o ? c[i - 1].p + 1 : 0; x.pos = pos; pos += x.d; });
    return c;
  }
  PF._cellsFor = cellsFor;

  function distribute(N, B) {
    const c = Array(B).fill(Math.floor(N / B));
    for (let i = 0; i < N % B; i++) c[i]++;
    if (B > 1 && c[B - 1] >= 3) { const i = c.findIndex((x) => x < 8); if (i >= 0 && i < B - 1) { c[i]++; c[B - 1]--; } }
    let over = 0;
    for (let i = 0; i < B; i++) if (c[i] > 8) { over += c[i] - 8; c[i] = 8; }
    for (let i = 0; i < B && over > 0; i++) { const a = Math.min(over, 8 - c[i]); c[i] += a; over -= a; }
    return c;
  }

  const PLANS = {
    chorus: [['orig', 'retro', 'orig', 'inv'], ['orig', 'inv', 'orig', 'retro']],
    verse: [['frag', 'orig', 'frag', 'retro'], ['frag2', 'retro', 'frag2', 'orig']],
    pre: [['orig', 'orig', 'orig', 'orig'], ['orig', 'orig', 'orig', 'orig']],
    bridge: [['inv', 'retro', 'inv', 'orig'], ['inv', 'orig', 'retro', 'orig']],
  };

  PF.generate = function (o) {
    const scale = PF.SCALES[o.scaleId];
    const root = o.rootPc;
    const flats = PF.useFlats(root, scale);
    const rnd = PF.mulberry32(o.seed || 1);
    const lay = PF.padLayout(root, scale);
    const lad = lay.ladder;
    const M = o.motif.map((p) => lay.start + p);
    const R = o.rhythm;
    const scalePcs = scale.iv.map((i) => (i + root) % 12);
    const parentPcs = (PF.SCALES[scale.parent] || scale).iv.map((i) => (i + root) % 12);
    const roles = PF.roles(o.genreIds || []);
    const density = o.density || 12;
    const prog = (s) => PF.parseProg(s, root, flats);

    /* 音とコードの相性：コードトーン=1、半音でぶつかる音=-1.2、その他=0.25 */
    function q(midi, ch) {
      const pc = midi % 12;
      if (ch.pcs.includes(pc)) return 1;
      if (!scale.bluesy) for (const c of ch.pcs) {
        if ((pc - c + 12) % 12 === 1) return -1.2;
        if ((c - pc + 12) % 12 === 1 && !scalePcs.includes(c)) return -1.2;
      }
      return 0.25;
    }
    const chordAt = (bar, pos) => bar[Math.min(bar.length - 1, Math.floor((pos * bar.length) / 8))];
    const fit = (p) => { let a = 0, n = 0; p.bars.forEach((b) => b.forEach((c) => c.pcs.forEach((x) => { n++; if (parentPcs.includes(x)) a++; }))); return a / n; };
    const motifFit = (p) => { let s = 0, pos = 0; M.forEach((li, i) => { s += R[i] * q(lad[li], chordAt(p.bars[0], pos)); pos += R[i]; }); return s / 8; };

    /* --- コード進行の候補：スケール固有＋選んだジャンルの定番 --- */
    const cand = {};
    scale.progs.forEach((s) => (cand[s] = { w: 0.15, own: true }));
    roles.all.forEach((ge, i) => ge.progs.forEach((s) => { (cand[s] = cand[s] || { w: 0 }).w += i === 0 ? 0.3 : 0.12; }));
    const pool = Object.keys(cand).map((s) => {
      const p = prog(s), f = fit(p);
      return { p, f, ok: cand[s].own || f >= 0.85, base: cand[s].w + (f - 0.85) * 4 };
    }).filter((x) => x.ok);
    const pick = (list, fn) => list.map((x) => ({ x, s: fn(x) })).sort((a, b) => b.s - a.s)[0].x;
    const chorusP = pick(pool, (x) => x.base + motifFit(x.p) * 1.2 + rnd() * 0.35).p;
    const rest = pool.filter((x) => x.p.str !== chorusP.str);
    const verseP = rest.length ? pick(rest, (x) => x.base + rnd() * 0.5).p : chorusP;
    const half = chorusP.bars.length >> 1;
    const bridgeP = chorusP.bars.length === 4 && chorusP.bars[0][0].sym !== chorusP.bars[2][0].sym
      ? { str: chorusP.str, bars: chorusP.bars.slice(half).concat(chorusP.bars.slice(0, half)) } : verseP;
    let preP = verseP;
    for (const s of ['IV-V', 'ii-V', 'bVI-bVII', 'iv-V', 'bVII-IV', 'bII-bIII', 'vi-II']) { const p = prog(s); if (fit(p) === 1) { preP = p; break; } }
    const tonicP = prog(scale.tonic);
    const PROG = { chorus: chorusP, verse: verseP, pre: preP, bridge: bridgeP };

    /* --- モチーフの変形 --- */
    const variant = (op) => op === 'inv' ? M.map((x) => 2 * M[0] - x) : op === 'retro' ? M.slice().reverse()
      : op === 'frag' ? [M[0], M[1], M[0], M[1]] : op === 'frag2' ? [M[1], M[0], M[1], M[2]] : M.slice();
    const mean = M.reduce((s, x) => s + lad[x], 0) / 4;
    const verseShift = mean > 66 ? -3 : mean > 61 ? -2 : 0;
    const TARGET = { chorus: 0, verse: verseShift, pre: 0, bridge: mean > 66 ? -1 : 0 };

    function realize(cells, V, shift) {
      return cells.map((c) => {
        const b = V[c.o] + shift;
        if (!c.p) return b;
        const d = (c.o < 3 ? V[c.o + 1] + shift : b) - b;
        return b + Math.sign(d) * Math.min(c.p, Math.max(0, Math.abs(d) - 1));
      });
    }
    const valid = (li) => li >= 0 && li < lad.length;
    function improve(li, ch, need, span) {
      let best = li, bq = q(lad[li], ch);
      if (bq >= need) return li;
      for (let d = 1; d <= span; d++) for (const s of [-1, 1]) {
        const x = li + s * d;
        if (!valid(x) || lad[x] < LO || lad[x] > HI) continue;
        const v = q(lad[x], ch) - d * 0.01;
        if (v > bq) { bq = v; best = x; }
      }
      return best;
    }

    const cache = {};
    function makeLine(sec, line, lineIdx, bar0, prev) {
      const B = line.nBars, counts = distribute(line.count, B);
      const key = [sec.type, lineIdx % 2, counts.join(','), sec.chords.slice(bar0, bar0 + B).map((b) => b.map((c) => c.sym).join('+')).join('/')].join(':');
      if (cache[key]) return cache[key].map((n) => Object.assign({}, n, { bar: n.bar + bar0 }));
      const notes = [];
      const plan = PLANS[sec.type][lineIdx % 2];
      for (let b = 0; b < B; b++) {
        const cells = cellsFor(R, counts[b]);
        if (!cells.length) continue;
        const bar = sec.chords[bar0 + b], op = plan[b % 4], V = variant(op);
        const exact = sec.type === 'chorus' && lineIdx === 0 && b === 0;
        let shift = 0;
        if (sec.type === 'pre') shift = b - (B - 1) + 1 + verseShift + (lineIdx % 2);
        else if (!exact) {
          let bs = -1e9;
          for (let k = TARGET[sec.type] - 4; k <= TARGET[sec.type] + 4; k++) {
            const ps = realize(cells, V, k);
            if (!ps.every(valid)) continue;
            let s = 0, w = 0;
            ps.forEach((li, i) => {
              const c = cells[i], wt = c.d * (c.pos % 4 === 0 ? 1.5 : 1);
              s += wt * q(lad[li], chordAt(bar, c.pos)); w += wt;
              if (lad[li] < LO || lad[li] > HI) s -= 0.5 * wt;
            });
            s = s / w - 0.12 * Math.abs(k - TARGET[sec.type]) + rnd() * 0.05;
            if (prev != null) s -= 0.08 * Math.max(0, Math.abs(ps[0] - prev) - 2);
            if (s > bs) { bs = s; shift = k; }
          }
        }
        let ps = realize(cells, V, shift).map((li) => Math.max(0, Math.min(lad.length - 1, li)));
        if (!exact) ps = ps.map((li, i) => (cells[i].pos % 4 === 0 || cells[i].d >= 4) ? improve(li, chordAt(bar, cells[i].pos), 0, 2) : li);
        ps.forEach((li, i) => notes.push({ bar: bar0 + b, pos: cells[i].pos, d: cells[i].d, li, exact, motif: op === 'orig' && shift === 0 }));
        prev = ps[ps.length - 1];
      }
      const last = notes[notes.length - 1];
      if (last && !last.exact) last.li = improve(last.li, chordAt(sec.chords[last.bar], last.pos), 1, 2);
      cache[key] = notes.map((n) => Object.assign({}, n, { bar: n.bar - bar0 }));
      return notes;
    }

    /* --- セクションを組み立てる --- */
    let lyr = o.sections && o.sections.length ? o.sections : null;
    if (!lyr) {
      const ln = (n) => ({ text: '', count: n, labels: [] });
      lyr = [{ type: 'verse', label: 'Verse', lines: [ln(6), ln(6), ln(6), ln(5)] }, { type: 'chorus', label: 'Chorus', lines: [ln(4), ln(5), ln(4), ln(5)] }];
    }
    const sections = [];
    const inst = (type, label, bars, notes) => sections.push({ type, label, chords: bars, nBars: bars.length, lines: [{ text: '', bar0: 0, nBars: bars.length, notes }] });
    let p0 = 0;
    const motifNotes = (bar, land) => M.map((li, i) => { const n = { bar, pos: p0, d: R[i], li, motif: true }; p0 += R[i]; if (land && i === 3) n.li = land(li); return n; });
    inst('intro', 'Intro', [chorusP.bars[0], chorusP.bars[1 % chorusP.bars.length]], motifNotes(0));

    lyr.forEach((src) => {
      const P = PROG[src.type] || verseP;
      const sec = { type: src.type, label: src.label, chords: [], lines: [], nBars: 0 };
      src.lines.forEach((l) => { const nBars = 2 * Math.max(1, Math.ceil(l.count / density)); sec.lines.push({ text: l.text, count: l.count, labels: l.labels, bar0: sec.nBars, nBars }); sec.nBars += nBars; });
      for (let i = 0; i < sec.nBars; i++) sec.chords.push(P.bars[i % P.bars.length]);
      let prev = null;
      sec.lines.forEach((line, i) => {
        line.notes = makeLine(sec, line, i, line.bar0, prev);
        line.notes.forEach((n, k) => (n.lyric = line.labels[k] || ''));
        const last = line.notes[line.notes.length - 1];
        if (last) { prev = last.li; last.end = true; }
      });
      /* サビの最後は主音へ（コードが主音を含む場合）。06「句末・長音で意味を止める」 */
      const fin = sec.lines[sec.lines.length - 1].notes.slice(-1)[0];
      if (fin && sec.type === 'chorus') {
        const ch = chordAt(sec.chords[fin.bar], fin.pos);
        if (ch.pcs.includes(root)) { let b = null; for (let d = 0; d <= 3 && b == null; d++) for (const s of [-1, 1]) { const x = fin.li + s * d; if (valid(x) && lad[x] % 12 === root) { b = x; break; } } if (b != null) fin.li = b; }
      }
      sections.push(sec);
    });

    p0 = 0;
    const toTonic = (li) => { for (let d = 0; d < 8; d++) for (const s of [-1, 1]) if (valid(li + s * d) && lad[li + s * d] % 12 === root) return li + s * d; return li; };
    inst('outro', 'Outro', [tonicP.bars[0], tonicP.bars[0]], motifNotes(0, toTonic));

    /* --- 曲全体の時間軸へ --- */
    const melody = [], chords = [];
    let bar = 0;
    sections.forEach((sec, si) => {
      sec.bar0 = bar;
      sec.chords.forEach((b, bi) => b.forEach((c, ci) => chords.push({ t: (bar + bi) * 4 + (ci * 4) / b.length, d: 4 / b.length, chord: c, sec: si })));
      sec.lines.forEach((line) => line.notes.forEach((n) => {
        n.midi = lad[n.li];
        n.name = PF.midiName(n.midi, flats);
        n.t = (bar + n.bar) * 4 + n.pos / 2;
        n.dur = n.d / 2;
        melody.push(n);
      }));
      bar += sec.nBars;
    });
    return {
      key: PF.pcName(root, flats), rootPc: root, scale, scaleId: o.scaleId, flats, roles,
      motif: M.map((li) => lad[li]), motifNames: M.map((li) => PF.midiName(lad[li], flats)), rhythm: R,
      progs: { chorus: chorusP, verse: verseP, pre: preP, bridge: bridgeP },
      sections, melody, chords, totalBars: bar, totalBeats: bar * 4,
    };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
