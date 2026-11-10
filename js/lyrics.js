/* 歌詞の解析：セクション分けと音数（モーラ／音節）の概算 */
(function (g) {
  const PF = (g.PF = g.PF || {});
  const SMALL = 'ぁぃぅぇぉゃゅょゎァィゥェォャュョヮ';
  const isKana = (c) => /[ぁ-ゖァ-ヺー]/.test(c);
  const isKanji = (c) => /[一-鿿々]/.test(c);

  function syllables(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    let n = (w.match(/[aeiouy]+/g) || []).length;
    if (n > 1 && /[^aeiouyl]e$/.test(w)) n--;
    return Math.max(1, n);
  }

  /* 1行 → [{t:表示文字, n:音数}]。漢字は読みが分からないので1字≒2モーラで概算する。 */
  PF.lineUnits = function (text) {
    const units = [];
    let i = 0;
    while (i < text.length) {
      const c = text[i];
      if (/[A-Za-z]/.test(c)) {
        const m = /^[A-Za-z']+/.exec(text.slice(i))[0];
        units.push({ t: m, n: syllables(m) });
        i += m.length;
      } else if (/[0-9０-９]/.test(c)) {
        units.push({ t: c, n: 2 }); i++;
      } else if (isKana(c)) {
        if (SMALL.includes(c) && units.length) units[units.length - 1].t += c;
        else units.push({ t: c, n: 1 });
        i++;
      } else if (isKanji(c)) {
        units.push({ t: c, n: 2 }); i++;
      } else i++;
    }
    return units;
  };

  /* 音符ごとのラベルに展開。count を指定すると（手動補正）その数に合わせて詰める／伸ばす。 */
  PF.noteLabels = function (units, count) {
    const base = [];
    units.forEach((u) => { base.push(u.t); for (let k = 1; k < u.n; k++) base.push('–'); });
    if (count == null || count === base.length) return base;
    if (count > base.length) return base.concat(Array(count - base.length).fill('–'));
    const out = [];
    for (let k = 0; k < count; k++) {
      const a = Math.floor((k * base.length) / count), b = Math.floor(((k + 1) * base.length) / count);
      out.push(base.slice(a, b).filter((s) => s !== '–').join('') || '–');
    }
    return out;
  };

  function tagType(tag) {
    const t = tag.toLowerCase();
    if (/pre|bメロ|ｂメロ|プレ/.test(t)) return 'pre';
    if (/chorus|サビ|hook|フック|refrain/.test(t)) return 'chorus';
    if (/bridge|cメロ|ｃメロ|ブリッジ|dメロ/.test(t)) return 'bridge';
    if (/verse|aメロ|ａメロ|ヴァース|バース/.test(t)) return 'verse';
    return null; // Intro/Outro/間奏などは歌詞セクションとして扱わない
  }

  /* overrides: { 行テキスト: 音数 } */
  PF.parseLyrics = function (text, overrides) {
    overrides = overrides || {};
    const blocks = [];
    let cur = null, tagged = false;
    const open = (type) => { cur = { type, lines: [] }; blocks.push(cur); };
    (text || '').split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      const tag = /^[\[【]\s*(.+?)\s*[\]】]$/.exec(line);
      if (tag) { tagged = true; const ty = tagType(tag[1]); cur = null; if (ty) open(ty); else cur = { skip: true, lines: [] }; return; }
      if (!line) { if (cur && !cur.type && !cur.skip) cur = null; return; }
      if (!cur) open(null);
      if (cur.skip) return;
      const units = PF.lineUnits(line);
      const auto = units.reduce((s, u) => s + u.n, 0);
      if (!auto) return;
      const count = Math.max(1, Math.min(48, overrides[line] || auto));
      cur.lines.push({ text: line, auto, count, labels: PF.noteLabels(units, count) });
    });
    const secs = blocks.filter((b) => b.lines.length);
    /* タグなし：空行で区切ったブロックに役割を自動で割り当てる */
    const untyped = secs.filter((s) => !s.type);
    if (untyped.length) {
      const n = untyped.length;
      const plan = n === 1 && !tagged ? ['chorus'] : n === 3 ? ['verse', 'pre', 'chorus'] : null;
      untyped.forEach((s, i) => { s.type = plan ? plan[i] : i % 2 ? 'chorus' : 'verse'; });
    }
    const NAME = { verse: 'Verse', pre: 'Pre-Chorus', chorus: 'Chorus', bridge: 'Bridge' };
    const total = {}, seen = {};
    secs.forEach((s) => (total[s.type] = (total[s.type] || 0) + 1));
    secs.forEach((s) => {
      seen[s.type] = (seen[s.type] || 0) + 1;
      s.label = NAME[s.type] + (total[s.type] > 1 ? ' ' + seen[s.type] : '');
    });
    return secs;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
