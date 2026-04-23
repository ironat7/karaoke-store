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
    trackTag:   'Let me be with you',
    brandTag:   'FUWAMOCO',
    creditTag:  'Chobits OP · 2002',

    // Classical JP mincho + English serif italic: the typographic register
    // of a 2002-era CD booklet liner note. Work Sans gives a quiet sans
    // for the gloss micro-labels so they don't compete with the serifs.
    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Shippori+Mincho+B1:wght@500;700&' +
      'family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&' +
      'family=EB+Garamond:ital,wght@1,500&' +
      'family=Work+Sans:wght@500;600&' +
      'display=swap',
    fontJP:       '"Shippori Mincho B1", "Noto Serif JP", serif',
    fontEN:       '"Cormorant Garamond", "EB Garamond", Georgia, serif',
    fontCredit:   '"EB Garamond", "Cormorant Garamond", Georgia, serif',
    fontUi:       '"Work Sans", "Inter", system-ui, sans-serif',
    fontGloss:    '"Work Sans", "Inter", system-ui, sans-serif',

    // Booklet-paper palette. Warm ivory body, dusty-plum hairlines, deep
    // ink for text. No vivid primaries — everything sits a notch below
    // saturated so the card reads as printed paper, not display pixels.
    ivory:      '#F4E8D4',  // card body — warm paper ivory
    paper:      '#EDE0C8',  // card body deepening at edges
    parch:      '#DFCFB1',  // folded corner / torn edge
    ink:        '#2B1A26',  // primary text — deep plum-black
    inkSoft:    '#5A4452',  // secondary text — dusty plum
    rule:       '#6E4B5C',  // hairlines, small rules, decorative
    gold:       '#8A6A2A',  // muted antique gold — daisy center, credit accents
    accent:     '#9D4A6C',  // dusty rose — left heart, used sparingly

    // Typography — larger whitespace, classical scale.
    lyricFontSizeJP:     '46px',
    lyricLineHeightJP:   '2.10',
    lyricLetterSpacingJP:'0.018em',
    lyricFontSizeEN:     '24px',
    lyricLineHeightEN:   '1.35',
    lyricLetterSpacingEN:'0.01em',
    glossFontSize:       '12px',
    glossFontWeight:     '500',

    // Card shape — near-square booklet page, generous padding.
    cardRadius:  '2px',
    cardPadding: '42px 52px 46px',

    // Chunk colors — dusty, medium-saturation. Used ONLY as thin underlines
    // beneath the kanji/words, never as text fill. So they can be richer
    // than if they had to carry whole-character legibility.
    //  0 — dusty rose      (Mococo echo)
    //  1 — slate blue      (Fuwawa echo)
    //  2 — antique gold
    //  3 — sage green
    //  4 — muted amber
    //  5 — dusty lavender
    chunkColors: [
      '#C94472',  // 0 — dusty rose (bumped saturation for thin-line visibility)
      '#2E6FA4',  // 1 — slate blue
      '#9B7114',  // 2 — antique gold
      '#3D8A60',  // 3 — sage green
      '#B46420',  // 4 — muted amber
      '#744F91',  // 5 — dusty lavender
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
    { anchorX: 0.5, anchorY: 0.70, widthFrac: 0.72 },
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
      --ko-ivory:    ${THEME.ivory};
      --ko-paper:    ${THEME.paper};
      --ko-parch:    ${THEME.parch};
      --ko-ink:      ${THEME.ink};
      --ko-ink-soft: ${THEME.inkSoft};
      --ko-rule:     ${THEME.rule};
      --ko-gold:     ${THEME.gold};
      --ko-accent:   ${THEME.accent};

      --ko-font-jp:     ${THEME.fontJP};
      --ko-font-en:     ${THEME.fontEN};
      --ko-font-credit: ${THEME.fontCredit};
      --ko-font-ui:     ${THEME.fontUi};
      --ko-font-gloss:  ${THEME.fontGloss};

      /* Runtime vars written by the main tick ~7×/sec. */
      --ko-progress:  0;     /* 0.0 (hearts apart) → 1.0 (hearts meet)   */
      --ko-ripe:      0;     /* 0.0 → 1.0 — heart fills deepen           */
      --ko-track-w:   0px;   /* pixel width of progress track            */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — 2002 CD-booklet liner-notes page =========================
       Flat warm-ivory paper, single thin dusty-plum hairline border, faint
       horizontal hatching for paper grain. Near-square corners (2px). */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
      padding: ${THEME.cardPadding};
      background:
        /* faint horizontal hatching — 1px ink lines on 3px rhythm */
        repeating-linear-gradient(
          0deg,
          rgba(43, 26, 38, 0.018) 0 1px,
          transparent 1px 3px
        ),
        /* warm ivory vignette: lighter center, slightly deeper edges */
        radial-gradient(ellipse at center, ${THEME.ivory} 0%, ${THEME.paper} 100%);
      border-radius: ${THEME.cardRadius};
      box-shadow:
        /* inner single hairline (dusty plum, ~35% α) */
        inset 0 0 0 1px rgba(110, 75, 92, 0.40),
        /* outer margin rule — sits 7px out, thinner */
        0 0 0 6px ${THEME.ivory},
        0 0 0 7px rgba(110, 75, 92, 0.25),
        /* one soft drop shadow — paper feel, not gloss */
        0 14px 36px -14px rgba(43, 26, 38, 0.32);
      isolation: isolate;
      overflow: visible;
    }
    /* Top-center fleuron — a small pressed booklet mark sitting across the
       upper hairline. Printed-on-paper look: ivory ground punches a gap in
       the rule, plum ink glyph rests inside it. */
    #ko-lyrics .ko-slot::before {
      content: '❦';
      position: absolute;
      top: -13px;
      left: 50%;
      transform: translateX(-50%);
      font-family: var(--ko-font-en);
      font-size: 22px;
      font-style: normal;
      color: ${THEME.rule};
      background: ${THEME.ivory};
      padding: 0 14px;
      line-height: 22px;
      z-index: 4;
    }
    #ko-lyrics .ko-slot::after { content: none; }

    /* Empty-state collapse during instrumental gaps — gentle settle. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: scale(0.98);
      transition: opacity 420ms, transform 420ms cubic-bezier(.2,.7,.3,1);
    }
    #ko-lyrics .ko-slot {
      transition: opacity 420ms, transform 420ms cubic-bezier(.2,.7,.3,1);
    }

    /* ==== TOP-LEFT — FUWAMOCO spaced small caps ===========================
       Very thin uppercase sans, letter-spaced wide, set across the upper
       margin like a chapter mark in a book. No capsule, no color, no tilt. */
    #ko-lyrics .ko-brand-tag {
      position: absolute;
      top: -22px;
      left: 48px;
      padding: 0;
      background: transparent;
      color: ${THEME.rule};
      font-family: var(--ko-font-ui);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.60em;
      border: none;
      border-radius: 0;
      transform: none;
      box-shadow: none;
      text-transform: uppercase;
      text-shadow: none;
      z-index: 5;
      white-space: nowrap;
    }

    /* Icon row from the merch-card era — hidden in this direction. */
    #ko-lyrics .ko-icon-row { display: none !important; }

    /* Hook capsule — hidden. The track title lives in the fleuron/
       margin-caption area now, not as a gradient bubble. */
    #ko-lyrics .ko-hook-tag {
      position: absolute;
      bottom: -24px;
      right: 50%;
      transform: translateX(50%);
      padding: 0;
      background: transparent;
      color: ${THEME.inkSoft};
      font-family: var(--ko-font-en);
      font-size: 13px;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.04em;
      border: none;
      border-radius: 0;
      box-shadow: none;
      text-shadow: none;
      z-index: 3;
      white-space: nowrap;
    }

    /* ==== BOTTOM-LEFT — Chobits credit ====================================
       Italic serif, small, no pill. Reads as a footnote, not a badge. */
    #ko-lyrics .ko-credit-tag {
      position: absolute;
      bottom: -20px;
      left: 48px;
      padding: 0;
      background: transparent;
      color: ${THEME.inkSoft};
      font-family: var(--ko-font-credit);
      font-size: 13px;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.05em;
      border: none;
      border-radius: 0;
      transform: none;
      box-shadow: none;
      text-shadow: none;
      z-index: 3;
      white-space: nowrap;
    }

    /* ==== PRESSED DAISY — tiny corner ornament ===========================
       Sits right of FUWAMOCO on the top margin. Small, paper-toned, no
       drop shadow — reads as an inked illustration not a sticker. */
    #ko-lyrics .ko-daisy {
      position: absolute;
      top: -18px;
      left: auto;
      right: 48px;
      width: 22px;
      height: 22px;
      transform: rotate(8deg);
      filter: none;
      opacity: 0.85;
      z-index: 4;
    }
    #ko-lyrics .ko-daisy svg { width: 100%; height: 100%; display: block; }
    #ko-lyrics .ko-daisy .petal {
      fill: ${THEME.paper};
      stroke: ${THEME.rule};
      stroke-width: 0.7;
    }
    #ko-lyrics .ko-daisy .core {
      fill: ${THEME.gold};
      stroke: #6C521F;
      stroke-width: 0.6;
    }

    /* ==== SIGNATURE — hairline rule + outlined pencil hearts ==============
       A single dashed pencil rule sits across the card's bottom margin.
       A dusty-rose heart (left tip) and a slate-plum heart (right tip)
       travel inward as --ko-progress goes 0→1, meeting at center at 100%.
       No glow, no filled fills at start — the hearts WARM in as --ko-ripe
       rises, like ink slowly saturating paper. */
    #ko-lyrics .ko-progress {
      position: absolute;
      left: 56px;
      right: 56px;
      bottom: -14px;
      height: 20px;
      z-index: 2;
      pointer-events: none;
    }
    #ko-lyrics .ko-progress-track {
      position: absolute;
      left: 22px;
      right: 22px;
      top: 9px;
      height: 1px;
      pointer-events: none;
    }
    /* Base dashed rule — the "unwalked" distance. */
    #ko-lyrics .ko-progress-track::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        to right,
        ${THEME.rule} 0 3px,
        transparent 3px 7px
      );
      opacity: 0.45;
    }
    /* Solid walked portion — fills from BOTH edges inward, matching the
       hearts' direction of travel. Left half dusty rose, right dusty plum. */
    #ko-lyrics .ko-progress-track::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(to right, ${THEME.accent}, ${THEME.accent}) left/calc(var(--ko-progress, 0) * 50%) 100% no-repeat,
        linear-gradient(to left,  ${THEME.rule},   ${THEME.rule})   right/calc(var(--ko-progress, 0) * 50%) 100% no-repeat;
      opacity: 0.65;
    }

    /* Hearts — small outlined pencil drawings, no glow. Fill interpolates
       from transparent → full via --ko-ripe so they "ink in" during the
       song rather than beating brashly. */
    #ko-lyrics .ko-heart {
      position: absolute;
      top: -3px;
      width: 14px;
      height: 14px;
      transition: transform 160ms linear;
      will-change: transform;
      pointer-events: none;
    }
    #ko-lyrics .ko-heart svg { width: 100%; height: 100%; display: block; overflow: visible; }
    #ko-lyrics .ko-heart .heart-body {
      stroke-width: 1.4;
      stroke-linejoin: round;
    }

    /* Mococo (left tip) — dusty rose outline, warms into rose fill. */
    #ko-lyrics .ko-heart.pink {
      left: 4px;
      transform: translateX(calc((var(--ko-track-w, 500px) - 40px) * var(--ko-progress) * 0.5));
    }
    #ko-lyrics .ko-heart.pink .heart-body {
      stroke: ${THEME.accent};
      fill: color-mix(in oklab, transparent, ${THEME.accent} calc(var(--ko-ripe) * 85%));
      transition: fill 1.6s linear;
    }
    /* Fuwawa (right tip) — dusty plum outline, warms into plum fill. */
    #ko-lyrics .ko-heart.blue {
      right: 4px;
      transform: translateX(calc((var(--ko-track-w, 500px) - 40px) * var(--ko-progress) * -0.5));
    }
    #ko-lyrics .ko-heart.blue .heart-body {
      stroke: ${THEME.rule};
      fill: color-mix(in oklab, transparent, ${THEME.rule} calc(var(--ko-ripe) * 80%));
      transition: fill 1.6s linear;
    }
    /* Legacy inner-beat scaler — keep no-op to satisfy skeleton DOM. */
    #ko-lyrics .ko-heart .heart-inner {
      width: 100%;
      height: 100%;
    }
    #ko-lyrics .ko-heart::after { content: none; }

    /* ==== LYRICS ==========================================================
       Dark plum ink over ivory paper. Chunk color is conveyed ENTIRELY by
       a thin underline — the text itself stays fully legible dark ink at
       every position. The inline style="color: <hex>" set by the skeleton
       becomes currentColor, which text-decoration inherits; -webkit-text-
       fill-color overrides the text fill to ink without clobbering the
       underline color. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      color: ${THEME.ink};
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.5em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
      text-shadow: none;
    }
    /* Chunk color is drawn as a background-gradient bar pinned to the
       span's content-box bottom. More reliable than text-decoration when
       spans contain <ruby> — text-decoration-color can get clobbered by
       the ruby rendering path in some browsers. currentColor references
       the span's inline chunk-color attribute. */
    #ko-lyrics .ko-line-jp span {
      -webkit-text-fill-color: ${THEME.ink};
      padding-bottom: 4px;
      background-image: linear-gradient(currentColor, currentColor);
      background-size: 100% 2.6px;
      background-position: 0 100%;
      background-repeat: no-repeat;
    }

    /* Gloss rt — tiny serif-neutral caps; dusty plum ink, always. Never
       picks up chunk color (those live on the kanji underline). */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      color: ${THEME.inkSoft} !important;
      -webkit-text-fill-color: ${THEME.inkSoft} !important;
      letter-spacing: 0.08em;
      line-height: 1;
      padding-bottom: 4px;
      text-transform: uppercase;
      user-select: none;
      opacity: 0.82;
      text-shadow: none;
      text-decoration: none !important;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN — Cormorant italic, dark plum ink. Same underline trick: chunk
       color becomes the underline, ink carries the body. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 500;
      font-style: italic;
      color: ${THEME.ink};
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      margin-top: 10px;
      padding-top: 14px;
      text-shadow: none;
    }
    /* Same underline mechanic for EN — background-gradient bar keyed to
       currentColor (the inline chunk color set by the skeleton). */
    #ko-lyrics .ko-line-en span {
      -webkit-text-fill-color: ${THEME.ink};
      padding-bottom: 2px;
      background-image: linear-gradient(currentColor, currentColor);
      background-size: 100% 1.8px;
      background-position: 0 100%;
      background-repeat: no-repeat;
    }
    /* Thin dashed plum divider above the EN line — reads as the ruled
       gutter between a JP stanza and its translator's note. */
    #ko-lyrics .ko-line-en:not(:empty)::before {
      content: '';
      position: absolute;
      left: 38%;
      right: 38%;
      top: 0;
      height: 1px;
      background: repeating-linear-gradient(
        to right,
        ${THEME.rule} 0 3px,
        transparent 3px 7px
      );
      opacity: 0.55;
    }
    /* English-original song mode (lang === "en"): smaller, roman. */
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.92);
      font-style: normal;
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
