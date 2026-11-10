/* スケール・グルーヴ・ジャンル・モチーフ作例のデータ。
   数値・進行は「制作の出発点」であり、ジャンルの規格ではない（資料08の方針）。 */
(function (g) {
  const PF = (g.PF = g.PF || {});

  /* family: 主和音が長/短どちら寄りか。parent: コード進行の適合判定に使う7音集合。
     progs: そのスケールの特徴音が活きる進行（常に候補に入る）。 */
  PF.SCALES = {
    ionian: { name: 'メジャー', en: 'Ionian', deg: '1 2 3 4 5 6 7', note: '安定した明るさ。V→Iの導音が強い', iv: [0, 2, 4, 5, 7, 9, 11], family: 'maj', tonic: 'I', progs: ['I-V-vi-IV', 'I-vi-IV-V', 'IV-V-iii-vi'] },
    aeolian: { name: 'ナチュラルマイナー', en: 'Aeolian', deg: '1 2 b3 4 5 b6 b7', note: '素直な短調。pop・rock・hip-hop', iv: [0, 2, 3, 5, 7, 8, 10], family: 'min', tonic: 'i', progs: ['i-bVI-bIII-bVII', 'i-bVII-bVI-bVII', 'i-iv-bVII-bIII'] },
    dorian: { name: 'ドリアン', en: 'Dorian', deg: '1 2 b3 4 5 6 b7', note: '短調の中の自然6度。暗さを残して軽快', iv: [0, 2, 3, 5, 7, 9, 10], family: 'min', tonic: 'i', progs: ['i-IV-i-IV', 'i7-IV7-i7-IV7', 'i-bIII-bVII-IV'] },
    phrygian: { name: 'フリジアン', en: 'Phrygian', deg: '1 b2 b3 4 5 b6 b7', note: 'b2の狭い緊張。metal・drill', iv: [0, 1, 3, 5, 7, 8, 10], family: 'min', tonic: 'i', progs: ['i-bII-i-bII', 'i-bII-bIII-bII', 'i-bvii-bVI-bII'] },
    lydian: { name: 'リディアン', en: 'Lydian', deg: '1 2 3 #4 5 6 7', note: '#4の浮遊感。ambient・film', iv: [0, 2, 4, 6, 7, 9, 11], family: 'maj', tonic: 'I', progs: ['I-II-I-II', 'I-II-iii-II', 'Imaj7-II-vi-II'] },
    mixolydian: { name: 'ミクソリディアン', en: 'Mixolydian', deg: '1 2 3 4 5 6 b7', note: '長調で導音が弱い。rock・funk・folk', iv: [0, 2, 4, 5, 7, 9, 10], family: 'maj', tonic: 'I', progs: ['I-bVII-IV-I', 'I-bVII-IV-IV', 'I-v-IV-I'] },
    harmMinor: { name: 'ハーモニックマイナー', en: 'Harmonic minor', deg: '1 2 b3 4 5 b6 7', note: 'V→iが強まり増2度の色', iv: [0, 2, 3, 5, 7, 8, 11], family: 'min', tonic: 'i', progs: ['i-iv-V-i', 'i-bVI-iv-V', 'i-bVI-V-V'] },
    melMinor: { name: 'メロディックマイナー', en: 'Melodic minor', deg: '1 2 b3 4 5 6 7', note: '短3度＋明るい上半分。jazz・R&B', iv: [0, 2, 3, 5, 7, 9, 11], family: 'min', tonic: 'i', progs: ['i-IV-V-i', 'i-ii-V-i'] },
    majPent: { name: 'メジャーペンタ（ヨナ抜き長）', en: 'Major pentatonic', deg: '1 2 3 5 6', note: '開放的で歌いやすい5音', iv: [0, 2, 4, 7, 9], family: 'maj', tonic: 'I', parent: 'ionian', progs: ['I-V-vi-IV', 'I-IV-I-V', 'I-vi-IV-V'] },
    minPent: { name: 'マイナーペンタ', en: 'Minor pentatonic', deg: '1 b3 4 5 b7', note: 'rock・blues・rapで万能な5音', iv: [0, 3, 5, 7, 10], family: 'min', tonic: 'i', parent: 'aeolian', progs: ['i-bVII-bVI-bVII', 'i-bVI-bIII-bVII', 'i-iv-i-bVII'] },
    blues: { name: 'ブルース', en: 'Blues', deg: '1 b3 4 b5 5 b7', note: 'b3・b5は固定音より「揺れ」として使う', iv: [0, 3, 5, 6, 7, 10], family: 'min', tonic: 'I7', parent: 'aeolian', bluesy: true, progs: ['I7-IV7-I7-V7', 'I7-I7-IV7-I7', 'i7-iv7-i7-V7'] },
    phrygDom: { name: 'フリジアンドミナント', en: 'Phrygian dominant', deg: '1 b2 3 4 5 b6 b7', note: 'b2と長3度。metal・Latinの近似色', iv: [0, 1, 4, 5, 7, 8, 10], family: 'maj', tonic: 'I', progs: ['I-bII-I-bII', 'I-bII-bvii-I', 'I-iv-bII-I'] },
    yo: { name: '陽音階', en: 'Yo', deg: '1 2 4 5 6', note: '民謡系の5音（近似）。3度なしの開いた響き', iv: [0, 2, 5, 7, 9], family: 'min', tonic: 'I5', parent: 'dorian', progs: ['Isus2-IVsus2-Isus2-V5', 'I5-IV5-bVII5-I5', 'IVsus2-V5-Isus2-Isus2'] },
    in: { name: '陰音階（都節）', en: 'In', deg: '1 b2 4 5 b6', note: '箏・三味線系の5音（近似）。半音の陰り', iv: [0, 1, 5, 7, 8], family: 'min', tonic: 'I5', parent: 'phrygian', progs: ['i-bII-i-bvii', 'I5-bII-I5-bII', 'iv-bII-i-i'] },
    yonaMinor: { name: 'ヨナ抜き短音階', en: 'Yonanuki minor', deg: '1 2 b3 5 b6', note: '演歌・歌謡の5音', iv: [0, 2, 3, 7, 8], family: 'min', tonic: 'i', parent: 'aeolian', progs: ['i-iv-V-i', 'i-bVI-V-i', 'i-bVI-iv-V'] },
  };

  /* 16分×16ステップ。k=キック s=スネア h=ハット o=オープンハット p=パーカッション
     bass: r=根音 5=5度 8=オクターヴ -=伸ばす .=休み ／ comp: x=和音を弾く位置
     swing: 0.5=ストレート、unit: 2=16分で跳ねる 4=8分で跳ねる */
  PF.GROOVES = {
    pop: { k: 'x.....x.x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r-....r-r-....5-', comp: 'x.......x.....x.' },
    rock8: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r.r.r.r.r.r.r.r.', comp: 'x...x.x...x.x.x.' },
    punk: { k: 'x.....x.x.....x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r.r.r.r.r.r.r.r.', comp: 'x.x.x.x.x.x.x.x.' },
    metal: { k: 'x.xxx.xxx.xxx.xx', s: '....x.......x...', h: 'x...x...x...x...', bass: 'r.rrr.rrr.rrr.rr', comp: 'x.xxx.xxx.xxx.xx' },
    dance: { k: 'x.....x.x..x....', s: '....x.......x...', h: 'x.x.x.x.x.x.xxxx', bass: 'r-.r-.r-r-.r-.5-', comp: 'x..x..x...x..x..' },
    four: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..x...x...x...x.', bass: '..r...r...r...r.', comp: '..x..x....x..x..' },
    techno: { k: 'x...x...x...x...', s: '....x.......x...', o: '..x...x...x...x.', p: '...x..x...x..x..', bass: '.rrr.rrr.rrr.rrr', comp: '...x......x.....' },
    disco: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..x...x...x...x.', bass: 'r.8.r.8.r.8.r.8.', comp: '..x.x...x.x...x.' },
    trap: { k: 'x......x..x.....', s: '........x.......', h: 'x.x.x.x.x.xxx.x.', bass: 'r------r--r-----', comp: 'x...............' },
    drill: { k: 'x..x..x.....x...x..x......x.....', s: '........x.................x.....', h: 'x..x..x.x..x..x.', bass: 'r--r--r-----8---', comp: 'x.....x.........' },
    boombap: { k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r-----r...r-5-..', comp: 'x.........x.....', swing: 0.58, unit: 2 },
    rnb: { k: 'x......x..x.....', s: '....x.......x...', h: 'x.xxx.x.x.xxx.x.', bass: 'r------r..r---5.', comp: 'x......x........', swing: 0.56, unit: 2 },
    afro: { k: 'x..x...x..x.x...', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', p: '..x..x....x..x..', bass: 'r..r....5.r.....', comp: '..x..x..x..x..x.' },
    amapiano: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', bass: 'r..r..r...8.r...', comp: 'x.....x.....x...' },
    dembow: { k: 'x...x...x...x...', s: '...x..x....x..x.', h: 'x.x.x.x.x.x.x.x.', bass: 'r..r..r.r..r..5.', comp: 'x..x..x.x..x..x.' },
    train: { k: 'x.......x.......', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', bass: 'r...5...r...5...', comp: 'x...x.x.x...x.x.' },
    twostep: { k: 'x.....x....x....', s: '....x.......x...', h: '..x..xx...x..xx.', bass: '..r-...r..r-.8..', comp: 'x..x......x.....', swing: 0.6, unit: 2 },
    dnb: { k: 'x.........x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r---------r-----', comp: 'x...............' },
    funk: { k: 'x..x..x...x..x..', s: '....x..x....x...', h: 'xxxxxxxxxxxxxxxx', bass: 'r..r.8..r.r..5.8', comp: '..x..x.x..x.x...' },
    shuffle: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r.r.5.5.8.8.5.5.', comp: 'x.x.x.x.x.x.x.x.', swing: 0.66, unit: 4 },
    bossa: { k: 'x.....x.x.....x.', p: 'x..x..x...x.......x..x....x..x..', h: 'x.x.x.x.x.x.x.x.', bass: 'r.....r.5.....5.', comp: 'x..x....x.x..x..' },
    latin: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', p: 'x..x..x...x.x...', bass: 'r.....5.....r...', comp: 'x.x..x.x.x..x.x.' },
    onedrop: { k: '........x.......', s: '........x.......', h: 'x.x.x.x.x.x.x.x.', bass: 'r-.r..5-....r.5.', comp: '....x.......x...', swing: 0.58, unit: 2 },
    ska: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r...5...8...5...', comp: '..x...x...x...x.' },
    ballad: { k: 'x.........x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r-------r-----5-', comp: 'x.x.x.x.x.x.x.x.', arp: true },
    synth: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'r.r.r.r.r.r.r.r.', comp: 'xxxxxxxxxxxxxxxx', arp: true },
    none: { bass: 'r---------------', comp: 'x...............' },
  };

  /* lead/keys/bass/kit は内蔵シンセの音色。suno は資料08のディレクション例（挙動保証ではない）。 */
  const G = (id, name, cat, bpm, def, scales, progs, groove, lead, keys, bass, kit, suno) =>
    ({ id, name, cat, bpm, def, scales, progs, groove, lead, keys, bass, kit, suno });
  PF.GENRES = [
    G('pop', 'Global Pop', 'ポップ', [88, 128], 104, ['ionian', 'aeolian', 'majPent', 'minPent', 'mixolydian', 'dorian'], ['I-V-vi-IV', 'vi-IV-I-V', 'I-iii-IV-iv', 'i-bVI-bIII-bVII'], 'pop', 'soft', 'keys', 'synth', 'el', 'contemporary global pop, concise melodic hook, sparse intimate verse, rising pre-chorus, wide singable chorus, melodic bass pickups, crisp dry drums'),
    G('jpop', 'J-Pop', 'ポップ', [92, 178], 132, ['ionian', 'aeolian', 'majPent', 'minPent', 'dorian', 'harmMinor'], ['IV-V-iii-vi', 'I-III7-vi-IV', 'vi-IV-I-V', 'I-III7-vi-IV,iv'], 'rock8', 'saw', 'keys', 'pick', 'ac', 'modern Japanese pop-rock, melodic lead vocal, active but supportive bass, two contrasting guitars, add9 and slash-chord colors, detailed section lifts, memorable chorus leap'),
    G('kpop', 'K-Pop', 'ポップ', [96, 150], 120, ['minPent', 'majPent', 'aeolian', 'dorian', 'phrygian'], ['i-bVI-bIII-bVII', 'I-V-vi-IV', 'i-i-bVI-bVII'], 'dance', 'square', 'pluck', '808', 'el', 'high-contrast K-pop production, distinct verse/pre-chorus/chorus grooves, punchy hybrid drums, controlled 808, signature post-chorus hook, sharp transitions'),
    G('citypop', 'City Pop / AOR', 'ポップ', [90, 125], 108, ['ionian', 'majPent', 'mixolydian', 'lydian', 'blues'], ['ii7-V7-Imaj7-vi7', 'Imaj7-III7-vi7-IVmaj7', 'IVmaj7-V7-iii7-vi7'], 'disco', 'soft', 'rhodes', 'pick', 'ac', 'city pop revival, tight funk-disco rhythm section, melodic bass, maj7 and 9th keyboard colors, clean guitar triads, polished horns and strings'),
    G('latinpop', 'Latin Pop', 'ポップ', [90, 190], 100, ['ionian', 'aeolian', 'harmMinor', 'mixolydian', 'dorian'], ['I-IV-V-I', 'ii-V-I-I', 'i-iv-V-i'], 'latin', 'soft', 'keys', 'pick', 'ac', 'Latin pop with interlocking percussion, warm syncopated bass, bright guitar arpeggios, selective piano montuno, expressive lead vocal, group responses'),
    G('gospel', 'Gospel / CCM', 'ポップ', [68, 145], 92, ['ionian', 'mixolydian', 'blues', 'majPent'], ['I-IV-I-V', 'ii7-V7-Imaj7-Imaj7', 'I-iii-IV-V'], 'pop', 'soft', 'rhodes', 'pick', 'ac', 'contemporary gospel, piano and organ with 7th and 9th voicings, choir call-and-response, testimony-like verse growing into a communal final chorus'),

    G('hiphop', 'Hip-Hop', 'ヒップホップ / R&B', [68, 105], 90, ['minPent', 'aeolian', 'phrygian', 'harmMinor'], ['i-i-bVI-bVI', 'i-bVI', 'i-bVII', 'i-iv'], 'boombap', 'pluck', 'rhodes', 'sub', 'ac', 'contemporary hip-hop, spacious minor loop, articulate lead flow crossing bar lines, deep controlled 808, dry punchy snare, dramatic negative space'),
    G('trap', 'Trap', 'ヒップホップ / R&B', [130, 160], 140, ['aeolian', 'harmMinor', 'phrygian', 'minPent'], ['i-bVI', 'i-bVII', 'i-i-bVI-bVII'], 'trap', 'bell', 'pluck', '808', 'el', 'dark modern trap, half-time pocket, sparse ominous bell motif, controlled sliding 808, irregular kick gaps, dry snare on beat three, selective triplet hat rolls'),
    G('drill', 'Drill', 'ヒップホップ / R&B', [138, 150], 142, ['aeolian', 'phrygian', 'harmMinor'], ['i-i-bII-i', 'i-bII', 'i-bVI'], 'drill', 'bell', 'pluck', '808', 'el', 'cold modern drill, syncopated kick pattern, sliding 808 counterline, sparse minor-second piano motif, dry delayed-feel snare, tense negative space'),
    G('rnb', 'R&B', 'ヒップホップ / R&B', [62, 105], 80, ['majPent', 'minPent', 'dorian', 'mixolydian', 'blues', 'melMinor'], ['ii7-V7-Imaj7-Imaj7', 'Imaj7-III7-vi9-IVmaj7', 'i9-iv9-bVII13-bVII13'], 'rnb', 'soft', 'rhodes', 'sub', 'el', 'contemporary R&B, late pocket, intimate nuanced lead, warm Rhodes with rootless 9th and 13th voicings, sparse guitar answers, rounded bass, soft dry drums'),
    G('neosoul', 'Neo-Soul', 'ヒップホップ / R&B', [68, 108], 84, ['dorian', 'mixolydian', 'blues', 'majPent', 'minPent'], ['Imaj9-III7-vi9-IVmaj9', 'ii9-V13-Imaj9-Imaj9', 'i9-IV13-i9-IV13'], 'rnb', 'soft', 'rhodes', 'pick', 'ac', 'neo-soul pocket, slightly late snare and vocal, warm Rhodes extensions with smooth inner voices, muted clean-guitar answers, round melodic bass'),
    G('lofi', 'Lo-Fi Hip-Hop', 'ヒップホップ / R&B', [65, 92], 78, ['minPent', 'majPent', 'dorian'], ['ii7-V7-Imaj7-vi7', 'i7-iv7', 'i7-IV7'], 'boombap', 'bell', 'rhodes', 'sub', 'ac', 'lo-fi hip-hop, soft swing, dusty drums, filtered 7th and 9th chords, simple bass, gentle noise bed, small variations every four bars'),
    G('funk', 'Funk', 'ヒップホップ / R&B', [88, 118], 104, ['dorian', 'mixolydian', 'blues', 'minPent'], ['i7-IV7', 'I7-I7-IV7-I7', 'i7-i7-IV7-IV7'], 'funk', 'square', 'pluck', 'pick', 'ac', 'funk, sixteenth-note interlock, ghost notes, muted guitar, syncopated bass, short 9th chord stabs, ensemble hits after the hook'),

    G('house', 'House', 'ダンス / 電子', [118, 130], 124, ['minPent', 'majPent', 'dorian', 'mixolydian'], ['i7-bVImaj7', 'Imaj7-ii7', 'i7-iv7'], 'four', 'pluck', 'pluck', 'synth', 'el', 'modern house, firm four-on-floor kick, offbeat hats, lightly swung percussion, short rootless chord stabs, elastic syncopated bass, one memorable vocal phrase'),
    G('techno', 'Techno', 'ダンス / 電子', [125, 145], 134, ['phrygian', 'aeolian', 'harmMinor'], ['i', 'i-i-bII-i'], 'techno', 'square', 'pluck', 'synth', 'el', 'hypnotic modern techno, solid dry kick, controlled rumble, evolving polyrhythmic percussion, sparse dissonant stab, gradual parameter movement'),
    G('ukg', 'UK Garage / 2-Step', 'ダンス / 電子', [128, 138], 132, ['minPent', 'dorian', 'majPent'], ['i7-IV7', 'ii7-V7', 'i7-i7-iv7-iv7'], 'twostep', 'pluck', 'rhodes', 'sub', 'el', 'modern UK garage, broken two-step kicks, firm dry backbeat, lightly shuffled hats, rounded sub notes in the kick gaps, short organ stabs, airy vocal chops'),
    G('dnb', 'Drum & Bass', 'ダンス / 電子', [160, 180], 174, ['minPent', 'aeolian', 'dorian'], ['i-bVI', 'i-bVII', 'i-i-bVI-bVII'], 'dnb', 'saw', 'pad', 'synth', 'el', 'dancefloor drum and bass, precise chopped breaks, strong snare anchors, deep mono sub, wide atmospheric pads, long singable vocal phrases'),
    G('amapiano', 'Amapiano', 'ダンス / 電子', [108, 115], 112, ['minPent', 'dorian', 'aeolian'], ['i7-iv7', 'i-bVI', 'i9-i9-iv9-iv9'], 'amapiano', 'soft', 'rhodes', '808', 'el', 'deep amapiano, soft four-on-floor pulse, flowing shakers, spacious minor-9th keys, pitched log-drum phrases answering the vocal, gradual layer changes'),
    G('trance', 'Trance', 'ダンス / 電子', [128, 142], 138, ['aeolian', 'ionian', 'harmMinor'], ['i-bVI-bIII-bVII', 'I-V-vi-IV'], 'four', 'saw', 'pad', 'synth', 'el', 'uplifting trance, four-on-floor, rolling bass, wide supersaw triads, arpeggiated inversions, long build and release, breakdown melody returning in the drop'),
    G('synthwave', 'Synthwave', 'ダンス / 電子', [70, 120], 96, ['aeolian', 'ionian', 'dorian'], ['i-bVI-bIII-bVII', 'I-V-vi-IV', 'i-bVII-bVI-bVII'], 'synth', 'saw', 'pad', 'synth', 'el', 'synthwave, slow programmed drums, arpeggiators, wide pads, gated chords, nostalgic four-chord loop, cinematic build'),
    G('ambient', 'Ambient', 'ダンス / 電子', [50, 100], 70, ['lydian', 'majPent', 'dorian', 'aeolian'], ['Iadd9-vi7-IVmaj7-I', 'I-I-IV-I'], 'none', 'bell', 'pad', 'sub', 'el', 'ambient pop, slow envelopes, wide intervals, long decays, sparse attacks, silence between phrases, form built from density and spatial distance'),

    G('indie', 'Indie / Alt Rock', 'ロック', [90, 170], 128, ['majPent', 'minPent', 'mixolydian', 'dorian', 'ionian'], ['I-IV', 'I-bVII-IV-I', 'vi-IV-I-V'], 'rock8', 'saw', 'power', 'pick', 'ac', 'human alternative guitar rock, two contrasting guitars with separate distortion characters, melodic bass, dry live drums with small room, clear quiet-loud architecture'),
    G('punk', 'Punk / Pop-Punk', 'ロック', [140, 220], 172, ['majPent', 'ionian', 'mixolydian', 'minPent'], ['I5-IV5-V5-IV5', 'vi-IV-I-V', 'bVII-IV-I-I'], 'punk', 'saw', 'power', 'pick', 'ac', 'pop-punk, power chords, fast downstrokes, driving backbeat, concise bass pickups, immediate verse and chorus, gang vocal on the final chorus'),
    G('metal', 'Metal', 'ロック', [80, 220], 150, ['aeolian', 'harmMinor', 'phrygDom', 'phrygian'], ['i5-bVI5-bVII5-i5', 'i-bVI-bIII-bVII', 'i5-bII5-i5-bII5'], 'metal', 'saw', 'power', 'pick', 'ac', 'modern melodic heavy metal, tight palm-muted rhythm guitar, articulate pick bass, powerful acoustic drums, clean commanding lead vocal, dark verse and anthemic chorus'),
    G('shoegaze', 'Shoegaze / Dream Pop', 'ロック', [70, 150], 92, ['ionian', 'aeolian', 'lydian', 'mixolydian'], ['Iadd9-vi7-IVmaj7-Vsus4', 'I-IV'], 'rock8', 'soft', 'pad', 'pick', 'ac', 'shoegaze dream pop, layered guitars under reverb, add9 and open-string voicings, soft pulse, near-field vocal as color, slow spectral evolution'),
    G('ska', 'Ska', 'ロック', [120, 170], 144, ['ionian', 'majPent', 'mixolydian'], ['I-vi-IV-V', 'I-IV-V-IV'], 'ska', 'square', 'pluck', 'pick', 'ac', 'ska, short offbeat guitar chords, walking bass that states the beat, bright horn answers between vocal lines'),

    G('country', 'Country', 'ルーツ / ワールド', [72, 148], 110, ['majPent', 'mixolydian', 'ionian', 'blues'], ['I-IV-V-I', 'I-V-vi-IV', 'I-ii-IV-V'], 'train', 'soft', 'keys', 'pick', 'ac', 'modern country pop, vivid narrative vocal, bright acoustic strum, concise electric-guitar answers, root-fifth bass, train-beat details, warm three-part chorus harmony'),
    G('folk', 'Folk / SSW', 'ルーツ / ワールド', [55, 130], 92, ['ionian', 'majPent', 'aeolian', 'dorian', 'mixolydian', 'minPent'], ['I-IV-V-I', 'vi-IV-I-V', 'i-bVII-IV-i'], 'ballad', 'soft', 'keys', 'pick', 'ac', 'folk singer-songwriter, lyric-led pulse, fingerpicked acoustic guitar, sparse ensemble, intentional bass movement and phrase endings'),
    G('blues', 'Blues', 'ルーツ / ワールド', [55, 180], 96, ['blues', 'minPent', 'mixolydian'], ['I7-IV7-I7-I7-IV7-IV7-I7-I7-V7-IV7-I7-V7'], 'shuffle', 'saw', 'keys', 'pick', 'ac', 'blues shuffle, dominant 7th chords, call-and-response between voice and guitar, bends and slides, repeat-answer-turnaround phrasing'),
    G('reggae', 'Reggae', 'ルーツ / ワールド', [68, 100], 80, ['majPent', 'minPent', 'mixolydian'], ['I-V', 'I-IV-V-IV', 'i-iv'], 'onedrop', 'soft', 'pluck', 'sub', 'ac', 'roots reggae, one-drop drums, bass-led arrangement, short skank chords, organ bubble, delay throws, space as structure'),
    G('afrobeats', 'Afrobeats', 'ルーツ / ワールド', [92, 118], 104, ['majPent', 'minPent', 'dorian', 'mixolydian'], ['I-IV', 'I-V', 'vi-IV-I-V'], 'afro', 'pluck', 'pluck', 'sub', 'el', 'modern Afrobeats, interlocking syncopated percussion, warm short-note bass, clean high-register guitar triads, conversational lead vocal, compact call-and-response hook'),
    G('reggaeton', 'Reggaeton', 'ルーツ / ワールド', [86, 105], 94, ['aeolian', 'phrygian', 'minPent'], ['i-bVI-bIII-bVII', 'i-bVII-bVI-bVII'], 'dembow', 'pluck', 'pluck', '808', 'el', 'modern reggaeton, firm dembow backbone, syncopated controlled sub, dry punchy percussion, sparse minor pluck, confident melodic-rap lead, immediate hook'),
    G('bossa', 'Bossa Nova', 'ルーツ / ワールド', [70, 150], 104, ['ionian', 'lydian', 'melMinor', 'dorian'], ['Imaj7-VI7-ii7-V7', 'ii7-V7-Imaj7-Imaj7'], 'bossa', 'soft', 'rhodes', 'pick', 'ac', 'bossa nova, independent guitar bass-and-chord pattern, 6th and 9th voicings with close inner motion, soft percussion, nuanced intimate vocal'),

    G('warock', '和風ロック', '和', [80, 180], 140, ['yo', 'in', 'minPent', 'majPent', 'aeolian'], ['i-bVI-bVII-i', 'IV-V-iii-vi'], 'rock8', 'saw', 'power', 'pick', 'ac', 'Japanese traditional rock fusion, shamisen or koto carrying a real melodic role, taiko accents, rock rhythm section, open fifths, use of ma (space)'),
    G('enka', '演歌 / 歌謡曲', '和', [60, 120], 76, ['yonaMinor', 'minPent', 'harmMinor', 'majPent'], ['i-iv-V-i', 'i-bVI-iv-V'], 'ballad', 'soft', 'keys', 'pick', 'ac', 'enka kayokyoku ballad, dramatic rubato feel, strings and guitar countermelody, kobushi ornaments used as phrase meaning, narrative verse and refrain'),
  ];
  PF.GENRE = Object.fromEntries(PF.GENRES.map((x) => [x.id, x]));

  /* 拍子。e=1小節の8分音符数、strong=強拍の位置(8分単位)、ts=MIDIの拍子記号[分子, 分母のlog2]。
     BPMは常に四分音符基準。rhythms=モチーフのリズム型（8分単位、合計e。4/4は資料07の拍型）。
     groove=4/4以外で使う伴奏型（ステップ数は e×2）。ジャンルのグルーヴは4/4専用。 */
  PF.METERS = {
    '4/4': { name: '4/4', e: 8, strong: [0, 4], ts: [4, 2], rhythms: [[1, 1, 2, 4], [2, 1, 1, 4], [2, 2, 2, 2], [1, 1, 1, 5], [3, 1, 2, 2]] },
    '3/4': { name: '3/4', e: 6, strong: [0], ts: [3, 2], rhythms: [[1, 1, 2, 2], [2, 1, 1, 2], [2, 2, 1, 1], [1, 1, 1, 3], [3, 1, 1, 1]],
      groove: { k: 'x...........', s: '....x...x...', h: 'x.x.x.x.x.x.', bass: 'r---....5-..', comp: 'x...x...x...' } },
    '6/8': { name: '6/8', e: 6, strong: [0, 3], ts: [6, 3], note: '3+3', rhythms: [[1, 1, 1, 3], [2, 1, 2, 1], [3, 1, 1, 1], [2, 1, 1, 2], [1, 2, 1, 2]],
      groove: { k: 'x...........', s: '......x.....', h: 'x.x.x.x.x.x.', bass: 'r-----5-----', comp: 'x.x.x.x.x.x.', arp: true } },
    '5/4': { name: '5/4', e: 10, strong: [0, 6], ts: [5, 2], note: '3+2', rhythms: [[1, 1, 4, 4], [2, 2, 2, 4], [2, 1, 3, 4], [3, 3, 2, 2], [2, 4, 2, 2]],
      groove: { k: 'x.....x.....x.......', s: '........x.......x...', h: 'x.x.x.x.x.x.x.x.x.x.', bass: 'r---....5---r---5---', comp: 'x.....x.....x...x...' } },
    '7/8': { name: '7/8', e: 7, strong: [0, 4], ts: [7, 3], note: '2+2+3', rhythms: [[1, 1, 2, 3], [2, 2, 1, 2], [2, 1, 1, 3], [1, 1, 1, 4], [2, 2, 2, 1]],
      groove: { k: 'x.......x.....', s: '....x.......x.', h: 'x.x.x.x.x.x.x.', bass: 'r---5---r-----', comp: 'x...x...x.....' } },
    '7/4': { name: '7/4', e: 14, strong: [0, 8], ts: [7, 2], note: '4+3', rhythms: [[2, 2, 4, 6], [1, 1, 6, 6], [4, 4, 2, 4], [2, 1, 1, 10], [3, 3, 2, 6]],
      groove: { k: 'x.....x.........x.....x.....', s: '....x.......x.......x.......', h: 'x.x.x.x.x.x.x.x.x.x.x.x.x.x.', bass: 'r---....r---5---r---....5---', comp: 'x.....x.....x...x.....x.....' } },
  };
  PF.rhythmName = (d) => { const lo = Math.min(...d), hi = Math.max(...d); return lo === hi ? '均等' : d.map((x) => (x === hi ? '長' : x === lo ? '短' : '中')).join('・'); };

  /* 資料07「24の四音例」。c=作例の中心音(MIDI)、n=音高、r=4/4のリズム型の番号。 */
  const P = (name, c, n, r) => ({ name, c, n, r });
  PF.PRESETS = [
    P('期待', 60, [60, 62, 64, 67], 0), P('解放', 57, [64, 67, 69, 72], 1), P('勝利', 60, [67, 67, 72, 76], 0),
    P('無邪気', 60, [60, 64, 62, 67], 0), P('決意', 62, [62, 62, 65, 69], 1), P('懐かしい喜び', 60, [67, 64, 62, 60], 0),
    P('憧れ', 60, [60, 64, 67, 65], 1), P('片思い', 57, [64, 65, 69, 67], 0), P('後悔', 57, [69, 67, 64, 65], 0),
    P('孤独', 57, [64, 62, 60, 59], 2), P('別れ', 62, [69, 67, 65, 64], 1), P('再会', 60, [67, 64, 65, 67], 0),
    P('不安', 64, [59, 60, 59, 58], 0), P('焦燥', 57, [64, 65, 64, 67], 3), P('怒り', 62, [62, 62, 65, 64], 0),
    P('疑念', 60, [60, 66, 67, 66], 1), P('追跡', 57, [57, 60, 59, 62], 3), P('諦めきれない', 57, [64, 62, 60, 62], 1),
    P('安堵', 60, [67, 65, 64, 60], 0), P('祈り', 62, [62, 65, 64, 62], 2), P('謎', 60, [60, 61, 67, 66], 1),
    P('夢見心地', 60, [60, 64, 62, 69], 1), P('皮肉', 60, [64, 67, 65, 64], 0), P('希望の残り火', 57, [64, 62, 60, 67], 1),
  ];
})(typeof globalThis !== 'undefined' ? globalThis : this);
