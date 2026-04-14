// ============================================================================
// FUWAMOCO ROCK N' RAWR PARTY — end summer with a splash ♪
// Karaoke overlay for 夏ソング縛り (summer song restrictions) stream.
// Signature: Decade Chronicle Ribbon spanning 1963 → 2024.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    streamTag:       '#FWMCbeats',
    crestSymbol:     '♡',
    streamTitle:     'Rock n\' <em>Rawr</em><br>Party',
    streamSubtitle:  'FUWAMOCO · end summer with a splash',
    setlistTabIcon:  '♪',
    plainTag:        'Full Lyrics',
    plainSubtitle:   'untimed · scroll',
    plainTabIcon:    '♫',

    fontsHref: 'https://fonts.googleapis.com/css2?family=RocknRoll+One&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500;1,9..144,700;1,9..144,900&family=M+PLUS+Rounded+1c:wght@400;500;700;800;900&family=Zen+Maru+Gothic:wght@500;700;900&family=Caveat:wght@400;600;700&display=swap',
    fontDisplay: '"RocknRoll One", "Fraunces", serif',
    fontBody:    '"M PLUS Rounded 1c", system-ui, sans-serif',
    fontSerif:   '"Fraunces", "M PLUS Rounded 1c", serif',
    fontJP:      '"Zen Maru Gothic", "M PLUS Rounded 1c", serif',
    fontScript:  '"Caveat", cursive',

    cream:       '#FFF5E4',
    accent:      '#FF4F94',
    accentDeep:  '#D03B7D',
    accentInk:   '#9F1E60',
    ink:         '#2A1C4E',
    inkSoft:     '#6E5AAF',
    gold:        '#F7C64B',

    panelBackground: `
      radial-gradient(ellipse 90% 55% at 50% 0%, rgba(255, 230, 245, 0.85), transparent 60%),
      radial-gradient(ellipse 70% 50% at 100% 100%, rgba(126, 219, 255, 0.28), transparent 65%),
      linear-gradient(172deg, #FFF5E4 0%, #FFEAD1 38%, #FFE0C0 72%, #FFD1B8 100%)
    `,
    panelBorder:      '2px solid #FFFFFF',
    panelRadius:      '28px',
    panelShadow:      '0 28px 60px -22px rgba(42, 28, 78, 0.48), 0 14px 28px -12px rgba(255, 79, 148, 0.32), inset 0 0 0 1px rgba(255, 79, 148, 0.22)',

    tabBackground: 'linear-gradient(180deg, #FFB5D8 0%, #FF7FB8 45%, #FF4F94 100%)',
    tabTextColor:  '#FFFFFF',
    tabShadow:     '0 8px 18px -6px rgba(208, 59, 125, 0.62), inset 0 1px 0 rgba(255, 255, 255, 0.75)',

    nowCardBackground: 'linear-gradient(138deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 233, 218, 0.72) 100%)',
    nowCardBorder:     '1.5px solid rgba(255, 79, 148, 0.28)',
    nowCardShadow:     '0 12px 22px -14px rgba(42, 28, 78, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.88)',
    nowFillGradient:   'linear-gradient(90deg, #FFC6DD 0%, #FF7FB8 28%, #FF4F94 52%, #D03B7D 78%, #7EDBFF 100%)',

    rowHoverBg:   'linear-gradient(100deg, rgba(255, 79, 148, 0.14), rgba(126, 219, 255, 0.10))',
    rowActiveBg:  'linear-gradient(100deg, rgba(255, 79, 148, 0.28), rgba(126, 219, 255, 0.18))',
    rowActiveBar: '#FF4F94',

    ctrlBackground: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 240, 228, 0.7))',

    lyricColorEN: '#1E1140',
    lyricColorJP: '#1E1140',
    lyricShadowEN: `
      -2px -2px 0 #0A0420,
      2px -2px 0 #0A0420,
      -2px 2px 0 #0A0420,
      2px 2px 0 #0A0420,
      -3px 0 0 #0A0420, 3px 0 0 #0A0420, 0 -3px 0 #0A0420, 0 3px 0 #0A0420,
      0 0 10px rgba(255, 245, 228, 0.95),
      0 0 24px rgba(255, 244, 210, 0.55),
      0 0 40px rgba(126, 219, 255, 0.3)
    `,
    lyricShadowJP: `
      -2px -2px 0 #0A0420,
      2px -2px 0 #0A0420,
      -2px 2px 0 #0A0420,
      2px 2px 0 #0A0420,
      -3px 0 0 #0A0420, 3px 0 0 #0A0420, 0 -3px 0 #0A0420, 0 3px 0 #0A0420,
      0 0 8px rgba(255, 245, 228, 0.95),
      0 0 20px rgba(255, 244, 210, 0.6),
      0 0 36px rgba(255, 79, 148, 0.3)
    `,
  };

  // Decade Chronicle: each song gets an era ribbon.
  const DECADES = [
    { key: '60s', label: "'60s", range: [1960, 1969], color: '#B88759', glow: 'rgba(184, 135, 89, 0.55)',  era: 'Showa' },
    { key: '70s', label: "'70s", range: [1970, 1979], color: '#E4418A', glow: 'rgba(228, 65, 138, 0.55)',  era: 'Disco' },
    { key: '80s', label: "'80s", range: [1980, 1989], color: '#19BDB0', glow: 'rgba(25, 189, 176, 0.55)',  era: 'CityPop' },
    { key: '90s', label: "'90s", range: [1990, 1999], color: '#FF7043', glow: 'rgba(255, 112, 67, 0.55)',  era: 'Matsuri' },
    { key: '00s', label: "'00s", range: [2000, 2009], color: '#FF89C9', glow: 'rgba(255, 137, 201, 0.6)',  era: 'Y2K' },
    { key: '10s', label: "'10s", range: [2010, 2019], color: '#B4A3F8', glow: 'rgba(180, 163, 248, 0.55)', era: 'Idol' },
    { key: '20s', label: "'20s", range: [2020, 2029], color: '#7EDBFF', glow: 'rgba(126, 219, 255, 0.65)', era: 'BAU' },
  ];
  const decadeForYear = (y) => DECADES.find(d => y >= d.range[0] && y <= d.range[1]) || DECADES[4];
  const yearBadge = (y) => "'" + String(y).slice(2);

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
    colors: ['#FF4F94','#7EDBFF','#FFB130','#FF89C9','#B4A3F8','#19BDB0'],
    data: {}
  };
  if (typeof window.__karaokeCollapsed      !== 'boolean') window.__karaokeCollapsed      = false;
  if (typeof window.__karaokePlainCollapsed !== 'boolean') window.__karaokePlainCollapsed = false;
  if (typeof window.__karaokeSkipEnabled    !== 'boolean') window.__karaokeSkipEnabled    = false;
  if (typeof window.__karaokeLyricsHidden   !== 'boolean') window.__karaokeLyricsHidden   = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold    = window.__koMaxHold    || 10;
  window.__koPanelWidth = window.__koPanelWidth || 362;
  window.__koPanelPad   = window.__koPanelPad   || 22;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

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

    #karaoke-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483000; }

    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-cream-soft:  #FFEAD1;
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};
      --ko-fuwa:        #7EDBFF;
      --ko-fuwa-deep:   #4CB6F0;
      --ko-moco:        #FF4F94;
      --ko-moco-deep:   #D03B7D;

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-script:  ${THEME.fontScript};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ============= PANEL ============= */
    .ko-panel {
      position: absolute;
      width: 362px;
      max-height: 90vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-ink);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.5s cubic-bezier(.77,0,.18,1);
    }

    /* Kawaii sparkles scattered across panel */
    .ko-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        radial-gradient(circle at 12% 18%, rgba(255, 79, 148, 0.35) 0, rgba(255, 79, 148, 0) 2px),
        radial-gradient(circle at 78% 12%, rgba(126, 219, 255, 0.45) 0, rgba(126, 219, 255, 0) 2.5px),
        radial-gradient(circle at 22% 82%, rgba(247, 198, 75, 0.5) 0, rgba(247, 198, 75, 0) 1.5px),
        radial-gradient(circle at 86% 62%, rgba(255, 79, 148, 0.3) 0, rgba(255, 79, 148, 0) 2px),
        radial-gradient(circle at 48% 42%, rgba(126, 219, 255, 0.22) 0, rgba(126, 219, 255, 0) 1.2px),
        radial-gradient(circle at 62% 88%, rgba(255, 79, 148, 0.35) 0, rgba(255, 79, 148, 0) 1.5px),
        radial-gradient(circle at 8% 58%, rgba(247, 198, 75, 0.32) 0, rgba(247, 198, 75, 0) 1.2px);
      animation: sparkle 6s ease-in-out infinite;
      opacity: 0.85;
      z-index: 0;
    }
    @keyframes sparkle {
      0%, 100% { opacity: 0.85; }
      50%      { opacity: 0.5; }
    }

    .ko-panel > * { position: relative; z-index: 1; }

    .ko-setlist.collapsed { transform: translate(calc(100% - 44px), -50%); }
    .ko-plain.collapsed   { transform: translate(calc(-100% + 44px), -50%); }
    .ko-plain.hidden      { display: none; }

    /* ============= DOGGO-EAR TAB ============= */
    .ko-tab {
      position: absolute;
      top: 50%;
      margin-top: -44px;
      width: 42px;
      height: 88px;
      cursor: pointer;
      background: ${THEME.tabBackground};
      color: ${THEME.tabTextColor};
      font-family: var(--ko-font-display);
      font-size: 22px;
      line-height: 1;
      text-shadow: 0 2px 4px rgba(159, 30, 96, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, filter 0.2s;
      box-shadow: ${THEME.tabShadow};
      z-index: 3;
    }
    .ko-setlist .ko-tab { left: -40px; border-radius: 50% 0 0 50% / 55% 0 0 45%; }
    .ko-plain .ko-tab   { right: -40px; border-radius: 0 50% 50% 0 / 0 55% 45% 0; }
    .ko-tab::after {
      content: '';
      position: absolute;
      width: 22px;
      height: 34px;
      background: linear-gradient(160deg, var(--ko-fuwa) 0%, var(--ko-fuwa-deep) 100%);
      border-radius: 50% 50% 0 0 / 70% 70% 0 0;
      top: -8px;
      box-shadow: 0 -2px 6px rgba(76, 182, 240, 0.4);
      z-index: -1;
    }
    .ko-setlist .ko-tab::after { right: 8px; transform: rotate(12deg); }
    .ko-plain .ko-tab::after   { left: 8px;  transform: rotate(-12deg); }
    .ko-tab:hover { filter: brightness(1.12) saturate(1.1); transform: scale(1.08); }

    /* ============= HEADER w/ DOGGO EARS ============= */
    .ko-head {
      padding: 28px 24px 10px;
      position: relative;
      flex-shrink: 0;
    }
    /* Doggo ears peeking from the top of the panel */
    .ko-head::before, .ko-head::after {
      content: '';
      position: absolute;
      width: 42px;
      height: 54px;
      top: -14px;
      border-radius: 52% 52% 20% 20% / 60% 60% 40% 40%;
      box-shadow: 0 5px 12px -3px rgba(42, 28, 78, 0.28), inset -3px -4px 10px rgba(42, 28, 78, 0.15);
      z-index: 2;
    }
    .ko-head::before {
      left: 22px;
      background: radial-gradient(ellipse 55% 65% at 50% 72%, #FFB8DC, transparent 75%),
                  linear-gradient(160deg, #F0F9FF 0%, #B8E7FF 40%, #7EDBFF 75%, #4CB6F0 100%);
      transform: rotate(-16deg);
    }
    .ko-head::after {
      right: 22px;
      background: radial-gradient(ellipse 55% 65% at 50% 72%, #FFB5DD, transparent 75%),
                  linear-gradient(160deg, #FFF0F5 0%, #FFD4E6 40%, #FF89C9 75%, #FF4F94 100%);
      transform: rotate(16deg);
    }

    .ko-crest {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      padding-top: 14px;
    }
    .ko-crest-mark {
      font-family: var(--ko-font-body);
      font-weight: 800;
      font-size: 18px;
      color: var(--ko-moco);
      line-height: 1;
      text-shadow: 0 1px 2px rgba(208, 59, 125, 0.25);
    }
    .ko-crest-label {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.28em;
      color: var(--ko-accent-ink);
      text-transform: uppercase;
    }
    .ko-title {
      font-family: var(--ko-font-display);
      font-weight: 400;
      font-size: 30px;
      line-height: 0.95;
      color: var(--ko-ink);
      margin: 4px 0 8px;
      letter-spacing: -0.005em;
      text-shadow:
        2px 2px 0 #FFFFFF,
        3px 3px 0 rgba(255, 79, 148, 0.22);
    }
    .ko-title em {
      font-family: var(--ko-font-script);
      font-style: italic;
      font-weight: 700;
      color: var(--ko-moco);
      font-size: 42px;
      padding: 0 4px;
      display: inline-block;
      transform: translateY(3px) rotate(-3deg);
      text-shadow:
        2px 2px 0 #FFFFFF,
        3px 3px 0 rgba(126, 219, 255, 0.4);
    }
    .ko-subtitle {
      font-family: var(--ko-font-body);
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ko-subtitle::before, .ko-subtitle::after {
      content: '';
      height: 1.5px;
      flex: 1;
      background: linear-gradient(90deg, transparent, var(--ko-moco), var(--ko-fuwa), transparent);
      opacity: 0.7;
      border-radius: 999px;
    }

    /* ============= NOW-PLAYING ============= */
    .ko-now {
      margin: 10px 20px 14px;
      padding: 14px 16px 12px;
      background: ${THEME.nowCardBackground};
      border: ${THEME.nowCardBorder};
      border-radius: 18px;
      box-shadow: ${THEME.nowCardShadow};
      position: relative;
    }
    .ko-now-era {
      position: absolute;
      top: -9px;
      right: 14px;
      padding: 3px 10px 4px;
      background: var(--ko-era-color, #FF89C9);
      color: #FFFFFF;
      font-family: var(--ko-font-body);
      font-size: 9.5px;
      font-weight: 900;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      border-radius: 10px;
      box-shadow: 0 3px 10px -2px var(--ko-era-glow, rgba(255, 137, 201, 0.5));
      text-shadow: 0 1px 1px rgba(42, 28, 78, 0.3);
      z-index: 2;
    }
    .ko-now-era::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 14px;
      width: 0;
      height: 0;
      border-top: 6px solid var(--ko-era-color, #FF89C9);
      border-right: 6px solid transparent;
      filter: drop-shadow(0 2px 1px rgba(42, 28, 78, 0.18));
    }
    .ko-now-title {
      font-family: var(--ko-font-serif);
      font-weight: 900;
      font-style: italic;
      font-size: 22px;
      line-height: 1.1;
      color: var(--ko-ink);
      margin: 10px 0 2px;
      font-variation-settings: "opsz" 72;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), var(--ko-font-display), serif;
      font-size: 13px;
      line-height: 1.4;
      color: var(--ko-ink-soft);
      margin: 0 0 6px;
      max-height: 3em;
      overflow: hidden;
      transition: opacity 0.3s, max-height 0.3s;
    }
    .ko-now-meaning.empty { max-height: 0; margin: 0; opacity: 0; }
    .ko-now-artist {
      font-family: var(--ko-font-body);
      font-size: 11px;
      font-weight: 600;
      color: var(--ko-ink-soft);
      margin-bottom: 10px;
      letter-spacing: 0.04em;
    }
    .ko-now-artist::before { content: '♡ '; color: var(--ko-moco); font-weight: 800; }
    .ko-now-progress {
      position: relative;
      height: 8px;
      background: rgba(42, 28, 78, 0.12);
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.7);
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: ${THEME.nowFillGradient};
      border-radius: 999px;
      box-shadow: 0 0 14px rgba(255, 79, 148, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.5);
      transition: width 0.3s linear;
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-body);
      font-size: 9.5px;
      font-weight: 800;
      color: var(--ko-ink-soft);
      letter-spacing: 0.08em;
      font-variant-numeric: tabular-nums;
    }

    /* ============= CONTROLS ============= */
    .ko-ctrls { display: flex; gap: 6px; margin: 0 20px 10px; }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 7px 8px;
      background: ${THEME.ctrlBackground};
      border: 1.5px solid rgba(255, 79, 148, 0.28);
      border-radius: 14px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      transition: all 0.18s;
      box-shadow: 0 2px 5px -3px rgba(42, 28, 78, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }
    .ko-ctrl:hover {
      background: linear-gradient(180deg, rgba(255, 228, 240, 0.92), rgba(255, 210, 228, 0.85));
      transform: translateY(-1px);
      border-color: var(--ko-moco);
    }
    .ko-ctrl.is-on {
      background: linear-gradient(180deg, #FF89C9 0%, #FF4F94 100%);
      border-color: var(--ko-moco-deep);
      box-shadow: 0 4px 12px -4px rgba(208, 59, 125, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.45);
    }
    .ko-ctrl.is-on .ko-ctrl-label { color: #FFFFFF; text-shadow: 0 1px 2px rgba(159, 30, 96, 0.5); }
    .ko-ctrl-label {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 900;
      color: var(--ko-accent-deep);
      letter-spacing: 0.04em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ============= ROWS w/ ERA RIBBONS ============= */
    .ko-list {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 2px 14px 8px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: var(--ko-moco) transparent;
    }
    .ko-list::-webkit-scrollbar { width: 6px; }
    .ko-list::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, var(--ko-moco), var(--ko-fuwa));
      border-radius: 4px;
    }
    .ko-row {
      display: flex;
      align-items: stretch;
      gap: 10px;
      padding: 8px 10px 8px 6px;
      margin: 2px 0;
      border-radius: 14px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }
    .ko-row:hover {
      background: ${THEME.rowHoverBg};
      transform: translateX(2px);
    }
    .ko-row.active {
      background: ${THEME.rowActiveBg};
      box-shadow: inset 0 0 0 1.5px rgba(255, 79, 148, 0.55), 0 4px 12px -6px rgba(255, 79, 148, 0.45);
    }
    /* Era ribbon badge */
    .ko-row-era {
      flex-shrink: 0;
      width: 42px;
      padding: 5px 0 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0px;
      background: var(--ko-era-color, #FF89C9);
      color: #FFFFFF;
      border-radius: 10px;
      box-shadow: 0 3px 8px -3px var(--ko-era-glow, rgba(255, 137, 201, 0.55)), inset 0 1px 0 rgba(255, 255, 255, 0.55);
      position: relative;
      overflow: hidden;
    }
    .ko-row-era::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 45%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent);
      pointer-events: none;
    }
    .ko-row-year {
      font-family: var(--ko-font-display);
      font-size: 16px;
      font-weight: 400;
      letter-spacing: -0.02em;
      line-height: 1;
      text-shadow: 0 1px 2px rgba(42, 28, 78, 0.4);
    }
    .ko-row-era-label {
      font-family: var(--ko-font-body);
      font-size: 7px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.94;
      text-shadow: 0 1px 1px rgba(42, 28, 78, 0.35);
      margin-top: 2px;
    }
    .ko-row.active .ko-row-era {
      transform: scale(1.05);
      box-shadow: 0 0 0 2px #FFFFFF, 0 0 14px var(--ko-era-glow), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      animation: eraPulse 1.8s ease-in-out infinite;
    }
    @keyframes eraPulse {
      0%, 100% { box-shadow: 0 0 0 2px #FFFFFF, 0 0 14px var(--ko-era-glow), inset 0 1px 0 rgba(255, 255, 255, 0.6); }
      50%      { box-shadow: 0 0 0 2px #FFFFFF, 0 0 22px var(--ko-era-glow), inset 0 1px 0 rgba(255, 255, 255, 0.6); }
    }
    .ko-row-idx { display: none; }
    .ko-row-body { flex: 1; min-width: 0; padding: 2px 0 0; display: flex; flex-direction: column; justify-content: center; }
    .ko-row-title {
      font-family: var(--ko-font-serif);
      font-weight: 700;
      font-style: italic;
      font-size: 14px;
      line-height: 1.2;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-variation-settings: "opsz" 58;
    }
    .ko-row-meta {
      display: flex;
      gap: 8px;
      margin-top: 3px;
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 600;
      color: var(--ko-ink-soft);
      white-space: nowrap;
      overflow: hidden;
    }
    .ko-row-time {
      color: var(--ko-accent-deep);
      font-variant-numeric: tabular-nums;
      font-weight: 800;
      flex-shrink: 0;
    }
    .ko-row-artist { overflow: hidden; text-overflow: ellipsis; }
    .ko-row.no-sync .ko-row-title { color: color-mix(in srgb, var(--ko-ink) 55%, transparent); }
    .ko-row.no-sync .ko-row-title::after {
      content: ' · plain';
      color: var(--ko-ink-soft);
      font-style: normal;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.7;
    }

    /* ============= SIGNATURE: DECADE CHRONICLE ============= */
    .ko-chronicle {
      flex-shrink: 0;
      padding: 10px 16px 14px;
      background: linear-gradient(180deg, transparent 0%, rgba(255, 79, 148, 0.06) 40%, rgba(126, 219, 255, 0.08) 100%);
      border-top: 1px dashed rgba(255, 79, 148, 0.3);
      position: relative;
    }
    .ko-chron-header {
      font-family: var(--ko-font-body);
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ko-accent-ink);
      margin: 0 0 9px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ko-chron-header-l, .ko-chron-header-r {
      font-family: var(--ko-font-script);
      font-weight: 700;
      font-size: 15px;
      color: var(--ko-ink);
      text-transform: none;
      letter-spacing: 0;
      line-height: 1;
    }
    .ko-chron-header-r { color: var(--ko-moco); }
    .ko-chron-track {
      position: relative;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 3px;
    }
    .ko-chron-track::before {
      content: '';
      position: absolute;
      left: 6%; right: 6%;
      top: 50%;
      height: 2.5px;
      background: linear-gradient(90deg,
        #B88759 0%, #E4418A 17%, #19BDB0 34%, #FF7043 50%, #FF89C9 66%, #B4A3F8 83%, #7EDBFF 100%);
      opacity: 0.52;
      border-radius: 999px;
      transform: translateY(-50%);
    }
    .ko-chron-pill {
      position: relative;
      z-index: 1;
      background: #FFFFFF;
      border: 2px solid var(--ko-chron-c, #FF89C9);
      border-radius: 14px;
      padding: 4px 0 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 6px -2px rgba(42, 28, 78, 0.2);
    }
    .ko-chron-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 12px -3px var(--ko-chron-glow, rgba(255, 137, 201, 0.5));
    }
    .ko-chron-label {
      font-family: var(--ko-font-display);
      font-size: 11px;
      font-weight: 400;
      color: var(--ko-chron-c, #FF89C9);
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .ko-chron-count {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 900;
      color: var(--ko-ink);
      line-height: 1;
      letter-spacing: 0.02em;
    }
    .ko-chron-count-empty { opacity: 0.3; }
    .ko-chron-pill.active {
      background: var(--ko-chron-c);
      color: #FFFFFF;
      transform: translateY(-3px) scale(1.08);
      box-shadow: 0 0 0 2px #FFFFFF, 0 6px 16px -3px var(--ko-chron-glow, rgba(255, 137, 201, 0.7));
      animation: chronPulse 2s ease-in-out infinite;
    }
    .ko-chron-pill.active .ko-chron-label,
    .ko-chron-pill.active .ko-chron-count { color: #FFFFFF; text-shadow: 0 1px 2px rgba(42, 28, 78, 0.35); }
    @keyframes chronPulse {
      0%, 100% { box-shadow: 0 0 0 2px #FFFFFF, 0 6px 16px -3px var(--ko-chron-glow, rgba(255, 137, 201, 0.7)); }
      50%      { box-shadow: 0 0 0 2px #FFFFFF, 0 6px 24px -3px var(--ko-chron-glow, rgba(255, 137, 201, 0.95)); }
    }
    .ko-chron-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 800;
      color: var(--ko-ink-soft);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .ko-chron-footer b { color: var(--ko-accent-ink); font-weight: 900; }

    /* ============= PLAIN LYRICS PANEL ============= */
    .ko-plain .ko-title { font-size: 22px; }
    .ko-plain-body {
      overflow-y: auto;
      padding: 6px 24px 22px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: var(--ko-moco) transparent;
    }
    .ko-plain-body::-webkit-scrollbar { width: 6px; }
    .ko-plain-body::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, var(--ko-moco), var(--ko-fuwa));
      border-radius: 4px;
    }
    .ko-plain-section { margin-bottom: 22px; }
    .ko-plain-label {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 900;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ko-accent-ink);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-plain-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, var(--ko-moco), var(--ko-fuwa), transparent);
      opacity: 0.55;
    }
    .ko-plain-en {
      font-family: var(--ko-font-serif);
      font-style: italic;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.65;
      color: var(--ko-ink);
    }
    .ko-plain-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      font-size: 13px;
      line-height: 1.9;
      color: var(--ko-ink-soft);
    }
    .ko-plain-line  { margin-bottom: 3px; }
    .ko-plain-blank { height: 12px; }

    /* ============= LYRICS (video overlay) ============= */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
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
      color: #FFF5E4;
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #0A0420;
      font-size: 44px;
      line-height: 2.4;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow: 0 0 16px rgba(255, 244, 210, 0.55), 0 0 36px rgba(255, 79, 148, 0.35);
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span { paint-order: stroke fill; -webkit-text-stroke: 5px #0A0420; }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-body);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: #FFF5E4;
      paint-order: stroke fill;
      -webkit-text-stroke: 3.5px #0A0420;
      text-shadow: 0 0 10px rgba(255, 244, 210, 0.7);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-serif);
      font-weight: 500;
      font-style: italic;
      color: #FFF5E4;
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #0A0420;
      font-size: 40px;
      line-height: 1.22;
      letter-spacing: 0.005em;
      text-shadow: 0 0 16px rgba(255, 244, 210, 0.55), 0 0 36px rgba(126, 219, 255, 0.35);
      max-width: 100%;
      min-height: 1em;
      order: 2;
      font-variation-settings: "opsz" 120;
    }
    #ko-lyrics .ko-line-en span { paint-order: stroke fill; -webkit-text-stroke: 5px #0A0420; }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 400; font-style: italic; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const chronicleData = DECADES.map(d => ({
    ...d,
    count: window.__setlist.filter(s => s.year >= d.range[0] && s.year <= d.range[1]).length,
  }));

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
      <div class="ko-now-era" id="ko-now-era">·</div>
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-skip-btn"><div class="ko-ctrl-label">Skip talking</div></div>
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn"><div class="ko-ctrl-label">Hide lyrics</div></div>
    </div>
    <div class="ko-list" id="ko-list"></div>
    <div class="ko-chronicle" id="ko-chronicle">
      <div class="ko-chron-header">
        <span class="ko-chron-header-l">sixty-one</span>
        <span>DECADE CHRONICLE</span>
        <span class="ko-chron-header-r">summers</span>
      </div>
      <div class="ko-chron-track" id="ko-chron-track">
        ${chronicleData.map(d => `
          <div class="ko-chron-pill" data-decade="${d.key}"
               style="--ko-chron-c: ${d.color}; --ko-chron-glow: ${d.glow};">
            <div class="ko-chron-label">${d.label}</div>
            <div class="ko-chron-count${d.count === 0 ? ' ko-chron-count-empty' : ''}">${d.count || '·'}</div>
          </div>
        `).join('')}
      </div>
      <div class="ko-chron-footer">
        <span>1963</span>
        <span><b>14 SONGS</b> · 61 YEARS</span>
        <span>2024</span>
      </div>
    </div>
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

  // --- Setlist rows ---
  const listEl = document.getElementById('ko-list');
  const rowsHTML = window.__setlist.map((song, i) => {
    const noSync = !song.lrcId ? ' no-sync' : '';
    const decade = decadeForYear(song.year || 2024);
    return `<div class="ko-row${noSync}" data-idx="${i}"
                 style="--ko-era-color: ${decade.color}; --ko-era-glow: ${decade.glow};">
      <div class="ko-row-era">
        <div class="ko-row-year">${yearBadge(song.year)}</div>
        <div class="ko-row-era-label">${decade.era}</div>
      </div>
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

  // --- Chronicle pill seek (clicking a decade jumps to its first song) ---
  document.getElementById('ko-chron-track').addEventListener('click', e => {
    const pill = e.target.closest('.ko-chron-pill');
    if (!pill) return;
    const dec = pill.dataset.decade;
    const firstInDec = window.__setlist.find(s => decadeForYear(s.year).key === dec);
    const v = document.querySelector('video');
    if (v && firstInDec) v.currentTime = firstInDec.s;
  });

  // --- Row click ---
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
    lyricsBtnLbl.textContent = window.__karaokeLyricsHidden ? 'Show lyrics' : 'Hide lyrics';
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

  // --- LRC fetch (skipped when __parsedLyrics pre-populated) ---
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
  let lastPanelPos = '';
  let lastNowTitle = '', lastNowMeaning = '', lastNowArtist = '', lastNowCur = '', lastNowDur = '', lastFill = '';
  let lastEnText = '', lastJpText = '';
  let lastOffsetStr = '';
  let lastActiveDecade = '';
  let lastNowEra = '';

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

      const decade = song ? decadeForYear(song.year) : null;
      const eraText = song ? `${song.year} · ${decade.era}` : '·';
      if (eraText !== lastNowEra) {
        const eraEl = document.getElementById('ko-now-era');
        if (eraEl) {
          eraEl.textContent = eraText;
          if (decade) {
            eraEl.style.setProperty('--ko-era-color', decade.color);
            eraEl.style.setProperty('--ko-era-glow', decade.glow);
            eraEl.style.display = '';
          } else {
            eraEl.style.display = 'none';
          }
        }
        lastNowEra = eraText;
      }

      const activeDec = decade ? decade.key : '';
      if (activeDec !== lastActiveDecade) {
        document.querySelectorAll('.ko-chron-pill').forEach(p => {
          p.classList.toggle('active', p.dataset.decade === activeDec);
        });
        lastActiveDecade = activeDec;
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
      if (next && v.currentTime < next.s - 0.5) v.currentTime = next.s;
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
        curLineIdx = lineIdx;
        const enEl = document.getElementById('ko-line-en');
        const jpEl = document.getElementById('ko-line-jp');
        if (song.lang === 'en') {
          if (enEl && showText !== lastEnText) { enEl.textContent = showText; lastEnText = showText; }
          if (jpEl && lastJpText !== '') { jpEl.textContent = ''; lastJpText = ''; }
        } else {
          const posEn = (lineIdx >= 0 && showText && lrc[lineIdx].en) || '';
          const en = posEn || (showText && window.__transCache[showText]) || '';
          if (enEl && en !== lastEnText) { enEl.textContent = en; lastEnText = en; }
          if (jpEl && showText !== lastJpText) { jpEl.textContent = showText; lastJpText = showText; }
        }
      }
    } else if (!song || !song.lrcId) {
      if (lastEnText !== '') { document.getElementById('ko-line-en').textContent = ''; lastEnText = ''; }
      if (lastJpText !== '') { document.getElementById('ko-line-jp').textContent = ''; lastJpText = ''; }
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
        offset: Object.prototype.hasOwnProperty.call(window.__lyricOffsets, id)
          ? window.__lyricOffsets[id] : null
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
