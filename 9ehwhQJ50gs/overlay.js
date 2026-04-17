// ============================================================================
// KARAOKE OVERLAY — SHINKIRO (宝鐘マリン × Gawr Gura)
// ----------------------------------------------------------------------------
// Concept: the lyric card IS the horizon at sunset. Sky gradient (coral-peach
// → dusty rose) fills the upper half; evening ocean (lavender → turquoise)
// fills the lower half; a thin gold horizon line divides them. JP floats in
// the sky above, EN rests at the waterline, and beneath EN a mirage
// reflection — EN flipped, blurred, fading into nothing — renders the song's
// title (蜃気楼 / "mirage") literally. A small sun rides the horizon left→
// right as the song plays, starting pale gold and deepening to sunset red,
// its glow growing across the run. At t≈207.7s (何もかも 蜃気楼 / "all of it,
// a mirage"), the ONE moment the song names itself, the sun briefly refracts
// and the mirage amplifies — the visual pivot lands on the word pivot.
//
// Aesthetic: refined summer-nostalgia. Think late-80s city-pop LP sleeve or
// a Japanese summer-paperback cover. Restraint over ornament. No tilt, no
// stickers. Atmosphere is the design.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — SHINKIRO palette
  // ==========================================================================
  const THEME = {
    trackTag:   'S H I N K I R O',
    subTag:     '蜃気楼',
    artistTag:  'Marine × Gura',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Shippori+Mincho+B1:wght@500;600;700&' +
      'family=Fraunces:ital,opsz,wght@0,144,400;0,144,500;1,144,300;1,144,400;1,144,500&' +
      'family=Zen+Maru+Gothic:wght@500&' +
      'family=Parisienne&' +
      'display=swap',
    fontJP:       '"Shippori Mincho B1", "Noto Serif JP", "Hiragino Mincho ProN", serif',
    fontJPHeavy:  '"Shippori Mincho B1", "Noto Serif JP", serif',
    fontEN:       '"Fraunces", "Crimson Pro", Georgia, serif',
    fontGloss:    '"Zen Maru Gothic", "Noto Sans JP", system-ui, sans-serif',
    fontScript:   '"Parisienne", "Brush Script MT", cursive',

    // Sky → horizon → ocean palette, drawn directly from MV frames
    // (140 sunset run; 230 palm silhouette; 260 bittersweet fade; 290 ocean).
    skyHigh:      'rgba(240, 196, 176, 0.92)',   // warm peach
    skyLow:       'rgba(238, 184, 184, 0.92)',   // dusty coral/rose
    horizonWash:  'rgba(236, 201, 131, 0.55)',   // thin gold band at midline
    oceanHigh:    'rgba(200, 180, 212, 0.90)',   // dusty lavender (sky kiss)
    oceanDeep:    'rgba(123, 165, 189, 0.92)',   // evening turquoise
    warmGlow:     'rgba(255, 228, 200, 0.22)',   // central soft glow

    horizonGold:  '#ecc983',    // horizon line solid stop
    sunPale:      '#fff0ae',    // sun at song start
    sunDeep:      '#f26a4a',    // sun at song end

    cream:        '#fff4e4',    // JP ink
    creamWarm:    '#fff0d8',    // JP halo
    enInk:        '#fae6cc',    // EN ink (slightly cooler cream)
    glossInk:     '#fde2c5',    // gloss ruby (warm but dimmer)

    // Chunk colors — all sit on the warm-top / cool-bottom gradient and
    // stay legible over the horizon gold band. Drawn from the MV:
    //   0 cherry-rose  (Marine's hair, warm-verbs)
    //   1 deep teal    (Gura, ocean, cool-nouns)
    //   2 amber gold   (sunset sun, time/motion)
    //   3 plum         (dusk sky, nuance)
    //   4 warm rust    (sunset fire, desire)
    //   5 deep navy    (evening intimacy)
    chunkColors: [
      '#b63856',
      '#1a6a78',
      '#a4732a',
      '#784076',
      '#b04b2a',
      '#2f5380',
    ],

    // Typography — restrained, learner-legible
    lyricFontSizeJP:     '50px',
    lyricLineHeightJP:   '1.95',
    lyricLetterSpacingJP:'0.06em',
    lyricFontSizeEN:     '26px',
    lyricLineHeightEN:   '1.35',
    lyricLetterSpacingEN:'0.015em',
    glossFontSize:       '17px',
    glossFontWeight:     '500',

    cardRadius:  '6px',
    cardPadding: '34px 52px 34px',

    // Timestamps of the 蜃気楼 refrain — used to trigger the refraction
    // moment. 202.47 is the final "Maybe love" bridge; 207.70 is the one
    // line in the entire song that speaks the title word ("何もかも 蜃気楼").
    mirageStart: 201.5,
    mirageEnd:   216.5,
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

  // Position — centered, just below mid-frame. 0.64 width gives the card room
  // to breathe as a horizontal band; any narrower and the horizon reads as a
  // dash instead of a horizon.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.70, widthFrac: 0.64 },
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
    /* CSS vars on BOTH #karaoke-root AND #ko-lyrics (sibling, not child). */
    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-cream-warm:  ${THEME.creamWarm};
      --ko-en-ink:      ${THEME.enInk};
      --ko-gloss-ink:   ${THEME.glossInk};
      --ko-horizon:     ${THEME.horizonGold};
      --ko-sun-pale:    ${THEME.sunPale};
      --ko-sun-deep:    ${THEME.sunDeep};

      --ko-font-jp:     ${THEME.fontJP};
      --ko-font-jp-hv:  ${THEME.fontJPHeavy};
      --ko-font-en:     ${THEME.fontEN};
      --ko-font-gloss:  ${THEME.fontGloss};
      --ko-font-script: ${THEME.fontScript};

      /* Runtime vars written by tick() ~7x/sec.
         --ko-progress  0->1  song progress (drives sun's horizontal travel)
         --ko-sun-warm  0->1  pale->deep sun color/glow
         --ko-refract   0->1  mirage refraction intensity (peaks near 207s)
         --ko-travel-w  px    sun travel range */
      --ko-progress: 0;
      --ko-sun-warm: 0;
      --ko-refract:  0;
      --ko-travel-w: 0px;
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — SKY->OCEAN HORIZON BAND ================================== */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding: ${THEME.cardPadding};
      /* Layered atmosphere:
         1. Soft central warm glow (radial) — subtle "sun on skin"
         2. Sky-to-ocean vertical gradient with gold horizon wash at mid */
      background:
        radial-gradient(
          ellipse 70% 55% at 50% 42%,
          ${THEME.warmGlow},
          transparent 78%
        ),
        linear-gradient(
          180deg,
          ${THEME.skyHigh} 0%,
          ${THEME.skyLow}  36%,
          ${THEME.horizonWash} 50%,
          ${THEME.oceanHigh} 64%,
          ${THEME.oceanDeep} 100%
        );
      border-radius: ${THEME.cardRadius};
      /* Outer warm halo + inner hairlines. No heavy border chrome. */
      box-shadow:
        0 2px 0 0 rgba(120, 60, 70, 0.18),
        0 36px 100px -28px rgba(210, 120, 110, 0.42),
        0 14px 40px -12px rgba(80, 90, 130, 0.32),
        inset 0 1px 0 0 rgba(255, 245, 220, 0.42),
        inset 0 -1px 0 0 rgba(60, 80, 110, 0.30);
      isolation: isolate;
      overflow: visible;
      transition: opacity 420ms ease, transform 420ms cubic-bezier(.2,.7,.3,1);
    }

    /* Paper-grain texture overlay — reads as vintage film stock at low
       opacity. SVG feTurbulence inlined as data URL. soft-light blend
       keeps it from darkening the card — only adds tonal breakup. */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.7  0 0 0 0 0.6  0 0 0 0 0.55  0 0 0 0.55 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>");
      opacity: 0.14;
      mix-blend-mode: soft-light;
      z-index: 0;
    }

    /* Thin gold glint hairline along the very top edge of the card — catches
       the "sun on the horizon" metaphor at the top of the frame. */
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      top: 0; left: 8%; right: 8%;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(236, 201, 131, 0.55) 50%,
        transparent 100%
      );
      pointer-events: none;
      z-index: 1;
    }

    /* Empty-state collapse during instrumental gaps — gentle settle. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: translateY(4px);
    }

    /* ==== TITLE TAG — top-right, thin vintage title card ================== */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -44px;
      right: 12px;
      padding: 6px 14px 7px;
      text-align: center;
      z-index: 5;
      pointer-events: none;
      font-family: var(--ko-font-jp);
      color: var(--ko-cream);
      text-shadow:
        0 1px 2px rgba(40, 20, 30, 0.65),
        0 0 10px rgba(255, 220, 180, 0.3);
    }
    #ko-lyrics .ko-tag-main {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      display: block;
      line-height: 1;
    }
    #ko-lyrics .ko-tag-rule {
      display: block;
      margin: 4px auto 3px;
      width: 90%;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(236, 201, 131, 0.9) 50%,
        transparent 100%
      );
    }
    #ko-lyrics .ko-tag-sub {
      font-family: var(--ko-font-jp);
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.15em;
      display: block;
      line-height: 1;
      opacity: 0.92;
    }

    /* ==== ARTIST CREDIT — bottom-left, pink script like the MV thumbnail == */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -38px;
      left: 24px;
      font-family: var(--ko-font-script);
      font-size: 26px;
      font-weight: 400;
      color: #ffc4d0;
      letter-spacing: 0.01em;
      z-index: 5;
      pointer-events: none;
      text-shadow:
        0 1px 2px rgba(40, 20, 30, 0.55),
        0 0 12px rgba(255, 180, 200, 0.3);
      transform: rotate(-3deg);
    }

    /* ==== JP LINE — refined mincho, warm cream ============================ */
    #ko-lyrics .ko-line-jp {
      order: 1;
      font-family: var(--ko-font-jp);
      font-weight: 600;
      color: var(--ko-cream);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.35em;
      padding-bottom: 0.25em;
      min-height: 1em;
      position: relative;
      z-index: 3;
      text-align: center;
      text-shadow:
        0 1px 2px rgba(80, 35, 45, 0.55),
        0 2px 4px rgba(60, 30, 60, 0.35),
        0 0 18px rgba(255, 240, 210, 0.45);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — warm cream-dim labels above morphemes. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.01em;
      line-height: 1.05;
      padding-bottom: 5px;
      color: var(--ko-gloss-ink);
      opacity: 0.85;
      text-transform: lowercase;
      user-select: none;
      text-shadow:
        0 1px 1px rgba(80, 40, 60, 0.55),
        0 0 6px rgba(255, 230, 200, 0.3);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* Colored chunks — keep the cream halo so they stay legible on both
       the warm sky half and the cool ocean half of the background. */
    #ko-lyrics .ko-line-jp [data-wc],
    #ko-lyrics .ko-line-en [data-wc] {
      text-shadow:
        0 1px 2px rgba(40, 20, 30, 0.50),
        0 0 10px rgba(255, 245, 220, 0.65),
        0 0 22px rgba(255, 245, 220, 0.35);
    }
    #ko-lyrics .ko-line-jp [data-wc] rt {
      text-shadow:
        0 1px 1px rgba(60, 30, 50, 0.55),
        0 0 7px rgba(255, 245, 220, 0.55);
    }

    /* ==== HORIZON LINE + TRAVELING SUN =================================== */
    #ko-lyrics .ko-horizon {
      order: 2;
      position: relative;
      height: 22px;
      margin: 2px 0 4px;
      z-index: 2;
      overflow: visible;
    }
    #ko-lyrics .ko-horizon-line {
      position: absolute;
      top: 50%;
      left: 0; right: 0;
      height: 1px;
      transform: translateY(-50%);
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(236, 201, 131, 0.25) 6%,
        rgba(236, 201, 131, 0.95) 50%,
        rgba(236, 201, 131, 0.25) 94%,
        transparent 100%
      );
      box-shadow: 0 0 12px rgba(255, 228, 170, 0.35);
    }

    /* The sun — a small luminous disc riding the horizon.
       translateX driven by --ko-progress (rate-limited 7x/sec, 160ms
       transition matches write cadence — smooth without RAF).
       Background + shadow interpolate pale->deep via --ko-sun-warm in
       color-mix(). Radial highlight at 40%/35% for dimensional read. */
    #ko-lyrics .ko-sun {
      position: absolute;
      top: 50%;
      left: 0;
      width: 18px; height: 18px;
      transform:
        translate(-50%, -50%)
        translateX(calc(var(--ko-travel-w) * var(--ko-progress) + 9px));
      will-change: transform;
      border-radius: 50%;
      z-index: 3;
      pointer-events: none;
      background:
        radial-gradient(
          circle at 40% 35%,
          rgba(255, 255, 240, 0.95) 0%,
          rgba(255, 255, 240, 0) 35%
        ),
        radial-gradient(
          circle at 50% 55%,
          color-mix(in oklab, ${THEME.sunPale}, ${THEME.sunDeep} calc(var(--ko-sun-warm) * 60%)) 0%,
          color-mix(in oklab, ${THEME.sunPale}, ${THEME.sunDeep} calc(var(--ko-sun-warm) * 100%)) 100%
        );
      box-shadow:
        0 0 calc(10px + 18px * var(--ko-sun-warm))
          color-mix(in oklab, rgba(255, 240, 170, 0.80), rgba(242, 106, 74, 0.85) calc(var(--ko-sun-warm) * 100%)),
        0 0 calc(28px + 44px * var(--ko-sun-warm))
          color-mix(in oklab, rgba(255, 240, 170, 0.40), rgba(242, 106, 74, 0.55) calc(var(--ko-sun-warm) * 100%)),
        inset -2px -3px 5px rgba(180, 60, 40, 0.25);
      transition: transform 160ms linear, box-shadow 1.2s ease, background 1.2s ease;
    }

    /* Sun reflection on the water — a small elliptical glow directly
       beneath the sun that intensifies with --ko-sun-warm. This is the
       everyday "sunset glint on water" read — separate from the
       mirage-refraction moment which is a timestamped song event. */
    #ko-lyrics .ko-sun::after {
      content: '';
      position: absolute;
      left: 50%;
      top: calc(100% + 2px);
      width: 30px; height: 6px;
      transform: translateX(-50%);
      border-radius: 50%;
      background: radial-gradient(
        ellipse,
        color-mix(in oklab, rgba(255, 240, 170, 0.65), rgba(242, 106, 74, 0.80) calc(var(--ko-sun-warm) * 100%)) 0%,
        transparent 70%
      );
      filter: blur(1.6px);
      opacity: calc(0.28 + 0.45 * var(--ko-sun-warm));
      pointer-events: none;
      transition: opacity 1s ease, background 1s ease;
    }

    /* Mirage refraction at t~207s: a ghost-sun appears below the main sun,
       slightly blurred and offset. --ko-refract drives opacity and scale.
       The refracted sun LEADS the real one slightly (translateY down), so
       the two read as a "main sun + its optical reflection drifting apart"
       — the song admitting what it's admitting. */
    #ko-lyrics .ko-sun-refract {
      position: absolute;
      top: 50%;
      left: 0;
      width: 18px; height: 18px;
      transform:
        translate(-50%, -50%)
        translateX(calc(var(--ko-travel-w) * var(--ko-progress) + 9px))
        translateY(calc(14px + 10px * var(--ko-refract)))
        scale(calc(0.7 + 0.35 * var(--ko-refract)));
      will-change: transform;
      border-radius: 50%;
      z-index: 2;
      pointer-events: none;
      background: radial-gradient(
        circle at 50% 55%,
        color-mix(in oklab, ${THEME.sunPale}, ${THEME.sunDeep} calc(var(--ko-sun-warm) * 100%)) 0%,
        transparent 68%
      );
      filter: blur(2.5px);
      opacity: calc(var(--ko-refract) * 0.85);
      transition: transform 160ms linear, opacity 1.4s ease, background 1.2s ease;
    }

    /* ==== EN LINE — Fraunces italic, waterline cream ====================== */
    #ko-lyrics .ko-line-en {
      order: 3;
      font-family: var(--ko-font-en);
      font-weight: 400;
      font-style: italic;
      color: var(--ko-en-ink);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      padding-top: 2px;
      min-height: 1em;
      position: relative;
      z-index: 3;
      text-align: center;
      text-shadow:
        0 1px 2px rgba(50, 30, 50, 0.55),
        0 0 12px rgba(255, 235, 210, 0.35);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.95);
      font-weight: 500;
      font-style: italic;
    }

    /* ==== MIRAGE REFLECTION — EN text mirrored beneath waterline ==========
       scaleY(-1) on the inner span flips vertically. Mask fades the lower
       edge so the text dissolves into the ocean. Blur + low opacity +
       shimmer animation make it read as an optical reflection, not a
       duplicate. Intensifies during the 蜃気楼 moment via --ko-refract. */
    #ko-lyrics .ko-mirage {
      order: 4;
      margin-top: -2px;
      height: 1.15em;
      font-family: var(--ko-font-en);
      font-weight: 400;
      font-style: italic;
      color: var(--ko-en-ink);
      font-size: calc(${THEME.lyricFontSizeEN} * 0.94);
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      text-align: center;
      overflow: hidden;
      position: relative;
      z-index: 2;
      pointer-events: none;
      opacity: calc(0.22 + 0.26 * var(--ko-refract));
      filter: blur(calc(0.7px + 0.6px * var(--ko-refract)));
      mask-image: linear-gradient(to bottom, black 4%, transparent 88%);
      -webkit-mask-image: linear-gradient(to bottom, black 4%, transparent 88%);
      animation: ko-mirage-drift 5.5s ease-in-out infinite alternate;
      transition: opacity 1.4s ease, filter 1.4s ease;
    }
    #ko-lyrics .ko-mirage span { color: inherit; }
    #ko-lyrics .ko-mirage-inner {
      display: inline-block;
      transform: scaleY(-1);
      transform-origin: top center;
    }
    /* Gentle horizontal shimmer — like heat off water. We animate
       letter-spacing rather than a transform so the scaleY(-1) on the
       inner isn't disturbed. */
    @keyframes ko-mirage-drift {
      0%   { letter-spacing: calc(${THEME.lyricLetterSpacingEN} - 0.005em); }
      50%  { letter-spacing: calc(${THEME.lyricLetterSpacingEN} + 0.015em); }
      100% { letter-spacing: calc(${THEME.lyricLetterSpacingEN} + 0.005em); }
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
  // DOM order: tag/credit (absolute), then JP (order:1) -> horizon (order:2)
  // -> EN (order:3) -> mirage (order:4). JP is before EN in the DOM (a11y
  // reading order); horizon and mirage decorate between/after.
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-tag">
        <span class="ko-tag-main">${escHTML(THEME.trackTag)}</span>
        <span class="ko-tag-rule"></span>
        <span class="ko-tag-sub">${escHTML(THEME.subTag)}</span>
      </div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-horizon" id="ko-horizon">
        <div class="ko-horizon-line"></div>
        <div class="ko-sun-refract" id="ko-sun-refract"></div>
        <div class="ko-sun" id="ko-sun"></div>
      </div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="ko-mirage" id="ko-mirage">
        <span class="ko-mirage-inner" id="ko-mirage-inner"></span>
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
  let lastRefract = -1;
  let lastMirrorHTML = '';

  // --- Position tick: re-anchor to video rect + write --ko-travel-w ---
  // Sun's translateX uses (--ko-travel-w * --ko-progress) to hit the far
  // edge at progress=1. Travel range = card content-box width minus the
  // sun diameter so the sun stays fully inside the card at both ends.
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
      // Resize snap: the sun consumes --ko-travel-w inside a transform with
      // `transition: transform 160ms`. On resize we'd animate across the
      // width change — suppress transition during the var write.
      const sun  = document.getElementById('ko-sun');
      const sunR = document.getElementById('ko-sun-refract');
      if (sun)  sun.style.transition  = 'none';
      if (sunR) sunR.style.transition = 'none';
      // Travel = content-box width (card - 2*padding) - sun diameter.
      // cardPadding is 52px each side; sun is 18px. Horizon .ko-horizon
      // fills content-box width, so the sun can span that minus its own.
      const padX = 52 * 2;
      const travel = Math.max(60, cardW - padX - 18);
      lyrics.style.setProperty('--ko-travel-w', travel + 'px');
      if (sun)  { void sun.offsetWidth;  sun.style.transition  = ''; }
      if (sunR) { void sunR.offsetWidth; sunR.style.transition = ''; }
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: lyric lookup + sun progress + refraction ---
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

    // ---- Song change ----
    if (idx !== curSongIdx) {
      curSongIdx = idx;
      curLineIdx = -1;

      const enEl  = document.getElementById('ko-line-en');
      const jpEl  = document.getElementById('ko-line-jp');
      const mirEl = document.getElementById('ko-mirage-inner');
      if (enEl)  enEl.textContent  = '';
      if (jpEl)  jpEl.textContent  = '';
      if (mirEl) mirEl.textContent = '';
      lastEnText = ''; lastJpText = ''; lastMirrorHTML = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    // ---- Sun progress + warmth + mirage refraction (rate-limited ~7/sec) ---
    // Pale for the first ~10% of the song (still bright mid-day), fully
    // sunset-warm by ~85%. The refraction peaks during the 蜃気楼 window
    // (mirageStart..mirageEnd) with a 4s ramp on each side, otherwise
    // holds 0 — the ghost-sun only materializes at the lyrical pivot.
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        const warm = Math.max(0, Math.min(1, (progFrac - 0.10) / 0.75));

        const mStart = THEME.mirageStart;
        const mEnd   = THEME.mirageEnd;
        let refract = 0;
        if (inSong >= mStart - 4 && inSong <= mEnd + 4) {
          if (inSong < mStart) {
            refract = (inSong - (mStart - 4)) / 4;
          } else if (inSong > mEnd) {
            refract = 1 - (inSong - mEnd) / 4;
          } else {
            refract = 1;
          }
          refract = Math.max(0, Math.min(1, refract));
        }

        lyrics.style.setProperty('--ko-progress', progFrac.toFixed(4));
        lyrics.style.setProperty('--ko-sun-warm', warm.toFixed(4));
        // Only write refract when it changes meaningfully — avoids
        // cascading style updates on every tick during the 99% of the
        // song that's outside the refraction window.
        const refractQ = Math.round(refract * 1000) / 1000;
        if (refractQ !== lastRefract) {
          lastRefract = refractQ;
          lyrics.style.setProperty('--ko-refract', refractQ.toFixed(3));
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

  // --- Dual loop: RAF for smoothness, setInterval for background-tab cov. ---
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
    lastMirrorHTML = '';
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
  // Runs at ~150ms: paints JP chunks with ruby gloss, paints EN chunks.
  // Same pattern as the skeleton. The SHINKIRO custom work is in
  // MIRROR_POLL below, which re-renders the mirage from EN's HTML.
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

  // --- Mirage mirror: copy EN's innerHTML into the mirage inner span so
  // the reflection carries the same color-chunk tints as the EN line. The
  // scaleY(-1) on .ko-mirage-inner flips the copied content visually
  // without affecting its text layout; opacity/blur/mask are on the
  // parent .ko-mirage. Guard on HTML equality. Staggered at 180ms from
  // COLOR_POLL's 150ms so the colorizer writes first. ---
  const MIRROR_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(MIRROR_POLL); return; }
    const enEl  = document.getElementById('ko-line-en');
    const mirEl = document.getElementById('ko-mirage-inner');
    if (!enEl || !mirEl) return;
    const html = enEl.innerHTML;
    if (html !== lastMirrorHTML) {
      lastMirrorHTML = html;
      setHTML(mirEl, html);
    }
  }, 180);

})();
