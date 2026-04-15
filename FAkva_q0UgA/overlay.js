// ============================================================================
// KARAOKE OVERLAY — Malice Evermore · "真夜中のドア / Stay With Me" (COVER)
// Original by Miki Matsubara (1979 city pop classic)
//
// Design: warm pink atelier (cello, pendant lamps, brick walls) bending into
// 70s Tokyo city-pop salon — dusty rose & ivory panel, brass art-deco frame,
// wine-red accents echo her mic/lips. The lyric card is literally a MIDNIGHT
// DOOR: ornate brass-plated door frame with keyhole glyph, amber glow spilling
// out, a subtle knock-shake every time a new line fires. Direct visual pun on
// 真夜中のドアをたたき (knocking on the midnight door) — every line is a knock.
// ============================================================================

(() => {

  const THEME = {
    headerTag:       'CITY POP · COVER',
    crestSymbol:     '𝄞',
    headerSubtitle:  '松原みき · 1979',

    fontsHref: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Marcellus&family=Inter:wght@400;500;600;700;800&family=Shippori+Mincho:wght@400;500;600;700;800&display=swap',
    fontDisplay: '"Cormorant Garamond", serif',
    fontPlate:   '"Marcellus", serif',
    fontBody:    '"Inter", sans-serif',
    fontJP:      '"Shippori Mincho", serif',

    cream:      '#f6e5d2',
    creamDeep:  '#ebcfb5',
    rose:       '#d77e8e',
    roseDeep:   '#a84560',
    wine:       '#6d1e35',
    wineDeep:   '#4a0f23',
    brass:      '#cc9a54',
    brassLight: '#e8c17a',
    ink:        '#2a1017',
    inkSoft:    '#6a3a4a',
    midnight:   '#12182e',
    amber:      '#ffb859',
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
    // Warm city-pop neon palette that reads against both the pink-atelier video
    // and the dark-wine door frame. Tuned for contrast against deep-wine card.
    colors: ['#ffd86b','#ff8fb1','#9ee8ff','#ffb37a','#c8b4ff','#7dffc3'],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold    = window.__koMaxHold    || 10;
  window.__koPanelWidth = window.__koPanelWidth || 360;
  window.__koPanelPad   = window.__koPanelPad   || 20;

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

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    #karaoke-root, #ko-lyrics {
      --ko-cream:      ${THEME.cream};
      --ko-cream-deep: ${THEME.creamDeep};
      --ko-rose:       ${THEME.rose};
      --ko-rose-deep:  ${THEME.roseDeep};
      --ko-wine:       ${THEME.wine};
      --ko-wine-deep:  ${THEME.wineDeep};
      --ko-brass:      ${THEME.brass};
      --ko-brass-lt:   ${THEME.brassLight};
      --ko-ink:        ${THEME.ink};
      --ko-ink-soft:   ${THEME.inkSoft};
      --ko-midnight:   ${THEME.midnight};
      --ko-amber:      ${THEME.amber};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-plate:   ${THEME.fontPlate};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ============ VINTAGE SALON PANEL (right side) ============
       A 70s city-pop album-sleeve card: warm cream paper, brass foil border,
       engraved rose title plate, and a faint midnight-blue cityline strip at
       the bottom as the ONE cool-tone nod toward 真夜中 (midnight). */
    .ko-header {
      position: absolute;
      width: 360px;
      pointer-events: auto;
      background:
        radial-gradient(ellipse 120% 70% at 50% 0%, rgba(255,255,255,0.45), transparent 60%),
        linear-gradient(168deg,
          ${THEME.cream} 0%,
          ${THEME.creamDeep} 55%,
          #dfb5a0 100%);
      border: 1px solid rgba(109, 30, 53, 0.35);
      border-radius: 4px;
      box-shadow:
        0 28px 64px -24px rgba(74, 15, 35, 0.55),
        0 0 0 6px rgba(204, 154, 84, 0.14),
        0 0 0 7px rgba(204, 154, 84, 0.35),
        inset 0 0 0 1px rgba(255, 255, 255, 0.45);
      color: var(--ko-ink);
      overflow: hidden;
      transform: translateY(-50%);
      padding-bottom: 0;
    }
    /* Brass art-deco border corners — sunburst notched corners */
    .ko-header::before {
      content: '';
      position: absolute;
      inset: 10px;
      border: 1px solid rgba(109, 30, 53, 0.4);
      border-radius: 2px;
      pointer-events: none;
      mask:
        linear-gradient(90deg, #000 0 26px, transparent 26px calc(100% - 26px), #000 calc(100% - 26px) 100%),
        linear-gradient(180deg, #000 0 26px, transparent 26px calc(100% - 26px), #000 calc(100% - 26px) 100%);
      -webkit-mask:
        linear-gradient(90deg, #000 0 26px, transparent 26px calc(100% - 26px), #000 calc(100% - 26px) 100%),
        linear-gradient(180deg, #000 0 26px, transparent 26px calc(100% - 26px), #000 calc(100% - 26px) 100%);
      mask-composite: intersect;
      -webkit-mask-composite: source-in;
    }
    /* Gold foil grain */
    .ko-header::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        repeating-linear-gradient(45deg, rgba(204,154,84,0.06) 0 2px, transparent 2px 4px),
        radial-gradient(ellipse at 80% 90%, rgba(74,15,35,0.12), transparent 60%);
      mix-blend-mode: multiply;
    }

    .ko-head {
      padding: 26px 28px 14px;
      position: relative;
      text-align: center;
    }
    .ko-crest {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 14px;
    }
    .ko-crest-mark {
      font-family: var(--ko-font-plate);
      font-size: 30px;
      color: var(--ko-wine);
      line-height: 0.9;
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.7));
    }
    .ko-crest-label {
      font-family: var(--ko-font-plate);
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0.44em;
      color: var(--ko-wine);
      text-transform: uppercase;
      padding: 0 4px;
    }
    .ko-crest::before, .ko-crest::after {
      content: '';
      width: 22px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--ko-brass), transparent);
    }
    .ko-subtitle {
      font-family: var(--ko-font-plate);
      font-size: 10.5px;
      font-weight: 400;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 0;
    }
    .ko-subtitle::before, .ko-subtitle::after {
      content: '';
      height: 1px;
      width: 28px;
      background: var(--ko-brass);
      opacity: 0.55;
    }

    /* ============ VINYL + TITLE PLATE (now-playing card) ============
       Card styled as a brass name-plate on cream paper. The vinyl disc sits
       to the left as a decorative glyph; the title is engraved serif. */
    .ko-now {
      margin: 16px 22px 18px;
      padding: 20px 20px 16px 82px;
      background:
        linear-gradient(180deg,
          rgba(255, 248, 234, 0.92) 0%,
          rgba(243, 220, 195, 0.9) 100%);
      border: 1px solid rgba(109, 30, 53, 0.28);
      border-radius: 3px;
      box-shadow:
        0 10px 22px -14px rgba(74, 15, 35, 0.35),
        inset 0 0 0 1px rgba(255, 255, 255, 0.55),
        inset 0 -1px 0 rgba(204, 154, 84, 0.35);
      position: relative;
    }
    /* Decorative vinyl record to the left of the plate */
    .ko-vinyl {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 50% 50%,
          var(--ko-roseDeep, #a84560) 0 10px,
          transparent 10px 13px,
          #1a0a10 13px 15px,
          #2a1018 15px 17px,
          #1a0a10 17px 19px,
          #2a1018 19px 21px,
          #1a0a10 21px 23px,
          #2a1018 23px 25px,
          #1a0a10 25px 27px);
      box-shadow:
        0 2px 6px rgba(74,15,35,0.45),
        inset 0 0 10px rgba(0,0,0,0.55);
      animation: ko-spin 8s linear infinite;
    }
    .ko-vinyl::after {
      content: '';
      position: absolute;
      inset: 24px;
      background: var(--ko-wine);
      border-radius: 50%;
      box-shadow: inset 0 0 0 1px var(--ko-brass);
    }
    @keyframes ko-spin { to { transform: translateY(-50%) rotate(360deg); } }

    .ko-now-title {
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-style: italic;
      font-size: 22px;
      line-height: 1.1;
      color: var(--ko-wine-deep);
      margin: 2px 0 4px;
      letter-spacing: 0.01em;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp);
      font-size: 13px;
      font-weight: 500;
      line-height: 1.35;
      color: var(--ko-ink-soft);
      margin: 0 0 8px;
      max-height: 3em;
      overflow: hidden;
      transition: opacity 0.3s, max-height 0.3s;
    }
    .ko-now-meaning.empty { max-height: 0; margin: 0; opacity: 0; }
    .ko-now-artist {
      font-family: var(--ko-font-plate);
      font-size: 9.5px;
      font-weight: 400;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ko-inkSoft, var(--ko-ink-soft));
      margin-bottom: 12px;
    }
    .ko-now-progress {
      position: relative;
      height: 4px;
      background: rgba(109, 30, 53, 0.18);
      border-radius: 0;
      overflow: hidden;
      border-top: 1px solid rgba(204, 154, 84, 0.4);
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: linear-gradient(90deg, var(--ko-brass-lt) 0%, var(--ko-rose) 50%, var(--ko-wine) 100%);
      box-shadow: 0 0 8px rgba(215, 126, 142, 0.55);
      transition: width 0.3s linear;
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-plate);
      font-size: 9.5px;
      font-weight: 400;
      color: var(--ko-ink-soft);
      letter-spacing: 0.14em;
      font-variant-numeric: tabular-nums;
    }

    /* ============ CITYLINE STRIP (bottom of panel) ============
       The one cool-tone nod — tiny midnight-blue skyline with pinprick lights,
       like a 1979 jacket sleeve illustration. */
    .ko-cityline {
      height: 56px;
      background:
        linear-gradient(180deg, transparent 0%, rgba(18,24,46,0.02) 30%, rgba(18,24,46,0.95) 100%),
        linear-gradient(180deg, rgba(18,24,46,0.4), rgba(18,24,46,0.95));
      position: relative;
      margin: 0 10px 10px;
      border-radius: 2px;
      overflow: hidden;
      border: 1px solid rgba(109,30,53,0.2);
    }
    .ko-cityline::before {
      content: '';
      position: absolute;
      left: 0; right: 0; bottom: 0;
      height: 32px;
      background:
        linear-gradient(90deg,
          transparent 0 4%,    #000 4% 9%,
          transparent 9% 13%,  #000 13% 16%,
          transparent 16% 22%, #000 22% 29%,
          transparent 29% 32%, #000 32% 36%,
          transparent 36% 42%, #000 42% 48%,
          transparent 48% 53%, #000 53% 58%,
          transparent 58% 63%, #000 63% 70%,
          transparent 70% 74%, #000 74% 78%,
          transparent 78% 84%, #000 84% 91%,
          transparent 91% 100%);
      mask-image: linear-gradient(180deg, #000 0 18px,
        #000 18px 20px, /* building tops start */
        #000 100%);
      clip-path: polygon(
        0% 100%,  0% 85%,   4% 85%,  4% 60%,   9% 60%,  9% 85%,
        13% 85%, 13% 50%,  16% 50%,  16% 85%,
        22% 85%, 22% 35%,  29% 35%,  29% 85%,
        32% 85%, 32% 55%,  36% 55%,  36% 85%,
        42% 85%, 42% 25%,  48% 25%,  48% 85%,
        53% 85%, 53% 45%,  58% 45%,  58% 85%,
        63% 85%, 63% 30%,  70% 30%,  70% 85%,
        74% 85%, 74% 55%,  78% 55%,  78% 85%,
        84% 85%, 84% 40%,  91% 40%,  91% 85%,
        100% 85%, 100% 100%);
      background: #05070f;
    }
    .ko-cityline::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(1px 1px at 14% 48%, rgba(255,184,89,0.9), transparent 60%),
        radial-gradient(1px 1px at 26% 62%, rgba(255,184,89,0.7), transparent 60%),
        radial-gradient(1px 1px at 44% 42%, rgba(255,215,150,0.9), transparent 60%),
        radial-gradient(1px 1px at 56% 58%, rgba(255,184,89,0.8), transparent 60%),
        radial-gradient(1px 1px at 68% 50%, rgba(255,215,150,0.85), transparent 60%),
        radial-gradient(1px 1px at 82% 55%, rgba(255,184,89,0.75), transparent 60%),
        radial-gradient(1px 1px at 92% 48%, rgba(255,215,150,0.95), transparent 60%);
      animation: ko-citylights 5s ease-in-out infinite alternate;
    }
    @keyframes ko-citylights {
      from { opacity: 0.55; }
      to   { opacity: 1;    }
    }

    /* ============ CTRLS ============ */
    .ko-ctrls {
      display: flex;
      gap: 6px;
      margin: 0 22px 14px;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 10px;
      background: rgba(255, 248, 234, 0.55);
      border: 1px solid rgba(109, 30, 53, 0.28);
      border-radius: 2px;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s;
    }
    .ko-ctrl:hover { background: rgba(255, 248, 234, 0.85); }
    .ko-ctrl.is-on { border-color: var(--ko-wine); background: rgba(255, 215, 180, 0.6); }
    .ko-ctrl-label {
      font-family: var(--ko-font-plate);
      font-size: 8.5px;
      font-weight: 400;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ko-wine-deep);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--ko-font-plate);
      font-size: 10px;
      font-weight: 400;
      color: var(--ko-wine);
      letter-spacing: 0.08em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ============ MIDNIGHT-DOOR LYRIC FRAME ============
       #ko-lyrics is the centered lyric zone; inside it we build an ornate
       door frame: deep wine plank, brass art-deco panel outline, keyhole glyph
       at top. Amber light glows behind the text — like light spilling past
       the door that's just been knocked on. Every JP textContent change
       fires a .knocking class for ~460ms (one brass-shake + amber pulse).
       This animation is the signature feature — it triggers every single line.
       There's no other song where a "knock + door-glow" animation makes
       physical sense. 真夜中のドアをたたき — literally. */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    /* The door frame: wine-brown plank, brass double-border, keyhole. */
    .ko-door {
      position: relative;
      padding: 52px 56px 40px;
      border-radius: 6px 6px 10px 10px;
      background:
        radial-gradient(ellipse 80% 55% at 50% 45%, rgba(255,184,89,0.18), transparent 70%),
        linear-gradient(172deg, rgba(40,12,22,0.82), rgba(74,15,35,0.82) 60%, rgba(109,30,53,0.82) 100%);
      box-shadow:
        0 30px 70px -30px rgba(0,0,0,0.9),
        0 0 0 1px rgba(204,154,84,0.65),
        0 0 0 4px rgba(74,15,35,0.7),
        0 0 0 5px rgba(204,154,84,0.55),
        inset 0 0 0 1px rgba(232,193,122,0.35),
        inset 0 0 38px rgba(0,0,0,0.55),
        inset 0 2px 0 rgba(255,215,160,0.18);
      backdrop-filter: blur(6px) saturate(1.15);
      -webkit-backdrop-filter: blur(6px) saturate(1.15);
      transform-origin: 50% 50%;
      transition: transform 0.12s ease-out;
    }
    /* Art-deco sunburst corner brackets — brass filaments at each corner. */
    .ko-door::before {
      content: '';
      position: absolute;
      inset: 14px;
      border: 1px solid rgba(232, 193, 122, 0.45);
      border-radius: 3px;
      pointer-events: none;
      mask:
        linear-gradient(90deg, #000 0 36px, transparent 36px calc(100% - 36px), #000 calc(100% - 36px) 100%),
        linear-gradient(180deg, #000 0 36px, transparent 36px calc(100% - 36px), #000 calc(100% - 36px) 100%);
      -webkit-mask:
        linear-gradient(90deg, #000 0 36px, transparent 36px calc(100% - 36px), #000 calc(100% - 36px) 100%),
        linear-gradient(180deg, #000 0 36px, transparent 36px calc(100% - 36px), #000 calc(100% - 36px) 100%);
      mask-composite: intersect;
      -webkit-mask-composite: source-in;
    }
    /* The keyhole glyph centered at the top of the door, above the lyric. */
    .ko-door-keyhole {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      width: 18px;
      height: 24px;
      pointer-events: none;
    }
    .ko-door-keyhole::before {
      content: '';
      position: absolute;
      top: 0;
      left: 5px;
      width: 8px;
      height: 10px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,184,89,0.9), rgba(232,193,122,0.5) 60%, transparent 80%);
      box-shadow: 0 0 8px rgba(255,184,89,0.6);
    }
    .ko-door-keyhole::after {
      content: '';
      position: absolute;
      top: 7px;
      left: 7.5px;
      width: 3px;
      height: 14px;
      background: linear-gradient(180deg, rgba(232,193,122,0.9), rgba(204,154,84,0.5));
      box-shadow: 0 0 6px rgba(255,184,89,0.5);
    }
    /* Amber door-crack glow: a thin sliver of warm light at the bottom edge,
       like light spilling under the door. Intensifies on knock. */
    .ko-door-crack {
      position: absolute;
      left: 18%;
      right: 18%;
      bottom: -2px;
      height: 3px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(255,184,89,0.55) 20%,
        rgba(255,215,150,0.9) 50%,
        rgba(255,184,89,0.55) 80%,
        transparent 100%);
      filter: blur(1.5px);
      pointer-events: none;
      opacity: 0.7;
      transition: opacity 0.3s;
    }
    /* Slot contains the lyric text. */
    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      position: relative;
      z-index: 2;
    }

    /* Lyric typography — the actual words. Warm cream text with wine-shadow
       stroke so they read against both the door backdrop AND the video behind. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: #fef1d6;
      paint-order: stroke fill;
      -webkit-text-stroke: 4px #2a0a15;
      font-size: 44px;
      line-height: 2.3;
      padding-top: 0.35em;
      letter-spacing: 0.04em;
      text-shadow:
        0 0 14px rgba(255, 184, 89, 0.55),
        0 0 30px rgba(255, 215, 160, 0.35),
        0 2px 0 rgba(0,0,0,0.6);
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: 4px #2a0a15;
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 600;
      font-style: italic;
      letter-spacing: 0.02em;
      line-height: 1.05;
      padding-bottom: 6px;
      color: #fff1d6;
      paint-order: stroke fill;
      -webkit-text-stroke: 2.5px #2a0a15;
      text-shadow:
        0 0 8px rgba(255, 184, 89, 0.55),
        0 1px 0 rgba(0,0,0,0.5);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      font-style: italic;
      color: #fef1d6;
      paint-order: stroke fill;
      -webkit-text-stroke: 4px #2a0a15;
      font-size: 40px;
      line-height: 1.2;
      letter-spacing: 0.015em;
      text-shadow:
        0 0 14px rgba(255, 184, 89, 0.55),
        0 0 28px rgba(255, 215, 160, 0.3),
        0 2px 0 rgba(0,0,0,0.55);
      max-width: 100%;
      min-height: 1em;
      order: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: 4px #2a0a15;
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 32px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ============ KNOCK ANIMATION ============
       Fires on every JP textContent change — a tight left/right shake
       mimicking a physical knock on the door, plus amber bloom from within. */
    @keyframes ko-knock {
      0%   { transform: translateX(0)    rotate(0);       }
      15%  { transform: translateX(-5px) rotate(-0.35deg); }
      35%  { transform: translateX(5px)  rotate(0.4deg);  }
      55%  { transform: translateX(-3px) rotate(-0.2deg); }
      75%  { transform: translateX(2px)  rotate(0.1deg);  }
      100% { transform: translateX(0)    rotate(0);       }
    }
    @keyframes ko-bloom {
      0%   { opacity: 0.7;  filter: blur(1.5px); }
      35%  { opacity: 1;    filter: blur(0.5px); }
      100% { opacity: 0.7;  filter: blur(1.5px); }
    }
    @keyframes ko-doorlight {
      0%, 100% { box-shadow:
        0 30px 70px -30px rgba(0,0,0,0.9),
        0 0 0 1px rgba(204,154,84,0.65),
        0 0 0 4px rgba(74,15,35,0.7),
        0 0 0 5px rgba(204,154,84,0.55),
        inset 0 0 0 1px rgba(232,193,122,0.35),
        inset 0 0 38px rgba(0,0,0,0.55),
        inset 0 2px 0 rgba(255,215,160,0.18); }
      35% { box-shadow:
        0 30px 70px -30px rgba(0,0,0,0.9),
        0 0 0 1px rgba(232,193,122,0.95),
        0 0 0 4px rgba(74,15,35,0.7),
        0 0 0 5px rgba(232,193,122,0.85),
        0 0 40px rgba(255,184,89,0.35),
        inset 0 0 0 1px rgba(255,215,160,0.65),
        inset 0 0 60px rgba(255,184,89,0.35),
        inset 0 2px 0 rgba(255,215,160,0.45); }
    }
    .ko-door.knocking {
      animation:
        ko-knock    0.46s cubic-bezier(.36,.08,.34,1) 1,
        ko-doorlight 0.56s ease-out 1;
    }
    .ko-door.knocking .ko-door-crack { animation: ko-bloom 0.6s ease-out 1; opacity: 1; }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const headerPanel = document.createElement('div');
  headerPanel.className = 'ko-header';
  setHTML(headerPanel, `
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.headerTag)}</span>
      </div>
      <div class="ko-subtitle">${escHTML(THEME.headerSubtitle)}</div>
    </div>
    <div class="ko-now">
      <div class="ko-vinyl"></div>
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">Hide lyrics</div>
      </div>
    </div>
    <div class="ko-cityline"></div>
  `);
  root.appendChild(headerPanel);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-door">
      <div class="ko-door-keyhole"></div>
      <div class="ko-slot">
        <div class="ko-line-jp" id="ko-line-jp"></div>
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>
      <div class="ko-door-crack"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  const lyricsBtn    = document.getElementById('ko-lyrics-btn');
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
      let hLeft = r.right + PAD;
      if (hLeft + PW > window.innerWidth - 8) hLeft = window.innerWidth - PW - 8;
      headerPanel.style.left = hLeft + 'px';
      headerPanel.style.top = (r.top + r.height / 2) + 'px';
      headerPanel.style.width = PW + 'px';

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

  // --- Colorizer: poll JP textContent, rewrite with colored spans + ruby gloss.
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

  // --- KNOCK_POLL: the signature feature. Watches JP textContent and fires
  //     the .knocking class on the door every time a new line appears.
  //     Forced reflow between class-off and class-on so the animation
  //     retriggers even when the same-named animation was mid-run. ---
  let _lastKnockJp = '';
  const KNOCK_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(KNOCK_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    const door = document.querySelector('#ko-lyrics .ko-door');
    if (!door) return;
    // For EN-only songs there's no JP — watch EN text instead.
    const watchEl = (jpEl && jpEl.textContent.trim()) ? jpEl : enEl;
    if (!watchEl) return;
    const cur = watchEl.textContent;
    if (cur === _lastKnockJp) return;
    _lastKnockJp = cur;
    if (!cur.trim()) return;
    door.classList.remove('knocking');
    // force reflow
    void door.offsetWidth;
    door.classList.add('knocking');
  }, 60);

})();
