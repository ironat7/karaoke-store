// ============================================================================
// Lagtrain (ラグトレイン) ver. Jelly Hoshiumi — karaoke overlay
// Art direction: pencil-sketch storyboard paper, vintage train ticket.
// Signature feature: giant handwritten brush-kanji watermark drifting behind
// the ticket, pulling the dominant character from the current lyric line —
// the same motif the MV uses in its pillarboxes.
// ============================================================================

(() => {

  const THEME = {
    fontsHref:   'https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap',
    fontDisplay: '"Fraunces", "EB Garamond", Georgia, serif',
    fontBody:    '"Inter", system-ui, sans-serif',
    fontJP:      '"Klee One", "Shippori Mincho", "Hiragino Mincho ProN", serif',

    // Paper + pencil base
    paper:       '#F2EEE2',
    paperEdge:   '#E4DDC8',
    paperDeep:   '#D9D1B8',
    pencil:      '#2C3440',
    pencilSoft:  '#5A6574',
    pencilLine:  '#8F95A0',

    // Jelly's palette
    jellyBlue:   '#A8D6E8',
    jellyTurq:   '#4FB0C6',
    jellyTeal:   '#1F5068',
    jellyYellow: '#EBC74B',
    jellyMint:   '#A8D4B6',
    jellyCoral:  '#C26B5A',

    lyricColorEN:  '#2C3440',
    lyricColorJP:  '#1E2632',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(242,238,226,0.9), 0 0 10px rgba(242,238,226,0.7)',
    lyricShadowJP: '0 1px 0 rgba(242,238,226,0.9), 0 0 10px rgba(242,238,226,0.7)',
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
    colors: [
      '#2C3440',  // 0 pencil ink — subject/topic spine
      '#1F5068',  // 1 deep teal — her dress / "you" / places
      '#B36B29',  // 2 amber stamp — action verbs, motion
      '#3A8FA8',  // 3 turquoise eye — time, trains, movement
      '#A33E3E',  // 4 muted coral — emotion, emphasis
      '#5A7240',  // 5 olive sage — bandages / conditional & modifier
    ],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  if (THEME.fontsHref && !document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

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
      --ko-paper:       ${THEME.paper};
      --ko-paper-edge:  ${THEME.paperEdge};
      --ko-paper-deep:  ${THEME.paperDeep};
      --ko-pencil:      ${THEME.pencil};
      --ko-pencil-soft: ${THEME.pencilSoft};
      --ko-pencil-line: ${THEME.pencilLine};
      --ko-jelly-blue:  ${THEME.jellyBlue};
      --ko-jelly-turq:  ${THEME.jellyTurq};
      --ko-jelly-teal:  ${THEME.jellyTeal};
      --ko-jelly-yel:   ${THEME.jellyYellow};
      --ko-jelly-mint:  ${THEME.jellyMint};
      --ko-jelly-coral: ${THEME.jellyCoral};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ---- Giant drifting brush-kanji watermark (signature motif) ---- */
    .ko-kanji-watermark {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-family: var(--ko-font-jp);
      font-weight: 600;
      font-size: 420px;
      line-height: 1;
      color: var(--ko-pencil);
      opacity: 0;
      transition: opacity 0.9s ease, transform 1.4s ease;
      pointer-events: none;
      user-select: none;
      text-shadow:
        0 0 60px rgba(242,238,226,0.6),
        0 4px 0 rgba(44,52,64,0.05);
      letter-spacing: -0.02em;
      white-space: nowrap;
      filter: blur(0.3px);
    }
    .ko-kanji-watermark.ko-wm-show {
      opacity: 0.11;
    }
    .ko-kanji-watermark.ko-wm-left  { transform: translate(-78%, -58%) rotate(-2deg); }
    .ko-kanji-watermark.ko-wm-right { transform: translate(-22%, -42%) rotate(1deg); }

    /* ---- Track of tiny pencil dashes behind the ticket (rails) ---- */
    .ko-rail {
      position: absolute;
      height: 2px;
      background-image: linear-gradient(
        to right,
        rgba(44,52,64,0.28) 0 22px,
        transparent 22px 36px
      );
      background-size: 36px 2px;
      background-repeat: repeat-x;
      opacity: 0.55;
      pointer-events: none;
    }

    /* ---- Subtle drifting stars (Jelly's star accessory motif) ---- */
    .ko-stars {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .ko-star {
      position: absolute;
      width: 14px;
      height: 14px;
      color: var(--ko-jelly-yel);
      opacity: 0;
      animation: ko-star-twinkle 7s ease-in-out infinite;
      filter: drop-shadow(0 0 6px rgba(235,199,75,0.4));
    }
    .ko-star svg { width: 100%; height: 100%; display: block; }
    @keyframes ko-star-twinkle {
      0%, 100% { opacity: 0; transform: scale(0.6) rotate(0deg); }
      15%      { opacity: 0.85; transform: scale(1) rotate(5deg); }
      45%      { opacity: 0.35; transform: scale(0.85) rotate(-4deg); }
      70%      { opacity: 0.75; transform: scale(0.95) rotate(3deg); }
    }

    /* ==== LYRIC DISPLAY — the train ticket ==== */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }

    /* The ticket paper — layered behind .ko-slot as a pseudo. */
    #ko-lyrics .ko-ticket {
      position: relative;
      padding: 42px 44px 38px;
      isolation: isolate;
    }
    #ko-lyrics .ko-ticket::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        /* warm paper shading */
        radial-gradient(140% 90% at 50% 0%, rgba(255,251,238,0.55) 0%, transparent 55%),
        radial-gradient(80% 60% at 90% 100%, rgba(217,209,184,0.35) 0%, transparent 60%),
        linear-gradient(180deg, ${THEME.paper} 0%, ${THEME.paperEdge} 100%);
      /* Perforated ticket edges: dotted punch-holes top and bottom */
      -webkit-mask:
        radial-gradient(circle 8px at 50% 0, transparent 98%, black 100%) 0 0 / 24px 100%,
        linear-gradient(black, black);
      -webkit-mask-composite: source-over;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.7) inset,
        0 -1px 0 rgba(0,0,0,0.05) inset,
        0 18px 42px -18px rgba(44,52,64,0.45),
        0 2px 8px -2px rgba(44,52,64,0.25);
      border-top: 1.5px dashed rgba(44,52,64,0.38);
      border-bottom: 1.5px dashed rgba(44,52,64,0.38);
      z-index: -1;
    }
    /* Pencil-drawn side frame lines — thin, slightly offset, organic */
    #ko-lyrics .ko-ticket::after {
      content: "";
      position: absolute;
      left: 10px;
      right: 10px;
      top: 10px;
      bottom: 10px;
      border-left:  1px solid rgba(44,52,64,0.35);
      border-right: 1px solid rgba(44,52,64,0.35);
      pointer-events: none;
      z-index: -1;
    }

    /* Ticket header row — station-board style */
    #ko-lyrics .ko-ticket-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 22px;
      font-family: var(--ko-font-body);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ko-pencil-soft);
      padding: 0 6px;
    }
    #ko-lyrics .ko-ticket-head .ko-th-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #ko-lyrics .ko-ticket-head .ko-th-label {
      font-family: var(--ko-font-jp);
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.12em;
      color: var(--ko-jelly-teal);
      text-transform: none;
    }
    #ko-lyrics .ko-ticket-head .ko-th-val {
      color: var(--ko-pencil);
      font-weight: 600;
    }
    #ko-lyrics .ko-ticket-head .ko-th-star {
      color: var(--ko-jelly-yel);
      font-size: 14px;
      line-height: 1;
      filter: drop-shadow(0 0 4px rgba(235,199,75,0.5));
    }
    #ko-lyrics .ko-ticket-head .ko-th-punch {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1.5px solid var(--ko-pencil-soft);
      background: var(--ko-paper-deep);
      display: inline-block;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
    }

    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 600;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.3;
      padding-top: 0.4em;
      letter-spacing: 0.02em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 1px 0 rgba(242,238,226,0.95), 0 0 5px rgba(242,238,226,0.9);
      user-select: none;
      opacity: 0.92;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 400;
      font-style: italic;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.22;
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
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* Divider between header and lyrics — a pencil hairline with a tiny mark */
    #ko-lyrics .ko-hair {
      height: 1px;
      background: linear-gradient(
        to right,
        transparent 0%,
        rgba(44,52,64,0.35) 20%,
        rgba(44,52,64,0.45) 50%,
        rgba(44,52,64,0.35) 80%,
        transparent 100%
      );
      margin: 0 10px 18px;
      position: relative;
    }
    #ko-lyrics .ko-hair::before {
      content: "✦";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--ko-jelly-yel);
      background: var(--ko-paper);
      padding: 0 10px;
      font-size: 11px;
      letter-spacing: 0.1em;
    }

    /* Train-track progress rail at bottom of ticket */
    #ko-lyrics .ko-track-wrap {
      margin-top: 18px;
      padding: 0 10px;
      position: relative;
      height: 18px;
    }
    #ko-lyrics .ko-track {
      position: absolute;
      left: 14px;
      right: 14px;
      top: 9px;
      height: 2px;
      background-image: linear-gradient(
        to right,
        rgba(44,52,64,0.4) 0 14px,
        transparent 14px 22px
      );
      background-size: 22px 2px;
      background-repeat: repeat-x;
    }
    #ko-lyrics .ko-track-rails {
      position: absolute;
      left: 14px;
      right: 14px;
      top: 4px;
      bottom: 4px;
      border-top: 1px solid rgba(44,52,64,0.25);
      border-bottom: 1px solid rgba(44,52,64,0.25);
    }
    #ko-lyrics .ko-train {
      position: absolute;
      top: 50%;
      left: 14px;
      transform: translate(-50%, -50%);
      width: 22px;
      height: 14px;
      background: var(--ko-jelly-teal);
      border-radius: 4px 4px 2px 2px;
      box-shadow:
        inset 0 -2px 0 rgba(0,0,0,0.25),
        0 2px 4px rgba(44,52,64,0.3),
        0 0 8px rgba(79,176,198,0.5);
      transition: left 0.4s linear;
    }
    #ko-lyrics .ko-train::before {
      content: "";
      position: absolute;
      top: 3px;
      left: 4px;
      right: 4px;
      height: 3px;
      background: var(--ko-jelly-yel);
      border-radius: 1px;
      opacity: 0.9;
    }
    #ko-lyrics .ko-train::after {
      content: "";
      position: absolute;
      bottom: -3px;
      left: 3px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--ko-pencil);
      box-shadow: 12px 0 0 var(--ko-pencil);
    }

    /* Corner bracket marks (ticket-stub feel) */
    #ko-lyrics .ko-corner {
      position: absolute;
      width: 14px;
      height: 14px;
      border: 1.5px solid var(--ko-pencil);
      opacity: 0.65;
    }
    #ko-lyrics .ko-corner.tl { top: 6px;    left: 6px;    border-right: 0; border-bottom: 0; }
    #ko-lyrics .ko-corner.tr { top: 6px;    right: 6px;   border-left:  0; border-bottom: 0; }
    #ko-lyrics .ko-corner.bl { bottom: 6px; left: 6px;    border-right: 0; border-top:    0; }
    #ko-lyrics .ko-corner.br { bottom: 6px; right: 6px;   border-left:  0; border-top:    0; }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // Background decoration layer: drifting kanji watermark + stars
  // Positioned via a dedicated tick so it tracks the lyric card region.
  const wmContainer = document.createElement('div');
  wmContainer.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483050;';
  wmContainer.id = 'ko-wm-layer';
  setHTML(wmContainer, `
    <div class="ko-kanji-watermark" id="ko-kanji-wm"></div>
    <div class="ko-stars" id="ko-stars"></div>
  `);
  root.appendChild(wmContainer);

  // Sprinkle stars with staggered timing
  const starsEl = wmContainer.querySelector('#ko-stars');
  const starPositions = [
    { x: 8,  y: 18, delay: 0,   size: 16 },
    { x: 92, y: 12, delay: 1.8, size: 12 },
    { x: 14, y: 78, delay: 3.2, size: 14 },
    { x: 86, y: 82, delay: 4.6, size: 14 },
    { x: 6,  y: 48, delay: 2.2, size: 10 },
    { x: 96, y: 52, delay: 5.8, size: 10 },
  ];
  const starSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L14.2 9.2 L21.6 9.2 L15.6 13.6 L18 20.8 L12 16.2 L6 20.8 L8.4 13.6 L2.4 9.2 L9.8 9.2 Z"/></svg>';
  starsEl.textContent = '';
  starPositions.forEach(p => {
    const s = document.createElement('div');
    s.className = 'ko-star';
    s.style.left = p.x + '%';
    s.style.top = p.y + '%';
    s.style.width = p.size + 'px';
    s.style.height = p.size + 'px';
    s.style.animationDelay = p.delay + 's';
    setHTML(s, starSvg);
    starsEl.appendChild(s);
  });

  // Lyric ticket
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-ticket">
      <div class="ko-corner tl"></div>
      <div class="ko-corner tr"></div>
      <div class="ko-corner bl"></div>
      <div class="ko-corner br"></div>
      <div class="ko-ticket-head">
        <div class="ko-th-cell">
          <span class="ko-th-label">行先</span>
          <span class="ko-th-val">Lagtrain</span>
        </div>
        <div class="ko-th-cell">
          <span class="ko-th-star">★</span>
          <span>ver. Jelly Hoshiumi</span>
          <span class="ko-th-star">★</span>
        </div>
        <div class="ko-th-cell">
          <span>各駅停車</span>
          <span class="ko-th-punch"></span>
        </div>
      </div>
      <div class="ko-hair"></div>
      <div class="ko-slot">
        <div class="ko-line-jp" id="ko-line-jp"></div>
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>
      <div class="ko-track-wrap">
        <div class="ko-track-rails"></div>
        <div class="ko-track"></div>
        <div class="ko-train" id="ko-train"></div>
      </div>
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

  // --- Cached state for DOM-write guards ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';
  let lastWmKanji = '';
  let lastTrainPct = -1;
  let wmToggle = 0;

  // --- Position tick: ticket + kanji watermark layer ---
  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}`;
    if (posKey !== lastLyricsPos) {
      lastLyricsPos = posKey;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.66;
      const w  = r.width * 0.62;
      lyrics.style.left     = cx + 'px';
      lyrics.style.top      = cy + 'px';
      lyrics.style.width    = w  + 'px';
      lyrics.style.maxWidth = w  + 'px';

      // Watermark layer: match the lyric region so drift stays centered on card
      wmContainer.style.left   = (cx - w)   + 'px';
      wmContainer.style.top    = (cy - r.height * 0.35) + 'px';
      wmContainer.style.width  = (w * 2)    + 'px';
      wmContainer.style.height = (r.height * 0.7) + 'px';

      // Scale kanji with video height
      const kwm = wmContainer.querySelector('#ko-kanji-wm');
      if (kwm) kwm.style.fontSize = Math.round(r.height * 0.72) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Kanji watermark updater: picks the first kanji from current JP line ---
  const KANJI_RE = /[\u4E00-\u9FFF]/;
  const updateWatermark = (jpText) => {
    if (!jpText) {
      const el = wmContainer.querySelector('#ko-kanji-wm');
      if (el) { el.classList.remove('ko-wm-show'); }
      lastWmKanji = '';
      return;
    }
    // Prefer the first kanji; fallback to first kana-or-kanji char
    let pick = '';
    for (const ch of jpText) {
      if (KANJI_RE.test(ch)) { pick = ch; break; }
    }
    if (!pick) {
      for (const ch of jpText) {
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(ch)) { pick = ch; break; }
      }
    }
    if (!pick || pick === lastWmKanji) return;
    lastWmKanji = pick;
    const el = wmContainer.querySelector('#ko-kanji-wm');
    if (!el) return;
    // Two-phase swap: fade out, set text, reposition drift, fade in
    el.classList.remove('ko-wm-show', 'ko-wm-left', 'ko-wm-right');
    setTimeout(() => {
      if (window.__koGen !== MY_GEN) return;
      el.textContent = pick;
      wmToggle = 1 - wmToggle;
      el.classList.add(wmToggle ? 'ko-wm-left' : 'ko-wm-right');
      el.classList.add('ko-wm-show');
    }, 300);
  };

  // --- Progress train updater ---
  const updateTrain = (inSong, songDur) => {
    if (!songDur) return;
    const pct = Math.max(0, Math.min(100, (inSong / songDur) * 100));
    const rounded = Math.round(pct * 10) / 10;
    if (rounded === lastTrainPct) return;
    lastTrainPct = rounded;
    const train = document.getElementById('ko-train');
    if (train) train.style.left = `calc(14px + (100% - 28px) * ${pct / 100})`;
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
      lastWmKanji = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    updateTrain(inSong, songDur);

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
          updateWatermark(showText);
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
      updateWatermark('');
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
    lastWmKanji = '';
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
