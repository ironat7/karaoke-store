// ============================================================================
// KARAOKE OVERLAY — DECO*27「チェリーポップ」feat. 初音ミク
// ----------------------------------------------------------------------------
// Aesthetic: the MV is a pink-gingham scrapbook of Miku stickers with chunky
// dark-teal burned-in kana punching across the backdrop (迷子 / ちね / すきすき? /
// ベイビー / 愛していい感). Red-gingham bow, cherry earrings, mint stem hairband,
// chibi speech bubbles. The overlay is a washi-taped card torn from that same
// scrapbook page — same gingham, same teal, same chunky sans, same cherry.
//
// Signature: a cherry-stem progress bar arches above the card top edge. A
// single cherry rides left→right along the stem as the song plays, and —
// crucially — RIPENS. Pale cream-pink at 0%, deep cherry-red at 100%, color-
// mixed through the whole duration. Functional (encodes time) AND thematic
// (the song's literal metaphor: "cherry pop" = first love, ripening, etc.).
//
// Line changes are deliberately motionless — per the anti-pattern rule in
// SKILL.md, text motion on rapid lyric lines reads as tics. The card is
// quietly alive through the cherry's travel + the empty-state collapse.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Cherry Pop palette
  // ==========================================================================
  const THEME = {
    trackTag:   'チェリーポップ',
    artistTag:  'DECO*27 × 初音ミク',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Mochiy+Pop+One&' +
      'family=Dela+Gothic+One&' +
      'family=Fredoka:wght@500;600;700&' +
      'family=Noto+Sans+JP:wght@400;600&' +
      'display=swap',
    fontJP:       '"Mochiy Pop One", "Dela Gothic One", sans-serif',
    fontJPHeavy:  '"Dela Gothic One", "Mochiy Pop One", sans-serif',
    fontEN:       '"Fredoka", system-ui, sans-serif',
    fontGloss:    '"Noto Sans JP", system-ui, sans-serif',

    // Palette — every hex pulled directly from an MV frame.
    bgPinkLight:  '#FFEEF1',  // white square of the gingham
    bgPinkMed:    '#F9C6CF',  // medium pink square
    bgPinkDark:   '#E77B8E',  // darker gingham overlap (where stripes cross)
    hatchPink:    'rgba(222, 82, 112, 0.22)',  // diagonal hatch inside pink squares

    teal:         '#1F5A5B',  // burned-in kana color, main text, border
    tealDeep:     '#123D3E',  // shadow / deeper strokes
    tealInk:      '#2D7778',  // softer teal for gloss

    cream:        '#FFF8EE',  // washi tape highlight, card highlight
    creamEdge:    '#F7E9D4',

    cherry:       '#C41E3A',  // ripe cherry / gingham bow
    cherryDeep:   '#8A0E26',  // cherry shadow
    cherryPale:   '#F9D0C7',  // unripe cherry
    leafGreen:    '#3F7A4E',  // cherry stem, MV headband

    hairBlue:     '#B9DFED',  // Miku hair (subtle accent only)

    // Typography
    lyricFontSizeJP:     '56px',
    lyricLineHeightJP:   '2.1',
    lyricLetterSpacingJP:'0.04em',
    lyricFontSizeEN:     '30px',
    lyricLineHeightEN:   '1.25',
    lyricLetterSpacingEN:'0.01em',
    glossFontSize:       '19px',
    glossFontWeight:     '600',

    // Card shape
    cardRadius:  '14px',
    cardPadding: '32px 44px 30px',
    cardTilt:    '-1.4deg',

    // chunkColors: 6 slots. All dark+saturated enough to sit legibly on the
    // pink gingham card. Drawn from the MV: teal (main), cherry red, deep
    // wine, leaf green, amber, deep blueberry.
    chunkColors: [
      '#1F5A5B',  // 0 — teal (primary / narrator voice)
      '#C41E3A',  // 1 — cherry red (desire / verbs of love)
      '#8A1F55',  // 2 — wine plum (nuance / the darker subtext)
      '#3F7A4E',  // 3 — leaf green (object / concrete)
      '#B0651C',  // 4 — amber (time / motion)
      '#2F4FA0',  // 5 — deep blueberry (intimacy / cool)
    ],
  };

  // --- Trusted Types policy (YouTube CSP requires this for innerHTML) ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  // --- State preservation (survives re-injection) ---
  window.__setlist         = window.__setlist         || [];
  window.__parsedLyrics    = window.__parsedLyrics    || {};
  window.__transCache      = window.__transCache      || {};
  window.__plainLyrics     = window.__plainLyrics     || {};
  window.__lyricOffsets    = window.__lyricOffsets    || {};
  window.__wordAlign = window.__wordAlign || {
    colors: THEME.chunkColors.slice(),
    data: {}
  };
  window.__wordAlign.colors = THEME.chunkColors.slice();
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // Position — Cherry Pop sits slightly lower (0.72) to leave space for the
  // cherry stem progress bar above the card.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.72, widthFrac: 0.60 },
    window.__koPosition || {}
  );

  // --- Generation counter + runtime knobs ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Clean up any prior injection's leftover DOM ---
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

  // ==========================================================================
  // CSS
  // ==========================================================================
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    /* ==== LOCKED PLUMBING ===================================================*/
    #karaoke-root {
      position: fixed; inset: 0;
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
      --ko-teal:       ${THEME.teal};
      --ko-teal-deep:  ${THEME.tealDeep};
      --ko-teal-ink:   ${THEME.tealInk};
      --ko-cherry:     ${THEME.cherry};
      --ko-cherry-deep:${THEME.cherryDeep};
      --ko-cherry-pale:${THEME.cherryPale};
      --ko-leaf:       ${THEME.leafGreen};
      --ko-cream:      ${THEME.cream};
      --ko-cream-edge: ${THEME.creamEdge};
      --ko-pink-lt:    ${THEME.bgPinkLight};
      --ko-pink-md:    ${THEME.bgPinkMed};
      --ko-pink-dk:    ${THEME.bgPinkDark};
      --ko-hatch:      ${THEME.hatchPink};
      --ko-hair:       ${THEME.hairBlue};

      --ko-font-jp:    ${THEME.fontJP};
      --ko-font-jp-hv: ${THEME.fontJPHeavy};
      --ko-font-en:    ${THEME.fontEN};
      --ko-font-gloss: ${THEME.fontGloss};

      --ko-ripe: 0;     /* 0.0 (unripe, pale) → 1.0 (ripe, deep), updated by tick */
      --ko-progress: 0; /* 0.0 → 1.0 horizontal position fraction, updated by tick */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — GINGHAM-TAPED SCRAPBOOK CUTOUT ==========================
       Gingham built with two perpendicular 50% semi-opaque stripes that
       double-up to form the darker squares, plus a diagonal hatch layer
       that matches the MV's pink-square striping. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: ${THEME.cardPadding};
      background:
        repeating-linear-gradient(
          45deg,
          transparent 0, transparent 4px,
          var(--ko-hatch) 4px, var(--ko-hatch) 6px
        ),
        linear-gradient(
          to right,
          transparent 0, transparent 50%,
          rgba(231, 119, 140, 0.58) 50%, rgba(231, 119, 140, 0.58) 100%
        ) 0 0 / 38px 38px repeat,
        linear-gradient(
          to bottom,
          transparent 0, transparent 50%,
          rgba(231, 119, 140, 0.58) 50%, rgba(231, 119, 140, 0.58) 100%
        ) 0 0 / 38px 38px repeat,
        var(--ko-pink-lt);
      border: 3px solid var(--ko-cream);
      border-radius: ${THEME.cardRadius};
      box-shadow:
        0 0 0 2px var(--ko-teal),
        0 18px 42px -12px rgba(60, 20, 30, 0.55),
        inset 0 0 0 1px rgba(255, 255, 255, 0.35);
      transform: rotate(${THEME.cardTilt});
      transition: transform 320ms cubic-bezier(.2,.7,.3,1), opacity 380ms;
      isolation: isolate;
      overflow: visible;
    }

    /* Empty-state collapse during instrumental gaps. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardTilt}) scale(0.88);
    }

    /* ==== CHERRY-STEM PROGRESS BAR — the signature ========================
       SVG stem arches above the card top edge. The .ko-cherry div rides
       left→right via --ko-progress, and ripens pale→deep via --ko-ripe
       using color-mix(). */
    #ko-lyrics .ko-stem {
      position: absolute;
      top: -34px;
      left: -8px;
      right: -8px;
      height: 52px;
      pointer-events: none;
      z-index: 3;
      overflow: visible;
    }
    #ko-lyrics .ko-stem svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
    }
    #ko-lyrics .ko-stem-path {
      fill: none;
      stroke: var(--ko-leaf);
      stroke-width: 3.5;
      stroke-linecap: round;
      filter: drop-shadow(0 1.5px 0 rgba(0, 0, 0, 0.12));
    }
    #ko-lyrics .ko-stem-leaf-1,
    #ko-lyrics .ko-stem-leaf-2 {
      fill: var(--ko-leaf);
      filter: drop-shadow(0 1.5px 0 rgba(0, 0, 0, 0.12));
    }
    #ko-lyrics .ko-stem-leaf-hl {
      fill: rgba(255, 255, 255, 0.45);
      stroke: none;
    }

    /* The cherry — rounded div. Left interpolated via --ko-progress, color
       mixed between pale and ripe via --ko-ripe. */
    #ko-lyrics .ko-cherry {
      position: absolute;
      top: 22px;
      left: calc(8px + (100% - 46px) * var(--ko-progress));
      width: 30px; height: 30px;
      border-radius: 50%;
      background:
        radial-gradient(
          circle at 35% 30%,
          rgba(255, 255, 255, 0.7) 0%,
          rgba(255, 255, 255, 0) 28%
        ),
        radial-gradient(
          circle at 50% 50%,
          color-mix(in oklab, ${THEME.cherryPale}, ${THEME.cherry} calc(var(--ko-ripe) * 100%)) 0%,
          color-mix(in oklab, ${THEME.cherryPale}, ${THEME.cherryDeep} calc(var(--ko-ripe) * 100%)) 100%
        );
      box-shadow:
        0 3px 0 0 color-mix(in oklab, ${THEME.cherryPale}, ${THEME.cherryDeep} calc(var(--ko-ripe) * 100%)),
        0 6px 10px -4px rgba(40, 0, 10, 0.4),
        inset -2px -3px 4px rgba(120, 0, 20, 0.25);
      transition: left 350ms linear, background 2s linear, box-shadow 2s linear;
      z-index: 4;
    }
    /* Tiny stem connecting cherry-top to the main stem path. */
    #ko-lyrics .ko-cherry::before {
      content: '';
      position: absolute;
      top: -16px; left: 50%;
      width: 2px; height: 18px;
      background: var(--ko-leaf);
      border-radius: 1px;
      transform: translateX(-50%) rotate(-8deg);
      transform-origin: bottom center;
    }

    /* Fixed leaf cluster (doesn't move with cherry — decorative, pinned to
       the stem's highest arc point around 50% horizontal). */
    #ko-lyrics .ko-leaves {
      position: absolute;
      top: 6px;
      left: 46%;
      width: 38px;
      height: 22px;
      pointer-events: none;
      transform: rotate(-6deg);
    }

    /* ==== WASHI TAPE CORNERS — red gingham strips ========================= */
    #ko-lyrics .ko-washi {
      position: absolute;
      width: 86px; height: 22px;
      background:
        linear-gradient(to right, transparent 0, transparent 50%,
          rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.45) 100%) 0 0 / 8px 8px repeat,
        linear-gradient(to bottom, transparent 0, transparent 50%,
          rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.45) 100%) 0 0 / 8px 8px repeat,
        ${THEME.cherry};
      opacity: 0.92;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
      z-index: 2;
    }
    #ko-lyrics .ko-washi.tl {
      top: -12px;
      left: -26px;
      transform: rotate(-28deg);
    }
    #ko-lyrics .ko-washi.br {
      bottom: -12px;
      right: -26px;
      transform: rotate(-28deg);
    }

    /* ==== TITLE STICKER — teal speech-bubble tag ========================== */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -22px;
      right: 30px;
      padding: 6px 14px 7px;
      background: var(--ko-teal);
      color: var(--ko-cream);
      font-family: var(--ko-font-jp-hv);
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0.08em;
      border-radius: 14px;
      border: 2.5px solid var(--ko-cream);
      transform: rotate(3.5deg);
      box-shadow:
        0 3px 0 0 var(--ko-teal-deep),
        0 6px 10px -4px rgba(0, 0, 0, 0.35);
      z-index: 5;
      white-space: nowrap;
    }
    #ko-lyrics .ko-tag::after {
      content: '';
      position: absolute;
      bottom: -9px; left: 16px;
      width: 14px; height: 14px;
      background: var(--ko-teal);
      border-right: 2.5px solid var(--ko-cream);
      border-bottom: 2.5px solid var(--ko-cream);
      border-bottom-right-radius: 4px;
      transform: rotate(45deg);
      z-index: -1;
    }

    /* ==== ARTIST CREDIT — bottom-left handwritten label =================== */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -18px;
      left: 26px;
      padding: 3px 10px 4px;
      background: var(--ko-cream);
      color: var(--ko-teal);
      font-family: var(--ko-font-en);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      border-radius: 4px;
      border: 1.5px solid var(--ko-teal);
      transform: rotate(-2.5deg);
      box-shadow: 0 2px 0 0 var(--ko-teal-deep);
      z-index: 2;
    }

    /* ==== LYRICS — chunky teal JP, rounded cream EN ======================= */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: var(--ko-teal);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.6em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      text-shadow:
        0 2px 0 rgba(255, 248, 238, 0.5),
        0 0 14px rgba(255, 248, 238, 0.45);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — small teal-ink label above each morpheme. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: var(--ko-teal-ink);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.90;
      text-shadow: 0 1px 0 rgba(255, 248, 238, 0.6);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Fredoka rounded, teal-deep on cream-halo. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 600;
      color: var(--ko-teal-deep);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      text-shadow:
        0 2px 0 rgba(255, 248, 238, 0.55),
        0 0 10px rgba(255, 248, 238, 0.4);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.9);
      font-weight: 500;
    }
    /* Thin gingham-red hairline under the EN line. */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 4px;
      margin-top: 2px;
      background:
        linear-gradient(90deg, transparent 8%, rgba(196, 30, 58, 0.35) 50%, transparent 92%)
        bottom / 100% 1.5px no-repeat;
    }

    /* ==== HEART CONFETTI — tiny cherry-red hearts at card edges ========== */
    #ko-lyrics .ko-heart {
      position: absolute;
      width: 14px; height: 14px;
      color: var(--ko-cherry);
      font-family: sans-serif;
      font-size: 18px;
      line-height: 1;
      text-align: center;
      pointer-events: none;
      opacity: 0.88;
      z-index: 2;
      text-shadow: 0 1px 0 rgba(255,255,255,0.8);
    }
    #ko-lyrics .ko-heart.h1 { bottom: -8px; left: 38%;  transform: rotate(-14deg); }
    #ko-lyrics .ko-heart.h2 { top: 38%;     right: -14px; transform: rotate(18deg); }
    #ko-lyrics .ko-heart.h3 { top: 58%;     left: -14px;  transform: rotate(-10deg); }
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // Cherry-stem SVG: a gentle upward arc across the top of the card.
  const stemSvg = `
    <svg viewBox="0 0 100 12" preserveAspectRatio="none">
      <path class="ko-stem-path" d="M 1 10 Q 25 2, 50 4 T 99 10"
            vector-effect="non-scaling-stroke"/>
    </svg>`;

  // Decorative leaves pinned near the stem's peak.
  const leavesSvg = `
    <svg class="ko-leaves" viewBox="0 0 40 24">
      <path class="ko-stem-leaf-1" d="M 4 14 Q 12 2, 20 6 Q 14 14, 4 14 Z"/>
      <path class="ko-stem-leaf-hl" d="M 8 12 Q 13 6, 18 7"
            fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.2"/>
      <path class="ko-stem-leaf-2" d="M 20 18 Q 30 10, 38 16 Q 30 22, 20 18 Z"/>
      <path class="ko-stem-leaf-hl" d="M 23 17 Q 29 13, 34 15"
            fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.2"/>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-stem">
        ${stemSvg}
        ${leavesSvg}
        <div class="ko-cherry" id="ko-cherry"></div>
      </div>
      <div class="ko-washi tl"></div>
      <div class="ko-washi br"></div>
      <div class="ko-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
      <div class="ko-heart h1">&hearts;</div>
      <div class="ko-heart h2">&hearts;</div>
      <div class="ko-heart h3">&hearts;</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
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
  let lastRipeQ = -1;
  let lastProgQ = -1;

  // --- Position tick: re-anchor the lyric zone to the video rect ---
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

  // --- Main tick: update lyric text + cherry progress ---
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

    // ---- Song change block ----
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

    // ---- Cherry progress update (guarded) ----
    // Write only when quantized value changed → ~200 writes over the song.
    if (song && songDur > 0) {
      const progFrac = Math.max(0, Math.min(1, inSong / songDur));
      // Ripening ramp: stays pale for the first ~12% (intro), fully ripe
      // by ~92% (gives the cherry a moment to sit full-red at the end).
      const ripe = Math.max(0, Math.min(1, (progFrac - 0.12) / 0.80));
      const pQ = Math.round(progFrac * 200);
      const rQ = Math.round(ripe * 200);
      if (pQ !== lastProgQ) {
        lastProgQ = pQ;
        lyrics.style.setProperty('--ko-progress', progFrac.toFixed(4));
      }
      if (rQ !== lastRipeQ) {
        lastRipeQ = rQ;
        lyrics.style.setProperty('--ko-ripe', ripe.toFixed(4));
      }
    }

    // ---- LRC line lookup + display ----
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

  // --- Dual loop: RAF for smoothness, setInterval for background-tab coverage ---
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

})();
