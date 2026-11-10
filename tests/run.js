/* node tests/run.js — 生成ロジックの整合性チェック */
const path = require('path');
['theory', 'data', 'lyrics', 'generator', 'arrange', 'export'].forEach((f) => require(path.join('..', 'js', f + '.js')));
const PF = globalThis.PF;
let fails = 0, checks = 0;
const ok = (c, msg) => { checks++; if (!c) { fails++; if (fails < 30) console.error('NG:', msg); } };

// 歌詞
const u = PF.lineUnits('きょうは雨 I love you');
ok(u.map((x) => x.n).join() === '1,1,1,2,1,1,1', 'モーラ/音節: ' + JSON.stringify(u));
const secs = PF.parseLyrics('[Verse]\nまだここにいる\n\n[サビ]\nひかりのほうへ\nあるいていく');
ok(secs.length === 2 && secs[0].type === 'verse' && secs[1].type === 'chorus' && secs[1].lines[0].count === 7, 'セクション解析');
ok(PF.parseLyrics('あ\n\nい\n\nう').map((s) => s.type).join() === 'verse,pre,chorus', '自動割当');
ok(PF.noteLabels(PF.lineUnits('夢の中'), 3).length === 3, '音数補正');

// 進行はすべて解釈できる
Object.values(PF.SCALES).forEach((s) => s.progs.concat(s.tonic).forEach((p) => PF.parseProg(p, 0)));
PF.GENRES.forEach((ge) => { ge.progs.forEach((p) => PF.parseProg(p, 0)); ok(PF.GROOVES[ge.groove], 'groove ' + ge.groove); ge.scales.forEach((s) => ok(PF.SCALES[s], 'scale ' + s)); });
ok(PF.parseChord('bVII13', 0).name === 'Bb13' && PF.parseChord('vi9', 0).name === 'Am9' && PF.parseChord('ii7', 2, false).name === 'Em7', 'コード名');

// リズムセルは常に1小節ぶん
Object.values(PF.METERS).forEach((mt) => {
  mt.rhythms.forEach((d) => { ok(d.length === 4 && d.reduce((s, x) => s + x, 0) === mt.e, 'rhythm ' + mt.name); for (let k = 1; k <= mt.e; k++) { const c = PF._cellsFor(d, k); ok(c.length === k && c.reduce((s, x) => s + x.d, 0) === mt.e, `cells ${mt.name} k=${k}`); } });
  if (mt.groove) Object.entries(mt.groove).forEach(([k, v]) => typeof v === 'string' && ok(v.length % (mt.e * 2) === 0, `groove ${mt.name}.${k}`));
});
Object.entries(PF.GROOVES).forEach(([id, gv]) => Object.entries(gv).forEach(([k, v]) => typeof v === 'string' && ok(v.length % 16 === 0, `groove ${id}.${k}`)));
const METERS = Object.keys(PF.METERS);

const lyric = PF.parseLyrics('[Verse]\nまちのあかりがにじんで\nきみのこえをさがしてた\n[Pre]\nもうすこしだけ\nこのままで\n[Chorus]\nひかりのほうへ\nあるいていくよ\nひかりのほうへ\nまだおわらない\n[Bridge]\nI will find you in the morning light');
let n = 0;
PF.GENRES.forEach((ge) => ge.scales.forEach((sid) => {
  for (let root = 0; root < 12; root += 5) for (let seed = 1; seed <= 3; seed++) {
    const scale = PF.SCALES[sid], lay = PF.padLayout(root, scale);
    const rnd = PF.mulberry32(seed * 97 + root);
    const motif = [0, 0, 0, 0].map(() => Math.floor(rnd() * lay.pads.length));
    const mid0 = METERS[n % METERS.length], rh = PF.METERS[mid0].rhythms[seed % 5];
    const song = PF.generate({ sections: seed === 3 ? null : lyric, genreIds: [ge.id, PF.GENRES[(n * 7) % PF.GENRES.length].id], scaleId: sid, rootPc: root, motif, rhythm: rh, meter: mid0, seed, density: [8, 12, 16][seed % 3] });
    n++;
    const tag = `${ge.id}/${sid}/${root}/${seed}/${mid0}`;
    ok(song.totalBeats === song.totalBars * PF.METERS[mid0].e / 2 && song.melody.every((m) => m.pos + m.d <= PF.METERS[mid0].e), tag + ' 小節長');
    const pcs = scale.iv.map((i) => (i + root) % 12);
    ok(song.melody.every((m) => pcs.includes(m.midi % 12)), tag + ' スケール外の音');
    ok(song.melody.every((m) => m.midi >= 40 && m.midi <= 96), tag + ' 音域');
    let end = -1, over = false;
    song.melody.forEach((m) => { if (m.t < end - 1e-9) over = true; end = m.t + m.dur; });
    ok(!over, tag + ' 音の重なり');
    ok(end <= song.totalBeats + 1e-9, tag + ' 曲尺');
    // サビ1行目の頭はモチーフそのもの
    const ch = song.sections.find((s) => s.type === 'chorus');
    const first = ch.lines[0].notes.filter((x) => x.bar === 0 && x.exact);
    ok(first.length && first[0].midi === song.motif[0], tag + ' サビ頭=モチーフ');
    if (seed !== 3) song.sections.forEach((s) => s.lines.forEach((l) => l.text && ok(l.notes.length === l.count, tag + ` 音数 ${l.notes.length}/${l.count}`)));
    const ev = PF.arrange(song);
    ok(ev.lead.length === song.melody.length && ev.bass.length > 0 && ev.chord.length > 0, tag + ' arrange');
    ok(Object.values(ev).flat().every((e) => e.t >= 0 && e.t < song.totalBeats && !Number.isNaN(e.t)), tag + ' イベント時刻');
    const mid = PF.toMidi(song, ev, 120);
    ok(mid[0] === 0x4d && mid.length > 200, tag + ' midi');
    const su = PF.toSuno(song, 120);
    ok(su.style.length <= 1000 && su.lyrics.length <= 5000, tag + ' Suno字数');
    PF.toText(song, 120);
  }
}));
// 資料07の作例がCメジャー/Aマイナーで引ける
ok(PF.fittingPresets(0, PF.SCALES.ionian).some((p) => p.name === '期待'), 'preset 期待');
ok(PF.fittingPresets(9, PF.SCALES.aeolian).some((p) => p.name === '片思い'), 'preset 片思い');
console.log(`${n} 曲生成 / ${checks} checks / ${fails} failed`);
process.exit(fails ? 1 : 0);
