// ============================================================================
// KARAOKE OVERLAY — DAYBREAK FRONTLINE (Rock Version) / Malice Evermore cover
// Design: Twilight-Highway Pulp. Vintage roadside poster, sunset-to-dawn drive.
// Signature feature: a DAWN METER horizon bar beneath the lyric card, with a
// traveling 4-point starburst sun that crosses from dusk to dawn as the song
// progresses. The lyric card's atmosphere warms in sync.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — sunset on the highway. Deep dusk navy + burnt amber + oxblood red +
  // cream paper, with electric cyan as the MV-echo signature accent.
  // ==========================================================================
  const THEME = {
    fontsHref: 'https://fonts.googleapis.com/css2?family=Anton&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,500;1,9..144,700;1,9..144,900&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Shippori+Mincho:wght@500;700;800&family=Playfair+Display:ital,wght@1,500;1,700&display=swap',
    fontDisplay: '"Anton", sans-serif',
    fontBody:    '"Libre Caslon Text", serif',
    fontSerif:   '"Fraunces", serif',
    fontJP:      '"Shippori Mincho", serif',
    fontGloss:   '"Playfair Display", serif',

    paper:      '#f4e7cc',
    paperShade: '#e3d0a8',
    oxblood:    '#8a2935',
    oxbloodDk:  '#5b1822',
    amber:      '#f5a64a',
    burntGold:  '#d98838',
    duskNavy:   '#1a1d3a',
    duskPurple: '#33305c',
    cyanMV:     '#5BE9F0',
    ink:        '#2a1a22',

    lyricColorJP:  '#fff4d8',
    lyricColorEN:  '#fff4d8',
    lyricStrokeJP: '5px #2a0f18',
    lyricStrokeEN: '5px #2a0f18',
    lyricShadowJP: '0 0 14px rgba(245,166,74,0.55), 0 0 30px rgba(26,29,58,0.55), 0 3px 0 rgba(91,24,34,0.9)',
    lyricShadowEN: '0 0 16px rgba(245,166,74,0.5), 0 0 32px rgba(26,29,58,0.55), 0 2px 0 rgba(91,24,34,0.85)',
  };

  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  window.__setlist         = window.__setlist         || [];
  window.__parsedLyrics    = window.__parsedLyrics    || {};
  window.__transCache      = window.__transCache      || {};
  window.__plainLyrics     = window.__plainLyrics     || {};
  window.__lyricOffsets    = window.__lyricOffsets    || {};
  window.__wordAlign = window.__wordAlign || {
    colors: ['#FFC857', '#5BE9F0', '#FF7C7C', '#F2D08B', '#C7A8F0', '#FFA05A'],
    data: {}
  };
  window.__wordAlign.colors = ['#FFC857', '#5BE9F0', '#FF7C7C', '#F2D08B', '#C7A8F0', '#FFA05A'];
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold = window.__koMaxHold || 10;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  if (!document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  const GRAIN_URL = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
      <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.12  0 0 0 0 0.08  0 0 0 0 0.05  0 0 0 0.55 0'/></filter>
      <rect width='100%' height='100%' filter='url(#n)' opacity='0.55'/>
    </svg>`
  );

  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    @property --ko-dawn {
      syntax: '<number>';
      inherits: true;
      initial-value: 0;
    }

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
      --ko-dawn: 0;
    }

    #karaoke-root, #ko-lyrics {
      --ko-paper:      ${THEME.paper};
      --ko-paper-sh:   ${THEME.paperShade};
      --ko-oxblood:    ${THEME.oxblood};
      --ko-oxblood-dk: ${THEME.oxbloodDk};
      --ko-amber:      ${THEME.amber};
      --ko-gold:       ${THEME.burntGold};
      --ko-navy:       ${THEME.duskNavy};
      --ko-dusk:       ${THEME.duskPurple};
      --ko-cyan:       ${THEME.cyanMV};
      --ko-ink:        ${THEME.ink};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-gloss:   ${THEME.fontGloss};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* Diagonal power-line filaments — echo the MV's signature wire lattice */
    #karaoke-root::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        repeating-linear-gradient(
          12deg,
          transparent 0 120px,
          rgba(255, 244, 216, 0.06) 120px 121px,
          transparent 121px 260px,
          rgba(91, 24, 34, 0.08) 260px 261px
        ),
        repeating-linear-gradient(
          -7deg,
          transparent 0 200px,
          rgba(245, 166, 74, 0.05) 200px 201px
        );
      mix-blend-mode: screen;
      opacity: 0.9;
    }

    /* Film grain overlay */
    #karaoke-root::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: url("${GRAIN_URL}");
      background-size: 240px 240px;
      opacity: 0.18;
      mix-blend-mode: overlay;
    }

    /* Rotated edge banners — homage to the MV's rotated side text */
    .ko-edge {
      position: fixed;
      top: 50%;
      color: var(--ko-paper);
      font-family: var(--ko-font-display);
      font-weight: 400;
      letter-spacing: 0.55em;
      font-size: 13px;
      text-transform: uppercase;
      text-shadow: 0 0 10px rgba(138, 41, 53, 0.7), 0 1px 0 rgba(0,0,0,0.6);
      mix-blend-mode: screen;
      opacity: 0.82;
      user-select: none;
      white-space: nowrap;
    }
    .ko-edge-l {
      left: 18px;
      transform: translateY(-50%) rotate(-90deg);
      transform-origin: left center;
    }
    .ko-edge-r {
      right: 18px;
      transform: translateY(-50%) rotate(90deg);
      transform-origin: right center;
    }
    .ko-edge .ko-edge-dot {
      display: inline-block;
      width: 5px;
      height: 5px;
      background: var(--ko-amber);
      transform: rotate(45deg);
      margin: 0 0.8em;
      vertical-align: middle;
      box-shadow: 0 0 6px rgba(245, 166, 74, 0.8);
    }

    /* Top-left pulp-poster stamp */
    .ko-stamp {
      position: fixed;
      top: 22px;
      left: 28px;
      padding: 10px 18px 12px;
      border: 1.5px solid var(--ko-paper);
      border-top-width: 3px;
      border-bottom-width: 3px;
      color: var(--ko-paper);
      background: linear-gradient(180deg, rgba(26, 29, 58, 0.58), rgba(91, 24, 34, 0.42));
      font-family: var(--ko-font-display);
      letter-spacing: 0.22em;
      line-height: 1;
      box-shadow: 0 0 0 1px rgba(245, 166, 74, 0.38), 0 8px 24px rgba(0,0,0,0.45);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      opacity: 0.92;
      max-width: 320px;
    }
    .ko-stamp .ko-stamp-hd {
      font-size: 11px;
      color: var(--ko-cyan);
      opacity: 0.9;
      letter-spacing: 0.45em;
      margin-bottom: 4px;
      text-shadow: 0 0 8px rgba(91, 233, 240, 0.55);
    }
    .ko-stamp .ko-stamp-ti {
      font-size: 26px;
      color: var(--ko-paper);
      text-shadow: 0 0 14px rgba(245, 166, 74, 0.7);
    }
    .ko-stamp .ko-stamp-divider {
      display: block;
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--ko-amber), transparent);
      margin: 5px 0 4px;
      opacity: 0.7;
    }
    .ko-stamp .ko-stamp-sub {
      font-family: var(--ko-font-body);
      font-style: italic;
      font-weight: 400;
      letter-spacing: 0.08em;
      font-size: 10.5px;
      margin-top: 5px;
      color: var(--ko-amber);
      opacity: 0.95;
    }

    /* DAWN METER — signature feature. Sits below the lyric card. */
    #ko-horizon {
      position: fixed;
      pointer-events: none;
      z-index: 2147483090;
      transform: translate(-50%, 0);
    }
    #ko-horizon .ko-horizon-track {
      position: relative;
      height: 2px;
      width: 100%;
      background: linear-gradient(
        90deg,
        rgba(26, 29, 58, 0.0) 0%,
        rgba(51, 48, 92, 0.85) 15%,
        rgba(138, 41, 53, 0.95) 45%,
        rgba(217, 136, 56, 1) 72%,
        rgba(245, 166, 74, 1) 88%,
        rgba(255, 244, 216, 1) 100%
      );
      box-shadow:
        0 0 10px rgba(245, 166, 74, 0.8),
        0 0 24px rgba(138, 41, 53, 0.45),
        0 -2px 20px rgba(91, 233, 240, 0.25);
    }
    #ko-horizon .ko-horizon-tick {
      position: absolute;
      top: -9px;
      width: 2px;
      height: 20px;
      background: rgba(255, 244, 216, 0.5);
      box-shadow: 0 0 6px rgba(245, 166, 74, 0.8);
    }
    .ko-hz-dusk { left: 0; }
    .ko-hz-dawn { right: 0; }
    #ko-horizon .ko-horizon-label {
      position: absolute;
      top: 12px;
      font-family: var(--ko-font-display);
      font-size: 10.5px;
      letter-spacing: 0.42em;
      color: var(--ko-paper);
      opacity: 0.7;
      white-space: nowrap;
      text-shadow: 0 0 6px rgba(0,0,0,0.6);
    }
    .ko-hz-dusk-lbl { left: 4px; }
    .ko-hz-dawn-lbl { right: 4px; }

    /* Traveling starburst sun */
    #ko-horizon .ko-sunburst {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%);
      width: 44px;
      height: 44px;
    }
    #ko-horizon .ko-sunburst-core {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle,
        rgba(255, 244, 216, 1) 0%,
        rgba(245, 166, 74, 0.95) 30%,
        rgba(217, 136, 56, 0.75) 55%,
        rgba(138, 41, 53, 0.25) 75%,
        transparent 100%
      );
      border-radius: 50%;
      filter: blur(0.5px);
      animation: ko-pulse 2.6s ease-in-out infinite;
    }
    #ko-horizon .ko-sunburst-rays {
      position: absolute;
      inset: 0;
      background: conic-gradient(
        from 0deg,
        transparent 0deg 6deg,
        rgba(255, 244, 216, 0.9) 10deg 14deg,
        transparent 18deg 86deg,
        rgba(255, 244, 216, 0.9) 94deg 104deg,
        transparent 108deg 174deg,
        rgba(255, 244, 216, 0.9) 178deg 184deg,
        transparent 188deg 264deg,
        rgba(255, 244, 216, 0.9) 274deg 284deg,
        transparent 288deg 360deg
      );
      filter: drop-shadow(0 0 8px rgba(245, 166, 74, 0.9));
      animation: ko-spin 18s linear infinite;
      opacity: 0.85;
    }
    #ko-horizon .ko-sunburst-ring {
      position: absolute;
      inset: -14px;
      border: 1px solid rgba(245, 166, 74, 0.4);
      border-radius: 50%;
      animation: ko-pulse 3.2s ease-in-out infinite;
    }
    @keyframes ko-pulse {
      0%,100% { transform: scale(1); opacity: 0.95; }
      50%     { transform: scale(1.08); opacity: 0.75; }
    }
    @keyframes ko-spin { to { transform: rotate(360deg); } }

    /* Lyric card — torn vintage poster feel */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 22px 36px 26px;
      transform: rotate(-0.6deg);
      background: linear-gradient(
        180deg,
        color-mix(in oklab, var(--ko-navy) calc((1 - var(--ko-dawn)) * 72% + 15%), var(--ko-amber)) 0%,
        color-mix(in oklab, var(--ko-dusk) calc((1 - var(--ko-dawn)) * 65% + 15%), var(--ko-gold)) 100%
      );
      border: 1px solid rgba(255, 244, 216, 0.35);
      box-shadow:
        0 0 0 3px rgba(0,0,0,0.45),
        0 0 0 5px var(--ko-oxblood),
        0 0 0 6px var(--ko-paper),
        0 0 0 8px var(--ko-oxblood-dk),
        0 30px 80px -20px rgba(0,0,0,0.7),
        0 0 60px -15px rgba(91, 233, 240, 0.35),
        0 0 100px -20px rgba(245, 166, 74, calc(0.35 + var(--ko-dawn) * 0.4));
    }
    .ko-slot::before {
      content: "";
      position: absolute;
      inset: -8px;
      border-radius: 2px;
      background:
        radial-gradient(ellipse at top left, rgba(245, 166, 74, 0.25), transparent 40%),
        radial-gradient(ellipse at bottom right, rgba(91, 233, 240, calc(0.15 + var(--ko-dawn) * 0.3)), transparent 45%);
      pointer-events: none;
      z-index: -1;
      filter: blur(12px);
    }
    /* Vintage poster corner registration marks */
    .ko-slot::after {
      content: "";
      position: absolute;
      inset: 3px;
      pointer-events: none;
      background-image:
        linear-gradient(var(--ko-paper), var(--ko-paper)),
        linear-gradient(var(--ko-paper), var(--ko-paper)),
        linear-gradient(var(--ko-paper), var(--ko-paper)),
        linear-gradient(var(--ko-paper), var(--ko-paper)),
        linear-gradient(var(--ko-paper), var(--ko-paper)),
        linear-gradient(var(--ko-paper), var(--ko-paper)),
        linear-gradient(var(--ko-paper), var(--ko-paper)),
        linear-gradient(var(--ko-paper), var(--ko-paper));
      background-repeat: no-repeat;
      background-size:
        12px 1.5px, 1.5px 12px,
        12px 1.5px, 1.5px 12px,
        12px 1.5px, 1.5px 12px,
        12px 1.5px, 1.5px 12px;
      background-position:
        0 0, 0 0,
        100% 0, 100% 0,
        0 100%, 0 100%,
        100% 100%, 100% 100%;
      opacity: 0.6;
    }

    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 48px;
      line-height: 2.3;
      padding-top: 0.4em;
      letter-spacing: 0.05em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      position: relative;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    /* Gloss row — cyan italic, MV-echo */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: 22px;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.015em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: ${THEME.cyanMV};
      paint-order: stroke fill;
      -webkit-text-stroke: 2.5px #0a0a18;
      text-shadow:
        0 0 8px rgba(91, 233, 240, 0.85),
        0 0 14px rgba(0, 0, 0, 0.75),
        0 1px 0 rgba(0,0,0,0.9);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-serif);
      font-weight: 500;
      font-style: italic;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.2;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      font-variation-settings: "SOFT" 50, "WONK" 1;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 30px;
      font-weight: 400;
      font-style: normal;
    }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  setHTML(root, `
    <div class="ko-stamp">
      <div class="ko-stamp-hd">PHASE CONNECT SAGA</div>
      <div class="ko-stamp-ti">DAYBREAK FRONTLINE</div>
      <div class="ko-stamp-divider"></div>
      <div class="ko-stamp-sub">Orangestar &middot; Rock cover by Malice Evermore</div>
    </div>
    <div class="ko-edge ko-edge-l">MALICE EVERMORE<span class="ko-edge-dot"></span>DAYBREAK FRONTLINE<span class="ko-edge-dot"></span>ROCK VER.</div>
    <div class="ko-edge ko-edge-r">ORANGESTAR<span class="ko-edge-dot"></span>最前線飛ばせ<span class="ko-edge-dot"></span>PHASE CONNECT</div>
  `);
  document.body.appendChild(root);

  const horizon = document.createElement('div');
  horizon.id = 'ko-horizon';
  setHTML(horizon, `
    <div class="ko-horizon-track">
      <div class="ko-horizon-tick ko-hz-dusk"></div>
      <div class="ko-horizon-tick ko-hz-dawn"></div>
      <div class="ko-sunburst" id="ko-sunburst">
        <div class="ko-sunburst-ring"></div>
        <div class="ko-sunburst-rays"></div>
        <div class="ko-sunburst-core"></div>
      </div>
    </div>
    <div class="ko-horizon-label ko-hz-dusk-lbl">DUSK</div>
    <div class="ko-horizon-label ko-hz-dawn-lbl">DAYBREAK</div>
  `);
  document.body.appendChild(horizon);

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

  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';
  let lastDawnPct = -1;

  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}`;
    if (posKey !== lastLyricsPos) {
      lastLyricsPos = posKey;
      const centerX = r.left + r.width / 2;
      lyrics.style.left     = centerX + 'px';
      lyrics.style.top      = (r.top + r.height * 0.66) + 'px';
      lyrics.style.width    = (r.width * 0.62) + 'px';
      lyrics.style.maxWidth = (r.width * 0.62) + 'px';

      horizon.style.left  = centerX + 'px';
      horizon.style.top   = (r.top + r.height * 0.90) + 'px';
      horizon.style.width = (r.width * 0.54) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Dawn-progress driver: --ko-dawn (0→1) + sunburst X position.
  //     Eased cosine so the sky transition feels slow at ends, faster middle. ---
  const sunburst = horizon.querySelector('#ko-sunburst');
  const dawnTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (v && isFinite(v.currentTime)) {
      const t = v.currentTime;
      const sl = window.__setlist;
      let song = null;
      for (let i = 0; i < sl.length; i++) {
        if (t >= sl[i].s && t < sl[i].end) { song = sl[i]; break; }
      }
      if (song && song.dur) {
        const p = Math.max(0, Math.min(1, (t - song.s) / song.dur));
        const dawn = 0.5 - 0.5 * Math.cos(Math.PI * p);
        const pct  = Math.round(p * 10000) / 10000;
        if (pct !== lastDawnPct) {
          lastDawnPct = pct;
          root.style.setProperty('--ko-dawn', dawn.toFixed(4));
          sunburst.style.left = (p * 100).toFixed(2) + '%';
        }
      }
    }
    setTimeout(dawnTick, 120);
  };
  dawnTick();

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
