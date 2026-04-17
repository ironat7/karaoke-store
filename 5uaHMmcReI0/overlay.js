// ============================================================================
// KARAOKE OVERLAY — うい麦畑でつかまえて (Catcher in the Ui)
//                   しぐれうい × ナナホシ管弦楽団 × 岩見 陸
// ----------------------------------------------------------------------------
// LOCKED — correctness-load-bearing. Don't rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; YouTube CSP requires it)
//   • window.__koGen + MY_GEN closure capture for loop termination
//   • window.__setlist, __parsedLyrics, __transCache, __plainLyrics,
//     __lyricOffsets, __wordAlign, __karaokeLyricsHidden, __karaokeRebuild,
//     __mergeTranslations (extension contract — bootstrap calls them by name)
//   • RAF + setInterval(tick, 30) dual loop with MY_GEN bail
//   • COLOR_POLL setInterval at ~150ms (JP textContent → colored spans + ruby)
//   • positionTick posKey cache
//   • curLineIdx = -1 reset on song transition
//   • Per-write cache guards before every DOM write
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • DOM order: JP line BEFORE EN line (a11y reading order)
//   • Hard DOM contract: #ko-line-jp and #ko-line-en must exist inside
//     #ko-lyrics > .ko-slot
//   • Offset hotkeys [ ] \ + window.postMessage broadcast
//
// GOTCHAS:
//   • Use __karaokePolicy.createHTML() for all innerHTML writes (CSP)
//   • Use <link rel="stylesheet"> for fonts, NOT @import (CSP)
//   • CSS vars declared on BOTH #karaoke-root AND #ko-lyrics
//   • preserveAspectRatio="none" stretches everything inside an SVG
//
// ----------------------------------------------------------------------------
// DESIGN — THE UI-WHEAT FIELD
//
// The MV commits to a bright cream-and-orange scrapbook-poster art direction
// built around its own signature typography: fat Mochiy-Pop-style bubble
// letters with a triple-layer treatment — cream outer outline, warm color
// fill, deep-red drop shadow underneath. The card adopts that exact treatment
// for the JP lyrics, so the overlay reads as commissioned alongside the
// MV's own burned-in lyric art rather than an unrelated layer dropped on top.
//
// The card itself is a cream construction-paper cutout, red-and-cream-striped
// washi-taped at opposing corners, tilted a touch off-axis like a scrapbook
// page. A faint diagonal coral hatch reads as paper texture beneath.
//
// Signature — the wheat-field progress strip.
// Above the card's top edge, a horizontal wheat-field vignette plays out.
// Six stylised wheat ears stand along a thin cream ground line, and a tiny
// chibi Java sparrow (the species Shigure Ui uses as her mascot, featured as
// flocks throughout the MV) walks left-to-right along the ground as the
// song progresses — its x-position driven by --ko-progress. Every wheat
// seed ripens pale-green → golden-amber via color-mix on --ko-ripe through
// the run. Functional (encodes time on two channels: bird position fast,
// field color slow) AND thematic: the title is "catch me in the Ui-wheat
// field," and the sparrow is the one who can't be caught, scampering
// through the ripening field while the listener watches from the card.
// The sparrow's coral beak and feet echo her uniform's red sailor tie.
//
// Line changes are deliberately motionless. The card is quietly alive
// through the bird's walk and the wheat ripening — nothing else.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Ui-Wheat palette (every hex pulled from the MV)
  // ==========================================================================
  const THEME = {
    trackTag:   'うい麦畑で',
    artistTag:  'Shigure Ui × Nanahoshi',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Mochiy+Pop+One&' +
      'family=Potta+One&' +
      'family=Caveat:wght@600;700&' +
      'family=Yomogi&' +
      'display=swap',
    fontJP:       '"Mochiy Pop One", "M PLUS Rounded 1c", sans-serif',
    fontJPHeavy:  '"Potta One", "Mochiy Pop One", sans-serif',
    fontEN:       '"Caveat", "Patrick Hand", cursive',
    fontGloss:    '"Yomogi", "Sawarabi Gothic", sans-serif',

    // Palette — every hex pulled from the MV frames (uniform, beret, socks,
    // title-logo outline, spotlight halo, flock of sparrows, wheat-and-bird
    // end-credit motifs). Chunk fills are intentionally saturated enough to
    // sit legibly inside the cream text-stroke outline that wraps the JP.
    cream:        '#FFF7E4',  // outer outline on letters, ground line, highlight
    paper:        '#FFFBEF',  // card base
    paperWarm:    '#FFE8C4',  // card warm-bottom gradient
    hatchCoral:   'rgba(228, 89, 76, 0.07)',  // faint paper-texture diagonals

    coral:        '#E4594C',  // sailor collar, socks, beak, washi tape
    coralDeep:    '#B82E26',  // bubble-letter drop shadow
    orange:       '#F08B38',  // MV stripes / warm secondary
    gold:         '#F2B935',  // ripe wheat, spotlight halo, bubble fill
    emerald:      '#4FA76A',  // her eyes, young-wheat green reference
    blueBeret:    '#5B82B8',  // beret blue stripe
    winePlum:     '#9A3050',  // deep card accent, shadow

    charcoal:     '#3D3F4A',  // pinstripe uniform, body text ink

    // Wheat-specific ramp endpoints (driven by --ko-ripe).
    wheatGreen:   '#C5E08A',  // pale unripe seed
    wheatGold:    '#F2B935',  // golden ripe seed (same hex as gold)
    wheatStem:    '#A9722A',  // warm tan stem

    // Typography
    lyricFontSizeJP:     '50px',
    lyricLineHeightJP:   '2.0',
    lyricLetterSpacingJP:'0.04em',
    lyricFontSizeEN:     '30px',
    lyricLineHeightEN:   '1.22',
    lyricLetterSpacingEN:'0.005em',
    glossFontSize:       '17px',
    glossFontWeight:     '400',

    // Card shape
    cardRadius:  '18px',
    cardPadding: '44px 56px 34px',
    cardTilt:    '-0.9deg',   // Slight scrapbook-page tilt.

    // chunkColors — six MV-derived hues, all saturated and warm enough to
    // read over the cream text-stroke that wraps the JP lyrics.
    chunkColors: [
      '#E4594C',  // 0 — coral red       (primary emotion / sailor tie)
      '#F08B38',  // 1 — pumpkin orange  (warm action / MV stripes)
      '#F2B935',  // 2 — wheat gold      (bright hook / spotlight)
      '#4FA76A',  // 3 — emerald green   (object / eyes, young wheat)
      '#5B82B8',  // 4 — beret blue      (cool / wistful)
      '#9A3050',  // 5 — wine plum       (deep / sardonic)
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

  // Position — card sits slightly lower (0.74) to leave room for the wheat
  // field strip above the top edge.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.74, widthFrac: 0.60 },
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

    /* ==== LOCKED PLUMBING ================================================= */
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
    /* CSS vars on BOTH — #ko-lyrics is a body sibling, not a descendant. */
    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-paper:       ${THEME.paper};
      --ko-paper-warm:  ${THEME.paperWarm};
      --ko-hatch:       ${THEME.hatchCoral};

      --ko-coral:       ${THEME.coral};
      --ko-coral-deep:  ${THEME.coralDeep};
      --ko-orange:      ${THEME.orange};
      --ko-gold:        ${THEME.gold};
      --ko-emerald:     ${THEME.emerald};
      --ko-blue:        ${THEME.blueBeret};
      --ko-wine:        ${THEME.winePlum};
      --ko-charcoal:    ${THEME.charcoal};

      --ko-wheat-green: ${THEME.wheatGreen};
      --ko-wheat-gold:  ${THEME.wheatGold};
      --ko-wheat-stem:  ${THEME.wheatStem};

      --ko-font-jp:     ${THEME.fontJP};
      --ko-font-jp-hv:  ${THEME.fontJPHeavy};
      --ko-font-en:     ${THEME.fontEN};
      --ko-font-gloss:  ${THEME.fontGloss};

      /* Runtime vars written by the main tick ~7×/sec. CSS uses these inside
         calc() and color-mix() to drive the bird's travel and the wheat
         ripening without per-frame JS DOM writes. */
      --ko-ripe:     0;    /* 0.0 pale-green → 1.0 golden-amber        */
      --ko-progress: 0;    /* 0.0 → 1.0 horizontal fraction of field   */
      --ko-stem-w: 0px;    /* field width in px — written on resize    */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — SCRAPBOOK CONSTRUCTION-PAPER CUTOUT ===================== */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: ${THEME.cardPadding};
      /* Cream-to-warm-peach vertical gradient (the card body) + a very faint
         diagonal coral hatch on top for paper texture. The hatch is ~7%
         opacity — visible as texture, never fighting the lyrics. */
      background:
        repeating-linear-gradient(
          -45deg,
          transparent 0, transparent 7px,
          var(--ko-hatch) 7px, var(--ko-hatch) 9px
        ),
        linear-gradient(176deg,
          var(--ko-paper) 0%,
          #FFF4DA 62%,
          var(--ko-paper-warm) 100%);
      border: 4px solid var(--ko-cream);
      border-radius: ${THEME.cardRadius};
      /* Three-ring stack: cream border (drawn), coral outer stroke (box-shadow
         0-spread-2.5px) like a pen mark around the paper, then the soft
         ambient drop shadow below. Inset highlight gives the paper a subtle
         top-edge sheen. */
      box-shadow:
        0 0 0 2.5px var(--ko-coral),
        0 16px 42px -12px rgba(70, 35, 20, 0.42),
        inset 0 0 0 1px rgba(255, 255, 255, 0.55),
        inset 0 2px 0 rgba(255, 255, 255, 0.45);
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

    /* ==== WHEAT FIELD STRIP — the signature ==============================
       Sits above the card top edge. A cream ground bar runs its width;
       six wheat ears stand at fixed percentage positions; a chibi Java
       sparrow walks left→right above the ground via --ko-progress. The
       wheat seeds ripen pale-green → golden-amber via color-mix() on
       --ko-ripe through the run. */
    #ko-lyrics .ko-field {
      position: absolute;
      top: -66px;
      left: 38px;
      right: 38px;
      height: 68px;
      pointer-events: none;
      z-index: 3;
      overflow: visible;
    }
    /* The ground line: thin cream bar with a coral undershadow, rounded ends.
       Slight -6px overshoot on each side so the wheat at the edges still
       visually "stand on" the ground when near the field extremes. */
    #ko-lyrics .ko-ground {
      position: absolute;
      bottom: 1px;
      left: -6px;
      right: -6px;
      height: 3px;
      background: var(--ko-cream);
      border-radius: 3px;
      box-shadow:
        0 1.5px 2px rgba(120, 70, 20, 0.35),
        inset 0 -0.5px 0 rgba(228, 89, 76, 0.28);
    }
    /* Each wheat ear: 22×66px absolute container. Left-positioned as a
       percentage of the field width via inline style. translateX(-50%)
       centers each ear on its anchor percent. */
    #ko-lyrics .ko-wheat {
      position: absolute;
      bottom: 0;
      width: 22px;
      height: 66px;
      transform: translateX(-50%);
      pointer-events: none;
    }
    #ko-lyrics .ko-wheat svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
    }
    #ko-lyrics .ko-wheat .ko-wheat-stem-path {
      stroke: var(--ko-wheat-stem);
      stroke-width: 1.4;
      stroke-linecap: round;
      fill: none;
    }
    /* The seed fill is the centerpiece of the ripening effect: color-mix in
       oklab between pale young-wheat green and ripe wheat gold, scaled by
       --ko-ripe (0→1). Transition 2s linear makes the shift a slow softening
       rather than a jump. Cream stroke wraps every seed for the MV's
       sticker-outline look. */
    #ko-lyrics .ko-wheat .ko-wheat-seed {
      fill: color-mix(
        in oklab,
        var(--ko-wheat-green),
        var(--ko-wheat-gold) calc(var(--ko-ripe) * 100%)
      );
      stroke: var(--ko-cream);
      stroke-width: 0.9;
      stroke-linejoin: round;
      transition: fill 2s linear;
      filter: drop-shadow(0 1px 0.8px rgba(120, 70, 10, 0.3));
    }

    /* ==== BIRD — the chibi Java sparrow that walks the field =============
       translateX driven by --ko-progress, same rate-limited pattern as the
       Cherry-Pop cherry (~7 writes/sec with 160ms linear transition so each
       write chains into the next). Additional gentle bob via keyframe gives
       a "walking" feel without breaking the motionless-text rule. */
    #ko-lyrics .ko-bird {
      position: absolute;
      bottom: -2px;
      left: 6px;
      width: 36px;
      height: 36px;
      transform: translateX(
        calc((var(--ko-stem-w, 600px) - 120px) * var(--ko-progress))
      );
      transition: transform 160ms linear;
      will-change: transform;
      pointer-events: none;
      z-index: 4;
    }
    #ko-lyrics .ko-bird-inner {
      width: 100%;
      height: 100%;
      animation: ko-bird-bob 640ms ease-in-out infinite;
      transform-origin: 50% 90%;
    }
    #ko-lyrics .ko-bird svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
      filter: drop-shadow(0 2px 2.5px rgba(40, 25, 10, 0.32));
    }
    @keyframes ko-bird-bob {
      0%, 100% { transform: translateY(0) rotate(-1.5deg); }
      50%      { transform: translateY(-2px) rotate(1.5deg); }
    }

    /* ==== WASHI TAPES — red-and-cream diagonal stripes ===================
       Sits at z-index 5 (above the wheat field at 3 and the bird at 4). At
       the tape positions (top-left and bottom-right corners) the wheat
       field is already inset 38px from the card edges, so the tape doesn't
       overlap the field's wheat ears — they live in different zones. */
    #ko-lyrics .ko-washi {
      position: absolute;
      width: 90px;
      height: 22px;
      /* Barbershop stripes — cream and coral at 38° — echoing her beret
         and striped knee-highs + the MV frame's corner border. */
      background:
        repeating-linear-gradient(
          -38deg,
          var(--ko-cream) 0, var(--ko-cream) 7px,
          var(--ko-coral) 7px, var(--ko-coral) 14px
        );
      opacity: 0.96;
      box-shadow:
        0 2px 6px rgba(0, 0, 0, 0.22),
        inset 0 0 0 1px rgba(255, 255, 255, 0.35);
      z-index: 5;
    }
    #ko-lyrics .ko-washi.tl {
      top: -10px;
      left: -22px;
      transform: rotate(-30deg);
    }
    #ko-lyrics .ko-washi.br {
      bottom: -10px;
      right: -22px;
      transform: rotate(-30deg);
    }

    /* ==== TITLE TAG — coral speech-bubble at top-right =================== */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -22px;
      right: 44px;
      padding: 7px 18px 9px;
      background: var(--ko-coral);
      color: var(--ko-cream);
      font-family: var(--ko-font-jp-hv);
      font-size: 17px;
      font-weight: 400;
      letter-spacing: 0.05em;
      border-radius: 22px;
      border: 3px solid var(--ko-cream);
      transform: rotate(4deg);
      box-shadow:
        0 4px 0 var(--ko-coral-deep),
        0 8px 14px -5px rgba(80, 20, 10, 0.42);
      z-index: 6;
      white-space: nowrap;
    }
    /* Speech-bubble tail — a rotated square punching out the bottom edge. */
    #ko-lyrics .ko-tag::after {
      content: '';
      position: absolute;
      bottom: -9px;
      left: 22px;
      width: 14px;
      height: 14px;
      background: var(--ko-coral);
      border-right: 3px solid var(--ko-cream);
      border-bottom: 3px solid var(--ko-cream);
      border-bottom-right-radius: 4px;
      transform: rotate(45deg);
      z-index: -1;
    }

    /* ==== CREDIT — handwritten Caveat label, bottom-left ================= */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -18px;
      left: 34px;
      padding: 2px 12px 3px;
      background: var(--ko-cream);
      color: var(--ko-coral-deep);
      font-family: var(--ko-font-en);
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.01em;
      border-radius: 6px;
      border: 2px solid var(--ko-coral);
      transform: rotate(-3deg);
      box-shadow: 0 3px 0 var(--ko-coral);
      z-index: 2;
      white-space: nowrap;
    }

    /* ==== LYRICS — triple-outline bubble JP + handwritten EN =============
       The JP treatment is the MV's own title-logo technique translated to
       the web: (1) chunk-color fill via the inline colored spans, (2) thick
       cream text-stroke for the outer outline using paint-order so the
       stroke renders BEHIND the fill, (3) deep-coral hard text-shadow
       offset down-right for the drop-shadow layer beneath. Stacking order
       bottom-up: text-shadow → cream stroke → colored fill. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: var(--ko-coral);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.55em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      -webkit-text-stroke: 4.5px var(--ko-cream);
      paint-order: stroke fill;
      text-shadow:
        3px 4px 0 var(--ko-coral-deep),
        3px 6px 8px rgba(100, 25, 15, 0.35);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — small schoolgirl-handwritten label above each morpheme.
       Stroke reset to 0 so the cream outline doesn't bleed into the tiny
       gloss text. Cream halo via text-shadow for legibility against the
       orange card gradient. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.015em;
      line-height: 1.05;
      padding-bottom: 6px;
      color: var(--ko-charcoal);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.92;
      -webkit-text-stroke: 0;
      paint-order: normal;
      text-shadow:
        0 1px 0 var(--ko-cream),
        0 0 3px rgba(255, 247, 228, 0.85);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Caveat handwritten, charcoal ink on cream halo.
       The color-chunk spans inherit per-chunk color via inline style. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 700;
      color: var(--ko-charcoal);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      text-shadow:
        0 2px 0 rgba(255, 247, 228, 0.7),
        0 0 8px rgba(255, 247, 228, 0.55);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.88);
      font-weight: 600;
    }
    /* Red-pen hairline under the EN line — like a teacher's underline mark. */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 6px;
      margin-top: 3px;
      background:
        linear-gradient(
          90deg,
          transparent 6%,
          rgba(228, 89, 76, 0.50) 50%,
          transparent 94%
        )
        bottom / 100% 2px no-repeat;
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

  // Wheat-ear SVG — one reusable glyph. Vertical stem with a 3-hair tassel
  // at the top and four seed pairs flanking the stem on the way down. Seeds
  // are rotated ellipses; fill and stroke are applied via CSS vars so every
  // ear ripens together via --ko-ripe.
  const wheatEarSvg = `
    <svg class="ko-wheat-unit" viewBox="-12 -34 24 68">
      <path class="ko-wheat-stem-path" d="M 0 -24 L 0 30"/>
      <path class="ko-wheat-stem-path" d="M 0 -24 L -3 -32"/>
      <path class="ko-wheat-stem-path" d="M 0 -24 L 0 -34"/>
      <path class="ko-wheat-stem-path" d="M 0 -24 L 3 -32"/>
      <g class="ko-wheat-seeds">
        <ellipse class="ko-wheat-seed" cx="-3.8" cy="-20" rx="2.6" ry="4.8" transform="rotate(-28 -3.8 -20)"/>
        <ellipse class="ko-wheat-seed" cx="3.8"  cy="-20" rx="2.6" ry="4.8" transform="rotate(28  3.8 -20)"/>
        <ellipse class="ko-wheat-seed" cx="-4.4" cy="-12" rx="2.9" ry="5.3" transform="rotate(-25 -4.4 -12)"/>
        <ellipse class="ko-wheat-seed" cx="4.4"  cy="-12" rx="2.9" ry="5.3" transform="rotate(25  4.4 -12)"/>
        <ellipse class="ko-wheat-seed" cx="-4.4" cy="-3"  rx="2.9" ry="5.3" transform="rotate(-22 -4.4 -3)"/>
        <ellipse class="ko-wheat-seed" cx="4.4"  cy="-3"  rx="2.9" ry="5.3" transform="rotate(22  4.4 -3)"/>
        <ellipse class="ko-wheat-seed" cx="-3.8" cy="6"   rx="2.6" ry="4.8" transform="rotate(-20 -3.8 6)"/>
        <ellipse class="ko-wheat-seed" cx="3.8"  cy="6"   rx="2.6" ry="4.8" transform="rotate(20  3.8 6)"/>
      </g>
    </svg>`;

  // Java sparrow SVG — the MV's mascot species. White body ellipse, black
  // head cap (the species' signature coloration) with a white cheek patch,
  // coral beak and feet (echoing her uniform's red sailor collar/socks).
  // viewBox extends into negative-y so the head sits ABOVE the container
  // top edge (overflow:visible on the container).
  const birdSvg = `
    <svg viewBox="-18 -20 36 38" overflow="visible">
      <ellipse cx="0" cy="4" rx="11" ry="10" fill="#FFFFFF" stroke="${THEME.charcoal}" stroke-width="1.3"/>
      <path d="M -6 2 Q -2 7, 6 4" fill="none" stroke="${THEME.charcoal}" stroke-width="1" stroke-linecap="round"/>
      <path d="M -5 -6 Q 0 -14, 8 -10 Q 11 -4, 5 -1 Q -3 -1, -5 -6 Z" fill="${THEME.charcoal}"/>
      <ellipse cx="2.8" cy="-5" rx="3.4" ry="2.9" fill="#FFFFFF"/>
      <circle cx="3.6" cy="-5.6" r="1.15" fill="#0A0A12"/>
      <circle cx="4"   cy="-6"   r="0.35" fill="#FFFFFF"/>
      <path d="M 9.5 -5 L 14.5 -4 L 9.5 -3 Z" fill="${THEME.coral}" stroke="${THEME.charcoal}" stroke-width="0.5" stroke-linejoin="round"/>
      <path d="M -3 13 L -3 16" stroke="${THEME.coral}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M 3 13 L 3 16" stroke="${THEME.coral}" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;

  // Six wheat ears evenly spaced across the field strip at 8%, 23%, 39%,
  // 57%, 74%, 92% — slightly weighted left of center to balance the title
  // tag's visual weight at top-right.
  const wheatField = [8, 23, 39, 57, 74, 92].map(pct =>
    `<div class="ko-wheat" style="left: ${pct}%">${wheatEarSvg}</div>`
  ).join('');

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-field" id="ko-field">
        <div class="ko-ground"></div>
        ${wheatField}
        <div class="ko-bird" id="ko-bird">
          <div class="ko-bird-inner">${birdSvg}</div>
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
  let lastProgWriteAt = 0;

  // --- Position tick: re-anchor the lyric zone to the video rect. Also
  // writes --ko-stem-w so the bird's translate math knows its travel span.
  // Snap-resets the bird's transition during resize so the bird doesn't
  // animate a slide to its new proportional position. ---
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
      // Bird snap-reset: kill the 160ms transition, update --ko-stem-w,
      // force reflow, restore. Otherwise a fullscreen/theater flip would
      // visibly slide the bird to its new proportional x.
      const bird = document.getElementById('ko-bird');
      if (bird) bird.style.transition = 'none';
      // Field strip is inset 38px on each side (see .ko-field), so the
      // field width = cardW - 76. The bird's travel math uses
      // --ko-stem-w - 120 (bird width 36 + buffers so it never reaches
      // the field edges).
      lyrics.style.setProperty('--ko-stem-w', (cardW - 76) + 'px');
      if (bird) {
        void bird.offsetWidth;
        bird.style.transition = '';
      }
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + bird-walk progress + field ripening ---
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

    // ---- Bird progress + wheat ripening (rate-limited) ----
    // One write every 140ms matches the 160ms linear CSS transition on
    // the bird so motion chains seamlessly at ~7 writes/sec. Running
    // this at RAF rate would be wasteful — the bird moves slowly on a
    // normal-width card, and per-frame precision is invisible.
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        // Ripening ramp: pale for first ~10% (intro), fully ripe by ~92%
        // (so the field sits at full gold through the final chorus).
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
