/* 書き出し：標準MIDIファイル／譜面テキスト／Suno用テキスト */
(function (g) {
  const PF = (g.PF = g.PF || {});
  const PPQ = 480;

  function vlq(n) {
    const out = [n & 0x7f];
    while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
    return out;
  }
  const str = (s) => Array.from(new TextEncoder().encode(s));
  const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  function track(events) {
    events.sort((a, b) => a.tick - b.tick || a.ord - b.ord);
    const bytes = [];
    let last = 0;
    events.forEach((e) => { bytes.push(...vlq(e.tick - last), ...e.data); last = e.tick; });
    bytes.push(0, 0xff, 0x2f, 0);
    return [...str('MTrk'), ...u32(bytes.length), ...bytes];
  }
  const tk = (beats) => Math.max(0, Math.round(beats * PPQ));
  const meta = (type, text) => { const b = str(text); return [0xff, type, ...vlq(b.length), ...b]; };

  PF.toMidi = function (song, ev, bpm) {
    const us = Math.round(60000000 / bpm);
    const tracks = [track([
      { tick: 0, ord: 0, data: [0xff, 0x51, 3, (us >> 16) & 255, (us >> 8) & 255, us & 255] },
      { tick: 0, ord: 0, data: [0xff, 0x58, 4, 4, 2, 24, 8] },
    ])];
    const mk = (name, ch, program, notes) => {
      const es = [{ tick: 0, ord: 0, data: meta(3, name) }];
      if (program != null) es.push({ tick: 0, ord: 0, data: [0xc0 | ch, program] });
      notes.forEach((n) => {
        const a = tk(n.t), b = Math.max(a + 1, tk(n.t + n.d));
        if (n.lyric && n.lyric !== '–') es.push({ tick: a, ord: 1, data: meta(5, n.lyric) });
        es.push({ tick: a, ord: 2, data: [0x90 | ch, n.midi, Math.round(n.vel * 110)] });
        es.push({ tick: b, ord: 0, data: [0x80 | ch, n.midi, 0] });
      });
      tracks.push(track(es));
    };
    mk('Melody', 0, 80, ev.lead);
    mk('Chords', 1, 4, ev.chord.flatMap((c) => c.notes.map((m) => ({ t: c.t, d: c.d, midi: m, vel: c.vel }))));
    mk('Bass', 2, 33, ev.bass);
    const DR = { kick: 36, snare: 38, hat: 42, ohat: 46, perc: 37 };
    mk('Drums', 9, null, ev.drums.map((d) => ({ t: d.t, d: 0.1, midi: DR[d.kind], vel: d.vel })));
    return new Uint8Array([...str('MThd'), ...u32(6), 0, 1, 0, tracks.length, PPQ >> 8, PPQ & 255, ...tracks.flat()]);
  };

  const beats = (d) => String(d / 2);

  /* 資料05の表記：「E4(1)」＝四分音符1拍、「|」は小節線 */
  PF.toText = function (song, bpm) {
    const L = [`Key: ${song.key} ${song.scale.name}（${song.scale.en}） / BPM ${bpm} / 4/4`,
      `モチーフ: ${song.motifNames.map((n, i) => `${n}(${beats(song.rhythm[i])})`).join(' ')}`, ''];
    song.sections.forEach((sec) => {
      L.push(`[${sec.label}]  ${sec.chords.map((b) => b.map((c) => c.name).join(' ')).join(' | ')}`);
      sec.lines.forEach((line) => {
        if (line.text) L.push(line.text);
        const bars = [];
        for (let b = 0; b < line.nBars; b++) {
          const ns = line.notes.filter((n) => n.bar === line.bar0 + b);
          let pos = 0; const parts = [];
          ns.forEach((n) => { if (n.pos > pos) parts.push(`休(${beats(n.pos - pos)})`); parts.push(`${n.name}(${beats(n.d)})`); pos = n.pos + n.d; });
          if (pos < 8) parts.push(`休(${beats(8 - pos)})`);
          bars.push(parts.join(' '));
        }
        L.push('  ' + bars.join(' | '));
      });
      L.push('');
    });
    return L.join('\n');
  };

  /* 資料02・06・07の運用：Style＝編成と音像、Lyricsの角括弧＝区間ごとの役割、本文＝歌う言葉のみ。
     音名の再現は生成ごとに耳で確認する（保証はされない）。 */
  const DUR = { 1: 'eighth', 2: 'quarter', 3: 'dotted quarter', 4: 'half', 5: 'half tied to an eighth', 6: 'dotted half', 8: 'whole' };
  PF.toSuno = function (song, bpm) {
    const r = song.roles;
    const mode = song.scale.en + (song.scale.family === 'maj' ? ' (major-type)' : ' (minor-type)');
    let style = r.subject.suno;
    if (r.drive !== r.subject) style += `, driven by a ${r.drive.name} groove`;
    if (r.color !== r.subject && r.color !== r.drive) style += `, colored with ${r.color.name} timbres`;
    style += `, ${bpm} BPM, 4/4, key of ${song.key} ${mode}, built around one recurring four-note motif`;
    const motif = song.motifNames.join('–');
    const rhythm = song.rhythm.map((d) => DUR[d] || d / 2 + ' beats').join('–');
    const ch = (sec) => sec.chords.slice(0, 8).map((b) => b.map((c) => c.name).join(' ')).join(' | ');
    const hint = {
      intro: () => `four-note motif ${motif}, rhythm ${rhythm}, played by a single lead instrument`,
      verse: (s) => `conversational vocal in a lower register; only the first two motif notes are hinted; chords ${ch(s)}`,
      pre: (s) => `phrases climb step by step using the motif shape; chords ${ch(s)}; the low end drops out just before the chorus`,
      chorus: (s) => `the vocal sings the four-note motif ${motif} in one breath on the first line; chords ${ch(s)}`,
      bridge: (s) => `the motif is inverted and answered backwards; chords ${ch(s)}`,
      outro: () => `the lead instrument restates the motif and lands on ${song.key}`,
    };
    const L = [];
    song.sections.forEach((sec) => {
      L.push(`[${sec.label}: ${hint[sec.type](sec)}]`);
      sec.lines.forEach((l) => l.text && L.push(l.text));
      L.push('');
    });
    return { style, lyrics: L.join('\n').trim() };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
