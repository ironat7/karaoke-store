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

    // Palette — every hex pulled directly from an MV frame. Hatch sits
    // INSIDE THE LIGHT SQUARES (matches reference gingham + helps
    // lyric legibility: the textured light squares become a medium tone,
    // shrinking the contrast gap that was fighting dark-teal letters).
    bgPinkLight:  '#FFEDF1',  // the light squares — warm pale pink
    bgPinkCoral:  '#F48AA0',  // the saturated squares — medium coral,
                              // pulled back from neon #FD6E8C so letters
                              // crossing coral→hatched-light read cleanly
    hatchPink:    '#DB5F7C',  // diagonal hatch inside the LIGHT squares

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
    cardTilt:    '-0.8deg',  // Slight — the MV's main graphics are axis-aligned, but
                             // washi-taped stickers naturally sit a touch off-axis.

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
      --ko-pink-coral: ${THEME.bgPinkCoral};
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
      /* 2-tone gingham as a single SVG data URI. Two diagonally-placed
         coral squares per 56px tile on a pale-pink base; hatch (via SVG
         <pattern>) is fill-clipped to the OTHER two squares (the light
         ones) — matches the MV's reference gingham where hatch lives in
         the pale cells, not the saturated ones.
         Why SVG and not CSS gradients: CSS can't mask a repeating-linear-
         gradient to a per-tile region cleanly. SVG <pattern>-as-fill does
         it in one hop and reads as one image in the style inspector. */
      background:
        url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><defs><pattern id='h' patternUnits='userSpaceOnUse' width='6' height='6' patternTransform='rotate(45)'><line x1='0' y1='0' x2='0' y2='6' stroke='${THEME.hatchPink.replace('#','%23')}' stroke-width='2.4'/></pattern></defs><path d='M0 0h28v28H0zM28 28h28v28H28z' fill='${THEME.bgPinkCoral.replace('#','%23')}'/><path d='M28 0h28v28H28zM0 28h28v28H0z' fill='url(%23h)' opacity='.55'/></svg>") 0 0 / 56px 56px repeat,
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

    /* Empty-state collapse during instrumental gaps — gentle settle, not fold. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardTilt}) scale(0.94);
    }

    /* ==== CHERRY-STEM PROGRESS BAR — the signature ========================
       SVG stem arches above the card top edge. The .ko-cherry div rides
       left→right via --ko-progress, and ripens pale→deep via --ko-ripe
       using color-mix(). */
    #ko-lyrics .ko-stem {
      position: absolute;
      top: -34px;
      /* Inset from card edges so the stem doesn't draw over the corner
         washi tapes. The branch reads as floating above the card rather
         than wrapping around it. */
      left: 30px;
      right: 30px;
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
      stroke-width: 4.5;
      stroke-linecap: round;
      /* Single soft offset shadow — if you add a second, the branch
         visually doubles. 1px blur + 1px offset is subtle but reads. */
      filter: drop-shadow(0 1px 1.5px rgba(30, 60, 30, 0.32));
    }

    /* The cherry pair — a Y-stemmed two-ball unit that travels along the
       main branch. GPU-composited transform (NOT left) because:
         - translateX is sub-pixel smooth on the compositor; left paints
           at integer pixels, so at ~5 px/sec motion you'd see every pixel
           step as a visible chop.
         - transform doesn't trigger layout, only composite — cheap enough
           to run over YouTube's heavy DOM.
       Position var --ko-progress is written ~7×/sec (see tick); transition
       duration matches the write interval so each animation chains into
       the next instead of stalling mid-interpolation. */
    #ko-lyrics .ko-cherry {
      position: absolute;
      top: 10px;
      left: 8px;
      width: 60px; height: 54px;
      transform: translateX(
        calc((var(--ko-stem-w, 500px) - 76px) * var(--ko-progress))
      );
      transition: transform 160ms linear;
      will-change: transform;
      z-index: 4;
      pointer-events: none;
    }

    /* SVG overlay inside the cherry: Y-branched stem + two leaves above
       the apex. Uses viewBox with negative-y so leaves sit ABOVE the
       container's top edge (drawn outside the box via overflow:visible). */
    #ko-lyrics .ko-cherry-unit {
      position: absolute;
      inset: 0;
      overflow: visible;
      pointer-events: none;
      filter: drop-shadow(0 1px 0 rgba(30, 60, 30, 0.22));
    }
    #ko-lyrics .ko-cherry-unit .ko-cy-stem {
      fill: none;
      stroke: var(--ko-leaf);
      stroke-width: 2.8;
      stroke-linecap: round;
    }
    #ko-lyrics .ko-cherry-unit .ko-cy-leaf {
      fill: var(--ko-leaf);
    }
    #ko-lyrics .ko-cherry-unit .ko-cy-leaf-hl {
      fill: none;
      stroke: rgba(255, 255, 255, 0.55);
      stroke-width: 1.1;
      stroke-linecap: round;
    }

    /* The cherry balls — two round divs hanging from the Y-stems. Each
       shares the same color-mix'd fill driven by --ko-ripe; their color
       and drop-shadow transitions at 2s so the ripen reads as a slow
       softening, not a step. */
    #ko-lyrics .ko-cherry-ball {
      position: absolute;
      width: 24px; height: 24px;
      border-radius: 50%;
      background:
        radial-gradient(
          circle at 35% 30%,
          rgba(255, 255, 255, 0.72) 0%,
          rgba(255, 255, 255, 0) 30%
        ),
        radial-gradient(
          circle at 50% 55%,
          color-mix(in oklab, ${THEME.cherryPale}, ${THEME.cherry} calc(var(--ko-ripe) * 100%)) 0%,
          color-mix(in oklab, ${THEME.cherryPale}, ${THEME.cherryDeep} calc(var(--ko-ripe) * 100%)) 100%
        );
      box-shadow:
        0 3px 0 0 color-mix(in oklab, ${THEME.cherryPale}, ${THEME.cherryDeep} calc(var(--ko-ripe) * 100%)),
        0 5px 9px -3px rgba(40, 0, 10, 0.38),
        inset -2px -3px 4px rgba(120, 0, 20, 0.25);
      transition: background 2s linear, box-shadow 2s linear;
    }
    #ko-lyrics .ko-cherry-ball.left  { left: 2px;  top: 24px; }
    #ko-lyrics .ko-cherry-ball.right { left: 34px; top: 28px; }

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

  // Cherry-pair SVG: Y-branched stem meeting at apex (30,0), two leaves
  // sit above the apex, two cherry balls hang at the branch tips. The
  // viewBox extends into negative-y so leaves can draw ABOVE the
  // container (overflow: visible on .ko-cherry-unit).
  const cherryUnit = `
    <svg class="ko-cherry-unit" viewBox="0 -16 60 70">
      <path class="ko-cy-leaf" d="M 18 -14 Q 28 -20, 34 -12 Q 28 -4, 18 -14 Z"/>
      <path class="ko-cy-leaf-hl" d="M 22 -12 Q 28 -17, 32 -13"/>
      <path class="ko-cy-leaf" d="M 30 -10 Q 40 -15, 46 -8 Q 40 -2, 30 -10 Z"/>
      <path class="ko-cy-leaf-hl" d="M 33 -9 Q 40 -13, 43 -10"/>
      <path class="ko-cy-stem"    d="M 30 -4 C 28 6, 20 12, 14 22"/>
      <path class="ko-cy-stem"    d="M 30 -4 C 32 8, 38 14, 46 24"/>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-stem" id="ko-stem">
        ${stemSvg}
        <div class="ko-cherry" id="ko-cherry">
          ${cherryUnit}
          <div class="ko-cherry-ball left"></div>
          <div class="ko-cherry-ball right"></div>
        </div>
      </div>
      <div class="ko-washi tl"></div>
      <div class="ko-washi br"></div>
      <div class="ko-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
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
  let lastProgWriteAt = 0;  // ms timestamp of last --ko-progress/--ko-ripe write

  // --- Position tick: re-anchor the lyric zone to the video rect ---
  // Also writes --ko-stem-w in pixels so the cherry's transform math knows
  // how far to travel. Updated only when video rect changes.
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
      // .ko-stem is inset 30px/30px inside the card; its width = cardW - 60
      lyrics.style.setProperty('--ko-stem-w', (cardW - 60) + 'px');
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

    // ---- Cherry progress update (rate-limited) ----
    // Write at most every PROG_WRITE_MS. The CSS matches that cadence with
    // `transition: transform 160ms linear` on .ko-cherry, so each write's
    // transition chains seamlessly into the next one — visually continuous
    // motion with only ~7 writes/sec. Running this at RAF rate is wasteful
    // (the cherry moves ~5 px/sec; per-frame precision is invisible).
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        // Ripening ramp: pale for the first ~12% (intro), fully ripe by
        // ~92% (gives the cherry a moment to sit at full-red at the end).
        const ripe = Math.max(0, Math.min(1, (progFrac - 0.12) / 0.80));
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
