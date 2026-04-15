// ============================================================================
// KARAOKE OVERLAY — "if..." / DA PUMP (Cover: Fujikura Uruka ft. Tenma Maemi)
// ----------------------------------------------------------------------------
// Visual language derived from the MV: monochrome halftone-manga + electric
// blue + cyan hair tips + hot magenta accents. JP renders inside black censor
// bars (exactly how the MV treats its own lyric pops), glitch-stagger reveal
// on every line change, X-mark corner accents echoing Uruka's hair clips.
// ============================================================================

(() => {

  const THEME = {
    fontsHref:   'https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@500;700;800;900&family=RocknRoll+One&family=Big+Shoulders+Display:wght@500;600;700;800;900&family=Big+Shoulders+Text:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@700;900&display=swap',
    fontDisplay: '"Big Shoulders Display", "Big Shoulders Text", sans-serif',
    fontBody:    '"Big Shoulders Text", sans-serif',
    fontJP:      '"M PLUS 1p", "Zen Kaku Gothic New", sans-serif',

    // MV-derived palette
    ink:         '#07080C',   // near-black
    inkSoft:     '#121520',
    cream:       '#F2ECDA',   // Tenma's hair, paper tones
    blue:        '#1E3AFF',   // electric scene blue
    blueDeep:    '#0E1FCC',
    cyan:        '#5FE6E4',   // Uruka's hair tips / eye
    magenta:     '#FF2E74',   // Tenma's bindi / red pops
    violet:      '#A8A3FF',
    amber:       '#FFB84A',

    // ----- Lyrics -----
    lyricColorEN:  '#F2ECDA',
    lyricColorJP:  '#F2ECDA', // overridden per-chunk, but provides fallback
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 0 14px rgba(7,8,12,0.9), 0 2px 0 rgba(7,8,12,0.9)',
    lyricShadowJP: 'none',
  };

  // --- Trusted Types ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s, createScript: s => s,
    }));

  // --- State ---
  window.__setlist         = window.__setlist         || [];
  window.__parsedLyrics    = window.__parsedLyrics    || {};
  window.__transCache      = window.__transCache      || {};
  window.__plainLyrics     = window.__plainLyrics     || {};
  window.__lyricOffsets    = window.__lyricOffsets    || {};
  window.__wordAlign = window.__wordAlign || {
    // 6 MV-derived colors. All bright — they sit on black censor bars.
    colors: [
      '#5FE6E4', // 0 — cyan (Uruka's hair tips, primary accent)
      '#F2ECDA', // 1 — cream (Tenma's hair, paper)
      '#FF2E74', // 2 — hot magenta (Tenma's bindi, pop accents)
      '#9CB4FF', // 3 — ice blue (highlight/secondary)
      '#FFB84A', // 4 — amber (Uruka's shirt trim)
      '#C9A8FF', // 5 — lavender violet (Tenma's eyes)
    ],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Clean up prior injection ---
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
      position: fixed; inset: 0; pointer-events: none; z-index: 2147483000;
    }

    #karaoke-root, #ko-lyrics {
      --ko-ink:      ${THEME.ink};
      --ko-ink-soft: ${THEME.inkSoft};
      --ko-cream:    ${THEME.cream};
      --ko-blue:     ${THEME.blue};
      --ko-blue-deep:${THEME.blueDeep};
      --ko-cyan:     ${THEME.cyan};
      --ko-magenta:  ${THEME.magenta};
      --ko-violet:   ${THEME.violet};
      --ko-amber:    ${THEME.amber};
      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ===== NOW PLAYING CARD (top-left) ===== */
    .ko-np {
      position: absolute;
      top: 28px; left: 28px;
      width: 340px;
      color: var(--ko-cream);
      font-family: var(--ko-font-display);
      pointer-events: none;
      transform: rotate(-1.2deg);
      filter: drop-shadow(0 12px 32px rgba(0,0,0,0.55));
    }
    .ko-np__shell {
      position: relative;
      background: var(--ko-ink);
      border: 2px solid var(--ko-cream);
      padding: 16px 18px 14px;
      overflow: hidden;
    }
    /* Crosswalk stripe on left edge (matches frame-130) */
    .ko-np__shell::before {
      content: '';
      position: absolute; top: 0; bottom: 0; left: 0; width: 10px;
      background: repeating-linear-gradient(
        to bottom,
        var(--ko-cream) 0 12px,
        transparent 12px 20px
      );
      opacity: 0.95;
    }
    /* Halftone dot overlay */
    .ko-np__shell::after {
      content: '';
      position: absolute; inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(30,58,255,0.20) 1px, transparent 1.4px);
      background-size: 6px 6px;
      mix-blend-mode: screen;
      pointer-events: none;
    }
    .ko-np__tape {
      position: absolute; top: -2px; right: -12px;
      background: var(--ko-magenta);
      color: var(--ko-ink);
      font-family: var(--ko-font-display);
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.22em;
      padding: 4px 18px 4px 12px;
      transform: rotate(3deg);
      box-shadow: 0 4px 0 rgba(0,0,0,0.25);
    }
    .ko-np__label {
      position: relative; z-index: 1;
      margin-left: 16px;
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 10.5px;
      letter-spacing: 0.42em;
      color: var(--ko-cyan);
      display: flex; align-items: center; gap: 8px;
    }
    .ko-np__label::before {
      content: ''; display: inline-block;
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--ko-magenta);
      box-shadow: 0 0 8px var(--ko-magenta);
      animation: ko-pulse 1.4s ease-in-out infinite;
    }
    .ko-np__title {
      position: relative; z-index: 1;
      margin: 4px 0 2px 16px;
      font-family: "RocknRoll One", var(--ko-font-jp);
      font-weight: 400;
      font-size: 40px;
      line-height: 0.95;
      color: var(--ko-cream);
      letter-spacing: -0.02em;
    }
    .ko-np__title-accent {
      color: var(--ko-cyan);
      font-style: italic;
    }
    .ko-np__sub {
      position: relative; z-index: 1;
      margin-left: 16px;
      font-family: var(--ko-font-display);
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.16em;
      color: var(--ko-cream);
      opacity: 0.7;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .ko-np__sub-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.05em;
      opacity: 0.55;
      margin-left: 16px;
      margin-top: 2px;
      position: relative; z-index: 1;
    }
    .ko-np__divider {
      position: relative; z-index: 1;
      margin: 12px 0 8px 16px;
      height: 1px;
      background: linear-gradient(to right,
        var(--ko-cream) 0%,
        var(--ko-cream) 60%,
        transparent 100%);
      opacity: 0.4;
    }
    .ko-np__cover {
      position: relative; z-index: 1;
      margin-left: 16px;
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 10.5px;
      letter-spacing: 0.32em;
      color: var(--ko-magenta);
      display: flex; justify-content: space-between; align-items: center;
    }
    .ko-np__cover span:last-child {
      color: var(--ko-cream);
      opacity: 0.85;
      letter-spacing: 0.14em;
      font-weight: 600;
      font-family: var(--ko-font-jp);
    }
    .ko-np__bar {
      position: relative; z-index: 1;
      margin: 10px 0 2px 16px;
      height: 3px;
      background: rgba(242,236,218,0.18);
      overflow: hidden;
    }
    .ko-np__bar-fill {
      height: 100%;
      background: linear-gradient(to right, var(--ko-cyan), var(--ko-blue));
      width: 0%;
      transition: width 0.45s linear;
      box-shadow: 0 0 10px var(--ko-cyan);
    }
    .ko-np__time {
      position: relative; z-index: 1;
      margin-left: 16px;
      margin-top: 4px;
      font-family: var(--ko-font-display);
      font-weight: 600;
      font-size: 10.5px;
      letter-spacing: 0.18em;
      color: var(--ko-cream);
      opacity: 0.7;
      display: flex; justify-content: space-between;
      font-variant-numeric: tabular-nums;
    }
    @keyframes ko-pulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50%      { opacity: 1;   transform: scale(1.3); }
    }

    /* ===== CORNER X-MARKS (echo Uruka's hair clips) ===== */
    .ko-xmark {
      position: absolute;
      width: 22px; height: 22px;
      opacity: 0.55;
      pointer-events: none;
    }
    .ko-xmark::before, .ko-xmark::after {
      content: ''; position: absolute;
      top: 50%; left: 50%;
      width: 26px; height: 3px;
      background: var(--ko-cyan);
      box-shadow: 0 0 6px var(--ko-cyan);
    }
    .ko-xmark::before { transform: translate(-50%, -50%) rotate(45deg); }
    .ko-xmark::after  { transform: translate(-50%, -50%) rotate(-45deg); }
    .ko-xmark--tr { top: 32px; right: 32px; }
    .ko-xmark--bl { bottom: 32px; left: 32px; }
    .ko-xmark--bl::before, .ko-xmark--bl::after { background: var(--ko-magenta); box-shadow: 0 0 6px var(--ko-magenta); }

    /* ===== BOTTOM-RIGHT STAMP ===== */
    .ko-stamp {
      position: absolute;
      bottom: 28px; right: 32px;
      font-family: var(--ko-font-display);
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 0.35em;
      color: var(--ko-cream);
      opacity: 0.45;
      transform: rotate(-2deg);
      padding: 6px 12px;
      border: 1.5px solid var(--ko-cream);
      pointer-events: none;
    }
    .ko-stamp .dot { color: var(--ko-magenta); opacity: 1; }

    /* ===== OFFSET HINT (bottom-left, appears on key press) ===== */
    .ko-offset-hint {
      position: absolute;
      bottom: 28px; left: 68px;
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.2em;
      color: var(--ko-cyan);
      opacity: 0;
      transition: opacity 0.25s;
      pointer-events: none;
      padding: 6px 12px;
      background: var(--ko-ink);
      border: 1px solid var(--ko-cyan);
    }
    .ko-offset-hint.show { opacity: 1; }

    /* ==== LYRIC DISPLAY ==== */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    #ko-lyrics .ko-slot {
      display: flex; flex-direction: column; align-items: center;
      gap: 18px;
      position: relative;
    }

    /* Halftone dot aura behind the lyrics */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 118%; height: 160%;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.28) 1px, transparent 1.5px);
      background-size: 5px 5px;
      mask-image: radial-gradient(ellipse 50% 50% at center, black 30%, transparent 75%);
      -webkit-mask-image: radial-gradient(ellipse 50% 50% at center, black 30%, transparent 75%);
      pointer-events: none;
      z-index: -1;
      opacity: 0.5;
    }

    /* === JP LINE: black censor-bar treatment, per-chunk colored text === */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 800;
      color: ${THEME.lyricColorJP};
      font-size: 44px;
      line-height: 2.1;
      padding-top: 0.35em;
      letter-spacing: 0.03em;
      text-shadow: none;
      min-height: 1em;
      order: 1;
      filter: drop-shadow(0 6px 0 rgba(0,0,0,0.85)) drop-shadow(0 0 22px rgba(0,0,0,0.8));
    }
    /* Each colored chunk becomes a black censor bar with colored text.
       Inline-block lets adjacent bars visually fuse into one when there's
       no JP-side whitespace, while leading-space chunks break naturally. */
    #ko-lyrics .ko-line-jp span[data-wc] {
      display: inline-block;
      background: var(--ko-ink);
      color: inherit;
      padding: 2px 8px 6px;
      margin: 0;
      position: relative;
      animation: ko-bar-in 0.38s cubic-bezier(0.22, 1.1, 0.36, 1) both;
    }
    /* Staggered reveal via CSS variable index */
    #ko-lyrics .ko-line-jp span[data-wc]:nth-of-type(1) { animation-delay: 0s; }
    #ko-lyrics .ko-line-jp span[data-wc]:nth-of-type(2) { animation-delay: 0.06s; }
    #ko-lyrics .ko-line-jp span[data-wc]:nth-of-type(3) { animation-delay: 0.12s; }
    #ko-lyrics .ko-line-jp span[data-wc]:nth-of-type(4) { animation-delay: 0.18s; }
    #ko-lyrics .ko-line-jp span[data-wc]:nth-of-type(5) { animation-delay: 0.24s; }
    #ko-lyrics .ko-line-jp span[data-wc]:nth-of-type(n+6) { animation-delay: 0.30s; }

    /* Ruby gloss (above JP) — cream, condensed display, above the black bar */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1.05;
      padding-bottom: 8px;
      color: var(--ko-cream);
      text-shadow: 0 0 8px rgba(7,8,12,0.95), 0 1px 0 rgba(7,8,12,0.95), 0 0 2px rgba(7,8,12,0.95);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.92;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; background: transparent; }

    /* === EN LINE: white italic display, no censor bar — "freed meaning" === */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 600;
      font-style: italic;
      color: ${THEME.lyricColorEN};
      font-size: 38px;
      line-height: 1.15;
      letter-spacing: 0.02em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      padding: 0 8px;
    }
    /* Each EN chunk gets its matching chunk color as a subtle underline tint
       on hover? No — preserve the typography. Keep colors on the text itself
       but slightly desaturated so the natural line reads as a unit. */
    #ko-lyrics .ko-line-en span[data-wc] {
      animation: ko-en-fade-in 0.45s ease-out both;
    }
    #ko-lyrics .ko-line-en span[data-wc]:nth-of-type(1) { animation-delay: 0.15s; }
    #ko-lyrics .ko-line-en span[data-wc]:nth-of-type(2) { animation-delay: 0.22s; }
    #ko-lyrics .ko-line-en span[data-wc]:nth-of-type(3) { animation-delay: 0.29s; }
    #ko-lyrics .ko-line-en span[data-wc]:nth-of-type(4) { animation-delay: 0.36s; }
    #ko-lyrics .ko-line-en span[data-wc]:nth-of-type(5) { animation-delay: 0.43s; }
    #ko-lyrics .ko-line-en span[data-wc]:nth-of-type(n+6) { animation-delay: 0.5s; }

    #ko-lyrics .ko-line-en.en-song { font-size: 32px; font-weight: 500; font-style: italic; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* === GLITCH REVEAL ANIMATIONS === */
    @keyframes ko-bar-in {
      0% {
        opacity: 0;
        clip-path: inset(0 100% 0 0);
        transform: translateX(-6px);
        filter: blur(2px);
      }
      30% {
        opacity: 1;
        clip-path: inset(0 0 0 0);
        transform: translateX(3px);
        filter: blur(0);
      }
      55% {
        transform: translateX(-1.5px);
      }
      80% {
        transform: translateX(0.5px);
      }
      100% {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes ko-en-fade-in {
      0%   { opacity: 0; transform: translateY(6px); letter-spacing: 0.08em; }
      100% { opacity: 1; transform: translateY(0); letter-spacing: 0.02em; }
    }

    /* === SCAN LINES over lyric zone (very subtle) === */
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 120%; height: 110%;
      background-image: repeating-linear-gradient(
        to bottom,
        transparent 0 2px,
        rgba(0,0,0,0.08) 2px 3px
      );
      mask-image: radial-gradient(ellipse 45% 55% at center, black 40%, transparent 85%);
      -webkit-mask-image: radial-gradient(ellipse 45% 55% at center, black 40%, transparent 85%);
      pointer-events: none;
      z-index: -1;
      opacity: 0.45;
      mix-blend-mode: multiply;
    }

    /* === TOP-RIGHT TITLE CHIP "if" === */
    .ko-chip {
      position: absolute;
      top: 36px; right: 92px;
      font-family: "Big Shoulders Display", sans-serif;
      font-weight: 900;
      font-size: 68px;
      line-height: 0.8;
      font-style: italic;
      color: var(--ko-cream);
      background: var(--ko-ink);
      padding: 6px 22px 10px;
      letter-spacing: -0.03em;
      transform: rotate(1.2deg);
      box-shadow: 8px 8px 0 var(--ko-blue);
      border: 2px solid var(--ko-cream);
    }
    .ko-chip::after {
      content: '.';
      color: var(--ko-magenta);
      font-size: 1em;
    }
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // Now-playing card + decoration inside root
  setHTML(root, `
    <div class="ko-np">
      <div class="ko-np__shell">
        <div class="ko-np__tape">SIDE A · '97</div>
        <div class="ko-np__label"><span>NOW SPINNING</span></div>
        <div class="ko-np__title">if<span class="ko-np__title-accent">...</span></div>
        <div class="ko-np__sub">DA PUMP</div>
        <div class="ko-np__sub-jp">ダ・パンプ</div>
        <div class="ko-np__divider"></div>
        <div class="ko-np__cover">
          <span>COVER BY</span>
          <span>藤倉ウルカ × 天満マエミ</span>
        </div>
        <div class="ko-np__bar"><div class="ko-np__bar-fill" id="ko-np-fill"></div></div>
        <div class="ko-np__time">
          <span id="ko-np-cur">0:00</span>
          <span id="ko-np-dur">3:39</span>
        </div>
      </div>
    </div>
    <div class="ko-chip">if</div>
    <div class="ko-xmark ko-xmark--tr"></div>
    <div class="ko-xmark ko-xmark--bl"></div>
    <div class="ko-stamp">UR<span class="dot">·</span>TM <span class="dot">✦</span> COVER</div>
    <div class="ko-offset-hint" id="ko-offset-hint"></div>
  `);

  // Lyric card
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + fetching ---
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
        if (d && d.syncedLyrics) window.__parsedLyrics[id] = parseLRC(d.syncedLyrics);
      })
      .catch(() => {});
  });

  // --- Cached state ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';
  let lastFillPct = -1, lastCurTime = '';

  // Format seconds as M:SS
  const fmtTime = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  };

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

      // Update now-playing duration
      const durEl = document.getElementById('ko-np-dur');
      if (durEl && song) durEl.textContent = fmtTime(song.dur || 0);
    }

    // Progress bar + time
    if (song) {
      const pct = Math.min(100, Math.max(0, (inSong / songDur) * 100));
      const pctRound = Math.round(pct * 10) / 10;
      if (pctRound !== lastFillPct) {
        lastFillPct = pctRound;
        const fill = document.getElementById('ko-np-fill');
        if (fill) fill.style.width = pctRound + '%';
      }
      const curStr = fmtTime(inSong);
      if (curStr !== lastCurTime) {
        lastCurTime = curStr;
        const curEl = document.getElementById('ko-np-cur');
        if (curEl) curEl.textContent = curStr;
      }
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
        if (elapsed < endAt) showText = line.text;
      }

      if (lineIdx !== curLineIdx || showText !== lastJpText) {
        curLineIdx = lineIdx;
        const enEl = document.getElementById('ko-line-en');
        const jpEl = document.getElementById('ko-line-jp');
        if (song.lang === 'en') {
          if (enEl && showText !== lastEnText) { enEl.textContent = showText; lastEnText = showText; }
          if (jpEl && lastJpText !== '') { jpEl.textContent = ''; lastJpText = ''; }
        } else {
          const posEn = (lineIdx >= 0 && showText && lrc[lineIdx].en) || '';
          const en = posEn || (showText && window.__transCache[showText]) || '';
          if (enEl && en !== lastEnText) { enEl.textContent = en; lastEnText = en; }
          if (jpEl && showText !== lastJpText) { jpEl.textContent = showText; lastJpText = showText; }
        }
      }
    } else if (!song || !song.lrcId) {
      if (lastEnText !== '') { document.getElementById('ko-line-en').textContent = ''; lastEnText = ''; }
      if (lastJpText !== '') { document.getElementById('ko-line-jp').textContent = ''; lastJpText = ''; }
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

  // --- Offset hotkeys + hint display ---
  let hintTimer = 0;
  const showHint = (text) => {
    const hint = document.getElementById('ko-offset-hint');
    if (!hint) return;
    hint.textContent = text;
    hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove('show'), 1400);
  };

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
    const newOff = window.__lyricOffsets[id];
    showHint(newOff === undefined ? 'OFFSET · RESET' : `OFFSET · ${newOff > 0 ? '+' : ''}${newOff.toFixed(1)}s`);
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

  // --- Colorizer poll ---
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
