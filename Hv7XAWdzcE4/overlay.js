// ============================================================================
// KARAOKE OVERLAY — 白日 (Hakujitsu) / Jelly Hoshiumi cover @ VeXpo 2025
// ----------------------------------------------------------------------------
// Design direction: "Snowfall under stagelight."
//
// The song is about regret, being buried pure-white by snow, walking into
// tomorrow. The MV is a magenta/lavender idol concert — Jelly in a white-and-
// navy dress with yellow star accessories, singing against a curtain of
// vertical LED panels. The card is the "白日" itself: a pool of warm daylight
// carved out of the stage, ivory paper under a breathing gold aura, with gold
// star corner ornaments (her hair clips) and a yellow ribbon bookmark tag
// (her waist ribbon). Snow drifts across the whole video, and bursts extra
// thick when the lyric line mentions snow, blank-white, or being wrapped up.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@500;700;800&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap',
    fontDisplay: '"Fraunces", "Cormorant Garamond", Georgia, serif',
    fontBody:    '"Fraunces", "Cormorant Garamond", Georgia, serif',
    fontJP:      '"Shippori Mincho B1", "Noto Serif JP", serif',

    // Card palette — derived from MV: ivory paper (the "daylight"), warm gold
    // (Jelly's ribbon/headband/stars), deep navy ink (her corset), stage-rose
    // for accents, soft pink for the aura bloom.
    cream:      '#FBF6EB',
    creamHi:    '#FEFBF3',
    creamLo:    '#F2E6D1',
    accent:     '#E5B94D',
    accentDeep: '#B8842E',
    accentInk:  '#6B5528',
    ink:        '#26264A',
    inkSoft:    '#54557A',
    gold:       '#E5B94D',
    rose:       '#C43B87',
    roseGlow:   '#F5B8D6',
    lavender:   '#B8A8E0',

    // Lyrics — dark ink on the ivory card.
    lyricColorEN:  '#26264A',
    lyricColorJP:  '#1A1B3A',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(255,252,240,0.75)',
    lyricShadowJP: '0 1px 0 rgba(255,252,240,0.7)',
  };

  // --- Trusted Types ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  // --- State preservation ---
  window.__setlist         = window.__setlist         || [];
  window.__parsedLyrics    = window.__parsedLyrics    || {};
  window.__transCache      = window.__transCache      || {};
  window.__plainLyrics     = window.__plainLyrics     || {};
  window.__lyricOffsets    = window.__lyricOffsets    || {};
  // Chunk colors — 6 MV-derived hues, readable on the ivory card.
  // Stage magenta → corset navy → warm gold ochre → deep stage lavender →
  // mulberry rose → twilight teal. An idol-concert palette, not purple slop.
  window.__wordAlign = window.__wordAlign || { colors: [], data: {} };
  window.__wordAlign.colors = [
    '#C43B87',  // stage magenta
    '#2B3F87',  // corset navy
    '#B8842E',  // warm gold ochre
    '#6B3E98',  // deep stage lavender
    '#C23766',  // mulberry rose
    '#2E6F8B',  // twilight teal
  ];
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Clean prior injection ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Google Fonts ---
  if (THEME.fontsHref && !document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  // --- CSS ---
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-cream-hi:    ${THEME.creamHi};
      --ko-cream-lo:    ${THEME.creamLo};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};
      --ko-rose:        ${THEME.rose};
      --ko-rose-glow:   ${THEME.roseGlow};
      --ko-lavender:    ${THEME.lavender};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* Snow canvas — clipped to the video rect by the position tick. Sits
       behind the lyric card so flakes drift in front of the MV but behind
       the text. */
    #ko-snow-canvas {
      position: fixed;
      pointer-events: none;
      z-index: 2147483050;
      opacity: 0.92;
      mix-blend-mode: screen;
    }

    /* ==== LYRIC DISPLAY ==== */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }

    /* The "daylight card": ivory paper, warm breathing aura, layered highlights,
       four gold star corner pins. */
    .ko-card {
      position: relative;
      width: 100%;
      padding: 32px 40px 28px;
      background:
        radial-gradient(ellipse at 30% 0%, rgba(255,250,230,0.85) 0%, rgba(251,246,235,0) 55%),
        linear-gradient(178deg, var(--ko-cream-hi) 0%, var(--ko-cream) 52%, var(--ko-cream-lo) 100%);
      border-radius: 18px;
      border: 1px solid rgba(184,132,46,0.42);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.85),
        inset 0 0 0 1px rgba(255,250,230,0.55),
        inset 0 -18px 40px -24px rgba(184,132,46,0.22),
        0 2px 6px rgba(38,38,74,0.12),
        0 18px 46px -14px rgba(38,38,74,0.4),
        0 0 34px -8px rgba(245,184,214,0.35);
    }

    /* Subtle linen/noise texture — SVG data URI giving the paper its grain. */
    .ko-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 18px;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0.08 0'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>");
      background-size: 140px 140px;
      mix-blend-mode: multiply;
      opacity: 0.55;
      pointer-events: none;
      z-index: 0;
    }

    /* Breathing daylight aura — sits behind the card, gold/rose bloom. */
    .ko-card::after {
      content: '';
      position: absolute;
      inset: -28px -34px;
      z-index: -1;
      background:
        radial-gradient(ellipse at 50% 45%, rgba(245,205,130,0.42) 0%, rgba(245,184,214,0.24) 40%, rgba(184,168,224,0.08) 70%, transparent 85%);
      filter: blur(22px);
      animation: ko-breathe 7.2s ease-in-out infinite;
      will-change: opacity, transform;
    }
    @keyframes ko-breathe {
      0%, 100% { opacity: 0.72; transform: scale(1) translateY(0); }
      50%      { opacity: 1;    transform: scale(1.04) translateY(-2px); }
    }
    .ko-card.ko-pulse::after {
      animation: ko-pulse-once 1.4s cubic-bezier(0.2, 0.9, 0.3, 1);
    }
    @keyframes ko-pulse-once {
      0%   { opacity: 1.2; transform: scale(1.12) translateY(-4px); filter: blur(14px); }
      60%  { opacity: 0.95; }
      100% { opacity: 0.72; transform: scale(1) translateY(0);      filter: blur(22px); }
    }

    /* Ribbon bookmark tab — top-left, sticks up past the card edge. Navy
       "白日" kanji on gold; echoes Jelly's yellow waist ribbon. */
    .ko-ribbon {
      position: absolute;
      top: -24px;
      left: 34px;
      width: 44px;
      z-index: 2;
      pointer-events: none;
      filter: drop-shadow(0 4px 8px rgba(120,84,18,0.35));
    }
    .ko-ribbon-body {
      width: 44px;
      height: 34px;
      background:
        linear-gradient(180deg, #FFDC7A 0%, #E5B94D 58%, #B8842E 100%);
      border: 1px solid rgba(120, 84, 18, 0.55);
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.55),
        inset 0 -2px 3px rgba(120,84,18,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ko-font-jp);
      font-weight: 800;
      font-size: 13px;
      color: #1E1F3E;
      text-shadow: 0 1px 0 rgba(255,255,255,0.4);
      letter-spacing: -0.02em;
    }
    /* Forked ribbon tail — two triangles cut in from the bottom */
    .ko-ribbon-tail {
      width: 44px;
      height: 14px;
      background: linear-gradient(180deg, #B8842E 0%, #976A22 100%);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 75% 55%, 50% 100%, 25% 55%, 0 100%);
      border-left: 1px solid rgba(120, 84, 18, 0.45);
      border-right: 1px solid rgba(120, 84, 18, 0.45);
      margin-top: -1px;
    }

    /* Song meta pill — top-right, calm. */
    .ko-meta {
      position: absolute;
      top: -11px;
      right: 28px;
      padding: 3px 12px 3px 10px;
      z-index: 2;
      background: linear-gradient(180deg, #FFFDF5 0%, #F6EAD3 100%);
      border: 1px solid rgba(184,132,46,0.5);
      border-radius: 14px;
      display: flex;
      align-items: baseline;
      gap: 7px;
      color: var(--ko-ink);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.8),
        0 2px 6px rgba(38,38,74,0.16);
    }
    .ko-meta-sep {
      width: 3px; height: 3px;
      background: var(--ko-accent-deep);
      border-radius: 50%;
      display: inline-block;
      transform: translateY(-2px);
      flex-shrink: 0;
    }
    .ko-meta-label {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 500;
      font-size: 10.5px;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: var(--ko-accent-ink);
    }
    .ko-meta-artist {
      font-family: var(--ko-font-display);
      font-weight: 600;
      font-size: 11px;
      letter-spacing: 0.02em;
      color: var(--ko-ink);
    }

    /* Corner stars — gold 5-point, phase-offset twinkle + slow rotation. */
    .ko-star {
      position: absolute;
      pointer-events: none;
      color: #F4C85A;
      filter: drop-shadow(0 1px 2px rgba(120,84,18,0.45));
      z-index: 3;
      transform-origin: 50% 50%;
      opacity: 0.9;
    }
    .ko-star--tl { top: -11px; left: -9px;  width: 18px; height: 18px;
      animation: ko-spin 22s linear infinite, ko-twinkle 4.2s ease-in-out infinite; }
    .ko-star--tr { top: -14px; right: -11px; width: 14px; height: 14px;
      animation: ko-spin 27s linear infinite reverse, ko-twinkle 5.1s ease-in-out -1.3s infinite; }
    .ko-star--bl { bottom: -10px; left: -8px; width: 13px; height: 13px;
      animation: ko-spin 31s linear infinite, ko-twinkle 5.8s ease-in-out -2.4s infinite; }
    .ko-star--br { bottom: -13px; right: -10px; width: 17px; height: 17px;
      animation: ko-spin 19s linear infinite reverse, ko-twinkle 4.6s ease-in-out -0.6s infinite; }
    @keyframes ko-spin { to { transform: rotate(360deg); } }
    @keyframes ko-twinkle {
      0%, 100% { opacity: 0.55; filter: drop-shadow(0 1px 2px rgba(120,84,18,0.35)); }
      50%      { opacity: 1;    filter: drop-shadow(0 0 5px rgba(255,220,120,0.85)) drop-shadow(0 1px 2px rgba(120,84,18,0.4)); }
    }

    /* Slot holding the actual lyric lines */
    #ko-lyrics .ko-slot {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    /* Hairline between JP and EN — only visible when both populated. */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      left: 20%; right: 20%;
      top: calc(50% - 2px);
      height: 1px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(184,132,46,0.28) 15%,
        rgba(184,132,46,0.45) 50%,
        rgba(184,132,46,0.28) 85%,
        transparent 100%);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.45s ease;
    }
    #ko-lyrics .ko-slot.ko-has-both::before { opacity: 1; }

    /* JP line */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.35;
      padding-top: 0.45em;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      position: relative;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 600;
      font-style: italic;
      letter-spacing: 0.015em;
      line-height: 1.1;
      padding-bottom: 8px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 1px 0 rgba(255,252,240,0.8);
      user-select: none;
      opacity: 0.93;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 38px;
      line-height: 1.22;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      font-style: italic;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 28px; font-weight: 500; font-style: italic; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* Entrance animations — JP fades up first, EN follows */
    #ko-lyrics .ko-line-jp.ko-in {
      animation: ko-jpin 0.55s cubic-bezier(0.22, 1, 0.36, 1);
    }
    #ko-lyrics .ko-line-en.ko-in {
      animation: ko-enin 0.65s 0.12s cubic-bezier(0.22, 1, 0.36, 1) backwards;
    }
    @keyframes ko-jpin {
      from { opacity: 0.2; transform: translateY(6px); filter: blur(1.5px); }
      to   { opacity: 1;   transform: translateY(0);   filter: blur(0);     }
    }
    @keyframes ko-enin {
      from { opacity: 0;   transform: translateY(4px); }
      to   { opacity: 1;   transform: translateY(0);   }
    }
  `;
  document.head.appendChild(style);

  // --- Helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- Root + snow canvas ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const snowCanvas = document.createElement('canvas');
  snowCanvas.id = 'ko-snow-canvas';
  root.appendChild(snowCanvas);
  const sctx = snowCanvas.getContext('2d');

  // --- Lyric card DOM ---
  const STAR_SVG = `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="__STARCLS__">
      <path d="M12 1.6 L14.5 9.1 L22 9.1 L15.8 13.8 L18.2 21.3 L12 16.6 L5.8 21.3 L8.2 13.8 L2 9.1 L9.5 9.1 Z"/>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-card">
      <div class="ko-ribbon">
        <div class="ko-ribbon-body">白日</div>
        <div class="ko-ribbon-tail"></div>
      </div>
      <div class="ko-meta">
        <span class="ko-meta-label">King Gnu</span>
        <span class="ko-meta-sep"></span>
        <span class="ko-meta-artist">Jelly Hoshiumi cover</span>
      </div>
      ${STAR_SVG.replace('__STARCLS__', 'ko-star ko-star--tl')}
      ${STAR_SVG.replace('__STARCLS__', 'ko-star ko-star--tr')}
      ${STAR_SVG.replace('__STARCLS__', 'ko-star ko-star--bl')}
      ${STAR_SVG.replace('__STARCLS__', 'ko-star ko-star--br')}
      <div class="ko-slot">
        <div class="ko-line-jp" id="ko-line-jp"></div>
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + fallback fetch ---
  const parseLRC = (txt) => {
    const lines = [];
    for (const line of txt.split('\n')) {
      const m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
      if (!m) continue;
      const sec = Number(m[1]) * 60 + Number(m[2]);
      let text = m[3].trim();
      if (text.includes('^')) {
        const parts = text.split('^');
        const jp = parts[0].trim();
        const en = parts[1].trim();
        text = jp;
        if (jp && en) window.__transCache[jp] = window.__transCache[jp] || en;
      }
      lines.push({ t: sec, text });
    }
    return lines;
  };

  const lrcIds = [...new Set(window.__setlist.filter(s => s.lrcId).map(s => s.lrcId))];
  lrcIds.forEach(id => {
    if (window.__parsedLyrics[id]) return;
    fetch(`https://lrclib.net/api/get/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.syncedLyrics) {
          window.__parsedLyrics[id] = parseLRC(d.syncedLyrics);
        }
      })
      .catch(() => {});
  });

  // --- Cached DOM-write guards ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';
  let lastCanvasRect = '';

  // --- Position tick: re-anchor lyric card + snow canvas to video rect ---
  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}`;
    if (posKey !== lastLyricsPos) {
      lastLyricsPos = posKey;
      lyrics.style.left     = (r.left + r.width / 2) + 'px';
      lyrics.style.top      = (r.top + r.height * 0.66) + 'px';
      lyrics.style.width    = (r.width * 0.62) + 'px';
      lyrics.style.maxWidth = (r.width * 0.62) + 'px';

      // Snow canvas — clipped to video rect so flakes don't leak onto chrome.
      snowCanvas.style.left   = r.left + 'px';
      snowCanvas.style.top    = r.top  + 'px';
      snowCanvas.style.width  = r.width  + 'px';
      snowCanvas.style.height = r.height + 'px';
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const newW = Math.round(r.width  * dpr);
      const newH = Math.round(r.height * dpr);
      const rectKey = `${newW}x${newH}`;
      if (rectKey !== lastCanvasRect) {
        lastCanvasRect = rectKey;
        snowCanvas.width  = newW;
        snowCanvas.height = newH;
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text ---
  const tick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) return;
    const t = v.currentTime;
    if (!isFinite(t)) return;

    const sl = window.__setlist;
    let idx = -1;
    for (let i = 0; i < sl.length; i++) {
      if (t >= sl[i].s && t < sl[i].end) { idx = i; break; }
    }

    const song    = idx >= 0 ? sl[idx] : null;
    const inSong  = song ? (t - song.s) : 0;
    const songDur = song ? (song.dur || 240) : 0;

    if (idx !== curSongIdx) {
      curSongIdx = idx;
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    if (song && song.lrcId && window.__parsedLyrics[song.lrcId]) {
      const lrc = window.__parsedLyrics[song.lrcId];
      const offset = window.__lyricOffsets[song.lrcId] || 0;
      const elapsed = inSong - offset;

      let lineIdx = -1;
      for (let i = 0; i < lrc.length; i++) {
        if (lrc[i].t <= elapsed) lineIdx = i;
        else break;
      }

      let showText = '';
      if (lineIdx >= 0) {
        const line = lrc[lineIdx];
        const nextT = (lrc[lineIdx + 1] && lrc[lineIdx + 1].t) || (songDur + 10);
        const endAt = Math.min(nextT, line.t + window.__koMaxHold);
        if (elapsed < endAt) {
          showText = line.text;
        }
      }

      if (lineIdx !== curLineIdx || showText !== lastJpText) {
        curLineIdx = lineIdx;
        const enEl = document.getElementById('ko-line-en');
        const jpEl = document.getElementById('ko-line-jp');
        if (song.lang === 'en') {
          if (enEl && showText !== lastEnText) {
            enEl.textContent = showText;
            lastEnText = showText;
          }
          if (jpEl && lastJpText !== '') {
            jpEl.textContent = '';
            lastJpText = '';
          }
        } else {
          const posEn = (lineIdx >= 0 && showText && lrc[lineIdx].en) || '';
          const en = posEn || (showText && window.__transCache[showText]) || '';
          if (enEl && en !== lastEnText) {
            enEl.textContent = en;
            lastEnText = en;
          }
          if (jpEl && showText !== lastJpText) {
            jpEl.textContent = showText;
            lastJpText = showText;
          }
        }
      }
    } else if (!song || !song.lrcId) {
      if (lastEnText !== '') {
        document.getElementById('ko-line-en').textContent = '';
        lastEnText = '';
      }
      if (lastJpText !== '') {
        document.getElementById('ko-line-jp').textContent = '';
        lastJpText = '';
      }
    }
  };

  // --- Dual loop ---
  const raf = () => {
    if (window.__koGen !== MY_GEN) return;
    tick();
    requestAnimationFrame(raf);
  };
  raf();
  const intervalId = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(intervalId); return; }
    tick();
  }, 30);

  // --- Offset hotkeys ---
  const keyHandler = (e) => {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
    if (e.key !== '[' && e.key !== ']' && e.key !== '\\') return;
    const sl = window.__setlist;
    const song = curSongIdx >= 0 ? sl[curSongIdx] : null;
    if (!song || !song.lrcId) return;
    const id = song.lrcId;
    const cur = window.__lyricOffsets[id] || 0;
    if      (e.key === '[')  window.__lyricOffsets[id] = cur - 0.5;
    else if (e.key === ']')  window.__lyricOffsets[id] = cur + 0.5;
    else if (e.key === '\\') delete window.__lyricOffsets[id];
    curLineIdx = -2;
    try {
      const vid = new URL(location.href).searchParams.get('v');
      window.postMessage({
        __ko: true, type: 'offset',
        videoId: vid, lrcId: id,
        offset: window.__lyricOffsets[id] ?? null
      }, location.origin);
    } catch {}
    e.preventDefault();
    e.stopPropagation();
  };
  if (window.__karaokeKeyHandler) {
    document.removeEventListener('keydown', window.__karaokeKeyHandler, true);
  }
  window.__karaokeKeyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler, true);

  // --- Rebuild hook ---
  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

  // --- Translation merge ---
  window.__mergeTranslations = (data) => {
    const parsed = window.__parsedLyrics;
    for (const id in data) {
      if (!data.hasOwnProperty(id)) continue;
      const lines = parsed[id];
      if (!lines) continue;
      const map = data[id];
      for (const line of lines) {
        const k2 = line.t.toFixed(2);
        const val = map[k2] || map[String(line.t)] || map[parseFloat(k2).toString()];
        if (!val) continue;
        if (typeof val === 'string') {
          line.en = val;
          if (line.text) window.__transCache[line.text] = val;
        } else {
          if (val.en) {
            line.en = val.en;
            if (line.text) window.__transCache[line.text] = val.en;
          }
          if (val.align && line.text) {
            const existing = window.__wordAlign.data[line.text] || {};
            window.__wordAlign.data[line.text] = Object.assign(existing, val.align);
          }
        }
      }
    }
    window.__karaokeRebuild();
  };

  // --- Color + gloss colorizer (polling) ---
  let _lastWCJp = '';
  const COLOR_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(COLOR_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    if (!jpEl || !enEl) return;
    const jp = jpEl.textContent;
    if (jp === _lastWCJp) return;
    _lastWCJp = jp;
    if (!jp.trim()) return;
    const alignment = window.__wordAlign.data && window.__wordAlign.data[jp];
    if (!alignment) return;
    const colors = window.__wordAlign.colors;
    const buildJpPlain = segs => segs.map(([text, ci]) =>
      `<span data-wc="${ci}" style="color:${colors[ci]}">${escHTML(text)}</span>`
    ).join('');
    const buildJpGloss = segs => segs.map(([text, ci, g]) => {
      const col = colors[ci];
      return `<span data-wc="${ci}" style="color:${col}"><ruby>${escHTML(text)}<rt style="color:${col}">${escHTML(g || '')}</rt></ruby></span>`;
    }).join('');
    const buildEn = segs => segs.map(([text, ci]) =>
      `<span data-wc="${ci}" style="color:${colors[ci]}">${escHTML(text)}</span>`
    ).join('');
    if (alignment.gloss && alignment.gloss.length) {
      setHTML(jpEl, buildJpGloss(alignment.gloss));
    } else if (alignment.jp) {
      setHTML(jpEl, buildJpPlain(alignment.jp));
    }
    if (alignment.en) setHTML(enEl, buildEn(alignment.en));
  }, 150);

  // ==========================================================================
  // SIGNATURE CREATIVE FEATURES
  // ==========================================================================

  // --- Feature 1: Line-change pulse + snow-keyword burst ---
  // Watches JP textContent (its own poll — side-effects don't belong in the
  // locked color poll): pulses the card's daylight aura, re-triggers the
  // JP/EN entrance animations, toggles the hairline, and detects snow/
  // blank-white keywords to spawn a burst of extra flakes.
  const SNOW_KEYWORDS = [
    '雪', '真っ白', '真っ新', '降りしきる', '降りしきろう',
    '包み込んで', '凍らせて', '白日'
  ];
  let _lastPulseJp = '';
  const pulseEl = (el, cls) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };
  const PULSE_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(PULSE_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    const slot = lyrics.querySelector('.ko-slot');
    const card = lyrics.querySelector('.ko-card');
    if (!jpEl || !enEl || !slot || !card) return;
    const jp = jpEl.textContent;
    if (jp === _lastPulseJp) return;
    _lastPulseJp = jp;

    const bothPopulated = jp.trim() && enEl.textContent.trim();
    slot.classList.toggle('ko-has-both', !!bothPopulated);

    if (jp.trim()) {
      pulseEl(card, 'ko-pulse');
      pulseEl(jpEl, 'ko-in');
      pulseEl(enEl, 'ko-in');
      if (SNOW_KEYWORDS.some(kw => jp.includes(kw))) {
        burstSnow();
      }
    }
  }, 150);

  // --- Feature 2: Snow-drift canvas ---
  // Continuous snowfall across the video. Most flakes are cool white; a small
  // minority are warm gold (picks up stage color). Gentle sway via per-flake
  // phase-offset sine. Burst flakes spawn at the top on snow-keyword lines
  // and are spliced out once they fall past the bottom so the base population
  // stays constant.
  const BASE_FLAKE_COUNT = 80;
  const flakes = [];
  const initFlakes = () => {
    const W = snowCanvas.clientWidth || window.innerWidth;
    const H = snowCanvas.clientHeight || window.innerHeight;
    for (let i = 0; i < BASE_FLAKE_COUNT; i++) {
      flakes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.9 + 0.5,
        vy: Math.random() * 0.55 + 0.22,
        sway: Math.random() * Math.PI * 2,
        swayAmp: Math.random() * 0.55 + 0.22,
        swaySpeed: Math.random() * 0.012 + 0.005,
        warm: Math.random() < 0.14,
        burst: false,
      });
    }
  };
  initFlakes();

  const burstSnow = () => {
    const W = snowCanvas.clientWidth || window.innerWidth;
    for (let i = 0; i < 42; i++) {
      flakes.push({
        x: Math.random() * W,
        y: -10 - Math.random() * 40,
        r: Math.random() * 2.4 + 1.1,
        vy: Math.random() * 1.1 + 0.75,
        sway: Math.random() * Math.PI * 2,
        swayAmp: Math.random() * 0.85 + 0.35,
        swaySpeed: Math.random() * 0.02 + 0.008,
        warm: Math.random() < 0.22,
        burst: true,
      });
    }
    // Clamp total flakes so rapid-fire keywords don't leak memory.
    if (flakes.length > 240) flakes.splice(0, flakes.length - 240);
  };

  const drawSnow = () => {
    if (window.__koGen !== MY_GEN) return;
    const W = snowCanvas.clientWidth  || window.innerWidth;
    const H = snowCanvas.clientHeight || window.innerHeight;
    sctx.clearRect(0, 0, W, H);
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      f.y += f.vy;
      f.sway += f.swaySpeed;
      f.x += Math.sin(f.sway) * f.swayAmp;
      if (f.y > H + 10) {
        if (f.burst) { flakes.splice(i, 1); continue; }
        f.y = -8;
        f.x = Math.random() * W;
      }
      if (f.x < -12) f.x = W + 10;
      if (f.x > W + 12) f.x = -10;
      const glowA = 0.45 + Math.sin(f.sway * 2) * 0.12;
      sctx.beginPath();
      sctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      if (f.warm) {
        sctx.fillStyle = `rgba(252, 214, 140, ${glowA + 0.12})`;
        sctx.shadowColor = 'rgba(255, 204, 120, 0.55)';
      } else {
        sctx.fillStyle = `rgba(255, 252, 244, ${glowA + 0.25})`;
        sctx.shadowColor = 'rgba(255, 255, 255, 0.55)';
      }
      sctx.shadowBlur = f.r * 2.3;
      sctx.fill();
      sctx.shadowBlur = 0;
    }
    requestAnimationFrame(drawSnow);
  };
  drawSnow();

})();
