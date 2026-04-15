// ============================================================================
// KARAOKE OVERLAY — CUTE NA KANOJO (FUWAMOCO cover of syudou)
// ----------------------------------------------------------------------------
// Signature feature: "Kanji Possession" — on every new JP lyric, a huge sumi-ink
// brushed character of the first kanji/kana rises behind the lyric card with a
// pink/cyan chromatic aberration split, scale-pulses, and fades. Simultaneously,
// the JP line itself fires in with a chromatic split that snaps back to center.
// The panel is vertically bisected — Fuwawa-pink on the left, Mococo-blue on
// the right — meeting at a gold chain running down the seam. Paw prints stamp
// the corners; star-bursts sparkle behind. Cute surface. Glitched underneath.
// ============================================================================

(() => {

  const THEME = {
    fPink:     '#FF3E8C',
    fPinkDeep: '#B91C5C',
    fPinkSoft: '#FFA6C3',
    fCream:    '#FFE4EE',

    mBlue:     '#2B5CE3',
    mBlueDeep: '#0F2D99',
    mBlueSoft: '#7CA5FF',
    mIce:      '#D6E3FF',

    ink:       '#0A0414',
    inkSoft:   '#2A1830',
    gold:      '#DBAA4A',
    blood:     '#8B0F2E',
    paper:     '#FFF8F2',

    chromaPink: '#FF2D7A',
    chromaCyan: '#3FE3FF',
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
    colors: ['#FF3E8C','#3FE3FF','#DBAA4A','#FFA6C3','#C58BFF','#7CA5FF'],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold    = window.__koMaxHold    || 10;
  window.__koPanelWidth = window.__koPanelWidth || 360;
  window.__koPanelPad   = window.__koPanelPad   || 22;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  if (!document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@400;700;800&family=Zen+Antique:wght@400&family=Bungee&family=Playfair+Display:ital,wght@0,600;0,800;0,900;1,700;1,900&family=JetBrains+Mono:wght@400;700;800&family=Kaisei+Tokumin:wght@500;700;800&display=swap';
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
      --f-pink:      ${THEME.fPink};
      --f-pink-deep: ${THEME.fPinkDeep};
      --f-pink-soft: ${THEME.fPinkSoft};
      --f-cream:     ${THEME.fCream};
      --m-blue:      ${THEME.mBlue};
      --m-blue-deep: ${THEME.mBlueDeep};
      --m-blue-soft: ${THEME.mBlueSoft};
      --m-ice:       ${THEME.mIce};
      --ink:         ${THEME.ink};
      --ink-soft:    ${THEME.inkSoft};
      --gold:        ${THEME.gold};
      --blood:       ${THEME.blood};
      --paper:       ${THEME.paper};
      --chroma-pink: ${THEME.chromaPink};
      --chroma-cyan: ${THEME.chromaCyan};

      --font-jp:      'Shippori Mincho B1', 'Shippori Mincho', serif;
      --font-jp-big:  'Zen Antique', 'Shippori Mincho B1', serif;
      --font-kai:     'Kaisei Tokumin', 'Shippori Mincho B1', serif;
      --font-display: 'Playfair Display', 'Bungee', serif;
      --font-tag:     'Bungee', 'JetBrains Mono', sans-serif;
      --font-mono:    'JetBrains Mono', ui-monospace, monospace;
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ==================================================================
       THE PANEL — vertically bisected yandere-mirror card.
       Left half Fuwawa-pink, right half Mococo-blue, seam is a gold chain.
       ================================================================== */
    .ko-header {
      position: absolute;
      width: 360px;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 20px;
      transform: translateY(-50%);
      isolation: isolate;
      color: #faf4ff;

      background:
        radial-gradient(ellipse 60% 40% at 20% 15%, rgba(255,255,255,0.18), transparent 60%),
        radial-gradient(ellipse 50% 38% at 80% 85%, rgba(255,255,255,0.12), transparent 60%),
        linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%),
        linear-gradient(90deg,
          #2E0518 0%,
          #5A0B2C 14%,
          #9E1748 32%,
          #C01E54 49%,
          #1a1530 50%,
          #1B2876 51%,
          #14439A 68%,
          #0A2877 86%,
          #061244 100%);
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow:
        0 30px 70px -30px rgba(6,4,18,0.85),
        0 0 0 1px rgba(255,255,255,0.04) inset,
        0 0 40px rgba(255,62,140,0.12) inset,
        0 0 40px rgba(43,92,227,0.12) inset;
    }

    /* Star speckle layer scattered across the panel */
    .ko-header::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 12% 8%, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0) 1.5px),
        radial-gradient(circle at 78% 18%, rgba(255,255,255,0.75) 0px, rgba(255,255,255,0) 1.2px),
        radial-gradient(circle at 35% 32%, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0) 1px),
        radial-gradient(circle at 88% 55%, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0) 1.5px),
        radial-gradient(circle at 22% 68%, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0) 1.3px),
        radial-gradient(circle at 62% 78%, rgba(255,255,255,0.85) 0px, rgba(255,255,255,0) 1.4px),
        radial-gradient(circle at 92% 88%, rgba(255,255,255,0.65) 0px, rgba(255,255,255,0) 1.1px),
        radial-gradient(circle at 8% 92%, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0) 1.4px);
      pointer-events: none;
      z-index: 0;
      animation: starTwinkle 5.5s ease-in-out infinite;
    }
    @keyframes starTwinkle {
      0%, 100% { opacity: 0.95; }
      50%      { opacity: 0.45; }
    }

    /* Gold chain running down the 50% seam */
    .ko-header::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      left: 50%;
      width: 8px;
      transform: translateX(-50%);
      background-image:
        repeating-linear-gradient(180deg,
          transparent 0px,
          rgba(219,170,74,0) 3px,
          rgba(219,170,74,0.9) 4px,
          rgba(252,221,137,1) 6px,
          rgba(219,170,74,0.9) 8px,
          transparent 9px,
          transparent 14px);
      filter: drop-shadow(0 0 3px rgba(219,170,74,0.6));
      opacity: 0.85;
      pointer-events: none;
      z-index: 1;
    }

    .ko-head {
      padding: 18px 22px 10px;
      position: relative;
      z-index: 2;
    }
    .ko-tag-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
    .ko-tag {
      font-family: var(--font-tag);
      font-size: 9px;
      letter-spacing: 0.28em;
      color: #fff;
      padding: 4px 9px 3px;
      background: linear-gradient(90deg, rgba(255,62,140,0.95), rgba(43,92,227,0.95));
      border-radius: 3px;
      position: relative;
      text-shadow:
        -1.5px 0 0 var(--chroma-pink),
         1.5px 0 0 var(--chroma-cyan);
      animation: tagJitter 4.2s steps(1,end) infinite;
    }
    @keyframes tagJitter {
      0%, 88%, 100% { transform: translateX(0); }
      90%           { transform: translateX(-1px); text-shadow: -2.5px 0 0 var(--chroma-pink), 2.5px 0 0 var(--chroma-cyan); }
      92%           { transform: translateX(1px); }
      94%           { transform: translateX(-0.5px); text-shadow: -3px 0 0 var(--chroma-pink), 3px 0 0 var(--chroma-cyan); }
      96%           { transform: translateX(0); }
    }
    .ko-serial {
      font-family: var(--font-mono);
      font-size: 8px;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.55);
      font-weight: 700;
    }

    .ko-crest {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin: 6px 0 4px;
    }
    .ko-crest-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,166,195,0.7), transparent);
    }
    .ko-crest-line.right {
      background: linear-gradient(90deg, transparent, rgba(124,165,255,0.7), transparent);
    }
    .ko-crest-paw {
      font-family: var(--font-kai);
      font-size: 18px;
      line-height: 1;
      color: var(--gold);
      text-shadow: 0 0 6px rgba(219,170,74,0.7);
      filter: drop-shadow(0 0 2px rgba(0,0,0,0.4));
    }

    .ko-subtitle {
      text-align: center;
      font-family: var(--font-mono);
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.42em;
      text-transform: uppercase;
      color: rgba(255,230,240,0.8);
      margin-top: 4px;
      text-shadow: -1px 0 0 rgba(255,62,140,0.5), 1px 0 0 rgba(63,227,255,0.5);
    }

    .ko-now {
      margin: 10px 18px 14px;
      padding: 14px 16px 13px;
      background:
        linear-gradient(135deg, rgba(255,166,195,0.14) 0%, transparent 55%, rgba(124,165,255,0.14) 100%),
        rgba(10, 4, 20, 0.52);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 13px;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      position: relative;
      z-index: 2;
      box-shadow:
        0 6px 20px -10px rgba(0,0,0,0.55),
        inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .ko-now::before, .ko-now::after {
      content: '✦';
      position: absolute;
      font-size: 10px;
      color: var(--gold);
      top: -2px;
      opacity: 0.85;
      text-shadow: 0 0 4px rgba(219,170,74,0.8);
    }
    .ko-now::before { left: 6px; }
    .ko-now::after  { right: 6px; }

    .ko-now-title {
      font-family: var(--font-jp-big), var(--font-display);
      font-weight: 800;
      font-size: 22px;
      line-height: 1.1;
      letter-spacing: 0.02em;
      color: #fff8f2;
      text-align: center;
      margin: 2px 0 5px;
      text-shadow:
        0 1px 2px rgba(0,0,0,0.5),
        -1px 0 0 rgba(255,62,140,0.55),
         1px 0 0 rgba(63,227,255,0.55);
    }
    .ko-now-meaning {
      font-family: var(--font-display);
      font-style: italic;
      font-size: 12px;
      line-height: 1.3;
      color: rgba(255,230,240,0.82);
      text-align: center;
      margin: 0 0 9px;
      max-height: 3em;
      overflow: hidden;
      letter-spacing: 0.02em;
      transition: opacity 0.3s, max-height 0.3s;
    }
    .ko-now-meaning.empty { max-height: 0; margin: 0; opacity: 0; }
    .ko-now-artist {
      font-family: var(--font-mono);
      font-size: 9.5px;
      font-weight: 700;
      color: rgba(219,170,74,0.95);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 11px;
    }

    .ko-now-progress {
      position: relative;
      height: 9px;
      background:
        repeating-linear-gradient(90deg,
          rgba(255,255,255,0.05) 0px,
          rgba(255,255,255,0.05) 3px,
          rgba(255,255,255,0.14) 3px,
          rgba(255,255,255,0.14) 6px),
        rgba(10,4,20,0.6);
      border-radius: 999px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06);
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: linear-gradient(90deg,
        var(--f-pink) 0%,
        var(--f-pink-soft) 30%,
        #ffffff 50%,
        var(--m-blue-soft) 70%,
        var(--m-blue) 100%);
      border-radius: 999px;
      box-shadow:
        0 0 8px rgba(255,62,140,0.6),
        0 0 12px rgba(43,92,227,0.4);
      transition: width 0.3s linear;
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      color: rgba(255,255,255,0.65);
      letter-spacing: 0.08em;
      font-variant-numeric: tabular-nums;
    }

    .ko-paws {
      display: flex;
      justify-content: center;
      gap: 14px;
      margin: 0 0 12px;
      padding: 0 22px;
      position: relative;
      z-index: 2;
    }
    .ko-paw {
      font-family: var(--font-kai);
      font-size: 20px;
      line-height: 1;
      opacity: 0.88;
      filter: drop-shadow(0 0 4px rgba(0,0,0,0.4));
    }
    .ko-paw.pink { color: var(--f-pink-soft); text-shadow: 0 0 8px rgba(255,62,140,0.45); }
    .ko-paw.blue { color: var(--m-blue-soft); text-shadow: 0 0 8px rgba(43,92,227,0.45); }

    .ko-ctrls {
      display: flex;
      gap: 6px;
      margin: 0 18px 18px;
      position: relative;
      z-index: 2;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 8px 9px;
      background: rgba(10,4,20,0.55);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 9px;
      cursor: pointer;
      user-select: none;
      min-width: 0;
      transition: background 140ms, border-color 140ms;
    }
    .ko-ctrl:hover { background: rgba(10,4,20,0.75); border-color: rgba(255,166,195,0.5); }
    .ko-ctrl.is-on {
      border-color: var(--f-pink);
      background: linear-gradient(90deg, rgba(255,62,140,0.3), rgba(43,92,227,0.3));
    }
    .ko-ctrl-label {
      font-family: var(--font-tag);
      font-size: 8px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 800;
      color: var(--gold);
      letter-spacing: 0.05em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ==================================================================
       LYRIC DISPLAY — where the signature feature lives.
       ================================================================== */
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
      gap: 18px;
      position: relative;
    }

    /* The massive ghost kanji drifting behind every line */
    #ko-ghost-kanji {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) scale(1.0);
      font-family: var(--font-jp-big);
      font-weight: 400;
      font-size: min(34vh, 380px);
      line-height: 1;
      pointer-events: none;
      color: rgba(255,255,255,0.06);
      z-index: -1;
      white-space: nowrap;
      text-shadow:
        -10px -4px 0 rgba(255,62,140,0.14),
         10px  4px 0 rgba(63,227,255,0.14);
      filter: blur(0.3px);
      opacity: 0;
      user-select: none;
      will-change: transform, opacity;
    }
    #ko-ghost-kanji.alive {
      animation: kanjiPossess 1700ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
    }
    @keyframes kanjiPossess {
      0%   { opacity: 0;    transform: translate(-50%, -50%) scale(1.45) rotate(-2deg); filter: blur(6px); }
      15%  { opacity: 0.28; transform: translate(-50%, -50%) scale(1.08) rotate(0.8deg); filter: blur(0.2px);
             text-shadow: -18px -6px 0 rgba(255,62,140,0.32), 18px 6px 0 rgba(63,227,255,0.32); }
      45%  { opacity: 0.20; transform: translate(-50%, -50%) scale(1.0)  rotate(-0.3deg); filter: blur(0.2px); }
      100% { opacity: 0.06; transform: translate(-50%, -50%) scale(0.98) rotate(0.2deg);
             text-shadow: -10px -4px 0 rgba(255,62,140,0.14), 10px 4px 0 rgba(63,227,255,0.14); }
    }

    #ko-lyrics .ko-line-jp {
      font-family: var(--font-jp);
      font-weight: 800;
      color: #fff8f2;
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #050012;
      font-size: 44px;
      line-height: 2.5;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow:
        0 0 14px rgba(255,255,255,0.35),
        0 0 28px rgba(10,4,20,0.85),
        0 2px 4px rgba(0,0,0,0.6);
      min-height: 1em;
      order: 1;
      position: relative;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #050012;
      position: relative;
      display: inline-block;
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--font-mono);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: inherit;
      paint-order: stroke fill;
      -webkit-text-stroke: 3px #050012;
      text-shadow: 0 0 6px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.8);
      user-select: none;
      filter: drop-shadow(0 0 2px rgba(0,0,0,0.6));
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-slot.is-firing .ko-line-jp {
      animation: jpChromaSnap 520ms cubic-bezier(0.18, 0.9, 0.3, 1);
    }
    #ko-lyrics .ko-slot.is-firing .ko-line-en {
      animation: enChromaSnap 520ms cubic-bezier(0.18, 0.9, 0.3, 1);
    }
    @keyframes jpChromaSnap {
      0% {
        transform: translateX(-3px);
        text-shadow:
          -22px 0 0 var(--chroma-pink),
           22px 0 0 var(--chroma-cyan),
          0 0 14px rgba(255,255,255,0.35),
          0 0 28px rgba(10,4,20,0.85);
        filter: blur(0.8px);
      }
      35% {
        transform: translateX(1px);
        text-shadow:
          -6px 0 0 var(--chroma-pink),
           6px 0 0 var(--chroma-cyan),
          0 0 16px rgba(255,255,255,0.45),
          0 0 28px rgba(10,4,20,0.85);
        filter: blur(0);
      }
      100% {
        transform: translateX(0);
        text-shadow:
          0 0 14px rgba(255,255,255,0.35),
          0 0 28px rgba(10,4,20,0.85),
          0 2px 4px rgba(0,0,0,0.6);
      }
    }
    @keyframes enChromaSnap {
      0% {
        transform: translateX(3px);
        text-shadow:
          -18px 0 0 var(--chroma-cyan),
           18px 0 0 var(--chroma-pink),
          0 0 18px rgba(255,255,255,0.3);
        filter: blur(0.6px);
      }
      40% {
        transform: translateX(-1px);
        text-shadow:
          -4px 0 0 var(--chroma-cyan),
           4px 0 0 var(--chroma-pink),
          0 0 20px rgba(255,255,255,0.4);
        filter: blur(0);
      }
      100% {
        transform: translateX(0);
        text-shadow:
          0 0 18px rgba(255,255,255,0.35),
          0 0 30px rgba(10,4,20,0.8),
          0 2px 4px rgba(0,0,0,0.55);
      }
    }

    #ko-lyrics .ko-line-en {
      font-family: var(--font-display);
      font-weight: 700;
      font-style: italic;
      color: #fff8f2;
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #050012;
      font-size: 40px;
      line-height: 1.22;
      letter-spacing: 0.005em;
      text-shadow:
        0 0 18px rgba(255,255,255,0.35),
        0 0 30px rgba(10,4,20,0.8),
        0 2px 4px rgba(0,0,0,0.55);
      max-width: 100%;
      min-height: 1em;
      order: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: 5px #050012;
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

  let vidSerial = '';
  try { vidSerial = new URL(location.href).searchParams.get('v') || ''; } catch {}
  const serialShort = vidSerial ? vidSerial.slice(0, 6).toUpperCase() : 'XXXXXX';

  const headerPanel = document.createElement('div');
  headerPanel.className = 'ko-header';
  setHTML(headerPanel, `
    <div class="ko-head">
      <div class="ko-tag-row">
        <div class="ko-tag">MV · COVER</div>
        <div class="ko-serial">CASE FILE № ${escHTML(serialShort)}</div>
      </div>
      <div class="ko-crest">
        <div class="ko-crest-line"></div>
        <div class="ko-crest-paw">❦</div>
        <div class="ko-crest-line right"></div>
      </div>
      <div class="ko-subtitle">she's so ⋆ cute</div>
    </div>
    <div class="ko-now">
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-paws">
      <div class="ko-paw pink">🐾</div>
      <div class="ko-paw blue">🐾</div>
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
  `);
  root.appendChild(headerPanel);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div id="ko-ghost-kanji"></div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
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
  // SIGNATURE FEATURE — Kanji Possession
  // When JP line changes: extract first CJK char into #ko-ghost-kanji + restart
  // possess animation; toggle .is-firing on .ko-slot to restart chromatic snap.
  // ==========================================================================
  let lastFireJp = '';
  const FIRE_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(FIRE_POLL); return; }
    const jpEl  = document.getElementById('ko-line-jp');
    const slot  = document.querySelector('#ko-lyrics .ko-slot');
    const ghost = document.getElementById('ko-ghost-kanji');
    if (!jpEl || !slot || !ghost) return;
    const jp = jpEl.textContent;
    if (jp === lastFireJp) return;
    lastFireJp = jp;
    if (!jp.trim()) {
      ghost.classList.remove('alive');
      ghost.textContent = '';
      return;
    }
    const m = jp.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/);
    const ch = m ? m[0] : (jp[0] || '');
    ghost.classList.remove('alive');
    ghost.textContent = ch;
    void ghost.offsetHeight;
    ghost.classList.add('alive');
    slot.classList.remove('is-firing');
    void slot.offsetHeight;
    slot.classList.add('is-firing');
  }, 80);

})();
