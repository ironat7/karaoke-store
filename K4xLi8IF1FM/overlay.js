// ============================================================================
// KARAOKE OVERLAY — KAWAIKUTE GOMEN
// HoneyWorks 「可愛くてごめん」 feat. ちゅーたん (CV: 早見沙織)
// ----------------------------------------------------------------------------
// MV reads as a torn-out idol-magazine page: makeup flat-lays, manga panels
// with pink/orange outlines, halftone-dot textures everywhere, sticker-style
// lettering, heart-shaped pupil close-ups. Concept arc: ちゅーたん defiantly
// owns her cuteness across three choruses, ending writing fan-mail to LIP×LIP.
// The "チュ！" kissy hook lands twelve times across the song.
//
// Card: a torn magazine page, cream-pink halftone backdrop, magenta-and-cream
// double border (manga panel), slight sticker tilt. Sparkle-flanked title chip
// in the corner, hot-pink artist credit at the foot, heart sparkles tucked
// into both bottom corners.
//
// Signature — the Chu!Stamp Track. A horizontal lane arches above the card
// top edge holding twelve lipstick-kiss stamps at their actual song
// timestamps. Pre-stamp = pale ghost outline. As each "チュ！" lands in the
// audio, the corresponding stamp transitions to a hot-pink lipstick mark
// with a slight randomized rotation for that imperfect handpressed feel.
// The kisses CLUSTER in three visual groups — chorus 1, chorus 2, chorus 3 —
// with empty stretches between them, so the timeline visually reveals the
// song's structure (verses + bridge are the gaps). A small pink-heart
// playhead travels left→right along the track via --ko-cursor. By the song's
// end, all twelve stamps are in place — Chuutan has marked every kiss.
//
// Functional + thematic: encodes the song's literal hook AND shows where
// you are in the song. No other song would have this signature — the count
// of twelve, the cluster pattern, the kiss motif: all of it is THIS song.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Kawaikute Gomen
  // ==========================================================================
  const THEME = {
    trackTag:   '可愛くてごめん',
    artistTag:  'HoneyWorks × ちゅーたん',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Hachi+Maru+Pop&' +
      'family=Reggae+One&' +
      'family=Quicksand:wght@500;600;700&' +
      'family=Zen+Maru+Gothic:wght@500;700&' +
      'display=swap',
    fontJP:       '"Hachi Maru Pop", "Zen Maru Gothic", sans-serif',
    fontJPHeavy:  '"Reggae One", "Hachi Maru Pop", sans-serif',
    fontEN:       '"Quicksand", system-ui, sans-serif',
    fontGloss:    '"Zen Maru Gothic", system-ui, sans-serif',

    // Palette — pulled from MV frames. Pink-heavy with magenta accents and
    // cream highlights. The card body lives in cream/pale-pink so the
    // saturated text colors stay legible.
    bgCream:        '#FFF6EB',  // soft cream base (paper/notebook feel)
    bgPinkLite:     '#FFE2EC',  // pale pink cushion (gradient mid)
    bgPinkSoft:     '#FFD7E5',  // medium pink (gradient end)

    // Halftone-dot tints — two overlapping radial-gradient grids paint the
    // card's manga texture. Kept low opacity so dots read as faint texture
    // and don't contend with lyrics for attention.
    halftonePink:   'rgba(255, 110, 165, 0.18)',
    halftoneCool:   'rgba(255, 87, 144, 0.13)',

    pinkHot:        '#FF3D8A',  // primary accent (title chip text, etc.)
    pinkDeep:       '#C42678',  // border color (the manga panel ring)
    pinkInk:        '#8A1F55',  // body text (deep wine for legibility)
    magentaDark:    '#5C0F40',  // shadow / deepest stroke
    coral:          '#FF6BA0',  // soft accent
    cream:          '#FFF8EE',  // text-shadow halo

    // Chu!Stamp lipstick colors
    stampPink:      '#E8125B',  // upper lip primary (post-stamp)
    stampDark:      '#9C0E45',  // lower lip darker tone
    stampGhost:     'rgba(196, 38, 120, 0.20)',  // pre-stamp ghost outline

    // Typography
    lyricFontSizeJP:     '54px',
    lyricLineHeightJP:   '2.0',
    lyricLetterSpacingJP:'0.03em',
    lyricFontSizeEN:     '28px',
    lyricLineHeightEN:   '1.30',
    lyricLetterSpacingEN:'0.005em',
    glossFontSize:       '18px',
    glossFontWeight:     '500',

    // Card shape
    cardRadius:  '20px',
    cardPadding: '38px 44px 32px',
    cardTilt:    '-1.2deg',  // slight sticker/Polaroid tilt

    // chunkColors: 6 slots. All saturated and dark enough to read on the
    // cream-pink card surface. Drawn from the MV palette: hot pink (the
    // narrator voice), magenta (the cute/love vocabulary), coral (action
    // verbs), wine plum (sass / dismissive talk-down to the haters),
    // mauve violet (objects / concrete things), berry red (intimate /
    // self-care / 尊い 大切).
    chunkColors: [
      '#E8125B',  // 0 — hot pink: narrator voice / 私 / I
      '#B8186E',  // 1 — magenta: love & cute (可愛い 大好き 尊い)
      '#D34822',  // 2 — coral red: action verbs (歩く 持つ 巻く)
      '#5C0F40',  // 3 — wine plum: sass/dismissive (ざまあ あんたら 重い)
      '#7A3E9C',  // 4 — mauve violet: objects/concrete (お洋服 ブーツ)
      '#A82832',  // 5 — berry red: intimate/special (大切 味方 自分)
    ],

    // The twelve "チュ！" timestamps in sung order. Used by tick() to stamp
    // each lipstick mark when its time hits, AND used at DOM-build time
    // to position the marks along the Chu!Stamp track.
    chuTimes: [ 41.82,  47.45,  53.98,  60.40,
               110.96, 117.07, 123.19, 129.35,
               173.93, 179.89, 188.44, 194.06],

    // Song duration — matches setlist entry. Hard-coded here for stamp
    // positioning math (avoids a load-order dependency on __setlist).
    songDur:    221,
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

  // Position — sit slightly lower than default (0.74) to leave the upper
  // half of the screen for the MV. widthFrac 0.62 gives the card enough
  // breathing room for both the JP gloss layer and the Chu!Stamp track.
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
      --ko-cream:        ${THEME.bgCream};
      --ko-pink-lite:    ${THEME.bgPinkLite};
      --ko-pink-soft:    ${THEME.bgPinkSoft};
      --ko-pink-hot:     ${THEME.pinkHot};
      --ko-pink-deep:    ${THEME.pinkDeep};
      --ko-pink-ink:     ${THEME.pinkInk};
      --ko-magenta-dark: ${THEME.magentaDark};
      --ko-coral:        ${THEME.coral};
      --ko-halftone:     ${THEME.halftonePink};
      --ko-halftone-2:   ${THEME.halftoneCool};
      --ko-stamp-pink:   ${THEME.stampPink};
      --ko-stamp-dark:   ${THEME.stampDark};
      --ko-stamp-ghost:  ${THEME.stampGhost};

      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-jp-hv:   ${THEME.fontJPHeavy};
      --ko-font-en:      ${THEME.fontEN};
      --ko-font-gloss:   ${THEME.fontGloss};

      /* Runtime vars written by the main tick. --ko-cursor drives the
         playhead heart along the Chu!Stamp track (0.0 → 1.0 across the
         full song). --ko-track-w is the track pixel width, written on
         resize so the playhead's transform calc knows the travel range. */
      --ko-cursor:    0;
      --ko-track-w:   0px;
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — torn idol-magazine page =================================
       Stacked backgrounds:
         1) Small halftone dot grid (the primary manga texture)
         2) Larger halftone dot grid offset, doubles the perceived density
         3) Cream → pink → deeper-pink diagonal gradient base
       Wrapped in a magenta double-border via stacked box-shadow rings
       (cream halo + magenta panel ring + cream outer). Slight sticker tilt. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: ${THEME.cardPadding};
      background:
        radial-gradient(circle at 50% 50%,
          var(--ko-halftone) 1.4px, transparent 1.8px) 0 0 / 9px 9px,
        radial-gradient(circle at 50% 50%,
          var(--ko-halftone-2) 2.2px, transparent 2.6px) 4.5px 4.5px / 18px 18px,
        linear-gradient(135deg,
          var(--ko-cream) 0%,
          var(--ko-pink-lite) 55%,
          var(--ko-pink-soft) 100%);
      border-radius: ${THEME.cardRadius};
      /* Manga-panel double border. Three concentric box-shadow rings:
         3px cream halo against the card → 4px magenta panel ring →
         2px cream outer trim. Stacked because a single border can't
         create the inner-cream + outer-magenta + outer-cream sandwich. */
      box-shadow:
        0 0 0 3px var(--ko-cream),
        0 0 0 7px var(--ko-pink-deep),
        0 0 0 9px var(--ko-cream),
        0 22px 48px -16px rgba(140, 30, 80, 0.55),
        inset 0 0 0 1px rgba(255, 255, 255, 0.40);
      transform: rotate(${THEME.cardTilt});
      transition: transform 320ms cubic-bezier(.2,.7,.3,1), opacity 380ms;
      isolation: isolate;
      overflow: visible;
    }

    /* Empty-state collapse during instrumental gaps — gentle settle. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardTilt}) scale(0.95);
    }

    /* ==== CHU!STAMP TRACK — the signature ================================
       Horizontal lane sitting just above the card top edge. Twelve
       lipstick-kiss stamps positioned absolutely at left:<fraction>%
       computed from each "チュ！" timestamp. Track extends -12px past
       each card edge to align the cursor's travel range with the visible
       lyric width. */
    #ko-lyrics .ko-track {
      position: absolute;
      top: -44px;
      left: -12px;
      right: -12px;
      height: 36px;
      pointer-events: none;
      z-index: 5;
      overflow: visible;
      /* Thin pink dotted baseline at vertical center. The dotted line is
         drawn as a repeating linear-gradient at 8px period (4px on, 4px
         off), 1.5px tall, no-repeat-y so it sits as a single line. */
      background:
        linear-gradient(to right,
          var(--ko-pink-deep) 0,
          var(--ko-pink-deep) 4px,
          transparent 4px,
          transparent 8px) 0 50% / 8px 1.5px repeat-x;
    }

    /* Each .ko-stamp's left% is set inline (its timestamp / song duration).
       Pre-stamp: ghost outline tint, low opacity, slightly smaller scale.
       Post-stamp: full lipstick color, full scale, randomized rotation
       (set inline as --ko-stamp-rot), drop shadow. Bouncy cubic-bezier
       on the transition so each stamp lands with a tiny pop. */
    #ko-lyrics .ko-stamp {
      position: absolute;
      top: 50%;
      width: 26px;
      height: 22px;
      margin-left: -13px;       /* center on its left% */
      transform: translateY(-50%) scale(0.7) rotate(0deg);
      opacity: 0.32;
      filter: grayscale(0.5);
      transition: opacity 380ms cubic-bezier(.2,.9,.3,1.3),
                  transform 460ms cubic-bezier(.18,.85,.32,1.45),
                  filter 380ms ease-out;
    }
    #ko-lyrics .ko-stamp svg { width: 100%; height: 100%; display: block; overflow: visible; }
    #ko-lyrics .ko-stamp .ko-lip-up,
    #ko-lyrics .ko-stamp .ko-lip-low { fill: var(--ko-stamp-ghost); }

    #ko-lyrics .ko-stamp.stamped {
      opacity: 1;
      transform: translateY(-50%) scale(1) rotate(var(--ko-stamp-rot, 0deg));
      filter: drop-shadow(0 1.5px 0 rgba(120, 5, 50, 0.32));
    }
    #ko-lyrics .ko-stamp.stamped .ko-lip-up  { fill: var(--ko-stamp-pink); }
    #ko-lyrics .ko-stamp.stamped .ko-lip-low { fill: var(--ko-stamp-dark); }

    /* Heart playhead — travels left→right via --ko-cursor.
       GPU-composited transform (translate via calc on track-w) keeps motion
       sub-pixel smooth at the slow song-progress speed. Rate-limited writes
       in tick() pair with the 160ms transition for seamless chained motion. */
    #ko-lyrics .ko-cursor {
      position: absolute;
      top: 50%;
      left: 0;
      width: 22px;
      height: 20px;
      margin-left: -11px;
      transform:
        translate(calc(var(--ko-track-w, 500px) * var(--ko-cursor)), -50%);
      transition: transform 160ms linear;
      will-change: transform;
      z-index: 6;
      pointer-events: none;
    }
    #ko-lyrics .ko-cursor svg { width: 100%; height: 100%; overflow: visible; display: block; }
    #ko-lyrics .ko-cursor .ko-heart {
      fill: var(--ko-pink-hot);
      filter: drop-shadow(0 1px 2px rgba(160, 20, 80, 0.55));
    }
    #ko-lyrics .ko-cursor .ko-heart-shine {
      fill: rgba(255, 255, 255, 0.85);
    }

    /* ==== TITLE CHIP — chunky pink in the top-right corner ===============
       Reggae One face for that chunky outlined manga-pop feel. Cream
       background with magenta border, hot-pink text, cream text-outline
       to mimic the MV's chunky kana lettering. Slight tilt + drop-shadow
       stack for the sticker feel. */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -22px;
      right: 24px;
      padding: 6px 16px 7px;
      background: var(--ko-cream);
      color: var(--ko-pink-hot);
      font-family: var(--ko-font-jp-hv);
      font-size: 17px;
      font-weight: 400;
      letter-spacing: 0.06em;
      border-radius: 18px;
      border: 2.5px solid var(--ko-pink-deep);
      transform: rotate(3deg);
      box-shadow:
        0 3px 0 0 var(--ko-magenta-dark),
        0 6px 12px -4px rgba(120, 20, 70, 0.45);
      z-index: 7;
      white-space: nowrap;
    }
    /* Sparkle stars flanking the title chip */
    #ko-lyrics .ko-tag::before,
    #ko-lyrics .ko-tag::after {
      content: '✦';
      position: absolute;
      color: var(--ko-pink-hot);
      font-size: 14px;
      text-shadow: 0 0 5px rgba(255, 200, 220, 0.85);
    }
    #ko-lyrics .ko-tag::before { top: -6px;  left: -8px;  transform: rotate(-15deg); }
    #ko-lyrics .ko-tag::after  { bottom: -7px; right: -7px; transform: rotate(20deg); }

    /* ==== ARTIST CREDIT — handwritten label bottom-left ================== */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -16px;
      left: 24px;
      padding: 3px 12px 4px;
      background: var(--ko-pink-hot);
      color: var(--ko-cream);
      font-family: var(--ko-font-en);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      border-radius: 12px;
      border: 1.5px solid var(--ko-cream);
      transform: rotate(-2deg);
      box-shadow:
        0 2px 0 0 var(--ko-magenta-dark),
        0 4px 8px -2px rgba(120, 20, 70, 0.30);
      z-index: 6;
    }

    /* ==== CORNER SPARKLES — decorative motifs ============================ */
    #ko-lyrics .ko-sparkle {
      position: absolute;
      pointer-events: none;
      color: var(--ko-pink-hot);
      text-shadow: 0 0 6px rgba(255, 220, 232, 0.9);
      z-index: 4;
      opacity: 0.85;
      font-family: var(--ko-font-en);
      font-weight: 700;
    }
    #ko-lyrics .ko-sparkle.s1 { top: 22px; left: 24px;  transform: rotate(-12deg); font-size: 16px; }
    #ko-lyrics .ko-sparkle.s2 { top: 30px; right: 30px; transform: rotate( 18deg); font-size: 14px; opacity: 0.7; }
    #ko-lyrics .ko-sparkle.s3 { bottom: 36px; right: 22px; transform: rotate(-8deg); font-size: 16px; }
    #ko-lyrics .ko-sparkle.s4 { bottom: 30px; left: 30px;  transform: rotate(14deg); font-size: 13px; opacity: 0.75; }

    /* ==== LYRICS ========================================================= */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: var(--ko-pink-ink);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.55em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      text-shadow:
        0 2px 0 rgba(255, 248, 240, 0.65),
        0 0 14px rgba(255, 235, 245, 0.55);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — small label above each morpheme. Magenta-dark on the
       cream paper, lowercased, slightly faded (opacity 0.92) so the JP
       reads as the primary layer. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: var(--ko-magenta-dark);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.92;
      text-shadow: 0 1px 0 rgba(255, 248, 240, 0.7);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Quicksand rounded, magenta-dark on cream halo. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 600;
      color: var(--ko-magenta-dark);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      text-shadow:
        0 2px 0 rgba(255, 248, 240, 0.6),
        0 0 12px rgba(255, 235, 245, 0.45);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.92);
      font-weight: 500;
    }
    /* Hot-pink hairline under the EN line — picks up the title chip color. */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 4px;
      margin-top: 2px;
      background:
        linear-gradient(90deg,
          transparent 6%,
          rgba(255, 61, 138, 0.35) 50%,
          transparent 94%)
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

  // Lipstick-kiss SVG. Two paths: upper lip (the M-shape with a cupid's-bow
  // dip in the center) and lower lip (a softer rounded U). At ~24px wide
  // they read clearly as a kiss mark — no ambiguity with a heart or other
  // round shape.
  const lipSvg = `
    <svg viewBox="0 0 28 22">
      <path class="ko-lip-up"
        d="M 2 8 C 3 4 6 3 9 6 C 11 4 13 4 14 6 C 15 4 17 4 19 6 C 22 3 25 4 26 8 C 23 11 18 11 14 10 C 10 11 5 11 2 8 Z"/>
      <path class="ko-lip-low"
        d="M 4 11 C 5 16 9 19 14 18 C 19 19 23 16 24 11 C 21 13 17 14 14 13 C 11 14 7 13 4 11 Z"/>
    </svg>`;

  // Heart playhead SVG. Symmetric two-lobe heart with a small white shine
  // arc in the upper-left lobe to suggest a glossy enamel sticker.
  const heartSvg = `
    <svg viewBox="0 0 22 20">
      <path class="ko-heart"
        d="M 11 18 C 4 13, 1 9, 1 6 C 1 3, 3 1, 6 1 C 8 1, 10 2.5, 11 5 C 12 2.5, 14 1, 16 1 C 19 1, 21 3, 21 6 C 21 9, 18 13, 11 18 Z"/>
      <path class="ko-heart-shine" d="M 4.5 4.5 Q 6 2.8, 8 4.2"
        fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;

  // Build the twelve lipstick-kiss stamps as one HTML string. Each stamp's
  // left% is timestamp/duration, and each rotation is baked deterministically
  // (a hand-tuned set of imperfect angles, NOT random per-load — repeatable).
  const STAMP_ROTATIONS = [-8, 5, -3, 9, -6, 4, -10, 7, -2, 8, -5, 11];
  const stamps = THEME.chuTimes.map((t, i) => {
    const leftPct = (t / THEME.songDur * 100).toFixed(2);
    const rot = STAMP_ROTATIONS[i];
    return `<div class="ko-stamp" data-i="${i}" data-t="${t}"
      style="left: ${leftPct}%; --ko-stamp-rot: ${rot}deg;">${lipSvg}</div>`;
  }).join('');

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-track" id="ko-track">
        ${stamps}
        <div class="ko-cursor" id="ko-cursor">${heartSvg}</div>
      </div>
      <div class="ko-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
      <div class="ko-sparkle s1">✦</div>
      <div class="ko-sparkle s2">♡</div>
      <div class="ko-sparkle s3">✦</div>
      <div class="ko-sparkle s4">♡</div>
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
  let lastCursorWriteAt = 0;       // ms timestamp of last --ko-cursor write
  let lastStampedIdx = -2;         // last index of stamped kisses (-2 forces initial sweep)

  // --- Position tick: re-anchor the lyric zone to the video rect ---
  // Also writes --ko-track-w in pixels so the cursor's transform calc
  // knows how far to travel. Updated only when video rect changes.
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
      // Resize snap: --ko-track-w feeds into the cursor's transform calc,
      // and the cursor has `transition: transform 160ms` for smooth song
      // progress. Without suppression, a fullscreen toggle would animate
      // the cursor to its new proportional position — a visible "slide".
      // Kill the transition, write the var, force reflow, restore.
      const cursor = document.getElementById('ko-cursor');
      if (cursor) cursor.style.transition = 'none';
      // .ko-track extends -12px past each card edge, so total width = cardW + 24
      lyrics.style.setProperty('--ko-track-w', (cardW + 24) + 'px');
      if (cursor) {
        void cursor.offsetWidth;
        cursor.style.transition = '';
      }
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + cursor position + Chu!Stamp track ---
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

      // Reset stamp tracker — forces a sweep on the next stamp-update pass.
      lastStampedIdx = -2;
    }

    // ---- Cursor + Chu!Stamp track update ----
    if (song && songDur > 0) {
      const now = performance.now();
      // Rate-limit cursor writes to ~7/sec. CSS has a matching 160ms
      // transition so each write chains seamlessly into the next.
      if (now - lastCursorWriteAt >= 140) {
        lastCursorWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        lyrics.style.setProperty('--ko-cursor', progFrac.toFixed(4));
      }

      // Find the latest "チュ！" stamp whose timestamp has passed. Only
      // walk the stamp DOM if the threshold actually changed.
      const ct = THEME.chuTimes;
      let newStampedIdx = -1;
      for (let i = 0; i < ct.length; i++) {
        if (ct[i] <= inSong) newStampedIdx = i;
        else break;
      }
      if (newStampedIdx !== lastStampedIdx) {
        lastStampedIdx = newStampedIdx;
        const allStamps = document.querySelectorAll('#ko-track .ko-stamp');
        for (let i = 0; i < allStamps.length; i++) {
          const shouldStamp = i <= newStampedIdx;
          if (allStamps[i].classList.contains('stamped') !== shouldStamp) {
            allStamps[i].classList.toggle('stamped', shouldStamp);
          }
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
