// ============================================================================
// KARAOKE OVERLAY — "STAGELIGHT DUET" for VESPERBELL × YOMI / "again" (YUI cover)
// ----------------------------------------------------------------------------
// MV identity: YOMI on a rock stage, platinum hair, heterochromia (left eye
// crimson, right eye cyan), dark teal corseted outfit streamered with blue
// ribbons, blue-grille mic in hand; drum kit behind, red floor lights and
// cool blue rim lights crossing over her. The title "again" rendered in
// flowing blue-cursive.
//
// The design weaponizes the heterochromia. TWO spotlight beams angle down
// from the upper corners of the card — LEFT BEAM CYAN, RIGHT BEAM CRIMSON —
// meeting over the lyrics. Their intensity is driven by --ko-mood, which
// the tick computes from the video clock against hand-authored song
// structure: dim during intro/breaks, saturated during chorus, white-hot
// ONLY during the single line "目を覚ませ 目を覚ませ" (t≈169.71s, 7 seconds
// of song-named climax). The overlay literally wakes up with the song.
//
// Signature anchors the rest: silver stage-truss border, cursive "again"
// floating where the beams cross, a single blue ribbon draped down the left
// edge (MV's ribbon motif), and two small spotlight-lens gems at the beam
// origins that throb with the mood var. Nothing moves horizontally — no
// progress-bar trick. The card is alive because the stage is breathing.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Stagelight Duet
  // ==========================================================================
  const THEME = {
    trackTag:   'again',                                   // cursive script title
    artistTag:  'VESPERBELL · YOMI  —  yui cover',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Italianno&' +
      'family=Klee+One:wght@400;600&' +
      'family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&' +
      'family=Noto+Sans+JP:wght@400;500&' +
      'family=Cinzel:wght@500;600&' +
      'display=swap',
    fontTitle:    '"Italianno", "Great Vibes", cursive',   // flowing "again"
    fontJP:       '"Klee One", "Shippori Mincho", serif',  // handwritten-brush JP
    fontEN:       '"Cormorant Garamond", "EB Garamond", serif',
    fontGloss:    '"Noto Sans JP", system-ui, sans-serif',
    fontCredit:   '"Cinzel", "Trajan Pro", serif',

    // Palette — MV-derived.
    //   stageBlack: the near-black of her outfit and unlit stage between cues.
    //   navyInk:    the blue tint under every rim-lit frame (drum shadows).
    //   silverTruss: stage-rigging silver (the drum stand chrome).
    //   cyan:       her right eye + mic + ribbons (iconic blue).
    //   crimson:    her left eye + warm floor lights + tom heads.
    //   ember:      the warm gold that spills off amps / cymbal glint.
    //   ivory:      hair highlights, the main lyric text color.
    stageBlack:   '#0A0C14',
    navyInk:      '#111832',
    silverTruss:  '#9AA4B2',
    cyan:         '#6CC9F5',
    cyanDeep:     '#2E8FCB',
    crimson:      '#FF5F6D',
    crimsonDeep:  '#C7304D',
    ember:        '#FFC872',
    ivory:        '#F4F0E6',
    ivoryDim:     '#C9C3B2',

    // Typography
    lyricFontSizeJP:     '68px',
    lyricLineHeightJP:   '2.0',
    lyricLetterSpacingJP:'0.02em',
    lyricFontSizeEN:     '42px',
    lyricLineHeightEN:   '1.3',
    lyricLetterSpacingEN:'0.015em',
    glossFontSize:       '22px',
    glossFontWeight:     '500',

    // Card shape
    cardRadius:  '6px',    // rock stage = hard edges, not rounded
    cardPadding: '38px 52px 30px',

    // chunkColors: 6 slots chosen to sit on navy-black and scramble with
    // the beam gradient without vanishing. All MV-sourced (her outfit +
    // stage lights), all bright enough to read against the matte card.
    chunkColors: [
      '#8CDEFF',  // 0 — pale cyan         (subject / narrator voice)
      '#FF8898',  // 1 — soft crimson      (emotion / desire verbs)
      '#FFD27A',  // 2 — ember gold        (motion / time words)
      '#C9B7FF',  // 3 — lavender          (nuance, where the two beams mix)
      '#FFFFFF',  // 4 — stagelight white  (emphasis / negation)
      '#FFAE8C',  // 5 — warm peach        (softness / self-doubt)
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

  // Position: seated high on the video, well above the YouTube player
  // chrome. Card has room for the cursive "again" floating above the JP.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.56, widthFrac: 0.64 },
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
    /* CSS vars declared on BOTH selectors because #ko-lyrics is a body
       sibling of #karaoke-root, not a descendant. */
    #karaoke-root, #ko-lyrics {
      --ko-stage-black:  ${THEME.stageBlack};
      --ko-navy:         ${THEME.navyInk};
      --ko-silver:       ${THEME.silverTruss};
      --ko-cyan:         ${THEME.cyan};
      --ko-cyan-deep:    ${THEME.cyanDeep};
      --ko-crimson:      ${THEME.crimson};
      --ko-crimson-deep: ${THEME.crimsonDeep};
      --ko-ember:        ${THEME.ember};
      --ko-ivory:        ${THEME.ivory};
      --ko-ivory-dim:    ${THEME.ivoryDim};

      --ko-font-title:   ${THEME.fontTitle};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-en:      ${THEME.fontEN};
      --ko-font-gloss:   ${THEME.fontGloss};
      --ko-font-credit:  ${THEME.fontCredit};

      /* Runtime vars written by the main tick. --ko-mood drives beam
         intensity: ~0.1 dim verse, ~0.85 saturated chorus, 2.0 white-hot
         climax ("wake up, wake up"). Transitions on consumer selectors
         smooth the shifts. --ko-breathe is a subtle sinusoidal pulse
         so the stage reads as live even when the mood is steady.     */
      --ko-mood:    0;
      --ko-breathe: 0.5;
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — MATTE ROCK STAGE ========================================= */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: ${THEME.cardPadding};
      /* Layered background: fine grain, backstage bloom from the top,
         floor shadow at the bottom, base navy→stage-black gradient. */
      background:
        repeating-linear-gradient(
          0deg,
          rgba(255, 255, 255, 0.010) 0,
          rgba(255, 255, 255, 0.010) 1px,
          transparent 1px, transparent 2px
        ),
        radial-gradient(
          ellipse 140% 70% at 50% 0%,
          rgba(255, 120, 90, 0.08) 0%,
          transparent 60%
        ),
        linear-gradient(
          180deg,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0) 60%,
          rgba(0, 0, 0, 0.35) 100%
        ),
        linear-gradient(
          180deg,
          var(--ko-navy) 0%,
          var(--ko-stage-black) 100%
        );
      border-radius: ${THEME.cardRadius};
      /* Silver stage-truss border: inner hairline + darker silver offset.
         Outer glow fields driven by --ko-mood — beam "bloom" leaking past
         the card edge, cyan on the left + crimson on the right. */
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, calc(0.08 + var(--ko-mood) * 0.16)),
        inset 0 0 0 2px var(--ko-silver),
        inset 0 0 0 4px var(--ko-stage-black),
        inset 0 0 0 5px rgba(154, 164, 178, calc(0.55 + var(--ko-mood) * 0.25)),
        0 22px 48px -14px rgba(0, 0, 0, 0.85),
        -40px 0 80px -30px rgba(108, 201, 245, calc(var(--ko-mood) * 0.55)),
         40px 0 80px -30px rgba(255, 95, 109, calc(var(--ko-mood) * 0.55));
      transition: box-shadow 480ms ease, transform 400ms ease;
      isolation: isolate;
      overflow: visible;
    }

    /* Empty-state collapse during instrumental gaps — scale-and-fade. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: scale(0.96);
    }

    /* ==== TRUSS BOLTS — tiny stage-rig detail at each corner ============== */
    #ko-lyrics .ko-bolt {
      position: absolute;
      width: 7px; height: 7px;
      border-radius: 1px;
      background:
        radial-gradient(circle at 35% 35%,
          rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 55%),
        linear-gradient(140deg, #c7ced9 0%, #5a6372 100%);
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.5),
        0 1px 1px rgba(0, 0, 0, 0.4);
      z-index: 6;
    }
    #ko-lyrics .ko-bolt.tl { top: 10px;    left: 10px; }
    #ko-lyrics .ko-bolt.tr { top: 10px;    right: 10px; }
    #ko-lyrics .ko-bolt.bl { bottom: 10px; left: 10px; }
    #ko-lyrics .ko-bolt.br { bottom: 10px; right: 10px; }

    /* ==== SPOTLIGHT LENSES — the two beam origins ========================= */
    /* Small round "lens" dots at the upper corners. Each is the source of
       a beam that angles down across the card. Fills intensify with
       --ko-mood; white-hot bloom at mood=2 (climax). */
    #ko-lyrics .ko-lens {
      position: absolute;
      top: -6px;
      width: 22px; height: 22px;
      border-radius: 50%;
      z-index: 5;
      transition: filter 380ms ease, transform 380ms ease;
    }
    #ko-lyrics .ko-lens-cyan {
      left: 28px;
      background:
        radial-gradient(circle at 40% 40%,
          #ffffff 0%,
          rgba(255, 255, 255, 0.85) 15%,
          color-mix(in oklab, var(--ko-cyan-deep), var(--ko-cyan) calc(50% + var(--ko-mood) * 40%)) 55%,
          color-mix(in oklab, var(--ko-navy), var(--ko-cyan-deep) calc(20% + var(--ko-mood) * 40%)) 100%);
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.65),
        0 0 calc(14px + var(--ko-mood) * 30px) calc(2px + var(--ko-mood) * 8px)
          color-mix(in oklab, transparent, var(--ko-cyan) calc(45% + var(--ko-mood) * 45%)),
        inset 0 -2px 3px rgba(0, 0, 0, 0.35);
      transform: scale(calc(1 + var(--ko-mood) * 0.08));
    }
    #ko-lyrics .ko-lens-crimson {
      right: 28px;
      background:
        radial-gradient(circle at 60% 40%,
          #ffffff 0%,
          rgba(255, 255, 255, 0.85) 15%,
          color-mix(in oklab, var(--ko-crimson-deep), var(--ko-crimson) calc(50% + var(--ko-mood) * 40%)) 55%,
          color-mix(in oklab, var(--ko-navy), var(--ko-crimson-deep) calc(20% + var(--ko-mood) * 40%)) 100%);
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.65),
        0 0 calc(14px + var(--ko-mood) * 30px) calc(2px + var(--ko-mood) * 8px)
          color-mix(in oklab, transparent, var(--ko-crimson) calc(45% + var(--ko-mood) * 45%)),
        inset 0 -2px 3px rgba(0, 0, 0, 0.35);
      transform: scale(calc(1 + var(--ko-mood) * 0.08));
    }

    /* ==== BEAMS — the signature =========================================== */
    /* Clip-path cones angled from each lens across the top third of the
       card. Left lens's beam angles down-right; right lens's beam angles
       down-left; they overlap near the center where the cursive "again"
       sits, and the overlap reads as a warm violet/magenta glow.
       mix-blend-mode: screen brightens what's behind the beams without
       painting dark edges — beams feel like light, not paint. */
    #ko-lyrics .ko-beam {
      position: absolute;
      top: 0;
      width: 70%;
      height: 220px;
      pointer-events: none;
      mix-blend-mode: screen;
      transition: opacity 420ms ease, filter 420ms ease;
      z-index: 2;
    }
    #ko-lyrics .ko-beam-cyan {
      left: -6%;
      clip-path: polygon(8% 0%, 18% 0%, 85% 100%, 45% 100%);
      background: linear-gradient(
        165deg,
        color-mix(in oklab, transparent, var(--ko-cyan) calc(20% + var(--ko-mood) * 45%)) 0%,
        color-mix(in oklab, transparent, var(--ko-cyan) calc(8% + var(--ko-mood) * 25%)) 55%,
        transparent 100%
      );
      opacity: calc(0.55 + var(--ko-breathe) * 0.12 + var(--ko-mood) * 0.35);
      filter: blur(calc(2px + var(--ko-mood) * 2px));
    }
    #ko-lyrics .ko-beam-crimson {
      right: -6%;
      clip-path: polygon(82% 0%, 92% 0%, 55% 100%, 15% 100%);
      background: linear-gradient(
        195deg,
        color-mix(in oklab, transparent, var(--ko-crimson) calc(20% + var(--ko-mood) * 45%)) 0%,
        color-mix(in oklab, transparent, var(--ko-crimson) calc(8% + var(--ko-mood) * 25%)) 55%,
        transparent 100%
      );
      opacity: calc(0.55 + var(--ko-breathe) * 0.12 + var(--ko-mood) * 0.35);
      filter: blur(calc(2px + var(--ko-mood) * 2px));
    }
    /* Beam cores: thinner brighter stripes inside each beam, only visible
       at moderate+ mood; invisible at rest. */
    #ko-lyrics .ko-beam-cyan::after,
    #ko-lyrics .ko-beam-crimson::after {
      content: '';
      position: absolute; inset: 0;
      opacity: calc(var(--ko-mood) * 0.8);
      transition: opacity 400ms ease;
    }
    #ko-lyrics .ko-beam-cyan::after {
      clip-path: polygon(11% 0%, 14% 0%, 68% 100%, 60% 100%);
      background: linear-gradient(
        165deg,
        rgba(255, 255, 255, 0.7) 0%,
        color-mix(in oklab, transparent, var(--ko-cyan) 60%) 40%,
        transparent 100%
      );
    }
    #ko-lyrics .ko-beam-crimson::after {
      clip-path: polygon(86% 0%, 89% 0%, 40% 100%, 32% 100%);
      background: linear-gradient(
        195deg,
        rgba(255, 255, 255, 0.7) 0%,
        color-mix(in oklab, transparent, var(--ko-crimson) 60%) 40%,
        transparent 100%
      );
    }

    /* ==== CURSIVE "AGAIN" TITLE =========================================== */
    /* Sits on the card's top edge where the two beams intersect. Blue ink
       + cyan halo mirrors the MV's own title card. Tiny negative rotation
       for hand-signed feel. At climax, a crimson ghost layer behind the
       blue reveals — the two-beam mix becoming visible in the title. */
    #ko-lyrics .ko-title {
      position: absolute;
      top: -38px;
      left: 50%;
      transform: translateX(-50%) rotate(-4deg);
      font-family: var(--ko-font-title);
      font-size: 64px;
      font-weight: 400;
      line-height: 1;
      color: var(--ko-cyan);
      letter-spacing: 0.02em;
      text-shadow:
        0 0 16px color-mix(in oklab, transparent, var(--ko-cyan) 60%),
        0 0 28px color-mix(in oklab, transparent, var(--ko-cyan) 30%),
        0 2px 0 rgba(0, 0, 0, 0.35);
      z-index: 7;
      white-space: nowrap;
      user-select: none;
      transition: text-shadow 400ms ease, filter 400ms ease;
      filter: brightness(calc(1 + var(--ko-mood) * 0.15));
    }
    #ko-lyrics .ko-title::after {
      content: 'again';
      position: absolute;
      inset: 0;
      color: var(--ko-crimson);
      opacity: calc(var(--ko-mood) * 0.4);
      mix-blend-mode: screen;
      filter: blur(2px);
      pointer-events: none;
      transition: opacity 400ms ease;
    }

    /* ==== RIBBON — MV blue ribbon trailing down the left edge ============= */
    /* Slender SVG ribbon draped from the top-left truss, curling across
       the card face. References the constant blue ribbons on her outfit.
       Low opacity so it reads as a signature flourish, not a distraction. */
    #ko-lyrics .ko-ribbon {
      position: absolute;
      top: -18px;
      left: -28px;
      width: 120px;
      height: 300px;
      pointer-events: none;
      z-index: 3;
      opacity: 0.78;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
    }
    #ko-lyrics .ko-ribbon path.ribbon-body {
      fill: none;
      stroke: url(#ko-ribbon-grad);
      stroke-width: 9;
      stroke-linecap: round;
    }
    #ko-lyrics .ko-ribbon path.ribbon-hl {
      fill: none;
      stroke: rgba(255, 255, 255, 0.55);
      stroke-width: 1.2;
      stroke-linecap: round;
    }

    /* ==== ARTIST CREDIT — engraved stage-plaque feel ====================== */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -11px;
      left: 50%;
      transform: translateX(-50%);
      padding: 3px 18px 4px;
      background:
        linear-gradient(180deg,
          rgba(30, 36, 54, 0.95) 0%,
          rgba(10, 12, 20, 0.95) 100%);
      color: var(--ko-ivory-dim);
      font-family: var(--ko-font-credit);
      font-size: 10.5px;
      font-weight: 500;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      border-radius: 2px;
      border: 1px solid var(--ko-silver);
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.6),
        0 2px 4px rgba(0, 0, 0, 0.55);
      z-index: 6;
      white-space: nowrap;
    }

    /* ==== LYRICS ========================================================== */
    /* JP: Klee One — handwritten-brush serif, carries emotional weight
       without feeling anime-saccharine. Warm ivory with dual-tone shadow
       (cyan + crimson) echoing the two beams. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 600;
      color: var(--ko-ivory);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.5em;
      min-height: 1em;
      position: relative;
      z-index: 4;
      order: 1;
      text-shadow:
        0 0 1px rgba(0, 0, 0, 0.8),
        0 2px 0 rgba(0, 0, 0, 0.55),
        -1px 0 16px color-mix(in oklab, transparent, var(--ko-cyan) calc(18% + var(--ko-mood) * 20%)),
        1px 0 16px color-mix(in oklab, transparent, var(--ko-crimson) calc(18% + var(--ko-mood) * 20%));
      transition: text-shadow 380ms ease;
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — small ivory-dim label above each morpheme. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.02em;
      line-height: 1.15;
      padding-bottom: 5px;
      color: var(--ko-ivory-dim);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.92;
      text-shadow:
        0 0 6px rgba(0, 0, 0, 0.75),
        0 1px 0 rgba(0, 0, 0, 0.6);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Cormorant Garamond italic, like the subtitle track of an
       anime Blu-ray. Sits directly below JP, slightly smaller, a bit dim. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 500;
      font-style: italic;
      color: var(--ko-ivory-dim);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      padding-top: 4px;
      position: relative;
      z-index: 4;
      order: 2;
      text-shadow:
        0 0 1px rgba(0, 0, 0, 0.9),
        0 1px 0 rgba(0, 0, 0, 0.6),
        0 0 14px rgba(0, 0, 0, 0.5);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 1.1);
      font-style: normal;
      font-weight: 600;
      color: var(--ko-ivory);
    }
    /* Thin silver hairline under the EN line. */
    #ko-lyrics .ko-line-en:not(:empty) {
      margin-top: 4px;
      background:
        linear-gradient(90deg,
          transparent 15%,
          color-mix(in oklab, transparent, var(--ko-silver) 55%) 50%,
          transparent 85%)
        bottom / 100% 1px no-repeat;
      padding-bottom: 5px;
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

  // Ribbon: slender SVG path draping from the upper-left, swinging across
  // the card face, curling back off. Gradient stroke from bright cyan at
  // top to cooler navy at the tail — matches the MV ribbons catching
  // stage light then falling into shadow.
  const ribbonSvg = `
    <svg class="ko-ribbon" viewBox="0 0 120 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ko-ribbon-grad" x1="0%" y1="0%" x2="40%" y2="100%">
          <stop offset="0%"  stop-color="#C2ECFF"/>
          <stop offset="45%" stop-color="${THEME.cyan}"/>
          <stop offset="100%" stop-color="${THEME.cyanDeep}"/>
        </linearGradient>
      </defs>
      <path class="ribbon-body"
            d="M 28 2
               C 30 60, 82 88, 54 140
               S 10 204, 38 268
               Q 54 286, 76 278"/>
      <path class="ribbon-hl"
            d="M 30 8
               C 32 58, 80 86, 54 138"/>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-beam ko-beam-cyan"></div>
      <div class="ko-beam ko-beam-crimson"></div>
      ${ribbonSvg}
      <div class="ko-lens ko-lens-cyan"></div>
      <div class="ko-lens ko-lens-crimson"></div>
      <div class="ko-bolt tl"></div>
      <div class="ko-bolt tr"></div>
      <div class="ko-bolt bl"></div>
      <div class="ko-bolt br"></div>
      <div class="ko-title">${escHTML(THEME.trackTag)}</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
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
  let lastMoodWriteAt = 0;
  let lastMood = -1, lastBreathe = -1;

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
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Song-structure mood map (hand-authored for THIS song) --------------
  // YUI's "again" structure:
  //   intro     0    – 19.8    dim
  //   verse 1   19.8 – 65.7    dim + cool
  //   chorus 1  65.7 – 84.5    bicolor saturation
  //   break     84.5 – 92.0    dim
  //   verse 2   92.0 – 129.5   dim + cool
  //   chorus 2  129.5 – 154.5  bicolor saturation
  //   bridge    154.5 – 169.6  sustained bicolor
  //   CLIMAX    169.6 – 176.5  "目を覚ませ 目を覚ませ" — white-hot flare
  //   break     176.5 – 190.0  dim
  //   final ch  190.0 – 226.5  bicolor, slightly hotter
  //   outro     226.5 +        fade
  const moodFor = (t) => {
    if (t < 19.8)     return 0.05;
    if (t < 65.7)     return 0.18;
    if (t < 84.5)     return 0.82;
    if (t < 92.0)     return 0.10;
    if (t < 129.5)    return 0.20;
    if (t < 154.5)    return 0.85;
    if (t < 169.6)    return 0.75;
    if (t < 176.5)    return 2.00;   // CLIMAX
    if (t < 190.0)    return 0.08;
    if (t < 226.5)    return 0.92;
    return 0.05;
  };

  // --- Main tick: update lyric text + stage mood ---
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

    // ---- Stage mood update (rate-limited ~7/sec) ----
    // Consumer selectors have `transition: ... 380-500ms` so per-frame
    // writes are wasted. Quantize to 140ms; transitions chain seamlessly.
    if (song) {
      const now = performance.now();
      if (now - lastMoodWriteAt >= 140) {
        lastMoodWriteAt = now;
        const target = moodFor(inSong);
        // Breath: gentle sinusoidal 0→1 at ~0.22 Hz (one cycle every ~4.5s)
        // so beams feel alive without drawing the eye.
        const breathe = 0.5 + 0.5 * Math.sin(now / 720);
        if (Math.abs(target - lastMood) > 0.005) {
          lyrics.style.setProperty('--ko-mood', target.toFixed(3));
          lastMood = target;
        }
        if (Math.abs(breathe - lastBreathe) > 0.02) {
          lyrics.style.setProperty('--ko-breathe', breathe.toFixed(3));
          lastBreathe = breathe;
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
        const nextT = (lrc[lineIdx + 1] && lrc[lineIdx + 1].t) || ((song.dur || 240) + 10);
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
