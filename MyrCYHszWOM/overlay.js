// ============================================================================
// VESPERBELL // YOMI MONITOR — VOL.09 / SUMMER COLD EDITION
// ----------------------------------------------------------------------------
// 24-channel rock + anime-OP karaoke from VESPERBELL ヨミ, recorded 2025-09-01.
// The streamer's own UI is hi-fi audio gear (Bang & Olufsen / Genelec / Teenage
// Engineering by way of "DESIGNED BY KORUA SINCE 2009"). This overlay is built
// as a sibling channel — studio rack, channel strips, segmented VU progress,
// spec-sheet microtype. Each anime-OP gets an ORIGIN tag (signature feature).
// ============================================================================

(() => {

  const THEME = {
    streamTag:       'YOMI MONITOR // VOL.09',
    crestSymbol:     'V',
    streamTitle:     'SUMMER<br>COLD<br>ED.',
    streamSubtitle:  'rec. 2025·09·01 · 24ch',
    setlistTabIcon:  'CH',
    plainTag:        'READOUT',
    plainSubtitle:   'untimed · scroll',
    plainTabIcon:    'RX',

    // Google Fonts URL — loaded via <link>, CSP blocks @import.
    fontsHref:   'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap',
    fontDisplay: '"Space Grotesk", system-ui, sans-serif',
    fontBody:    '"JetBrains Mono", ui-monospace, monospace',
    fontSerif:   '"Fraunces", "Bodoni Moda", serif',
    fontJP:      '"Zen Kaku Gothic New", "Noto Sans JP", system-ui, sans-serif',

    // Palette — sampled from Yomi's design + the streamer's overlay graphics.
    cream:      '#F1ECDB',
    accent:     '#1E36B8',
    accentDeep: '#3B5BE0',
    accentInk:  '#161028',
    ink:        '#16130E',
    inkSoft:    '#6B6557',
    gold:       '#9C6E2E',

    panelBackground: `
      linear-gradient(180deg, rgba(248,243,228,0.97) 0%, rgba(238,231,210,0.95) 100%),
      repeating-linear-gradient(0deg, rgba(22,19,14,0.018) 0px, rgba(22,19,14,0.018) 1px, transparent 1px, transparent 4px)
    `,
    panelBorder:      '1px solid rgba(22, 19, 14, 0.85)',
    panelRadius:      '4px',
    panelShadow:      '0 24px 60px -28px rgba(22,19,14,0.7), 0 4px 12px -6px rgba(22,19,14,0.25), inset 0 0 0 1px rgba(248,243,228,0.4)',

    tabBackground: 'linear-gradient(180deg, #16130E, #2A241B)',
    tabTextColor:  '#F1ECDB',
    tabShadow:     '0 6px 18px -8px rgba(22,19,14,0.7)',

    nowCardBackground: 'linear-gradient(180deg, rgba(22,19,14,0.96), rgba(38,33,24,0.94))',
    nowCardBorder:     '1px solid rgba(241, 236, 219, 0.18)',
    nowCardShadow:     'inset 0 1px 0 rgba(241,236,219,0.06), 0 4px 10px -4px rgba(22,19,14,0.5)',
    nowFillGradient:   'linear-gradient(90deg, #3B5BE0 0%, #1E36B8 70%, #E97A2A 100%)',

    rowHoverBg:   'rgba(22, 19, 14, 0.05)',
    rowActiveBg:  'linear-gradient(100deg, rgba(30,54,184,0.13), rgba(233,122,42,0.06))',
    rowActiveBar: '#1E36B8',

    ctrlBackground: 'rgba(22, 19, 14, 0.92)',

    lyricColorEN:  '#16130E',
    lyricColorJP:  '#16130E',
    lyricHazeBlur: 'blur(10px) saturate(1.2)',
    lyricHazeTint: 'rgba(241, 236, 219, 0.78)',
    lyricHazePad:  '170px',
    lyricShadowEN: '0 0 8px rgba(241,236,219,0.95), 0 1px 0 rgba(241,236,219,0.95)',
    lyricShadowJP: '0 0 8px rgba(241,236,219,0.95), 0 1px 0 rgba(241,236,219,0.95)',
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
    // Six chunk colors derived from Yomi's character + the live frames:
    // [0] deep cobalt — her hair tips, brand color
    // [1] sky blue — outfit highlights
    // [2] signal orange — her hooked earring + the speaker LED
    // [3] alert red — her lipstick, peak indicators
    // [4] charcoal — high-contrast neutral, matches the streamer's panel ink
    // [5] bronze — warm gold, complements the orange without competing
    colors: ['#1E36B8', '#5388D8', '#E97A2A', '#C8392F', '#16130E', '#9C6E2E'],
    data: {}
  };
  if (typeof window.__karaokeCollapsed      !== 'boolean') window.__karaokeCollapsed      = false;
  if (typeof window.__karaokePlainCollapsed !== 'boolean') window.__karaokePlainCollapsed = false;
  if (typeof window.__karaokeSkipEnabled    !== 'boolean') window.__karaokeSkipEnabled    = false;
  if (typeof window.__karaokeLyricsHidden   !== 'boolean') window.__karaokeLyricsHidden   = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold    = window.__koMaxHold    || 10;
  window.__koPanelWidth = window.__koPanelWidth || 360;
  window.__koPanelPad   = window.__koPanelPad   || 18;

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
    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};
      --ko-orange:      #E97A2A;
      --ko-red:         #C8392F;

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    .ko-panel {
      position: absolute;
      width: 360px;
      max-height: 88vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(18px) saturate(1.2);
      -webkit-backdrop-filter: blur(18px) saturate(1.2);
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-ink);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.55s cubic-bezier(.68,0,.18,1);
    }

    /* Hardware corner markers */
    .ko-panel::before,
    .ko-panel::after {
      content: '';
      position: absolute;
      width: 6px; height: 6px;
      border: 1px solid var(--ko-ink);
      border-radius: 50%;
      background: var(--ko-cream);
      pointer-events: none;
      z-index: 3;
    }
    .ko-panel::before { top: 8px; left: 8px; }
    .ko-panel::after  { bottom: 8px; right: 8px; }

    .ko-setlist.collapsed { transform: translate(calc(100% - 32px), -50%); }
    .ko-plain.collapsed   { transform: translate(calc(-100% + 32px), -50%); }
    .ko-plain.hidden      { display: none; }

    .ko-tab {
      position: absolute;
      top: 50%;
      margin-top: -50px;
      width: 30px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: ${THEME.tabBackground};
      color: ${THEME.tabTextColor};
      font-family: var(--ko-font-body);
      font-weight: 800;
      font-size: 9px;
      letter-spacing: 0.32em;
      line-height: 1.1;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transition: filter 0.2s;
      box-shadow: ${THEME.tabShadow};
      z-index: 2;
      border: 1px solid var(--ko-ink);
    }
    .ko-tab:hover { filter: brightness(1.4); }
    .ko-setlist .ko-tab { left: -28px; border-right: none; border-radius: 3px 0 0 3px; }
    .ko-plain   .ko-tab { right: -28px; border-left: none; border-radius: 0 3px 3px 0; }
    .ko-tab::before {
      content: '';
      position: absolute;
      top: 8px; left: 50%;
      transform: translateX(-50%);
      width: 4px; height: 4px;
      background: var(--ko-orange);
      border-radius: 50%;
      box-shadow: 0 0 4px var(--ko-orange);
    }

    /* ===== HEADER ===== */
    .ko-head {
      padding: 22px 22px 14px 22px;
      position: relative;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(22,19,14,0.18);
      background:
        radial-gradient(ellipse 60% 40% at 0% 0%, rgba(30,54,184,0.06), transparent 70%),
        transparent;
    }
    .ko-head::before {
      content: 'MFG: VESPERBELL CO. // SER.NO. KRK-0925-09';
      position: absolute;
      top: 6px; left: 22px; right: 22px;
      font-family: var(--ko-font-body);
      font-size: 6.5px;
      font-weight: 500;
      letter-spacing: 0.22em;
      color: var(--ko-ink-soft);
      opacity: 0.55;
    }
    .ko-crest {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 8px 0 4px;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(22,19,14,0.25);
    }
    .ko-crest-mark {
      font-family: var(--ko-font-serif);
      font-style: italic;
      font-weight: 900;
      font-size: 22px;
      color: var(--ko-accent);
      line-height: 0.9;
      font-variation-settings: "opsz" 144;
    }
    .ko-crest-label {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.26em;
      color: var(--ko-ink);
      text-transform: uppercase;
      flex: 1;
    }
    .ko-crest::after {
      content: '◔ COLD';
      font-family: var(--ko-font-body);
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.18em;
      color: var(--ko-cream);
      background: var(--ko-red);
      padding: 3px 6px 2px;
      border-radius: 2px;
      line-height: 1;
    }
    .ko-title {
      font-family: var(--ko-font-serif);
      font-weight: 900;
      font-size: 44px;
      line-height: 0.86;
      color: var(--ko-ink);
      margin: 8px 0 4px;
      letter-spacing: -0.025em;
      font-variation-settings: "opsz" 144;
      text-transform: uppercase;
    }
    .ko-subtitle {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    .ko-subtitle::before {
      content: '';
      width: 8px;
      height: 8px;
      background: var(--ko-orange);
      border: 1px solid var(--ko-ink);
      flex-shrink: 0;
    }
    .ko-subtitle::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--ko-ink);
      opacity: 0.45;
    }

    /* ===== NOW-PLAYING (looks like an audio component) ===== */
    .ko-now {
      margin: 14px 14px 12px;
      padding: 14px 14px 12px;
      background: ${THEME.nowCardBackground};
      border: ${THEME.nowCardBorder};
      border-radius: 3px;
      box-shadow: ${THEME.nowCardShadow};
      position: relative;
      color: var(--ko-cream);
    }
    .ko-now-spec {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--ko-font-body);
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: rgba(241,236,219,0.55);
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(241,236,219,0.12);
    }
    .ko-now-spec-led {
      width: 5px; height: 5px;
      background: var(--ko-orange);
      border-radius: 50%;
      box-shadow: 0 0 5px var(--ko-orange);
      flex-shrink: 0;
      animation: ko-led-pulse 1.6s ease-in-out infinite;
    }
    @keyframes ko-led-pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--ko-orange); }
      50%      { opacity: 0.55; box-shadow: 0 0 2px var(--ko-orange); }
    }
    .ko-now-spec-ch {
      color: var(--ko-cream);
      font-weight: 800;
    }
    .ko-now-spec-grow { flex: 1; }
    .ko-now-spec-status {
      color: var(--ko-orange);
      font-weight: 800;
      letter-spacing: 0.22em;
    }
    .ko-now-anime {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 10px;
      padding: 4px 7px 3px;
      font-family: var(--ko-font-body);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.18em;
      color: var(--ko-ink);
      background: var(--ko-orange);
      border-radius: 2px;
      text-transform: uppercase;
      max-width: 100%;
      box-shadow: 0 0 8px rgba(233,122,42,0.4);
    }
    .ko-now-anime::before {
      content: '◆ ORIGIN //';
      font-size: 7px;
      letter-spacing: 0.14em;
      opacity: 0.75;
    }
    .ko-now-anime.hidden { display: none; }
    .ko-now-title {
      font-family: var(--ko-font-serif);
      font-weight: 900;
      font-size: 28px;
      line-height: 1.0;
      color: var(--ko-cream);
      margin: 4px 0 4px;
      font-variation-settings: "opsz" 144;
      letter-spacing: -0.018em;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), var(--ko-font-display), serif;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.35;
      color: rgba(241,236,219,0.75);
      margin: 0 0 6px;
      max-height: 3em;
      overflow: hidden;
      transition: opacity 0.3s, max-height 0.3s;
    }
    .ko-now-meaning.empty { max-height: 0; margin: 0; opacity: 0; }
    .ko-now-artist {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: rgba(241,236,219,0.85);
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    /* VU-meter style segmented progress */
    .ko-now-progress {
      position: relative;
      height: 12px;
      display: flex;
      gap: 1.5px;
      align-items: stretch;
      margin-top: 4px;
    }
    .ko-now-vu-seg {
      flex: 1;
      background: rgba(241,236,219,0.08);
      border-radius: 1px;
      transition: background 0.1s;
    }
    .ko-now-vu-seg.lit {
      background: var(--ko-cream);
      box-shadow: 0 0 4px rgba(241,236,219,0.5);
    }
    .ko-now-vu-seg.lit.warn {
      background: var(--ko-orange);
      box-shadow: 0 0 4px var(--ko-orange);
    }
    .ko-now-vu-seg.lit.peak {
      background: var(--ko-red);
      box-shadow: 0 0 5px var(--ko-red);
    }
    .ko-now-fill { display: none; }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 700;
      color: rgba(241,236,219,0.7);
      letter-spacing: 0.12em;
      font-variant-numeric: tabular-nums;
    }
    .ko-now-times span:first-child { color: var(--ko-orange); }

    /* ===== CTRL ===== */
    .ko-ctrls {
      display: flex;
      gap: 4px;
      margin: 0 14px 10px;
      padding: 6px;
      background: rgba(22,19,14,0.95);
      border-radius: 3px;
      border: 1px solid rgba(22,19,14,0.85);
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 7px 6px;
      background: transparent;
      border: 1px solid rgba(241,236,219,0.18);
      border-radius: 2px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s, border-color 0.2s;
      position: relative;
    }
    .ko-ctrl:hover { background: rgba(241,236,219,0.06); }
    .ko-ctrl.is-on {
      border-color: var(--ko-orange);
      background: rgba(233,122,42,0.18);
    }
    .ko-ctrl.is-on::before {
      content: '';
      position: absolute;
      top: 3px; right: 3px;
      width: 4px; height: 4px;
      background: var(--ko-orange);
      border-radius: 50%;
      box-shadow: 0 0 4px var(--ko-orange);
    }
    .ko-ctrl-label {
      font-family: var(--ko-font-body);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--ko-cream);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 800;
      color: var(--ko-orange);
      letter-spacing: 0.05em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ===== SETLIST — channel-strip rows ===== */
    .ko-list {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 8px 22px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(22,19,14,0.45) transparent;
    }
    .ko-list::-webkit-scrollbar { width: 5px; }
    .ko-list::-webkit-scrollbar-thumb {
      background: rgba(22,19,14,0.45);
      border-radius: 2px;
    }
    .ko-list::before {
      content: 'TRACK INDEX // 24CH';
      display: block;
      padding: 6px 8px 8px;
      font-family: var(--ko-font-body);
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: 0.28em;
      color: var(--ko-ink-soft);
    }
    .ko-row {
      display: flex;
      align-items: stretch;
      gap: 0;
      padding: 0;
      margin: 1px 0;
      border-radius: 2px;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
      overflow: hidden;
    }
    .ko-row:hover { background: ${THEME.rowHoverBg}; }
    .ko-row.active {
      background: ${THEME.rowActiveBg};
      box-shadow: inset 3px 0 0 ${THEME.rowActiveBar};
    }
    .ko-row-strip {
      flex-shrink: 0;
      width: 36px;
      padding: 8px 4px 8px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      border-right: 1px solid rgba(22,19,14,0.15);
      background: rgba(22,19,14,0.04);
    }
    .ko-row-idx {
      font-family: var(--ko-font-body);
      font-weight: 800;
      font-size: 11px;
      color: var(--ko-ink);
      line-height: 1;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.04em;
    }
    .ko-row-led {
      width: 5px; height: 5px;
      border: 1px solid rgba(22,19,14,0.45);
      border-radius: 50%;
      background: transparent;
    }
    .ko-row.active .ko-row-led {
      background: var(--ko-orange);
      border-color: var(--ko-orange);
      box-shadow: 0 0 5px var(--ko-orange);
    }
    .ko-row-body { flex: 1; min-width: 0; padding: 8px 10px 8px 10px; }
    .ko-row-title {
      font-family: var(--ko-font-serif);
      font-weight: 600;
      font-size: 14.5px;
      line-height: 1.18;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-variation-settings: "opsz" 60;
      letter-spacing: -0.005em;
    }
    .ko-row.active .ko-row-title { color: var(--ko-accent); font-weight: 900; }
    .ko-row-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 2px;
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 600;
      color: var(--ko-ink-soft);
      letter-spacing: 0.06em;
      white-space: nowrap;
      overflow: hidden;
    }
    .ko-row-time {
      color: var(--ko-ink);
      font-variant-numeric: tabular-nums;
      font-weight: 800;
      flex-shrink: 0;
    }
    .ko-row-artist {
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
    }
    /* Anime-OP origin tag — vertical strip on the right edge */
    .ko-row-anime {
      flex-shrink: 0;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      font-family: var(--ko-font-body);
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: var(--ko-ink);
      background: rgba(233,122,42,0.18);
      border-left: 1px solid rgba(233,122,42,0.5);
      width: 22px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      line-height: 1.05;
      transform: rotate(180deg);
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 100%;
    }
    .ko-row.active .ko-row-anime {
      background: var(--ko-orange);
      color: var(--ko-ink);
    }
    .ko-row.no-sync .ko-row-title { color: color-mix(in srgb, var(--ko-ink) 50%, transparent); }
    .ko-row.no-sync .ko-row-time  { color: color-mix(in srgb, var(--ko-ink) 50%, transparent); }
    .ko-row.no-sync .ko-row-idx   { color: color-mix(in srgb, var(--ko-ink) 50%, transparent); }
    .ko-row.no-sync .ko-row-title::after {
      content: ' ◌';
      color: var(--ko-gold);
      opacity: 0.75;
    }

    /* ===== PLAIN-LYRICS PANEL ===== */
    .ko-plain .ko-title { font-size: 26px; }
    .ko-plain-body {
      overflow-y: auto;
      padding: 10px 22px 22px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(22,19,14,0.45) transparent;
    }
    .ko-plain-body::-webkit-scrollbar { width: 5px; }
    .ko-plain-body::-webkit-scrollbar-thumb {
      background: rgba(22,19,14,0.45);
      border-radius: 2px;
    }
    .ko-plain-section { margin-bottom: 22px; }
    .ko-plain-label {
      font-family: var(--ko-font-body);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ko-accent);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ko-plain-label::before {
      content: '';
      width: 6px; height: 6px;
      background: var(--ko-accent);
      flex-shrink: 0;
    }
    .ko-plain-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--ko-ink);
      opacity: 0.3;
    }
    .ko-plain-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      font-size: 14px;
      line-height: 1.65;
      color: var(--ko-ink);
    }
    .ko-plain-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      font-size: 13px;
      line-height: 1.9;
      color: var(--ko-ink);
    }
    .ko-plain-line  { margin-bottom: 3px; }
    .ko-plain-blank { height: 12px; }

    /* ===== LYRICS ===== */
    #ko-lyrics {
      --ko-feather:
        transparent 0%,
        rgba(0,0,0,0.25) 7%,
        rgba(0,0,0,0.65) 16%,
        #000 32%,
        #000 68%,
        rgba(0,0,0,0.65) 84%,
        rgba(0,0,0,0.25) 93%,
        transparent 100%;

      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
      padding: ${THEME.lyricHazePad};

      background: ${THEME.lyricHazeTint};
      backdrop-filter: ${THEME.lyricHazeBlur};
      -webkit-backdrop-filter: ${THEME.lyricHazeBlur};

              mask-image: linear-gradient(180deg, var(--ko-feather)),
                          linear-gradient(90deg,  var(--ko-feather));
      -webkit-mask-image: linear-gradient(180deg, var(--ko-feather)),
                          linear-gradient(90deg,  var(--ko-feather));
              mask-composite: intersect;
      -webkit-mask-composite: source-in;
    }
    #ko-lyrics.ko-empty {
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
              mask-image: none;
      -webkit-mask-image: none;
      padding: 0;
    }
    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      font-size: 44px;
      line-height: 2.4;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-body);
      font-size: 21px;
      font-weight: 700;
      letter-spacing: 0.04em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: ${THEME.lyricColorJP};
      text-shadow: ${THEME.lyricShadowJP};
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 600;
      color: ${THEME.lyricColorEN};
      font-size: 40px;
      line-height: 1.22;
      letter-spacing: -0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 500; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const VU_SEGS = 28;
  const vuSegmentsHTML = Array.from({length: VU_SEGS}, (_, i) =>
    `<div class="ko-now-vu-seg" data-seg="${i}"></div>`
  ).join('');

  const setlistPanel = document.createElement('div');
  setlistPanel.className = 'ko-panel ko-setlist';
  if (window.__karaokeCollapsed) setlistPanel.classList.add('collapsed');
  setHTML(setlistPanel, `
    <div class="ko-tab" id="ko-setlist-tab" title="Collapse">${escHTML(THEME.setlistTabIcon)}</div>
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.streamTag)}</span>
      </div>
      <div class="ko-title">${THEME.streamTitle}</div>
      <div class="ko-subtitle">${escHTML(THEME.streamSubtitle)}</div>
    </div>
    <div class="ko-now">
      <div class="ko-now-spec">
        <span class="ko-now-spec-led"></span>
        <span class="ko-now-spec-ch" id="ko-now-ch">CH 00</span>
        <span>// LIVE FEED</span>
        <span class="ko-now-spec-grow"></span>
        <span class="ko-now-spec-status">REC</span>
      </div>
      <div class="ko-now-anime hidden" id="ko-now-anime"></div>
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress" id="ko-now-vu">${vuSegmentsHTML}</div>
      <div class="ko-now-fill" id="ko-now-fill"></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-skip-btn">
        <div class="ko-ctrl-label">SKIP</div>
      </div>
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">SYNC</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">MUTE</div>
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
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.plainTag)}</span>
      </div>
      <div class="ko-title" id="ko-plain-title">—</div>
      <div class="ko-subtitle">${escHTML(THEME.plainSubtitle)}</div>
    </div>
    <div class="ko-plain-body" id="ko-plain-body"></div>
  `);
  root.appendChild(plainPanel);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  // --- Setlist row rendering ---
  const listEl = document.getElementById('ko-list');
  const rowsHTML = window.__setlist.map((song, i) => {
    const noSync = !song.lrcId ? ' no-sync' : '';
    const animeBadge = song.anime
      ? `<div class="ko-row-anime" title="${escHTML(song.anime)}">${escHTML(song.anime)}</div>`
      : '';
    return `<div class="ko-row${noSync}" data-idx="${i}">
      <div class="ko-row-strip">
        <div class="ko-row-idx">${String(i + 1).padStart(2, '0')}</div>
        <div class="ko-row-led"></div>
      </div>
      <div class="ko-row-body">
        <div class="ko-row-title">${escHTML(song.name)}</div>
        <div class="ko-row-meta">
          <span class="ko-row-time">${escHTML(song.t)}</span>
          <span class="ko-row-artist">${escHTML(song.artist)}</span>
        </div>
      </div>
      ${animeBadge}
    </div>`;
  }).join('');
  setHTML(listEl, rowsHTML);

  // --- Event listeners ---
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

  const lyricsBtn   = document.getElementById('ko-lyrics-btn');
  const lyricsBtnLbl = lyricsBtn.querySelector('.ko-ctrl-label');
  const applyLyricsState = () => {
    lyricsBtnLbl.textContent = window.__karaokeLyricsHidden ? 'SHOW' : 'MUTE';
    lyrics.style.display     = window.__karaokeLyricsHidden ? 'none' : '';
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
        if (s.lrcId) {
          delete window.__lyricOffsets[s.lrcId];
          try {
            const vid = new URL(location.href).searchParams.get('v');
            window.postMessage({
              __ko: true, type: 'offset',
              videoId: vid, lrcId: s.lrcId,
              offset: null
            }, location.origin);
          } catch {}
        }
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

  // --- LRC parsing + LRCLib fetching ---
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

  // --- Cached state ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastPanelPos = '';
  let lastNowTitle = '', lastNowMeaning = '', lastNowArtist = '', lastNowCh = '', lastNowAnime = '', lastNowCur = '', lastNowDur = '', lastFill = '';
  let lastEnText = '', lastJpText = '';
  let lastOffsetStr = '';
  let lastLyricsEmpty = null;
  let lastVuLit = -1;

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
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  const vuSegEls = setlistPanel.querySelectorAll('.ko-now-vu-seg');

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
      const chStr  = song ? `CH ${String(song.idx).padStart(2,'0')}` : 'CH 00';
      const animeStr = (song && song.anime) ? song.anime : '';

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
      if (chStr !== lastNowCh) {
        document.getElementById('ko-now-ch').textContent = chStr;
        lastNowCh = chStr;
      }
      if (animeStr !== lastNowAnime) {
        const anEl = document.getElementById('ko-now-anime');
        if (anEl) {
          anEl.textContent = animeStr;
          anEl.classList.toggle('hidden', animeStr === '');
        }
        lastNowAnime = animeStr;
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
      const pct = Math.max(0, Math.min(1, inSong / songDur));
      const litCount = Math.round(pct * VU_SEGS);
      const fillStr = (pct * 100).toFixed(1) + '%';
      const curS = fmt(Math.min(inSong, songDur));
      if (litCount !== lastVuLit) {
        const warnIdx = Math.floor(VU_SEGS * 0.75);
        const peakIdx = Math.floor(VU_SEGS * 0.92);
        for (let i = 0; i < VU_SEGS; i++) {
          const lit = i < litCount;
          const seg = vuSegEls[i];
          if (!seg) continue;
          let cls = 'ko-now-vu-seg';
          if (lit) {
            cls += ' lit';
            if (i >= peakIdx) cls += ' peak';
            else if (i >= warnIdx) cls += ' warn';
          }
          if (seg.className !== cls) seg.className = cls;
        }
        lastVuLit = litCount;
      }
      if (fillStr !== lastFill) lastFill = fillStr;
      if (curS !== lastNowCur) {
        document.getElementById('ko-now-cur').textContent = curS;
        lastNowCur = curS;
      }
    } else {
      if (lastVuLit !== 0) {
        for (let i = 0; i < VU_SEGS; i++) {
          if (vuSegEls[i] && vuSegEls[i].className !== 'ko-now-vu-seg') {
            vuSegEls[i].className = 'ko-now-vu-seg';
          }
        }
        lastVuLit = 0;
      }
      if (lastFill !== '0.0%') lastFill = '0.0%';
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

    const lyricsEmpty = !lastEnText && !lastJpText;
    if (lyricsEmpty !== lastLyricsEmpty) {
      lyrics.classList.toggle('ko-empty', lyricsEmpty);
      lastLyricsEmpty = lyricsEmpty;
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
      const glossHTML = g ? escHTML(g) : ' ';
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
