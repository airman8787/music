/* 画面の状態管理と描画 */
(function () {
  const PF = window.PF, $ = (id) => document.getElementById(id);
  const KEY = 'yon-on-phraser-v1';
  const SAMPLE = '[Verse]\nまちのあかりがにじんで\nきみのこえをさがしてた\n\n[Pre]\nもうすこしだけ\nこのままで\n\n[Chorus]\nひかりのほうへ\nあるいていくよ\nひかりのほうへ\nまだおわらない';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const S = Object.assign({
    lyrics: '', overrides: {}, density: 12, genres: ['pop'], scaleId: 'ionian', root: 0,
    motif: [null, null, null, null], rhythm: 0, bpm: 104, bpmAuto: true, seed: 1, loop: true,
    mutes: { lead: false, chord: false, bass: false, drums: false },
  }, load());
  let cursor = S.motif.indexOf(null), song = null, events = null, systems = [], lastSys = null;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 保存できなくても動作は続ける */ } }
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 1800); }

  const scale = () => PF.SCALES[S.scaleId];
  const layout = () => PF.padLayout(S.root, scale());
  const roles = () => PF.roles(S.genres);
  const flats = () => PF.useFlats(S.root, scale());
  const sound = () => { const r = roles(); return { lead: r.color.lead, keys: r.color.keys, bass: r.drive.bass, kit: r.drive.kit }; };
  const full = () => S.motif.every((x) => x != null);

  /* ---------- 1 歌詞 ---------- */
  function renderCounts() {
    const secs = PF.parseLyrics(S.lyrics, S.overrides);
    const lines = secs.flatMap((s) => s.lines.map((l) => ({ s, l })));
    $('count-sum').textContent = lines.length;
    $('count-list').innerHTML = lines.map(({ s, l }, i) =>
      `<li><span class="ty">${esc(s.label)}</span><span class="tx">${esc(l.text)}</span>
       <button class="ghost mini" data-adj="-1" data-i="${i}" aria-label="音数を減らす">−</button>
       <span class="n ${l.count !== l.auto ? 'mod' : ''}">${l.count}</span>
       <button class="ghost mini" data-adj="1" data-i="${i}" aria-label="音数を増やす">＋</button></li>`).join('');
    $('count-list').onclick = (e) => {
      const b = e.target.closest('[data-adj]'); if (!b) return;
      const { l } = lines[+b.dataset.i], n = Math.max(1, Math.min(48, l.count + +b.dataset.adj));
      if (n === l.auto) delete S.overrides[l.text]; else S.overrides[l.text] = n;
      renderCounts(); update();
    };
    return secs;
  }

  /* ---------- 2 ジャンル ---------- */
  function renderGenres() {
    const cats = [...new Set(PF.GENRES.map((x) => x.cat))];
    const ROLE = ['主語', '動力', '色'];
    $('genres').innerHTML = cats.map((c) => `<div class="cat">${c}</div><div class="chips">` + PF.GENRES.filter((x) => x.cat === c).map((x) => {
      const i = S.genres.indexOf(x.id);
      const badge = i < 0 ? '' : `<span class="badge r${Math.min(i, 3)}">${ROLE[i] || '＋'}</span>`;
      return `<button class="chip ${i >= 0 ? 'on' : ''}" data-g="${x.id}" aria-pressed="${i >= 0}" title="BPM ${x.bpm[0]}–${x.bpm[1]}">${esc(x.name)}${badge}</button>`;
    }).join('') + '</div>').join('');
  }
  function onGenre(id) {
    const i = S.genres.indexOf(id);
    if (i >= 0) S.genres.splice(i, 1); else S.genres.push(id);
    const opts = PF.scaleOptions(S.genres);
    if (!opts.some((o) => o.id === S.scaleId)) setScale(opts[0].id);
    if (S.bpmAuto) S.bpm = roles().drive.def;
    renderGenres(); renderScales(); renderPads(); renderBpm(); update();
  }

  /* ---------- 3 スケールとキー ---------- */
  function renderScales() {
    $('root').innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((pc) => {
      const a = PF.pcName(pc, false), b = PF.pcName(pc, true);
      return `<option value="${pc}" ${pc === S.root ? 'selected' : ''}>${a === b ? a : a + ' / ' + b}</option>`;
    }).join('');
    const opts = PF.scaleOptions(S.genres);
    $('scales').innerHTML = opts.map((o, i) => {
      const sc = PF.SCALES[o.id];
      return `<button class="scale ${o.id === S.scaleId ? 'on' : ''}" data-s="${o.id}" aria-pressed="${o.id === S.scaleId}">
        <b>${esc(sc.name)}${i === 0 && S.genres.length ? '<span class="rec">おすすめ</span>' : ''}</b>
        <span class="deg">${sc.en}　${sc.deg}</span><span>${esc(sc.note)}</span></button>`;
    }).join('');
  }
  /* スケールを替えても、モチーフはいちばん近い高さのパッドへ移す */
  function setScale(id) {
    const old = layout().pads, was = S.motif.map((p) => (p == null ? null : old[p]));
    S.scaleId = id;
    const now = layout().pads;
    S.motif = was.map((m) => (m == null ? null : now.reduce((b, x, i) => (Math.abs(x - m) < Math.abs(now[b] - m) ? i : b), 0)));
  }

  /* ---------- 4 モチーフ ---------- */
  function renderPads() {
    const lay = layout(), sc = scale(), fl = flats();
    const rows = [];
    for (let i = 0; i < lay.pads.length; i += 4) rows.unshift(lay.pads.slice(i, i + 4).map((m, k) => ({ m, i: i + k })));
    $('pads').innerHTML = rows.flat().map(({ m, i }) => {
      const deg = sc.iv.indexOf((m - S.root + 120) % 12);
      return `<button class="pad ${deg === 0 ? 'root' : ''} ${S.motif.includes(i) ? 'used' : ''}" data-p="${i}" style="--h:${Math.round((deg * 360) / sc.iv.length + 20)}">
        ${PF.midiName(m, fl)}<small>${sc.deg.split(' ')[deg]}</small></button>`;
    }).join('');
    $('slots').innerHTML = S.motif.map((p, i) => `<button class="slot ${p != null ? 'full' : ''} ${i === cursor ? 'cur' : ''}" data-slot="${i}">
      <span>${p != null ? PF.midiName(lay.pads[p], fl) : '–'}<small>${i + 1}音目</small></span></button>`).join('');
    $('motif-hint').textContent = full() && cursor < 0 ? '4音そろいました。入れ替えたい枠をタップしてからパッドを叩くと差し替えられます。'
      : `${(cursor < 0 ? 0 : cursor) + 1}音目のパッドを叩いてください（明るい縁取りのパッドが主音）。`;
    const ps = PF.fittingPresets(S.root, sc);
    $('preset').innerHTML = `<option value="">感情から選ぶ（${ps.length}例）</option>` + ps.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('');
    $('preset').onchange = (e) => {
      const p = ps[+e.target.value]; if (!p || e.target.value === '') return;
      S.motif = p.pads.slice(); S.rhythm = p.r; cursor = -1;
      renderPads(); renderRhythms(); update(); playMotif();
    };
    $('motif-play').disabled = !full();
  }
  function hitPad(i, el) {
    PF.audio.note(layout().pads[i], 0.35, sound().lead);
    el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 120);
    if (cursor < 0) return;
    S.motif[cursor] = i;
    cursor = S.motif.indexOf(null);
    renderPads(); update();
  }
  function renderRhythms() {
    $('rhythms').innerHTML = PF.RHYTHMS.map((r, i) => `<button class="chip rh ${i === S.rhythm ? 'on' : ''}" data-r="${i}" aria-pressed="${i === S.rhythm}">
      <i>${r.d.map((d) => `<u style="width:${d * 7}px"></u>`).join('')}</i>${r.name}</button>`).join('');
  }
  function playMotif() {
    if (!full()) return;
    const lay = layout();
    PF.audio.phrase(S.motif.map((p) => lay.pads[p]), PF.RHYTHMS[S.rhythm].d, S.bpm, sound().lead);
  }

  /* ---------- BPM ---------- */
  function renderBpm() {
    const d = roles().drive;
    $('bpm').value = S.bpm; $('bpm-num').value = S.bpm;
    $('bpm-range').textContent = `${d.name} ${d.bpm[0]}–${d.bpm[1]}`;
  }
  function setBpm(v, manual) {
    v = Math.max(50, Math.min(220, Math.round(+v) || S.bpm));
    S.bpm = v; if (manual) S.bpmAuto = false;
    renderBpm(); PF.audio.setBpm(v);
    if (song) renderSummary(), renderSuno();
    save();
  }

  /* ---------- 5 結果 ---------- */
  function update() {
    save();
    const secs = PF.parseLyrics(S.lyrics, S.overrides);
    const was = PF.audio.isPlaying(), pos = PF.audio.position();
    if (!full()) { song = null; stop(); $('result').hidden = true; $('empty').hidden = false; $('play').disabled = true; return; }
    song = PF.generate({ sections: secs, genreIds: S.genres, scaleId: S.scaleId, rootPc: S.root, motif: S.motif, rhythm: PF.RHYTHMS[S.rhythm].d, seed: S.seed, density: S.density });
    events = PF.arrange(song);
    $('result').hidden = false; $('empty').hidden = true; $('play').disabled = false;
    renderSummary(); renderScore(); renderSuno();
    if (was) start(pos < song.totalBeats ? Math.floor(pos / 4) * 4 : 0);
  }
  function renderSummary() {
    const r = song.roles;
    const role = r.all.length > 1 ? `<span><span class="role r0">主語</span>${esc(r.subject.name)}</span><span><span class="role r1">動力</span>${esc(r.drive.name)}</span><span><span class="role r2">色</span>${esc(r.color.name)}</span>` : `<span>${esc(r.subject.name)}</span>`;
    $('summary').innerHTML = `<span><b>${song.key} ${esc(song.scale.name)}</b></span><span><b>${S.bpm}</b> BPM</span><span>${song.totalBars}小節</span>
      <span>モチーフ <b>${song.motifNames.join(' – ')}</b></span>${role}`;
  }
  function renderScore() {
    const box = $('score'), W = Math.max(280, box.clientWidth || 600), per = W >= 640 ? 4 : 2;
    const ms = song.melody.map((n) => n.midi), lo = Math.min(...ms) - 1, hi = Math.max(...ms) + 1;
    const RH = 6, TOP = 22, NH = (hi - lo + 1) * RH, H = TOP + NH + 22, bw = W / per;
    const y = (m) => TOP + (hi - m) * RH;
    systems = [];
    let html = '';
    song.sections.forEach((sec) => {
      html += `<div class="sec"><h4>${esc(sec.label)}<span>${esc(sec.chords.slice(0, 8).map((b) => b.map((c) => c.name).join(' ')).join(' | '))}${sec.chords.length > 8 ? ' …' : ''}</span></h4>`;
      const notes = sec.lines.flatMap((l) => l.notes);
      for (let b0 = 0; b0 < sec.nBars; b0 += per) {
        const n = Math.min(per, sec.nBars - b0);
        let g = '';
        for (let m = lo; m <= hi; m++) if (m % 12 === song.rootPc) g += `<line class="tonic" x1="0" x2="${n * bw}" y1="${y(m) + RH / 2}" y2="${y(m) + RH / 2}"/>`;
        for (let b = 0; b < n; b++) {
          const x = b * bw;
          for (let q = 1; q < 4; q++) g += `<line class="beat" x1="${x + (q * bw) / 4}" x2="${x + (q * bw) / 4}" y1="${TOP}" y2="${TOP + NH}"/>`;
          if (b) g += `<line class="bar" x1="${x}" x2="${x}" y1="4" y2="${H - 4}"/>`;
          sec.chords[b0 + b].forEach((c, ci, arr) => (g += `<text class="chord" x="${x + (ci * bw) / arr.length + 6}" y="15">${esc(c.name)}</text>`));
        }
        notes.filter((nn) => nn.bar >= b0 && nn.bar < b0 + n).forEach((nn) => {
          const x = (nn.bar - b0) * bw + (nn.pos / 8) * bw;
          g += `<rect class="note ${nn.motif ? 'motif' : ''}" x="${(x + 1).toFixed(1)}" y="${y(nn.midi)}" width="${Math.max(3, (nn.d / 8) * bw - 2).toFixed(1)}" height="${RH}" rx="2"><title>${nn.name}</title></rect>`;
          if (nn.lyric) g += `<text class="lyr" x="${(x + 2).toFixed(1)}" y="${H - 7}">${esc(nn.lyric)}</text>`;
        });
        g += `<line class="ph" x1="0" x2="0" y1="2" y2="${H - 2}" visibility="hidden"/>`;
        html += `<svg class="sys" data-bar="${sec.bar0 + b0}" viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="${esc(sec.label)} ${b0 + 1}小節目から">${g}</svg>`;
        systems.push({ bar0: sec.bar0 + b0, n, bw });
      }
      html += '</div>';
    });
    box.innerHTML = html;
    box.querySelectorAll('.sys').forEach((el, i) => (systems[i].el = el, systems[i].ph = el.querySelector('.ph')));
    lastSys = null;
  }
  function renderSuno() {
    const t = PF.toSuno(song, S.bpm);
    $('suno-style').value = t.style; $('suno-lyrics').value = t.lyrics;
    const cnt = (id, n, max) => { $(id).textContent = `${n} / ${max}字`; $(id).classList.toggle('over', n > max); };
    cnt('style-n', t.style.length, 1000); cnt('lyrics-n', t.lyrics.length, 5000);
  }

  /* ---------- 再生 ---------- */
  function start(from) {
    if (!song) return;
    const ok = PF.audio.play(events, { bpm: S.bpm, total: song.totalBeats, loop: S.loop, from: from || 0, sound: sound(), onEnd: () => setPlayUi(false) });
    if (!ok) return toast('このブラウザでは音を鳴らせません');
    setPlayUi(true); requestAnimationFrame(frame);
  }
  function stop() { PF.audio.stop(); setPlayUi(false); }
  function setPlayUi(on) {
    $('play').textContent = on ? '■' : '▶'; $('play').setAttribute('aria-label', on ? '停止' : '再生');
    if (!on && lastSys) { lastSys.ph.setAttribute('visibility', 'hidden'); lastSys = null; }
  }
  function frame() {
    const pos = PF.audio.position();
    if (pos < 0) return;
    const bar = pos / 4, sys = systems.find((s) => bar >= s.bar0 && bar < s.bar0 + s.n);
    if (sys !== lastSys) {
      if (lastSys) lastSys.ph.setAttribute('visibility', 'hidden');
      if (sys) { sys.ph.setAttribute('visibility', 'visible'); sys.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      lastSys = sys;
    }
    if (sys) { const x = (bar - sys.bar0) * sys.bw; sys.ph.setAttribute('x1', x); sys.ph.setAttribute('x2', x); }
    requestAnimationFrame(frame);
  }

  function copy(text, label) {
    const done = () => toast(label + 'をコピーしました');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => toast('コピーできませんでした'));
    else { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
  }

  /* ---------- イベント ---------- */
  function init() {
    if (!PF.SCALES[S.scaleId]) S.scaleId = 'ionian';
    S.genres = S.genres.filter((id) => PF.GENRE[id]);
    S.motif = S.motif.map((p) => (p != null && p < layout().pads.length ? p : null));
    cursor = S.motif.indexOf(null);
    $('lyrics').value = S.lyrics; $('density').value = S.density;
    renderGenres(); renderScales(); renderPads(); renderRhythms(); renderBpm(); renderCounts();
    $('mutes').innerHTML = [['lead', 'メロ'], ['chord', 'コード'], ['bass', 'ベース'], ['drums', 'ドラム']].map(([k, n]) =>
      `<button class="ghost mini toggle ${S.mutes[k] ? '' : 'on'}" data-mute="${k}" aria-pressed="${!S.mutes[k]}">${n}</button>`).join('');
    Object.keys(S.mutes).forEach((k) => PF.audio.setMute(k, S.mutes[k]));
    $('loop').classList.toggle('on', S.loop);

    let ty;
    $('lyrics').addEventListener('input', (e) => { S.lyrics = e.target.value; clearTimeout(ty); ty = setTimeout(() => { renderCounts(); update(); }, 350); });
    $('sample').onclick = () => { S.lyrics = $('lyrics').value = SAMPLE; renderCounts(); update(); };
    $('density').onchange = (e) => { S.density = +e.target.value; update(); };
    $('genres').onclick = (e) => { const b = e.target.closest('[data-g]'); if (b) onGenre(b.dataset.g); };
    $('root').onchange = (e) => { S.root = +e.target.value; renderPads(); update(); };
    $('scales').onclick = (e) => { const b = e.target.closest('[data-s]'); if (!b) return; setScale(b.dataset.s); renderScales(); renderPads(); update(); };
    $('pads').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-p]'); if (b) { e.preventDefault(); hitPad(+b.dataset.p, b); } });
    $('pads').addEventListener('keydown', (e) => { const b = e.target.closest('[data-p]'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); hitPad(+b.dataset.p, b); } });
    $('slots').onclick = (e) => { const b = e.target.closest('[data-slot]'); if (!b) return; const i = +b.dataset.slot; cursor = cursor === i && full() ? -1 : i; renderPads(); };
    $('motif-clear').onclick = () => { S.motif = [null, null, null, null]; cursor = 0; renderPads(); update(); };
    $('motif-play').onclick = playMotif;
    $('rhythms').onclick = (e) => { const b = e.target.closest('[data-r]'); if (!b) return; S.rhythm = +b.dataset.r; renderRhythms(); update(); playMotif(); };

    $('play').onclick = () => (PF.audio.isPlaying() ? stop() : start(0));
    $('loop').onclick = () => { S.loop = !S.loop; $('loop').classList.toggle('on', S.loop); $('loop').setAttribute('aria-pressed', S.loop); PF.audio.setLoop(S.loop); save(); };
    $('bpm').oninput = (e) => setBpm(e.target.value, true);
    $('bpm-num').onchange = (e) => setBpm(e.target.value, true);
    $('bpm-down').onclick = () => setBpm(S.bpm - 1, true);
    $('bpm-up').onclick = () => setBpm(S.bpm + 1, true);
    $('reroll').onclick = () => { if (!full()) return toast('先にパッドで4音を選んでください'); S.seed = (S.seed % 9999) + 1; update(); toast('別案 #' + S.seed); };
    $('mutes').onclick = (e) => { const b = e.target.closest('[data-mute]'); if (!b) return; const k = b.dataset.mute; S.mutes[k] = !S.mutes[k]; b.classList.toggle('on', !S.mutes[k]); b.setAttribute('aria-pressed', !S.mutes[k]); PF.audio.setMute(k, S.mutes[k]); save(); };
    $('score').onclick = (e) => { const s = e.target.closest('.sys'); if (s) start(+s.dataset.bar * 4); };
    $('dl-midi').onclick = () => {
      const blob = new Blob([PF.toMidi(song, events, S.bpm)], { type: 'audio/midi' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `phrase_${song.key}_${song.scaleId}_${S.bpm}bpm.mid`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    $('copy-text').onclick = () => copy(PF.toText(song, S.bpm), '譜面テキスト');
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-copy]'); if (b) { e.preventDefault(); copy($(b.dataset.copy).value, b.dataset.copy === 'suno-style' ? 'Style' : 'Lyrics'); } });
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => song && renderScore(), 200); });
    update();
  }
  init();
})();
