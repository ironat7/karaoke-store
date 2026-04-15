// ============================================================================
// KARAOKE OVERLAY — DILEMMA / ジレンマ (DECO*27, cover by moon jelly)
// CQE5ijMuo5w
// ----------------------------------------------------------------------------
// Concept: a porcelain wedding invitation. The lyric card IS the bride's vow,
// scrollwork lace + champagne filigree on cream paper, mint silk ribbon at the
// crown, pearl drops at the corners. Behind it, ghostly handwritten kanji
// drift across the screen — vows fading from memory (a direct visual quote
// from the MV's faded-script watermark layer).
//
// Signature feature: every "くらえバンバンバン" line lands three sharp shots
// on the invitation — the card shudders three times and a crimson hairline
// crack flashes across the porcelain. The bullet wounds on her vows.
// ============================================================================

(() => {

  const THEME = {
    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&' +
      'family=Pinyon+Script&' +
      'family=Shippori+Mincho+B1:wght@500;700;800&' +
      'family=Italianno&display=swap',
    fontDisplay: '"Cormorant Garamond", "Times New Roman", serif',
    fontBody:    '"Cormorant Garamond", "Times New Roman", serif',
    fontJP:      '"Shippori Mincho B1", "Yu Mincho", "YuMincho", serif',

    // Card / decor — pulled from moon jelly's model (cream gown, gold tiara,
    // mint silk bow, pink lace) layered against the MV's monochrome atelier.
    cream:      '#FAF0E0',
    accent:     '#F5B5C8',
    accentDeep: '#D5879F',
    accentInk:  '#7A3B52',
    ink:        '#3F2837',
    inkSoft:    '#7A6675',
    gold:       '#C9A75D',

    lyricColorEN:  '#3F2837',
    lyricColorJP:  '#2A1A26',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(255,253,247,0.95), 0 0 12px rgba(250,240,224,0.85)',
    lyricShadowJP: '0 1px 0 rgba(255,253,247,0.95), 0 0 14px rgba(250,240,224,0.85)',
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

  // Word-align palette derived from moon jelly's character + the MV palette.
  // Six dark-medium tones picked to read on the cream porcelain card.
  window.__wordAlign = window.__wordAlign || { colors: [], data: {} };
  window.__wordAlign.colors = [
    '#A03658',  // 0 wine rose      — her lipstick
    '#1F7A6E',  // 1 jade mint      — her bow, deepened
    '#6B4396',  // 2 royal lilac    — her hair lilac shadowed
    '#A2762B',  // 3 burnt champagne — her tiara
    '#5C2E47',  // 4 plum ink       — letter signature ink
    '#3D5C8A',  // 5 bridal blue    — her gown's cool shadow
  ];

  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

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

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
      overflow: hidden;
    }

    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ============== DRIFTING KANJI GHOST LAYER ==============
       Pulls directly from the MV: faint white handwritten kanji float across
       the background. Each ghost drifts independently. */
    .ko-ghost-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      mix-blend-mode: overlay;
      opacity: 0.85;
    }
    .ko-ghost {
      position: absolute;
      font-family: var(--ko-font-jp);
      font-weight: 800;
      color: rgba(255, 250, 240, 0.55);
      text-shadow:
        0 0 18px rgba(255, 250, 240, 0.45),
        0 0 38px rgba(255, 250, 240, 0.25);
      white-space: nowrap;
      letter-spacing: 0.06em;
      will-change: transform, opacity;
      filter: blur(0.4px);
    }
    @keyframes ko-drift-rl {
      0%   { transform: translate3d(110vw, 0, 0); opacity: 0; }
      8%   { opacity: 0.9; }
      88%  { opacity: 0.9; }
      100% { transform: translate3d(-30vw, 0, 0); opacity: 0; }
    }
    @keyframes ko-drift-fall {
      0%   { transform: translate3d(0, -22vh, 0) rotate(-4deg); opacity: 0; }
      12%  { opacity: 0.85; }
      85%  { opacity: 0.85; }
      100% { transform: translate3d(0, 110vh, 0) rotate(-4deg); opacity: 0; }
    }
    .ko-ghost.g1 { top: 12%;  font-size: 12vh; animation: ko-drift-rl 52s linear infinite; }
    .ko-ghost.g2 { top: 28%;  font-size: 9vh;  animation: ko-drift-rl 71s linear infinite; animation-delay: -22s; }
    .ko-ghost.g3 { top: 44%;  font-size: 14vh; animation: ko-drift-rl 88s linear infinite; animation-delay: -55s; opacity: 0.6; }
    .ko-ghost.g4 { top: 5%;   font-size: 7vh;  animation: ko-drift-rl 41s linear infinite; animation-delay: -12s; }
    .ko-ghost.g5 { top: 76%;  font-size: 10vh; animation: ko-drift-rl 64s linear infinite; animation-delay: -33s; }
    .ko-ghost.g6 { left: 22%; font-size: 8vh;  animation: ko-drift-fall 58s linear infinite; animation-delay: -18s; }
    .ko-ghost.g7 { left: 78%; font-size: 11vh; animation: ko-drift-fall 73s linear infinite; animation-delay: -42s; }
    .ko-ghost.g8 { left: 50%; font-size: 9vh;  animation: ko-drift-fall 67s linear infinite; animation-delay: -8s; }

    .ko-vignette {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse 80% 60% at 50% 78%,
          rgba(0, 0, 0, 0) 35%,
          rgba(0, 0, 0, 0.35) 100%);
    }

    /* ============== LYRIC CARD — porcelain wedding invitation ============== */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 18px 32px rgba(40, 20, 35, 0.55))
              drop-shadow(0 4px 10px rgba(40, 20, 35, 0.4));
    }

    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
      padding: 56px 64px 50px 64px;

      background:
        radial-gradient(ellipse 130% 100% at 50% 0%,
          #FFFBF1 0%,
          #FAF0E0 55%,
          #F2E2C8 100%);

      border: 1px solid ${THEME.gold};
      outline: 1px solid rgba(201, 167, 93, 0.35);
      outline-offset: 4px;
      border-radius: 4px;

      box-shadow:
        inset 0 0 0 1px rgba(255, 251, 241, 0.7),
        inset 0 0 60px rgba(201, 167, 93, 0.12),
        inset 0 -40px 80px rgba(122, 59, 82, 0.08);
    }

    /* Paper grain noise */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        radial-gradient(circle at 23% 47%, rgba(122, 59, 82, 0.04) 0%, transparent 0.5%),
        radial-gradient(circle at 67% 81%, rgba(122, 59, 82, 0.04) 0%, transparent 0.5%),
        radial-gradient(circle at 41% 12%, rgba(122, 59, 82, 0.03) 0%, transparent 0.5%),
        radial-gradient(circle at 88% 38%, rgba(122, 59, 82, 0.05) 0%, transparent 0.5%);
      background-size: 7px 7px, 11px 11px, 5px 5px, 9px 9px;
      mix-blend-mode: multiply;
      opacity: 0.5;
      border-radius: inherit;
    }

    /* Hairline crack — hidden until BANG BANG BANG line fires */
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(105deg,
          transparent 47.6%,
          rgba(160, 54, 88, 0.85) 48.0%,
          rgba(40, 10, 22, 0.95) 48.15%,
          rgba(160, 54, 88, 0.85) 48.3%,
          transparent 48.5%);
      opacity: 0;
      border-radius: inherit;
      mix-blend-mode: multiply;
    }

    /* === Top crown ribbon (mint silk bow) === */
    .ko-ribbon {
      position: absolute;
      left: 50%;
      top: -22px;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    }
    .ko-ribbon-bow {
      width: 68px;
      height: 38px;
      position: relative;
    }
    .ko-ribbon-bow::before,
    .ko-ribbon-bow::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 26px;
      height: 30px;
      background:
        radial-gradient(ellipse at 30% 40%,
          #DFF5EB 0%,
          #B6E5D8 50%,
          #6BB8A4 100%);
      border-radius: 50% 30% 50% 30%;
      box-shadow:
        inset -2px -2px 4px rgba(0, 80, 60, 0.25),
        0 1px 3px rgba(40, 20, 35, 0.4);
      transform: translateY(-50%) rotate(-22deg);
      left: 50%;
      margin-left: -28px;
    }
    .ko-ribbon-bow::after {
      transform: translateY(-50%) rotate(22deg);
      margin-left: 2px;
      border-radius: 30% 50% 30% 50%;
    }
    .ko-ribbon-knot {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 14px;
      height: 18px;
      background:
        radial-gradient(ellipse at 30% 30%,
          #DFF5EB 0%,
          #6BB8A4 70%,
          #3E8273 100%);
      border-radius: 4px;
      transform: translate(-50%, -50%);
      box-shadow: 0 1px 2px rgba(40, 20, 35, 0.5);
      z-index: 2;
    }

    .ko-crown {
      width: 56px;
      height: 18px;
      margin-top: 2px;
      position: relative;
    }
    .ko-crown svg { width: 100%; height: 100%; display: block; }

    /* Pearl drops at bottom corners */
    .ko-pearl {
      position: absolute;
      bottom: -8px;
      width: 12px;
      height: 16px;
      background:
        radial-gradient(circle at 35% 30%,
          #FFFFFF 0%,
          #FAF0E0 35%,
          #DFC79E 75%,
          #A07A40 100%);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      box-shadow:
        0 0 4px rgba(201, 167, 93, 0.7),
        0 2px 4px rgba(40, 20, 35, 0.5),
        inset 0 -2px 2px rgba(122, 59, 82, 0.3);
    }
    .ko-pearl.left  { left: 18%; }
    .ko-pearl.right { right: 18%; }
    .ko-pearl.left::before,
    .ko-pearl.right::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 1.5px;
      height: 12px;
      background: linear-gradient(${THEME.gold}, rgba(201, 167, 93, 0.3));
    }

    /* Filigree corner brackets */
    .ko-filigree {
      position: absolute;
      width: 44px;
      height: 44px;
      pointer-events: none;
    }
    .ko-filigree svg { width: 100%; height: 100%; display: block; }
    .ko-filigree.tl { top:    -2px;  left:   -2px; }
    .ko-filigree.tr { top:    -2px;  right:  -2px; transform: scaleX(-1); }
    .ko-filigree.bl { bottom: -2px;  left:   -2px; transform: scaleY(-1); }
    .ko-filigree.br { bottom: -2px;  right:  -2px; transform: scale(-1, -1); }

    /* === DILEMMA header — calligraphy script with gold rule === */
    .ko-header {
      font-family: 'Pinyon Script', 'Italianno', cursive;
      color: ${THEME.gold};
      font-size: 28px;
      letter-spacing: 0.20em;
      line-height: 1;
      text-align: center;
      padding-bottom: 4px;
      text-shadow: 0 1px 0 rgba(255, 251, 241, 0.9);
      order: 0;
      position: relative;
    }
    .ko-header::before,
    .ko-header::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 28%;
      height: 1px;
      background: linear-gradient(to right, transparent, ${THEME.gold}, transparent);
    }
    .ko-header::before { left: 6%;  }
    .ko-header::after  { right: 6%; transform: scaleX(-1); }
    .ko-header .diamond {
      display: inline-block;
      width: 6px;
      height: 6px;
      margin: 0 14px;
      transform: translateY(-3px) rotate(45deg);
      background: ${THEME.gold};
      box-shadow: 0 0 4px rgba(201, 167, 93, 0.8);
      vertical-align: middle;
    }

    /* === Lyric typography === */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 800;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.5;
      padding-top: 0.2em;
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
      font-family: var(--ko-font-display);
      font-style: italic;
      font-size: 22px;
      font-weight: 500;
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow:
        0 1px 0 rgba(255, 253, 247, 0.95),
        0 0 6px rgba(250, 240, 224, 0.85);
      user-select: none;
      opacity: 0.92;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* Hairline divider with center diamond */
    #ko-lyrics .ko-divider {
      height: 1px;
      width: 60%;
      margin: 6px auto -2px auto;
      background: linear-gradient(to right,
        transparent 0%,
        rgba(201, 167, 93, 0.55) 30%,
        rgba(122, 59, 82, 0.45) 50%,
        rgba(201, 167, 93, 0.55) 70%,
        transparent 100%);
      order: 2;
      position: relative;
    }
    #ko-lyrics .ko-divider::after {
      content: '◇';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: ${THEME.gold};
      font-size: 10px;
      background: ${THEME.cream};
      padding: 0 6px;
      line-height: 1;
    }

    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 38px;
      line-height: 1.25;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 3;
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* === BANG BANG BANG signature === */
    @keyframes ko-shudder {
      0%, 100% { transform: translate(-50%, -50%); }
      6%   { transform: translate(calc(-50% + 9px),  calc(-50% - 4px)) rotate(0.6deg); }
      12%  { transform: translate(calc(-50% - 6px),  calc(-50% + 3px)); }
      32%  { transform: translate(-50%, -50%); }
      38%  { transform: translate(calc(-50% - 11px), calc(-50% - 5px)) rotate(-0.7deg); }
      44%  { transform: translate(calc(-50% + 5px),  calc(-50% + 4px)); }
      64%  { transform: translate(-50%, -50%); }
      70%  { transform: translate(calc(-50% + 13px), calc(-50% + 6px)) rotate(0.9deg); }
      76%  { transform: translate(calc(-50% - 5px),  calc(-50% - 3px)); }
      96%  { transform: translate(-50%, -50%); }
    }
    @keyframes ko-crack {
      0%, 100% { opacity: 0; }
      8%, 38%, 68%  { opacity: 0; }
      14%, 44%, 74% { opacity: 0.95; }
      20%, 50%, 80% { opacity: 0.55; }
    }
    @keyframes ko-flash {
      0%, 100% { background-color: transparent; }
      14%, 44%, 74% { box-shadow:
        inset 0 0 0 1px rgba(255, 251, 241, 0.7),
        inset 0 0 60px rgba(160, 54, 88, 0.45),
        inset 0 -40px 80px rgba(160, 54, 88, 0.3); }
    }
    #ko-lyrics.ko-bang { animation: ko-shudder 1.65s ease-out 1; }
    #ko-lyrics.ko-bang .ko-slot::after { animation: ko-crack 1.65s ease-out 1; }
    #ko-lyrics.ko-bang .ko-slot       { animation: ko-flash  1.65s ease-out 1; }

    /* Card breathe — subtle pulse */
    @keyframes ko-breathe {
      0%, 100% {
        filter: drop-shadow(0 18px 32px rgba(40, 20, 35, 0.55))
                drop-shadow(0 4px 10px rgba(40, 20, 35, 0.4));
      }
      50% {
        filter: drop-shadow(0 22px 40px rgba(40, 20, 35, 0.6))
                drop-shadow(0 6px 14px rgba(122, 59, 82, 0.35));
      }
    }
    #ko-lyrics { animation: ko-breathe 7s ease-in-out infinite; }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // Drifting kanji ghost layer + vignette — direct visual quote from the MV
  setHTML(root, `
    <div class="ko-vignette"></div>
    <div class="ko-ghost-layer">
      <div class="ko-ghost g1">後遺症</div>
      <div class="ko-ghost g2">戻れない</div>
      <div class="ko-ghost g3">好き</div>
      <div class="ko-ghost g4">バンバンバン</div>
      <div class="ko-ghost g5">忘れ方</div>
      <div class="ko-ghost g6">涙</div>
      <div class="ko-ghost g7">夢</div>
      <div class="ko-ghost g8">叶わない</div>
    </div>
  `);

  // Filigree SVG — same shape used for all four corners (orientation by CSS)
  const FILIGREE_SVG = `
    <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${THEME.gold}" stroke-width="1.1">
      <path d="M2 22 Q2 2 22 2"/>
      <path d="M6 18 Q6 6 18 6"/>
      <circle cx="10" cy="10" r="1.4" fill="${THEME.gold}" stroke="none"/>
      <path d="M14 4 Q18 6 16 10 Q12 8 14 4 Z" fill="${THEME.gold}" fill-opacity="0.4" stroke="none"/>
      <path d="M4 14 Q6 18 10 16 Q8 12 4 14 Z" fill="${THEME.gold}" fill-opacity="0.4" stroke="none"/>
      <path d="M22 2 Q14 6 14 14" stroke-width="0.6" stroke-opacity="0.7"/>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="ko-filigree tl">${FILIGREE_SVG}</div>
      <div class="ko-filigree tr">${FILIGREE_SVG}</div>
      <div class="ko-filigree bl">${FILIGREE_SVG}</div>
      <div class="ko-filigree br">${FILIGREE_SVG}</div>

      <div class="ko-ribbon">
        <div class="ko-ribbon-bow">
          <div class="ko-ribbon-knot"></div>
        </div>
        <div class="ko-crown">
          <svg viewBox="0 0 56 18" xmlns="http://www.w3.org/2000/svg" fill="${THEME.gold}">
            <path d="M2 16 L8 4 L14 12 L20 2 L28 14 L36 2 L42 12 L48 4 L54 16 Z"
                  stroke="${THEME.gold}" stroke-width="0.8"
                  fill="${THEME.gold}" fill-opacity="0.55"/>
            <circle cx="8"  cy="4" r="1.4"/>
            <circle cx="20" cy="2" r="1.6"/>
            <circle cx="36" cy="2" r="1.6"/>
            <circle cx="48" cy="4" r="1.4"/>
            <line x1="2" y1="16.5" x2="54" y2="16.5" stroke="${THEME.gold}" stroke-width="1"/>
          </svg>
        </div>
      </div>

      <div class="ko-header"><span class="diamond"></span>D I L E M M A<span class="diamond"></span></div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-divider"></div>
      <div class="ko-line-en" id="ko-line-en"></div>

      <div class="ko-pearl left"></div>
      <div class="ko-pearl right"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

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

  // --- Color + gloss colorizer (poll) ---
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
  // SIGNATURE: BANG BANG BANG shudder + crack
  // Watches the JP line. When "くらえバンバンバン" appears, stamps .ko-bang
  // on the lyric card to fire the shudder/crack/flash keyframes. Removes
  // after the run so it can re-fire next time.
  // ==========================================================================
  const BANG_LINE = 'くらえバンバンバン';
  let _lastBangText = '';
  const BANG_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(BANG_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    if (!jpEl) return;
    const txt = jpEl.textContent;
    if (txt === _lastBangText) return;
    _lastBangText = txt;
    if (txt === BANG_LINE) {
      lyrics.classList.remove('ko-bang');
      // Force reflow so re-adding the class re-fires the animation.
      void lyrics.offsetWidth;
      lyrics.classList.add('ko-bang');
      setTimeout(() => {
        if (window.__koGen === MY_GEN) lyrics.classList.remove('ko-bang');
      }, 1700);
    }
  }, 80);

})();
