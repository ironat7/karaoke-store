// ============================================================================
// KARAOKE OVERLAY — ハニーシトロン / Honey Citron (FUWAMOCO cover)
// ----------------------------------------------------------------------------
// MV reads as a soft pink-blue bisected watercolor illustration: left half is
// Fuwawa's world (pink hairband, rose wash, cartoon band-aid hair clip), right
// half is Mococo's (blue hairband, powder-blue wash, band-aid clip). Down the
// middle they meet at a cream seam. The MV's recurring ornament is a thin
// line-art citrus slice, cross-sectioned — pink wedges on the left half of
// the slice, blue wedges on the right — and the letterspaced lowercase tag
// "honey citron" sits above and below every burned-in lyric frame.
//
// Signature: an actual citrus slice floats above the card, 12-wedged. As the
// song plays, a honey-amber conic sweep fills the slice clockwise from 12
// o'clock — mix-blend-mode:multiply tints each pink/blue wedge gold as the
// sweep passes. A bright honey dot orbits the rim marking "now." By song end,
// every wedge is honeyed — first love ripening into Honey Citron sweetness,
// which IS the song's metaphor. The metaphor encodes time AND the twin split
// simultaneously (left-side wedges = Fuwawa; right-side = Mococo).
// Secondary: pink + blue cartoon band-aids pin the card corners — directly
// from the MV, where both twins wear band-aid hair clips. The song's "it
// hurts a little" (ちょっと切ないくらい) refrain makes the band-aid a natural
// emotional ornament, not just a cosmetic quote.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Honey Citron palette
  // ==========================================================================
  const THEME = {
    trackTag:   'honey citron',
    artistTag:  'FUWAMOCO cover',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Zen+Maru+Gothic:wght@500;700;900&' +
      'family=Quicksand:wght@500;600;700&' +
      'family=Cormorant+Garamond:ital,wght@1,400;1,500&' +
      'display=swap',
    fontJP:      '"Zen Maru Gothic", system-ui, sans-serif',
    fontEN:      '"Quicksand", system-ui, sans-serif',
    fontGloss:   '"Zen Maru Gothic", system-ui, sans-serif',
    fontTag:     '"Cormorant Garamond", serif',

    // Palette pulled from MV frames. Left-side pinks match Fuwawa's hairband
    // and blush; right-side blues match Mococo's hairband and powder wash;
    // cream bridges the split; wine is the shared text color that reads on
    // both halves. Honey amber is the citron payoff — the color the slice
    // turns into over the course of the song.
    cardPinkLight:   '#FFE3EC',  // Fuwawa soft blush wash
    cardPinkMid:     '#F9C3D1',  // Fuwawa hairband pink (mid depth)
    cardBlueLight:   '#DDEAF6',  // Mococo powder blue wash
    cardBlueMid:     '#B5D0E8',  // Mococo hairband blue (mid depth)
    cream:           '#FFF3E4',  // warm cream bridge — the seam
    deepWine:        '#6A2C42',  // text color, readable on both halves
    honey:           '#E9A23F',  // the citron's ripened amber
    honeyDeep:       '#A26310',  // honey shadow / deep tone
    honeyBright:     '#FFC56A',  // leading-edge dot
    pith:            '#C88F5C',  // tanned citrus rind
    pithPale:        '#EDD1B2',  // rind inner
    bandaidPink:     '#F8BACB',  // Fuwawa band-aid body
    bandaidPinkDeep: '#CE7892',  // Fuwawa band-aid deep
    bandaidBlue:     '#A9CCEC',  // Mococo band-aid body
    bandaidBlueDeep: '#4E7FB3',  // Mococo band-aid deep
    leafGreen:       '#6C8A40',  // citrus sprig leaf

    // Typography
    lyricFontSizeJP:     '50px',
    lyricLineHeightJP:   '1.9',
    lyricLetterSpacingJP:'0.05em',
    lyricFontSizeEN:     '25px',
    lyricLineHeightEN:   '1.3',
    lyricLetterSpacingEN:'0.03em',
    glossFontSize:       '16px',
    glossFontWeight:     '500',

    // Card shape
    cardRadius:  '22px',
    cardPadding: '38px 50px 32px',
    cardTilt:    '0deg',

    // chunkColors — 6 slots pulled from the MV palette, selected for
    // legibility on both the pink and blue halves of the card:
    chunkColors: [
      '#8E3B5C',  // 0 — deep wine rose (primary / narrator voice, Fuwawa)
      '#3E5E9E',  // 1 — deep ink blue ("you" / desire, Mococo)
      '#A36710',  // 2 — honey amber (central verbs / the citron itself)
      '#6B4382',  // 3 — plum violet (emotional bridge / overlap)
      '#5C8241',  // 4 — leaf olive (breath / still states / pause)
      '#C04566',  // 5 — cherry red (exclamation / heart / refrain)
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

  // Position — slightly lower (0.82) to sit below MV's burned-in middle text
  // zones, wider (0.64) to give the split-card its full presence.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.82, widthFrac: 0.64 },
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
    /* CSS vars declared on BOTH #karaoke-root AND #ko-lyrics — #ko-lyrics
       is a body sibling of #karaoke-root, not a descendant, so vars on
       #karaoke-root alone wouldn't cascade to it. */
    #karaoke-root, #ko-lyrics {
      --ko-pink-lt:  ${THEME.cardPinkLight};
      --ko-pink-md:  ${THEME.cardPinkMid};
      --ko-blue-lt:  ${THEME.cardBlueLight};
      --ko-blue-md:  ${THEME.cardBlueMid};
      --ko-cream:    ${THEME.cream};
      --ko-wine:     ${THEME.deepWine};
      --ko-honey:    ${THEME.honey};
      --ko-honey-dp: ${THEME.honeyDeep};
      --ko-honey-br: ${THEME.honeyBright};
      --ko-pith:     ${THEME.pith};
      --ko-pith-pl:  ${THEME.pithPale};
      --ko-leaf:     ${THEME.leafGreen};
      --ko-ba-pk:    ${THEME.bandaidPink};
      --ko-ba-pk-dp: ${THEME.bandaidPinkDeep};
      --ko-ba-bl:    ${THEME.bandaidBlue};
      --ko-ba-bl-dp: ${THEME.bandaidBlueDeep};

      --ko-font-jp:    ${THEME.fontJP};
      --ko-font-en:    ${THEME.fontEN};
      --ko-font-gloss: ${THEME.fontGloss};
      --ko-font-tag:   ${THEME.fontTag};

      /* Runtime vars written by the main tick ~7×/sec. */
      --ko-progress: 0;  /* 0.0 → 1.0 — drives the citrus honey sweep */
      --ko-ripe:     0;  /* 0.0 → 1.0 — drives ripening saturation    */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — PINK/BLUE SPLIT WITH CREAM SEAM =========================
       The central structural read of the MV is its pink-left / blue-right
       bisection (Fuwawa's side / Mococo's side). The card IS that split,
       angled slightly off-vertical (105°) so the seam runs down a touch
       toward the right — echoing how the MV's bisection often leans
       rather than dividing exactly 50/50. Cream warmth bleeds across the
       seam so the transition reads as shared ground, not a hard line. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: ${THEME.cardPadding};
      background:
        /* Top highlight wash — warm catch of light along the card top */
        radial-gradient(ellipse 140% 55% at 50% -10%,
          rgba(255, 243, 228, 0.5), transparent 65%),
        /* Faint pink halftone cloud at bottom-left */
        radial-gradient(circle at 18% 82%,
          rgba(241, 149, 179, 0.16) 0%, transparent 38%),
        /* Faint blue halftone cloud at top-right */
        radial-gradient(circle at 82% 18%,
          rgba(128, 170, 210, 0.16) 0%, transparent 38%),
        /* Main split gradient — pink left, cream seam, blue right */
        linear-gradient(103deg,
          var(--ko-pink-lt)  0%,
          var(--ko-pink-md) 28%,
          var(--ko-cream)   48% 52%,
          var(--ko-blue-md) 72%,
          var(--ko-blue-lt) 100%);
      border-radius: ${THEME.cardRadius};
      box-shadow:
        /* Double outline: cream inner (3px) + wine rose outer (1.5px) —
           matches the MV's double-bordered lyric frames. */
        0 0 0 2.5px var(--ko-cream),
        0 0 0 4px rgba(106, 44, 66, 0.55),
        0 18px 38px -14px rgba(70, 30, 55, 0.42),
        inset 0 0 0 1px rgba(255, 255, 255, 0.4);
      transform: rotate(${THEME.cardTilt});
      transition: transform 320ms cubic-bezier(.2,.7,.3,1), opacity 380ms;
      isolation: isolate;
      overflow: visible;
    }

    /* Empty-state — soft fade during instrumental gaps. No rotation change
       (card is already axis-aligned); just fade + slight scale settle. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardTilt}) scale(0.94);
    }

    /* Thin diagonal seam stroke — catches light at the pink/blue junction,
       reading as the boundary between the twins' sides. Set at 50% width,
       wrapped in the card and clipped by overflow:visible/hidden on .ko-slot
       via isolation. */
    #ko-lyrics .ko-seam {
      position: absolute;
      top: 12%; bottom: 12%;
      left: 50%;
      width: 1px;
      transform: translateX(-0.5px) rotate(3deg);
      background: linear-gradient(to bottom,
        transparent,
        rgba(255, 243, 228, 0.75) 40%,
        rgba(255, 243, 228, 0.75) 60%,
        transparent);
      pointer-events: none;
      z-index: 1;
    }

    /* ==== SIGNATURE — HONEY-RIPENING CITRUS SLICE ========================
       12-wedge citron floating above the card's top edge. Left 6 wedges
       are pink juice (Fuwawa), right 6 are blue juice (Mococo). A honey
       conic-gradient overlay sweeps clockwise from 12 o'clock as the song
       plays, tinting wedges gold via mix-blend-mode:multiply. A bright
       honey dot orbits the rim marking current time. By song end the
       entire slice is honey-saturated — first love ripened into Honey
       Citron sweetness, which is LITERALLY the song's metaphor. Encodes
       time AND the twin-split simultaneously. */
    #ko-lyrics .ko-citron {
      position: absolute;
      top: -66px;
      left: 50%;
      width: 100px;
      height: 100px;
      transform: translateX(-50%) rotate(-5deg);
      pointer-events: none;
      z-index: 3;
      filter: drop-shadow(0 6px 12px rgba(100, 50, 70, 0.28));
    }
    #ko-lyrics .ko-citron-svg {
      width: 100%; height: 100%;
      display: block;
    }
    /* Honey sweep — conic gradient mix-blend-mode:multiply tints the
       pink/blue wedges amber as progress advances. Rate-limited CSS var
       write from the main tick; no transition here — let each ~140ms
       write land instantly. Transitioning conic-gradient colors is not
       well-supported across browsers and can produce staircase artifacts. */
    #ko-lyrics .ko-citron-honey {
      position: absolute;
      inset: 8px;
      border-radius: 50%;
      background: conic-gradient(from -90deg,
        var(--ko-honey)    0deg,
        var(--ko-honey-dp) calc(var(--ko-progress) * 360deg - 2deg),
        transparent        calc(var(--ko-progress) * 360deg));
      mix-blend-mode: multiply;
      opacity: 0.78;
      pointer-events: none;
    }
    /* Leading-edge dot — bright honey dot orbits the inner rim at the
       current progress angle. transform-origin is the dot's own center
       (3px 3px, since the dot is 6×6 and margin: -3px); rotate first so
       the dot pivots around card center, then translateY pushes it to
       the ring radius. */
    #ko-lyrics .ko-citron-head {
      position: absolute;
      left: 50%; top: 50%;
      width: 7px; height: 7px;
      margin: -3.5px 0 0 -3.5px;
      border-radius: 50%;
      background: var(--ko-honey-br);
      box-shadow:
        0 0 8px var(--ko-honey-br),
        0 0 2px #fff;
      transform:
        rotate(calc(var(--ko-progress) * 360deg))
        translateY(-38px);
      transform-origin: 3.5px 3.5px;
      transition: transform 160ms linear;
      pointer-events: none;
      z-index: 4;
    }
    /* Leaf sprig at the slice's 12 o'clock — a tiny line-art leaf that
       marks the "top" of the citron and anchors it botanically. */
    #ko-lyrics .ko-citron-leaf {
      position: absolute;
      left: 50%;
      top: -8px;
      width: 28px; height: 20px;
      transform: translateX(-50%) rotate(-10deg);
      pointer-events: none;
      z-index: 5;
    }
    #ko-lyrics .ko-citron-leaf svg { width: 100%; height: 100%; display: block; }

    /* ==== BAND-AID CORNER STICKERS — pink (Fuwa) + blue (Moco) ===========
       Both twins in the MV wear cartoon band-aid hair clips. These corner
       stickers quote that detail directly, AND the song's "ちょっと切ないくらい"
       ("just aching enough to hurt") makes the band-aid an emotional fit
       too — gentle bandages over tender first-love hurts.
       z-index 4 > card's natural stack, so they read as pinned on top. */
    #ko-lyrics .ko-bandaid {
      position: absolute;
      width: 86px; height: 30px;
      z-index: 4;
      filter: drop-shadow(0 2px 4px rgba(40, 15, 30, 0.24));
      pointer-events: none;
    }
    #ko-lyrics .ko-bandaid svg { width: 100%; height: 100%; display: block; }
    #ko-lyrics .ko-bandaid.tl {
      top: -14px;
      left: -22px;
      transform: rotate(-22deg);
    }
    #ko-lyrics .ko-bandaid.br {
      bottom: -14px;
      right: -22px;
      transform: rotate(-22deg);
    }

    /* ==== "honey citron" WORDMARK — the MV's typographic signature ======
       The MV stamps a small letterspaced lowercase "honey citron" above
       and below its burned-in lyric frames. This tag is a direct quote —
       same thin italic serif, same tracking, same horizontal rule flanks.
       Positioned above the card so the card reads as a sibling of the
       MV's own lyric frames. */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      font-family: var(--ko-font-tag);
      font-size: 13px;
      font-style: italic;
      font-weight: 400;
      letter-spacing: 0.54em;
      text-transform: lowercase;
      color: var(--ko-wine);
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.75);
      padding-left: 0.54em;
      opacity: 0.82;
      white-space: nowrap;
      z-index: 2;
    }
    #ko-lyrics .ko-tag::before,
    #ko-lyrics .ko-tag::after {
      content: '';
      display: inline-block;
      width: 18px; height: 1px;
      background: var(--ko-wine);
      vertical-align: middle;
      opacity: 0.45;
      margin: 0 9px;
    }

    /* ==== ARTIST CREDIT — bottom-right sticker pill ===================== */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -10px;
      right: 32px;
      padding: 3px 11px 3px;
      background: var(--ko-cream);
      color: var(--ko-wine);
      font-family: var(--ko-font-en);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      border: 1.4px solid var(--ko-wine);
      border-radius: 9px;
      transform: rotate(-2deg);
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.14);
      z-index: 5;
    }

    /* ==== LYRICS — Zen Maru Gothic JP, Quicksand italic EN ============== */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: var(--ko-wine);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.5em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      text-shadow:
        0 2px 0 rgba(255, 243, 228, 0.6),
        0 0 14px rgba(255, 243, 228, 0.5);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — small wine-tone label above each morpheme. Opacity 0.78
       so it reads as supporting information, not competing for attention. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.015em;
      line-height: 1.1;
      padding-bottom: 3px;
      color: var(--ko-wine);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.78;
      text-shadow: 0 1px 0 rgba(255, 243, 228, 0.7);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Quicksand italic, wine-rose. Italic matches the MV's
       burned-in "honey citron" wordmark style, tying the EN translation
       visually to the MV's own typography. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 600;
      color: var(--ko-wine);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      font-style: italic;
      text-shadow:
        0 2px 0 rgba(255, 243, 228, 0.6),
        0 0 10px rgba(255, 243, 228, 0.45);
      opacity: 0.94;
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.9);
      font-weight: 500;
    }
    /* Thin honey hairline under the EN line — picks up the amber accent
       of the citron above the card, tying the vertical composition. */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 5px;
      margin-top: 3px;
      background:
        linear-gradient(90deg,
          transparent 8%,
          rgba(162, 99, 16, 0.38) 50%,
          transparent 92%)
        bottom / 100% 1.4px no-repeat;
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

  // Citrus slice SVG — 12-wedge cross-section. Left half fills with pink
  // juice (Fuwawa's side), right half with blue juice (Mococo's). Wedge
  // dividers are white line-art matching the MV's burned-in citrus graphics.
  // Inner center seed dot caps the radial lines.
  const citrusSvg = `
    <svg class="ko-citron-svg" viewBox="0 0 100 100">
      <!-- Outer rind shadow -->
      <circle cx="50" cy="50" r="48.5" fill="var(--ko-pith)" opacity="0.35"/>
      <!-- Rind -->
      <circle cx="50" cy="50" r="47" fill="none" stroke="var(--ko-pith)" stroke-width="2"/>
      <!-- Pith inner -->
      <circle cx="50" cy="50" r="45" fill="var(--ko-pith-pl)"/>
      <!-- Albedo (cream) -->
      <circle cx="50" cy="50" r="43" fill="var(--ko-cream)"/>
      <!-- Pink juice (left half) -->
      <path d="M 50 10 A 40 40 0 0 0 50 90 L 50 50 Z" fill="var(--ko-pink-md)" opacity="0.92"/>
      <!-- Blue juice (right half) -->
      <path d="M 50 10 A 40 40 0 0 1 50 90 L 50 50 Z" fill="var(--ko-blue-md)" opacity="0.92"/>
      <!-- 12 wedge dividers — one every 30° from center to edge -->
      <g stroke="var(--ko-cream)" stroke-width="1.3" stroke-linecap="round" opacity="0.88">
        <line x1="50" y1="50" x2="50"    y2="10"/>
        <line x1="50" y1="50" x2="70"    y2="15.36"/>
        <line x1="50" y1="50" x2="84.64" y2="30"/>
        <line x1="50" y1="50" x2="90"    y2="50"/>
        <line x1="50" y1="50" x2="84.64" y2="70"/>
        <line x1="50" y1="50" x2="70"    y2="84.64"/>
        <line x1="50" y1="50" x2="50"    y2="90"/>
        <line x1="50" y1="50" x2="30"    y2="84.64"/>
        <line x1="50" y1="50" x2="15.36" y2="70"/>
        <line x1="50" y1="50" x2="10"    y2="50"/>
        <line x1="50" y1="50" x2="15.36" y2="30"/>
        <line x1="50" y1="50" x2="30"    y2="15.36"/>
      </g>
      <!-- Center seed dot -->
      <circle cx="50" cy="50" r="3.2" fill="var(--ko-cream)" stroke="var(--ko-pith)" stroke-width="0.9"/>
    </svg>`;

  // Leaf sprig SVG — two small leaves crowning the citron at 12 o'clock.
  const leafSvg = `
    <svg viewBox="0 0 28 20">
      <path d="M 6 16 Q 10 3, 22 5 Q 20 18, 6 16 Z"
            fill="var(--ko-leaf)" opacity="0.88"/>
      <path d="M 7 15 Q 12 8, 20 8"
            fill="none" stroke="rgba(40,70,30,0.5)" stroke-width="0.7"/>
      <path d="M 3 8 Q 5 3, 10 2"
            fill="none" stroke="var(--ko-leaf)" stroke-width="1.6"
            stroke-linecap="round" opacity="0.65"/>
    </svg>`;

  // Band-aid SVG — parameterized by side class (pink/blue) so the two
  // corner stickers share geometry but differ in color. Body + gauze
  // center + dotted gauze pattern + stitch lines at each end.
  const bandaidSvg = (side) => {
    const base = side === 'pk' ? 'var(--ko-ba-pk)'    : 'var(--ko-ba-bl)';
    const deep = side === 'pk' ? 'var(--ko-ba-pk-dp)' : 'var(--ko-ba-bl-dp)';
    return `
      <svg viewBox="0 0 60 22">
        <rect x="1.5" y="3" width="57" height="16" rx="8"
              fill="${base}"/>
        <rect x="1.5" y="3" width="57" height="16" rx="8"
              fill="none" stroke="${deep}" stroke-width="0.7" opacity="0.55"/>
        <rect x="20" y="5.5" width="20" height="11" rx="1.2"
              fill="rgba(255,255,255,0.68)"/>
        <g fill="${deep}" opacity="0.6">
          <circle cx="24" cy="9"  r="0.9"/><circle cx="30" cy="9"  r="0.9"/><circle cx="36" cy="9"  r="0.9"/>
          <circle cx="24" cy="13" r="0.9"/><circle cx="30" cy="13" r="0.9"/><circle cx="36" cy="13" r="0.9"/>
        </g>
        <g stroke="${deep}" stroke-width="0.6" opacity="0.5" stroke-linecap="round">
          <line x1="7"  y1="6.5" x2="7"  y2="15.5"/>
          <line x1="11" y1="6.5" x2="11" y2="15.5"/>
          <line x1="49" y1="6.5" x2="49" y2="15.5"/>
          <line x1="53" y1="6.5" x2="53" y2="15.5"/>
        </g>
      </svg>`;
  };

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-seam"></div>
      <div class="ko-citron">
        ${citrusSvg}
        <div class="ko-citron-honey"></div>
        <div class="ko-citron-head"></div>
        <div class="ko-citron-leaf">${leafSvg}</div>
      </div>
      <div class="ko-bandaid tl">${bandaidSvg('pk')}</div>
      <div class="ko-bandaid br">${bandaidSvg('bl')}</div>
      <div class="ko-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + LRCLib fetching (in-browser fallback) ---
  // Not exercised for this bundle — parsed_lyrics.json ships hand-synced
  // timings under synthetic lrcId 9999001. The bundle bootstrap populates
  // window.__parsedLyrics[9999001] before this script runs, so the fetch
  // below is guarded by the `__parsedLyrics[id] ? return` early-bail.
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

  // --- Main tick: update lyric text + citrus progress ---
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

    // ---- Citrus progress update (rate-limited to ~7/sec) ----
    // --ko-progress drives the honey conic sweep; --ko-ripe is available
    // for future use (saturation ramp). Ripening delay: honey doesn't start
    // until the first verse kicks in at ~14s (= ~6% of 219s), and tops out
    // by ~92% so the final honey saturation reads clearly during the outro.
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        const ripe = Math.max(0, Math.min(1, (progFrac - 0.06) / 0.86));
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
