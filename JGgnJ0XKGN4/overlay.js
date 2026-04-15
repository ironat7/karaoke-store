// ============================================================================
// KARAOKE OVERLAY — 「め組のひと」 / 宝鐘マリン cover  (Rats & Star, 1983)
// "The Me-gumi Marquee" — Showa showbiz / VHS city-pop tribute
// ----------------------------------------------------------------------------
// The lyric card is a vintage theater marquee: cream plate rimmed with chasing
// incandescent bulbs on a crimson velvet mount. Top-left: a VHS PLAY▶ badge
// with live song timecode. Top-right: a red Edo-firefighter 「め組」 matoi
// stamp. Outside the card, slow-drifting gold bulb dust. Every element is
// pulled directly from the MV — the HOUSHOU MARINE bulb-arch marquee, the
// VHS PLAY▶ overlay, the 80s Showa city-pop beach aesthetic.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    // --- Fonts: Showa marquee display + VHS mono + Edo brigade bold ---
    fontsHref:   'https://fonts.googleapis.com/css2?family=RocknRoll+One&family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=M+PLUS+Rounded+1c:wght@500;700&family=VT323&family=Oswald:wght@700&display=swap',
    fontDisplay: '"Playfair Display", serif',
    fontBody:    '"M PLUS Rounded 1c", sans-serif',
    fontJP:      '"RocknRoll One", sans-serif',

    // --- Card/decor palette (MV-derived) ---
    cream:      '#F4E5C2',  // marquee plate — ivory
    creamHi:    '#FFF6D5',  // bulb hot-center highlight
    velvet:     '#7A1323',  // curtain / mount crimson
    velvetDeep: '#3A0B13',  // deep velvet shadow
    bulb:       '#FFD76A',  // incandescent amber
    bulbGlow:   '#FFB84A',  // warmer bulb halo
    gold:       '#C89A3A',  // tarnished gold trim
    marineNavy: '#141B3A',  // sailor outfit ink
    vhsGreen:   '#8FFF4D',  // VHS timecode LED
    ink:        '#1B2330',  // body text ink
    cream_soft: 'rgba(244,229,194,0.25)',

    // --- Lyric text: dark ink on cream plate, soft cream halo ---
    lyricColorEN:  '#1B2330',
    lyricColorJP:  '#1B2330',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(255,246,213,0.95), 0 0 10px rgba(255,246,213,0.85)',
    lyricShadowJP: '0 1px 0 rgba(255,246,213,0.95), 0 0 10px rgba(255,246,213,0.85)',
  };

  // --- Trusted Types policy (YouTube CSP requires this for innerHTML) ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  // --- State preservation (survives re-injection) ---
  window.__setlist      = window.__setlist      || [];
  window.__parsedLyrics = window.__parsedLyrics || {};
  window.__transCache   = window.__transCache   || {};
  window.__plainLyrics  = window.__plainLyrics  || {};
  window.__lyricOffsets = window.__lyricOffsets || {};
  // Six MV-derived chunk colors: crimson velvet, marine navy, sunset amber,
  // ribbon emerald, magenta plum, tarnished gold — all dark-saturated to read
  // against the cream marquee plate.
  window.__wordAlign = window.__wordAlign || {
    colors: ['#8B132F', '#14245B', '#B44418', '#1F6B2E', '#6E1589', '#A8721A'],
    data: {}
  };
  // Force-override in case an earlier injection left placeholder gray colors.
  window.__wordAlign.colors = ['#8B132F', '#14245B', '#B44418', '#1F6B2E', '#6E1589', '#A8721A'];
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // --- Generation counter ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Clean up prior injection's leftover DOM ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Load Google Fonts via <link> (CSP blocks @import inside <style>) ---
  if (THEME.fontsHref && !document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  // --- CSS injection ---
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
      overflow: hidden;
    }

    /* CSS vars on both the root and the lyrics (DOM siblings). */
    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-cream-hi:    ${THEME.creamHi};
      --ko-velvet:      ${THEME.velvet};
      --ko-velvet-deep: ${THEME.velvetDeep};
      --ko-bulb:        ${THEME.bulb};
      --ko-bulb-glow:   ${THEME.bulbGlow};
      --ko-gold:        ${THEME.gold};
      --ko-marine:      ${THEME.marineNavy};
      --ko-vhs-green:   ${THEME.vhsGreen};
      --ko-ink:         ${THEME.ink};
      --ko-cream-soft:  ${THEME.cream_soft};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ===== FLOATING BULB-DUST particles ===== */
    .ko-dust {
      position: absolute;
      width: 4px; height: 4px;
      border-radius: 50%;
      background: radial-gradient(circle, ${THEME.creamHi} 0%, ${THEME.bulb} 50%, transparent 100%);
      box-shadow: 0 0 6px ${THEME.bulbGlow}, 0 0 12px rgba(255,184,74,0.5);
      animation: koDustDrift linear infinite;
      opacity: 0.8;
    }
    @keyframes koDustDrift {
      0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
      15%  { opacity: 0.9; }
      85%  { opacity: 0.9; }
      100% { transform: translate(var(--dx, 20px), -120vh) scale(1.1); opacity: 0; }
    }

    /* ===== SIDE LABELS pinned to video edges ===== */
    .ko-side-label {
      position: absolute;
      transform-origin: center;
      font-family: 'Oswald', sans-serif;
      font-weight: 700;
      letter-spacing: 0.8em;
      font-size: 14px;
      color: rgba(244,229,194,0.55);
      text-shadow: 0 0 8px rgba(255,184,74,0.4), 0 0 2px rgba(0,0,0,0.6);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
    }
    .ko-side-label.right { transform: translate(-100%, -50%) rotate(90deg); transform-origin: right center; }
    .ko-side-label.left  { transform: translate(0, -50%) rotate(-90deg); transform-origin: left center; }

    /* ============================================================
       LYRIC CARD
       ============================================================ */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }

    /* Outer crimson velvet mount */
    #ko-lyrics .marquee-frame {
      position: relative;
      padding: 14px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(255,215,106,0.12) 0%, transparent 55%),
        linear-gradient(180deg, ${THEME.velvet} 0%, ${THEME.velvetDeep} 100%);
      border-radius: 8px;
      box-shadow:
        0 0 0 2px ${THEME.gold},
        0 0 0 4px ${THEME.velvetDeep},
        0 8px 30px rgba(0,0,0,0.55),
        0 0 60px rgba(255,184,74,0.22);
      isolation: isolate;
    }
    /* velvet stitch pattern inside the mount */
    #ko-lyrics .marquee-frame::before {
      content: '';
      position: absolute; inset: 2px;
      border: 1px dashed rgba(200,154,58,0.45);
      border-radius: 6px;
      pointer-events: none;
    }

    /* Bulb border — 4 strips of incandescent bulbs chasing around */
    #ko-lyrics .bulb-strip {
      position: absolute;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
    }
    #ko-lyrics .bulb-strip.top    { top:    7px; left: 20px; right: 20px; height: 8px; }
    #ko-lyrics .bulb-strip.bottom { bottom: 7px; left: 20px; right: 20px; height: 8px; }
    #ko-lyrics .bulb-strip.left   { top: 20px; bottom: 20px; left:  7px; width: 8px; flex-direction: column; }
    #ko-lyrics .bulb-strip.right  { top: 20px; bottom: 20px; right: 7px; width: 8px; flex-direction: column; }

    #ko-lyrics .bulb {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: radial-gradient(circle, ${THEME.creamHi} 0%, ${THEME.bulb} 40%, ${THEME.bulbGlow} 70%, #6E3C10 100%);
      box-shadow: 0 0 4px rgba(255,184,74,0.4);
      animation: koBulbChase 2.2s linear infinite;
      flex-shrink: 0;
    }
    @keyframes koBulbChase {
      0%, 55%  { box-shadow: 0 0 4px rgba(255,184,74,0.4);
                 background: radial-gradient(circle, ${THEME.creamHi} 0%, ${THEME.bulb} 40%, ${THEME.bulbGlow} 70%, #6E3C10 100%); }
      20%, 30% { box-shadow: 0 0 10px ${THEME.bulb}, 0 0 20px ${THEME.bulbGlow}, 0 0 32px rgba(255,215,106,0.6);
                 background: radial-gradient(circle, #FFFFFF 0%, ${THEME.creamHi} 30%, ${THEME.bulb} 70%, ${THEME.bulbGlow} 100%); }
    }

    /* Cream marquee plate */
    #ko-lyrics .marquee-plate {
      position: relative;
      padding: 26px 34px 22px;
      border-radius: 4px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(122,19,35,0.12) 0%, transparent 60%),
        radial-gradient(ellipse at 50% 100%, rgba(122,19,35,0.10) 0%, transparent 60%),
        linear-gradient(180deg, ${THEME.creamHi} 0%, ${THEME.cream} 50%, #E4D3A8 100%);
      box-shadow:
        inset 0 0 0 1px rgba(200,154,58,0.6),
        inset 0 2px 12px rgba(122,19,35,0.10),
        inset 0 -1px 0 rgba(122,19,35,0.18);
      overflow: hidden;
    }

    /* VHS scanlines (subtle, multiply-blended) */
    #ko-lyrics .marquee-plate::after {
      content: '';
      position: absolute; inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(
        180deg,
        rgba(0,0,0,0.045) 0px,
        rgba(0,0,0,0.045) 1px,
        transparent 1px,
        transparent 3px
      );
      mix-blend-mode: multiply;
      opacity: 0.9;
      animation: koScanDrift 7s linear infinite;
    }
    @keyframes koScanDrift {
      0%   { background-position: 0 0; }
      100% { background-position: 0 60px; }
    }

    /* Warm vignette at the top of the plate */
    #ko-lyrics .marquee-plate::before {
      content: '';
      position: absolute;
      left: 0; right: 0; top: 0;
      height: 38%;
      background: linear-gradient(180deg,
        rgba(255,215,106,0.22) 0%,
        rgba(255,215,106,0.08) 30%,
        transparent 100%);
      pointer-events: none;
    }

    /* ----- HUD: top-left PLAY▶ + timecode ----- */
    #ko-lyrics .hud-left {
      position: absolute;
      top: 8px; left: 14px;
      display: flex;
      gap: 8px;
      align-items: center;
      font-family: 'VT323', monospace;
      font-size: 16px;
      letter-spacing: 0.06em;
      z-index: 3;
      user-select: none;
    }
    #ko-lyrics .hud-play,
    #ko-lyrics .hud-tc {
      color: ${THEME.vhsGreen};
      text-shadow: 0 0 4px rgba(143,255,77,0.7), 0 0 1px rgba(0,0,0,0.5);
      font-weight: 400;
    }
    #ko-lyrics .hud-tc {
      min-width: 11ch;
      font-variant-numeric: tabular-nums;
    }
    #ko-lyrics .hud-rec {
      display: inline-block;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #E11A5C;
      box-shadow: 0 0 5px #E11A5C;
      animation: koRecBlink 1.1s steps(2, jump-none) infinite;
    }
    @keyframes koRecBlink {
      0%, 49%   { opacity: 1; }
      50%, 100% { opacity: 0.25; }
    }

    /* ----- HUD: top-right め組 matoi brigade stamp ----- */
    #ko-lyrics .hud-right {
      position: absolute;
      top: 6px; right: 14px;
      z-index: 3;
      user-select: none;
    }
    #ko-lyrics .matoi {
      position: relative;
      width: 40px; height: 44px;
      background: ${THEME.velvet};
      border: 1.5px solid ${THEME.gold};
      box-shadow:
        0 0 0 1px ${THEME.velvetDeep},
        0 2px 6px rgba(0,0,0,0.35),
        inset 0 0 4px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
      transform: rotate(-3deg);
    }
    /* matoi pole */
    #ko-lyrics .matoi::before {
      content: '';
      position: absolute;
      top: -6px; left: 50%;
      transform: translateX(-50%);
      width: 2px; height: 8px;
      background: ${THEME.gold};
    }
    #ko-lyrics .matoi span {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      font-size: 15px;
      line-height: 1;
      color: ${THEME.cream};
      text-shadow: 0 1px 0 ${THEME.velvetDeep}, 0 0 4px rgba(255,215,106,0.4);
      writing-mode: vertical-rl;
      letter-spacing: 0.05em;
    }

    /* ----- Main lyric slot ----- */
    #ko-lyrics .ko-slot {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding-top: 6px;
    }

    /* JP line — bold Showa display face on cream plate */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.3;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-body);
      font-size: 22px;
      font-weight: 500;
      letter-spacing: 0.015em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 1px 0 rgba(255,246,213,0.95), 0 0 4px rgba(255,246,213,0.9);
      user-select: none;
      opacity: 0.92;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Playfair Display italic, city-pop retro elegance */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 700;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.15;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 30px;
      font-weight: 400;
    }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // Side labels (positioned later by tick)
  const sideL = document.createElement('div');
  sideL.className = 'ko-side-label left';
  sideL.textContent = 'MEGUMI NO HITO';
  const sideR = document.createElement('div');
  sideR.className = 'ko-side-label right';
  sideR.textContent = 'MEGUMI NO HITO';
  root.appendChild(sideL);
  root.appendChild(sideR);

  // Drifting bulb-dust particles
  const spawnDust = () => {
    if (window.__koGen !== MY_GEN) return;
    const d = document.createElement('div');
    d.className = 'ko-dust';
    d.style.left = (Math.random() * 100) + 'vw';
    d.style.top = '100vh';
    d.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
    d.style.animationDuration = (9 + Math.random() * 10) + 's';
    d.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
    root.appendChild(d);
    setTimeout(() => d.remove(), 20000);
    setTimeout(spawnDust, 450 + Math.random() * 550);
  };
  spawnDust();

  // Lyric card
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  const bulbs = (count) => Array.from({length: count}, (_, i) =>
    `<span class="bulb" style="animation-delay:${(i * 0.12).toFixed(2)}s"></span>`
  ).join('');
  setHTML(lyrics, `
    <div class="marquee-frame">
      <div class="bulb-strip top">${bulbs(18)}</div>
      <div class="bulb-strip bottom">${bulbs(18)}</div>
      <div class="bulb-strip left">${bulbs(6)}</div>
      <div class="bulb-strip right">${bulbs(6)}</div>
      <div class="marquee-plate">
        <div class="hud-left">
          <span class="hud-rec"></span>
          <span class="hud-play">&#9654; PLAY</span>
          <span class="hud-tc" id="ko-tc">00:00:00:00</span>
        </div>
        <div class="hud-right">
          <div class="matoi"><span>め組</span></div>
        </div>
        <div class="ko-slot">
          <div class="ko-line-jp" id="ko-line-jp"></div>
          <div class="ko-line-en" id="ko-line-en"></div>
        </div>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + LRCLib fetching (in-browser fallback) ---
  const parseLRC = (txt) => {
    const lines = [];
    for (const line of txt.split('\n')) {
      const m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
      if (!m) continue;
      const sec = Number(m[1]) * 60 + Number(m[2]);
      let text = m[3].trim();
      // Strip backup call-and-response parentheticals
      text = text.replace(/\s*\(Baby,?\s*baby,?\s*be\s*my\s*girl\)/ig, '').trim();
      text = text.replace(/\s*\(eye eye eye\)/ig, '').trim();
      if (!text) continue;
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

  // --- Cached state for DOM-write guards ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';
  let lastTc = '';
  let lastSideKey = '';

  // --- Position tick ---
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
    }
    const sideKey = `${r.left}|${r.top}|${r.height}`;
    if (sideKey !== lastSideKey) {
      lastSideKey = sideKey;
      sideL.style.left = (r.left + 20) + 'px';
      sideL.style.top  = (r.top + r.height / 2) + 'px';
      sideR.style.left = (r.left + r.width - 20) + 'px';
      sideR.style.top  = (r.top + r.height / 2) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- VHS timecode ticker ---
  const formatTc = (t) => {
    if (!isFinite(t) || t < 0) t = 0;
    const mm = Math.floor(t / 60);
    const ss = Math.floor(t % 60);
    const ff = Math.floor((t % 1) * 30);
    const pad = n => String(n).padStart(2, '0');
    return `00:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
  };
  const tcTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    const sl = window.__setlist;
    let t = 0;
    if (v && isFinite(v.currentTime)) {
      const song = curSongIdx >= 0 ? sl[curSongIdx] : null;
      t = song ? (v.currentTime - song.s) : v.currentTime;
    }
    const tc = formatTc(t);
    if (tc !== lastTc) {
      lastTc = tc;
      const el = document.getElementById('ko-tc');
      if (el) el.textContent = tc;
    }
    setTimeout(tcTick, 60);
  };
  tcTick();

  // --- Main tick ---
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

  // --- Offset hotkeys: [ ] \ ---
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

  // --- Timestamp-keyed translation merge ---
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

  // --- Color + gloss colorizer ---
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

})();
