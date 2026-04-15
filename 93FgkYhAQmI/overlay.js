// ============================================================================
// KARAOKE OVERLAY — FUWAMOCO × "Let Me Be With You" (Chobits OP cover MV)
// ----------------------------------------------------------------------------
// Design: pressed-flower scrapbook memory-book.  Victorian polaroid card with
// ornate corner filigree, pink washi-tape, handwritten cursive title.  Twin
// ribbon frame around the lyric zone — Mococo pink on the left edge, Fuwawa
// blue on the right — echoing the MV's pink/blue twin-card motif.  Behind
// the lyrics, SVG sakura petals drift diagonally on staggered keyframe paths.
// When the English hook "Let Me Be With You" renders as an active line, it
// reflows in a Great Vibes cursive script as a nod to the song's title card.
// ============================================================================

(() => {

  const THEME = {
    streamTag:       'FUWAMOCO × CHOBITS',
    crestSymbol:     '❀',
    streamTitle:     'Let Me<br>Be With You',
    streamSubtitle:  'Round Table feat. Nino · cover',
    setlistTabIcon:  '❀',
    plainTag:        'Full Lyrics',
    plainSubtitle:   'untimed · scroll',
    plainTabIcon:    '♫',

    fontsHref: 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Parisienne&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Zen+Maru+Gothic:wght@500;700;900&family=Shippori+Mincho:wght@500;700&family=Manrope:wght@500;600;700;800&family=Italiana&display=swap',
    fontDisplay: '"Playfair Display", serif',
    fontBody:    '"Manrope", sans-serif',
    fontSerif:   '"Parisienne", "Playfair Display", serif',
    fontJP:      '"Zen Maru Gothic", "Shippori Mincho", serif',

    cream:      '#fef7ed',
    accent:     '#f4a0b8',
    accentDeep: '#d9748f',
    accentInk:  '#8e3a55',
    ink:        '#4a2c3a',
    inkSoft:    '#7f5b6d',
    gold:       '#caa368',

    panelBackground: `
      radial-gradient(ellipse 100% 55% at 50% 0%, rgba(255,221,232,0.55), transparent 55%),
      radial-gradient(ellipse 90% 50% at 0% 100%, rgba(244,160,184,0.35), transparent 60%),
      radial-gradient(ellipse 90% 50% at 100% 100%, rgba(140,197,232,0.38), transparent 60%),
      linear-gradient(168deg, #fffaf3 0%, #fef1ef 48%, #f5e9f5 100%)
    `,
    panelBorder:      '1px solid rgba(217, 116, 143, 0.35)',
    panelRadius:      '20px',
    panelShadow:      '0 34px 70px -30px rgba(142,58,85,0.5), inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -30px 60px -40px rgba(111,191,230,0.55)',

    tabBackground: 'linear-gradient(180deg, #f8b8ca, #d9748f)',
    tabTextColor:  '#fff',
    tabShadow:     '0 6px 22px -8px rgba(217,116,143,0.55)',

    nowCardBackground: 'linear-gradient(165deg, rgba(255,253,248,0.96), rgba(253,236,240,0.92) 55%, rgba(234,243,252,0.9) 100%)',
    nowCardBorder:     '1px solid rgba(217, 116, 143, 0.32)',
    nowCardShadow:     '0 14px 28px -16px rgba(142,58,85,0.45), inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -30px 60px -40px rgba(111,191,230,0.35)',
    nowFillGradient:   'linear-gradient(90deg, #f8a4c0 0%, #e98ab0 40%, #b89fd6 70%, #8cc5e8 100%)',

    rowHoverBg:   'rgba(244, 160, 184, 0.12)',
    rowActiveBg:  'linear-gradient(100deg, rgba(244,160,184,0.22), rgba(140,197,232,0.12))',
    rowActiveBar: '#d9748f',

    ctrlBackground: 'rgba(255, 252, 247, 0.72)',

    lyricColorEN:  '#FFF6E7',
    lyricColorJP:  '#FFF6E7',
    lyricStrokeEN: '4.5px #1a0a16',
    lyricStrokeJP: '4.5px #1a0a16',
    lyricShadowEN: '0 0 18px rgba(255, 226, 236, 0.55), 0 0 38px rgba(26, 10, 22, 0.55)',
    lyricShadowJP: '0 0 16px rgba(225, 240, 252, 0.55), 0 0 34px rgba(26, 10, 22, 0.55)',
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
  // Chunk palette pulled from the MV: Mococo pink, Fuwawa blue, warm gold,
  // deep sakura rose, dust lilac, coral peach.  Saturated enough to survive
  // against both the light pastel frames and the occasional darker cut.
  window.__wordAlign = window.__wordAlign || {
    colors: ['#FF8CB0','#6FC0E8','#F2BB5C','#E85C8F','#BE94D8','#EE8E65'],
    data: {}
  };
  window.__wordAlign.colors = ['#FF8CB0','#6FC0E8','#F2BB5C','#E85C8F','#BE94D8','#EE8E65'];
  if (typeof window.__karaokeCollapsed      !== 'boolean') window.__karaokeCollapsed      = false;
  if (typeof window.__karaokePlainCollapsed !== 'boolean') window.__karaokePlainCollapsed = false;
  if (typeof window.__karaokeSkipEnabled    !== 'boolean') window.__karaokeSkipEnabled    = false;
  if (typeof window.__karaokeLyricsHidden   !== 'boolean') window.__karaokeLyricsHidden   = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold    = window.__koMaxHold    || 10;
  window.__koPanelWidth = 328;
  window.__koPanelPad   = window.__koPanelPad   || 20;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());
  document.querySelectorAll('#ko-petals').forEach(e => e.remove());

  if (!document.querySelector('link[data-karaoke-font]')) {
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

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    #karaoke-root, #ko-lyrics, #ko-petals {
      --ko-cream:       ${THEME.cream};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};
      --ko-mocopink:    #f4a0b8;
      --ko-mocopink-d:  #d9748f;
      --ko-fuwablue:    #8cc5e8;
      --ko-fuwablue-d:  #5a9fc8;

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics *, #ko-petals * { box-sizing: border-box; }

    /* ============ PANEL (Victorian polaroid card, single-song layout) ======= */
    .ko-panel {
      position: absolute;
      width: 328px;
      max-height: 86vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(22px) saturate(1.25);
      -webkit-backdrop-filter: blur(22px) saturate(1.25);
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-ink);
      overflow: visible;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.5s cubic-bezier(.77,0,.18,1);
    }
    .ko-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background:
        repeating-linear-gradient(
          102deg,
          rgba(255,255,255,0) 0 12px,
          rgba(255,225,235,0.08) 12px 13px,
          rgba(255,255,255,0) 13px 24px
        );
      pointer-events: none;
      mix-blend-mode: screen;
      opacity: 0.55;
    }
    .ko-panel::after {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(180deg,
        rgba(140,197,232,0.55) 0%,
        rgba(244,160,184,0.55) 100%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
              mask-composite: exclude;
      pointer-events: none;
    }

    /* Pink washi-tape strip at the top of the card */
    .ko-washi {
      position: absolute;
      top: -14px;
      left: 28px;
      width: 108px;
      height: 26px;
      background:
        repeating-linear-gradient(
          -8deg,
          rgba(255,255,255,0.35) 0 5px,
          rgba(255,255,255,0.08) 5px 10px
        ),
        linear-gradient(100deg, #f8b2c6, #ec97b0 60%, #d9748f);
      border-radius: 2px;
      box-shadow: 0 8px 16px -6px rgba(142,58,85,0.35);
      transform: rotate(-4.5deg);
      opacity: 0.94;
      pointer-events: none;
      z-index: 2;
    }
    .ko-washi::before, .ko-washi::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      width: 4px;
      background-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.12) 0 1.2px, transparent 1.5px);
      background-size: 4px 5px;
    }
    .ko-washi::before { left: 0;  opacity: 0.4; }
    .ko-washi::after  { right: 0; opacity: 0.4; }

    /* Ornate gold filigree in each corner */
    .ko-corner {
      position: absolute;
      width: 42px;
      height: 42px;
      pointer-events: none;
      color: #caa368;
      opacity: 0.8;
      z-index: 1;
    }
    .ko-corner.tl { top: 9px;    left: 9px;   }
    .ko-corner.tr { top: 9px;    right: 9px;  transform: scaleX(-1); }
    .ko-corner.bl { bottom: 9px; left: 9px;   transform: scaleY(-1); }
    .ko-corner.br { bottom: 9px; right: 9px;  transform: scale(-1,-1); }
    .ko-corner svg { width: 100%; height: 100%; display: block; }

    .ko-tab   { display: none !important; }
    .ko-head  { display: none !important; }
    .ko-list  { display: none !important; }
    .ko-plain { display: none !important; }

    /* ============ STREAM STAMP (header band above the polaroid) ============= */
    .ko-stamp {
      position: relative;
      margin: 20px 26px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-family: 'Italiana', ${THEME.fontBody};
      font-size: 10.5px;
      letter-spacing: 0.34em;
      text-transform: uppercase;
      color: var(--ko-accent-ink);
      z-index: 2;
    }
    .ko-stamp::before, .ko-stamp::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--ko-accent-deep), transparent);
      opacity: 0.65;
    }
    .ko-stamp-mark {
      font-family: ${THEME.fontSerif};
      font-size: 18px;
      letter-spacing: 0;
      color: var(--ko-accent-deep);
      transform: translateY(1px);
    }

    /* ============ NOW-PLAYING POLAROID ====================================== */
    .ko-now {
      position: relative;
      margin: 14px 22px 16px;
      padding: 20px 22px 20px;
      background:
        radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,220,230,0.55), transparent 60%),
        radial-gradient(ellipse 80% 40% at 50% 100%, rgba(200,225,245,0.5), transparent 60%),
        linear-gradient(178deg, #fffdfb 0%, #fff2f1 55%, #f3e9f5 100%);
      border: 1px solid rgba(217,116,143,0.3);
      border-radius: 14px;
      box-shadow:
        0 12px 26px -16px rgba(142,58,85,0.4),
        inset 0 1px 0 rgba(255,255,255,0.85),
        inset 0 -12px 28px -18px rgba(111,191,230,0.3);
      overflow: hidden;
    }
    .ko-now::before {
      content: '';
      position: absolute;
      top: 14px; right: 16px;
      width: 24px; height: 24px;
      background-image: url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><g><path d=\'M12 3 C13.2 4.8 14 6 13.6 8 C13.2 9.6 11.6 10.8 10 11 C8.4 10.8 6.8 9.6 6.4 8 C6 6 6.8 4.8 8 3 C9 2 10 1.7 10.7 2 C11.4 1.7 12 2 12 3 Z\' fill=\'%23f4a0b8\' opacity=\'0.85\'/><path d=\'M21 12 C19.2 13.2 18 14 16 13.6 C14.4 13.2 13.2 11.6 13 10 C13.2 8.4 14.4 6.8 16 6.4 C18 6 19.2 6.8 21 8 C22 9 22.3 10 22 10.7 C22.3 11.4 22 12 21 12 Z\' fill=\'%23e98ab0\' opacity=\'0.9\'/><path d=\'M12 21 C10.8 19.2 10 18 10.4 16 C10.8 14.4 12.4 13.2 14 13 C15.6 13.2 17.2 14.4 17.6 16 C18 18 17.2 19.2 16 21 C15 22 14 22.3 13.3 22 C12.6 22.3 12 22 12 21 Z\' fill=\'%23f4a0b8\' opacity=\'0.8\'/><path d=\'M3 12 C4.8 10.8 6 10 8 10.4 C9.6 10.8 10.8 12.4 11 14 C10.8 15.6 9.6 17.2 8 17.6 C6 18 4.8 17.2 3 16 C2 15 1.7 14 2 13.3 C1.7 12.6 2 12 3 12 Z\' fill=\'%23ffb8cc\' opacity=\'0.85\'/><circle cx=\'12\' cy=\'12\' r=\'2\' fill=\'%23f2bb5c\'/></g></svg>')}");
      background-size: contain;
      background-repeat: no-repeat;
      opacity: 0.88;
      transform: rotate(14deg);
      pointer-events: none;
      filter: drop-shadow(0 1px 1px rgba(142,58,85,0.25));
    }

    .ko-now-title {
      font-family: ${THEME.fontSerif};
      font-weight: 400;
      font-size: 34px;
      line-height: 1.06;
      color: var(--ko-accent-ink);
      margin: 6px 0 6px;
      letter-spacing: 0.005em;
      word-break: keep-all;
      overflow-wrap: normal;
      text-shadow: 0 1px 0 rgba(255,255,255,0.8);
      padding-right: 34px;
    }
    .ko-now-title::after {
      content: '';
      display: block;
      margin-top: 8px;
      height: 8px;
      background-image: url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 180 8\' preserveAspectRatio=\'none\'><path d=\'M0 4 H68 C72 4 74 1 76 1 S79 4 82 4 H104 C107 4 108 1 110 1 S114 4 118 4 H180\' fill=\'none\' stroke=\'%23caa368\' stroke-width=\'1\' stroke-linecap=\'round\' opacity=\'0.75\'/><circle cx=\'90\' cy=\'4\' r=\'1.8\' fill=\'%23d9748f\' opacity=\'0.8\'/></svg>')}");
      background-repeat: no-repeat;
      background-position: left center;
      background-size: 100% 100%;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), ${THEME.fontDisplay}, serif;
      font-size: 12.5px;
      line-height: 1.4;
      font-weight: 500;
      color: var(--ko-ink-soft);
      margin: 0 0 10px;
      max-height: 3em;
      overflow: hidden;
      transition: opacity 0.3s, max-height 0.3s;
      letter-spacing: 0.02em;
    }
    .ko-now-meaning.empty {
      max-height: 0;
      margin: 0;
      opacity: 0;
    }
    .ko-now-artist {
      font-family: 'Italiana', ${THEME.fontBody};
      font-size: 12px;
      font-weight: 400;
      color: var(--ko-accent-ink);
      margin: 2px 0 14px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-now-artist::before, .ko-now-artist::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(202,163,104,0.6), transparent);
    }
    .ko-now-progress {
      position: relative;
      height: 6px;
      background:
        linear-gradient(90deg, rgba(244,160,184,0.22) 0%, rgba(140,197,232,0.22) 100%);
      border-radius: 999px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(142,58,85,0.12);
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: ${THEME.nowFillGradient};
      border-radius: 999px;
      box-shadow: 0 0 10px rgba(244,160,184,0.55), 0 0 16px rgba(140,197,232,0.4);
      transition: width 0.3s linear;
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 700;
      color: var(--ko-ink-soft);
      letter-spacing: 0.1em;
      font-variant-numeric: tabular-nums;
      opacity: 0.85;
    }

    /* Dedication line under the polaroid */
    .ko-dedicate {
      margin: 2px 22px 14px;
      font-family: ${THEME.fontSerif};
      font-size: 17px;
      line-height: 1.3;
      color: var(--ko-accent-ink);
      text-align: center;
      letter-spacing: 0.01em;
      opacity: 0.88;
    }

    /* ============ CTRL BUTTONS (scrapbook tag style) ========================= */
    .ko-ctrls {
      display: flex;
      gap: 8px;
      margin: 0 22px 24px;
      padding-top: 4px;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 8px;
      background:
        linear-gradient(180deg, rgba(255,253,248,0.95), rgba(253,236,240,0.8));
      border: 1px solid rgba(217,116,143,0.28);
      border-radius: 10px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      box-shadow:
        0 4px 10px -6px rgba(142,58,85,0.3),
        inset 0 1px 0 rgba(255,255,255,0.8);
      transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      position: relative;
    }
    .ko-ctrl:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 14px -6px rgba(142,58,85,0.4), inset 0 1px 0 rgba(255,255,255,0.85);
    }
    .ko-ctrl.is-on {
      border-color: var(--ko-accent-deep);
      background: linear-gradient(180deg, rgba(255,235,243,0.95), rgba(248,184,202,0.78));
      box-shadow: 0 0 0 1px rgba(217,116,143,0.25), 0 4px 10px -6px rgba(142,58,85,0.4);
    }
    .ko-ctrl-label {
      font-family: 'Italiana', ${THEME.fontBody};
      font-size: 9.5px;
      font-weight: 400;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ko-accent-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 800;
      color: var(--ko-accent-deep);
      letter-spacing: 0.03em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ============ LYRIC ZONE ================================================= */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    /* Twin-ribbon frame — pink on left, blue on right */
    #ko-lyrics::before, #ko-lyrics::after {
      content: '';
      position: absolute;
      top: -8px;
      bottom: -8px;
      width: 4px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 1;
      filter: blur(0.6px);
    }
    #ko-lyrics::before {
      left: -26px;
      background: linear-gradient(180deg, transparent 0%, rgba(244,160,184,0) 8%, rgba(244,160,184,0.95) 30%, rgba(217,116,143,1) 55%, rgba(244,160,184,0.95) 80%, transparent 100%);
      box-shadow: 0 0 24px 2px rgba(244,160,184,0.55);
    }
    #ko-lyrics::after {
      right: -26px;
      background: linear-gradient(180deg, transparent 0%, rgba(140,197,232,0) 8%, rgba(140,197,232,0.95) 30%, rgba(90,159,200,1) 55%, rgba(140,197,232,0.95) 80%, transparent 100%);
      box-shadow: 0 0 24px 2px rgba(140,197,232,0.55);
    }
    /* Top + bottom ornamental sprigs */
    .ko-lyric-sprig {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 168px;
      height: 22px;
      pointer-events: none;
      opacity: 0.85;
      z-index: 2;
    }
    .ko-lyric-sprig.top    { top: -40px; }
    .ko-lyric-sprig.bottom { bottom: -44px; transform: translateX(-50%) rotate(180deg); }
    .ko-lyric-sprig svg { width: 100%; height: 100%; display: block; }

    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      padding: 0 12px;
      position: relative;
    }
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.3;
      padding-top: 0.38em;
      letter-spacing: 0.05em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: 'Playfair Display', serif;
      font-size: 21px;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.012em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 2.5px ${THEME.lyricStrokeJP.split(' ').slice(1).join(' ')};
      text-shadow: 0 0 8px rgba(255, 226, 236, 0.55), 0 0 16px rgba(26, 10, 22, 0.4);
      user-select: none;
      opacity: 0.96;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      font-family: 'Playfair Display', serif;
      font-weight: 500;
      font-style: italic;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.2;
      letter-spacing: 0.012em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 32px; font-weight: 500; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* Hook-phrase: "Let Me Be With You" renders in Great Vibes cursive */
    #ko-lyrics .ko-line-jp.ko-hook {
      font-family: 'Great Vibes', 'Parisienne', cursive;
      font-weight: 400;
      font-size: 94px;
      line-height: 1;
      letter-spacing: 0.005em;
      padding-top: 0.18em;
      color: #fff6e7;
      -webkit-text-stroke: 3px #1a0a16;
      text-shadow:
        0 0 24px rgba(244,160,184,0.7),
        0 0 48px rgba(140,197,232,0.55),
        0 0 8px rgba(26,10,22,0.5);
    }

    /* ============ SAKURA PETAL AMBIENT LAYER ================================= */
    #ko-petals {
      position: fixed;
      pointer-events: none;
      z-index: 2147483095;
      overflow: hidden;
    }
    .ko-petal {
      position: absolute;
      will-change: transform, opacity;
      opacity: 0;
      filter: blur(0.3px) drop-shadow(0 2px 4px rgba(244,160,184,0.4));
    }
    .ko-petal svg { width: 100%; height: 100%; display: block; }

    @keyframes koDrift {
      0%   { transform: translate3d(0, -60px, 0) rotate(0deg);   opacity: 0; }
      8%   { opacity: 0.75; }
      50%  { transform: translate3d(40px, 40vh, 0) rotate(140deg); opacity: 0.7; }
      92%  { opacity: 0.5; }
      100% { transform: translate3d(-30px, 92vh, 0) rotate(340deg); opacity: 0; }
    }
    @keyframes koDriftR {
      0%   { transform: translate3d(0, -60px, 0) rotate(0deg);    opacity: 0; }
      8%   { opacity: 0.7; }
      50%  { transform: translate3d(-48px, 40vh, 0) rotate(-130deg); opacity: 0.68; }
      92%  { opacity: 0.5; }
      100% { transform: translate3d(28px, 92vh, 0) rotate(-320deg); opacity: 0; }
    }
    @keyframes koSway {
      0%, 100% { margin-left: -4px; }
      50%      { margin-left: 6px;  }
    }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const cornerSVG = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 6 C 6 18, 18 6, 30 6"/>
    <path d="M6 6 C 18 6, 6 18, 6 30"/>
    <path d="M10 10 C 10 16, 16 10, 22 10" opacity="0.6"/>
    <path d="M10 10 C 16 10, 10 16, 10 22" opacity="0.6"/>
    <circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none"/>
    <path d="M30 6 C 28 8, 30 10, 32 9 C 32 11, 34 12, 35 10" opacity="0.7"/>
    <path d="M6 30 C 8 28, 10 30, 9 32 C 11 32, 12 34, 10 35" opacity="0.7"/>
    <path d="M18 6 L 20 5 L 22 6" opacity="0.5"/>
    <path d="M6 18 L 5 20 L 6 22" opacity="0.5"/>
  </svg>`;

  const sprigSVG = `<svg viewBox="0 0 168 22" preserveAspectRatio="none" fill="none">
    <path d="M2 12 C 32 12, 48 5, 74 9" stroke="#caa368" stroke-width="0.9" stroke-linecap="round" opacity="0.8"/>
    <path d="M166 12 C 136 12, 120 5, 94 9" stroke="#caa368" stroke-width="0.9" stroke-linecap="round" opacity="0.8"/>
    <path d="M26 10 C 27 7, 30 7, 30 10 C 30 7, 33 7, 34 10" stroke="#caa368" stroke-width="0.7" opacity="0.6" fill="none"/>
    <path d="M142 10 C 141 7, 138 7, 138 10 C 138 7, 135 7, 134 10" stroke="#caa368" stroke-width="0.7" opacity="0.6" fill="none"/>
    <g transform="translate(84 12)">
      <circle r="4.6" fill="#f4a0b8" opacity="0.88"/>
      <circle r="2.6" fill="#ffffff" opacity="0.75"/>
      <circle r="1.2" fill="#f2bb5c"/>
      <path d="M0 -5 L 1.2 -3.2 M 0 5 L 1.2 3.2 M -5 0 L -3.2 1.2 M 5 0 L 3.2 1.2" stroke="#caa368" stroke-width="0.6" opacity="0.55"/>
    </g>
    <circle cx="58"  cy="11" r="1.6" fill="#8cc5e8" opacity="0.78"/>
    <circle cx="110" cy="11" r="1.6" fill="#8cc5e8" opacity="0.78"/>
    <circle cx="48"  cy="12" r="1.1" fill="#f4a0b8" opacity="0.7"/>
    <circle cx="120" cy="12" r="1.1" fill="#f4a0b8" opacity="0.7"/>
  </svg>`;

  const setlistPanel = document.createElement('div');
  setlistPanel.className = 'ko-panel ko-setlist';
  if (window.__karaokeCollapsed) setlistPanel.classList.add('collapsed');
  setHTML(setlistPanel, `
    <div class="ko-tab" id="ko-setlist-tab" title="Collapse">${escHTML(THEME.setlistTabIcon)}</div>
    <div class="ko-washi"></div>
    <div class="ko-corner tl">${cornerSVG}</div>
    <div class="ko-corner tr">${cornerSVG}</div>
    <div class="ko-corner bl">${cornerSVG}</div>
    <div class="ko-corner br">${cornerSVG}</div>

    <div class="ko-head"><div class="ko-title">${THEME.streamTitle}</div></div>

    <div class="ko-stamp">
      <span class="ko-stamp-mark">❀</span>
      ${escHTML(THEME.streamTag)}
      <span class="ko-stamp-mark">❀</span>
    </div>

    <div class="ko-now">
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>

    <div class="ko-dedicate"><em>please stay with us too</em></div>

    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-skip-btn">
        <div class="ko-ctrl-label">Skip talking</div>
      </div>
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">Hide lyrics</div>
      </div>
    </div>
    <div class="ko-list" id="ko-list"></div>
  `);
  root.appendChild(setlistPanel);

  const plainPanel = document.createElement('div');
  plainPanel.className = 'ko-panel ko-plain hidden';
  if (window.__karaokePlainCollapsed) plainPanel.classList.add('collapsed');
  setHTML(plainPanel, `
    <div class="ko-tab" id="ko-plain-tab" title="Collapse">${escHTML(THEME.plainTabIcon)}</div>
    <div class="ko-head">
      <div class="ko-title" id="ko-plain-title">—</div>
    </div>
    <div class="ko-plain-body" id="ko-plain-body"></div>
  `);
  root.appendChild(plainPanel);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-lyric-sprig top">${sprigSVG}</div>
    <div class="ko-slot">
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
    <div class="ko-lyric-sprig bottom">${sprigSVG}</div>
  `);
  document.body.appendChild(lyrics);

  // --- Sakura petal layer --------------------------------------------------
  const petals = document.createElement('div');
  petals.id = 'ko-petals';
  const petalPlump = (col1, col2) => `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="pg_${col1.replace('#','')}" cx="50%" cy="30%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="55%" stop-color="${col1}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${col2}" stop-opacity="0.85"/>
      </radialGradient>
    </defs>
    <path d="M12 2 C 15 5, 18 7, 17 12 C 17 16, 14 20, 12 22 C 10 20, 7 16, 7 12 C 6 7, 9 5, 12 2 Z" fill="url(#pg_${col1.replace('#','')})"/>
    <path d="M12 8 C 12 10, 12 14, 11 17" stroke="${col2}" stroke-width="0.5" opacity="0.5" fill="none"/>
  </svg>`;
  const petalSlim = (col1, col2) => `<svg viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ps_${col1.replace('#','')}" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="60%" stop-color="${col1}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${col2}" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <path d="M10 1 C 14 6, 15 12, 14 18 C 13 21, 11 23, 10 23 C 9 23, 7 21, 6 18 C 5 12, 6 6, 10 1 Z" fill="url(#ps_${col1.replace('#','')})"/>
  </svg>`;

  const petalDefs = [
    { left:  8, size: 22, delay:  0.0, dur: 18, fwd: true,  svg: petalPlump('#f4a0b8','#d9748f') },
    { left: 22, size: 16, delay:  3.2, dur: 21, fwd: false, svg: petalSlim('#ffd7e2','#f4a0b8') },
    { left: 38, size: 26, delay:  6.8, dur: 16, fwd: true,  svg: petalPlump('#ffe9ef','#f4a0b8') },
    { left: 48, size: 14, delay:  9.1, dur: 24, fwd: false, svg: petalPlump('#cbe3f3','#8cc5e8') },
    { left: 60, size: 20, delay: 11.5, dur: 19, fwd: true,  svg: petalSlim('#f8b8ca','#d9748f') },
    { left: 72, size: 15, delay: 14.3, dur: 22, fwd: false, svg: petalPlump('#e6f1fb','#8cc5e8') },
    { left: 84, size: 24, delay:  1.7, dur: 17, fwd: true,  svg: petalPlump('#f4a0b8','#c96f8c') },
    { left: 92, size: 18, delay:  5.5, dur: 20, fwd: false, svg: petalSlim('#ffe3ee','#f4a0b8') },
  ];
  petalDefs.forEach((p) => {
    const el = document.createElement('div');
    el.className = 'ko-petal';
    el.style.left   = p.left + '%';
    el.style.width  = p.size + 'px';
    el.style.height = p.size + 'px';
    el.style.top    = '-40px';
    el.style.animation = `${p.fwd ? 'koDrift' : 'koDriftR'} ${p.dur}s linear ${-p.delay}s infinite, koSway ${(p.dur * 0.42).toFixed(1)}s ease-in-out ${-p.delay * 0.5}s infinite`;
    setHTML(el, p.svg);
    petals.appendChild(el);
  });
  document.body.appendChild(petals);

  // --- Setlist row rendering (hidden via CSS; tick still needs `.ko-row.active`) ---
  const listEl = document.getElementById('ko-list');
  const rowsHTML = window.__setlist.map((song, i) => {
    const noSync = !song.lrcId ? ' no-sync' : '';
    return `<div class="ko-row${noSync}" data-idx="${i}">
      <div class="ko-row-idx">${String(i + 1).padStart(2, '0')}</div>
      <div class="ko-row-body">
        <div class="ko-row-title">${escHTML(song.name)}</div>
        <div class="ko-row-meta">
          <span class="ko-row-time">${escHTML(song.t)}</span>
          <span class="ko-row-artist">${escHTML(song.artist)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
  setHTML(listEl, rowsHTML);

  listEl.addEventListener('click', e => {
    const row = e.target.closest('.ko-row');
    if (!row) return;
    const idx = Number(row.dataset.idx);
    const song = window.__setlist[idx];
    const v = document.querySelector('video');
    if (v && song) v.currentTime = song.s;
  });

  const skipBtn = document.getElementById('ko-skip-btn');
  skipBtn.classList.toggle('is-on', !!window.__karaokeSkipEnabled);
  skipBtn.addEventListener('click', () => {
    window.__karaokeSkipEnabled = !window.__karaokeSkipEnabled;
    skipBtn.classList.toggle('is-on', window.__karaokeSkipEnabled);
  });

  const lyricsBtn    = document.getElementById('ko-lyrics-btn');
  const lyricsBtnLbl = lyricsBtn.querySelector('.ko-ctrl-label');
  const applyLyricsState = () => {
    lyricsBtnLbl.textContent = window.__karaokeLyricsHidden ? 'Show lyrics' : 'Hide lyrics';
    lyrics.style.display     = window.__karaokeLyricsHidden ? 'none' : '';
    petals.style.display     = window.__karaokeLyricsHidden ? 'none' : '';
  };
  applyLyricsState();
  lyricsBtn.addEventListener('click', () => {
    window.__karaokeLyricsHidden = !window.__karaokeLyricsHidden;
    applyLyricsState();
  });

  const offsetBtn = document.getElementById('ko-offset-btn');
  offsetBtn.addEventListener('click', () => {
    const v = document.querySelector('video');
    if (!v) return;
    const t = v.currentTime;
    const sl = window.__setlist || [];
    for (const s of sl) {
      if (t >= s.s && t < s.end) {
        if (s.lrcId) delete window.__lyricOffsets[s.lrcId];
        break;
      }
    }
  });

  document.getElementById('ko-setlist-tab').addEventListener('click', () => {
    window.__karaokeCollapsed = !window.__karaokeCollapsed;
    setlistPanel.classList.toggle('collapsed', window.__karaokeCollapsed);
  });
  document.getElementById('ko-plain-tab').addEventListener('click', () => {
    window.__karaokePlainCollapsed = !window.__karaokePlainCollapsed;
    plainPanel.classList.toggle('collapsed', window.__karaokePlainCollapsed);
  });

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
  let lastPanelPos = '';
  let lastNowTitle = '', lastNowMeaning = '', lastNowArtist = '', lastNowCur = '', lastNowDur = '', lastFill = '';
  let lastEnText = '', lastJpText = '';
  let lastOffsetStr = '';

  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  };

  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const PW = window.__koPanelWidth;
    const PAD = window.__koPanelPad;
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}|${PW}|${PAD}`;
    if (posKey !== lastPanelPos) {
      lastPanelPos = posKey;
      let sLeft = r.right + PAD;
      if (sLeft + PW > window.innerWidth - 8) sLeft = window.innerWidth - PW - 8;
      setlistPanel.style.left = sLeft + 'px';
      setlistPanel.style.top = (r.top + r.height / 2) + 'px';
      setlistPanel.style.width = PW + 'px';

      let pLeft = r.left - PW - PAD;
      if (pLeft < 8) pLeft = 8;
      plainPanel.style.left = pLeft + 'px';
      plainPanel.style.top = (r.top + r.height / 2) + 'px';
      plainPanel.style.width = PW + 'px';

      lyrics.style.left     = (r.left + r.width / 2) + 'px';
      lyrics.style.top      = (r.top + r.height * 0.66) + 'px';
      lyrics.style.width    = (r.width * 0.62) + 'px';
      lyrics.style.maxWidth = (r.width * 0.62) + 'px';

      petals.style.left   = r.left + 'px';
      petals.style.top    = r.top + 'px';
      petals.style.width  = r.width + 'px';
      petals.style.height = r.height + 'px';
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

      const title = song ? song.name : '—';
      let meaning = '';
      if (song) {
        const jpPart = (song.originalTitle && song.originalTitle !== song.name) ? song.originalTitle : '';
        const enPart = (song.nameEn && song.nameEn !== song.name) ? song.nameEn : '';
        meaning = jpPart && enPart ? `${jpPart} · ${enPart}` : (jpPart || enPart || '');
      }
      const artist = song ? song.artist : '—';
      const durS   = fmt(songDur);
      if (title !== lastNowTitle) {
        document.getElementById('ko-now-title').textContent = title;
        lastNowTitle = title;
      }
      if (meaning !== lastNowMeaning) {
        const mEl = document.getElementById('ko-now-meaning');
        if (mEl) {
          mEl.textContent = meaning;
          mEl.classList.toggle('empty', meaning === '');
        }
        lastNowMeaning = meaning;
      }
      if (artist !== lastNowArtist) {
        document.getElementById('ko-now-artist').textContent = artist;
        lastNowArtist = artist;
      }
      if (durS !== lastNowDur) {
        document.getElementById('ko-now-dur').textContent = durS;
        lastNowDur = durS;
      }

      document.querySelectorAll('.ko-row').forEach((row, i) => {
        row.classList.toggle('active', i === idx);
      });
      if (idx >= 0) {
        const row = document.querySelectorAll('.ko-row')[idx];
        if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      const plainData = song ? window.__plainLyrics[song.idx] : null;
      if (plainData) {
        plainPanel.classList.remove('hidden');
        document.getElementById('ko-plain-title').textContent = song.name;
        const body = document.getElementById('ko-plain-body');
        const jpLines = plainData.jp || [];
        const enLines = plainData.en || [];
        const mkLines = (lines) => lines.map(l =>
          l === '' ? '<div class="ko-plain-blank"></div>' : `<div class="ko-plain-line">${escHTML(l)}</div>`
        ).join('');
        setHTML(body, `
          <div class="ko-plain-section">
            <div class="ko-plain-label">English</div>
            <div class="ko-plain-en">${mkLines(enLines)}</div>
          </div>
          <div class="ko-plain-section">
            <div class="ko-plain-label">日本語</div>
            <div class="ko-plain-jp">${mkLines(jpLines)}</div>
          </div>
        `);
        body.scrollTop = 0;
      } else {
        plainPanel.classList.add('hidden');
      }

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    if (song && songDur > 0) {
      const pct = Math.max(0, Math.min(100, inSong / songDur * 100));
      const fillStr = pct.toFixed(1) + '%';
      const curS = fmt(Math.min(inSong, songDur));
      if (fillStr !== lastFill) {
        document.getElementById('ko-now-fill').style.width = fillStr;
        lastFill = fillStr;
      }
      if (curS !== lastNowCur) {
        document.getElementById('ko-now-cur').textContent = curS;
        lastNowCur = curS;
      }
    } else {
      if (lastFill !== '0.0%') {
        document.getElementById('ko-now-fill').style.width = '0%';
        lastFill = '0.0%';
      }
      if (lastNowCur !== '0:00') {
        document.getElementById('ko-now-cur').textContent = '0:00';
        lastNowCur = '0:00';
      }
    }

    if (window.__karaokeSkipEnabled && song && inSong >= songDur && idx < sl.length - 1) {
      const next = sl[idx + 1];
      if (next && v.currentTime < next.s - 0.5) {
        v.currentTime = next.s;
      }
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

    const curOffset = song && song.lrcId ? (window.__lyricOffsets[song.lrcId] || 0) : 0;
    const sign = curOffset >= 0 ? '+' : '';
    const offsetStr = sign + curOffset.toFixed(1) + 's';
    if (offsetStr !== lastOffsetStr) {
      const el = document.getElementById('ko-offset-display');
      if (el) el.textContent = offsetStr;
      lastOffsetStr = offsetStr;
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
        const val = map[line.t.toFixed(2)];
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

    // Hook-phrase signature: the song's namesake English chorus renders in
    // Great Vibes cursive script — a callback to the polaroid's title card.
    const isHook = /^\s*Let\s+Me\s+Be\s+With\s+You\.?\s*$/i.test(jp);
    jpEl.classList.toggle('ko-hook', isHook);

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
