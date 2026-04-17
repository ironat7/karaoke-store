// ============================================================================
// KARAOKE OVERLAY — メズマライザー (Mesmerizer) / サツキ feat. 初音ミク · 重音テトSV
// ----------------------------------------------------------------------------
// Concept: a Showa-era kissaten / early-fast-food "Today's Special" signboard.
// The MV is a flat-cel triptych pastiche of retail-service uniforms (Miku as
// a waitress, Teto as a red-and-white soda-jerk / bellhop) pitching the song
// AT you like a product, with relentless confetti celebrating every line.
// The card is their signboard — cream paper, dark-teal display frame matching
// the MV's own burned-in subtitle plaques, red vertical bars at the far edges
// echoing the MV's red columns, corner tape strips echoing Miku's pinstripes,
// and a yellow starburst badge top-right mirroring the MV's yellow sun stamps.
//
// Signature: the pendulum coin. A gold coin hangs from a thin chain above
// the card and swings perpetually side-to-side like a hypnotist's watch.
// The chain's ANCHOR POINT drifts slowly across the top edge of the card
// from left→right over the full song duration — encoding time as position
// while literalizing 「目の前で揺らぐ硬貨」 ("a coin swaying right in front
// of you") directly from the lyrics at 84.35/94.66.
//
// Secondary: during the hypnosis chorus (79-97s, 89-97s), a concentric-ring
// spiral fades in behind the card — subtle opacity flip synced to the line
// that literally goes "あなた段々眠くなる". The MV flashes a black-and-white
// hypno-spiral at frame-110; this is that spiral, tamed to not overwhelm text.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Mesmerizer palette
  // ==========================================================================
  const THEME = {
    trackTag:   'メズマライザー',
    artistTag:  'サツキ × 初音ミク × 重音テト',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=RocknRoll+One&' +
      'family=Reggae+One&' +
      'family=Fredoka:wght@500;600;700&' +
      'family=Kosugi+Maru&' +
      'display=swap',
    fontJP:       '"RocknRoll One", "Reggae One", sans-serif',
    fontJPHeavy:  '"Reggae One", "RocknRoll One", sans-serif',
    fontEN:       '"Fredoka", system-ui, sans-serif',
    fontGloss:    '"Kosugi Maru", "Noto Sans JP", system-ui, sans-serif',

    // Palette — every hex pulled from an MV frame.
    //   cardCream:   base paper (matches the quiz-time grid-paper scene)
    //   teal/tealD:  the MV's burned-in subtitle plaque color, used for the
    //                outer frame, title tag, and the JP lyric ink
    //   vermilion:   the MV's dominant red vertical panel
    //   gold:        the MV's yellow sun/starburst + coin color
    //   tetoPink:    Teto's hair red/magenta
    //   cyanMiku:    Miku's hair cyan
    //   grass:       the green ground stripe in the triptych scene
    //   violet:      the purple hat from the "QUIZ TIME!" frame — used for
    //                the hypnosis-coded color slot
    cardCream:    '#FBF3DA',
    gridInk:      'rgba(18, 60, 72, 0.08)',  // faint teal grid paper
    teal:         '#164C5A',
    tealDeep:     '#0A2E39',
    tealInk:      '#2C6E7D',
    vermilion:    '#D92B3D',
    vermDeep:     '#A6121F',
    gold:         '#F5C418',
    goldDeep:     '#B88404',
    tetoPink:     '#D81B5E',
    cyanMiku:     '#3DBCE0',
    grass:        '#36852B',
    violet:       '#6A2A95',

    // Typography
    lyricFontSizeJP:     '52px',
    lyricLineHeightJP:   '2.0',
    lyricLetterSpacingJP:'0.03em',
    lyricFontSizeEN:     '28px',
    lyricLineHeightEN:   '1.3',
    lyricLetterSpacingEN:'0.01em',
    glossFontSize:       '17px',
    glossFontWeight:     '500',

    // Card shape
    cardRadius:  '10px',
    cardPadding: '46px 62px 30px',
    cardTilt:    '-0.4deg',  // Just a hair — the MV plaques are near-axis-aligned.

    // chunkColors: 6 slots, all dark+saturated enough to sit legibly on the
    // cream paper. Drawn from the MV's own palette.
    chunkColors: [
      '#144A5A',  // 0 — deep teal (narrator / Miku side / primary)
      '#C81F33',  // 1 — vermilion (the pitch, the sell, action verbs)
      '#A42054',  // 2 — teto magenta (darker emotion / the "other half")
      '#B88404',  // 3 — mustard gold (decoration / particles / the coin)
      '#36852B',  // 4 — grass green (the concrete object / nature)
      '#6A2A95',  // 5 — violet (hypnosis / dissociation)
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

  // Card anchors at 72% vertical — leaves clear room above for the swinging
  // pendulum coin without cropping on short video boxes.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.73, widthFrac: 0.58 },
    window.__koPosition || {}
  );

  // --- Generation counter + runtime knobs ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  // Hypnosis windows — seconds inside the song where the spiral fades in.
  // These match the 「あなた段々眠くなる」 chorus sections.
  const HYPNO_WINDOWS = [
    [78.0, 97.8],
    [88.5, 97.8],
  ];

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
    /* CSS vars on both #karaoke-root AND #ko-lyrics (sibling, not descendant). */
    #karaoke-root, #ko-lyrics {
      --ko-cream:      ${THEME.cardCream};
      --ko-grid-ink:   ${THEME.gridInk};
      --ko-teal:       ${THEME.teal};
      --ko-teal-deep:  ${THEME.tealDeep};
      --ko-teal-ink:   ${THEME.tealInk};
      --ko-verm:       ${THEME.vermilion};
      --ko-verm-deep:  ${THEME.vermDeep};
      --ko-gold:       ${THEME.gold};
      --ko-gold-deep:  ${THEME.goldDeep};
      --ko-teto:       ${THEME.tetoPink};
      --ko-cyan:       ${THEME.cyanMiku};
      --ko-grass:      ${THEME.grass};
      --ko-violet:     ${THEME.violet};

      --ko-font-jp:    ${THEME.fontJP};
      --ko-font-jp-hv: ${THEME.fontJPHeavy};
      --ko-font-en:    ${THEME.fontEN};
      --ko-font-gloss: ${THEME.fontGloss};

      /* Runtime vars (written ~7×/sec by the tick) */
      --ko-progress: 0;       /* 0..1 song progress */
      --ko-card-w:   500px;   /* card pixel width   */
      --ko-hypno:    0;       /* 0..1 hypnosis-chorus opacity driver */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== HYPNOSIS SPIRAL — behind the card ==============================
       A conic-ish swirl built from a radial gradient + rotating conic mask,
       sitting behind the card at opacity = --ko-hypno * 0.24. Fades in only
       during the hypnosis chorus (driven by tick()). The tight ring pattern
       is pulled straight from frame-110 (black/white hypno-spiral). Muted
       enough that the lyrics never lose contrast. */
    #ko-lyrics .ko-hypno {
      position: absolute;
      top: 50%; left: 50%;
      width: 160%; height: 260%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 0;
      opacity: calc(var(--ko-hypno) * 0.26);
      transition: opacity 900ms ease;
      background:
        repeating-radial-gradient(
          circle at center,
          rgba(10, 30, 40, 0.35) 0px, rgba(10, 30, 40, 0.35) 6px,
          transparent 6px, transparent 16px
        ),
        radial-gradient(
          circle at center,
          rgba(217, 43, 61, 0.28) 0%,
          transparent 55%
        );
      mix-blend-mode: multiply;
      -webkit-mask-image: radial-gradient(circle at center, black 0%, black 45%, transparent 75%);
              mask-image: radial-gradient(circle at center, black 0%, black 45%, transparent 75%);
      animation: ko-spin-slow 18s linear infinite;
    }
    @keyframes ko-spin-slow {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to   { transform: translate(-50%, -50%) rotate(360deg); }
    }

    /* ==== CARD — kissaten signboard =====================================
       Cream paper body with faint grid-paper lines at very low opacity
       (the quiz-time backdrop), dark-teal outer frame (the MV's subtitle
       plaque), subtle red pinstripes running down the far inside edges
       echoing the triptych's red columns. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: ${THEME.cardPadding};
      background:
        /* faint teal grid paper — matches frame-70's quiz scene */
        linear-gradient(var(--ko-grid-ink) 1px, transparent 1px) 0 0 / 30px 30px,
        linear-gradient(90deg, var(--ko-grid-ink) 1px, transparent 1px) 0 0 / 30px 30px,
        /* red pinstripe columns at far edges — 5% in on each side */
        linear-gradient(
          to right,
          transparent 0, transparent 3%,
          rgba(217, 43, 61, 0.10) 3%, rgba(217, 43, 61, 0.10) 5%,
          transparent 5%, transparent 95%,
          rgba(217, 43, 61, 0.10) 95%, rgba(217, 43, 61, 0.10) 97%,
          transparent 97%
        ),
        var(--ko-cream);
      border: 4px solid var(--ko-teal);
      border-radius: ${THEME.cardRadius};
      box-shadow:
        0 0 0 2px var(--ko-cream),
        0 0 0 4px var(--ko-verm),
        0 20px 44px -14px rgba(18, 32, 44, 0.60),
        inset 0 0 0 1px rgba(255, 255, 255, 0.35);
      transform: rotate(${THEME.cardTilt});
      transition: transform 320ms cubic-bezier(.2,.7,.3,1), opacity 380ms;
      isolation: isolate;
      overflow: visible;
    }

    /* Empty-state collapse during instrumental gaps. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardTilt}) scale(0.94);
    }

    /* ==== PENDULUM COIN — the signature ================================
       A gold coin on a thin chain swings perpetually above the card.
       Structure:
         .ko-pendulum-anchor  → drifts left→right via translateX, tracks
                                --ko-progress. Fixed at top-center of card.
         .ko-pendulum-arm     → rotates -22°↔+22° via a CSS animation,
                                transform-origin at its own top edge.
                                Contains the chain + coin.
         .ko-pendulum-chain   → a 1.5px vertical line; visually the string.
         .ko-pendulum-coin    → circular gold disc with inner rim + 目/M
                                embossed face (single char "M" for メズマ).
       The anchor's horizontal position = song progress. The arm swings
       regardless, so the coin traces a drifting figure-of-arc across
       the top of the card through the full song. */
    #ko-lyrics .ko-pendulum-anchor {
      position: absolute;
      top: -6px;
      left: 50px;
      transform: translateX(
        calc((var(--ko-card-w, 500px) - 100px) * var(--ko-progress))
      );
      transition: transform 160ms linear;
      will-change: transform;
      z-index: 5;
      pointer-events: none;
    }
    #ko-lyrics .ko-pendulum-arm {
      position: absolute;
      top: 0; left: 0;
      width: 2px; height: 56px;
      transform-origin: 50% 0%;
      animation: ko-swing 2.35s ease-in-out infinite alternate;
    }
    @keyframes ko-swing {
      from { transform: rotate(-22deg); }
      to   { transform: rotate(22deg); }
    }
    #ko-lyrics .ko-pendulum-chain {
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 1.5px; height: 44px;
      background: linear-gradient(
        to bottom,
        var(--ko-teal-deep) 0%,
        var(--ko-teal) 100%
      );
      border-radius: 1px;
    }
    /* Tiny hanging hook at the anchor top */
    #ko-lyrics .ko-pendulum-anchor::before {
      content: '';
      position: absolute;
      top: -3px; left: 50%;
      transform: translateX(-50%);
      width: 7px; height: 7px;
      border: 2px solid var(--ko-teal-deep);
      border-radius: 50%;
      background: var(--ko-cream);
      z-index: 6;
    }
    #ko-lyrics .ko-pendulum-coin {
      position: absolute;
      top: 44px; left: 50%;
      transform: translateX(-50%);
      width: 22px; height: 22px;
      border-radius: 50%;
      background:
        radial-gradient(
          circle at 34% 28%,
          rgba(255, 255, 255, 0.75) 0%,
          rgba(255, 255, 255, 0) 38%
        ),
        radial-gradient(
          circle at 50% 50%,
          var(--ko-gold) 0%,
          var(--ko-gold-deep) 100%
        );
      box-shadow:
        0 0 0 1.5px var(--ko-gold-deep),
        0 0 0 2.5px rgba(255, 248, 220, 0.9),
        0 3px 7px -2px rgba(40, 10, 0, 0.45),
        inset -2px -3px 4px rgba(120, 65, 0, 0.35);
    }
    /* Coin face — a tiny dark glyph to read as an embossed character.
       Using ￥ for 「最高級の逃避行」 — the "finest grade of escape product". */
    #ko-lyrics .ko-pendulum-coin::after {
      content: '￥';
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ko-teal-deep);
      font-family: var(--ko-font-jp-hv);
      font-size: 11px;
      font-weight: 900;
      line-height: 1;
      text-shadow: 0 1px 0 rgba(255, 240, 200, 0.45);
    }

    /* ==== YELLOW STARBURST BADGE — top-right corner ====================
       A 14-pointed gold star sticker mimicking the MV's yellow sun burst
       (frame-8 center panel). Holds the "今日のおすすめ" product-pitch
       text — the narrator is "recommending" the song to you. */
    #ko-lyrics .ko-starburst {
      position: absolute;
      top: -32px;
      right: -30px;
      width: 86px;
      height: 86px;
      z-index: 5;
      pointer-events: none;
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.32));
      animation: ko-badge-pulse 1.8s ease-in-out infinite;
    }
    @keyframes ko-badge-pulse {
      0%,100% { transform: rotate(12deg) scale(1); }
      50%     { transform: rotate(12deg) scale(1.05); }
    }
    #ko-lyrics .ko-starburst svg { width: 100%; height: 100%; display: block; }
    #ko-lyrics .ko-starburst .ko-star-body {
      fill: var(--ko-gold);
      stroke: var(--ko-teal-deep);
      stroke-width: 2;
      stroke-linejoin: miter;
    }
    #ko-lyrics .ko-starburst .ko-star-inner {
      fill: var(--ko-verm);
    }
    #ko-lyrics .ko-starburst .ko-star-text {
      font-family: var(--ko-font-jp-hv);
      font-size: 10px;
      font-weight: 400;
      fill: var(--ko-cream);
      letter-spacing: 0;
    }
    #ko-lyrics .ko-starburst .ko-star-text2 {
      font-family: var(--ko-font-jp-hv);
      font-size: 9px;
      font-weight: 400;
      fill: var(--ko-cream);
    }

    /* ==== TITLE TAG — teal subtitle plaque, top-left ===================
       Matches the MV's burned-in subtitle plaque style: dark teal bar
       with thick cream border, diagonal tilt. Holds the track title. */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -18px;
      left: 28px;
      padding: 5px 16px 6px;
      background: var(--ko-teal);
      color: var(--ko-cream);
      font-family: var(--ko-font-jp-hv);
      font-size: 16px;
      font-weight: 400;
      letter-spacing: 0.14em;
      border-radius: 3px;
      border: 2.5px solid var(--ko-cream);
      outline: 1.5px solid var(--ko-teal-deep);
      transform: rotate(-4deg);
      box-shadow:
        0 3px 0 0 var(--ko-teal-deep),
        0 6px 12px -4px rgba(0, 0, 0, 0.38);
      z-index: 6;
      white-space: nowrap;
    }

    /* ==== ARTIST CREDIT — bottom-right on a small pill =================*/
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -14px;
      right: 34px;
      padding: 3px 10px 4px;
      background: var(--ko-verm);
      color: var(--ko-cream);
      font-family: var(--ko-font-en);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      border-radius: 4px;
      border: 1.5px solid var(--ko-cream);
      outline: 1px solid var(--ko-verm-deep);
      transform: rotate(2.5deg);
      box-shadow: 0 2px 0 0 var(--ko-verm-deep);
      z-index: 4;
    }

    /* ==== CORNER TAPE STRIPS — red-and-white pinstripes ================
       Two diagonal tape strips at opposite corners echoing the MV's
       vertical pinstripe uniform patterns. White base with thin red
       vertical stripes. */
    #ko-lyrics .ko-tape {
      position: absolute;
      width: 64px; height: 18px;
      background:
        repeating-linear-gradient(
          to right,
          #F9F4E6 0, #F9F4E6 5px,
          var(--ko-verm) 5px, var(--ko-verm) 7px
        );
      border: 1px solid rgba(18, 32, 44, 0.35);
      opacity: 0.94;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22);
      z-index: 4;
    }
    #ko-lyrics .ko-tape.bl {
      bottom: -8px;
      left: -18px;
      transform: rotate(-20deg);
    }
    #ko-lyrics .ko-tape.tr {
      display: none; /* starburst occupies top-right — keep the silhouette clean */
    }

    /* ==== LYRICS ========================================================*/
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: var(--ko-teal-deep);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.4em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      text-shadow:
        0 1px 0 rgba(251, 243, 218, 0.9),
        0 0 12px rgba(251, 243, 218, 0.55);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — slightly smaller Kosugi Maru under each morpheme, in a
       muted teal-ink that reads on cream without competing with the JP. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding-bottom: 3px;
      color: var(--ko-teal-ink);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.92;
      text-shadow: 0 1px 0 rgba(251, 243, 218, 0.7);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Fredoka in teal, with a thin gold underline accent. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 600;
      color: var(--ko-teal);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      text-shadow:
        0 1px 0 rgba(251, 243, 218, 0.8),
        0 0 8px rgba(251, 243, 218, 0.4);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.9);
      font-weight: 500;
    }
    /* Thin vermilion hairline under the EN line, matching the MV's red stripe. */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 5px;
      margin-top: 3px;
      background:
        linear-gradient(90deg,
          transparent 15%,
          rgba(217, 43, 61, 0.45) 50%,
          transparent 85%)
        bottom / 100% 1.5px no-repeat;
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

  // 14-pointed starburst SVG. Polygon with alternating outer/inner radii to
  // produce the classic "sun/pop" burst from the MV's frame-8 center panel.
  // Inner vermilion circle holds the "今日のおすすめ" pitch copy, evoking
  // a product-sale sticker on a retail display.
  const starburstSvg = (() => {
    const cx = 50, cy = 50;
    const outer = 48, inner = 32;
    const points = 14;
    let pts = '';
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      pts += `${x.toFixed(2)},${y.toFixed(2)} `;
    }
    return `
      <svg viewBox="0 0 100 100">
        <polygon class="ko-star-body" points="${pts}"/>
        <circle class="ko-star-inner" cx="50" cy="50" r="22"/>
        <text class="ko-star-text" x="50" y="46" text-anchor="middle">今日の</text>
        <text class="ko-star-text2" x="50" y="60" text-anchor="middle">おすすめ！</text>
      </svg>`;
  })();

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-hypno" id="ko-hypno"></div>
      <div class="ko-tape bl"></div>
      <div class="ko-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
      <div class="ko-starburst">${starburstSvg}</div>
      <div class="ko-pendulum-anchor" id="ko-pendulum-anchor">
        <div class="ko-pendulum-arm">
          <div class="ko-pendulum-chain"></div>
          <div class="ko-pendulum-coin"></div>
        </div>
      </div>
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
  let lastProgWriteAt = 0;
  let lastHypnoVal = -1;

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
      const cardW = r.width * p.widthFrac;
      lyrics.style.left     = (r.left + r.width * p.anchorX) + 'px';
      lyrics.style.top      = (r.top  + r.height * p.anchorY) + 'px';
      lyrics.style.width    = cardW + 'px';
      lyrics.style.maxWidth = cardW + 'px';
      // Resize snap: kill the pendulum's translateX transition before writing
      // the new --ko-card-w so a resize snaps instead of sliding.
      const anchor = document.getElementById('ko-pendulum-anchor');
      if (anchor) anchor.style.transition = 'none';
      lyrics.style.setProperty('--ko-card-w', cardW + 'px');
      if (anchor) {
        void anchor.offsetWidth;
        anchor.style.transition = '';
      }
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + pendulum anchor + hypno spiral ---
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

    // ---- Pendulum progress + hypnosis spiral (rate-limited ~7/sec) ----
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        lyrics.style.setProperty('--ko-progress', progFrac.toFixed(4));

        // Hypnosis spiral — ramp to 1 if inside any hypno window.
        let hypno = 0;
        for (const [a, b] of HYPNO_WINDOWS) {
          if (inSong >= a && inSong <= b) {
            // Gentle fade-in over 1.2s at the window start, fade-out over
            // last 1.0s so it breathes instead of flipping.
            const fadeIn  = Math.min(1, (inSong - a) / 1.2);
            const fadeOut = Math.min(1, (b - inSong) / 1.0);
            hypno = Math.max(hypno, Math.min(fadeIn, fadeOut));
          }
        }
        if (Math.abs(hypno - lastHypnoVal) > 0.02) {
          lastHypnoVal = hypno;
          lyrics.style.setProperty('--ko-hypno', hypno.toFixed(3));
        }
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
