// ============================================================================
// KARAOKE OVERLAY — 威風堂々 (Ifuudoudou) / Miori Celesta cover
// ArRkDBrS1Lg — imperial-decree banner with EKG heartbeat progress
// ============================================================================

(() => {

  const THEME = {
    fontsHref: 'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@500;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,500;1,600&family=Cormorant+SC:wght@500;600&family=Noto+Serif+JP:wght@700;900&display=swap',
    fontJP:    '"Shippori Mincho B1", "Noto Serif JP", serif',
    fontEN:    '"Cormorant Garamond", "Cormorant", serif',
    fontGloss: '"Cormorant SC", serif',
    fontSeal:  '"Noto Serif JP", "Shippori Mincho B1", serif',

    // Palette — pulled from the MV (crimson velvet boudoir, gothic-imperial)
    velvetDeep:  '#2A0712',
    velvetWine:  '#4A1028',
    velvetBlood: '#6E1830',
    velvetGlow:  '#9B1E3C',
    cream:       '#F3E4C8',
    roseTint:    '#E8A8B0',
    gold:        '#D4A34A',
    goldBright:  '#E8BE6C',
    goldDim:     '#8D6B20',
    sage:        '#B5C27A',
    inkShadow:   '#140308',

    // Six chunk colors, all MV-derived, all legible over crimson velvet
    chunkColors: [
      '#F2DDA8',  // 0: warm cream — the base voice color
      '#EF7090',  // 1: rose — her hair streaks
      '#B5C27A',  // 2: sage-olive — her eye color
      '#E9BB5A',  // 3: bright antique gold
      '#F3B5A0',  // 4: peach-blush
      '#D04870',  // 5: mulberry crimson
    ],
  };

  // --- Trusted Types policy (YouTube CSP requires this for innerHTML) ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  // --- State preservation ---
  window.__setlist      = window.__setlist      || [];
  window.__parsedLyrics = window.__parsedLyrics || {};
  window.__transCache   = window.__transCache   || {};
  window.__plainLyrics  = window.__plainLyrics  || {};
  window.__lyricOffsets = window.__lyricOffsets || {};
  window.__wordAlign = window.__wordAlign || {
    colors: THEME.chunkColors.slice(),
    data: {}
  };
  window.__wordAlign.colors = THEME.chunkColors.slice();
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // Banner sits lower on the video than the default — imperial-proclamation
  // feels right pinned near the base, like a decree tacked at eye-level.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.76, widthFrac: 0.70 },
    window.__koPosition || {}
  );

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Clean up prior injection ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Load Google Fonts via <link> ---
  if (THEME.fontsHref && !document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  // ==========================================================================
  // CSS
  // ==========================================================================
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    /* ==== LOCKED PLUMBING ================================================ */
    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      z-index: 2147483100;
      text-align: center;
      transform: translate(-50%, -50%);
    }
    #karaoke-root, #ko-lyrics {
      --ko-velvet-deep:  ${THEME.velvetDeep};
      --ko-velvet-wine:  ${THEME.velvetWine};
      --ko-velvet-blood: ${THEME.velvetBlood};
      --ko-velvet-glow:  ${THEME.velvetGlow};
      --ko-cream:        ${THEME.cream};
      --ko-rose:         ${THEME.roseTint};
      --ko-gold:         ${THEME.gold};
      --ko-gold-bright:  ${THEME.goldBright};
      --ko-gold-dim:     ${THEME.goldDim};
      --ko-sage:         ${THEME.sage};
      --ko-ink:          ${THEME.inkShadow};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-en:      ${THEME.fontEN};
      --ko-font-gloss:   ${THEME.fontGloss};
      --ko-font-seal:    ${THEME.fontSeal};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== BANNER (imperial decree) ======================================= */
    /* Horizontal velvet banner with a double-gilt rule. Ribbon tails extend
       off both short ends via ::before / ::after. Wax seal + EKG are real
       elements because they need JS hooks (seal for static identity; EKG
       cursor position is time-driven). */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 72px 46px 72px;
      background:
        radial-gradient(ellipse 120% 90% at 50% 0%, rgba(155, 30, 60, 0.55) 0%, transparent 70%),
        radial-gradient(ellipse 80% 60% at 50% 100%, rgba(20, 3, 8, 0.65) 0%, transparent 70%),
        repeating-linear-gradient(132deg, rgba(0,0,0,0.08) 0 1.6px, transparent 1.6px 3.2px),
        repeating-linear-gradient(48deg,  rgba(255,200,180,0.04) 0 1.2px, transparent 1.2px 4px),
        linear-gradient(180deg, var(--ko-velvet-wine) 0%, var(--ko-velvet-deep) 100%);
      border: 5px double var(--ko-gold);
      box-shadow:
        inset 0 1px 0 rgba(255, 220, 140, 0.18),
        inset 0 -2px 8px rgba(0, 0, 0, 0.55),
        0 14px 40px rgba(0, 0, 0, 0.55),
        0 0 58px rgba(155, 30, 60, 0.18);
      transition: opacity 400ms ease;
      isolation: isolate;
      overflow: visible;
    }
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
    }

    /* ---- Ribbon tails (V-notched heraldic flares off each short end) ---- */
    #ko-lyrics .ko-slot::before,
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      top: 18px;
      bottom: 18px;
      width: 42px;
      background:
        repeating-linear-gradient(132deg, rgba(0,0,0,0.10) 0 1.6px, transparent 1.6px 3.2px),
        linear-gradient(180deg, #2F0812 0%, #190308 100%);
      box-shadow:
        inset 0 0 0 1.5px var(--ko-gold),
        0 6px 14px rgba(0, 0, 0, 0.5);
      z-index: -1;
      pointer-events: none;
    }
    #ko-lyrics .ko-slot::before {
      left: -36px;
      clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 26% 50%);
    }
    #ko-lyrics .ko-slot::after {
      right: -36px;
      clip-path: polygon(0% 0%, 100% 0%, 74% 50%, 100% 100%, 0% 100%);
    }

    /* ---- Wax seal monogram (威) dangling off the left edge ---- */
    /* Circular gold medallion with embossed 威 — the first kanji of 威風堂々.
       Tilted as if stamped. Separate from the ribbon-tail pseudo-element so
       it sits atop it, reading as a seal affixed to the banner. */
    #ko-lyrics .ko-seal {
      position: absolute;
      left: -28px;
      top: 50%;
      transform: translateY(-50%) rotate(-6deg);
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 30% 28%, #FBE39B 0%, var(--ko-gold-bright) 28%, var(--ko-gold) 58%, var(--ko-gold-dim) 100%);
      box-shadow:
        inset 0 2px 3px rgba(255, 240, 200, 0.55),
        inset 0 -3px 6px rgba(80, 50, 10, 0.65),
        inset 0 0 0 2px rgba(120, 80, 20, 0.4),
        0 5px 14px rgba(0, 0, 0, 0.65),
        0 0 18px rgba(228, 180, 100, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ko-font-seal);
      font-size: 32px;
      font-weight: 900;
      color: #3A1808;
      text-shadow:
        0 1px 0 rgba(255, 230, 170, 0.35),
        0 -1px 0 rgba(60, 30, 5, 0.6);
      letter-spacing: 0;
      line-height: 1;
      padding-bottom: 1px;
      z-index: 3;
      user-select: none;
    }

    /* ---- JP primary lyric ---- */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 800;
      color: var(--ko-cream);
      paint-order: stroke fill;
      -webkit-text-stroke: 4px var(--ko-ink);
      font-size: 38px;
      line-height: 2.2;
      padding-top: 0.55em;
      letter-spacing: 0.04em;
      text-shadow:
        0 2px 8px rgba(20, 3, 8, 0.85),
        0 0 26px rgba(228, 60, 90, 0.22);
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: 4px var(--ko-ink);
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.08em;
      line-height: 1.1;
      padding-bottom: 7px;
      color: var(--ko-cream);
      paint-order: stroke fill;
      -webkit-text-stroke: 2.5px var(--ko-ink);
      text-shadow: 0 1px 4px rgba(20, 3, 8, 0.9), 0 0 10px rgba(212, 163, 74, 0.2);
      text-transform: lowercase;
      font-variant: small-caps;
      font-feature-settings: "smcp" 1;
      user-select: none;
      opacity: 0.96;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* ---- EN editorial italic caption ---- */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 500;
      font-style: italic;
      color: var(--ko-cream);
      paint-order: stroke fill;
      -webkit-text-stroke: 3.5px var(--ko-ink);
      font-size: 27px;
      line-height: 1.25;
      letter-spacing: 0.012em;
      text-shadow:
        0 2px 6px rgba(20, 3, 8, 0.8),
        0 0 20px rgba(212, 163, 74, 0.14);
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      padding-top: 2px;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: 3.5px var(--ko-ink);
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 24px;
      font-weight: 400;
      font-style: normal;
    }
    #ko-lyrics .ko-line-en:not(:empty)::after {
      content: '';
      display: block;
      margin: 5px auto 0;
      width: 34%;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, var(--ko-gold) 50%, transparent 100%);
      opacity: 0.6;
    }

    /* ---- EKG heartbeat progress bar ---- */
    /* Thin gold waveform traced along the bottom inside of the banner, with a
       traveling rose pulse-cursor. The MV's own graphics run an EKG trace
       through multiple scenes; the song's theme is "my heart beats its own
       rhythm" — so the progress bar IS the song's heartbeat. */
    #ko-lyrics .ko-ekg {
      position: absolute;
      left: 72px;
      right: 44px;
      bottom: 14px;
      height: 20px;
      overflow: visible;
      pointer-events: none;
      opacity: 0.82;
      filter: drop-shadow(0 0 3px rgba(228, 176, 92, 0.4));
      z-index: 1;
    }
    #ko-lyrics .ko-ekg-line {
      fill: none;
      stroke: var(--ko-gold-bright);
      stroke-width: 0.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    #ko-lyrics .ko-ekg-line-dim {
      fill: none;
      stroke: var(--ko-gold-dim);
      stroke-width: 0.45;
      stroke-linecap: round;
      opacity: 0.55;
    }
    #ko-lyrics .ko-ekg-cursor {
      position: absolute;
      left: 72px;
      bottom: 19px;
      width: 9px;
      height: 9px;
      transform: translateX(-50%) rotate(45deg);
      background: radial-gradient(circle at 35% 30%, #FFE2E6 0%, var(--ko-velvet-glow) 50%, #5A0A1E 100%);
      border: 0.5px solid rgba(255, 220, 200, 0.8);
      box-shadow:
        0 0 0 1.5px rgba(155, 30, 60, 0.35),
        0 0 12px rgba(228, 50, 80, 0.8),
        0 0 28px rgba(228, 50, 80, 0.4);
      z-index: 4;
      pointer-events: none;
      transition: left 120ms linear;
    }
    /* Line-change heartbeat — no text motion, only the cursor throbs and
       ejects a radial ping. The ring expands and fades. */
    @keyframes ko-heartbeat {
      0%   { transform: translateX(-50%) rotate(45deg) scale(1);   box-shadow: 0 0 0 1.5px rgba(155, 30, 60, 0.35), 0 0 12px rgba(228, 50, 80, 0.8), 0 0 28px rgba(228, 50, 80, 0.4); }
      25%  { transform: translateX(-50%) rotate(45deg) scale(2.1); box-shadow: 0 0 0 3px rgba(228, 70, 100, 0.7),   0 0 28px rgba(255, 90, 120, 1),  0 0 56px rgba(228, 70, 100, 0.7); }
      55%  { transform: translateX(-50%) rotate(45deg) scale(1.35); }
      100% { transform: translateX(-50%) rotate(45deg) scale(1);   box-shadow: 0 0 0 1.5px rgba(155, 30, 60, 0.35), 0 0 12px rgba(228, 50, 80, 0.8), 0 0 28px rgba(228, 50, 80, 0.4); }
    }
    @keyframes ko-ping {
      0%   { opacity: 0.9; transform: translateX(-50%) scale(0.5); }
      100% { opacity: 0;   transform: translateX(-50%) scale(5);   }
    }
    #ko-lyrics .ko-ekg-cursor.kbeat {
      animation: ko-heartbeat 560ms cubic-bezier(.2, .7, .3, 1) both;
    }
    #ko-lyrics .ko-ekg-ping {
      position: absolute;
      left: 72px;
      bottom: 14px;
      width: 24px;
      height: 24px;
      margin-left: -12px;
      border: 1.5px solid rgba(228, 60, 90, 0.7);
      border-radius: 50%;
      opacity: 0;
      transform: translateX(-50%) scale(0.5);
      pointer-events: none;
      z-index: 2;
    }
    #ko-lyrics .ko-ekg-ping.kping {
      animation: ko-ping 700ms cubic-bezier(.2, .8, .4, 1) both;
    }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // EKG SVG path: 6 QRS complexes spaced across 400×24. Flat at y=12 with
  // tiny P-wave dip, sharp R-spike, soft T-wave per beat.
  const ekgPath = [
    'M 0,12 H 22 L 24,10 26,12 H 35 L 36,13 37,3 38,16 39,12 H 47 L 49,10 51,12',
    'H 82 L 84,10 86,12 H 95 L 96,13 97,3 98,16 99,12 H 107 L 109,10 111,12',
    'H 142 L 144,10 146,12 H 155 L 156,13 157,3 158,16 159,12 H 167 L 169,10 171,12',
    'H 202 L 204,10 206,12 H 215 L 216,13 217,3 218,16 219,12 H 227 L 229,10 231,12',
    'H 262 L 264,10 266,12 H 275 L 276,13 277,3 278,16 279,12 H 287 L 289,10 291,12',
    'H 322 L 324,10 326,12 H 335 L 336,13 337,3 338,16 339,12 H 347 L 349,10 351,12',
    'H 400'
  ].join(' ');

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-seal">威</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <svg class="ko-ekg" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
        <path class="ko-ekg-line-dim" d="M 0,12 H 400"/>
        <path class="ko-ekg-line" d="${ekgPath}"/>
      </svg>
      <div class="ko-ekg-ping" id="ko-ekg-ping"></div>
      <div class="ko-ekg-cursor" id="ko-ekg-cursor"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + LRCLib fetching ---
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

  // --- Cached state ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';
  let lastCursorPct = -1;

  // --- Position tick ---
  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const p = window.__koPosition;
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}|${p.anchorX}|${p.anchorY}|${p.widthFrac}`;
    if (posKey !== lastLyricsPos) {
      lastLyricsPos = posKey;
      lyrics.style.left     = (r.left + r.width * p.anchorX) + 'px';
      lyrics.style.top      = (r.top  + r.height * p.anchorY) + 'px';
      lyrics.style.width    = (r.width * p.widthFrac) + 'px';
      lyrics.style.maxWidth = (r.width * p.widthFrac) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

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

    // ---- EKG cursor progress ----
    // The SVG spans from left:72px to right:44px inside the card (card width
    // minus 116px). Write the cursor left as a calc() so it ties to the
    // card's live width rather than a stale px value.
    if (song && songDur > 0) {
      const pct = Math.max(0, Math.min(1, inSong / songDur));
      const pctInt = Math.round(pct * 1000);
      if (pctInt !== lastCursorPct) {
        lastCursorPct = pctInt;
        const cur = document.getElementById('ko-ekg-cursor');
        const ping = document.getElementById('ko-ekg-ping');
        const leftExpr = `calc(72px + (100% - 116px) * ${pct})`;
        if (cur) cur.style.left = leftExpr;
        if (ping) ping.style.left = leftExpr;
      }
    }

    // ---- LRC line lookup ----
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

  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

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

  // --- Line-change heartbeat pulse (no text motion) ---
  let _beatLastStamp = null;
  const BEAT_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(BEAT_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    const cur  = document.getElementById('ko-ekg-cursor');
    const ping = document.getElementById('ko-ekg-ping');
    if (!jpEl || !cur) return;

    const rawJp = jpEl.getAttribute('data-ko-raw-jp') || '';
    const rawEn = jpEl.getAttribute('data-ko-raw-en') || '';
    const liveJp = jpEl.textContent;
    const liveEn = enEl ? enEl.textContent : '';

    let changed = false;
    if (rawJp !== liveJp && !jpEl.querySelector('[data-wc]')) {
      jpEl.setAttribute('data-ko-raw-jp', liveJp);
      if (rawJp !== '' || liveJp.trim() !== '') changed = true;
    } else if (rawEn !== liveEn) {
      jpEl.setAttribute('data-ko-raw-en', liveEn);
      if (rawEn !== '' || liveEn.trim() !== '') changed = true;
    }
    if (!changed) return;

    const stamp = liveJp + '\x00' + liveEn;
    if (stamp === _beatLastStamp) return;
    _beatLastStamp = stamp;

    if (liveJp.trim() || liveEn.trim()) {
      cur.classList.remove('kbeat');
      void cur.offsetWidth;
      cur.classList.add('kbeat');
      if (ping) {
        ping.classList.remove('kping');
        void ping.offsetWidth;
        ping.classList.add('kping');
      }
    }
  }, 60);

})();
