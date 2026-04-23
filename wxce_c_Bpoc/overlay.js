// ============================================================================
// KARAOKE OVERLAY — サムライハート (Some Like It Hot!!) / VESPERBELL cover
// Design: "Blood-Silk Scroll"
//
// The MV centers on two samurai (red/crimson + silver/blue), with bloody
// red ribbons streaming across every frame, banner flags bearing "A"-pyramid
// glyphs, stormy violet sky, and a neon-magenta-outlined title. The card
// reads as a scroll-style placard bound by crimson silk ribbons: a deep
// violet-charcoal surface, a full-width silk ribbon across the top held
// by two red ink-stamp seals, a razor-thin ink-blade progress ribbon along
// the bottom that continuously sheds petals as it advances. Subtle neon-
// magenta aura echoes the MV's title glow. Serif JP (Shippori Mincho) to
// sit alongside the MV's own burned-in subtitles; Cormorant italic EN.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    trackTag:   'サムライハート',
    artistTag:  'VESPERBELL  ·  SPYAIR cover',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Shippori+Mincho+B1:wght@500;700;800&' +
      'family=Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,600&' +
      'family=Inter:wght@500;600&' +
      'display=swap',
    fontJP:       '"Shippori Mincho B1", "Noto Serif JP", serif',
    fontJPHeavy:  '"Shippori Mincho B1", "Noto Serif JP", serif',
    fontEN:       '"Cormorant Garamond", Georgia, serif',
    fontGloss:    '"Inter", system-ui, sans-serif',

    // Palette — every hex pulled directly from MV frames.
    //
    // The MV's night-sky palette is smoky violet-charcoal shading toward
    // near-black on the edges, with crimson blood-ribbons cutting across
    // every frame and the burned-in title glowing neon-magenta. The
    // overlay's surface matches the MV's OWN lyric panels — dark,
    // translucent, sitting in the same visual language as the artist's
    // subtitle treatment, so the overlay reads as commissioned rather
    // than bolted-on.
    cardInk:     '#160A2B',   // deep violet-charcoal (card base)
    cardInkDeep: '#070310',   // shadow-edge
    cardInkHi:   '#2A1A46',   // subtle grain highlight
    cardInner:   'rgba(22, 10, 43, 0.86)',  // translucent body

    crimson:      '#D62E4B',   // signature bloody ribbon
    crimsonBri:   '#FF5576',   // highlight edge
    crimsonDeep:  '#6A0A1E',   // shadow / torn edge
    crimsonGlow:  'rgba(255, 85, 118, 0.55)',

    neonMagenta:  '#FF5CB8',   // title aura — use SPARINGLY
    neonGlow:     'rgba(255, 92, 184, 0.45)',

    ivory:        '#F3E8DE',   // lyric text
    ivoryDim:     'rgba(243, 232, 222, 0.72)',
    silverBlue:   '#BDD9FF',
    dustyLav:     '#A98CC1',
    warmAmber:    '#F5B96A',
    amberGlow:    'rgba(245, 185, 106, 0.28)',

    // Typography
    lyricFontSizeJP:     '48px',
    lyricLineHeightJP:   '2.0',
    lyricLetterSpacingJP:'0.06em',
    lyricFontSizeEN:     '26px',
    lyricLineHeightEN:   '1.3',
    lyricLetterSpacingEN:'0.02em',
    glossFontSize:       '17px',
    glossFontWeight:     '500',

    // Card shape
    cardRadius:  '3px',    // slight — Edo-era placard, not a rounded chip
    cardPadding: '40px 48px 32px',
    cardTilt:    '0deg',   // MV lyric panels and title are axis-aligned; don't tilt.

    // chunkColors — six drawn from the MV's two-character palette, all
    // bright/saturated enough to sit on the dark violet-charcoal surface.
    //   0 ivory       — narrative voice / "I / you / me"
    //   1 bright pink — verbs of emotion & action
    //   2 crimson     — the samurai heart / symbolic core nouns
    //   3 amber       — time, motion, adverbs (sunbeam warmth)
    //   4 silver-blue — cool / distance / sky / streets
    //   5 lavender    — nuance / subtext / negation
    chunkColors: [
      '#F3E8DE',  // 0 ivory
      '#FF89A6',  // 1 bright crimson-pink
      '#FF5576',  // 2 crimson (the heart)
      '#F5B96A',  // 3 warm amber
      '#BDD9FF',  // 4 silver-blue
      '#C9B0E5',  // 5 dusty lavender
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

  // Card sits at 0.76 vertical — roughly where the MV's own burned-in
  // lyric panels sit, clear of the two characters' heads/faces.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.76, widthFrac: 0.62 },
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
       is a body sibling of #karaoke-root, not a descendant. */
    #karaoke-root, #ko-lyrics {
      --ko-ink:         ${THEME.cardInk};
      --ko-ink-deep:    ${THEME.cardInkDeep};
      --ko-ink-hi:      ${THEME.cardInkHi};
      --ko-ink-body:    ${THEME.cardInner};

      --ko-crimson:     ${THEME.crimson};
      --ko-crimson-br:  ${THEME.crimsonBri};
      --ko-crimson-dp:  ${THEME.crimsonDeep};
      --ko-crimson-gl:  ${THEME.crimsonGlow};

      --ko-neon:        ${THEME.neonMagenta};
      --ko-neon-gl:     ${THEME.neonGlow};

      --ko-ivory:       ${THEME.ivory};
      --ko-ivory-dim:   ${THEME.ivoryDim};
      --ko-silver-blue: ${THEME.silverBlue};
      --ko-lav:         ${THEME.dustyLav};
      --ko-amber:       ${THEME.warmAmber};
      --ko-amber-gl:    ${THEME.amberGlow};

      --ko-font-jp:    ${THEME.fontJP};
      --ko-font-jp-hv: ${THEME.fontJPHeavy};
      --ko-font-en:    ${THEME.fontEN};
      --ko-font-gloss: ${THEME.fontGloss};

      /* Runtime vars written by tick ~7×/sec. */
      --ko-progress: 0;  /* 0.0 → 1.0 horizontal fraction of card width */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — VIOLET-CHARCOAL EDO PLACARD =============================
       Deep violet-charcoal body, translucent so the MV shows through
       faintly at the edges (matching the MV's own lyric panels which are
       translucent dark rectangles). Subtle diagonal grain via a faint
       repeating-linear-gradient overlay reads as silk-weave rather than
       noise. A warm amber sunbeam wash sits behind the text (radial
       gradient from center-bottom) — the "samurai at dawn" note in the
       MV's sky backlight. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: ${THEME.cardPadding};
      background:
        /* faint silk-weave grain */
        repeating-linear-gradient(
          115deg,
          transparent 0, transparent 2px,
          rgba(255, 255, 255, 0.018) 2px, rgba(255, 255, 255, 0.018) 3px
        ),
        /* warm amber backlight wash */
        radial-gradient(
          140% 90% at 50% 115%,
          var(--ko-amber-gl) 0%,
          transparent 55%
        ),
        /* body ink, vignette toward the edges */
        radial-gradient(
          130% 100% at 50% 50%,
          var(--ko-ink-hi) 0%,
          var(--ko-ink) 40%,
          var(--ko-ink-deep) 100%
        );
      background-color: var(--ko-ink-body);
      border: 1px solid rgba(255, 92, 184, 0.15);
      border-radius: ${THEME.cardRadius};
      box-shadow:
        /* inner hairline — pale ivory grain-highlight */
        inset 0 1px 0 rgba(243, 232, 222, 0.07),
        inset 0 -1px 0 rgba(106, 10, 30, 0.35),
        /* outer magenta neon aura — the MV's title glow, quiet version */
        0 0 18px rgba(255, 92, 184, 0.25),
        0 0 44px rgba(255, 92, 184, 0.18),
        /* drop shadow grounding the card */
        0 24px 60px -18px rgba(0, 0, 0, 0.75);
      transform: rotate(${THEME.cardTilt});
      transition: opacity 420ms ease, transform 420ms ease;
      isolation: isolate;
      overflow: visible;
    }

    /* Empty-state collapse during instrumental gaps. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardTilt}) scale(0.965);
    }

    /* ==== TOP SILK RIBBON ===============================================
       A horizontal crimson band sits across the top edge of the card,
       extending ~22px past each side and tapering into wispy tails. The
       ribbon reads as the MV's signature bloody-streamer motif. Two
       crossing shadow gradients inside the band give it a silk-sheen.
       A soft drop-shadow below settles it onto the card. */
    #ko-lyrics .ko-ribbon-top {
      position: absolute;
      top: -14px;
      left: -22px;
      right: -22px;
      height: 26px;
      pointer-events: none;
      z-index: 4;
      filter: drop-shadow(0 6px 10px rgba(106, 10, 30, 0.48))
              drop-shadow(0 2px 0 rgba(0, 0, 0, 0.35));
    }
    #ko-lyrics .ko-ribbon-top svg {
      width: 100%; height: 100%;
      display: block;
      overflow: visible;
    }

    /* ==== INK-STAMP SEALS — top-left + top-right ==========================
       Two small red ink-stamp circles sit on top of the ribbon, "pinning"
       it to the card. They evoke Japanese inkan / hanko stamps —
       irregular-edged red circular seals. Each carries a tiny geometric
       glyph (triangle "A" from the MV's banners on the left, three
       stacked katana-slashes on the right). They sit z-index 5 above
       the ribbon (z:4) so the ribbon reads as pinned-under-the-stamp. */
    #ko-lyrics .ko-seal {
      position: absolute;
      top: -22px;
      width: 42px;
      height: 42px;
      z-index: 5;
      filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.55));
    }
    #ko-lyrics .ko-seal.tl { left: -8px; }
    #ko-lyrics .ko-seal.tr { right: -8px; }
    #ko-lyrics .ko-seal svg {
      width: 100%; height: 100%;
      display: block;
      overflow: visible;
    }

    /* ==== TRACK TAG — serif neon-bordered title tab ========================
       Small dark tab centered above the ribbon at top, carrying the song
       title in Shippori Mincho with a thin neon-magenta stroke — the
       MV's own title glow, miniaturized. Sits z:6 above seals so it
       reads as the highest layer, like a stage placard. */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 16px 5px;
      background: var(--ko-ink-deep);
      color: var(--ko-ivory);
      font-family: var(--ko-font-jp-hv);
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.18em;
      border: 1px solid rgba(255, 92, 184, 0.55);
      border-radius: 1px;
      text-shadow:
        0 0 8px rgba(255, 92, 184, 0.95),
        0 0 2px rgba(255, 92, 184, 1);
      box-shadow:
        0 0 10px rgba(255, 92, 184, 0.45),
        0 0 22px rgba(255, 92, 184, 0.25),
        inset 0 0 0 1px rgba(22, 10, 43, 0.9);
      z-index: 6;
      white-space: nowrap;
    }
    #ko-lyrics .ko-tag-sub {
      display: block;
      margin-top: 1px;
      font-family: var(--ko-font-en);
      font-style: italic;
      font-weight: 500;
      font-size: 10px;
      letter-spacing: 0.12em;
      color: rgba(255, 92, 184, 0.8);
      text-shadow: 0 0 4px rgba(255, 92, 184, 0.6);
    }

    /* ==== ARTIST CREDIT — italic serif bottom-left ========================= */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: 8px;
      left: 16px;
      font-family: var(--ko-font-en);
      font-style: italic;
      font-weight: 500;
      font-size: 10.5px;
      letter-spacing: 0.22em;
      color: var(--ko-ivory-dim);
      text-transform: uppercase;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
      z-index: 2;
    }

    /* ==== BOTTOM INK-BLADE PROGRESS RIBBON — the signature =================
       A razor-thin crimson line along the bottom of the card. It starts
       at 0 width on the left and grows rightward with --ko-progress,
       filling the full card width at song's end. Width transition (160ms
       linear) matches the JS write cadence (~7/sec), giving smooth
       continuous motion from ~7 writes/sec. The leading edge carries
       a bright tip-glint and continuously sheds small crimson petals
       via looping staggered keyframe animations — as if the blade-edge
       cuts through time, leaving samurai-blood petals drifting behind.

       Ribbon extends -18px past each card edge so the leading edge
       (at progress=1) runs clean through to the right corner without a
       stop, mirroring the top ribbon's length. */
    #ko-lyrics .ko-ribbon-btm {
      position: absolute;
      left: -18px;
      bottom: -3px;
      right: -18px;
      height: 20px;
      pointer-events: none;
      z-index: 3;
      overflow: visible;
    }

    /* Full-width faint backing line — always visible, shows where the
       progress ribbon WILL go. Very low opacity. */
    #ko-lyrics .ko-ribbon-base {
      position: absolute;
      left: 0; right: 0; bottom: 10px;
      height: 1.5px;
      background: linear-gradient(
        to right,
        transparent 0%,
        rgba(106, 10, 30, 0.4) 8%,
        rgba(106, 10, 30, 0.65) 50%,
        rgba(106, 10, 30, 0.4) 92%,
        transparent 100%
      );
    }

    /* The growing progress ribbon. width: calc(var(--ko-progress) * 100%)
       transitions smoothly at 160ms to chain into the tick's ~7/sec
       writes. Uses width not transform-scaleX so the children (leading
       tip + petals) naturally ride along at the right edge without
       needing a compensating scale. */
    #ko-lyrics .ko-ribbon-fill {
      position: absolute;
      left: 0;
      bottom: 9px;
      width: calc(var(--ko-progress) * 100%);
      height: 3.5px;
      background: linear-gradient(
        to right,
        var(--ko-crimson-dp) 0%,
        var(--ko-crimson) 45%,
        var(--ko-crimson-br) 100%
      );
      box-shadow:
        0 0 8px rgba(255, 85, 118, 0.7),
        0 0 16px rgba(255, 85, 118, 0.35);
      transition: width 160ms linear;
      overflow: visible;
      isolation: isolate;
    }

    /* Leading tip — a tiny bright vertical sliver at the right edge of
       the fill, with a hot halo. Visually reads as the "cutting edge"
       of the ribbon-blade. */
    #ko-lyrics .ko-ribbon-tip {
      position: absolute;
      right: -1px;
      top: -7px;
      width: 2px;
      height: 17px;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        var(--ko-crimson-br) 25%,
        #FFE7EC 50%,
        var(--ko-crimson-br) 75%,
        transparent 100%
      );
      box-shadow:
        0 0 6px var(--ko-crimson-br),
        0 0 14px var(--ko-crimson-gl);
      border-radius: 1px;
    }

    /* Petals — five small crimson petal shapes anchored to the right edge
       of the fill (so they ride along as the fill grows). Each has a
       staggered looping animation that drifts it up-and-back (opposite
       the direction of ribbon travel) while fading. Feels like the
       blade-edge is continuously shedding petals as it cuts. */
    #ko-lyrics .ko-petal {
      position: absolute;
      right: -2px;
      bottom: 0;
      width: 7px;
      height: 9px;
      background: linear-gradient(135deg,
        var(--ko-crimson-br) 0%,
        var(--ko-crimson) 55%,
        var(--ko-crimson-dp) 100%);
      border-radius: 70% 30% 75% 25% / 60% 40% 80% 40%;
      opacity: 0;
      transform-origin: 100% 100%;
      animation: ko-petal-drift 2.6s cubic-bezier(.28,.4,.45,1) infinite;
      will-change: transform, opacity;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.4));
    }
    #ko-lyrics .ko-petal.p1 { animation-delay: 0s;     right: -1px; bottom: 2px; }
    #ko-lyrics .ko-petal.p2 { animation-delay: 0.52s;  right: -4px; bottom: -1px; }
    #ko-lyrics .ko-petal.p3 { animation-delay: 1.04s;  right: 3px;  bottom: 4px; }
    #ko-lyrics .ko-petal.p4 { animation-delay: 1.56s;  right: -6px; bottom: 1px; }
    #ko-lyrics .ko-petal.p5 { animation-delay: 2.08s;  right: 0;    bottom: -3px; }

    @keyframes ko-petal-drift {
      0%   {
        transform: translate(0, 0) rotate(0deg) scale(0.6);
        opacity: 0;
      }
      12%  {
        transform: translate(-3px, -4px) rotate(-18deg) scale(1);
        opacity: 0.95;
      }
      55%  {
        transform: translate(-24px, -18px) rotate(-90deg) scale(0.95);
        opacity: 0.7;
      }
      100% {
        transform: translate(-64px, -46px) rotate(-210deg) scale(0.55);
        opacity: 0;
      }
    }

    /* Pause petals during instrumental gaps (card already fades out,
       but this prevents the animation from running off-screen). */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) .ko-petal {
      animation-play-state: paused;
    }

    /* ==== LYRICS — ivory serif JP with amber gloss, italic serif EN ======== */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      color: var(--ko-ivory);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.55em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      text-shadow:
        0 1px 0 rgba(0, 0, 0, 0.6),
        0 0 16px rgba(255, 92, 184, 0.14),
        0 0 6px rgba(0, 0, 0, 0.8);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — warm amber labels above each morpheme, sans-serif and
       compact. The amber pops against the dark body without fighting
       the white JP line, and matches the sunbeam-backlight wash at the
       card's bottom. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.015em;
      line-height: 1.1;
      padding-bottom: 5px;
      color: var(--ko-amber);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.88;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Cormorant Garamond italic, ivory with subtle crimson
       undertone. The italic evokes the MV's "Some Like It Hot!!" subtitle
       on the title card. A thin crimson hairline sits under the line,
       echoing the ribbons above and below. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 600;
      font-style: italic;
      color: var(--ko-ivory);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      padding: 3px 4px 6px;
      margin-top: 4px;
      position: relative;
      z-index: 2;
      order: 2;
      text-shadow:
        0 1px 0 rgba(0, 0, 0, 0.65),
        0 0 10px rgba(0, 0, 0, 0.55);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.88);
      font-weight: 500;
    }
    /* Thin crimson hairline under the EN line — echoes the ribbons. */
    #ko-lyrics .ko-line-en:not(:empty) {
      background:
        linear-gradient(90deg,
          transparent 10%,
          rgba(214, 46, 75, 0.55) 50%,
          transparent 90%)
        bottom / 100% 1px no-repeat;
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

  // Top ribbon SVG — a crimson silk band with tapering tail ends, a
  // slight wavy bottom edge (hand-torn silk), and a linear-gradient fill
  // for silk sheen. preserveAspectRatio="none" stretches the 100-unit-
  // wide viewBox to any card width. Note: the path's y-coordinates are
  // constant and stretch horizontally only, so the band's HEIGHT stays
  // fixed regardless of card width.
  const topRibbonSvg = `
    <svg viewBox="0 0 100 26" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ko-silk-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stop-color="${THEME.crimsonBri}" stop-opacity="1"/>
          <stop offset="35%"  stop-color="${THEME.crimson}"    stop-opacity="1"/>
          <stop offset="100%" stop-color="${THEME.crimsonDeep}" stop-opacity="1"/>
        </linearGradient>
        <linearGradient id="ko-silk-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stop-color="#FFE7EC" stop-opacity="0.55"/>
          <stop offset="30%"  stop-color="#FFE7EC" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Main band with tapering tails and subtly waved bottom edge -->
      <path d="
        M 0 14
        L 4 5
        L 12 3
        L 88 3
        L 96 5
        L 100 14
        L 97 17
        L 90 15
        L 82 16
        L 72 14.5
        L 62 16
        L 50 14.5
        L 38 16
        L 28 14.5
        L 18 16
        L 10 15
        L 3 17
        Z
      "
        fill="url(#ko-silk-top)"
        vector-effect="non-scaling-stroke"
      />
      <!-- Silk sheen highlight across the top third -->
      <path d="
        M 6 4.5
        L 94 4.5
        L 94 9
        L 6 9
        Z
      "
        fill="url(#ko-silk-sheen)"
      />
    </svg>`;

  // Bottom ribbon backing, fill, tip, and petals. The base backing is a
  // faint crimson line across the full card width; the fill grows on
  // top of it. The tip + petals are nested inside the fill so they ride
  // the growing right edge automatically.
  const bottomRibbon = `
    <div class="ko-ribbon-btm">
      <div class="ko-ribbon-base"></div>
      <div class="ko-ribbon-fill">
        <div class="ko-ribbon-tip"></div>
        <div class="ko-petal p1"></div>
        <div class="ko-petal p2"></div>
        <div class="ko-petal p3"></div>
        <div class="ko-petal p4"></div>
        <div class="ko-petal p5"></div>
      </div>
    </div>
  `;

  // Seals — round red ink-stamp circles with tiny interior glyphs.
  // Left seal: the "A"-pyramid triangle glyph from the MV's banner flags.
  // Right seal: three stacked katana-slash diagonals (abstract stamp).
  // Slightly-imperfect circle paths (not pure ellipses) so they read as
  // hand-pressed ink seals rather than CSS circles.
  const sealLeft = `
    <svg class="ko-seal tl" viewBox="0 0 42 42">
      <defs>
        <radialGradient id="ko-seal-l" cx="45%" cy="40%" r="60%">
          <stop offset="0%"   stop-color="#E64664"/>
          <stop offset="65%"  stop-color="${THEME.crimson}"/>
          <stop offset="100%" stop-color="${THEME.crimsonDeep}"/>
        </radialGradient>
      </defs>
      <!-- Irregular ink-seal circle (slightly lumpy, uneven edges) -->
      <path d="
        M 21 2
        C 30 2, 40 8, 40 21
        C 40 31, 33 40, 22 40
        C 11 40, 2 32, 2 21
        C 2 10, 11 2, 21 2 Z
      "
        fill="url(#ko-seal-l)"
        stroke="${THEME.crimsonDeep}"
        stroke-width="0.5"
        stroke-opacity="0.4"
      />
      <!-- "A"-pyramid triangle glyph, ivory, mimicking the banner logos -->
      <path d="M 21 11 L 30 29 L 12 29 Z"
        fill="none"
        stroke="${THEME.ivory}"
        stroke-width="1.8"
        stroke-linejoin="miter"
      />
      <path d="M 15 25 L 27 25"
        stroke="${THEME.ivory}"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </svg>`;

  const sealRight = `
    <svg class="ko-seal tr" viewBox="0 0 42 42">
      <defs>
        <radialGradient id="ko-seal-r" cx="55%" cy="40%" r="60%">
          <stop offset="0%"   stop-color="#E64664"/>
          <stop offset="65%"  stop-color="${THEME.crimson}"/>
          <stop offset="100%" stop-color="${THEME.crimsonDeep}"/>
        </radialGradient>
      </defs>
      <path d="
        M 21 2
        C 31 3, 40 9, 40 20
        C 40 31, 31 40, 20 40
        C 10 40, 2 31, 2 20
        C 2 10, 11 2, 21 2 Z
      "
        fill="url(#ko-seal-r)"
        stroke="${THEME.crimsonDeep}"
        stroke-width="0.5"
        stroke-opacity="0.4"
      />
      <!-- Three stacked katana-slash diagonals -->
      <path d="M 12 14 L 30 10"
        stroke="${THEME.ivory}"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path d="M 12 22 L 30 18"
        stroke="${THEME.ivory}"
        stroke-width="1.8"
        stroke-linecap="round"
      />
      <path d="M 12 30 L 30 26"
        stroke="${THEME.ivory}"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-ribbon-top">${topRibbonSvg}</div>
      ${sealLeft}
      ${sealRight}
      <div class="ko-tag">
        ${escHTML(THEME.trackTag)}
        <span class="ko-tag-sub">Some Like It Hot!!</span>
      </div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      ${bottomRibbon}
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
      // Suppress the ribbon-fill width transition during a resize — the
      // fill's width: calc(var(--ko-progress) * 100%) is percent-of-parent,
      // so a parent resize re-evaluates the percent and would otherwise
      // animate across the new width (visible slide). Flush and restore.
      const fill = lyrics.querySelector('.ko-ribbon-fill');
      if (fill) fill.style.transition = 'none';
      void lyrics.offsetWidth;
      if (fill) fill.style.transition = '';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + progress ribbon ---
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

    // ---- Progress ribbon update (rate-limited) ----
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
