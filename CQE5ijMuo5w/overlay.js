// ============================================================================
// KARAOKE OVERLAY — DECO*27「ジレンマ」cover by moon jelly (CQE5ijMuo5w)
// Aesthetic: noir-couture atelier. Pastel princess in a monochrome dress-shop,
// tear-drop lanterns, aftereffects-of-love.
// Signature features:
//   • Gold lantern-droplet falls behind the card on every line change
//   • "くらえ バンバンバン" refrain triggers a red ink-splatter pulse
//   • Two yellow lantern orbs flank the card (Moon Jelly's hair pendants)
//   • Couture-label card with silver filigree corners + rouge seam on right
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    fontsHref:   'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Marcellus&family=Shippori+Mincho:wght@500;600;700&family=Lora:wght@400;500&display=swap',
    fontDisplay: "'Marcellus', 'Cormorant Garamond', serif",
    fontBody:    "'Lora', 'Cormorant Garamond', serif",
    fontJP:      "'Shippori Mincho', 'Hiragino Mincho ProN', serif",

    // MV-derived palette
    cream:      '#f5ecdc',  // aged paper / card base
    creamDeep:  '#e9ddc6',  // card shadow
    rouge:      '#b3415a',  // lip rouge, seam, ink-stroke
    rougeDeep:  '#7a1f33',
    pink:       '#e7a9be',  // dress pink
    pinkSoft:   '#f2d4de',
    gold:       '#c8974a',  // lantern drop, bow
    goldLight:  '#efcf85',
    silver:     '#8d8a92',  // tiara metal
    silverLit:  '#c0bdc6',
    ink:        '#2a1e28',  // text ink
    inkSoft:    '#5d4750',
    teal:       '#2a958e',  // Miku callback
    lilac:      '#8a70b5',
    noir:       '#18141c',  // darkest shade for shadow

    // Lyric text colors — dark ink on cream card
    lyricColorEN:  '#2a1e28',
    lyricColorJP:  '#2a1e28',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(255,248,235,0.92), 0 0 10px rgba(245,236,220,0.8)',
    lyricShadowJP: '0 1px 0 rgba(255,248,235,0.92), 0 0 10px rgba(245,236,220,0.8)',
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
  // MV-derived 6-color palette for lyric chunks:
  //   rose (dress)  / mustard (lantern+bow)  / teal (Miku+gem)
  //   lilac (hair)  / silver (tiara)         / deep-rouge (lips+ink)
  window.__wordAlign = window.__wordAlign || { colors: [], data: {} };
  window.__wordAlign.colors = ['#c94569', '#b1803d', '#1f8f85', '#7a5aac', '#55525e', '#7a1f33'];
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // --- Generation counter ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  // --- Runtime knobs ---
  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Clean up prior injection ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Load Google Fonts ---
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
    }

    #karaoke-root, #ko-lyrics {
      --ko-cream:      ${THEME.cream};
      --ko-cream-deep: ${THEME.creamDeep};
      --ko-rouge:      ${THEME.rouge};
      --ko-rouge-deep: ${THEME.rougeDeep};
      --ko-pink:       ${THEME.pink};
      --ko-pink-soft:  ${THEME.pinkSoft};
      --ko-gold:       ${THEME.gold};
      --ko-gold-light: ${THEME.goldLight};
      --ko-silver:     ${THEME.silver};
      --ko-silver-lit: ${THEME.silverLit};
      --ko-ink:        ${THEME.ink};
      --ko-ink-soft:   ${THEME.inkSoft};
      --ko-teal:       ${THEME.teal};
      --ko-lilac:      ${THEME.lilac};
      --ko-noir:       ${THEME.noir};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* =============================================================
       BACKGROUND ATMOSPHERE — drifting golden "tear-lights"
       ============================================================= */
    .mv-tear-ambient {
      position: absolute;
      width: 4px; height: 4px;
      border-radius: 50%;
      background: radial-gradient(circle,
        rgba(239,207,133,0.95) 0%,
        rgba(200,151,74,0.7) 40%,
        rgba(200,151,74,0) 100%);
      box-shadow: 0 0 14px 4px rgba(239,207,133,0.35);
      opacity: 0;
      animation: mv-drift 14s ease-in-out infinite;
      filter: blur(0.2px);
    }
    .mv-tear-ambient.t1 { left: 12%;  top: 22%;  animation-delay: 0s;    animation-duration: 16s; }
    .mv-tear-ambient.t2 { left: 84%;  top: 34%;  animation-delay: -4s;   animation-duration: 13s; }
    .mv-tear-ambient.t3 { left: 68%;  top: 18%;  animation-delay: -8s;   animation-duration: 17s; }
    .mv-tear-ambient.t4 { left: 8%;   top: 55%;  animation-delay: -11s;  animation-duration: 15s; }
    @keyframes mv-drift {
      0%, 100% { opacity: 0; transform: translate(0,0) scale(0.6); }
      20%      { opacity: 0.9; }
      50%      { opacity: 0.5; transform: translate(20px, 40px) scale(1); }
      80%      { opacity: 0.8; }
    }

    /* =============================================================
       TITLE CARD — top-left "ジレンマ / DILEMMA" editorial wordmark
       ============================================================= */
    .mv-title {
      position: absolute;
      top: 3.2%;
      left: 3.5%;
      color: var(--ko-cream);
      letter-spacing: 0.04em;
      text-shadow: 0 2px 14px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.8);
      pointer-events: none;
      user-select: none;
    }
    .mv-title .jp {
      font-family: var(--ko-font-jp);
      font-size: 30px;
      font-weight: 600;
      color: var(--ko-gold-light);
      text-shadow: 0 0 14px rgba(200,151,74,0.65), 0 2px 14px rgba(0,0,0,0.75);
      letter-spacing: 0.22em;
      display: block;
      margin-bottom: 0.1em;
    }
    .mv-title .en {
      font-family: var(--ko-font-display);
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.7em;
      color: rgba(245,236,220,0.88);
      display: block;
    }
    .mv-title .line {
      display: block;
      width: 68px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--ko-gold) 40%, var(--ko-gold) 60%, transparent);
      margin: 10px 0 8px;
    }
    .mv-title .feat {
      font-family: var(--ko-font-display);
      font-size: 10px;
      letter-spacing: 0.38em;
      color: rgba(231,169,190,0.9);
      font-style: italic;
    }

    /* =============================================================
       COVER CREDIT — bottom-right
       ============================================================= */
    .mv-credit {
      position: absolute;
      right: 3.2%;
      bottom: 4%;
      text-align: right;
      color: var(--ko-cream);
      text-shadow: 0 2px 10px rgba(0,0,0,0.75);
      pointer-events: none;
      user-select: none;
    }
    .mv-credit .cover {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-size: 15px;
      letter-spacing: 0.28em;
      color: rgba(242,212,222,0.95);
      text-transform: lowercase;
      display: block;
    }
    .mv-credit .artist {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 500;
      letter-spacing: 0.36em;
      color: var(--ko-cream);
      text-transform: uppercase;
      display: block;
      margin-top: 2px;
    }
    .mv-credit .orig {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-size: 10px;
      letter-spacing: 0.28em;
      color: rgba(239,207,133,0.72);
      margin-top: 6px;
      display: block;
    }

    /* =============================================================
       LYRIC CARD — couture dress-label panel
       ============================================================= */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 44px 54px 36px 54px;
      isolation: isolate;
    }

    /* CARD BACKDROP — layered cream paper with subtle grain */
    #ko-lyrics .card-bg {
      position: absolute;
      inset: 0;
      border-radius: 2px;
      background:
        /* inner glow */
        radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,247,230,0.65) 0%, rgba(245,236,220,0) 70%),
        /* cream base */
        linear-gradient(180deg, #f9f0df 0%, #f2e6ce 55%, #e9ddc6 100%);
      box-shadow:
        inset 0 0 0 1px rgba(181,152,119,0.28),
        inset 0 0 0 4px rgba(249,240,223,0.9),
        inset 0 0 0 5px rgba(141,138,146,0.32),
        0 18px 42px rgba(24,20,28,0.55),
        0 2px 10px rgba(24,20,28,0.4);
      z-index: -2;
    }
    /* paper grain */
    #ko-lyrics .card-bg::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 25% 30%, rgba(90,60,45,0.035) 1px, transparent 1.4px),
        radial-gradient(circle at 75% 65%, rgba(90,60,45,0.03) 1px, transparent 1.4px),
        radial-gradient(circle at 45% 80%, rgba(90,60,45,0.03) 1px, transparent 1.4px);
      background-size: 7px 7px, 11px 11px, 5px 5px;
      mix-blend-mode: multiply;
      opacity: 0.8;
      pointer-events: none;
    }
    /* vertical seam — a single thin rouge thread down the right side */
    #ko-lyrics .card-bg::after {
      content: "";
      position: absolute;
      top: 22px; bottom: 22px; right: 14px;
      width: 1px;
      background: linear-gradient(180deg,
        transparent 0%,
        rgba(179,65,90,0.55) 12%,
        rgba(179,65,90,0.75) 50%,
        rgba(179,65,90,0.55) 88%,
        transparent 100%);
      box-shadow: 0 0 6px rgba(179,65,90,0.35);
    }

    /* FILIGREE CORNERS — tiara-inspired silver fleur corners */
    #ko-lyrics .corner {
      position: absolute;
      width: 30px; height: 30px;
      z-index: 2;
      color: var(--ko-silver);
      filter: drop-shadow(0 1px 0 rgba(255,250,238,0.7));
    }
    #ko-lyrics .corner svg { width: 100%; height: 100%; }
    #ko-lyrics .corner.tl { top: 8px;  left: 8px;  }
    #ko-lyrics .corner.tr { top: 8px;  right: 8px; transform: scaleX(-1); }
    #ko-lyrics .corner.bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
    #ko-lyrics .corner.br { bottom: 8px; right: 8px; transform: scale(-1,-1); }

    /* CARD HEADER — tiara filigree + genre label */
    #ko-lyrics .card-header {
      position: absolute;
      top: 13px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--ko-font-display);
      font-size: 9px;
      letter-spacing: 0.48em;
      color: var(--ko-rouge);
      text-transform: uppercase;
      opacity: 0.92;
      user-select: none;
    }
    #ko-lyrics .card-header .dash {
      width: 26px; height: 1px;
      background: linear-gradient(90deg, transparent, var(--ko-rouge), transparent);
    }
    #ko-lyrics .card-header .fleur {
      font-size: 12px;
      color: var(--ko-rouge);
      letter-spacing: 0;
      line-height: 1;
    }

    /* LANTERN ORBS — yellow droplet lights that hang on the card top corners
       Echoes Moon Jelly's hair-antenna pendants. */
    #ko-lyrics .lantern {
      position: absolute;
      top: -16px;
      width: 22px; height: 28px;
      z-index: 3;
      pointer-events: none;
    }
    #ko-lyrics .lantern.l { left: 42px; }
    #ko-lyrics .lantern.r { right: 42px; }
    #ko-lyrics .lantern .wire {
      position: absolute;
      top: 0; left: 50%;
      width: 1px; height: 12px;
      background: linear-gradient(180deg, rgba(141,138,146,0.4), rgba(141,138,146,0.7));
    }
    #ko-lyrics .lantern .bulb {
      position: absolute;
      bottom: 0; left: 50%;
      width: 20px; height: 20px;
      transform: translateX(-50%);
      border-radius: 50% 50% 55% 55%;
      background: radial-gradient(circle at 40% 35%,
        #fff6d3 0%, #efcf85 30%, #c8974a 70%, #7a5a24 100%);
      box-shadow:
        0 0 14px 3px rgba(239,207,133,0.6),
        inset 0 -3px 5px rgba(122,90,36,0.45),
        inset 0 2px 3px rgba(255,246,211,0.8);
      animation: mv-lantern-glow 5s ease-in-out infinite;
    }
    #ko-lyrics .lantern.r .bulb { animation-delay: -2.5s; }
    @keyframes mv-lantern-glow {
      0%, 100% { box-shadow: 0 0 14px 3px rgba(239,207,133,0.5), inset 0 -3px 5px rgba(122,90,36,0.45), inset 0 2px 3px rgba(255,246,211,0.8); }
      50%      { box-shadow: 0 0 22px 6px rgba(239,207,133,0.75), inset 0 -3px 5px rgba(122,90,36,0.45), inset 0 2px 3px rgba(255,246,211,0.9); }
    }
    /* lantern drip — tiny droplet forming at the bottom */
    #ko-lyrics .lantern .drip {
      position: absolute;
      bottom: -2px; left: 50%;
      width: 3px; height: 5px;
      transform: translateX(-50%);
      background: radial-gradient(ellipse at 50% 30%, #f0d18a, #c8974a);
      border-radius: 50% 50% 60% 60%;
      box-shadow: 0 0 4px rgba(239,207,133,0.6);
      animation: mv-drip 4.5s ease-in infinite;
      animation-delay: var(--drip-delay, 0s);
    }
    @keyframes mv-drip {
      0%, 60%  { transform: translate(-50%, 0) scaleY(0.4); opacity: 0; }
      72%      { transform: translate(-50%, 0) scaleY(1); opacity: 1; }
      92%      { transform: translate(-50%, 28px) scaleY(1.6); opacity: 0.5; }
      100%     { transform: translate(-50%, 44px) scaleY(0.2); opacity: 0; }
    }

    /* LINE-CHANGE TEAR CUE — single gold droplet falling behind the card
       on every new lyric line. Subtle; does not cover text. */
    #ko-lyrics .tear-cue {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      width: 5px; height: 8px;
      border-radius: 50% 50% 60% 60%;
      background: radial-gradient(ellipse at 50% 28%, #fff2c2 0%, #efcf85 45%, #c8974a 85%);
      box-shadow: 0 0 8px rgba(239,207,133,0.6);
      opacity: 0;
      z-index: -1;
      pointer-events: none;
    }
    #ko-lyrics .tear-cue.fall {
      animation: mv-tear-fall 1.1s cubic-bezier(0.42, 0, 0.58, 1) forwards;
    }
    @keyframes mv-tear-fall {
      0%   { transform: translate(-50%, 0) scaleY(0.7); opacity: 0; }
      14%  { opacity: 0.95; }
      100% { transform: translate(-50%, calc(100% + 18px)) scaleY(1.8); opacity: 0; }
    }

    /* INK-SPLATTER PULSE — fires when the refrain "くらえ バンバンバン" plays.
       A red ink-splash SVG briefly appears behind the card, like a shot. */
    #ko-lyrics .ink-splat {
      position: absolute;
      inset: -40px;
      z-index: -3;
      opacity: 0;
      pointer-events: none;
      color: var(--ko-rouge);
    }
    #ko-lyrics .ink-splat svg { width: 100%; height: 100%; display: block; }
    #ko-lyrics .ink-splat.hit {
      animation: mv-splat 0.85s ease-out forwards;
    }
    @keyframes mv-splat {
      0%   { opacity: 0; transform: scale(0.7); }
      22%  { opacity: 0.95; transform: scale(1.05); }
      55%  { opacity: 0.7; transform: scale(1.02); }
      100% { opacity: 0; transform: scale(1.12); }
    }

    /* SEAL — small sparkle glyph bottom-center (matches title logo accent) */
    #ko-lyrics .seal {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--ko-font-display);
      font-size: 8px;
      letter-spacing: 0.48em;
      color: var(--ko-silver);
      text-transform: uppercase;
      opacity: 0.75;
      user-select: none;
    }
    #ko-lyrics .seal .star {
      display: inline-block;
      color: var(--ko-gold);
      font-size: 10px;
      line-height: 1;
    }
    #ko-lyrics .seal .dash {
      width: 20px; height: 1px;
      background: linear-gradient(90deg, transparent, var(--ko-silver), transparent);
    }

    /* =============================================================
       LYRIC TYPOGRAPHY
       ============================================================= */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 600;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.35;
      padding-top: 0.45em;
      letter-spacing: 0.06em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      position: relative;
      z-index: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding-bottom: 5px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 1px 0 rgba(255,248,232,0.95), 0 0 5px rgba(245,236,220,0.85);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.22;
      letter-spacing: 0.018em;
      text-shadow: ${THEME.lyricShadowEN};
      font-style: italic;
      max-width: 100%;
      min-height: 1em;
      order: 2;
      position: relative;
      z-index: 1;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 28px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* Gentle card entry on song start / reinject */
    #ko-lyrics .ko-slot {
      animation: mv-card-in 1.4s ease-out both;
    }
    @keyframes mv-card-in {
      0%   { opacity: 0; transform: translateY(10px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);

  // --- Helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM: root (title + credit + ambient lights) ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  setHTML(root, `
    <div class="mv-tear-ambient t1"></div>
    <div class="mv-tear-ambient t2"></div>
    <div class="mv-tear-ambient t3"></div>
    <div class="mv-tear-ambient t4"></div>

    <div class="mv-title">
      <span class="jp">ジ レ ン マ</span>
      <span class="en">DILEMMA</span>
      <span class="line"></span>
      <span class="feat">feat. MOON JELLY</span>
    </div>

    <div class="mv-credit">
      <span class="cover">cover by</span>
      <span class="artist">Moon&nbsp;Jelly</span>
      <span class="orig">orig. DECO*27 feat. 初音ミク</span>
    </div>
  `);
  document.body.appendChild(root);

  // SVG filigree corner — a small fleur/scroll. One symbol, flipped for 4 corners.
  const FILIGREE_SVG = `
    <svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round">
      <path d="M2 28 C 2 20, 8 14, 14 14" />
      <path d="M2 28 L 14 28" />
      <path d="M2 28 L 2 16" />
      <circle cx="14" cy="14" r="1.6" fill="currentColor" stroke="none" opacity="0.8"/>
      <path d="M5 22 C 7 22, 9 20, 9 18" opacity="0.7"/>
      <path d="M14 18 C 12 18, 10 20, 10 22" opacity="0.7"/>
    </svg>
  `;

  // Ink-splat SVG — organic blob with scatter droplets
  const INK_SPLAT_SVG = `
    <svg viewBox="-100 -100 200 200" preserveAspectRatio="none">
      <g fill="currentColor" opacity="0.78">
        <path d="M -70,-12 C -80,-28 -62,-52 -30,-48 C -10,-60 22,-58 38,-38 C 62,-40 82,-18 72,10 C 88,24 70,50 42,48 C 30,70 -6,68 -22,50 C -52,60 -84,38 -74,12 Z"/>
        <circle cx="-86" cy="-40" r="4"/>
        <circle cx="82" cy="-52" r="3.2"/>
        <circle cx="-72" cy="58" r="2.6"/>
        <circle cx="64" cy="64" r="4.2"/>
        <circle cx="-94" cy="14" r="2"/>
        <circle cx="92" cy="26" r="2.5"/>
        <ellipse cx="78" cy="-12" rx="6" ry="1.4" transform="rotate(18 78 -12)"/>
        <ellipse cx="-78" cy="32" rx="6" ry="1.4" transform="rotate(-22 -78 32)"/>
      </g>
    </svg>
  `;

  // --- Lyric card ---
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="card-bg"></div>
      <div class="ink-splat" id="ko-ink-splat">${INK_SPLAT_SVG}</div>
      <div class="corner tl">${FILIGREE_SVG}</div>
      <div class="corner tr">${FILIGREE_SVG}</div>
      <div class="corner bl">${FILIGREE_SVG}</div>
      <div class="corner br">${FILIGREE_SVG}</div>
      <div class="lantern l"><div class="wire"></div><div class="bulb"></div><div class="drip" style="--drip-delay: -0.8s"></div></div>
      <div class="lantern r"><div class="wire"></div><div class="bulb"></div><div class="drip" style="--drip-delay: -2.4s"></div></div>
      <div class="card-header">
        <span class="dash"></span>
        <span>AFTER&nbsp;EFFECTS</span>
        <span class="fleur">✦</span>
        <span>NO.&nbsp;02</span>
        <span class="dash"></span>
      </div>
      <div class="tear-cue" id="ko-tear-cue"></div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="seal">
        <span class="dash"></span>
        <span>CQE&middot;5iJ</span>
        <span class="star">✦</span>
        <span>MOON&nbsp;JELLY</span>
        <span class="dash"></span>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC fetch fallback ---
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
      .then(d => { if (d && d.syncedLyrics) window.__parsedLyrics[id] = parseLRC(d.syncedLyrics); })
      .catch(() => {});
  });

  // --- Cached state ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';

  // --- Position tick ---
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

  // --- Tear-cue + refrain-marker triggers (host-side reactive animation) ---
  const fireTearCue = () => {
    const el = document.getElementById('ko-tear-cue');
    if (!el) return;
    el.classList.remove('fall');
    // reflow to restart animation
    void el.offsetWidth;
    el.classList.add('fall');
  };
  const fireInkSplat = () => {
    const el = document.getElementById('ko-ink-splat');
    if (!el) return;
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
  };
  // The refrain hook-line in DILEMMA — matches "くらえ バンバンバン"
  const isRefrain = (jp) => /くらえ\s*バンバンバン/.test(jp || '');

  // --- Main tick ---
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
        if (elapsed < endAt) showText = line.text;
      }

      if (lineIdx !== curLineIdx || showText !== lastJpText) {
        const lineChanged = lineIdx !== curLineIdx;
        curLineIdx = lineIdx;
        const enEl = document.getElementById('ko-line-en');
        const jpEl = document.getElementById('ko-line-jp');
        if (song.lang === 'en') {
          if (enEl && showText !== lastEnText) {
            enEl.textContent = showText;
            lastEnText = showText;
          }
          if (jpEl && lastJpText !== '') { jpEl.textContent = ''; lastJpText = ''; }
        } else {
          const posEn = (lineIdx >= 0 && showText && lrc[lineIdx].en) || '';
          const en = posEn || (showText && window.__transCache[showText]) || '';
          if (enEl && en !== lastEnText) { enEl.textContent = en; lastEnText = en; }
          if (jpEl && showText !== lastJpText) {
            jpEl.textContent = showText;
            lastJpText = showText;
            // --- Signature reactive cues ---
            if (lineChanged && showText.trim()) {
              fireTearCue();
              if (isRefrain(showText)) fireInkSplat();
            }
          }
        }
      }
    } else if (!song || !song.lrcId) {
      if (lastEnText !== '') { document.getElementById('ko-line-en').textContent = ''; lastEnText = ''; }
      if (lastJpText !== '') { document.getElementById('ko-line-jp').textContent = ''; lastJpText = ''; }
    }
  };

  // --- Dual loop ---
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

  // --- Offset hotkeys ---
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

  // --- Translation merge ---
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

  // --- Color + gloss colorizer ---
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
