// ============================================================================
// KARAOKE OVERLAY — ダイダイダイダイダイキライ (Amala · cover Baelz × Kronii)
// ----------------------------------------------------------------------------
// World: a corrupted CRT/VHS broadcast transmitting on dueling RED (Baelz)
// and CYAN (Kronii) channels. The card IS a cable-TV dashboard tuning between
// the two. Signature feature: the card's top edge is a 6-segment "ダイキライ
// progress dial" — 5 ダイ + 1 キライ — filling left-to-right as song plays.
// Functional (IS the progress bar) and thematic (the song's core wordplay).
// No motion on lyric text (per skill anti-pattern); only the REC dot blinks
// and the dial fills continuously from song time.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    // Broadcast labels ------------------------------------------------------
    channelLeft:  'CH·B',
    channelRight: 'CH·K',
    trackLabel:   'TRACK 01 · AMALA',
    signalLabel:  '⚠ SIGNAL UNSTABLE',
    dialSegments: ['ダイ','ダイ','ダイ','ダイ','ダイ','キライ'],

    // Fonts (CSP: loaded via <link rel=stylesheet>, NOT @import) ------------
    fontsHref: 'https://fonts.googleapis.com/css2?family=Rampart+One&family=Pixelify+Sans:wght@400;500;600;700&family=VT323&family=Press+Start+2P&family=DotGothic16&display=swap',
    fontJP:       '"Rampart One", "Noto Sans JP", sans-serif',
    fontEN:       '"Pixelify Sans", "VT323", monospace',
    fontPixel:    '"Press Start 2P", monospace',
    fontTerminal: '"VT323", ui-monospace, monospace',
    fontMono:     '"VT323", ui-monospace, monospace',

    // Palette — pulled straight from the MV frames --------------------------
    red:       '#F93B5E',   // Baelz saturated red (coat, hair)
    redDeep:   '#A00022',   // her deep shadow red
    pink:      '#FFA0BC',   // her collar / cheek pink
    blue:      '#1A3FF7',   // Kronii saturated deep blue
    cyan:      '#3DEFFF',   // her neon eye-glow cyan
    amber:     '#FFB84D',   // the locker-floor yellow accent
    cream:     '#F4E6C8',   // locker-room warm cream
    night:     '#070713',   // near-black
    wine:      '#1F0815',   // deep-wine backdrop
    inkSoft:   '#8B7A8A',   // muted typographic grey

    // Chunk palette — 6 slots, all MV-derived, high contrast on dark card
    chunkColors: [
      '#FF3B5C',  // 0 — Baelz red (primary heat)
      '#3DEFFF',  // 1 — Kronii cyan (primary cool)
      '#FFB84D',  // 2 — amber accent
      '#FFA0BC',  // 3 — Baelz pink
      '#C3FFD4',  // 4 — mint glow
      '#D6B0FF',  // 5 — CRT bleed lavender
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

  // Slightly higher than default 0.66 so the card sits in the lower third
  // without stacking onto the MV's burned-in subs at ~88% Y.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.68, widthFrac: 0.66 },
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

    /* ==== LOCKED PLUMBING ============================================== */
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
    /* CSS vars MUST live on BOTH selectors — #ko-lyrics is a body sibling
       of #karaoke-root, not a descendant. */
    #karaoke-root, #ko-lyrics {
      --ko-red:      ${THEME.red};
      --ko-red-deep: ${THEME.redDeep};
      --ko-pink:     ${THEME.pink};
      --ko-blue:     ${THEME.blue};
      --ko-cyan:     ${THEME.cyan};
      --ko-amber:    ${THEME.amber};
      --ko-cream:    ${THEME.cream};
      --ko-night:    ${THEME.night};
      --ko-wine:     ${THEME.wine};
      --ko-ink-soft: ${THEME.inkSoft};

      --ko-font-jp:       ${THEME.fontJP};
      --ko-font-en:       ${THEME.fontEN};
      --ko-font-pixel:    ${THEME.fontPixel};
      --ko-font-terminal: ${THEME.fontTerminal};
      --ko-font-mono:     ${THEME.fontMono};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD ========================================================= */
    #ko-lyrics .ko-slot {
      position: relative;
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto auto auto;
      grid-template-areas:
        "dial   dial   dial"
        "chL    meta   chR"
        "chL    lyrics chR"
        "status status status";
      gap: 0;
      padding: 0;
      background:
        /* halftone red dots */
        radial-gradient(circle at 1px 1px, rgba(249, 59, 94, 0.09) 0.9px, transparent 1.6px) 0 0 / 4px 4px,
        /* halftone cyan dots, offset */
        radial-gradient(circle at 1px 1px, rgba(61, 239, 255, 0.07) 0.9px, transparent 1.6px) 2px 2px / 4px 4px,
        /* scanlines */
        repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.35) 0 1px, transparent 1px 3px),
        /* soft top-down gradient from wine to night */
        linear-gradient(180deg, rgba(31, 8, 21, 0.95) 0%, rgba(7, 7, 19, 0.97) 60%, rgba(12, 2, 14, 0.98) 100%);
      border: 2px solid var(--ko-red);
      border-radius: 3px;
      box-shadow:
        /* chromatic cyan ghost, offset right */
        4px 0 0 -1px rgba(61, 239, 255, 0.55),
        /* chromatic pink ghost, offset left */
        -4px 0 0 -1px rgba(255, 160, 188, 0.45),
        /* deep shadow */
        0 24px 48px -16px rgba(0, 0, 0, 0.88),
        /* inner red glow */
        inset 0 0 0 1px rgba(249, 59, 94, 0.18),
        inset 0 0 60px rgba(160, 0, 34, 0.22);
      backdrop-filter: blur(1.5px) saturate(1.15);
      -webkit-backdrop-filter: blur(1.5px) saturate(1.15);
      isolation: isolate;
      overflow: visible;
      transition: opacity 400ms ease-out;
    }
    /* Instrumental collapse */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0.12;
    }

    /* ==== DAI-KIRAI PROGRESS DIAL (THE SIGNATURE) =====================
       6 segments above the card, labeled in kana beneath each segment.
       Each segment has: a background track, a fill layer (width: inline-
       styled by updateDial from 0-100%), and a kana label underneath.
       The card's top border effectively IS this dial.                   */
    #ko-lyrics .ko-dial {
      grid-area: dial;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 2px;
      padding: 6px 8px 0;
      background:
        linear-gradient(180deg, rgba(31, 8, 21, 1) 0%, rgba(7, 7, 19, 0.9) 100%);
      border-bottom: 1px dashed rgba(249, 59, 94, 0.35);
    }
    #ko-lyrics .ko-seg {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 5px 0 4px;
    }
    #ko-lyrics .ko-seg-bar {
      position: relative;
      width: 100%;
      height: 10px;
      background:
        repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 4px),
        rgba(7, 7, 19, 0.9);
      border: 1px solid rgba(249, 59, 94, 0.35);
      border-radius: 1px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.65);
    }
    #ko-lyrics .ko-seg-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      box-shadow: 0 0 8px currentColor;
      transition: width 120ms linear;
      background: currentColor;
    }
    /* Per-segment color — smooth red→blue gradient across the 6 slots,
       echoing the Baelz→Kronii duality and the song's escalation.      */
    #ko-lyrics .ko-seg:nth-child(1) { color: #FF3B5C; }  /* ダイ #1 — pure Baelz red   */
    #ko-lyrics .ko-seg:nth-child(2) { color: #FF5678; }  /* ダイ #2 — red-pink         */
    #ko-lyrics .ko-seg:nth-child(3) { color: #E46CB4; }  /* ダイ #3 — magenta crossover*/
    #ko-lyrics .ko-seg:nth-child(4) { color: #9A7AE8; }  /* ダイ #4 — violet           */
    #ko-lyrics .ko-seg:nth-child(5) { color: #5C99FF; }  /* ダイ #5 — indigo           */
    #ko-lyrics .ko-seg:nth-child(6) { color: #3DEFFF; }  /* キライ  — pure Kronii cyan */
    #ko-lyrics .ko-seg-label {
      font-family: var(--ko-font-pixel);
      font-size: 8px;
      letter-spacing: 0.06em;
      color: rgba(244, 230, 200, 0.55);
      text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.9);
      user-select: none;
    }
    #ko-lyrics .ko-seg.kr .ko-seg-label {
      font-family: var(--ko-font-jp);
      font-size: 11px;
      color: rgba(61, 239, 255, 0.9);
    }
    #ko-lyrics .ko-seg.active .ko-seg-label {
      color: currentColor;
      text-shadow: 0 0 6px currentColor, 1px 1px 0 rgba(0,0,0,0.9);
    }

    /* ==== CHANNEL STRIPES (left=red Baelz, right=cyan Kronii) ========= */
    #ko-lyrics .ko-channel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 0;
      width: 30px;
      position: relative;
      font-family: var(--ko-font-pixel);
      font-size: 7.5px;
      letter-spacing: 0.3em;
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }
    #ko-lyrics .ko-channel.left {
      grid-area: chL;
      color: var(--ko-red);
      background:
        repeating-linear-gradient(0deg, rgba(249, 59, 94, 0.2) 0 2px, transparent 2px 5px),
        linear-gradient(180deg, rgba(249, 59, 94, 0.18), rgba(160, 0, 34, 0.08));
      border-right: 1px solid rgba(249, 59, 94, 0.45);
    }
    #ko-lyrics .ko-channel.right {
      grid-area: chR;
      color: var(--ko-cyan);
      background:
        repeating-linear-gradient(0deg, rgba(61, 239, 255, 0.18) 0 2px, transparent 2px 5px),
        linear-gradient(180deg, rgba(61, 239, 255, 0.15), rgba(26, 63, 247, 0.08));
      border-left: 1px solid rgba(61, 239, 255, 0.45);
    }
    #ko-lyrics .ko-channel span {
      text-shadow: 0 0 4px currentColor, 1px 1px 0 rgba(0,0,0,0.9);
    }

    /* ==== META ROW (REC + timestamp + line counter) ==================== */
    #ko-lyrics .ko-meta {
      grid-area: meta;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 18px 4px;
      font-family: var(--ko-font-pixel);
      font-size: 8px;
      letter-spacing: 0.14em;
      color: rgba(244, 230, 200, 0.7);
      user-select: none;
    }
    #ko-lyrics .ko-meta-left,
    #ko-lyrics .ko-meta-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #ko-lyrics .ko-rec-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ko-red);
      box-shadow: 0 0 8px var(--ko-red), 0 0 2px #fff;
      animation: ko-rec-blink 1.3s ease-in-out infinite;
    }
    @keyframes ko-rec-blink {
      0%, 45%   { opacity: 1; }
      50%, 100% { opacity: 0.25; }
    }
    #ko-lyrics .ko-rec-text { color: var(--ko-red); text-shadow: 0 0 4px rgba(249,59,94,0.6); }
    #ko-lyrics .ko-tape {
      font-family: var(--ko-font-terminal);
      font-size: 14px;
      letter-spacing: 0.08em;
      color: var(--ko-cyan);
      text-shadow: 0 0 6px rgba(61, 239, 255, 0.55);
    }
    #ko-lyrics .ko-counter {
      font-family: var(--ko-font-terminal);
      font-size: 13px;
      letter-spacing: 0.1em;
      color: var(--ko-amber);
      text-shadow: 0 0 4px rgba(255, 184, 77, 0.5);
    }

    /* ==== LYRICS AREA ================================================== */
    #ko-lyrics .ko-lyrics-wrap {
      grid-area: lyrics;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 6px 24px 20px;
      min-height: 100px;
    }

    /* JP — Rampart One (bold 3D stenciled JP display)                   */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: var(--ko-cream);
      paint-order: stroke fill;
      -webkit-text-stroke: 3px rgba(7, 7, 19, 0.95);
      font-size: 54px;
      line-height: 2.1;
      padding-top: 0.5em;
      letter-spacing: 0.02em;
      /* Chromatic aberration — static red/cyan split, matches MV distortion  */
      text-shadow:
        -2px 0 0 rgba(249, 59, 94, 0.85),
        2px 0 0 rgba(61, 239, 255, 0.75),
        0 0 22px rgba(249, 59, 94, 0.35),
        0 2px 0 rgba(0, 0, 0, 0.9);
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: 3px rgba(7, 7, 19, 0.95);
    }
    /* Gloss ruby (<rt>): VT323 CRT pixel terminal, labels above each morpheme */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-terminal);
      font-size: 22px;
      font-weight: 400;
      letter-spacing: 0.02em;
      line-height: 1.05;
      padding-bottom: 5px;
      color: inherit;
      paint-order: stroke fill;
      -webkit-text-stroke: 2.5px rgba(7, 7, 19, 0.92);
      text-shadow:
        0 0 6px currentColor,
        0 0 2px rgba(7, 7, 19, 0.9);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.95;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN — Pixelify Sans (pixel-grid sans, mixed case, echoes MV pixel subs) */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 500;
      color: var(--ko-cream);
      paint-order: stroke fill;
      -webkit-text-stroke: 3px rgba(7, 7, 19, 0.95);
      font-size: 30px;
      line-height: 1.25;
      letter-spacing: 0.01em;
      text-shadow:
        -1.5px 0 0 rgba(249, 59, 94, 0.7),
        1.5px 0 0 rgba(61, 239, 255, 0.55),
        0 0 16px rgba(7, 7, 19, 0.85);
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: 3px rgba(7, 7, 19, 0.95);
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(30px * 0.85);
      font-weight: 400;
    }
    /* Dashed accent line under the EN caption, cyan side */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 6px;
      background: repeating-linear-gradient(
        90deg,
        rgba(61, 239, 255, 0.35) 0 6px,
        transparent 6px 10px
      ) bottom / 100% 1px no-repeat;
    }

    /* ==== STATUS BAR (bottom) ========================================== */
    #ko-lyrics .ko-status {
      grid-area: status;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 18px 6px;
      font-family: var(--ko-font-pixel);
      font-size: 7.5px;
      letter-spacing: 0.18em;
      color: rgba(244, 230, 200, 0.55);
      background:
        repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0 1px, transparent 1px 2px),
        linear-gradient(180deg, rgba(7, 7, 19, 0.85), rgba(31, 8, 21, 0.85));
      border-top: 1px dashed rgba(61, 239, 255, 0.3);
      user-select: none;
    }
    #ko-lyrics .ko-signal {
      color: var(--ko-amber);
      text-shadow: 0 0 4px rgba(255, 184, 77, 0.4);
    }
    #ko-lyrics .ko-track {
      color: var(--ko-pink);
      text-shadow: 0 0 4px rgba(255, 160, 188, 0.4);
    }

    /* ==== CORNER TICK MARKS (broadcast safe-area registration) ========= */
    #ko-lyrics .ko-slot > .ko-corner {
      position: absolute;
      width: 12px;
      height: 12px;
      border: 2px solid var(--ko-cyan);
      pointer-events: none;
    }
    #ko-lyrics .ko-slot > .ko-corner.tl { top: -6px; left: -6px; border-right: none; border-bottom: none; }
    #ko-lyrics .ko-slot > .ko-corner.tr { top: -6px; right: -6px; border-left: none; border-bottom: none; }
    #ko-lyrics .ko-slot > .ko-corner.bl { bottom: -6px; left: -6px; border-right: none; border-top: none; }
    #ko-lyrics .ko-slot > .ko-corner.br { bottom: -6px; right: -6px; border-left: none; border-top: none; }
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';

  const segHTML = THEME.dialSegments.map((label, i) => {
    const isKirai = i === THEME.dialSegments.length - 1;
    return `
      <div class="ko-seg ${isKirai ? 'kr' : ''}" data-seg="${i}">
        <div class="ko-seg-bar"><div class="ko-seg-fill" id="ko-fill-${i}"></div></div>
        <div class="ko-seg-label">${escHTML(label)}</div>
      </div>`;
  }).join('');

  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-corner tl"></div>
      <div class="ko-corner tr"></div>
      <div class="ko-corner bl"></div>
      <div class="ko-corner br"></div>

      <div class="ko-dial" id="ko-dial">${segHTML}</div>

      <div class="ko-channel left"><span>${escHTML(THEME.channelLeft)}</span></div>
      <div class="ko-channel right"><span>${escHTML(THEME.channelRight)}</span></div>

      <div class="ko-meta">
        <div class="ko-meta-left">
          <span class="ko-rec-dot"></span>
          <span class="ko-rec-text">REC</span>
          <span class="ko-tape" id="ko-tape">00:00 / 00:00</span>
        </div>
        <div class="ko-meta-right">
          <span class="ko-counter" id="ko-counter">#00</span>
        </div>
      </div>

      <div class="ko-lyrics-wrap">
        <div class="ko-line-jp" id="ko-line-jp"></div>
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>

      <div class="ko-status">
        <span class="ko-signal">${escHTML(THEME.signalLabel)}</span>
        <span class="ko-track">${escHTML(THEME.trackLabel)}</span>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + LRCLib fallback ---
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

  // --- Main tick: update lyric text only ---
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

  // ==========================================================================
  // DIAL + TAPE COUNTER — the song-progress-driven signature.
  // Runs every 100ms. Writes to style.width on each fill segment and text on
  // the tape counter. Cached posKey-style guards prevent style writes when
  // nothing changed.
  // ==========================================================================
  const nSegs = THEME.dialSegments.length;  // 6
  let _lastFillPct = new Array(nSegs).fill(-1);
  let _lastActiveSeg = -1;
  let _lastTapeText = '';
  const fmtMMSS = (sec) => {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };
  const updateDial = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v || !isFinite(v.currentTime)) return;
    const song = (curSongIdx >= 0 && window.__setlist[curSongIdx]) || null;
    const inSong  = song ? Math.max(0, v.currentTime - song.s) : 0;
    const songDur = song ? (song.dur || 240) : 1;

    // Fraction across whole song 0..1
    const frac = Math.min(1, inSong / songDur);
    // Each segment spans 1/nSegs of the song
    const activeSeg = Math.min(nSegs - 1, Math.floor(frac * nSegs));

    for (let i = 0; i < nSegs; i++) {
      let pct;
      if (i < activeSeg)       pct = 100;
      else if (i === activeSeg) pct = Math.round((frac * nSegs - activeSeg) * 100);
      else                      pct = 0;
      if (pct !== _lastFillPct[i]) {
        _lastFillPct[i] = pct;
        const fill = document.getElementById('ko-fill-' + i);
        if (fill) fill.style.width = pct + '%';
      }
    }
    if (activeSeg !== _lastActiveSeg) {
      _lastActiveSeg = activeSeg;
      const segs = document.querySelectorAll('#ko-dial .ko-seg');
      segs.forEach((el, i) => {
        const wantActive = (i === activeSeg);
        if (el.classList.contains('active') !== wantActive) {
          el.classList.toggle('active', wantActive);
        }
      });
    }

    // Tape counter MM:SS / MM:SS
    const tapeText = fmtMMSS(inSong) + ' / ' + fmtMMSS(songDur);
    if (tapeText !== _lastTapeText) {
      _lastTapeText = tapeText;
      const tape = document.getElementById('ko-tape');
      if (tape) tape.textContent = tapeText;
    }
  };
  const dialInterval = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(dialInterval); return; }
    updateDial();
  }, 100);

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

  // --- Color + gloss colorizer (polling at ~150ms) ---
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

  // --- Line counter (no animation, just increment counter on new-line) ---
  // Keeps the FIRE_POLL architecture for the #ko-counter readout. Uses raw-JP
  // stamp check so ruby expansion does NOT double-count. No text animations.
  let _fireLastStamp = null;
  let _fireLineCount = 0;
  let _fireLastSongIdx = -2;
  const FIRE_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(FIRE_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    const counter = document.getElementById('ko-counter');
    if (!jpEl) return;

    const rawJp = jpEl.getAttribute('data-ko-raw-jp') || '';
    const rawEn = jpEl.getAttribute('data-ko-raw-en') || '';
    const liveJp = jpEl.textContent;
    const liveEn = enEl ? enEl.textContent : '';

    let changed = false;
    if (rawJp !== liveJp && !jpEl.querySelector('[data-wc]')) {
      jpEl.setAttribute('data-ko-raw-jp', liveJp);
      if (rawJp !== '' || liveJp.trim() !== '') changed = true;
    } else if (rawEn !== liveEn) {
      if (enEl) jpEl.setAttribute('data-ko-raw-en', liveEn);
      if (rawEn !== '' || liveEn.trim() !== '') changed = true;
    }
    if (!changed) return;

    const stamp = liveJp + '\x00' + liveEn;
    if (stamp === _fireLastStamp) return;
    _fireLastStamp = stamp;

    const sl = window.__setlist || [];
    const v = document.querySelector('video');
    let sIdx = -1;
    if (v && isFinite(v.currentTime)) {
      const t = v.currentTime;
      for (let i = 0; i < sl.length; i++) {
        if (t >= sl[i].s && t < sl[i].end) { sIdx = i; break; }
      }
    }
    if (sIdx !== _fireLastSongIdx) {
      _fireLastSongIdx = sIdx;
      _fireLineCount = 0;
    }

    if (liveJp.trim() || liveEn.trim()) {
      _fireLineCount++;
      if (counter) counter.textContent = '#' + String(_fireLineCount).padStart(2, '0');
    }
  }, 60);

})();
