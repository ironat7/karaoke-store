// ============================================================================
// KARAOKE OVERLAY — FUWAMOCO × "Let Me Be With You" (Chobits OP cover)
// ----------------------------------------------------------------------------
// Aesthetic: digital merch product-listing card, lifted from the MV's own
// burned-in shop-UI graphic at ~0:08 — hot-pink capsule labels ("MOCOCO",
// "LET ME BE WITH YOU") with a row of three icon-buttons (bag / heart / tag)
// sitting alongside an illustrated portrait. The overlay reads like a
// product card on an online store that happens to be selling the song.
// Pink (Mococo) + blue (Fuwawa) is the single defining visual of the duo,
// so the card is built as a dual-palette split: cream base washes to soft
// pink on the left and soft blue on the right, edges trimmed in hot-pink
// and hot-blue piping.
//
// Signature: TWIN HEARTS sliding along a track at the card's bottom edge.
// A pink Mococo-heart starts at the left tip of the track; a blue Fuwawa-
// heart starts at the right tip. As the song plays, --ko-progress drives
// both hearts toward center. At 100% they meet — literally "let me be with
// you." Each heart beats independently (1.1s cycle, slight phase offset)
// and their drop-shadow and fill deepen as they close in, via color-mix().
// The track beneath them is a dashed gradient that solidifies over the
// region the hearts have already crossed, so the progress bar reads from
// the outside in, not left-to-right like every other progress bar.
//
// Corner decorations: top-right carries the shop-UI icon row (bag, heart,
// tag) straight from the MV frame, as micro 18px pill buttons. A small
// daisy sticker sits top-left (hand-placed, tilted -7deg). Bottom-left
// carries the "CHOBITS OP · 2002" credit like a vinyl side-label; bottom-
// right leaves room for the hearts to meet.
//
// Line changes are motionless (text swaps in place). The card is alive
// through the twin hearts' inward travel, the ripen on the hearts, and
// the empty-state collapse between lines — nothing else.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    trackTag:   'LET ME BE WITH YOU',
    brandTag:   'FUWAMOCO',
    creditTag:  'CHOBITS OP · 2002',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Bagel+Fat+One&' +
      'family=Quicksand:wght@500;600;700&' +
      'family=Manrope:wght@600;700;800&' +
      'family=Zen+Maru+Gothic:wght@500;700&' +
      'family=Zen+Kaku+Gothic+New:wght@500;700&' +
      'display=swap',
    fontJP:       '"Zen Maru Gothic", sans-serif',
    fontEN:       '"Quicksand", system-ui, sans-serif',
    fontHook:     '"Bagel Fat One", "Quicksand", sans-serif',
    fontUi:       '"Manrope", system-ui, sans-serif',
    fontGloss:    '"Zen Kaku Gothic New", sans-serif',

    // MV palette — drawn directly from the frames I studied.
    // Two main hues: Mococo pink, Fuwawa blue. Neutrals: cream, paper, ink.
    // Pink/blue pairs come at light → mid → bold → deep so every motif can
    // pick the intensity it needs without defaulting to a single tone.
    pinkLight:  '#FFF0F4',
    pinkMid:    '#FFA9C5',
    pinkBold:   '#FF6FA3',
    pinkDeep:   '#D94B85',

    blueLight:  '#EEF7FC',
    blueMid:    '#A9D9F1',
    blueBold:   '#5EB6E8',
    blueDeep:   '#2D8EC5',

    cream:      '#FFFBF5',
    paper:      '#FFF7EE',  // slightly more saturated cream, the card body
    rose:       '#3D2234',  // text ink — deep dusty plum, not black
    gold:       '#E6AC4B',  // daisy centers + ribbon yellow
    mint:       '#7DC9A6',  // wildflower stems in meadow

    // Typography
    lyricFontSizeJP:     '54px',
    lyricLineHeightJP:   '2.05',
    lyricLetterSpacingJP:'0.02em',
    lyricFontSizeEN:     '26px',
    lyricLineHeightEN:   '1.28',
    lyricLetterSpacingEN:'0.008em',
    glossFontSize:       '18px',
    glossFontWeight:     '600',

    // Card shape
    cardRadius:  '20px',
    cardPadding: '34px 48px 40px',

    // 6 chunk colors, each pulled from a specific MV element — saturated
    // enough to read on the cream card body without defaulting to the
    // generic AI rainbow.
    //  0 — Mococo pink (eyes, highlights)
    //  1 — Fuwawa blue (eyes, highlights)
    //  2 — meadow coral (small pink wildflowers)
    //  3 — leaf green (meadow grass, flower stems)
    //  4 — daisy gold (daisy centers, rainbow-ribbon yellow)
    //  5 — rainbow-ribbon plum (the purple band in the MV's ribbon streaks)
    chunkColors: [
      '#C93973',  // 0 — Mococo pink (deepened for legibility on pale card)
      '#1A6FA8',  // 1 — Fuwawa blue (deepened)
      '#C75A38',  // 2 — coral / peach wildflower (deepened)
      '#2E7E56',  // 3 — leaf green (deepened)
      '#A27218',  // 4 — daisy gold (deepened)
      '#6A4A84',  // 5 — ribbon plum (deepened)
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

  // Position — a touch above dead-center so the twin-heart progress bar
  // hanging off the card's bottom edge doesn't collide with YouTube's
  // own player chrome.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.70, widthFrac: 0.62 },
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
      --ko-pink-lt:   ${THEME.pinkLight};
      --ko-pink-md:   ${THEME.pinkMid};
      --ko-pink-bd:   ${THEME.pinkBold};
      --ko-pink-dp:   ${THEME.pinkDeep};
      --ko-blue-lt:   ${THEME.blueLight};
      --ko-blue-md:   ${THEME.blueMid};
      --ko-blue-bd:   ${THEME.blueBold};
      --ko-blue-dp:   ${THEME.blueDeep};
      --ko-cream:     ${THEME.cream};
      --ko-paper:     ${THEME.paper};
      --ko-rose:      ${THEME.rose};
      --ko-gold:      ${THEME.gold};
      --ko-mint:      ${THEME.mint};

      --ko-font-jp:    ${THEME.fontJP};
      --ko-font-en:    ${THEME.fontEN};
      --ko-font-hook:  ${THEME.fontHook};
      --ko-font-ui:    ${THEME.fontUi};
      --ko-font-gloss: ${THEME.fontGloss};

      /* Runtime vars written by the main tick ~7×/sec. */
      --ko-progress:  0;     /* 0.0 (hearts apart) → 1.0 (hearts meet)   */
      --ko-ripe:      0;     /* 0.0 → 1.0 — heart fills deepen           */
      --ko-track-w:   0px;   /* pixel width of progress track            */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — product-listing merch card ==============================
       Soft dual-palette wash: cream→pink on the left, cream→blue on the
       right. A hot-pink/blue piping sits inside a thin cream inner border.
       Subtle daisy texture layer at <4% opacity for meadow feel. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
      padding: ${THEME.cardPadding};
      background:
        /* pale pink hint left → wide cream center → pale blue hint right.
           Cream band holds 30–70% so the text area stays on a calm neutral
           backdrop, with pink/blue only as soft edge accents. */
        linear-gradient(
          115deg,
          ${THEME.pinkLight} 0%,
          ${THEME.paper} 28%,
          ${THEME.cream} 50%,
          ${THEME.paper} 72%,
          ${THEME.blueLight} 100%
        );
      border-radius: ${THEME.cardRadius};
      /* Double border: outer hot piping (pink→blue split), inner cream. */
      box-shadow:
        0 0 0 2.5px var(--ko-cream),
        0 0 0 4.5px transparent,
        0 22px 52px -16px rgba(217, 75, 133, 0.38),
        0 12px 30px -10px rgba(45, 142, 197, 0.28),
        inset 0 0 0 1px rgba(255, 255, 255, 0.65);
      isolation: isolate;
      overflow: visible;
    }
    /* The hot-pink→hot-blue piping is drawn with a ::before that the slot's
       box-shadow pseudo-frames. border alone can't do a gradient; this gets
       the split piping without dropping to SVG. */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      inset: -4.5px;
      border-radius: calc(${THEME.cardRadius} + 4.5px);
      background: linear-gradient(
        110deg,
        ${THEME.pinkBold} 0%,
        ${THEME.pinkBold} 42%,
        ${THEME.blueBold} 58%,
        ${THEME.blueBold} 100%
      );
      z-index: -1;
      filter: drop-shadow(0 4px 10px rgba(217, 75, 133, 0.25));
    }
    /* A second ::after lays the scanlines/perforation texture across
       the lower edge — reads as a ticket-stub hint, referencing the
       MV's film-strip sticker frames. */
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      left: 12%;
      right: 12%;
      bottom: 14px;
      height: 1px;
      background: repeating-linear-gradient(
        to right,
        ${THEME.pinkMid} 0 6px,
        transparent 6px 12px
      );
      opacity: 0.55;
      z-index: 1;
      pointer-events: none;
    }

    /* Empty-state collapse during instrumental gaps — gentle settle. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: scale(0.96);
      transition: opacity 380ms, transform 380ms cubic-bezier(.2,.7,.3,1);
    }
    #ko-lyrics .ko-slot {
      transition: opacity 380ms, transform 380ms cubic-bezier(.2,.7,.3,1);
    }

    /* ==== TOP-RIGHT — shop-UI icon row (bag / heart / tag) ==============
       Three micro-pill buttons in a horizontal cluster, straight from the
       MV's ~0:08 shop-card graphic. 18px pills with thin hot-pink border
       and a single-color icon centered. The middle pill holds a filled
       heart that pulses softly, nodding to the actual product category. */
    #ko-lyrics .ko-icon-row {
      position: absolute;
      top: -14px;
      right: 28px;
      display: flex;
      gap: 6px;
      z-index: 5;
    }
    #ko-lyrics .ko-icon-btn {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      background: var(--ko-cream);
      border: 1.5px solid var(--ko-pink-bd);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 0 0 var(--ko-pink-dp), 0 4px 8px -2px rgba(217, 75, 133, 0.3);
    }
    #ko-lyrics .ko-icon-btn svg {
      width: 14px;
      height: 14px;
      display: block;
    }
    #ko-lyrics .ko-icon-btn.heart svg path {
      fill: var(--ko-pink-bd);
    }
    #ko-lyrics .ko-icon-btn.bag svg,
    #ko-lyrics .ko-icon-btn.tag svg {
      stroke: var(--ko-pink-bd);
      fill: none;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    #ko-lyrics .ko-icon-btn.heart {
      animation: ko-micro-beat 1.6s cubic-bezier(.5,0,.5,1) infinite;
    }
    @keyframes ko-micro-beat {
      0%, 60%, 100% { transform: scale(1); }
      30%           { transform: scale(1.14); }
    }

    /* ==== TOP-LEFT — FUWAMOCO brand capsule ============================== */
    #ko-lyrics .ko-brand-tag {
      position: absolute;
      top: -16px;
      left: 26px;
      padding: 6px 16px 7px;
      background: var(--ko-pink-bd);
      color: #fff;
      font-family: var(--ko-font-ui);
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.22em;
      border-radius: 999px;
      border: 2px solid var(--ko-cream);
      transform: rotate(-3deg);
      box-shadow:
        0 3px 0 0 var(--ko-pink-dp),
        0 5px 10px -3px rgba(217, 75, 133, 0.45);
      z-index: 5;
      white-space: nowrap;
    }

    /* ==== BOTTOM-RIGHT — hook capsule "Let Me Be With You" ===============
       Uses the ONLY display-face moment in the overlay: Bagel Fat One,
       echoing the MV thumbnail's chunky dimensional bubble title. The
       capsule is pink→blue gradient (same split as the card piping) so
       the hook literally reads across both twins. */
    #ko-lyrics .ko-hook-tag {
      position: absolute;
      bottom: -17px;
      right: 96px;  /* leaves room for the hearts to meet */
      padding: 7px 18px 8px;
      background: linear-gradient(
        95deg,
        var(--ko-pink-bd) 0%,
        var(--ko-pink-md) 48%,
        var(--ko-blue-md) 52%,
        var(--ko-blue-bd) 100%
      );
      color: #fff;
      font-family: var(--ko-font-hook);
      font-size: 16.5px;
      font-weight: 400;
      letter-spacing: 0.04em;
      border-radius: 999px;
      border: 2px solid var(--ko-cream);
      transform: rotate(2deg);
      box-shadow:
        0 3px 0 0 rgba(45, 60, 100, 0.35),
        0 6px 14px -3px rgba(45, 142, 197, 0.4);
      z-index: 5;
      white-space: nowrap;
      text-shadow: 0 1.5px 0 rgba(40, 20, 40, 0.25);
    }

    /* ==== BOTTOM-LEFT — vinyl-label credit ================================
       Circular cream disc with concentric gold rings and the track
       credit ("CHOBITS OP · 2002") curving around the top, referencing
       a 2002-era CD label. */
    #ko-lyrics .ko-credit-tag {
      position: absolute;
      bottom: -15px;
      left: 30px;
      padding: 4px 12px 5px;
      background: var(--ko-cream);
      color: var(--ko-blue-dp);
      font-family: var(--ko-font-ui);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.20em;
      border-radius: 4px;
      border: 1.5px solid var(--ko-blue-bd);
      transform: rotate(-2deg);
      box-shadow: 0 2px 0 0 var(--ko-blue-dp);
      z-index: 3;
      white-space: nowrap;
    }

    /* ==== TOP-LEFT CORNER — pressed daisy sticker ========================
       Small daisy decal sits over the card's top-left corner, hand-placed.
       Circular cream disc with a daisy silhouette + gold center. */
    #ko-lyrics .ko-daisy {
      position: absolute;
      top: -18px;
      left: 148px;
      width: 34px;
      height: 34px;
      transform: rotate(-12deg);
      z-index: 4;
      filter: drop-shadow(0 2px 3px rgba(217, 75, 133, 0.28));
    }
    #ko-lyrics .ko-daisy svg { width: 100%; height: 100%; display: block; }
    #ko-lyrics .ko-daisy .petal { fill: ${THEME.cream}; stroke: ${THEME.pinkBold}; stroke-width: 1.2; }
    #ko-lyrics .ko-daisy .core  { fill: ${THEME.gold}; stroke: #B98020; stroke-width: 1; }

    /* ==== SIGNATURE — twin-hearts progress bar ==========================
       A single horizontal track hangs just under the card's bottom edge.
       A pink heart (Mococo) starts at the track's LEFT tip; a blue heart
       (Fuwawa) starts at the RIGHT tip. Both travel INWARD as --ko-progress
       goes 0→1, meeting at the card's horizontal center at 100%.

       Directly encoding "let me be with you" — the song is a plea for
       two to become one; the progress bar IS those two becoming one.

       The track beneath them is a dashed stroke; an overlaid "meeting
       line" fades in from the outside edges as the hearts cross their
       halfway point, so the "filled" portion of the track reads from
       the outside IN — mirroring the hearts' own motion. */
    #ko-lyrics .ko-progress {
      position: absolute;
      left: 36px;
      right: 36px;
      bottom: -24px;
      height: 30px;
      z-index: 2;
      pointer-events: none;
    }
    #ko-lyrics .ko-progress-track {
      position: absolute;
      left: 28px;
      right: 28px;
      top: 13px;
      height: 4px;
      pointer-events: none;
    }
    /* Dashed base stroke — the "unfilled" part of the track. */
    #ko-lyrics .ko-progress-track::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        to right,
        ${THEME.pinkMid} 0 6px,
        transparent 6px 10px
      );
      opacity: 0.6;
      border-radius: 2px;
    }
    /* Filled region — solidifies from BOTH edges inward. The fill is
       width 100% * --ko-progress on each side, pinned to the
       outer edges via background-position. */
    #ko-lyrics .ko-progress-track::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to right, ${THEME.pinkBold}, ${THEME.pinkMid}) left/calc(var(--ko-progress, 0) * 50%) 100% no-repeat,
        linear-gradient(to left,  ${THEME.blueBold}, ${THEME.blueMid}) right/calc(var(--ko-progress, 0) * 50%) 100% no-repeat;
      border-radius: 2px;
      filter: drop-shadow(0 0 3px rgba(255, 120, 160, 0.35));
    }

    /* The hearts themselves. Each is absolutely positioned; translateX is
       driven by --ko-progress + --ko-track-w math. GPU-composited — runs
       smoothly over YouTube's heavy DOM. Transition duration matches the
       ~140ms write cadence on --ko-progress for seamless chaining. */
    #ko-lyrics .ko-heart {
      position: absolute;
      top: 3px;
      width: 24px;
      height: 24px;
      transition: transform 160ms linear;
      will-change: transform;
      pointer-events: none;
    }
    #ko-lyrics .ko-heart svg { width: 100%; height: 100%; display: block; overflow: visible; }
    #ko-lyrics .ko-heart .heart-body { stroke: var(--ko-cream); stroke-width: 2; stroke-linejoin: round; }

    /* Mococo-heart: starts at left tip (x=0), travels to track-center-12. */
    #ko-lyrics .ko-heart.pink {
      left: 8px;
      transform: translateX(calc((var(--ko-track-w, 500px) - 72px) * var(--ko-progress) * 0.5));
      animation: ko-beat-pink 1.1s cubic-bezier(.5,0,.5,1) infinite;
    }
    #ko-lyrics .ko-heart.pink .heart-body {
      fill: color-mix(in oklab, ${THEME.pinkMid}, ${THEME.pinkDeep} calc(var(--ko-ripe) * 100%));
      filter:
        drop-shadow(0 2px 3px rgba(217, 75, 133, 0.45))
        drop-shadow(0 0 ${`calc(2px + var(--ko-ripe) * 6px)`} ${THEME.pinkBold});
      transition: fill 2s linear, filter 2s linear;
    }
    /* Fuwawa-heart: starts at right tip, travels inward (-X). 0.65s
       phase-offset on the beat so the two hearts don't pulse in robotic
       sync. */
    #ko-lyrics .ko-heart.blue {
      right: 8px;
      transform: translateX(calc((var(--ko-track-w, 500px) - 72px) * var(--ko-progress) * -0.5));
      animation: ko-beat-blue 1.1s cubic-bezier(.5,0,.5,1) infinite;
      animation-delay: -0.55s;
    }
    #ko-lyrics .ko-heart.blue .heart-body {
      fill: color-mix(in oklab, ${THEME.blueMid}, ${THEME.blueDeep} calc(var(--ko-ripe) * 100%));
      filter:
        drop-shadow(0 2px 3px rgba(45, 142, 197, 0.45))
        drop-shadow(0 0 ${`calc(2px + var(--ko-ripe) * 6px)`} ${THEME.blueBold});
      transition: fill 2s linear, filter 2s linear;
    }
    /* Per-heart beat keyframe. Scales .heart-inner (NOT the wrapper) so
       the translateX on the wrapper isn't fought. */
    @keyframes ko-beat-pink {
      0%, 60%, 100% { --beat: 1; }
      30%           { --beat: 1.18; }
    }
    @keyframes ko-beat-blue {
      0%, 60%, 100% { --beat: 1; }
      30%           { --beat: 1.18; }
    }
    #ko-lyrics .ko-heart .heart-inner {
      width: 100%;
      height: 100%;
      transform: scale(var(--beat, 1));
      transform-origin: center 58%;
      transition: transform 120ms ease-out;
    }

    /* Tiny sparkle trail behind each heart — reads as "magic wake"
       without animating. Decorative only. */
    #ko-lyrics .ko-heart::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0.6;
    }
    #ko-lyrics .ko-heart.pink::after {
      right: 100%; margin-right: 2px;
      background: radial-gradient(circle, ${THEME.pinkLight}, transparent);
    }
    #ko-lyrics .ko-heart.blue::after {
      left: 100%; margin-left: 2px;
      background: radial-gradient(circle, ${THEME.blueLight}, transparent);
    }

    /* ==== LYRICS ========================================================= */
    /* Heavier JP weight + tight white under-stroke so chunk-colored kanji
       pop against the card. Drop shadow under adds depth without haloing. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: var(--ko-rose);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.5em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      text-shadow:
        0 0 2px rgba(255, 255, 255, 0.95),
        1px 0   0 rgba(255, 255, 255, 0.85),
       -1px 0   0 rgba(255, 255, 255, 0.85),
        0 1px   0 rgba(255, 255, 255, 0.85),
        0 2px 3px rgba(50, 30, 45, 0.22);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — force deep ink so it reads as a caption, not a colored
       ornament. Bigger + bolder + crisp white backing for legibility. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: 20px;
      font-weight: 700;
      color: ${THEME.rose} !important;
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding-bottom: 4px;
      text-transform: lowercase;
      user-select: none;
      opacity: 0.92;
      text-shadow:
        0 0 2px rgba(255, 255, 255, 0.95),
        0 1px 0 rgba(255, 255, 255, 0.9);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — same crisp treatment as JP: bold, tight white stroke, dark
       drop. No blur glow. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 700;
      color: var(--ko-rose);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      margin-top: 4px;
      padding-top: 10px;
      text-shadow:
        0 0 1.5px rgba(255, 255, 255, 0.95),
        1px 0   0 rgba(255, 255, 255, 0.8),
       -1px 0   0 rgba(255, 255, 255, 0.8),
        0 1px 2px rgba(50, 30, 45, 0.25);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    /* A centered thin dashed divider above the EN line — the product
       card's "description separator." Pink→blue gradient echoes the
       card piping; dashed so it reads as tiny stitches not a hard rule. */
    #ko-lyrics .ko-line-en:not(:empty)::before {
      content: '';
      position: absolute;
      left: 25%;
      right: 25%;
      top: 0;
      height: 1.5px;
      background: repeating-linear-gradient(
        to right,
        ${THEME.pinkBold} 0 4px,
        transparent 4px 8px,
        ${THEME.blueBold} 8px 12px,
        transparent 12px 16px
      );
      opacity: 0.7;
    }
    /* English-original song mode (lang === "en"): smaller, italic-ish. */
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.92);
      font-weight: 500;
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

  // Shop-UI icons: bag, heart, tag — drawn from the MV's ~0:08 product card.
  const bagSvg = `
    <svg viewBox="0 0 16 16">
      <path d="M4 5 L4 13 L12 13 L12 5 Z M6 5 Q6 2, 8 2 Q10 2, 10 5" />
    </svg>`;
  const heartSvg = `
    <svg viewBox="0 0 16 16">
      <path d="M8 13.5 Q2 10, 2 6 Q2 3, 5 3 Q7 3, 8 5 Q9 3, 11 3 Q14 3, 14 6 Q14 10, 8 13.5 Z"/>
    </svg>`;
  const tagSvg = `
    <svg viewBox="0 0 16 16">
      <path d="M9 2 L14 2 L14 7 L7 14 L2 9 Z M11 5 Q11 4.5, 11.5 4.5 Q12 4.5, 12 5 Q12 5.5, 11.5 5.5 Q11 5.5, 11 5 Z"/>
    </svg>`;

  // Daisy sticker — 8 rounded petals around a gold center.
  const daisySvg = `
    <svg viewBox="0 0 40 40">
      <g transform="translate(20 20)">
        <ellipse class="petal" cx="0"   cy="-11" rx="4.5" ry="7"/>
        <ellipse class="petal" cx="11"  cy="0"   rx="7"   ry="4.5"/>
        <ellipse class="petal" cx="0"   cy="11"  rx="4.5" ry="7"/>
        <ellipse class="petal" cx="-11" cy="0"   rx="7"   ry="4.5"/>
        <ellipse class="petal" cx="7.8"   cy="-7.8"  rx="4"   ry="6"   transform="rotate(45)"/>
        <ellipse class="petal" cx="7.8"   cy="7.8"   rx="4"   ry="6"   transform="rotate(-45)"/>
        <ellipse class="petal" cx="-7.8"  cy="-7.8"  rx="4"   ry="6"   transform="rotate(-45)"/>
        <ellipse class="petal" cx="-7.8"  cy="7.8"   rx="4"   ry="6"   transform="rotate(45)"/>
        <circle class="core" cx="0" cy="0" r="4"/>
      </g>
    </svg>`;

  // Heart SVG for the signature. Simple rounded cardioid.
  const heartPath = `M 12 20 Q 2 14, 2 8 Q 2 3, 6.5 3 Q 10 3, 12 7 Q 14 3, 17.5 3 Q 22 3, 22 8 Q 22 14, 12 20 Z`;
  const progressHeart = (cls) => `
    <div class="ko-heart ${cls}">
      <div class="heart-inner">
        <svg viewBox="0 0 24 24">
          <path class="heart-body" d="${heartPath}"/>
        </svg>
      </div>
    </div>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-brand-tag">${escHTML(THEME.brandTag)}</div>
      <div class="ko-daisy">${daisySvg}</div>
      <div class="ko-icon-row">
        <div class="ko-icon-btn bag">${bagSvg}</div>
        <div class="ko-icon-btn heart">${heartSvg}</div>
        <div class="ko-icon-btn tag">${tagSvg}</div>
      </div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="ko-credit-tag">${escHTML(THEME.creditTag)}</div>
      <div class="ko-hook-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-progress" id="ko-progress">
        <div class="ko-progress-track"></div>
        ${progressHeart('pink')}
        ${progressHeart('blue')}
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

  // --- Position tick: re-anchor the lyric zone to the video rect ---
  // Writes --ko-track-w so the hearts' transform math knows how far to
  // travel. Suppresses transition during the write so resize/fullscreen
  // doesn't animate the hearts to their new proportional positions.
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
      // Suppress heart transitions during the snap.
      const hearts = lyrics.querySelectorAll('.ko-heart');
      hearts.forEach(h => { h.style.transition = 'none'; });
      // Track width = card width - 2 * .ko-progress left-inset (36px each side)
      //             - 2 * .ko-progress-track inner-inset (28px each side) = -128.
      // Cardw - 128 is the pixel distance between track endpoints.
      const trackW = Math.max(120, cardW - 128);
      lyrics.style.setProperty('--ko-track-w', trackW + 'px');
      // Force reflow then restore transitions.
      hearts.forEach(h => {
        void h.offsetWidth;
        h.style.transition = '';
      });
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + progress ---
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

    // ---- Twin-heart progress update (rate-limited, ~7×/sec) ----
    // --ko-progress drives the hearts inward (0 = apart at edges, 1 = meeting
    // at center). --ko-ripe drives heart fill depth + glow — ramps pale→
    // ripe across the middle 80% of the song.
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        const ripe = Math.max(0, Math.min(1, (progFrac - 0.10) / 0.82));
        lyrics.style.setProperty('--ko-progress', progFrac.toFixed(4));
        lyrics.style.setProperty('--ko-ripe',     ripe.toFixed(4));
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
      const glossHTML = g ? escHTML(g) : '\u00a0';
      return `<span data-wc="${ci}" style="color:${col}"><ruby>${escHTML(text)}<rt style="color:${col}">${glossHTML}</rt></ruby></span>`;
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
