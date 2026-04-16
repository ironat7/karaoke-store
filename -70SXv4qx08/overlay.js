// ============================================================================
// KARAOKE OVERLAY — Magnet (Moon Jelly × Miori Celesta cover)
// ----------------------------------------------------------------------------
// Two-magnet bridal stationery. Cream cardstock with double-hairline violet
// border; the JP and EN lines are the two poles, they lean apart then snap
// together on every new line, carrying a cyan butterfly-glow spark between
// them. Butterflies at the four corners pulse with the song.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    cardTag:   'Nº 01',
    cardStamp: 'magnet · minato — 2009',
    ghostChars: ['', '', '', ''],  // butterflies drawn via CSS; slots kept structural

    fontsHref: 'https://fonts.googleapis.com/css2?family=Parisienne&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Shippori+Mincho:wght@400;500;600;700;800&family=Italianno&display=swap',
    fontDisplay: '"Italianno", "Parisienne", cursive',
    fontBody:    '"Cormorant Garamond", Garamond, serif',
    fontSerif:   '"Cormorant Garamond", Garamond, serif',
    fontJP:      '"Shippori Mincho", "Noto Serif JP", serif',
    fontMono:    '"Cormorant Garamond", Garamond, serif',

    cream:      '#F8EDDD',
    accent:     '#6D3F8A',
    accentDeep: '#3A2650',
    accentInk:  '#B05C80',
    ink:        '#3A2650',
    inkSoft:    '#6D5878',
    gold:       '#B08238',
    glowCyan:   '#7EC9E8',
    glowPink:   '#E89AB8',

    cardBackground: `
      radial-gradient(ellipse 120% 90% at 15% 0%, rgba(232, 154, 184, 0.16), transparent 55%),
      radial-gradient(ellipse 120% 90% at 85% 100%, rgba(126, 201, 232, 0.14), transparent 55%),
      radial-gradient(circle at 30% 40%, rgba(109, 63, 138, 0.06) 0.5px, transparent 1.2px) 0 0 / 5px 5px,
      linear-gradient(155deg, #FBF2E4 0%, #F6E7D6 55%, #F2DFD3 100%)
    `,
    cardBorder:   '1px solid rgba(109, 63, 138, 0.55)',
    cardPadding:  '40px 56px 42px',
    cardRadius:   '1px',
    cardShadow:   'inset 0 0 0 1px rgba(251, 242, 228, 1), inset 0 0 0 2px rgba(109, 63, 138, 0.32), inset 0 0 80px rgba(232, 154, 184, 0.10), 0 2px 0 rgba(109, 63, 138, 0.06), 0 20px 45px -15px rgba(58, 38, 80, 0.55), 0 40px 90px -30px rgba(58, 38, 80, 0.45)',
    cardRotation: '-0.4deg',
    cardBackdropFilter: 'blur(1px) saturate(1.05)',

    cornerColor: 'rgba(109, 63, 138, 0.7)',
    cornerGlow1: 'rgba(232, 154, 184, 0.4)',
    cornerGlow2: 'rgba(126, 201, 232, 0.4)',

    tagBackground:   'transparent',
    tagColor:        '#3A2650',
    tagFont:         '"Italianno", "Parisienne", cursive',
    tagShadow:       '0 1px 0 rgba(251, 242, 228, 0.8)',
    tagRotation:     '-1.2deg',
    stampBackground: 'transparent',
    stampColor:      'rgba(58, 38, 80, 0.72)',
    stampFont:       '"Cormorant Garamond", serif',
    stampBorder:     'none',
    stampRotation:   '0.6deg',

    ghostColor:      'transparent',
    ghostBorder:     'none',
    ghostBackground: 'transparent',
    ghostShadow:     'none',

    lyricFontSizeJP: '46px',
    lyricLineHeightJP: '2.15',
    lyricLetterSpacingJP: '0.08em',
    lyricFontSizeEN: '27px',
    lyricLineHeightEN: '1.32',
    lyricLetterSpacingEN: '0.015em',
    lyricColorEN:  '#5A3F70',
    lyricColorJP:  '#2C1D42',
    lyricStrokeEN: '3px #FBF2E4',
    lyricStrokeJP: '4px #FBF2E4',
    lyricShadowEN: '0 1px 0 rgba(251, 242, 228, 0.9), 0 0 14px rgba(232, 154, 184, 0.35)',
    lyricShadowJP: '-0.5px 0 0 rgba(126, 201, 232, 0.3), 0.5px 0 0 rgba(232, 154, 184, 0.3), 0 1px 0 rgba(251, 242, 228, 0.9), 0 0 18px rgba(232, 154, 184, 0.28), 0 0 32px rgba(109, 63, 138, 0.2)',
    glossFontSize: '16px',
    glossFontWeight: '500',
    glossStroke: '2px #FBF2E4',
    glossShadow: '0 1px 0 rgba(251, 242, 228, 0.8)',

    // Six MV-derived chunk hues — Moon Jelly blue, Miori terracotta, rose
    // ribbon, royal violet, jellyfish gold, sage green (Miori's eyes).
    chunkColors: ['#3F82B5', '#B05630', '#B04878', '#6A4EA0', '#A8802A', '#4E7E66'],
  };

  // --- Trusted Types policy ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  // --- State preservation ---
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
    { anchorX: 0.5, anchorY: 0.72, widthFrac: 0.58 },
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

  // ==========================================================================
  // CSS
  // ==========================================================================
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    /* LOCKED plumbing */
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
      --ko-cream:       ${THEME.cream};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};
      --ko-glow-cyan:   ${THEME.glowCyan};
      --ko-glow-pink:   ${THEME.glowPink};
      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-mono:    ${THEME.fontMono};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — cream cardstock with double-hairline violet border ====== */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: ${THEME.cardPadding};
      background: ${THEME.cardBackground};
      border: ${THEME.cardBorder};
      border-radius: ${THEME.cardRadius};
      box-shadow: ${THEME.cardShadow};
      backdrop-filter: ${THEME.cardBackdropFilter};
      -webkit-backdrop-filter: ${THEME.cardBackdropFilter};
      transform: rotate(${THEME.cardRotation});
      transition: transform 420ms cubic-bezier(.2,.7,.3,1), opacity 500ms;
      isolation: isolate;
      overflow: visible;
    }
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(${THEME.cardRotation}) scale(0.94);
    }

    /* ==== MAGNETIC FIELD LINES — signature: thin cyan arcs sweeping from
           either side of the card, like iron-filing patterns around a magnet. */
    #ko-lyrics .ko-field {
      position: absolute;
      top: 50%;
      width: 220px;
      height: 120%;
      pointer-events: none;
      opacity: 0.55;
      z-index: 0;
      filter: blur(0.5px);
    }
    #ko-lyrics .ko-field-l { left: -160px; transform: translateY(-50%) scaleX(-1); }
    #ko-lyrics .ko-field-r { right: -160px; transform: translateY(-50%); }
    #ko-lyrics .ko-field::before,
    #ko-lyrics .ko-field::after {
      content: '';
      position: absolute;
      top: 15%; left: 0;
      width: 100%; height: 70%;
      border: 1px solid transparent;
      border-right-color: rgba(126, 201, 232, 0.35);
      border-radius: 50%;
      animation: ko-field-pulse 6s ease-in-out infinite;
    }
    #ko-lyrics .ko-field::before {
      top: 5%; height: 90%;
      border-right-color: rgba(126, 201, 232, 0.25);
      animation-delay: 0s;
    }
    #ko-lyrics .ko-field::after {
      top: 25%; height: 50%;
      border-right-color: rgba(232, 154, 184, 0.32);
      animation-delay: 1.5s;
    }
    @keyframes ko-field-pulse {
      0%, 100% { opacity: 0.35; transform: scaleX(1); }
      50%      { opacity: 0.75; transform: scaleX(1.08); }
    }

    /* ==== DOUBLE-HAIRLINE BORDER — inset 1px ornamental frame ============ */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      inset: 8px;
      border: 1px solid rgba(109, 63, 138, 0.4);
      border-radius: 1px;
      pointer-events: none;
      z-index: 1;
    }
    /* Decorative bullets at the top of the inner frame (matches thumbnail) */
    #ko-lyrics .ko-slot::after {
      content: '·  ·  ·';
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%) translateY(-55%);
      padding: 0 10px;
      background: #FBF2E4;
      color: rgba(109, 63, 138, 0.8);
      font-family: ${THEME.fontSerif};
      font-size: 18px;
      letter-spacing: 0.28em;
      line-height: 1;
      pointer-events: none;
      z-index: 2;
    }
    /* Matching bullets at the bottom of the inner frame (via ko-slot-corner-tr) */
    #ko-lyrics .ko-slot-corner-tr {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%) translateY(55%);
      padding: 0 10px;
      background: #F2DFD3;
      color: rgba(109, 63, 138, 0.8);
      font-family: ${THEME.fontSerif};
      font-size: 18px;
      letter-spacing: 0.28em;
      line-height: 1;
      pointer-events: none;
      z-index: 2;
      width: auto;
      height: auto;
      border: none;
      box-shadow: none;
    }
    #ko-lyrics .ko-slot-corner-tr::before { content: '·  ·  ·'; }
    #ko-lyrics .ko-slot-corner-bl { display: none; }

    /* ==== TAG — cursive "Nº 01" calligraphy at top-left ================= */
    #ko-lyrics .ko-slot-tag {
      position: absolute;
      top: 14px;
      left: 26px;
      padding: 0;
      background: ${THEME.tagBackground};
      color: ${THEME.tagColor};
      font-family: ${THEME.tagFont};
      font-size: 32px;
      font-weight: 400;
      letter-spacing: 0.02em;
      white-space: nowrap;
      text-shadow: ${THEME.tagShadow};
      transform: rotate(${THEME.tagRotation});
      line-height: 1;
      z-index: 3;
    }
    /* STAMP — italic serif caption at bottom-right */
    #ko-lyrics .ko-slot-stamp {
      position: absolute;
      bottom: 18px;
      right: 24px;
      padding: 0;
      background: ${THEME.stampBackground};
      color: ${THEME.stampColor};
      font-family: ${THEME.stampFont};
      font-style: italic;
      font-size: 13px;
      font-weight: 400;
      letter-spacing: 0.12em;
      border: ${THEME.stampBorder};
      transform: rotate(${THEME.stampRotation});
      z-index: 3;
    }

    /* ==== BUTTERFLIES — four CSS-drawn butterflies at the corners,
           wings flapping, gently drifting. Flare on line-change. */
    #ko-lyrics .ko-ghost {
      position: absolute;
      width: 22px;
      height: 18px;
      pointer-events: none;
      color: transparent;
      font-size: 0;
      z-index: 2;
      filter: drop-shadow(0 0 5px rgba(126, 201, 232, 0.6));
    }
    /* Two wing teardrops, mirrored across the body center */
    #ko-lyrics .ko-ghost::before,
    #ko-lyrics .ko-ghost::after {
      content: '';
      position: absolute;
      top: 0;
      width: 10px;
      height: 14px;
      background:
        radial-gradient(ellipse 100% 120% at 100% 50%, rgba(232, 154, 184, 0.72) 0%, rgba(126, 201, 232, 0.85) 50%, rgba(109, 63, 138, 0.3) 100%);
      border-radius: 60% 60% 40% 40% / 80% 80% 20% 20%;
      animation: ko-wing-flap 1.8s ease-in-out infinite;
    }
    #ko-lyrics .ko-ghost::before {
      left: 0;
      transform-origin: right center;
      transform: rotate(-8deg);
    }
    #ko-lyrics .ko-ghost::after {
      right: 0;
      transform-origin: left center;
      transform: scaleX(-1) rotate(-8deg);
      animation-delay: -0.05s;
    }
    /* Body as a tiny deep-violet line */
    #ko-lyrics .ko-ghost > * { display: none; }  /* safety: no children interfere */
    #ko-lyrics .ko-ghost {
      background-image: linear-gradient(to bottom, rgba(58, 38, 80, 0.6) 0%, rgba(58, 38, 80, 0.6) 100%);
      background-size: 1px 14px;
      background-position: center 2px;
      background-repeat: no-repeat;
    }
    #ko-lyrics .ko-ghost.g1 { top: -14px;  left: 28px;   animation: ko-ghost-drift1 9s ease-in-out infinite; }
    #ko-lyrics .ko-ghost.g2 { top: -14px;  right: 40px;  animation: ko-ghost-drift2 11s ease-in-out infinite; }
    #ko-lyrics .ko-ghost.g3 { bottom: -12px; left: 40px;  animation: ko-ghost-drift3 13s ease-in-out infinite; }
    #ko-lyrics .ko-ghost.g4 { bottom: -12px; right: 28px; animation: ko-ghost-drift1 12s ease-in-out -3s infinite; }
    @keyframes ko-wing-flap {
      0%, 100% { transform: rotateY(0deg) rotate(-8deg); opacity: 0.92; }
      50%      { transform: rotateY(65deg) rotate(-8deg); opacity: 0.65; }
    }
    @keyframes ko-ghost-drift1 {
      0%,100% { transform: translateY(0)    translateX(0)   rotate(-10deg); opacity: 0.82; }
      50%     { transform: translateY(-4px) translateX(-3px) rotate(-14deg); opacity: 1; }
    }
    @keyframes ko-ghost-drift2 {
      0%,100% { transform: translateY(0)    translateX(0)   rotate(12deg); opacity: 0.78; }
      50%     { transform: translateY(3px)  translateX(4px) rotate(8deg);  opacity: 1; }
    }
    @keyframes ko-ghost-drift3 {
      0%,100% { transform: translateY(0)   translateX(0)    rotate(8deg);  opacity: 0.75; }
      50%     { transform: translateY(3px) translateX(-3px) rotate(12deg); opacity: 0.95; }
    }

    /* ==== JP LINE ======================================================== */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      padding-top: 0.5em;
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      position: relative;
      z-index: 3;
      order: 1;
      transition: transform 380ms cubic-bezier(.2,.7,.3,1),
                  filter 380ms cubic-bezier(.2,.7,.3,1);
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-mono);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      font-style: italic;
      letter-spacing: 0.03em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.glossStroke};
      text-shadow: ${THEME.glossShadow};
      text-transform: lowercase;
      user-select: none;
      opacity: 0.92;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* ==== EN LINE — literary italic caption =============================== */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-serif);
      font-weight: 500;
      font-style: italic;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 3;
      order: 2;
      transition: transform 380ms cubic-bezier(.2,.7,.3,1),
                  filter 380ms cubic-bezier(.2,.7,.3,1);
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.95);
      font-weight: 400;
      font-style: normal;
    }
    /* Hairline rose divider under EN */
    #ko-lyrics .ko-line-en:not(:empty)::after {
      content: '';
      display: block;
      width: 40%;
      height: 1px;
      margin: 8px auto 0;
      background: linear-gradient(90deg, transparent 0%, rgba(176, 92, 128, 0.6) 50%, transparent 100%);
    }

    /* ==== MAGNETIC-SNAP — line-change signature animation
           JP leans cyan-left, EN leans pink-right, then both SNAP to center.
           Card's inner ring briefly flares cyan; spark bursts between lines;
           field-line arcs flare brighter. Two magnets coming together. */
    @keyframes ko-snap-jp {
      0%   { transform: translateX(-14px) scale(1.02); text-shadow: -8px 0 0 rgba(126, 201, 232, 0.95), 0 0 22px rgba(126, 201, 232, 0.9), 0 1px 0 rgba(251, 242, 228, 0.9); }
      35%  { transform: translateX(-5px)  scale(1.01); text-shadow: -4px 0 0 rgba(126, 201, 232, 0.75), 0 0 18px rgba(126, 201, 232, 0.55), 0 1px 0 rgba(251, 242, 228, 0.9); }
      70%  { transform: translateX(1px)   scale(1.003); }
      100% { transform: translateX(0)     scale(1);    text-shadow: ${THEME.lyricShadowJP}; }
    }
    @keyframes ko-snap-en {
      0%   { transform: translateX(12px)  scale(1.015); text-shadow: 6px 0 0 rgba(232, 154, 184, 0.9), 0 0 18px rgba(232, 154, 184, 0.7), 0 1px 0 rgba(251, 242, 228, 0.9); }
      40%  { transform: translateX(4px)   scale(1.005); text-shadow: 3px 0 0 rgba(232, 154, 184, 0.6), 0 0 14px rgba(232, 154, 184, 0.4), 0 1px 0 rgba(251, 242, 228, 0.9); }
      100% { transform: translateX(0)     scale(1);    text-shadow: ${THEME.lyricShadowEN}; }
    }
    @keyframes ko-snap-slot {
      0%   { box-shadow:
               inset 0 0 0 1px rgba(251, 242, 228, 1),
               inset 0 0 0 2px rgba(126, 201, 232, 0.85),
               inset 0 0 120px rgba(232, 154, 184, 0.28),
               0 0 30px rgba(126, 201, 232, 0.5),
               0 20px 45px -15px rgba(58, 38, 80, 0.55),
               0 40px 90px -30px rgba(58, 38, 80, 0.45); }
      60%  { box-shadow:
               inset 0 0 0 1px rgba(251, 242, 228, 1),
               inset 0 0 0 2px rgba(109, 63, 138, 0.5),
               inset 0 0 100px rgba(232, 154, 184, 0.18),
               0 0 12px rgba(126, 201, 232, 0.2),
               0 20px 45px -15px rgba(58, 38, 80, 0.55),
               0 40px 90px -30px rgba(58, 38, 80, 0.45); }
      100% { box-shadow: ${THEME.cardShadow}; }
    }
    @keyframes ko-spark {
      0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
      25%  { opacity: 1; transform: translate(-50%, -50%) scale(1.4); }
      60%  { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    #ko-lyrics .ko-slot.kfire              { animation: ko-snap-slot 560ms cubic-bezier(.15,.75,.3,1) both; }
    #ko-lyrics .ko-slot.kfire .ko-line-jp  { animation: ko-snap-jp   460ms cubic-bezier(.15,.75,.3,1) both; }
    #ko-lyrics .ko-slot.kfire .ko-line-en  { animation: ko-snap-en   480ms cubic-bezier(.2,.7,.3,1) 70ms both; }
    #ko-lyrics .ko-slot.kfire .ko-spark    { animation: ko-spark 520ms cubic-bezier(.2,.7,.3,1) 120ms both; }
    #ko-lyrics .ko-slot.kfire .ko-field::before,
    #ko-lyrics .ko-slot.kfire .ko-field::after {
      animation: ko-field-flare 560ms cubic-bezier(.15,.75,.3,1) both;
    }
    @keyframes ko-field-flare {
      0%   { opacity: 1; transform: scaleX(1.28); filter: blur(0) brightness(1.6); }
      100% { opacity: 0.5; transform: scaleX(1); filter: blur(0.5px) brightness(1); }
    }

    /* Central magnetic spark */
    #ko-lyrics .ko-spark {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 50px;
      height: 50px;
      pointer-events: none;
      opacity: 0;
      z-index: 1;
      background: radial-gradient(circle, rgba(126, 201, 232, 0.9) 0%, rgba(232, 154, 184, 0.35) 35%, transparent 70%);
      border-radius: 50%;
      filter: blur(2px);
    }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  const ghosts = [1,2,3,4].map(i => `<div class="ko-ghost g${i}"></div>`).join('');
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-field ko-field-l"></div>
      <div class="ko-field ko-field-r"></div>
      <div class="ko-slot-corner-tr"></div>
      <div class="ko-slot-corner-bl"></div>
      <div class="ko-slot-tag" id="ko-slot-tag">${escHTML(THEME.cardTag)}</div>
      <div class="ko-slot-stamp">${escHTML(THEME.cardStamp)}</div>
      ${ghosts}
      <div class="ko-spark"></div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + LRCLib fetching fallback ---
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

  // Offset hotkeys: [ ] \
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

  // Colorizer + ruby gloss
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

  // Magnetic-snap trigger + Nº counter
  let _fireLastStamp = null;
  let _fireLineCount = 0;
  let _fireLastSongIdx = -2;
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
    if (stamp === _fireLastStamp) return;
    _fireLastStamp = stamp;

    const sl = window.__setlist || [];
    const v = document.querySelector('video');
    let sIdx = -1;
    if (v && isFinite(v.currentTime)) {
      const t = v.currentTime;
      for (let i = 0; i < sl.length; i++) {
        if (t >= sl[i].s && t < sl[i].end) { sIdx = i; break; }
      }
    }
    if (sIdx !== _fireLastSongIdx) {
      _fireLastSongIdx = sIdx;
      _fireLineCount = 0;
    }

    if (liveJp.trim() || liveEn.trim()) {
      _fireLineCount++;
      if (tag) tag.textContent = 'Nº ' + String(_fireLineCount).padStart(2, '0');
      slot.classList.remove('kfire');
      void slot.offsetWidth;
      slot.classList.add('kfire');
    }
  }, 60);

})();
