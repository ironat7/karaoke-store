// ============================================================================
// KARAOKE OVERLAY — DEPARTURE! (戌神ころね × 天音かなた cover)
// ----------------------------------------------------------------------------
// Aesthetic: the MV is the iconic HxH (2011) opening "departure!" — Korone
// (warm earth-bound dog-girl: brown braid, dog ears, red cap, paw-print
// apron) and Kanata (cool celestial angel: silver-cyan hair with pink
// streaks, gold halo, wings, lavender eyes) over a sky-blue + grass world,
// with Lichtenstein pop-art halftone-dot panels (yellow + pink) and MASSIVE
// burned-in italic white kanji typography slanted right with cream halos.
// Rainbow refractions from sunbursts, white double-line corner swooshes,
// sparkle ✦ accents.
//
// The overlay reads as one of those burned-in MV title slides made into a
// lyric card — sky-cyan-to-cream-dawn gradient panel, halftone-dot accents
// in pop-art yellow at NW + SE corners, white double-curve swooshes in the
// other two corners, italic display kanji in deep navy with cream halo.
//
// Signature: a RAINBOW-PAINTING SHOOTING STAR arcs from bottom-left up over
// the card top down to bottom-right. The arc is the song's flight
// trajectory ("departure!" → take-off). The comet head is a glowing sparkle
// that travels left→right along the parabola as time passes; behind it,
// the rainbow paints itself onto the path progressively (stroke-dashoffset
// driven by --ko-progress). At t=0 the arc is empty, the comet sits at the
// "ground" (left endpoint) ready to depart; by song's end the entire
// rainbow is painted, comet rests at "destination" (right endpoint).
// Functional (encodes time) AND thematic (departure = flight, the MV's
// actual rainbow refractions, "spread your angel wings and take to the
// sky" lyric). Endpoints anchored by a tiny dog-paw silhouette (left =
// Korone's earth start) and a small angel-halo ring (right = Kanata's sky
// end) — the duo bookending the journey.
//
// Line changes are deliberately motionless. The card is quietly alive
// through the comet's travel + rainbow paint + empty-state collapse only.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — departure! palette
  // ==========================================================================
  const THEME = {
    trackTag:   'departure!',
    artistTag:  'KORONE × KANATA',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Reggae+One&' +
      'family=Mochiy+Pop+One&' +
      'family=Noto+Sans+JP:wght@500;700;900&' +
      'family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500;1,9..144,600&' +
      'family=Caveat:wght@500;700&' +
      'display=swap',
    fontJP:       '"Reggae One", "Mochiy Pop One", "Noto Sans JP", sans-serif',
    fontJPHeavy:  '"Reggae One", "Noto Sans JP", sans-serif',
    fontEN:       '"Fraunces", Georgia, serif',
    fontGloss:    '"Noto Sans JP", system-ui, sans-serif',
    fontTag:      '"Caveat", cursive',

    // Palette — every hex pulled from MV frames (sky/grass/character/burn-in).
    skyLight:    '#E1F2FD',  // card top — pale sky-cyan dawn
    skyMid:      '#BCE4FB',  // card mid — sky-blue
    cream:       '#FFFCF2',  // card bottom + halo — warm cream
    creamDeep:   '#F4E8C8',  // dawn yellow accent
    sunYellow:   '#FFD23F',  // halftone dots, gold accents (Korone's hat band)
    goldDeep:    '#C77A0E',  // tag border, deeper warm
    coral:       '#FF8B9F',  // accent (Kanata's hair streak / sunset)
    coralDeep:   '#D63E5C',  // EN hairline + warm shadow
    lavender:    '#C8B0FF',  // soft purple (Kanata's eyes)
    mint:        '#95E5C0',  // rainbow accent
    forest:      '#1F8A55',  // grass earth
    skyTeal:     '#0876A8',  // EN text + rainbow blue
    navyInk:     '#1B3B70',  // primary JP text — burned-in title color
    navyDeep:    '#0D2348',  // shadow / deepest

    // Typography — burned-in display kanji feel
    lyricFontSizeJP:     '54px',
    lyricLineHeightJP:   '2.0',
    lyricLetterSpacingJP:'0.03em',
    lyricSkewJP:         '-7deg',  // italic slant matching MV's burned-in kanji
    lyricFontSizeEN:     '26px',
    lyricLineHeightEN:   '1.3',
    lyricLetterSpacingEN:'0.005em',
    glossFontSize:       '18px',
    glossFontWeight:     '700',

    // Card shape
    cardRadius:  '20px',
    cardPadding: '36px 50px 32px',
    cardTilt:    '-1deg',  // very subtle — the MV's burned-in graphics are
                           // mostly axis-aligned, so the card holds steady.

    // chunkColors: 6 slots. All saturated/dark enough to read on the
    // sky-cyan-to-cream gradient. Drawn from the MV: navy (primary, the
    // burned-in title color), warm gold (Korone's earth side), coral red
    // (Kanata's hair / sunset), forest green (grass), lavender (Kanata's
    // angel eyes), sky teal (sky depth).
    chunkColors: [
      '#1B3B70',  // 0 — navy ink (primary / narrator / topic)
      '#C77A0E',  // 1 — gold deep (warm / Korone-side concrete)
      '#D63E5C',  // 2 — coral red (heart / desire / angel kiss)
      '#1F8A55',  // 3 — forest green (earth / step / ground)
      '#6E47C8',  // 4 — lavender deep (angel / dream / smile)
      '#0876A8',  // 5 — sky teal (sky / flight / future)
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

  // Position — sit a touch lower (0.74) than default to leave breathing room
  // for the rainbow-arc + comet that swing above the card top.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.74, widthFrac: 0.62 },
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
    /* CSS vars declared on BOTH #karaoke-root AND #ko-lyrics — #ko-lyrics
       is a body sibling of #karaoke-root, not a descendant, so vars on
       #karaoke-root alone wouldn't cascade to it. */
    #karaoke-root, #ko-lyrics {
      --ko-sky-lt:    ${THEME.skyLight};
      --ko-sky-md:    ${THEME.skyMid};
      --ko-cream:     ${THEME.cream};
      --ko-cream-dp:  ${THEME.creamDeep};
      --ko-sun:       ${THEME.sunYellow};
      --ko-gold:      ${THEME.goldDeep};
      --ko-coral:     ${THEME.coral};
      --ko-coral-dp:  ${THEME.coralDeep};
      --ko-lavender:  ${THEME.lavender};
      --ko-mint:      ${THEME.mint};
      --ko-forest:    ${THEME.forest};
      --ko-sky-teal:  ${THEME.skyTeal};
      --ko-navy:      ${THEME.navyInk};
      --ko-navy-dp:   ${THEME.navyDeep};

      --ko-font-jp:    ${THEME.fontJP};
      --ko-font-jp-hv: ${THEME.fontJPHeavy};
      --ko-font-en:    ${THEME.fontEN};
      --ko-font-gloss: ${THEME.fontGloss};
      --ko-font-tag:   ${THEME.fontTag};

      /* Runtime vars driven from JS (~7×/sec). CSS uses these inside calc()
         to position the comet along the parabolic arc and to derive the
         stroke-dashoffset that paints the rainbow trail behind it. */
      --ko-progress: 0;  /* 0.0 → 1.0 song fraction                       */
      --ko-arc-len: 1100; /* SVG path length in user units (set by JS)    */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — SKY-DAWN GRADIENT PANEL ================================== */
    /* The card reads as a torn sky panel — soft cream paper border like a
       polaroid, sky-cyan to dawn-cream gradient interior, halftone pop-art
       dots in the NW + SE corners. Two thin white double-curve swooshes
       in the NE + SW corners echo the MV's burned-in linework. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: ${THEME.cardPadding};
      background:
        /* Subtle cloud-wisp layer — two soft radial spotlights at upper edges
           that read as cloud highlights catching light from above. */
        radial-gradient(ellipse 70% 50% at 22% 18%, rgba(255,255,255,0.55) 0%, transparent 60%),
        radial-gradient(ellipse 60% 45% at 80% 22%, rgba(255,255,255,0.42) 0%, transparent 65%),
        /* Bottom dawn-warmth glow */
        radial-gradient(ellipse 90% 50% at 50% 100%, rgba(255,210,63,0.18) 0%, transparent 70%),
        /* Base sky-to-cream gradient */
        linear-gradient(170deg,
          ${THEME.skyMid} 0%,
          ${THEME.skyLight} 38%,
          ${THEME.cream} 100%
        );
      border: 3px solid ${THEME.cream};
      border-radius: ${THEME.cardRadius};
      box-shadow:
        /* Inner navy hairline — gives the card the "burned-in" outline of
           the MV's title cards. */
        0 0 0 1.5px ${THEME.navyInk},
        /* Outer cyan glow — like sun catching the card */
        0 0 0 6px rgba(120, 200, 245, 0.35),
        /* Drop shadow */
        0 22px 48px -16px rgba(20, 40, 80, 0.55),
        /* Inner top highlight (paper sheen) */
        inset 0 2px 0 rgba(255, 255, 255, 0.7),
        inset 0 -2px 0 rgba(28, 60, 110, 0.06);
      transform: rotate(${THEME.cardTilt});
      transition: transform 320ms cubic-bezier(.2,.7,.3,1), opacity 380ms;
      isolation: isolate;
      overflow: visible;
    }

    /* Empty-state collapse during instrumental gaps — gentle settle. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardTilt}) scale(0.94);
    }

    /* ==== HALFTONE-DOT POP-ART ACCENTS — NW + SE corners ==================
       Lichtenstein-style Ben-Day dots clipped to a triangular corner via
       a radial-gradient mask. Sun-yellow on sky-cyan reads as the MV's
       pop-art panel overlays. Sized as a small corner triangle, fading
       inward so they don't compete with the lyrics. */
    #ko-lyrics .ko-halftone {
      position: absolute;
      width: 130px;
      height: 90px;
      pointer-events: none;
      z-index: 1;
      background-image:
        radial-gradient(circle, ${THEME.sunYellow} 1.6px, transparent 1.9px);
      background-size: 8px 8px;
      background-position: 0 0;
      opacity: 0.85;
    }
    #ko-lyrics .ko-halftone.tl {
      top: 0; left: 0;
      border-top-left-radius: ${THEME.cardRadius};
      /* Mask: full opacity at NW corner, fading toward inside */
      -webkit-mask: radial-gradient(ellipse 130px 90px at 0% 0%, black 35%, transparent 75%);
      mask: radial-gradient(ellipse 130px 90px at 0% 0%, black 35%, transparent 75%);
    }
    #ko-lyrics .ko-halftone.br {
      bottom: 0; right: 0;
      border-bottom-right-radius: ${THEME.cardRadius};
      background-image:
        radial-gradient(circle, ${THEME.coral} 1.6px, transparent 1.9px);
      -webkit-mask: radial-gradient(ellipse 130px 90px at 100% 100%, black 35%, transparent 75%);
      mask: radial-gradient(ellipse 130px 90px at 100% 100%, black 35%, transparent 75%);
    }

    /* ==== CORNER SWOOSHES — NE + SW =======================================
       Thin white double-curve linework matching the MV's burned-in
       decorative arcs in the corners. Drawn as SVG strokes. */
    #ko-lyrics .ko-swoosh {
      position: absolute;
      width: 64px;
      height: 50px;
      pointer-events: none;
      z-index: 2;
    }
    #ko-lyrics .ko-swoosh.ne { top: 6px;    right: 10px; }
    #ko-lyrics .ko-swoosh.sw { bottom: 6px; left: 10px; transform: rotate(180deg); }
    #ko-lyrics .ko-swoosh svg {
      width: 100%; height: 100%; overflow: visible; display: block;
    }
    #ko-lyrics .ko-swoosh path {
      fill: none;
      stroke: rgba(255, 255, 255, 0.85);
      stroke-width: 2;
      stroke-linecap: round;
      filter: drop-shadow(0 1px 1px rgba(20, 40, 80, 0.18));
    }

    /* ==== SPARKLE ACCENTS — tiny ✦ stars in the gradient field ========== */
    #ko-lyrics .ko-spark {
      position: absolute;
      pointer-events: none;
      color: var(--ko-cream);
      font-size: 14px;
      line-height: 1;
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
      z-index: 2;
      opacity: 0.85;
    }
    #ko-lyrics .ko-spark.s1 { top: 14px; left: 38%; font-size: 11px; }
    #ko-lyrics .ko-spark.s2 { top: 22px; right: 32%; font-size: 16px; }
    #ko-lyrics .ko-spark.s3 { bottom: 16px; left: 28%; font-size: 9px; }
    #ko-lyrics .ko-spark.s4 { bottom: 24px; right: 38%; font-size: 12px; }

    /* ==== RAINBOW-ARC SIGNATURE — the comet's flight ======================
       Container sits ABOVE the card top edge. The arc spans the full card
       width plus a small overshoot on each side so the endpoint anchors
       (paw / halo) sit slightly outside the card border. */
    #ko-lyrics .ko-arc {
      position: absolute;
      top: -64px;
      left: 0;
      right: 0;
      height: 70px;
      pointer-events: none;
      z-index: 5;
      overflow: visible;
    }
    #ko-lyrics .ko-arc svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
    }
    /* Ghost path — faint dotted trajectory hint, always visible. */
    #ko-lyrics .ko-arc-ghost {
      fill: none;
      stroke: rgba(255, 255, 255, 0.45);
      stroke-width: 1.4;
      stroke-linecap: round;
      stroke-dasharray: 1 4;
      filter: drop-shadow(0 0 2px rgba(180, 220, 250, 0.8));
    }
    /* Rainbow path — solid stroke with gradient, painted progressively
       via stroke-dashoffset driven by --ko-progress. The dasharray is set
       to (length, length) so as offset → 0, the path reveals from start. */
    #ko-lyrics .ko-arc-rainbow {
      fill: none;
      stroke: url(#ko-rainbow);
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: var(--ko-arc-len);
      stroke-dashoffset:
        calc((1 - var(--ko-progress)) * var(--ko-arc-len) * 1px);
      transition: stroke-dashoffset 160ms linear;
      filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.7));
    }

    /* The comet head — a glowing star riding the parabola. Position
       computed from --ko-progress via parametric formulas:
         x: linear from left to right edge
         y: parabolic arch — peaks at progress=0.5
       The container is exactly 70px tall and the path peaks at viewBox
       y=4 (mapped to container y=10) and bottoms at viewBox y=26 (mapped
       to container y=65). So peak height = 55px, vertical span:
         y_container(p) = 65 - 55 * (4*p - 4*p²) - 9   // -9 centers comet
       The comet is 18px tall so subtract 9px for vertical centering. */
    #ko-lyrics .ko-comet {
      position: absolute;
      width: 18px;
      height: 18px;
      pointer-events: none;
      z-index: 6;
      will-change: left, top;
      transition: left 160ms linear, top 160ms linear;
      left: calc(var(--ko-progress) * (100% - 18px));
      top: calc(
        56px - 55px * (4 * var(--ko-progress) - 4 * var(--ko-progress) * var(--ko-progress))
      );
    }
    #ko-lyrics .ko-comet-core {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background:
        radial-gradient(circle at 50% 50%,
          #FFFFFF 0%,
          #FFF8DD 35%,
          rgba(255, 210, 63, 0.85) 60%,
          rgba(255, 210, 63, 0) 100%
        );
      box-shadow:
        0 0 8px 2px rgba(255, 255, 255, 0.85),
        0 0 18px 5px rgba(255, 220, 120, 0.6),
        0 0 32px 8px rgba(255, 180, 80, 0.35);
    }
    /* Sparkle rays — four thin lines forming a ✦ around the core. */
    #ko-lyrics .ko-comet-rays {
      position: absolute;
      inset: -8px;
      pointer-events: none;
    }
    #ko-lyrics .ko-comet-rays::before,
    #ko-lyrics .ko-comet-rays::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg,
          transparent 0%, transparent 40%,
          rgba(255, 255, 255, 0.9) 50%,
          transparent 60%, transparent 100%) center / 100% 1.5px no-repeat,
        linear-gradient(0deg,
          transparent 0%, transparent 40%,
          rgba(255, 255, 255, 0.9) 50%,
          transparent 60%, transparent 100%) center / 1.5px 100% no-repeat;
      filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.9));
    }
    #ko-lyrics .ko-comet-rays::after { transform: rotate(45deg); opacity: 0.7; }

    /* ==== ARC ENDPOINT ANCHORS — paw (left) + halo (right) ================
       The duo bookending the journey. Both sit at the BASE of the arc's
       endpoints, anchored to the card's top edge so they read as the
       "starting point" (Korone's earth, paw print) and "destination"
       (Kanata's sky, halo). They're tiny — never compete with the lyrics. */
    #ko-lyrics .ko-anchor {
      position: absolute;
      top: -10px;
      width: 22px;
      height: 22px;
      pointer-events: none;
      z-index: 4;
      filter: drop-shadow(0 1px 2px rgba(20, 40, 80, 0.35));
    }
    #ko-lyrics .ko-anchor.paw  { left: -8px; }
    #ko-lyrics .ko-anchor.halo { right: -8px; }
    #ko-lyrics .ko-anchor svg { width: 100%; height: 100%; display: block; overflow: visible; }
    #ko-lyrics .ko-anchor .pad-pad { fill: ${THEME.coralDeep}; }
    #ko-lyrics .ko-anchor .pad-toe { fill: ${THEME.coral}; }
    #ko-lyrics .ko-anchor .halo-ring {
      fill: none;
      stroke: ${THEME.sunYellow};
      stroke-width: 3.5;
    }
    #ko-lyrics .ko-anchor .halo-glow {
      fill: none;
      stroke: rgba(255, 210, 63, 0.45);
      stroke-width: 6;
    }

    /* ==== TITLE TAG — top-right, gold cursive italic ====================== */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -16px;
      right: 24px;
      padding: 4px 16px 5px;
      background: var(--ko-cream);
      color: var(--ko-gold);
      font-family: var(--ko-font-tag);
      font-size: 26px;
      font-weight: 700;
      font-style: italic;
      letter-spacing: 0.01em;
      border-radius: 4px;
      border: 2px solid var(--ko-gold);
      transform: rotate(4deg);
      box-shadow:
        0 3px 0 0 var(--ko-gold),
        0 5px 10px -3px rgba(40, 20, 0, 0.35);
      z-index: 7;
      white-space: nowrap;
    }

    /* ==== ARTIST CREDIT — bottom-left small white chip ==================== */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -12px;
      left: 22px;
      padding: 3px 9px 4px;
      background: var(--ko-navy);
      color: var(--ko-cream);
      font-family: var(--ko-font-en);
      font-size: 10px;
      font-weight: 600;
      font-style: italic;
      letter-spacing: 0.16em;
      border-radius: 3px;
      transform: rotate(-2deg);
      box-shadow: 0 2px 0 0 var(--ko-navy-dp);
      z-index: 7;
    }

    /* ==== LYRICS — burned-in italic kanji + serif italic EN ===============
       JP line uses a heavy display face (Reggae One) skewed -7deg to mimic
       the MV's burned-in italic title kanji. Color: deep navy (the same
       hue the MV uses for its main outline ink), with a cream halo + soft
       drop shadow that gives it the "punched-into-sky" look. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: var(--ko-navy);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.5em;
      min-height: 1em;
      position: relative;
      z-index: 3;
      order: 1;
      transform: skewX(${THEME.lyricSkewJP});
      text-shadow:
        /* Cream halo — multi-layer offset to mimic the MV's burned-in
           letters which sit on a soft cream stroke. */
        2px 0 0 ${THEME.cream},
        -2px 0 0 ${THEME.cream},
        0 2px 0 ${THEME.cream},
        0 -2px 0 ${THEME.cream},
        1.5px 1.5px 0 ${THEME.cream},
        -1.5px 1.5px 0 ${THEME.cream},
        1.5px -1.5px 0 ${THEME.cream},
        -1.5px -1.5px 0 ${THEME.cream},
        /* Soft outer glow */
        0 0 18px rgba(255, 252, 242, 0.65),
        /* Drop shadow */
        2px 4px 0 rgba(20, 40, 80, 0.18);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — small italic label above each morpheme. Skew inverted to
       counter the JP line's skew, so gloss labels read upright. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: var(--ko-sky-teal);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.95;
      transform: skewX(7deg);
      text-shadow:
        1px 0 0 ${THEME.cream},
        -1px 0 0 ${THEME.cream},
        0 1px 0 ${THEME.cream},
        0 -1px 0 ${THEME.cream},
        0 0 6px rgba(255, 252, 242, 0.7);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Fraunces italic, sky-teal on cream-halo, with a thin
       coral hairline below. Reads as the published-subtitle voice. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 500;
      font-style: italic;
      color: var(--ko-sky-teal);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 3;
      order: 2;
      text-shadow:
        1px 1px 0 ${THEME.cream},
        -1px 1px 0 ${THEME.cream},
        1px -1px 0 ${THEME.cream},
        -1px -1px 0 ${THEME.cream},
        0 0 10px rgba(255, 252, 242, 0.55);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.92);
      font-weight: 600;
    }
    /* Thin coral hairline under the EN line. */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 4px;
      margin-top: 4px;
      background:
        linear-gradient(90deg,
          transparent 8%,
          rgba(214, 62, 92, 0.4) 30%,
          rgba(255, 210, 63, 0.6) 50%,
          rgba(214, 62, 92, 0.4) 70%,
          transparent 92%
        ) bottom / 100% 1.5px no-repeat;
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

  // Rainbow-arc SVG. Two paths share the same d= so the comet's parabolic
  // calc() formula matches both. The viewBox is 0 0 100 30 stretched via
  // preserveAspectRatio="none" — endpoints at viewBox y=26 (mapped to
  // container y ≈ 60.6 in a 70px tall container) and peak at y=4 (mapped
  // to container y ≈ 9.3). The comet's CSS uses approximations of these.
  // The rainbow gradient flows along the path from red → violet.
  const arcSvg = `
    <svg viewBox="0 0 100 30" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ko-rainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0"    stop-color="${THEME.coralDeep}"/>
          <stop offset="0.18" stop-color="${THEME.goldDeep}"/>
          <stop offset="0.36" stop-color="${THEME.sunYellow}"/>
          <stop offset="0.54" stop-color="${THEME.forest}"/>
          <stop offset="0.72" stop-color="${THEME.skyTeal}"/>
          <stop offset="0.90" stop-color="${THEME.lavender}"/>
          <stop offset="1"    stop-color="#9C7BE0"/>
        </linearGradient>
      </defs>
      <path class="ko-arc-ghost"   id="ko-arc-ghost-path"
            d="M 1 26 Q 50 -6 99 26"
            vector-effect="non-scaling-stroke"/>
      <path class="ko-arc-rainbow" id="ko-arc-rainbow-path"
            d="M 1 26 Q 50 -6 99 26"
            vector-effect="non-scaling-stroke"/>
    </svg>`;

  // Comet — glowing core + sparkle rays.
  const cometDom = `
    <div class="ko-comet" id="ko-comet">
      <div class="ko-comet-rays"></div>
      <div class="ko-comet-core"></div>
    </div>`;

  // Corner swooshes — thin double-curve white linework.
  const swooshSvg = `
    <svg viewBox="0 0 64 50" preserveAspectRatio="xMidYMid meet">
      <path d="M 4 30 Q 18 8 56 6"/>
      <path d="M 10 42 Q 22 22 58 18"/>
    </svg>`;

  // Paw anchor (left) — Korone's earth start.
  const pawSvg = `
    <svg viewBox="0 0 22 22">
      <ellipse class="pad-pad" cx="11" cy="14" rx="6" ry="5"/>
      <ellipse class="pad-toe" cx="4"  cy="7"  rx="2.2" ry="2.6"/>
      <ellipse class="pad-toe" cx="9"  cy="4"  rx="2.2" ry="2.6"/>
      <ellipse class="pad-toe" cx="14" cy="4"  rx="2.2" ry="2.6"/>
      <ellipse class="pad-toe" cx="19" cy="7"  rx="2.2" ry="2.6"/>
    </svg>`;

  // Halo anchor (right) — Kanata's sky destination. A gold ring with a
  // soft outer glow ring beneath it.
  const haloSvg = `
    <svg viewBox="0 0 22 22">
      <ellipse class="halo-glow" cx="11" cy="11" rx="8.5" ry="3"/>
      <ellipse class="halo-ring" cx="11" cy="11" rx="7.5" ry="2.5"/>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-arc" id="ko-arc">
        ${arcSvg}
        ${cometDom}
      </div>
      <div class="ko-anchor paw">${pawSvg}</div>
      <div class="ko-anchor halo">${haloSvg}</div>
      <div class="ko-halftone tl"></div>
      <div class="ko-halftone br"></div>
      <div class="ko-swoosh ne">${swooshSvg}</div>
      <div class="ko-swoosh sw">${swooshSvg}</div>
      <span class="ko-spark s1">✦</span>
      <span class="ko-spark s2">✦</span>
      <span class="ko-spark s3">✦</span>
      <span class="ko-spark s4">✦</span>
      <div class="ko-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // Measure the rainbow path length once it renders, then write
  // --ko-arc-len so stroke-dashoffset math has a real number to work
  // with. The default in the CSS (1100) is a fallback if measurement
  // fails. We measure after a microtask so the SVG is in the DOM.
  Promise.resolve().then(() => {
    const p = document.getElementById('ko-arc-rainbow-path');
    if (p && typeof p.getTotalLength === 'function') {
      try {
        const len = p.getTotalLength();
        if (len > 0) {
          lyrics.style.setProperty('--ko-arc-len', len.toFixed(2));
        }
      } catch {}
    }
  });

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
      // Resize snap: kill the comet's transition before the implicit
      // width change cascades through the calc(left) formula, otherwise
      // the comet animates to its new horizontal position on every
      // fullscreen toggle. Force reflow, restore.
      const comet = document.getElementById('ko-comet');
      if (comet) {
        comet.style.transition = 'none';
        void comet.offsetWidth;
        comet.style.transition = '';
      }
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + comet progress ---
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

    // ---- Comet progress update (rate-limited) ----
    // Write at most every 140ms. CSS transitions on .ko-comet (left, top)
    // and .ko-arc-rainbow (stroke-dashoffset) are 160ms — each write's
    // transition chains seamlessly into the next.
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        lyrics.style.setProperty('--ko-progress', progFrac.toFixed(4));
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
