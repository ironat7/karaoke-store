// ============================================================================
// KARAOKE OVERLAY — 「キュートなカノジョ」 Cute na Kanojo (FUWAMOCO cover of syudou)
// ----------------------------------------------------------------------------
// "A prescription card for an obsession." The MV is yandere-pharmaceutical —
// floating pills, syringes, bandaids, chromatic aberration on burned-in kanji,
// a Fuwawa-pink-left / Mococo-cyan-right color asymmetry. The overlay is a
// dark plum prescription slip dosed with a two-tone pill progress bar, crossed
// bandaid corners, an ℞ title sticker, and a handwritten-slip artist credit.
//
// Signature: horizontal PILL CAPSULE across the top edge. Cream glass shell,
// split pink-left (Fuwawa) / cyan-right (Mococo), fills left→right via
// clip-path driven by --ko-progress and deepens pale→saturated via --ko-ripe
// as the obsession-dose lands through the song. Encodes the song's central
// metaphor — love as slow intoxication — AND the MV's literal pink/cyan
// composition mirroring the two vocalists' eye colors.
//
// JP text: Klee One Semi-Bold with FIXED chromatic aberration (magenta -1.1px
// + cyan +1.1px text-shadow) echoing the MV's glitch treatment on burned-in
// kanji. Gloss rt overrides the aberration (at 17px, a 1px RGB split would
// destroy legibility) and shows per-morpheme English in DM Mono italic,
// color-coded to JP chunks. EN natural: Cormorant Infant italic, dotted pink
// hairline below (prescription-form signature line). Card title tag: Yuji
// Syuku brush — dramatic Japanese display.
//
// Corner bandaids replace Cherry Pop's washi tape — cream with dot-holes at
// each end and a pink cross in the middle. Tilted at ±22° pinning the card
// to the screen. z-index above the pill so the pill appears to tuck under.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    trackTag:   'キュートなカノジョ',
    artistTag:  'syudou · FUWAMOCO cover',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Yuji+Syuku&' +
      'family=Klee+One:wght@400;600&' +
      'family=Cormorant+Infant:ital,wght@0,400;0,600;1,400;1,500&' +
      'family=DM+Mono:ital,wght@0,400;0,500;1,400;1,500&' +
      'display=swap',
    fontJP:      '"Klee One", "Shippori Mincho", serif',
    fontDisplay: '"Yuji Syuku", "Klee One", serif',
    fontEN:      '"Cormorant Infant", Georgia, serif',
    fontGloss:   '"DM Mono", ui-monospace, monospace',

    // Palette — every hex pulled from MV frames. The MV stacks a pink field
    // on the left (around Fuwawa, who has pink eyes) and a cyan field on the
    // right (around Mococo, who has blue eyes), both over a deep plum-navy
    // base. Cream appears as bandaid / subtitle-text accents.
    bgDeep:      '#0b0414',  // deepest plum
    bgMid:       '#180928',  // main card plum
    bgRim:       '#241038',  // warmer upper rim
    cream:       '#fdf4e2',  // bandaid + label surface
    creamDeep:   '#e0c49a',  // bandaid outline + label edge
    creamInk:    '#f5e4c8',  // cream mid-tone
    fwwPink:     '#ff4d8f',  // Fuwawa hot pink (saturated end of ripen)
    mcmCyan:     '#4ab8ff',  // Mococo electric cyan (saturated end)
    fwwPinkSoft: '#ff9ec7',  // pre-ripe pink
    mcmCyanSoft: '#8be6ff',  // pre-ripe cyan

    // Typography
    lyricFontSizeJP:     '46px',
    lyricLineHeightJP:   '2.05',
    lyricLetterSpacingJP:'0.035em',
    lyricFontSizeEN:     '26px',
    lyricLineHeightEN:   '1.28',
    lyricLetterSpacingEN:'0.012em',
    glossFontSize:       '17px',
    glossFontWeight:     '500',

    cardRadius:  '20px',
    cardPadding: '36px 48px 30px',
    cardTilt:    '0deg',  // Zero tilt — the yandere register is clinical-
                          // pharmaceutical, not scrapbooky. A tilt would make
                          // this read playful; the song is not playful.

    // chunkColors: 6 slots. All readable against dark plum bg. Pink/cyan
    // anchor Fuwawa/Mococo, honey-gold gives warm rhythm accent, lavender
    // echoes the MV's ambient purple haze, cotton-candy and ice variants
    // fill out the range without re-using the anchor pair.
    chunkColors: [
      '#ff4d8f',  // 0 — Fuwawa hot pink (primary / narrator obsession)
      '#4ab8ff',  // 1 — Mococo electric cyan (the "you" / object of gaze)
      '#ffd469',  // 2 — honey gold (warmth / rhythmic compound descriptors)
      '#c490ff',  // 3 — lavender (ambient MV glow / nuance)
      '#ff9ec7',  // 4 — cotton-candy pink (softness / pastel star dust)
      '#8be6ff',  // 5 — ice cyan (cool / distance)
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

  // Position — anchorY 0.78 sits low-center below the characters' eye line.
  // The MV composition places FUWAMOCO centered at ~0.35-0.55; the card
  // lives in the darker bottom region, clear of their faces.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.78, widthFrac: 0.62 },
    window.__koPosition || {}
  );

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Cleanup prior injection's leftover DOM ---
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
    /* ==== LOCKED PLUMBING ================================================== */
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
    /* CSS vars declared on BOTH #karaoke-root AND #ko-lyrics (which is a body
       sibling of #karaoke-root, not a descendant — so vars on #karaoke-root
       alone wouldn't cascade to it). */
    #karaoke-root, #ko-lyrics {
      --ko-bg-deep:    ${THEME.bgDeep};
      --ko-bg-mid:     ${THEME.bgMid};
      --ko-bg-rim:     ${THEME.bgRim};
      --ko-cream:      ${THEME.cream};
      --ko-cream-deep: ${THEME.creamDeep};
      --ko-cream-ink:  ${THEME.creamInk};
      --ko-fww:        ${THEME.fwwPink};
      --ko-mcm:        ${THEME.mcmCyan};
      --ko-fww-soft:   ${THEME.fwwPinkSoft};
      --ko-mcm-soft:   ${THEME.mcmCyanSoft};

      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-en:      ${THEME.fontEN};
      --ko-font-gloss:   ${THEME.fontGloss};

      /* Runtime vars written by tick ~7×/sec (see tick for details):
           --ko-progress  song-wide 0→1; drives the pill fill via clip-path
                          inset and (with CSS 160ms transition) chains each
                          write into a continuous slow-fill animation.
           --ko-ripe      0→1 with an intro/outro ramp; drives color-mix on
                          both pill halves so the pink and cyan deepen as
                          the obsession-dose "lands" through the song. */
      --ko-progress: 0;
      --ko-ripe:     0;
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — dark-plum prescription slip ==============================
       Three background layers (top-to-bottom in stack order):
         1. Fine dotted medical grid (14px grid, ~6% opacity) — gives the
            surface a prescription-pad feel without fighting the lyrics
         2. Subtle LR pink→cyan tint (7% opacity each side) — mirrors the
            MV's left-pink / right-cyan asymmetric composition
         3. Dark plum radial with slightly warmer upper-mid anchor
       Border: thin cream hairline at 35% opacity. Pink-glow outer ring at
       12% wraps the card in subtle heat matching the MV's ambient pink
       wash. Inset pink glow at 4% warms the card interior without
       washing out the text. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: ${THEME.cardPadding};
      background:
        radial-gradient(circle at 2px 2px, rgba(253, 244, 226, 0.055) 0.55px, transparent 1px) 0 0 / 14px 14px,
        linear-gradient(90deg,
          rgba(255, 77, 143, 0.07) 0%,
          transparent 38%, transparent 62%,
          rgba(74, 184, 255, 0.07) 100%),
        radial-gradient(ellipse 120% 90% at 50% 28%, #1a0a2a 0%, #0b0414 92%);
      border: 1.5px solid rgba(253, 244, 226, 0.35);
      border-radius: ${THEME.cardRadius};
      box-shadow:
        0 0 0 1px rgba(255, 77, 143, 0.12),
        0 14px 42px -10px rgba(0, 0, 0, 0.75),
        inset 0 1px 0 rgba(253, 244, 226, 0.1),
        inset 0 0 60px rgba(255, 77, 143, 0.04);
      transform: rotate(${THEME.cardTilt});
      transition: transform 320ms cubic-bezier(.2,.7,.3,1), opacity 380ms;
      isolation: isolate;
      overflow: visible;
    }

    /* Empty-state collapse during instrumental gaps */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardTilt}) scale(0.94);
    }

    /* ==== PROGRESS PILL — the signature ===================================
       Horizontal pill capsule across the top edge of the card. Positioned
       to the card's top at -20px, insets 24px from each edge so the pill
       ends sit cleanly below the corner bandaids. z-index 3 < bandaids'
       z-index 5 so the pill ends appear to slip UNDER the bandaids,
       reinforcing "the pill is taped to the card."

       Structure (four layers):
         .ko-pill-shell    cream glass outer — subtle vertical gradient,
                           inset highlights, drop shadow
         .ko-pill-fill     two-tone pink-left/cyan-right gradient, clipped
                           by --ko-progress via clip-path inset. Colors
                           deepen via color-mix(--ko-ripe).
         .ko-pill-seam     thin cream vertical line at 50% — visible
                           divider between the two halves
         .ko-pill-gloss    top highlight — white gradient sliver on the
                           upper third, suggests glass curvature */
    #ko-lyrics .ko-pill {
      position: absolute;
      top: -20px;
      left: 24px;
      right: 24px;
      height: 14px;
      pointer-events: none;
      z-index: 3;
    }
    #ko-lyrics .ko-pill-shell {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: linear-gradient(180deg,
        rgba(253, 244, 226, 0.17) 0%,
        rgba(253, 244, 226, 0.07) 55%,
        rgba(253, 244, 226, 0.03) 100%);
      border: 1.3px solid rgba(253, 244, 226, 0.46);
      box-shadow:
        inset 0 1px 1.5px rgba(255, 255, 255, 0.22),
        inset 0 -1px 1px rgba(0, 0, 0, 0.28),
        0 3px 10px -2px rgba(0, 0, 0, 0.55);
    }
    #ko-lyrics .ko-pill-fill {
      position: absolute;
      inset: 2.2px;
      border-radius: 999px;
      /* Two-tone split at 50%: soft→saturated pink on the left,
         soft→saturated cyan on the right. color-mix interpolates between
         the soft pre-ripe shade and the saturated ripe shade as --ko-ripe
         ramps 0→1 through the song. */
      background: linear-gradient(90deg,
        color-mix(in oklab, ${THEME.fwwPinkSoft}, ${THEME.fwwPink} calc(var(--ko-ripe, 0) * 100%)) 0%,
        color-mix(in oklab, ${THEME.fwwPinkSoft}, ${THEME.fwwPink} calc(var(--ko-ripe, 0) * 100%)) 50%,
        color-mix(in oklab, ${THEME.mcmCyanSoft}, ${THEME.mcmCyan} calc(var(--ko-ripe, 0) * 100%)) 50%,
        color-mix(in oklab, ${THEME.mcmCyanSoft}, ${THEME.mcmCyan} calc(var(--ko-ripe, 0) * 100%)) 100%);
      /* clip-path inset crops from the right side at progress=0 the right
         inset is 100% fully clipped, pill is empty; at progress=1 it's 0%
         fully revealed. round 999px preserves the capsule rounded end at
         the revealed edge so the fill does not show a sharp vertical cut
         as it animates. Paired with a 140ms rate-limited var write and a
         160ms linear transition, each clip-path step chains seamlessly
         into the next for continuous slow motion with ~7 writes/sec.
         Background transition is longer 2.2s so color deepening reads
         as a slow softening rather than a per-tick step. */
      clip-path: inset(0 calc((1 - var(--ko-progress, 0)) * 100%) 0 0 round 999px);
      transition: clip-path 160ms linear, background 2.2s linear;
      box-shadow: inset 0 1px 1.5px rgba(255, 255, 255, 0.42);
    }
    #ko-lyrics .ko-pill-seam {
      position: absolute;
      left: 50%;
      top: 1.5px;
      bottom: 1.5px;
      width: 1px;
      background: rgba(253, 244, 226, 0.55);
      transform: translateX(-0.5px);
      z-index: 2;
      pointer-events: none;
    }
    #ko-lyrics .ko-pill-gloss {
      position: absolute;
      top: 2px;
      left: 8%;
      right: 8%;
      height: 3px;
      border-radius: 3px;
      background: linear-gradient(180deg,
        rgba(255, 255, 255, 0.38) 0%,
        rgba(255, 255, 255, 0) 100%);
      pointer-events: none;
      z-index: 3;
    }

    /* ==== BANDAGE CORNERS — cream tape with pink cross =====================
       Opposite-corner placement (top-left + bottom-right), rotated -22°.
       z-index 5 > pill's 3 so the pill ends appear tucked under the
       bandages. SVG bandage has end-hole dots (typical bandaid perforation
       pattern) and a bright Fuwawa-pink cross in the middle. */
    #ko-lyrics .ko-bandage {
      position: absolute;
      width: 90px;
      height: 22px;
      z-index: 5;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
    }
    #ko-lyrics .ko-bandage.tl {
      top: -13px;
      left: -22px;
      transform: rotate(-22deg);
    }
    #ko-lyrics .ko-bandage.br {
      bottom: -13px;
      right: -22px;
      transform: rotate(-22deg);
    }
    #ko-lyrics .ko-bandage svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      display: block;
    }

    /* ==== TITLE TAG — prescription sticker (top-right) =====================
       Small cream rectangle with a pink ℞ prefix + Japanese title in Yuji
       Syuku brush. Slight 2.5° tilt for "hand-placed sticker" feel. */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -17px;
      right: 32px;
      padding: 4px 14px 5px 12px;
      background: linear-gradient(180deg, var(--ko-cream) 0%, var(--ko-cream-ink) 100%);
      color: var(--ko-bg-mid);
      font-family: var(--ko-font-display);
      font-size: 14.5px;
      font-weight: 400;
      letter-spacing: 0.025em;
      border-radius: 3px;
      border: 1.4px solid var(--ko-cream-deep);
      transform: rotate(2.5deg);
      box-shadow:
        0 3px 5px rgba(0, 0, 0, 0.42),
        inset 0 1px 0 rgba(255, 255, 255, 0.5);
      z-index: 6;
      white-space: nowrap;
    }
    #ko-lyrics .ko-tag::before {
      content: '℞';
      display: inline-block;
      margin-right: 6px;
      color: var(--ko-fww);
      font-family: var(--ko-font-display);
      font-size: 17px;
      font-weight: 400;
      vertical-align: -1px;
    }

    /* ==== ARTIST CREDIT — handwritten slip (bottom-left) ================== */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -12px;
      left: 30px;
      padding: 2.5px 12px 3.5px;
      background: linear-gradient(180deg, var(--ko-cream) 0%, var(--ko-cream-ink) 100%);
      color: var(--ko-bg-mid);
      font-family: var(--ko-font-en);
      font-style: italic;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.03em;
      border-radius: 2px;
      border: 1.2px solid var(--ko-cream-deep);
      transform: rotate(-1.5deg);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.38);
      z-index: 2;
      white-space: nowrap;
    }

    /* ==== LYRICS — JP Klee One with chromatic aberration ==================
       Cream base color with a magenta -1.1px / cyan +1.1px text-shadow
       pair, a soft pink halo at low opacity, and a deep dark drop-shadow
       for contrast against MV frames with bright pink/cyan backdrops.
       The 1.1px RGB offset on 46px text reads as a quiet glitch —
       echoes the MV's burned-in-kanji aesthetic without overwhelming
       the legibility. On colored chunk spans (wrapped by COLOR_POLL),
       the text-shadow inherits, producing a complementary-colored ghost
       on each colored word that reinforces the yandere-vaporwave
       signature. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 600;
      color: ${THEME.cream};
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.7em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      text-shadow:
        -1.1px 0 0 rgba(255, 77, 143, 0.72),
         1.1px 0 0 rgba(74, 184, 255, 0.58),
         0 0 14px rgba(255, 158, 199, 0.15),
         0 2px 4px rgba(0, 0, 0, 0.85);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — DM Mono italic, per-chunk color inherited from parent
       span's color attribute. OVERRIDE the parent's chromatic aberration:
       at 17px, a 1.1px RGB split is ~6% of text size and destroys
       legibility. Use a clean drop-shadow instead. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-style: italic;
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.015em;
      line-height: 1.1;
      padding-bottom: 4px;
      text-transform: lowercase;
      user-select: none;
      opacity: 0.95;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Cormorant Infant italic, cream, with a dotted pink
       prescription-form underline (repeating-gradient dots at ~2px every
       5px across 100% width, 1.3px high, at 40% pink opacity). The dotted
       line reads as the blank signature space on a prescription form,
       reinforcing the pharmaceutical-label metaphor. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-style: italic;
      font-weight: 500;
      color: ${THEME.cream};
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.85);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.9);
      font-weight: 400;
    }
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 5px;
      margin-top: 4px;
      background:
        repeating-linear-gradient(90deg,
          rgba(255, 77, 143, 0.42) 0 2px,
          transparent 2px 5px)
        bottom / 100% 1.3px no-repeat;
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

  // Bandage SVG — cream tape with end-hole perforation dots (4 per end,
  // 2x2 grid) and a Fuwawa-pink cross centered. preserveAspectRatio="none"
  // stretches the 90×22 viewBox to fill the .ko-bandage container — but
  // the dot circles and cross rectangles are small relative to the shape
  // so the distortion is imperceptible at the intended rendered size.
  const bandageSvg = `
    <svg viewBox="0 0 90 22" preserveAspectRatio="none">
      <rect x="0.5" y="0.5" width="89" height="21" rx="3.5" ry="3.5"
            fill="${THEME.cream}" stroke="${THEME.creamDeep}" stroke-width="0.55"/>
      <g fill="${THEME.creamDeep}" opacity="0.8">
        <circle cx="6"  cy="6"  r="0.7"/><circle cx="10" cy="6"  r="0.7"/>
        <circle cx="6"  cy="16" r="0.7"/><circle cx="10" cy="16" r="0.7"/>
        <circle cx="80" cy="6"  r="0.7"/><circle cx="84" cy="6"  r="0.7"/>
        <circle cx="80" cy="16" r="0.7"/><circle cx="84" cy="16" r="0.7"/>
      </g>
      <g transform="translate(45 11)" fill="${THEME.fwwPink}">
        <rect x="-4"   y="-0.9" width="8"   height="1.8" rx="0.4"/>
        <rect x="-0.9" y="-4"   width="1.8" height="8"   rx="0.4"/>
      </g>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-pill" id="ko-pill">
        <div class="ko-pill-shell"></div>
        <div class="ko-pill-fill"></div>
        <div class="ko-pill-seam"></div>
        <div class="ko-pill-gloss"></div>
      </div>
      <div class="ko-bandage tl">${bandageSvg}</div>
      <div class="ko-bandage br">${bandageSvg}</div>
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

  // --- Position tick: re-anchor the lyric zone to the video rect ---
  // Simplified vs Cherry Pop: the pill fill is driven by a normalized CSS
  // var (--ko-progress, 0..1) via clip-path percentage. It doesn't depend
  // on any absolute-pixel var, so there's no resize-snap transition dance
  // needed on fullscreen/theater toggles — the fill-width stays proportional
  // automatically.
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

  // --- Main tick: update lyric text + pill progress ---
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

    // ---- Progress + ripen (rate-limited) ----
    // Write at most every 140ms. CSS transitions on the pill match that
    // cadence (160ms linear for clip-path, 2.2s for background color) so
    // each write chains into the next. Running at RAF rate would be wasteful
    // — the pill fills ~0.76%/sec at a 131s song length, invisible per
    // frame anyway.
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        // Ripening ramp: pale for the first ~12% (intro — the dose hasn't
        // "hit" yet) and fully saturated by ~92% (the last few seconds sit
        // at full-saturation pink/cyan for the song's ending).
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
      // Empty/missing gloss renders a non-breaking space so the rt row
      // keeps its line height — an empty <rt> can collapse to zero on
      // some browsers and make the JP baseline jump between rubied and
      // un-rubied chunks on the same line. The agent emits "" as the
      // sentinel for "no label needed" (English-in-JP tokens, pure
      // punctuation, parenthetical refrain tags).
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
