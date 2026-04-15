// ============================================================================
// KARAOKE OVERLAY — SKELETON (SINGLE-SONG FLAVOR)
// ----------------------------------------------------------------------------
// Skeleton for single-song MV overlays. Ships the locked lyric-rendering
// plumbing and a lyric card floating at 66% down the video. #karaoke-root is
// an empty canvas — the builder fills it with whatever composition the MV
// calls for.
//
// LOCKED — do not rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; CSP requires it)
//   • window.__koGen + MY_GEN closure capture for loop termination
//   • window.__setlist, __parsedLyrics, __transCache, __plainLyrics,
//     __lyricOffsets, __wordAlign, __karaokeLyricsHidden, __karaokeRebuild
//   • RAF + setInterval(tick, 30) dual loop with MY_GEN bail
//   • COLOR_POLL setInterval at ~150ms (JP textContent → colored spans + ruby gloss)
//   • positionTick posKey cache
//   • curLineIdx = -1 reset on song transition
//   • Per-write cache guards before every DOM write
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • JP line above EN line in DOM (learner reads JP first)
//   • __mergeTranslations expects `{en, align: {jp, gloss, en}}`
//   • Hard DOM contract: `#ko-line-jp` and `#ko-line-en` must exist inside
//     `#ko-lyrics > .ko-slot`
//   • Offset hotkeys `[` `]` `\` via document-level keydown listener, with
//     postMessage broadcast for extension persistence
//
// FREE — heavily modify per-song:
//
//   THEME, CSS rules, @keyframes, pseudo-elements, HTML structure added inside
//   #karaoke-root, decorative wrappers around .ko-slot, animations, composition,
//   layout. Typography and color of the lyric lines themselves. Everything is
//   your canvas once the locked plumbing is in place.
//
//   `window.__karaokeLyricsHidden = true` hides lyrics. If your design warrants
//   a toggle button for that (or anything else), build it yourself.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — fonts + palette + lyric-line typography defaults.
  // Exposed as CSS custom properties on #karaoke-root and #ko-lyrics so any
  // HTML the builder inserts can consume them consistently with the lyrics.
  // ==========================================================================
  const THEME = {
    // Cendrillon / サンドリヨン — moon × jelly cover (SignalP, 2009 Vocaloid).
    // Concept: an antique illuminated French storybook page. Cream parchment,
    // deep velvet-crimson hairline border, double gold trim, fleur-de-lis
    // corner ornaments, script chapter heading, drifting rose petals over it
    // all — petals are the through-line motif of the MV.
    fontsHref:   'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Italianno&family=Shippori+Mincho+B1:wght@500;700;800&family=Cinzel:wght@500;600&display=swap',
    fontDisplay: '"Cormorant Garamond", "Cormorant", Georgia, serif',
    fontBody:    '"Cormorant Garamond", Georgia, serif',
    fontJP:      '"Shippori Mincho B1", "Yu Mincho", "Hiragino Mincho ProN", serif',
    fontScript:  '"Italianno", "Pinyon Script", cursive',
    fontSmall:   '"Cinzel", "Cormorant Garamond", serif',

    // ----- Palette pulled from the MV (curtains, dress, prince's jacket, petals) -----
    parchment:    '#F4E8D0',  // card surface (aged cream)
    parchmentHi:  '#FBF3DD',  // card highlight (light area)
    parchmentLo:  '#E2D0AE',  // card shadow (vignette)
    velvet:       '#7C1F2C',  // curtain crimson (border)
    velvetDeep:   '#4D101A',  // curtain shadow
    rose:         '#C76680',  // petal pink (accents)
    roseLight:    '#E9B7C6',  // petal highlight
    gold:         '#B8904A',  // jacket trim gold
    goldBright:   '#E1BB67',  // gold highlight
    lavender:     '#9B8BC6',  // ballroom shadow
    ink:          '#2B1D2A',  // primary text
    inkSoft:      '#5A3F4F',  // secondary text

    // Lyric typography — dark ink on the parchment card.
    lyricColorEN:  '#2B1D2A',
    lyricColorJP:  '#2B1D2A',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(255,247,228,0.95), 0 0 10px rgba(255,247,228,0.7)',
    lyricShadowJP: '0 1px 0 rgba(255,247,228,0.95), 0 0 10px rgba(255,247,228,0.7)',
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
  window.__wordAlign = window.__wordAlign || { colors: [], data: {} };
  // Six colors drawn straight from the MV — velvet curtain, lavender ballroom,
  // prince's jacket gold, petal rose, midnight-blue sash, silver-lavender hair.
  // Tuned dark enough to read on the parchment card.
  window.__wordAlign.colors = [
    '#8B2835',  // 0 — velvet crimson (curtain)
    '#5F4F95',  // 1 — lavender violet (ballroom shadow)
    '#9A6F1F',  // 2 — jacket gold (trim)
    '#B85574',  // 3 — rose pink (petals, ribbon)
    '#2E3870',  // 4 — midnight blue (prince sash)
    '#6B608C',  // 5 — silver-lavender (hair, dress)
  ];
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // --- Generation counter: bumps so prior tick closures self-terminate ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  // --- Runtime knobs ---
  window.__koMaxHold    = window.__koMaxHold    || 10;

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

  // --- CSS injection ---
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
      overflow: hidden;
    }

    #karaoke-root, #ko-lyrics {
      --ko-parchment:    ${THEME.parchment};
      --ko-parchment-hi: ${THEME.parchmentHi};
      --ko-parchment-lo: ${THEME.parchmentLo};
      --ko-velvet:       ${THEME.velvet};
      --ko-velvet-deep:  ${THEME.velvetDeep};
      --ko-rose:         ${THEME.rose};
      --ko-rose-light:   ${THEME.roseLight};
      --ko-gold:         ${THEME.gold};
      --ko-gold-bright:  ${THEME.goldBright};
      --ko-lavender:     ${THEME.lavender};
      --ko-ink:          ${THEME.ink};
      --ko-ink-soft:     ${THEME.inkSoft};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-script:  ${THEME.fontScript};
      --ko-font-small:   ${THEME.fontSmall};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ==== AMBIENT PETAL DRIFT (signature feature) ====
       12 petals seeded across the viewport drifting diagonally with varied
       size/speed/rotation/opacity. Pure CSS. Falls behind the lyric card. */
    .ko-petal {
      position: absolute;
      top: -8vh;
      width: 18px;
      height: 22px;
      pointer-events: none;
      will-change: transform, opacity;
      transform-origin: 50% 30%;
      filter: drop-shadow(0 2px 3px rgba(76, 16, 26, 0.18));
      opacity: 0;
    }
    .ko-petal::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 70% 100% at 50% 30%,
        var(--ko-rose-light) 0%,
        var(--ko-rose) 55%,
        var(--ko-velvet) 110%);
      border-radius: 60% 40% 70% 30% / 90% 90% 30% 30%;
      transform: rotate(-12deg);
    }
    @keyframes ko-drift {
      0%   { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
      8%   { opacity: var(--ko-petal-op, 0.65); }
      90%  { opacity: var(--ko-petal-op, 0.65); }
      100% { transform: translate3d(var(--ko-petal-dx, -120px), 120vh, 0) rotate(var(--ko-petal-spin, 540deg)); opacity: 0; }
    }
    /* 12 petals — each gets distinct horizontal start, drift, scale, duration */
    .ko-petal:nth-child(1)  { left:  4%; --ko-petal-dx: -40px;  --ko-petal-spin:  420deg; --ko-petal-op: 0.55; transform: scale(0.85); animation: ko-drift 22s linear infinite; animation-delay: 0s; }
    .ko-petal:nth-child(2)  { left: 12%; --ko-petal-dx:  60px;  --ko-petal-spin: -360deg; --ko-petal-op: 0.7;  transform: scale(1.1);  animation: ko-drift 26s linear infinite; animation-delay: -3s; }
    .ko-petal:nth-child(3)  { left: 21%; --ko-petal-dx: -90px;  --ko-petal-spin:  540deg; --ko-petal-op: 0.45; transform: scale(0.7);  animation: ko-drift 30s linear infinite; animation-delay: -8s; }
    .ko-petal:nth-child(4)  { left: 30%; --ko-petal-dx:  30px;  --ko-petal-spin: -420deg; --ko-petal-op: 0.8;  transform: scale(1.25); animation: ko-drift 19s linear infinite; animation-delay: -12s; }
    .ko-petal:nth-child(5)  { left: 38%; --ko-petal-dx:  80px;  --ko-petal-spin:  300deg; --ko-petal-op: 0.5;  transform: scale(0.9);  animation: ko-drift 24s linear infinite; animation-delay: -2s; }
    .ko-petal:nth-child(6)  { left: 47%; --ko-petal-dx: -50px;  --ko-petal-spin: -480deg; --ko-petal-op: 0.65; transform: scale(1.0);  animation: ko-drift 28s linear infinite; animation-delay: -16s; }
    .ko-petal:nth-child(7)  { left: 56%; --ko-petal-dx: 100px;  --ko-petal-spin:  600deg; --ko-petal-op: 0.4;  transform: scale(0.75); animation: ko-drift 21s linear infinite; animation-delay: -6s; }
    .ko-petal:nth-child(8)  { left: 65%; --ko-petal-dx: -70px;  --ko-petal-spin: -360deg; --ko-petal-op: 0.7;  transform: scale(1.15); animation: ko-drift 25s linear infinite; animation-delay: -10s; }
    .ko-petal:nth-child(9)  { left: 74%; --ko-petal-dx:  20px;  --ko-petal-spin:  450deg; --ko-petal-op: 0.55; transform: scale(0.95); animation: ko-drift 23s linear infinite; animation-delay: -14s; }
    .ko-petal:nth-child(10) { left: 82%; --ko-petal-dx: -110px; --ko-petal-spin: -540deg; --ko-petal-op: 0.6;  transform: scale(0.85); animation: ko-drift 27s linear infinite; animation-delay: -1s; }
    .ko-petal:nth-child(11) { left: 90%; --ko-petal-dx:  40px;  --ko-petal-spin:  390deg; --ko-petal-op: 0.5;  transform: scale(1.05); animation: ko-drift 20s linear infinite; animation-delay: -18s; }
    .ko-petal:nth-child(12) { left: 96%; --ko-petal-dx: -80px;  --ko-petal-spin: -420deg; --ko-petal-op: 0.45; transform: scale(0.8);  animation: ko-drift 32s linear infinite; animation-delay: -5s; }

    /* ==== LYRIC CARD — antique storybook page ====
       Position locked by positionTick (centered, 66% down, 62% wide).
       The card itself is the design surface. */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }

    /* Outer card — parchment with gold double-stroke and deep velvet hairline */
    #ko-lyrics .ko-card {
      position: relative;
      padding: 22px 38px 28px;
      background:
        radial-gradient(ellipse at 22% 18%, rgba(255, 247, 224, 0.85) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 88%, rgba(155, 139, 198, 0.18) 0%, transparent 60%),
        radial-gradient(ellipse at 50% 50%, var(--ko-parchment-hi) 0%, var(--ko-parchment) 55%, var(--ko-parchment-lo) 105%);
      border: 1px solid var(--ko-velvet-deep);
      border-radius: 4px;
      box-shadow:
        /* outer page lift */
        0 24px 50px -18px rgba(40, 12, 20, 0.55),
        0 12px 28px -12px rgba(40, 12, 20, 0.35),
        /* inner gold trim */
        inset 0 0 0 4px var(--ko-parchment),
        inset 0 0 0 5px var(--ko-gold),
        inset 0 0 0 8px var(--ko-parchment),
        inset 0 0 0 9px var(--ko-velvet),
        /* page texture vignette */
        inset 0 0 60px rgba(124, 31, 44, 0.10),
        inset 0 0 120px rgba(184, 144, 74, 0.07);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }
    /* Aged-paper noise — subtle SVG fractal on the surface */
    #ko-lyrics .ko-card::before {
      content: '';
      position: absolute;
      inset: 9px;
      border-radius: 2px;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0 0.20  0 0 0 0.07 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
      opacity: 0.55;
      mix-blend-mode: multiply;
      pointer-events: none;
      border-radius: 0;
    }
    /* Soft inner crimson hairline (sits between gold and content) */
    #ko-lyrics .ko-card::after {
      content: '';
      position: absolute;
      inset: 14px;
      border: 1px solid rgba(124, 31, 44, 0.32);
      pointer-events: none;
    }

    /* Fleur-de-lis ornaments at the four card corners */
    #ko-lyrics .ko-corner {
      position: absolute;
      width: 26px;
      height: 26px;
      color: var(--ko-velvet);
      opacity: 0.85;
      pointer-events: none;
    }
    #ko-lyrics .ko-corner svg { width: 100%; height: 100%; display: block; }
    #ko-lyrics .ko-corner.tl { top: 6px;    left: 6px;    }
    #ko-lyrics .ko-corner.tr { top: 6px;    right: 6px;   transform: scaleX(-1); }
    #ko-lyrics .ko-corner.bl { bottom: 6px; left: 6px;    transform: scaleY(-1); }
    #ko-lyrics .ko-corner.br { bottom: 6px; right: 6px;   transform: scale(-1, -1); }

    /* Chapter heading: script title + glass slipper sigil + ornamental rule */
    #ko-lyrics .ko-chapter {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin: 2px 30px 14px;
      color: var(--ko-velvet);
    }
    #ko-lyrics .ko-chapter .ko-rule {
      flex: 1 1 auto;
      height: 1px;
      background: linear-gradient(to var(--dir, right),
        transparent 0%,
        rgba(184, 144, 74, 0.0) 5%,
        rgba(184, 144, 74, 0.85) 50%,
        var(--ko-gold) 100%);
    }
    #ko-lyrics .ko-chapter .ko-rule.right { --dir: left; }
    #ko-lyrics .ko-chapter-mark {
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex: 0 0 auto;
    }
    #ko-lyrics .ko-chapter-title {
      font-family: var(--ko-font-script);
      font-size: 32px;
      line-height: 1;
      color: var(--ko-velvet);
      letter-spacing: 0.01em;
      transform: translateY(2px);
      text-shadow: 0 1px 0 rgba(255, 247, 224, 0.7);
    }
    #ko-lyrics .ko-chapter-jp {
      font-family: var(--ko-font-jp);
      font-size: 13px;
      font-weight: 500;
      color: var(--ko-ink-soft);
      letter-spacing: 0.18em;
      transform: translateY(-2px);
    }
    #ko-lyrics .ko-chapter-slipper {
      width: 18px; height: 18px;
      color: var(--ko-velvet);
      opacity: 0.9;
      transform: translateY(2px);
    }

    /* Closing ornament under the lyric slot */
    #ko-lyrics .ko-cadence {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 14px 80px 0;
      color: var(--ko-gold);
      opacity: 0.85;
    }
    #ko-lyrics .ko-cadence .ko-rule {
      flex: 1 1 auto;
      height: 1px;
      background: linear-gradient(to right,
        transparent, rgba(184, 144, 74, 0.6) 50%, transparent);
    }
    #ko-lyrics .ko-cadence-diamond {
      width: 7px; height: 7px;
      background: var(--ko-gold);
      transform: rotate(45deg);
      box-shadow: 0 0 0 2px var(--ko-parchment-hi), 0 0 0 3px rgba(184, 144, 74, 0.4);
    }

    /* The lyric slot itself — tight column, JP above EN */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      min-height: 130px;
      justify-content: center;
    }

    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.3;
      padding-top: 0.45em;
      letter-spacing: 0.05em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      transition: opacity 220ms ease;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-small);
      font-size: 20px;
      font-weight: 500;
      letter-spacing: 0.04em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: var(--ko-ink-soft);
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 1px 0 rgba(255, 247, 224, 0.85);
      user-select: none;
      font-feature-settings: "smcp" 1, "c2sc" 1;
      text-transform: lowercase;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      font-style: italic;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.2;
      letter-spacing: 0.01em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      margin-top: 4px;
      transition: opacity 220ms ease;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 30px;
      font-weight: 400;
      font-style: normal;
    }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* Petals living INSIDE the card — 4 small ones drifting across the page */
    #ko-lyrics .ko-card-petal {
      position: absolute;
      width: 12px;
      height: 14px;
      pointer-events: none;
      filter: drop-shadow(0 1px 2px rgba(76, 16, 26, 0.18));
      will-change: transform, opacity;
      opacity: 0;
      z-index: 1;
    }
    #ko-lyrics .ko-card-petal::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 70% 100% at 50% 30%,
        var(--ko-rose-light) 0%, var(--ko-rose) 60%, var(--ko-velvet) 110%);
      border-radius: 60% 40% 70% 30% / 90% 90% 30% 30%;
      transform: rotate(-15deg);
    }
    @keyframes ko-card-drift {
      0%   { transform: translate3d(var(--from-x, 0), -10%, 0) rotate(0deg); opacity: 0; }
      15%  { opacity: 0.65; }
      85%  { opacity: 0.65; }
      100% { transform: translate3d(var(--to-x, -40px), 110%, 0) rotate(var(--spin, 480deg)); opacity: 0; }
    }
    #ko-lyrics .ko-card-petal:nth-child(1) { left: 12%; --from-x: 0;    --to-x:  30px; --spin:  360deg; animation: ko-card-drift 11s linear infinite; animation-delay: 0s; transform: scale(0.9); }
    #ko-lyrics .ko-card-petal:nth-child(2) { left: 38%; --from-x: 0;    --to-x: -50px; --spin: -480deg; animation: ko-card-drift 14s linear infinite; animation-delay: -4s; transform: scale(1.1); }
    #ko-lyrics .ko-card-petal:nth-child(3) { left: 67%; --from-x: 0;    --to-x:  20px; --spin:  420deg; animation: ko-card-drift 13s linear infinite; animation-delay: -8s; transform: scale(0.85); }
    #ko-lyrics .ko-card-petal:nth-child(4) { left: 88%; --from-x: 0;    --to-x: -35px; --spin: -360deg; animation: ko-card-drift 16s linear infinite; animation-delay: -2s; transform: scale(1.0); }

    /* Lyric layers above petals */
    #ko-lyrics .ko-chapter,
    #ko-lyrics .ko-slot,
    #ko-lyrics .ko-cadence { position: relative; z-index: 2; }
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  // 12 ambient petals drifting across the entire viewport
  setHTML(root, Array.from({length: 12}, () => '<div class="ko-petal"></div>').join(''));
  document.body.appendChild(root);

  // SVG fragments — fleur-de-lis corner ornament + glass slipper sigil
  const FLEUR = `<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2 L2 8 Q2 14 8 14 L14 14 M2 2 L8 2 Q14 2 14 8 L14 14"
          fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M5 5 Q9 5 9 9 Q9 11 7 11"
          fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
    <circle cx="3.5" cy="3.5" r="0.9" fill="currentColor"/>
    <path d="M11 11 Q13 11 13 13" fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
  </svg>`;

  const SLIPPER = `<svg viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 12 Q2 14 4 14 L18 14 Q22 14 22 11 Q22 9 19 8 Q14 7 10 5 Q6 3 4 4 Q2 5 2 8 Z"
          fill="currentColor" opacity="0.85"/>
    <path d="M16 4 L18 7" stroke="currentColor" stroke-width="0.7" opacity="0.7"/>
    <ellipse cx="14" cy="3" rx="1.2" ry="0.7" fill="currentColor" opacity="0.8"/>
  </svg>`;

  // Lyric card: storybook page with chapter heading, slot, and cadence rule
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-card">
      <div class="ko-corner tl">${FLEUR}</div>
      <div class="ko-corner tr">${FLEUR}</div>
      <div class="ko-corner bl">${FLEUR}</div>
      <div class="ko-corner br">${FLEUR}</div>

      <div class="ko-card-petal"></div>
      <div class="ko-card-petal"></div>
      <div class="ko-card-petal"></div>
      <div class="ko-card-petal"></div>

      <div class="ko-chapter">
        <div class="ko-rule"></div>
        <div class="ko-chapter-mark">
          <span class="ko-chapter-slipper">${SLIPPER}</span>
          <span class="ko-chapter-title">Cendrillon</span>
          <span class="ko-chapter-jp">サンドリヨン</span>
        </div>
        <div class="ko-rule right"></div>
      </div>

      <div class="ko-slot">
        <div class="ko-line-jp" id="ko-line-jp"></div>
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>

      <div class="ko-cadence">
        <div class="ko-rule"></div>
        <div class="ko-cadence-diamond"></div>
        <div class="ko-rule"></div>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  // Apply persisted hide-lyrics state. No button exists — toggle via console
  // (`window.__karaokeLyricsHidden = true; ...`) or wire your own UI. The
  // state survives re-injection via the preserved window flag.
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

  // --- Position tick: re-anchor the lyric card to the video rect ---
  // posKey cache is LOAD-BEARING — without it every 250ms writes to style.left/top
  // unconditionally, cascading through YouTube's MutationObservers.
  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}`;
    if (posKey !== lastLyricsPos) {
      lastLyricsPos = posKey;
      lyrics.style.left     = (r.left + r.width / 2) + 'px';
      lyrics.style.top      = (r.top + r.height * 0.66) + 'px';
      lyrics.style.width    = (r.width * 0.62) + 'px';
      lyrics.style.maxWidth = (r.width * 0.62) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text only ---
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
      // CRITICAL: reset curLineIdx so the new song's line 0 can fire.
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
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
  // Positive offset = lyrics LAG (appear later than audio); negative = LEAD.
  // `[` subtracts (pulls lyrics earlier on screen), `]` adds (pushes later).
  // Tick uses `elapsed = inSong - offset`, so subtracting from offset makes
  // the current line advance sooner.
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

  // --- Rebuild hook: call after merging new translation data ---
  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

  // --- Timestamp-keyed translation merge ---
  // Accepts two per-line shapes:
  //   1. String: "<en line>" — plain translation, no color alignment
  //   2. Object: {en, align: {jp, gloss, en}} — translation + alignment + gloss
  // Keys are LRC timestamps as (m*60+s).toFixed(2).
  window.__mergeTranslations = (data) => {
    const parsed = window.__parsedLyrics;
    for (const id in data) {
      if (!data.hasOwnProperty(id)) continue;
      const lines = parsed[id];
      if (!lines) continue;
      const map = data[id];
      for (const line of lines) {
        // Tolerate both "44.2" and "44.20" — Python's default str() drops trailing zeros.
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
            // Field-level merge — a follow-up batch carrying only `gloss` must
            // not wipe existing `jp`/`en`. Replacing the whole align object is
            // a silent-data-loss footgun.
            const existing = window.__wordAlign.data[line.text] || {};
            window.__wordAlign.data[line.text] = Object.assign(existing, val.align);
          }
        }
      }
    }
    window.__karaokeRebuild();
  };

  // --- Color + gloss colorizer (polling, NOT MutationObserver — observer
  //     creates a feedback loop with the tick's textContent writes). ---
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
