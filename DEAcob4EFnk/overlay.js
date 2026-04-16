// ============================================================================
// KARAOKE OVERLAY — ロミオとシンデレラ / Romeo and Cinderella (cover by moon jelly)
// ----------------------------------------------------------------------------
// Concept: the card is a porcelain-doll storybook page. Aged cream parchment,
// soft rose scrollwork, dark-rose mincho ink, italic mauve Cormorant narration.
// The signature is a red silk ribbon running across the bottom of the page
// with a forbidden apple marker that slides left→right over the song and
// PROGRESSIVELY LOSES BITES as the song plays — pristine at 0%, first bite at
// ~20%, half-eaten by 50%, core-with-seeds at 100%. The apple's stem carries
// a tiny gold bell that swings on every new line (real lyric:
// 鐘が鳴り響くシンデレラ — "the bell tolls for Cinderella"). The eating
// encodes the song's central metaphor — forbidden fruit, innocence consumed —
// directly into the timebar.
//
// MV read: a single painterly still of a sleeping-beauty / reclining figure
// (platinum-pink braided hair, pearls, blue-green eyes, cream lace gown with
// pink ribbons) cradling a bright red apple on rose-velvet quilt and scattered
// pink roses. Aesthetic: lolita/dollhouse romance, fairy-tale mashup (Juliet,
// Cinderella, Eve, Snow White, Red Riding Hood).
// ============================================================================

