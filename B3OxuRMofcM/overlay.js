// ============================================================================
// KARAOKE OVERLAY — FASHION BEAT 2026 — SAKURA MIKO 3D BIRTHDAY LIVE
// ----------------------------------------------------------------------------
// Editorial fashion-magazine treatment. Each song has its own "LOOK N°XX"
// with a signature color palette derived from that song's stage. The panel
// accent transforms per song (all via @property-registered custom props so
// transitions are smooth). Sakura petal drift on song change.
// ============================================================================

(() => {

  // Per-song accent palettes derived from stage frames
  const SONG_LOOKS = [
    null, // idx-1 offset
    { accent: '#CF3B4F', deep: '#8C1E32', ink: '#3D0D16', label: 'LOOK N°01', mood: 'Crimson Élite'      }, // DAIDAI Fantasista
    { accent: '#E387AE', deep: '#B0466F', ink: '#431930', label: 'LOOK N°02', mood: 'Candy Heart'        }, // Tokubechu
    { accent: '#E63A85', deep: '#A61858', ink: '#3E0B26', label: 'LOOK N°03', mood: 'Neon Boudoir'       }, // Fashion Monster
    { accent: '#B2384D', deep: '#761726', ink: '#34090F', label: 'LOOK N°04', mood: 'Kimono Carnival'    }, // Yumeiro Festival
    { accent: '#6F0E3C', deep: '#3C051E', ink: '#1F0210', label: 'LOOK N°05', mood: 'Sanctum Lace'       }, // Seishoujo Ryouiki
    { accent: '#6B8E3E', deep: '#3E5520', ink: '#161E0D', label: 'LOOK N°06', mood: 'Sunlit Meadow'      }, // Hazukashii ka Seishun wa
    { accent: '#D478A1', deep: '#9F3E6D', ink: '#431826', label: 'LOOK N°07', mood: 'Ivory Sakura'       }, // Sakihokore Idol
    { accent: '#C74884', deep: '#8A2659', ink: '#3A0C26', label: 'LOOK N°08', mood: 'Tiara Ballet'       }, // Fighting My Way
    { accent: '#8A3196', deep: '#53155D', ink: '#22062A', label: 'LOOK N°09', mood: 'Neon Revolution'    }, // Kakumei Douchuu
    { accent: '#7A3FC9', deep: '#482191', ink: '#1F0A44', label: 'LOOK N°10', mood: 'Violet Chain'       }, // CH4NGE
    { accent: '#E91E6B', deep: '#9E1248', ink: '#3D0418', label: 'LOOK N°11', mood: 'Cyber Bloom'        }, // Fashion Beat
  ];

  const BASE = {
    paper:      '#F7EADB',
    paperDeep:  '#EBD6BF',
    cream:      '#FBF3E6',
    gold:       '#B28540',
    goldBright: '#D4A764',
    ink:        '#2A1820',
    inkSoft:    '#5A3B46',
    accentInit:     SONG_LOOKS[1].accent,
    accentInitDeep: SONG_LOOKS[1].deep,
    accentInitInk:  SONG_LOOKS[1].ink,
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
    colors: ['#CF3B4F','#B28540','#2A1820','#8A3196','#D478A1','#6B8E3E'],
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
  window.__koPanelPad   = window.__koPanelPad   || 20;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());
  document.querySelectorAll('#ko-petals').forEach(e => e.remove());

  if (!document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Italiana&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Shippori+Mincho:wght@400;500;600;700;800&family=Archivo+Narrow:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap';
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    @property --ko-accent { syntax: '<color>'; inherits: true; initial-value: ${BASE.accentInit}; }
    @property --ko-accent-deep { syntax: '<color>'; inherits: true; initial-value: ${BASE.accentInitDeep}; }
    @property --ko-accent-ink { syntax: '<color>'; inherits: true; initial-value: ${BASE.accentInitInk}; }

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    #karaoke-root, #ko-lyrics, #ko-petals {
      --ko-paper: ${BASE.paper};
      --ko-paper-deep: ${BASE.paperDeep};
      --ko-cream: ${BASE.cream};
      --ko-gold: ${BASE.gold};
      --ko-gold-bright: ${BASE.goldBright};
      --ko-ink: ${BASE.ink};
      --ko-ink-soft: ${BASE.inkSoft};
      --ko-accent: ${BASE.accentInit};
      --ko-accent-deep: ${BASE.accentInitDeep};
      --ko-accent-ink: ${BASE.accentInitInk};
      transition: --ko-accent 0.9s ease, --ko-accent-deep 0.9s ease, --ko-accent-ink 0.9s ease;

      --ko-font-display: 'Italiana', serif;
      --ko-font-body: 'Cormorant Garamond', serif;
      --ko-font-caption: 'Archivo Narrow', sans-serif;
      --ko-font-numeral: 'DM Serif Display', serif;
      --ko-font-jp: 'Shippori Mincho', serif;
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ==================================================================== */
    /* BASE PANEL — the "magazine page" */
    /* ==================================================================== */
    .ko-panel {
      position: absolute;
      width: 360px;
      max-height: 88vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      color: var(--ko-ink);
      overflow: visible;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.55s cubic-bezier(.77,0,.18,1);
      background:
        radial-gradient(ellipse 140% 60% at 50% 0%, color-mix(in srgb, var(--ko-accent) 18%, transparent), transparent 62%),
        radial-gradient(ellipse 100% 50% at 100% 100%, color-mix(in srgb, var(--ko-gold) 14%, transparent), transparent 60%),
        linear-gradient(168deg, ${BASE.cream} 0%, ${BASE.paper} 60%, ${BASE.paperDeep} 100%);
      border-radius: 2px;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.7) inset,
        0 -1px 0 rgba(0,0,0,0.08) inset,
        0 28px 58px -24px rgba(58, 22, 34, 0.55);
      clip-path: polygon(
        0 0,
        100% 0,
        100% calc(100% - 18px),
        calc(100% - 18px) 100%,
        0 100%
      );
    }
    .ko-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(180deg, transparent, transparent calc(100% - 6px), color-mix(in srgb, var(--ko-gold) 25%, transparent) 100%),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='2' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 0.15 0 0 0 0 0.08 0 0 0 0 0.12 0 0 0 0.14 0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
      opacity: 0.55;
      mix-blend-mode: multiply;
      z-index: 0;
    }
    .ko-panel::after {
      content: '';
      position: absolute;
      inset: 7px;
      border: 1px solid color-mix(in srgb, var(--ko-gold) 32%, transparent);
      pointer-events: none;
      z-index: 1;
    }
    .ko-panel > * { position: relative; z-index: 2; }

    .ko-setlist.collapsed { transform: translate(calc(100% - 40px), -50%); }
    .ko-plain.collapsed   { transform: translate(calc(-100% + 40px), -50%); }
    .ko-plain.hidden      { display: none; }

    /* ==================================================================== */
    /* RIBBON BOOKMARK TABS */
    /* ==================================================================== */
    .ko-tab {
      position: absolute;
      top: 50%;
      margin-top: -42px;
      width: 36px;
      height: 84px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: linear-gradient(172deg, var(--ko-accent) 0%, var(--ko-accent-deep) 100%);
      color: ${BASE.cream};
      font-family: var(--ko-font-caption);
      font-weight: 700;
      font-size: 9px;
      letter-spacing: 0.3em;
      line-height: 1;
      text-transform: uppercase;
      writing-mode: vertical-rl;
      transition: filter 0.2s, transform 0.2s;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.3) inset,
        0 10px 22px -10px rgba(58,22,34,0.5);
      z-index: 3;
    }
    .ko-tab::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 0;
      right: 0;
      height: 12px;
      background: inherit;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
    }
    .ko-tab:hover { filter: brightness(1.08); }
    .ko-setlist .ko-tab { left: -36px; }
    .ko-plain   .ko-tab { right: -36px; }

    /* ==================================================================== */
    /* MAGAZINE HEADER */
    /* ==================================================================== */
    .ko-head {
      padding: 24px 26px 8px;
      flex-shrink: 0;
    }
    .ko-masthead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .ko-masthead-left {
      font-family: var(--ko-font-caption);
      font-weight: 700;
      font-size: 8.5px;
      letter-spacing: 0.42em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
    }
    .ko-masthead-right {
      font-family: var(--ko-font-caption);
      font-weight: 500;
      font-size: 8.5px;
      letter-spacing: 0.42em;
      text-transform: uppercase;
      color: var(--ko-accent-deep);
    }
    .ko-title-block {
      position: relative;
      padding: 6px 0 12px;
      text-align: left;
    }
    .ko-title {
      font-family: var(--ko-font-display);
      font-weight: 400;
      font-size: 42px;
      line-height: 0.88;
      color: var(--ko-ink);
      letter-spacing: 0.005em;
      text-transform: uppercase;
    }
    .ko-title em {
      font-family: var(--ko-font-body);
      font-style: italic;
      font-weight: 500;
      font-size: 0.34em;
      text-transform: none;
      letter-spacing: 0;
      color: var(--ko-accent-deep);
      display: block;
      margin-top: 6px;
    }
    .ko-title-ornament {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      font-family: var(--ko-font-caption);
      font-weight: 500;
      font-size: 8.5px;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--ko-gold);
    }
    .ko-title-ornament::before, .ko-title-ornament::after {
      content: '';
      height: 1px;
      flex: 1;
      background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--ko-gold) 60%, transparent), transparent);
    }
    .ko-title-ornament-star {
      color: var(--ko-accent);
      font-family: var(--ko-font-display);
      font-size: 13px;
      letter-spacing: 0;
      transform: translateY(-1px);
    }

    /* ==================================================================== */
    /* NOW SHOWING — THE LOOKBOOK CARD */
    /* ==================================================================== */
    .ko-now {
      margin: 4px 20px 14px;
      padding: 16px 20px 16px;
      position: relative;
      background:
        radial-gradient(ellipse 80% 100% at 0% 0%, color-mix(in srgb, var(--ko-accent) 22%, transparent), transparent 55%),
        linear-gradient(178deg, ${BASE.cream} 0%, ${BASE.paper} 100%);
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--ko-accent) 32%, transparent),
        0 1px 0 rgba(255,255,255,0.7) inset,
        0 10px 26px -10px color-mix(in srgb, var(--ko-accent-ink) 40%, transparent);
      overflow: hidden;
    }
    .ko-now::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 0%, transparent 60%, rgba(255,255,255,0.18) 75%, transparent 85%);
      pointer-events: none;
    }
    .ko-now-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 6px;
      position: relative;
    }
    .ko-now-label {
      font-family: var(--ko-font-caption);
      font-weight: 700;
      font-size: 8px;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--ko-accent-deep);
    }
    .ko-now-mood {
      font-family: var(--ko-font-body);
      font-style: italic;
      font-weight: 500;
      font-size: 11px;
      letter-spacing: 0.03em;
      color: var(--ko-ink-soft);
    }
    .ko-now-number {
      font-family: var(--ko-font-display);
      font-weight: 400;
      font-size: 52px;
      line-height: 0.85;
      color: var(--ko-accent);
      letter-spacing: 0.02em;
      margin: 2px 0 6px;
      text-shadow: 0 1px 0 rgba(255,255,255,0.5);
    }
    .ko-now-number .ko-n-small {
      font-family: var(--ko-font-body);
      font-style: italic;
      font-size: 0.32em;
      vertical-align: 0.5em;
      margin-right: 5px;
      color: var(--ko-accent-deep);
      letter-spacing: 0.02em;
    }
    .ko-now-title {
      font-family: var(--ko-font-body);
      font-weight: 600;
      font-style: italic;
      font-size: 22px;
      line-height: 1.12;
      color: var(--ko-ink);
      margin: 6px 0 2px;
      letter-spacing: 0.01em;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), var(--ko-font-body), serif;
      font-weight: 500;
      font-size: 13px;
      line-height: 1.4;
      color: var(--ko-ink-soft);
      margin: 0 0 6px;
      max-height: 3em;
      overflow: hidden;
      transition: opacity 0.3s, max-height 0.3s;
    }
    .ko-now-meaning.empty {
      max-height: 0;
      margin: 0;
      opacity: 0;
    }
    .ko-now-artist {
      font-family: var(--ko-font-caption);
      font-weight: 500;
      font-size: 9.5px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      margin: 4px 0 12px;
    }
    .ko-now-progress {
      position: relative;
      height: 3px;
      background: color-mix(in srgb, var(--ko-ink) 14%, transparent);
      overflow: visible;
    }
    .ko-now-progress::before {
      content: '';
      position: absolute;
      left: 0; right: 0;
      top: -4px;
      height: 4px;
      background-image: repeating-linear-gradient(
        to right,
        color-mix(in srgb, var(--ko-ink) 25%, transparent) 0,
        color-mix(in srgb, var(--ko-ink) 25%, transparent) 1px,
        transparent 1px,
        transparent 10px
      );
      opacity: 0.55;
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: linear-gradient(90deg, var(--ko-accent-deep), var(--ko-accent));
      box-shadow: 0 0 10px color-mix(in srgb, var(--ko-accent) 60%, transparent);
      transition: width 0.3s linear;
    }
    .ko-now-fill::after {
      content: '';
      position: absolute;
      right: -1px;
      top: -4px;
      bottom: -4px;
      width: 2px;
      background: var(--ko-accent);
      box-shadow: 0 0 6px var(--ko-accent);
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-caption);
      font-size: 9px;
      font-weight: 600;
      color: var(--ko-ink-soft);
      letter-spacing: 0.15em;
      font-variant-numeric: tabular-nums;
    }

    /* ==================================================================== */
    /* CTRL BUTTONS */
    /* ==================================================================== */
    .ko-ctrls {
      display: flex;
      gap: 6px;
      margin: 0 20px 14px;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 8px;
      background: color-mix(in srgb, ${BASE.cream} 72%, transparent);
      border: 1px solid color-mix(in srgb, var(--ko-gold) 32%, transparent);
      min-width: 0;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s, border-color 0.2s;
      position: relative;
    }
    .ko-ctrl::before {
      content: '';
      position: absolute;
      top: 3px; left: 3px; right: 3px; bottom: 3px;
      border: 1px solid color-mix(in srgb, var(--ko-gold) 18%, transparent);
      pointer-events: none;
    }
    .ko-ctrl:hover { background: color-mix(in srgb, var(--ko-accent) 12%, ${BASE.cream}); }
    .ko-ctrl.is-on {
      background: linear-gradient(172deg, var(--ko-accent), var(--ko-accent-deep));
      border-color: var(--ko-accent-deep);
    }
    .ko-ctrl.is-on .ko-ctrl-label { color: ${BASE.cream}; }
    .ko-ctrl.is-on .ko-offset { color: ${BASE.cream}; }
    .ko-ctrl-label {
      font-family: var(--ko-font-caption);
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--ko-font-caption);
      font-size: 9px;
      font-weight: 700;
      color: var(--ko-accent-deep);
      letter-spacing: 0.08em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ==================================================================== */
    /* SETLIST — "THE COLLECTION" */
    /* ==================================================================== */
    .ko-list-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 4px 24px 8px;
      font-family: var(--ko-font-caption);
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.38em;
      text-transform: uppercase;
      color: var(--ko-gold);
    }
    .ko-list-head span:last-child { color: var(--ko-ink-soft); }

    .ko-list {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 18px 20px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--ko-gold) 45%, transparent) transparent;
    }
    .ko-list::-webkit-scrollbar { width: 6px; }
    .ko-list::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--ko-gold) 45%, transparent);
    }
    .ko-row {
      display: grid;
      grid-template-columns: 30px 16px 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 11px 4px 11px 2px;
      margin: 0;
      cursor: pointer;
      position: relative;
      border-bottom: 1px dashed color-mix(in srgb, var(--ko-gold) 28%, transparent);
      transition: background 0.2s;
    }
    .ko-row:hover {
      background: color-mix(in srgb, var(--ko-accent) 8%, transparent);
    }
    .ko-row.active {
      background: linear-gradient(90deg, color-mix(in srgb, var(--ko-accent) 18%, transparent), transparent 80%);
      border-bottom-color: var(--ko-accent);
    }
    .ko-row.active::before {
      content: '';
      position: absolute;
      left: -16px;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 10px;
      background: radial-gradient(circle at 35% 35%, var(--ko-gold-bright), var(--ko-gold) 60%, ${BASE.ink} 100%);
      border-radius: 50%;
      box-shadow: 0 0 10px color-mix(in srgb, var(--ko-gold) 60%, transparent);
    }
    .ko-row-idx {
      font-family: var(--ko-font-numeral);
      font-weight: 400;
      font-style: italic;
      font-size: 20px;
      color: var(--ko-accent);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .ko-row.active .ko-row-idx { color: var(--ko-accent-deep); }
    .ko-row.no-sync .ko-row-idx { color: color-mix(in srgb, var(--ko-accent) 55%, ${BASE.paper}); }

    .ko-row-swatch {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, var(--ko-ink) 40%, transparent);
      box-shadow: 0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.4) inset;
    }
    .ko-row.active .ko-row-swatch {
      width: 12px;
      height: 12px;
      transition: width 0.3s, height 0.3s;
    }

    .ko-row-body {
      min-width: 0;
      overflow: hidden;
    }
    .ko-row-title {
      font-family: var(--ko-font-body);
      font-weight: 600;
      font-size: 14px;
      line-height: 1.15;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: 0.005em;
    }
    .ko-row-title em {
      font-family: var(--ko-font-jp);
      font-style: normal;
      font-weight: 500;
      font-size: 11px;
      color: var(--ko-ink-soft);
      display: block;
      margin-top: 2px;
      opacity: 0.88;
    }
    .ko-row-artist {
      font-family: var(--ko-font-caption);
      font-size: 8.5px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ko-row-time {
      font-family: var(--ko-font-caption);
      font-size: 10px;
      font-weight: 700;
      color: var(--ko-accent-deep);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.08em;
    }
    .ko-row.active .ko-row-time { color: var(--ko-accent); }
    .ko-row.no-sync .ko-row-title { color: color-mix(in srgb, var(--ko-ink) 62%, transparent); }
    .ko-row.no-sync .ko-row-time  { color: color-mix(in srgb, var(--ko-accent-deep) 55%, transparent); }

    /* ==================================================================== */
    /* PLAIN PANEL — "BACKSTAGE NOTES" */
    /* ==================================================================== */
    .ko-plain .ko-title { font-size: 32px; }
    .ko-plain-title-line {
      font-family: var(--ko-font-body);
      font-style: italic;
      font-weight: 500;
      font-size: 15px;
      color: var(--ko-accent-deep);
      margin-top: 6px;
    }
    .ko-plain-body {
      overflow-y: auto;
      padding: 6px 26px 22px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--ko-gold) 45%, transparent) transparent;
    }
    .ko-plain-body::-webkit-scrollbar { width: 6px; }
    .ko-plain-body::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--ko-gold) 45%, transparent);
    }
    .ko-plain-section { margin-bottom: 22px; }
    .ko-plain-label {
      font-family: var(--ko-font-caption);
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.4em;
      text-transform: uppercase;
      color: var(--ko-gold);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-plain-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, color-mix(in srgb, var(--ko-gold) 60%, transparent), transparent);
    }
    .ko-plain-en {
      font-family: var(--ko-font-body);
      font-style: italic;
      font-weight: 500;
      font-size: 14px;
      line-height: 1.65;
      color: var(--ko-ink);
    }
    .ko-plain-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      font-size: 13px;
      line-height: 1.95;
      color: var(--ko-ink);
      letter-spacing: 0.01em;
    }
    .ko-plain-line  { margin-bottom: 3px; }
    .ko-plain-blank { height: 12px; }

    /* ==================================================================== */
    /* LYRIC DISPLAY (centered on video) */
    /* ==================================================================== */
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
      color: #FFF6EA;
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #1B0A14;
      font-size: 42px;
      line-height: 2.5;
      padding-top: 0.5em;
      letter-spacing: 0.04em;
      text-shadow: 0 0 20px rgba(255, 225, 210, 0.4), 0 0 42px rgba(27, 10, 20, 0.55);
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #1B0A14;
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-caption);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.12em;
      line-height: 1.1;
      text-transform: uppercase;
      padding-bottom: 8px;
      color: #FFF6EA;
      paint-order: stroke fill;
      -webkit-text-stroke: 3px #1B0A14;
      text-shadow: 0 0 10px rgba(255, 225, 210, 0.5), 0 0 20px rgba(0,0,0,0.5);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-body);
      font-weight: 500;
      font-style: italic;
      color: #FFF6EA;
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #1B0A14;
      font-size: 40px;
      line-height: 1.22;
      letter-spacing: 0.008em;
      text-shadow: 0 0 20px rgba(255, 225, 210, 0.4), 0 0 42px rgba(27, 10, 20, 0.55);
      max-width: 100%;
      min-height: 1em;
      order: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #1B0A14;
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 30px;
      font-weight: 400;
    }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==================================================================== */
    /* SAKURA PETAL DRIFT on song change */
    /* ==================================================================== */
    #ko-petals {
      position: fixed;
      pointer-events: none;
      z-index: 2147483050;
      overflow: visible;
    }
    .ko-petal {
      position: absolute;
      width: 14px;
      height: 14px;
      background: radial-gradient(ellipse at 30% 30%, var(--ko-accent) 0%, var(--ko-accent-deep) 70%, transparent 100%);
      border-radius: 55% 0 55% 0;
      opacity: 0;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
      will-change: transform, opacity;
      animation: ko-petal-drift 2.4s ease-out forwards;
    }
    @keyframes ko-petal-drift {
      0%   { opacity: 0; transform: translate(0, -40px) rotate(0deg) scale(0.6); }
      15%  { opacity: 1; }
      85%  { opacity: 0.6; }
      100% { opacity: 0; transform: translate(var(--px, 40px), 160px) rotate(var(--pr, 360deg)) scale(1); }
    }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const setlistPanel = document.createElement('div');
  setlistPanel.className = 'ko-panel ko-setlist';
  if (window.__karaokeCollapsed) setlistPanel.classList.add('collapsed');
  setHTML(setlistPanel, `
    <div class="ko-tab" id="ko-setlist-tab" title="Collapse">SETLIST</div>
    <div class="ko-head">
      <div class="ko-masthead">
        <span class="ko-masthead-left">Fashion Beat · '26</span>
        <span class="ko-masthead-right">ISSUE №1 · MIKO</span>
      </div>
      <div class="ko-title-block">
        <div class="ko-title">
          FASHION<br>BEAT
          <em>a birthday collection · Sakura Miko</em>
        </div>
        <div class="ko-title-ornament">
          <span class="ko-title-ornament-star">✦</span>
          <span>3D Live · 生誕祭2026</span>
          <span class="ko-title-ornament-star">✦</span>
        </div>
      </div>
    </div>
    <div class="ko-now">
      <div class="ko-now-head">
        <span class="ko-now-label" id="ko-now-label">NOW SHOWING</span>
        <span class="ko-now-mood" id="ko-now-mood">intermission</span>
      </div>
      <div class="ko-now-number" id="ko-now-number"><span class="ko-n-small">LOOK N°</span>—</div>
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-skip-btn">
        <div class="ko-ctrl-label">Skip MC</div>
      </div>
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">Hide Lyrics</div>
      </div>
    </div>
    <div class="ko-list-head">
      <span>THE COLLECTION</span><span>№ · TITLE</span>
    </div>
    <div class="ko-list" id="ko-list"></div>
  `);
  root.appendChild(setlistPanel);

  const plainPanel = document.createElement('div');
  plainPanel.className = 'ko-panel ko-plain hidden';
  if (window.__karaokePlainCollapsed) plainPanel.classList.add('collapsed');
  setHTML(plainPanel, `
    <div class="ko-tab" id="ko-plain-tab" title="Collapse">BACKSTAGE</div>
    <div class="ko-head">
      <div class="ko-masthead">
        <span class="ko-masthead-left">Backstage Notes</span>
        <span class="ko-masthead-right">UNTIMED · LYRICS</span>
      </div>
      <div class="ko-title-block">
        <div class="ko-title" id="ko-plain-title">—</div>
        <div class="ko-plain-title-line" id="ko-plain-subtitle"></div>
      </div>
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

  const petalLayer = document.createElement('div');
  petalLayer.id = 'ko-petals';
  document.body.appendChild(petalLayer);

  // --- Setlist row rendering ---
  const listEl = document.getElementById('ko-list');
  const rowsHTML = window.__setlist.map((song, i) => {
    const look = SONG_LOOKS[song.idx] || SONG_LOOKS[1];
    const noSync = !song.lrcId ? ' no-sync' : '';
    return `<div class="ko-row${noSync}" data-idx="${i}">
      <div class="ko-row-idx">${String(song.idx).padStart(2, '0')}</div>
      <div class="ko-row-swatch" style="background: linear-gradient(135deg, ${look.accent}, ${look.deep});"></div>
      <div class="ko-row-body">
        <div class="ko-row-title">${escHTML(song.name)}${song.originalTitle && song.originalTitle !== song.name ? `<em>${escHTML(song.originalTitle)}</em>` : ''}</div>
        <div class="ko-row-artist">${escHTML(song.artist)}</div>
      </div>
      <div class="ko-row-time">${escHTML(song.t)}</div>
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

  const lyricsBtn   = document.getElementById('ko-lyrics-btn');
  const lyricsBtnLbl = lyricsBtn.querySelector('.ko-ctrl-label');
  const applyLyricsState = () => {
    lyricsBtnLbl.textContent = window.__karaokeLyricsHidden ? 'Show Lyrics' : 'Hide Lyrics';
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
  let lastNowTitle = '', lastNowMeaning = '', lastNowArtist = '';
  let lastNowNumber = '', lastNowMood = '';
  let lastNowCur = '', lastNowDur = '', lastFill = '';
  let lastEnText = '', lastJpText = '';
  let lastOffsetStr = '';
  let lastAccent = '';

  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  };

  const releasePetals = () => {
    if (!petalLayer) return;
    while (petalLayer.firstChild) petalLayer.removeChild(petalLayer.firstChild);
    const r = setlistPanel.getBoundingClientRect();
    if (r.width < 50) return;
    petalLayer.style.left = r.left + 'px';
    petalLayer.style.top = r.top + 'px';
    petalLayer.style.width = r.width + 'px';
    petalLayer.style.height = r.height + 'px';
    const n = 14;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'ko-petal';
      const startX = Math.random() * (r.width * 0.9);
      const startY = Math.random() * 20;
      const dx = (Math.random() - 0.5) * 80;
      const dr = (Math.random() * 540) + 180;
      p.style.left = startX + 'px';
      p.style.top = startY + 'px';
      p.style.setProperty('--px', dx + 'px');
      p.style.setProperty('--pr', dr + 'deg');
      p.style.animationDelay = (Math.random() * 0.8) + 's';
      petalLayer.appendChild(p);
    }
    setTimeout(() => {
      while (petalLayer.firstChild) petalLayer.removeChild(petalLayer.firstChild);
    }, 4000);
  };

  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    // Prefer movie_player rect over <video> — in theater mode and certain
    // layout states YouTube positions the <video> element off-screen while
    // keeping movie_player correct. Fall back to video rect if mp missing.
    const mp = document.getElementById('movie_player');
    const r = mp ? mp.getBoundingClientRect() : v.getBoundingClientRect();
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
      lyrics.style.width    = (r.width * 0.64) + 'px';
      lyrics.style.maxWidth = (r.width * 0.64) + 'px';
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
    const look    = song ? SONG_LOOKS[song.idx] : null;

    if (idx !== curSongIdx) {
      curSongIdx = idx;
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      const newAccent = look ? look.accent : BASE.accentInit;
      if (newAccent !== lastAccent) {
        lastAccent = newAccent;
        root.style.setProperty('--ko-accent', look ? look.accent : BASE.accentInit);
        root.style.setProperty('--ko-accent-deep', look ? look.deep : BASE.accentInitDeep);
        root.style.setProperty('--ko-accent-ink', look ? look.ink : BASE.accentInitInk);
        lyrics.style.setProperty('--ko-accent', look ? look.accent : BASE.accentInit);
        petalLayer.style.setProperty('--ko-accent', look ? look.accent : BASE.accentInit);
        petalLayer.style.setProperty('--ko-accent-deep', look ? look.deep : BASE.accentInitDeep);
        if (song) releasePetals();
      }

      const title = song ? song.name : '—';
      let meaning = '';
      if (song) {
        const jpPart = (song.originalTitle && song.originalTitle !== song.name) ? song.originalTitle : '';
        const enPart = (song.nameEn && song.nameEn !== song.name) ? song.nameEn : '';
        meaning = jpPart && enPart ? `${jpPart} · ${enPart}` : (jpPart || enPart || '');
      }
      const artist = song ? song.artist : '—';
      const durS   = fmt(songDur);
      const numStr = look ? look.label.replace('LOOK N°','') : '—';
      const moodStr = look ? look.mood : 'intermission';

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
      if (numStr !== lastNowNumber) {
        const nEl = document.getElementById('ko-now-number');
        if (nEl) setHTML(nEl, `<span class="ko-n-small">LOOK N°</span>${escHTML(numStr)}`);
        lastNowNumber = numStr;
      }
      if (moodStr !== lastNowMood) {
        const mEl = document.getElementById('ko-now-mood');
        if (mEl) mEl.textContent = moodStr;
        lastNowMood = moodStr;
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
        const subEl = document.getElementById('ko-plain-subtitle');
        if (subEl) {
          const parts = [];
          if (song.originalTitle && song.originalTitle !== song.name) parts.push(song.originalTitle);
          if (song.nameEn && song.nameEn !== song.name) parts.push(song.nameEn);
          subEl.textContent = parts.join(' · ');
        }
        const body = document.getElementById('ko-plain-body');
        const jpLines = plainData.jp || [];
        const enLines = plainData.en || [];
        const mkLines = (lines) => lines.map(l =>
          l === '' ? '<div class="ko-plain-blank"></div>' : `<div class="ko-plain-line">${escHTML(l)}</div>`
        ).join('');
        setHTML(body, `
          <div class="ko-plain-section">
            <div class="ko-plain-label">日本語 · Original</div>
            <div class="ko-plain-jp">${mkLines(jpLines)}</div>
          </div>
          <div class="ko-plain-section">
            <div class="ko-plain-label">English · Translation</div>
            <div class="ko-plain-en">${mkLines(enLines)}</div>
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
