// ============================================================================
// KARAOKE OVERLAY — FIND THE WAY (Mika Nakashima · Jelly Hoshiumi cover)
// "Celestial Wayfinder" — a stargazer's astrolabe plate.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Jelly Hoshiumi's cosmos: deep navy, ivory starlight, ice-blue
  // and cream accents pulled directly from the MV's character, palette, and
  // burned-in graphics (hairline lyric postcards, cursive wordmark, orbital
  // rings, shooting stars, constellation line-art).
  // ==========================================================================
  const THEME = {
    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600' +
      '&family=Great+Vibes' +
      '&family=Jost:wght@300;400;500' +
      '&family=Shippori+Mincho+B1:wght@500;700' +
      '&display=swap',
    fontDisplay: '"Great Vibes", "Cormorant Garamond", serif',
    fontBody:    '"Cormorant Garamond", "EB Garamond", Georgia, serif',
    fontJP:      '"Shippori Mincho B1", "Shippori Mincho", "Noto Serif JP", serif',
    fontGloss:   '"Jost", "Inter", system-ui, sans-serif',

    // Card surface / chrome
    navyDeep:   '#070C24',
    navyMid:    '#0C1440',
    navyLift:   '#14215A',
    cream:      '#F4EEDC',
    creamDim:   'rgba(244,238,220,0.55)',
    creamFaint: 'rgba(244,238,220,0.22)',
    iceBlue:    '#9FD8EF',
    gold:       '#E8CC7C',

    // Lyric typography — light on the navy astrolabe plate.
    lyricColorEN:  '#F4EEDC',
    lyricColorJP:  '#F4EEDC',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 0 14px rgba(10,16,48,0.9), 0 2px 4px rgba(0,0,0,0.45)',
    lyricShadowJP: '0 0 16px rgba(10,16,48,0.92), 0 2px 4px rgba(0,0,0,0.5)',
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
    // Six MV-derived chunk colors — light pastels legible on deep navy card.
    // Pulled from Jelly's character (hair / eye-glow / ribbon / skirt / blush)
    // and the MV's star accessory (pale mint). Each one appears somewhere in
    // the frames, so the color story reads as part of the same world.
    colors: [
      '#9FD8EF', // 0 · ice-blue hair
      '#6FE8E8', // 1 · cyan eye-glow / magic sparkle
      '#E8CC7C', // 2 · gold ribbon accent
      '#B8E2C2', // 3 · pale mint (star accessory)
      '#B49CE0', // 4 · soft violet skirt
      '#E8A8B8'  // 5 · blush rose
    ],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // --- Generation counter: bumps so prior tick closures self-terminate ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  // --- Runtime knobs ---
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
    }

    #karaoke-root, #ko-lyrics {
      --ko-navy-deep:  ${THEME.navyDeep};
      --ko-navy-mid:   ${THEME.navyMid};
      --ko-navy-lift:  ${THEME.navyLift};
      --ko-cream:      ${THEME.cream};
      --ko-cream-dim:  ${THEME.creamDim};
      --ko-cream-faint:${THEME.creamFaint};
      --ko-ice:        ${THEME.iceBlue};
      --ko-gold:       ${THEME.gold};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-gloss:   ${THEME.fontGloss};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ==== CARD ==== Astrolabe plate: deep navy glass, ivory hairline, inner
       starfield wash, grain-noise patina. Subtle enough the lyrics lead. */
    #ko-lyrics .ko-slot {
      display: block;
      width: 100%;
    }
    #ko-lyrics .ko-card {
      position: relative;
      padding: 46px 64px 40px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(110, 180, 240, 0.12) 0%, transparent 55%),
        radial-gradient(ellipse at 20% 100%, rgba(180, 156, 224, 0.09) 0%, transparent 55%),
        linear-gradient(175deg, rgba(10, 20, 60, 0.92) 0%, rgba(7, 12, 36, 0.95) 100%);
      border: 1px solid var(--ko-cream-dim);
      border-radius: 3px;
      box-shadow:
        0 0 0 1px rgba(244,238,220,0.06),
        0 14px 56px rgba(0, 0, 20, 0.62),
        0 0 80px rgba(60, 100, 200, 0.08),
        inset 0 0 90px rgba(80, 120, 200, 0.05);
      backdrop-filter: blur(12px) saturate(1.15);
      -webkit-backdrop-filter: blur(12px) saturate(1.15);
      overflow: hidden;
      isolation: isolate;
    }
    /* Inner starfield wash — tiny stars painted into the plate. */
    #ko-lyrics .ko-card::before {
      content: '';
      position: absolute; inset: 0;
      background-image:
        radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.55), transparent 60%),
        radial-gradient(1px 1px at 28% 78%, rgba(255,255,255,0.4),  transparent 60%),
        radial-gradient(1.3px 1.3px at 48% 14%, rgba(200,220,255,0.55), transparent 60%),
        radial-gradient(1px 1px at 64% 90%, rgba(255,255,255,0.3),  transparent 60%),
        radial-gradient(1.3px 1.3px at 82% 36%, rgba(240,220,180,0.5), transparent 60%),
        radial-gradient(1px 1px at 92% 72%, rgba(255,255,255,0.4),  transparent 60%),
        radial-gradient(1.6px 1.6px at 38% 50%, rgba(180,220,255,0.35), transparent 60%);
      pointer-events: none;
      animation: ko-twinkle 5.2s ease-in-out infinite;
      z-index: 0;
    }
    /* Fine grain patina — gives the navy plate a physical/paper quality. */
    #ko-lyrics .ko-card::after {
      content: '';
      position: absolute; inset: 0;
      background:
        repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 0 1px, transparent 1px 3px),
        repeating-linear-gradient(37deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 2px);
      mix-blend-mode: screen;
      opacity: 0.6;
      pointer-events: none;
      z-index: 0;
    }
    @keyframes ko-twinkle {
      0%, 100% { opacity: 0.55; }
      50%      { opacity: 1; }
    }

    /* ==== CORNER STARS ==== four tiny 4-point stars framing the plate,
       echoing the MV's constellation-node treatment. */
    #ko-lyrics .ko-corner {
      position: absolute;
      width: 14px; height: 14px;
      pointer-events: none;
      opacity: 0.9;
      filter: drop-shadow(0 0 4px rgba(240,220,180,0.5));
      z-index: 2;
    }
    #ko-lyrics .ko-corner--tl { top: 10px; left: 10px; }
    #ko-lyrics .ko-corner--tr { top: 10px; right: 10px; }
    #ko-lyrics .ko-corner--bl { bottom: 10px; left: 10px; }
    #ko-lyrics .ko-corner--br { bottom: 10px; right: 10px; }

    /* ==== ORBITAL RING CROWN ==== elliptical ring across top/bottom of the
       card with a small planet riding it. Perpetual, very slow. */
    #ko-lyrics .ko-orbit {
      position: absolute;
      top: -10px; left: 8%;
      width: 84%; height: 28px;
      pointer-events: none;
      opacity: 0.8;
      z-index: 2;
    }
    #ko-lyrics .ko-orbit--bottom {
      top: auto; bottom: -8px;
      transform: scaleY(-1);
      opacity: 0.55;
    }

    /* ==== WORDMARK ==== neon-cursive tag pulling the MV title treatment
       directly onto the card. */
    #ko-lyrics .ko-wordmark {
      position: absolute;
      top: 14px; right: 26px;
      font-family: var(--ko-font-display);
      font-size: 26px;
      line-height: 1;
      color: var(--ko-cream);
      opacity: 0.92;
      letter-spacing: 0.01em;
      text-shadow:
        0 0 10px rgba(200, 230, 255, 0.55),
        0 0 22px rgba(140, 200, 255, 0.35),
        0 1px 0 rgba(10, 16, 48, 0.6);
      pointer-events: none;
      z-index: 3;
      white-space: nowrap;
    }
    #ko-lyrics .ko-wordmark-sub {
      position: absolute;
      top: 18px; left: 26px;
      font-family: var(--ko-font-gloss);
      font-size: 9.5px;
      letter-spacing: 0.42em;
      color: var(--ko-cream-dim);
      text-transform: uppercase;
      opacity: 0.75;
      pointer-events: none;
      z-index: 3;
    }
    #ko-lyrics .ko-wordmark-sub::before,
    #ko-lyrics .ko-wordmark-sub::after {
      content: '✦';
      margin: 0 8px;
      font-size: 8px;
      color: var(--ko-gold);
      opacity: 0.8;
    }

    /* ==== SHOOTING STAR ==== fires on each line change, sweeps across the
       upper face of the card and dissolves. */
    #ko-lyrics .ko-comet {
      position: absolute;
      top: 18%; left: -14%;
      width: 4px; height: 4px;
      background: #fff;
      border-radius: 50%;
      box-shadow:
        0 0 8px 2px rgba(255,255,255,0.9),
        0 0 18px 4px rgba(200,220,255,0.55),
        0 0 30px 8px rgba(140,200,255,0.25);
      opacity: 0;
      pointer-events: none;
      z-index: 1;
    }
    #ko-lyrics .ko-comet::before {
      content: '';
      position: absolute;
      top: 50%; left: 4px;
      width: 88px; height: 1px;
      background: linear-gradient(to right,
        transparent 0%,
        rgba(255,255,255,0.9) 65%,
        #fff 100%);
      transform: translateY(-50%);
      filter: blur(0.3px);
      box-shadow: 0 0 6px rgba(200,220,255,0.5);
    }
    #ko-lyrics .ko-card.ko-fire-comet .ko-comet {
      animation: ko-comet-sweep 1.35s cubic-bezier(.12,.78,.45,1) 1;
    }
    @keyframes ko-comet-sweep {
      0%   { transform: translate(0, 0)       scale(0.8); opacity: 0; }
      12%  { opacity: 1; }
      78%  { opacity: 1; }
      100% { transform: translate(140%, -38%) scale(1);   opacity: 0; }
    }

    /* ==== LINE ENTRY BLOOM ==== each new line blooms in softly. */
    #ko-lyrics .ko-card.ko-fire-comet .ko-line-jp,
    #ko-lyrics .ko-card.ko-fire-comet .ko-line-en,
    #ko-lyrics .ko-card.ko-fire-comet .ko-rail {
      animation: ko-lyric-bloom 0.85s ease-out 1;
    }
    @keyframes ko-lyric-bloom {
      0%   { filter: blur(2px) brightness(1.4); opacity: 0.25; transform: translateY(2px); }
      60%  { opacity: 1; }
      100% { filter: none; opacity: 1; transform: none; }
    }

    /* ==== LYRIC DISPLAY ==== positioned via the position tick (locked).
       Typography and color are theme. */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }

    #ko-lyrics .ko-line-jp {
      position: relative;
      font-family: var(--ko-font-jp);
      font-weight: 500;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 42px;
      line-height: 2.4;
      padding-top: 0.45em;
      letter-spacing: 0.035em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      z-index: 2;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: 22px;
      font-weight: 400;
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 8px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 0 6px rgba(8,12,36,0.95), 0 1px 0 rgba(8,12,36,0.95), 0 0 2px rgba(8,12,36,1);
      user-select: none;
      opacity: 0.95;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      position: relative;
      font-family: var(--ko-font-body);
      font-style: italic;
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.22;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      z-index: 2;
      margin-top: 2px;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 30px;
      font-weight: 400;
      font-style: italic;
    }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CONSTELLATION RAIL ====
       Between JP and EN: a thin strip of colored star-dots (one per JP
       color chunk) connected by dotted hairlines. Mirrors each line's
       chunk count dynamically. */
    #ko-lyrics .ko-rail {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 14px;
      margin: 4px auto 10px;
      max-width: 68%;
      opacity: 0.88;
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-rail__dot {
      width: 8px; height: 8px;
      background: currentColor;
      border-radius: 50%;
      flex: 0 0 auto;
      box-shadow:
        0 0 6px currentColor,
        0 0 14px rgba(244,238,220,0.15);
      position: relative;
    }
    #ko-lyrics .ko-rail__dot::before {
      /* 4-point star glint on top of each dot */
      content: '';
      position: absolute;
      inset: -3px;
      background:
        linear-gradient(to bottom, transparent 45%, rgba(255,255,255,0.7) 50%, transparent 55%),
        linear-gradient(to right,  transparent 45%, rgba(255,255,255,0.7) 50%, transparent 55%);
      pointer-events: none;
      opacity: 0.7;
    }
    #ko-lyrics .ko-rail__line {
      flex: 1 1 auto;
      min-width: 24px;
      max-width: 92px;
      height: 1px;
      border-top: 1px dotted rgba(244,238,220,0.5);
      margin: 0 8px;
    }
    #ko-lyrics .ko-rail--empty {
      justify-content: center;
      opacity: 0.45;
    }
    #ko-lyrics .ko-rail--empty::before {
      content: '';
      display: block;
      width: 6px; height: 6px;
      background: var(--ko-cream-dim);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--ko-cream-faint);
    }

    /* ==== HALO ==== subtle star halo around the card so it reads as
       "floating in space" not "rectangle on video." */
    #ko-lyrics .ko-halo {
      position: absolute;
      inset: -40px;
      pointer-events: none;
      z-index: -1;
      background:
        radial-gradient(2px 2px at 15% 30%, rgba(255,255,255,0.55), transparent 55%),
        radial-gradient(1.4px 1.4px at 82% 20%, rgba(200,220,255,0.55), transparent 55%),
        radial-gradient(1.8px 1.8px at 25% 78%, rgba(255,255,255,0.45), transparent 55%),
        radial-gradient(1.4px 1.4px at 88% 72%, rgba(240,220,180,0.6), transparent 55%),
        radial-gradient(1px 1px at 50% 8%, rgba(255,255,255,0.5), transparent 55%),
        radial-gradient(1px 1px at 8% 55%, rgba(255,255,255,0.4), transparent 55%),
        radial-gradient(1.3px 1.3px at 94% 48%, rgba(200,230,255,0.45), transparent 55%);
      filter: blur(0.3px);
      animation: ko-halo-pulse 7s ease-in-out infinite;
    }
    @keyframes ko-halo-pulse {
      0%, 100% { opacity: 0.75; }
      50%      { opacity: 1; }
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

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';

  // Corner 4-point star SVG paths
  const starPath = 'M10 0.5 L11.5 8.5 L19.5 10 L11.5 11.5 L10 19.5 L8.5 11.5 L0.5 10 L8.5 8.5 Z';
  const cornerStars = `
    <svg class="ko-corner ko-corner--tl" viewBox="0 0 20 20" aria-hidden="true"><path d="${starPath}" fill="${THEME.cream}" opacity="0.9"/></svg>
    <svg class="ko-corner ko-corner--tr" viewBox="0 0 20 20" aria-hidden="true"><path d="${starPath}" fill="${THEME.cream}" opacity="0.9"/></svg>
    <svg class="ko-corner ko-corner--bl" viewBox="0 0 20 20" aria-hidden="true"><path d="${starPath}" fill="${THEME.cream}" opacity="0.85"/></svg>
    <svg class="ko-corner ko-corner--br" viewBox="0 0 20 20" aria-hidden="true"><path d="${starPath}" fill="${THEME.cream}" opacity="0.85"/></svg>
  `;

  // Orbital ring crown — SVG ellipse with a tiny planet animated along it.
  // Two unique IDs so the top/bottom rings do not collide on the gradient.
  const orbitSVG = (flipClass, suffix) => `
    <svg class="ko-orbit ${flipClass || ''}" viewBox="0 0 400 28" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="ko-planet-g-${suffix}" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="${THEME.gold}" stop-opacity="1"/>
          <stop offset="70%"  stop-color="${THEME.gold}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="${THEME.gold}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="200" cy="14" rx="190" ry="10"
        fill="none" stroke="${THEME.creamDim}" stroke-width="0.6" stroke-dasharray="1.5 3"/>
      <ellipse cx="200" cy="14" rx="190" ry="10"
        fill="none" stroke="${THEME.creamFaint}" stroke-width="0.3"/>
      <circle r="2.8" fill="url(#ko-planet-g-${suffix})">
        <animateMotion dur="28s" repeatCount="indefinite"
          path="M 10 14 A 190 10 0 1 1 390 14 A 190 10 0 1 1 10 14"/>
      </circle>
    </svg>
  `;

  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="ko-halo"></div>
      <div class="ko-card">
        ${cornerStars}
        ${orbitSVG('', 'top')}
        ${orbitSVG('ko-orbit--bottom', 'bot')}
        <div class="ko-wordmark-sub">MIKA NAKASHIMA · GUNDAM SEED</div>
        <div class="ko-wordmark">Find The Way</div>
        <div class="ko-comet"></div>
        <div class="ko-line-jp" id="ko-line-jp"></div>
        <div class="ko-rail" id="ko-rail"></div>
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + LRCLib fetching (fallback) ---
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

  // --- Position tick (locked) ---
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

  // --- Main tick (locked plumbing) ---
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

  // --- Dual loop: RAF + setInterval (locked) ---
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

  // --- Offset hotkeys: [ ] \ (locked) ---
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

  // --- Rebuild hook (locked) ---
  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

  // --- Translation merge (locked shape) ---
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

  // --- Color + gloss colorizer, constellation rail, comet trigger ---
  // Extended COLOR_POLL: rebuilds the rail on each new line and fires the
  // comet/bloom animation via CSS class on the card. NO MutationObserver
  // (would feedback-loop with the tick's textContent writes).
  let _lastWCJp = '';
  let _cometTimer = null;

  const cardEl = () => lyrics.querySelector('.ko-card');
  const railEl = () => document.getElementById('ko-rail');

  const fireLineAnim = () => {
    const card = cardEl();
    if (!card) return;
    card.classList.remove('ko-fire-comet');
    void card.offsetWidth;   // force reflow so animation re-fires
    card.classList.add('ko-fire-comet');
    if (_cometTimer) clearTimeout(_cometTimer);
    _cometTimer = setTimeout(() => {
      if (window.__koGen !== MY_GEN) return;
      const c = cardEl();
      if (c) c.classList.remove('ko-fire-comet');
    }, 1500);
  };

  const renderRail = (jpSegs) => {
    const rail = railEl();
    if (!rail) return;
    const colors = window.__wordAlign.colors;
    if (!jpSegs || !jpSegs.length) {
      if (!rail.classList.contains('ko-rail--empty')) {
        rail.className = 'ko-rail ko-rail--empty';
        rail.textContent = '';
      }
      return;
    }
    const parts = [];
    jpSegs.forEach((seg, i) => {
      const ci = seg[1];
      const c = colors[ci] || colors[0];
      if (i > 0) parts.push('<span class="ko-rail__line"></span>');
      parts.push(`<span class="ko-rail__dot" style="color:${c}"></span>`);
    });
    rail.className = 'ko-rail';
    setHTML(rail, parts.join(''));
  };

  const COLOR_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(COLOR_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    if (!jpEl || !enEl) return;
    const jp = jpEl.textContent;
    if (jp === _lastWCJp) return;
    _lastWCJp = jp;

    // Fire comet + bloom only on new content (not on clears).
    if (jp.trim()) fireLineAnim();

    if (!jp.trim()) {
      renderRail(null);
      return;
    }

    const alignment = window.__wordAlign.data && window.__wordAlign.data[jp];
    if (!alignment) {
      renderRail(null);
      return;
    }

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

    renderRail(alignment.jp);
  }, 150);

})();
