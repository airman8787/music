/* 音名・スケール・コード記号の解釈 */
(function (g) {
  const PF = (g.PF = g.PF || {});
  const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const ROMAN = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };

  PF.pcName = (pc, flats) => (flats ? FLAT : SHARP)[((pc % 12) + 12) % 12];
  PF.midiName = (m, flats) => PF.pcName(m, flats) + (Math.floor(m / 12) - 1);
  PF.midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  PF.useFlats = function (rootPc, scale) {
    const set = scale.family === 'maj' ? [5, 10, 3, 8, 1, 6] : [2, 7, 0, 5, 10, 3];
    return set.includes(rootPc);
  };

  /* スケール上の全MIDI音（昇順） */
  PF.ladder = function (rootPc, iv) {
    const out = [];
    for (let m = 24; m <= 108; m++) if (iv.includes((m - rootPc + 120) % 12)) out.push(m);
    return out;
  };

  /* パッド配置：主音の少し下から、歌いやすい音域に並べる */
  PF.padLayout = function (rootPc, scale) {
    const rootMidi = rootPc <= 4 ? 60 + rootPc : 48 + rootPc;
    const lad = PF.ladder(rootPc, scale.iv);
    const start = lad.findIndex((m) => m >= rootMidi - 5);
    const count = scale.iv.length >= 7 ? 16 : 12;
    return { rootMidi, start, pads: lad.slice(start, start + count), ladder: lad };
  };

  /* ローマ数字コード（例 bVII, ii7, Imaj9, I5, Vsus4）→ 実音 */
  PF.parseChord = function (sym, rootPc, flats) {
    const m = /^([b#]?)(VII|VI|IV|V|III|II|I)(.*)$/i.exec(sym.trim());
    if (!m) throw new Error('コード記号を解釈できません: ' + sym);
    const minor = m[2] === m[2].toLowerCase();
    const acc = m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0;
    const root = (rootPc + ROMAN[m[2].toUpperCase()] + acc + 12) % 12;
    const suf = m[3];
    const tri = minor ? [0, 3, 7] : [0, 4, 7];
    const table = {
      '': tri, 5: [0, 7], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6],
      add9: tri.concat(14), 6: tri.concat(9), 7: tri.concat(10), maj7: tri.concat(11),
      9: tri.concat(10, 14), maj9: tri.concat(11, 14), 11: tri.concat(10, 17),
      13: [0, tri[1], 10, 14, 21],
    };
    const iv = table[suf];
    if (!iv) throw new Error('未対応のコード種別: ' + sym);
    const plain = ['5', 'sus2', 'sus4', 'dim'].includes(suf);
    const name = PF.pcName(root, flats || acc < 0) + (minor && !plain ? 'm' : '') + suf;
    return { sym, name, root, iv, minor, pcs: [...new Set(iv.map((i) => (root + i) % 12))] };
  };

  /* "I-V-vi-IV" / "I-III7-vi-IV,iv"（カンマ＝1小節を2分割） */
  PF.parseProg = function (str, rootPc, flats) {
    return {
      str,
      bars: str.split('-').map((b) => b.split(',').map((c) => PF.parseChord(c, rootPc, flats))),
    };
  };

  PF.progNames = (prog) => prog.bars.map((b) => b.map((c) => c.name).join(' ')).join(' | ');

  PF.mulberry32 = function (a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
