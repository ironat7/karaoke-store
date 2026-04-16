// ============================================================================
// KARAOKE OVERLAY — Nothing's Working Out (cover by moon jelly)
// MV: underwater garden w/ goldfish + paper lanterns + torii frame + kimono
// Design: vermilion-framed washi panel with hanging paper lanterns, drifting
//         goldfish, peripheral kanji particles, ink-drop line transitions
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — meiyo's MV: coral lanterns, navy water, cream washi, sakura rose
  // ==========================================================================
  const THEME = {
    fontsHref:   'https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500;1,600&family=Kaisei+Decol:wght@500;700&display=swap',
    fontDisplay: '"Cormorant Garamond", "Shippori Mincho", serif',
    fontBody:    '"Cormorant Garamond", "Shippori Mincho", serif',
    fontJP:      '"Shippori Mincho", "Kaisei Decol", serif',

    // Washi-paper palette, MV-derived
    cream:      '#F4E9D4',   // aged washi paper
    accent:     '#D94E6B',   // coral lantern red
    accentDeep: '#9E2A3C',   // darker vermilion frame
    accentInk:  '#6B1622',   // deep lantern shadow
    ink:        '#241821',   // warm near-black text
    inkSoft:    '#4A3540',   // secondary ink
    gold:       '#C89837',   // tassel mustard

    // Lyric typography
    lyricColorEN:  '#2A1820',
    lyricColorJP:  '#1E1217',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(244,233,212,0.95), 0 0 10px rgba(244,233,212,0.7)',
    lyricShadowJP: '0 1px 0 rgba(244,233,212,0.95), 0 0 10px rgba(244,233,212,0.7)',
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
    // MV-derived — coral lantern, water navy, gold tassel, lavender kimono,
    // deep ocean ink, sakura rose — all chosen to read on cream washi.
    colors: ['#D94E6B', '#2E5C7A', '#C89837', '#8E7CB8', '#3E2E5C', '#E88BA8'],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // --- Generation counter ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  // --- Runtime knobs ---
  window.__koMaxHold    = window.__koMaxHold    || 10;

  // --- Clean up any prior injection's leftover DOM ---
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

    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};
      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ============================================================
       Drifting goldfish — slow lazy swim across the whole viewport
       ============================================================ */
    .ko-koi {
      position: absolute;
      opacity: 0.38;
      filter: drop-shadow(0 2px 6px rgba(217, 78, 107, 0.35));
      will-change: transform, opacity;
    }
    .ko-koi.koi-a {
      top: 22%;
      animation: ko-koi-drift-l 42s linear infinite;
      animation-delay: -4s;
    }
    .ko-koi.koi-b {
      top: 78%;
      animation: ko-koi-drift-r 56s linear infinite;
      animation-delay: -20s;
    }
    .ko-koi.koi-c {
      top: 12%;
      animation: ko-koi-drift-r 72s linear infinite;
      animation-delay: -38s;
      opacity: 0.24;
    }
    @keyframes ko-koi-drift-l {
      0%   { transform: translateX(110vw) scaleX(-1) rotate(-4deg); opacity: 0; }
      10%  { opacity: 0.38; }
      50%  { transform: translateX(40vw) scaleX(-1) rotate(4deg); }
      90%  { opacity: 0.38; }
      100% { transform: translateX(-12vw) scaleX(-1) rotate(-2deg); opacity: 0; }
    }
    @keyframes ko-koi-drift-r {
      0%   { transform: translateX(-12vw) rotate(3deg); opacity: 0; }
      10%  { opacity: 0.24; }
      50%  { transform: translateX(45vw) rotate(-4deg); }
      90%  { opacity: 0.24; }
      100% { transform: translateX(110vw) rotate(2deg); opacity: 0; }
    }

    /* ============================================================
       Drifting kanji dust — echoes the spiral-of-kanji MV moments
       ============================================================ */
    .ko-kanji-drift {
      position: absolute;
      font-family: var(--ko-font-jp);
      color: rgba(217, 78, 107, 0.16);
      font-weight: 700;
      text-shadow: 0 0 8px rgba(217, 78, 107, 0.28);
      pointer-events: none;
      will-change: transform, opacity;
      user-select: none;
    }
    @keyframes ko-kanji-float {
      0%   { transform: translateY(20px) rotate(-3deg); opacity: 0; }
      15%  { opacity: 1; }
      85%  { opacity: 1; }
      100% { transform: translateY(-40px) rotate(3deg); opacity: 0; }
    }

    /* ============================================================
       LYRIC PANEL — washi paper scroll with vermilion wooden frame
       ============================================================ */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }

    /* Backdrop panel — aged washi with soft warm gradient */
    #ko-lyrics::before {
      content: "";
      position: absolute;
      inset: -32px -56px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(217, 78, 107, 0.10), transparent 60%),
        radial-gradient(ellipse at 30% 100%, rgba(200, 152, 55, 0.09), transparent 55%),
        linear-gradient(180deg, #F5EAD2 0%, #F0E2C4 50%, #EBD9B5 100%);
      border: 2px solid rgba(158, 42, 60, 0.85);
      outline: 1px solid rgba(158, 42, 60, 0.4);
      outline-offset: 6px;
      border-radius: 6px;
      box-shadow:
        0 0 0 8px rgba(244, 233, 212, 0.9),
        0 0 0 9px rgba(158, 42, 60, 0.65),
        0 18px 48px rgba(20, 10, 25, 0.55),
        inset 0 0 80px rgba(107, 22, 34, 0.10),
        inset 0 0 0 1px rgba(244, 233, 212, 0.6);
      z-index: -2;
    }

    /* Washi fiber texture + wave watermark */
    #ko-lyrics::after {
      content: "";
      position: absolute;
      inset: -32px -56px;
      background:
        repeating-linear-gradient(78deg,
          transparent 0px,
          transparent 2px,
          rgba(107, 22, 34, 0.02) 2px,
          rgba(107, 22, 34, 0.02) 3px),
        repeating-linear-gradient(172deg,
          transparent 0px,
          transparent 1px,
          rgba(107, 22, 34, 0.014) 1px,
          rgba(107, 22, 34, 0.014) 2px),
        radial-gradient(ellipse 90% 40% at 50% 100%,
          rgba(46, 92, 122, 0.14) 0%,
          transparent 70%);
      border-radius: 6px;
      pointer-events: none;
      z-index: -1;
      mix-blend-mode: multiply;
    }

    /* Brush-ink seal ornament (top-left corner mark) — 月 for moon jelly */
    .ko-seal {
      position: absolute;
      top: -18px;
      left: -42px;
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #C73F3F 0%, #9E2A2A 100%);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ko-font-jp);
      color: #F4E9D4;
      font-size: 22px;
      font-weight: 800;
      line-height: 1;
      box-shadow:
        inset 0 0 0 1px rgba(244, 233, 212, 0.4),
        0 4px 10px rgba(107, 22, 34, 0.5);
      transform: rotate(-6deg);
      z-index: 3;
    }

    /* Gold corner flourishes */
    .ko-corner {
      position: absolute;
      width: 18px;
      height: 18px;
      border: 1.5px solid var(--ko-gold);
      opacity: 0.88;
      z-index: 2;
    }
    .ko-corner.tl { top: -36px; left: -60px; border-right: none; border-bottom: none; }
    .ko-corner.tr { top: -36px; right: -60px; border-left: none; border-bottom: none; }
    .ko-corner.bl { bottom: -36px; left: -60px; border-right: none; border-top: none; }
    .ko-corner.br { bottom: -36px; right: -60px; border-left: none; border-top: none; }

    /* ============================================================
       HANGING PAPER LANTERNS — off the top corners of the panel
       ============================================================ */
    .ko-lantern {
      position: absolute;
      top: -120px;
      width: 54px;
      height: 70px;
      z-index: 4;
      animation: ko-lantern-sway 5.8s ease-in-out infinite;
      transform-origin: 50% -60px;
      will-change: transform;
    }
    .ko-lantern.left  { left: -78px; animation-delay: -1.2s; }
    .ko-lantern.right { right: -78px; animation-delay: -3.4s; animation-duration: 6.6s; }

    /* The lantern string */
    .ko-lantern::before {
      content: "";
      position: absolute;
      top: -60px;
      left: 50%;
      width: 1px;
      height: 60px;
      background: linear-gradient(180deg, transparent 0%, rgba(36, 24, 33, 0.7) 40%, rgba(36, 24, 33, 0.9) 100%);
      transform: translateX(-50%);
    }

    /* The lantern body */
    .ko-lantern-body {
      position: absolute;
      inset: 4px 0;
      background:
        radial-gradient(ellipse at 50% 50%,
          rgba(255, 220, 140, 0.9) 0%,
          rgba(232, 110, 130, 0.96) 35%,
          rgba(158, 42, 60, 1) 75%);
      border-radius: 50% / 55%;
      box-shadow:
        inset 0 -6px 12px rgba(107, 22, 34, 0.72),
        inset 0 6px 10px rgba(255, 225, 170, 0.5),
        0 0 18px rgba(217, 78, 107, 0.72),
        0 0 36px rgba(217, 78, 107, 0.4);
      animation: ko-lantern-glow 3.2s ease-in-out infinite alternate;
    }
    /* Horizontal ribs on the lantern */
    .ko-lantern-body::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50% / 55%;
      background:
        repeating-linear-gradient(180deg,
          transparent 0px,
          transparent 8px,
          rgba(107, 22, 34, 0.3) 8px,
          rgba(107, 22, 34, 0.3) 9px);
      pointer-events: none;
    }
    /* Top cap */
    .ko-lantern-body::after {
      content: "";
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 22px;
      height: 7px;
      background: linear-gradient(180deg, #3c2820 0%, #1a0f0a 100%);
      border-radius: 2px 2px 1px 1px;
    }
    /* Bottom tassel — gold cord */
    .ko-lantern::after {
      content: "";
      position: absolute;
      bottom: -16px;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 16px;
      background: linear-gradient(180deg, var(--ko-gold) 0%, #8a6a20 100%);
      border-radius: 2px;
      box-shadow: 0 -3px 0 -1px rgba(107, 22, 34, 0.75);
    }

    @keyframes ko-lantern-sway {
      0%, 100% { transform: rotate(-3deg); }
      50%      { transform: rotate(3deg); }
    }
    @keyframes ko-lantern-glow {
      0%   { filter: brightness(0.92); }
      100% { filter: brightness(1.1); }
    }

    /* ============================================================
       LYRIC SLOT — ink-on-paper layout
       ============================================================ */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px 28px 18px;
      z-index: 1;
    }

    /* Ink-drop ripple that fires on every new line */
    #ko-lyrics .ko-slot::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(158, 42, 60, 0.38) 0%, transparent 70%);
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
      pointer-events: none;
      z-index: 0;
    }
    #ko-lyrics .ko-slot.ko-pulse::before {
      animation: ko-ink-ripple 1.1s ease-out;
    }
    @keyframes ko-ink-ripple {
      0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0.58; }
      60%  { opacity: 0.14; }
      100% { transform: translate(-50%, -50%) scale(22); opacity: 0; }
    }

    /* Top decorative gold rule */
    #ko-lyrics .ko-slot::after {
      content: "";
      position: absolute;
      top: 6px;
      left: 15%;
      right: 15%;
      height: 1px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(158, 42, 60, 0.45) 20%,
        rgba(200, 152, 55, 0.72) 50%,
        rgba(158, 42, 60, 0.45) 80%,
        transparent 100%);
    }

    /* ============================================================
       LYRIC TEXT — brush-mincho JP + italic-garamond EN
       ============================================================ */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 42px;
      line-height: 2.4;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: "Cormorant Garamond", "Shippori Mincho", serif;
      font-size: 22px;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: ${THEME.lyricColorJP};
      opacity: 0.78;
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 1px 0 rgba(244,233,212,0.95), 0 0 5px rgba(244,233,212,0.8);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      font-style: italic;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.2;
      letter-spacing: 0.015em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      position: relative;
      z-index: 2;
    }
    /* Decorative em-dashes flanking non-empty EN */
    #ko-lyrics .ko-line-en:not(:empty)::before,
    #ko-lyrics .ko-line-en:not(:empty)::after {
      content: "";
      display: inline-block;
      vertical-align: middle;
      width: 26px;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(158, 42, 60, 0.75) 50%, transparent 100%);
      margin: 0 12px 6px;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 400; }
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

  // Goldfish SVGs — drift lazily across the viewport
  const koiSVG = (fill, stroke, cls, gradId) => `
    <svg class="ko-koi ${cls}" viewBox="0 0 90 45" width="90" height="45" xmlns="http://www.w3.org/2000/svg" style="left:0;">
      <defs>
        <radialGradient id="${gradId}" cx="0.35" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="${fill}" stop-opacity="0.95"/>
          <stop offset="60%" stop-color="${stroke}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="${stroke}" stop-opacity="0.6"/>
        </radialGradient>
      </defs>
      <path d="M62 22 C 80 8, 88 12, 90 22 C 88 32, 80 36, 62 22 Z" fill="${stroke}" opacity="0.75"/>
      <ellipse cx="32" cy="22" rx="30" ry="12" fill="url(#${gradId})"/>
      <path d="M2 22 C 8 10, 20 10, 28 14 L 28 30 C 20 34, 8 34, 2 22 Z" fill="${stroke}" opacity="0.55"/>
      <circle cx="18" cy="19" r="2.2" fill="#1e0a12"/>
      <path d="M40 15 Q 45 12 50 15" stroke="${stroke}" stroke-width="1" fill="none" opacity="0.5"/>
    </svg>`;
  const koi1 = koiSVG('#E88BA8', '#D94E6B', 'koi-a', 'koiG1');
  const koi2 = koiSVG('#F4B870', '#D9724E', 'koi-b', 'koiG2');
  const koi3 = koiSVG('#E8CCA0', '#B08040', 'koi-c', 'koiG3');

  // Peripheral kanji dust — characters drawn from the song's own vocabulary
  const DUST_CHARS = ['愛','傷','脳','内','戦','争','心','配','惨','事','低','卍','茨','壊','嫌','模','索','独','泡','惑','怒','溺'];
  let dustHTML = '';
  for (let i = 0; i < 16; i++) {
    const ch = DUST_CHARS[Math.floor(Math.random() * DUST_CHARS.length)];
    const leftPct = Math.floor(Math.random() * 100);
    const topPct = Math.floor(Math.random() * 100);
    const size = 20 + Math.floor(Math.random() * 40);
    const dur = 9 + Math.floor(Math.random() * 14);
    const delay = -Math.floor(Math.random() * 14);
    dustHTML += `<div class="ko-kanji-drift" style="left:${leftPct}%;top:${topPct}%;font-size:${size}px;animation:ko-kanji-float ${dur}s ease-in-out ${delay}s infinite;">${ch}</div>`;
  }

  setHTML(root, `${koi1}${koi2}${koi3}${dustHTML}`);

  // Lyric card
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-corner tl"></div>
    <div class="ko-corner tr"></div>
    <div class="ko-corner bl"></div>
    <div class="ko-corner br"></div>
    <div class="ko-seal">月</div>
    <div class="ko-lantern left"><div class="ko-lantern-body"></div></div>
    <div class="ko-lantern right"><div class="ko-lantern-body"></div></div>
    <div class="ko-slot">
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
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

  // --- Ink-drop ripple trigger on new line ---
  const pulseInkDrop = () => {
    const slot = lyrics.querySelector('.ko-slot');
    if (!slot) return;
    slot.classList.remove('ko-pulse');
    // Force reflow so re-adding the class restarts the animation
    void slot.offsetWidth;
    slot.classList.add('ko-pulse');
  };

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
        const lineChanged = (lineIdx !== curLineIdx);
        curLineIdx = lineIdx;
        const enEl = document.getElementById('ko-line-en');
        const jpEl = document.getElementById('ko-line-jp');
        if (song.lang === 'en') {
          if (enEl && showText !== lastEnText) {
            enEl.textContent = showText;
            lastEnText = showText;
            if (lineChanged && showText) pulseInkDrop();
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
            if (lineChanged && showText) pulseInkDrop();
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