(() => {

  const THEME = {
    verseLabel: '— verse I —',

    fontsHref: 'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@500;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500;1,600&family=Cormorant+Upright:ital,wght@0,500;1,500&family=Cinzel:wght@400;500&display=swap',
    fontJP:      '"Shippori Mincho B1", "Noto Serif JP", serif',
    fontSerif:   '"Cormorant Garamond", serif',
    fontGloss:   '"Cormorant Upright", "Cormorant Garamond", serif',
    fontLabel:   '"Cinzel", "Cormorant Garamond", serif',

    // --- MV palette (cream parchment + porcelain-doll rose + apple red) ---
    parchment:    '#f4e6d6',   // aged cream page
    parchmentDk:  '#eadbc7',   // shadow fold
    inkRose:      '#4a2530',   // primary ink (dark rose-brown)
    inkSoft:      '#704256',   // secondary ink / EN narration
    rose:         '#b04068',   // deep rose accent
    rosePale:     '#e7b3c6',   // pale ribbon bow pink
    burgundy:     '#6a2a3f',   // velvet backdrop
    gold:         '#a88438',   // hair jewelry gold
    appleRed:     '#b8282f',
    appleDark:    '#7a1820',
    appleShine:   '#e76671',
    coreBeige:    '#eacfa4',
    coreShadow:   '#c19a6b',
    seed:         '#3a1418',
    leafGreen:    '#6a8a5a',
    leafDk:       '#3a5a2a',
    bellGold:     '#c8932a',
    bellHi:       '#f0d880',

    // Six chunk-color slots — all deep enough to read as ink on cream parchment.
    chunkColors: ['#b04068', '#4a8a88', '#a88438', '#b8282f', '#5a3349', '#c46a5e'],
  };

  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

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

  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.66, widthFrac: 0.64 },
    window.__koPosition || {}
  );

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  if (THEME.fontsHref && !document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    /* ==== LOCKED PLUMBING =============================================== */
    #karaoke-root {
      position: fixed;
      inset: 0;
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
      --ko-parchment:   ${THEME.parchment};
      --ko-parch-dk:    ${THEME.parchmentDk};
      --ko-ink:         ${THEME.inkRose};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-rose:        ${THEME.rose};
      --ko-rose-pale:   ${THEME.rosePale};
      --ko-burgundy:    ${THEME.burgundy};
      --ko-gold:        ${THEME.gold};
      --ko-apple-red:   ${THEME.appleRed};
      --ko-apple-dk:    ${THEME.appleDark};
      --ko-apple-shine: ${THEME.appleShine};
      --ko-core-beige:  ${THEME.coreBeige};
      --ko-core-sh:     ${THEME.coreShadow};
      --ko-seed:        ${THEME.seed};
      --ko-leaf:        ${THEME.leafGreen};
      --ko-leaf-dk:     ${THEME.leafDk};
      --ko-bell:        ${THEME.bellGold};
      --ko-bell-hi:     ${THEME.bellHi};

      --ko-font-jp:     ${THEME.fontJP};
      --ko-font-serif:  ${THEME.fontSerif};
      --ko-font-gloss:  ${THEME.fontGloss};
      --ko-font-label:  ${THEME.fontLabel};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD: parchment page ========================================== */
    /* A soft-rotated aged cream page. Multi-layer paper: fold-shadow underlay,
       foxing-dot texture, warm vignette at edges. Overflow visible so corner
       roses and the apple ribbon can escape the paper's bounds. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      padding: 30px 44px 50px;
      background:
        /* foxing dots (age spots) */
        radial-gradient(circle at 12% 18%, rgba(138, 74, 90, 0.045) 0 1.5px, transparent 2px),
        radial-gradient(circle at 78% 24%, rgba(138, 74, 90, 0.035) 0 1px, transparent 1.6px),
        radial-gradient(circle at 42% 62%, rgba(138, 74, 90, 0.04) 0 1.2px, transparent 1.8px),
        radial-gradient(circle at 88% 72%, rgba(138, 74, 90, 0.03) 0 1px, transparent 1.6px),
        radial-gradient(circle at 22% 84%, rgba(138, 74, 90, 0.04) 0 1.2px, transparent 1.8px),
        /* fine paper grain */
        radial-gradient(circle at 30% 40%, rgba(176, 64, 104, 0.025) 0 0.5px, transparent 1px) 0 0 / 4px 4px,
        /* edge vignette — burgundy fade inward */
        radial-gradient(ellipse 130% 110% at 50% 50%,
          rgba(244, 230, 214, 1) 0%,
          rgba(244, 230, 214, 1) 55%,
          rgba(234, 212, 194, 1) 85%,
          rgba(214, 182, 170, 1) 100%),
        /* base parchment */
        linear-gradient(180deg, #f6e9d8, #f0dfc9 85%, #e8d4bc);
      border: none;
      box-shadow:
        /* inner hairline gold */
        inset 0 0 0 1px rgba(168, 132, 56, 0.35),
        /* inner rose framing line */
        inset 0 0 0 6px rgba(244, 230, 214, 1),
        inset 0 0 0 7px rgba(176, 64, 104, 0.55),
        inset 0 0 0 8px rgba(244, 230, 214, 1),
        inset 0 0 0 10px rgba(176, 64, 104, 0.18),
        /* page fold shadow (under-page to the right) */
        3px 6px 0 rgba(138, 74, 90, 0.18),
        /* soft drop */
        0 16px 36px -12px rgba(70, 30, 45, 0.55),
        /* outer glow to lift from bg */
        0 0 0 1px rgba(70, 30, 45, 0.12);
      transform: rotate(-0.6deg);
      transition: transform 260ms cubic-bezier(.2,.7,.3,1), opacity 400ms;
      isolation: isolate;
      overflow: visible;
      border-radius: 1px 2px 1px 2px;
    }
    /* Empty-state collapse — instrumental gaps */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(-0.6deg) scale(0.94);
    }

    /* ==== Corner rose ornaments (four) ==================================
       CSS-drawn five-petal roses via layered radial gradients. Subtle, small,
       rotated slightly so each feels hand-placed. */
    #ko-lyrics .ko-rose {
      position: absolute;
      width: 22px; height: 22px;
      pointer-events: none;
      z-index: 3;
      background:
        /* center dot */
        radial-gradient(circle at 50% 50%, ${THEME.burgundy} 0 1.5px, transparent 2px),
        /* inner petal ring */
        radial-gradient(circle at 50% 30%, ${THEME.rose} 0 2.5px, transparent 3px),
        radial-gradient(circle at 70% 45%, ${THEME.rose} 0 2.5px, transparent 3px),
        radial-gradient(circle at 60% 72%, ${THEME.rose} 0 2.5px, transparent 3px),
        radial-gradient(circle at 30% 68%, ${THEME.rose} 0 2.5px, transparent 3px),
        radial-gradient(circle at 28% 40%, ${THEME.rose} 0 2.5px, transparent 3px),
        /* outer petal ring (paler) */
        radial-gradient(circle at 50% 12%, ${THEME.rosePale} 0 3.5px, transparent 4px),
        radial-gradient(circle at 85% 48%, ${THEME.rosePale} 0 3.5px, transparent 4px),
        radial-gradient(circle at 70% 88%, ${THEME.rosePale} 0 3.5px, transparent 4px),
        radial-gradient(circle at 15% 82%, ${THEME.rosePale} 0 3.5px, transparent 4px),
        radial-gradient(circle at 12% 32%, ${THEME.rosePale} 0 3.5px, transparent 4px);
      filter: drop-shadow(0 1px 0.5px rgba(70, 30, 45, 0.25));
    }
    /* Leaves extending from each rose as thin curved lines */
    #ko-lyrics .ko-rose::before, #ko-lyrics .ko-rose::after {
      content: '';
      position: absolute;
      width: 14px; height: 5px;
      background: radial-gradient(ellipse at 15% 50%, ${THEME.leafGreen}, ${THEME.leafDk} 70%, transparent 100%);
      border-radius: 0 100% 100% 0 / 0 50% 50% 0;
      opacity: 0.75;
    }
    #ko-lyrics .ko-rose.rose-tl { top: -11px; left: -11px; transform: rotate(-18deg); }
    #ko-lyrics .ko-rose.rose-tr { top: -11px; right: -11px; transform: rotate(90deg); }
    #ko-lyrics .ko-rose.rose-bl { bottom: -11px; left: -11px; transform: rotate(-90deg); }
    #ko-lyrics .ko-rose.rose-br { bottom: -11px; right: -11px; transform: rotate(108deg); }
    #ko-lyrics .ko-rose.rose-tl::before { top: 18px; left: 14px; transform: rotate(25deg); }
    #ko-lyrics .ko-rose.rose-tl::after  { top: 12px; left: 16px; transform: rotate(-12deg); }
    #ko-lyrics .ko-rose.rose-tr::before { top: 18px; left: 14px; transform: rotate(25deg); }
    #ko-lyrics .ko-rose.rose-tr::after  { top: 12px; left: 16px; transform: rotate(-12deg); }
    #ko-lyrics .ko-rose.rose-bl::before { top: 18px; left: 14px; transform: rotate(25deg); }
    #ko-lyrics .ko-rose.rose-bl::after  { top: 12px; left: 16px; transform: rotate(-12deg); }
    #ko-lyrics .ko-rose.rose-br::before { top: 18px; left: 14px; transform: rotate(25deg); }
    #ko-lyrics .ko-rose.rose-br::after  { top: 12px; left: 16px; transform: rotate(-12deg); }

    /* ==== Verse label (top-center) ======================================
       FIRE_POLL updates textContent to "— verse II —" etc. per line. */
    #ko-lyrics .ko-verse {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      padding: 2px 14px;
      background: ${THEME.parchment};
      font-family: var(--ko-font-label);
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.38em;
      color: ${THEME.burgundy};
      font-style: italic;
      text-transform: lowercase;
      white-space: nowrap;
      z-index: 4;
      box-shadow: 0 0 0 1px rgba(176, 64, 104, 0.25);
    }

    /* ==== JP line: dark rose mincho ink on parchment ==================== */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.inkRose};
      paint-order: stroke fill;
      -webkit-text-stroke: 0.8px ${THEME.parchment};
      font-size: 40px;
      line-height: 2.05;
      padding-top: 0.3em;
      letter-spacing: 0.045em;
      text-shadow:
        0 0.5px 0 rgba(244, 230, 214, 0.8),
        0 1px 2px rgba(70, 30, 45, 0.18);
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: 0.8px ${THEME.parchment};
    }
    /* Ruby gloss — tiny italic serif, ink-soft, sits close to the JP */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: 15px;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.02em;
      line-height: 1.15;
      padding-bottom: 3px;
      color: inherit;
      paint-order: stroke fill;
      -webkit-text-stroke: 0.5px ${THEME.parchment};
      text-shadow: 0 0.5px 0 rgba(244, 230, 214, 0.6);
      text-transform: none;
      user-select: none;
      opacity: 0.94;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* ==== EN line: italic mauve Cormorant narration ===================== */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-serif);
      font-weight: 500;
      font-style: italic;
      color: ${THEME.inkSoft};
      paint-order: stroke fill;
      -webkit-text-stroke: 0.6px ${THEME.parchment};
      font-size: 27px;
      line-height: 1.28;
      letter-spacing: 0.005em;
      text-shadow: 0 0.5px 0 rgba(244, 230, 214, 0.7);
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      margin-top: 4px;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: 0.6px ${THEME.parchment};
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 24px;
      font-weight: 400;
    }
    /* Delicate dashed-rose hairline above EN — only when EN has content */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-top: 10px;
      background:
        radial-gradient(circle at 50% 2px, ${THEME.rose} 0 1.2px, transparent 1.6px) 50% 0 / 8px 4px repeat-x;
    }

    /* ==== RED SILK RIBBON (progress track) ==============================
       A flat ribbon with subtle silk highlight and diagonal selvage ends. */
    #ko-lyrics .ko-ribbon {
      position: absolute;
      bottom: 22px;
      left: 6%;
      right: 6%;
      height: 3px;
      background: linear-gradient(180deg,
        ${THEME.appleShine} 0%,
        ${THEME.rose} 40%,
        ${THEME.burgundy} 100%);
      box-shadow:
        0 1px 2px rgba(70, 30, 45, 0.35),
        inset 0 0.5px 0 rgba(255, 218, 220, 0.8);
      border-radius: 1.5px;
      z-index: 3;
      pointer-events: none;
    }
    /* Forked ribbon ends (selvage) */
    #ko-lyrics .ko-ribbon::before, #ko-lyrics .ko-ribbon::after {
      content: '';
      position: absolute;
      top: -1px;
      width: 10px;
      height: 5px;
      background: linear-gradient(180deg, ${THEME.rose}, ${THEME.burgundy});
      box-shadow: inset 0 0.5px 0 rgba(255, 218, 220, 0.6);
    }
    #ko-lyrics .ko-ribbon::before {
      left: -8px;
      clip-path: polygon(100% 0, 0 20%, 40% 50%, 0 80%, 100% 100%);
    }
    #ko-lyrics .ko-ribbon::after {
      right: -8px;
      clip-path: polygon(0 0, 100% 20%, 60% 50%, 100% 80%, 0 100%);
    }

    /* ==== THE APPLE (self-consuming progress marker) ====================
       Rides the ribbon; slides left→right as the song progresses. Bite grows
       from 0px to ~18px (width ~30px). CORE (beige with two seeds) shows
       through as SKIN (red) is clipped away by a radial mask from top-right.
       Small continuous bob + the STEM BELL gets .kbell swing per new line. */
    #ko-lyrics .ko-apple {
      position: absolute;
      bottom: 6px;
      left: 6%;
      width: 30px;
      height: 34px;
      z-index: 5;
      pointer-events: none;
      transition: left 0.4s linear;
      animation: ko-apple-bob 2.8s ease-in-out infinite;
      filter: drop-shadow(0 2px 2px rgba(70, 20, 30, 0.45));
      --bite-px: 0;
    }
    @keyframes ko-apple-bob {
      0%,100% { transform: translateY(0) rotate(-2deg); }
      50%     { transform: translateY(-1.5px) rotate(2deg); }
    }
    /* Core — revealed as the apple is eaten. Beige flesh with two dark seeds. */
    #ko-lyrics .ko-apple-core {
      position: absolute;
      inset: 4px 0 0 0;
      background:
        radial-gradient(ellipse at 50% 42%, ${THEME.coreBeige} 0%, ${THEME.coreShadow} 75%, #8a6838 100%);
      border-radius: 52% 52% 48% 48% / 55% 55% 50% 50%;
      box-shadow: inset 0 -2px 3px rgba(90, 50, 20, 0.4);
    }
    /* Two seeds — visible when skin is chewed away */
    #ko-lyrics .ko-apple-core::before, #ko-lyrics .ko-apple-core::after {
      content: '';
      position: absolute;
      width: 3px; height: 5px;
      background: radial-gradient(ellipse at 30% 30%, ${THEME.seed} 40%, #1a0608 100%);
      border-radius: 50% 50% 50% 50% / 70% 70% 30% 30%;
      box-shadow: 0 0.5px 0 rgba(255, 220, 180, 0.3);
    }
    #ko-lyrics .ko-apple-core::before { top: 42%; left: 40%; transform: rotate(-18deg); }
    #ko-lyrics .ko-apple-core::after  { top: 50%; left: 55%; transform: rotate(15deg); }

    /* Skin — the red layer. mask-image cuts a growing circle from top-right
       as --bite-px grows. 0px = no bite; ~16px = half-eaten; ~22px = core only. */
    #ko-lyrics .ko-apple-skin {
      position: absolute;
      inset: 4px 0 0 0;
      background:
        radial-gradient(circle at 30% 28%, ${THEME.appleShine} 0%, ${THEME.appleShine} 8%, ${THEME.appleRed} 45%, ${THEME.appleDark} 100%);
      border-radius: 52% 52% 48% 48% / 55% 55% 50% 50%;
      box-shadow:
        inset 2px 4px 6px rgba(255, 180, 180, 0.45),
        inset -3px -4px 6px rgba(60, 10, 20, 0.55);
      mask-image: radial-gradient(
        circle at 75% 18%,
        transparent 0,
        transparent calc(var(--bite-px) * 1px),
        black calc(var(--bite-px) * 1px + 0.8px)
      );
      -webkit-mask-image: radial-gradient(
        circle at 75% 18%,
        transparent 0,
        transparent calc(var(--bite-px) * 1px),
        black calc(var(--bite-px) * 1px + 0.8px)
      );
    }
    /* Stem */
    #ko-lyrics .ko-apple-stem {
      position: absolute;
      top: 0;
      left: 14px;
      width: 2.5px;
      height: 6px;
      background: linear-gradient(180deg, #6a4020, #3a2010);
      border-radius: 1px 1px 0 0;
      transform: rotate(14deg);
      transform-origin: bottom;
    }
    /* Leaf */
    #ko-lyrics .ko-apple-leaf {
      position: absolute;
      top: 1px;
      left: 17px;
      width: 9px;
      height: 5px;
      background:
        radial-gradient(ellipse at 15% 50%, ${THEME.leafGreen} 25%, ${THEME.leafDk} 90%);
      border-radius: 0 100% 30% 0 / 0 100% 70% 0;
      transform: rotate(-24deg);
      box-shadow: inset 0.5px 0 0 rgba(255,255,255,0.3);
    }
    /* Tiny gold bell hanging off the stem. Pivot is ABOVE the bell so it
       swings like a real pendulum. Animation fires on each new line. */
    #ko-lyrics .ko-apple-bell {
      position: absolute;
      top: 2px;
      left: 7px;
      width: 7px;
      height: 8px;
      background:
        radial-gradient(circle at 35% 30%, ${THEME.bellHi} 0%, ${THEME.bellGold} 55%, #7a5a18 100%);
      border-radius: 50% 50% 50% 50% / 45% 45% 70% 70%;
      box-shadow:
        inset 0.5px 1px 0 rgba(255, 240, 180, 0.5),
        inset -0.5px -1px 0 rgba(60, 40, 10, 0.4),
        0 1px 1px rgba(70, 40, 10, 0.5);
      transform-origin: 50% -120%;
      transform: rotate(0deg);
    }
    #ko-lyrics .ko-apple-bell::before {
      /* clapper / mouth */
      content: '';
      position: absolute;
      bottom: -0.5px;
      left: 50%;
      transform: translateX(-50%);
      width: 5px;
      height: 1.5px;
      background: #6a4820;
      border-radius: 0 0 3px 3px / 0 0 2px 2px;
    }
    #ko-lyrics .ko-apple-bell::after {
      /* hanging cord from stem to bell */
      content: '';
      position: absolute;
      top: -5px;
      left: 50%;
      width: 1px;
      height: 5px;
      background: #5a2e2e;
      transform: translateX(-50%) rotate(-8deg);
      transform-origin: bottom;
    }

    /* ==== Line-change animation: bell ring + soft shimmer ================ */
    @keyframes ko-bell-ring {
      0%   { transform: rotate(0deg); }
      15%  { transform: rotate(22deg); }
      38%  { transform: rotate(-15deg); }
      58%  { transform: rotate(10deg); }
      78%  { transform: rotate(-5deg); }
      100% { transform: rotate(0deg); }
    }
    #ko-lyrics .ko-slot.kbell .ko-apple-bell {
      animation: ko-bell-ring 720ms cubic-bezier(.3,.05,.4,1) both;
    }
    /* Soft gold glow from the bell on each ring */
    #ko-lyrics .ko-slot.kbell .ko-apple-bell {
      box-shadow:
        inset 0.5px 1px 0 rgba(255, 240, 180, 0.7),
        inset -0.5px -1px 0 rgba(60, 40, 10, 0.4),
        0 0 6px rgba(232, 200, 100, 0.85),
        0 1px 1px rgba(70, 40, 10, 0.5);
    }
    /* Page-shimmer on JP: a soft cream light-wash sweeps L→R on new line */
    @keyframes ko-shimmer-jp {
      0%   { opacity: 0; transform: translateX(-100%); }
      30%  { opacity: 1; }
      70%  { opacity: 1; }
      100% { opacity: 0; transform: translateX(100%); }
    }
    #ko-lyrics .ko-line-jp { overflow: visible; }
    #ko-lyrics .ko-slot.kbell .ko-line-jp::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 240, 220, 0.5) 45%,
        rgba(255, 248, 230, 0.72) 50%,
        rgba(255, 240, 220, 0.5) 55%,
        transparent 100%);
      mix-blend-mode: overlay;
      pointer-events: none;
      animation: ko-shimmer-jp 560ms cubic-bezier(.3,.6,.5,1) both;
      z-index: 4;
    }
    /* EN fade-in on line change */
    @keyframes ko-en-rise {
      0%   { opacity: 0.25; transform: translateY(2px); }
      100% { opacity: 1;    transform: translateY(0); }
    }
    #ko-lyrics .ko-slot.kbell .ko-line-en {
      animation: ko-en-rise 480ms ease-out 80ms both;
    }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-rose rose-tl"></div>
      <div class="ko-rose rose-tr"></div>
      <div class="ko-rose rose-bl"></div>
      <div class="ko-rose rose-br"></div>
      <div class="ko-verse" id="ko-slot-tag">${escHTML(THEME.verseLabel)}</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="ko-ribbon"></div>
      <div class="ko-apple" id="ko-apple">
        <div class="ko-apple-core"></div>
        <div class="ko-apple-skin"></div>
        <div class="ko-apple-stem"></div>
        <div class="ko-apple-leaf"></div>
        <div class="ko-apple-bell"></div>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

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

  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';

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
      lyrics.style.left     = (r.left + r.width * p.anchorX) + 'px';
      lyrics.style.top      = (r.top  + r.height * p.anchorY) + 'px';
      lyrics.style.width    = (r.width * p.widthFrac) + 'px';
      lyrics.style.maxWidth = (r.width * p.widthFrac) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

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

  // ==========================================================================
  // APPLE PROGRESS TICK — slides the apple L→R across the ribbon and grows
  // the bite-circle as the song proceeds. 200ms cadence is ample for a
  // progress indicator; half-percent steps smooth the sliding.
  //
  // Apple position:
  //   left% = 6 + 88 * pct/100   (ribbon runs 6% → 94% of card width)
  //
  // Bite growth:
  //   bite-px = 0 at 0% → ~22px at 100% (core only)
  // ==========================================================================
  let _lastAppPct = -1;
  const APPLE_TICK = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(APPLE_TICK); return; }
    const v = document.querySelector('video');
    if (!v || !isFinite(v.currentTime)) return;
    const sl = window.__setlist;
    let idx = -1;
    for (let i = 0; i < sl.length; i++) {
      if (v.currentTime >= sl[i].s && v.currentTime < sl[i].end) { idx = i; break; }
    }
    if (idx < 0) return;
    const song = sl[idx];
    const inSong = v.currentTime - song.s;
    const songDur = song.dur || 240;
    const pct = Math.min(100, Math.max(0, (inSong / songDur) * 100));
    const halfPct = Math.round(pct * 2) / 2;
    if (halfPct === _lastAppPct) return;
    _lastAppPct = halfPct;
    const apple = document.getElementById('ko-apple');
    if (!apple) return;
    // Apple slides along ribbon (ribbon spans 6%→94%)
    apple.style.left = (6 + (88 * halfPct / 100)) + '%';
    // Bite grows — start unblemished for the first ~8% of the song (the
    // introduction is innocent), then accelerates. Max bite ~22px reveals
    // the core fully.
    const biteStart = 8;
    const biteProg = Math.max(0, (halfPct - biteStart) / (100 - biteStart));
    const bitePx = (biteProg * 22).toFixed(2);
    apple.style.setProperty('--bite-px', bitePx);
  }, 200);

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

  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

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

  // ==========================================================================
  // NEW-LINE BELL TRIGGER — retargeted from the skeleton's chromatic fire.
  // On every genuine JP line transition: update verse counter to next roman
  // numeral, add .kbell class to ring the stem bell + shimmer the JP page.
  // Stamp-check guards against ruby-expansion double-fire.
  // ==========================================================================
  const romans = [
    '', 'I','II','III','IV','V','VI','VII','VIII','IX','X',
    'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX',
    'XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX',
    'XXXI','XXXII','XXXIII','XXXIV','XXXV','XXXVI','XXXVII','XXXVIII','XXXIX','XL',
    'XLI','XLII','XLIII','XLIV','XLV','XLVI','XLVII','XLVIII','XLIX','L',
    'LI','LII','LIII','LIV','LV','LVI','LVII','LVIII','LIX','LX',
    'LXI','LXII','LXIII','LXIV','LXV','LXVI','LXVII','LXVIII','LXIX','LXX',
    'LXXI','LXXII','LXXIII','LXXIV','LXXV','LXXVI','LXXVII','LXXVIII','LXXIX','LXXX'
  ];
  let _bellLastStamp = null;
  let _bellLineCount = 0;
  let _bellLastSongIdx = -2;
  const FIRE_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(FIRE_POLL); return; }
    const slot = document.getElementById('ko-slot');
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    const tag  = document.getElementById('ko-slot-tag');
    if (!slot || !jpEl) return;

    const rawJp = jpEl.getAttribute('data-ko-raw-jp') || '';
    const rawEn = jpEl.getAttribute('data-ko-raw-en') || '';
    const liveJp = jpEl.textContent;
    const liveEn = enEl ? enEl.textContent : '';

    let changed = false;
    if (rawJp !== liveJp && !jpEl.querySelector('[data-wc]')) {
      jpEl.setAttribute('data-ko-raw-jp', liveJp);
      if (rawJp !== '' || liveJp.trim() !== '') changed = true;
    } else if (rawEn !== liveEn) {
      if (enEl) jpEl.setAttribute('data-ko-raw-en', liveEn);
      if (rawEn !== '' || liveEn.trim() !== '') changed = true;
    }
    if (!changed) return;

    const stamp = liveJp + '\x00' + liveEn;
    if (stamp === _bellLastStamp) return;
    _bellLastStamp = stamp;

    const sl = window.__setlist || [];
    const v = document.querySelector('video');
    let sIdx = -1;
    if (v && isFinite(v.currentTime)) {
      const t = v.currentTime;
      for (let i = 0; i < sl.length; i++) {
        if (t >= sl[i].s && t < sl[i].end) { sIdx = i; break; }
      }
    }
    if (sIdx !== _bellLastSongIdx) {
      _bellLastSongIdx = sIdx;
      _bellLineCount = 0;
    }

    if (liveJp.trim() || liveEn.trim()) {
      _bellLineCount++;
      if (tag) {
        const rn = romans[_bellLineCount] || String(_bellLineCount);
        tag.textContent = `— verse ${rn} —`;
      }
      slot.classList.remove('kbell');
      void slot.offsetWidth;
      slot.classList.add('kbell');
    }
  }, 60);

})();
