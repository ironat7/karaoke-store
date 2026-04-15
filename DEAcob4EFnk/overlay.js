// ============================================================================
// KARAOKE OVERLAY — Moon Jelly / ロミオとシンデレラ
// Storybook illuminated-manuscript aesthetic: cream parchment card with gold
// filigree corner ornaments, pink silk bookmark ribbon, subtle rose watermark.
// Signature feature: a delicate gold "illumination" shimmer sweeps across the
// parchment each time a new lyric line fires — evoking an illuminated
// storybook page turning. Fairytale dust sparkles drift around the card.
// ============================================================================

(() => {

  const THEME = {
    fontsHref: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Shippori+Mincho:wght@500;600;700;800&family=Pinyon+Script&display=swap',
    fontDisplay: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
    fontBody:    '"EB Garamond", "Cormorant Garamond", Georgia, serif',
    fontJP:      '"Shippori Mincho", "Yu Mincho", "Noto Serif JP", serif',
    fontScript:  '"Pinyon Script", cursive',

    // Derived from the MV: plum chaise, cream nightdress with pink ribbons,
    // gold filigree headpiece, mint eyes, red apple, rose-patterned upholstery.
    cream:        '#FBF2E2',
    creamDeep:    '#F3E3C8',
    parchment:    '#F8EAD0',
    rose:         '#D67BA0',
    roseDeep:     '#A74168',
    plum:         '#5B2B46',
    plumDeep:     '#3B1930',
    gold:         '#C29A4A',
    goldLight:    '#E2BE68',
    goldDeep:     '#8E6A24',
    ruby:         '#B22330',
    mint:         '#4FA49E',
    ink:          '#2C1820',
    inkSoft:      '#604456',

    lyricColorJP:  '#2C1820',
    lyricColorEN:  '#46283A',
    lyricStrokeJP: '0px transparent',
    lyricStrokeEN: '0px transparent',
    lyricShadowJP: '0 1px 0 rgba(255,248,232,0.95), 0 0 10px rgba(251,242,226,0.9)',
    lyricShadowEN: '0 1px 0 rgba(255,248,232,0.95), 0 0 10px rgba(251,242,226,0.9)',
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
  window.__wordAlign = window.__wordAlign || { colors: [], data: {} };
  // Chunk palette — pulled directly from the MV illustration:
  //   0 plum chaise • 1 rose ribbon • 2 mint eyes • 3 gold filigree •
  //   4 mauve blush • 5 ruby apple
  window.__wordAlign.colors = ['#5B2B46', '#A74168', '#2A7C7A', '#8E6A24', '#6E4358', '#992030'];
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

  // ---- Inline SVG ornaments ----
  const filigreeCornerSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4 L4 22 M4 4 L22 4"/><path d="M4 14 Q12 14 14 6 Q16 14 24 14" opacity="0.85"/><path d="M14 4 Q14 12 6 14" opacity="0.85"/><circle cx="14" cy="14" r="1.4" fill="currentColor" stroke="none"/><path d="M4 22 Q10 24 12 30 Q14 36 20 38" opacity="0.55"/><path d="M22 4 Q24 10 30 12 Q36 14 38 20" opacity="0.55"/><circle cx="38" cy="20" r="0.9" fill="currentColor" stroke="none" opacity="0.6"/><circle cx="20" cy="38" r="0.9" fill="currentColor" stroke="none" opacity="0.6"/></svg>`;

  const dividerSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 16" fill="none" stroke="currentColor" stroke-width="0.8" preserveAspectRatio="none"><line x1="30" y1="8" x2="130" y2="8" opacity="0.45"/><line x1="170" y1="8" x2="270" y2="8" opacity="0.45"/><g transform="translate(150 8)"><circle r="3.2" fill="currentColor" stroke="none"/><circle r="1.4" fill="#FBF2E2" stroke="none"/><path d="M-10 0 Q-7 -4 0 -4 Q7 -4 10 0" opacity="0.8"/><path d="M-10 0 Q-7 4 0 4 Q7 4 10 0" opacity="0.8"/></g></svg>`;

  const appleSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 22"><path d="M10 5 Q7 2 5 4 Q4 5.5 5.5 6.5 Q3 7 2.5 11 Q2 16 6 20 Q8 21 10 19.5 Q12 21 14 20 Q18 16 17.5 11 Q17 7 14.5 6.5 Q16 5.5 15 4 Q13 2 10 5Z" fill="#B22330"/><path d="M10 5 Q9 3 10 1.5 Q11 3 10 5Z" fill="#2A6B32"/><path d="M7 7 Q6 8 5.5 10" stroke="#fff" stroke-width="0.8" fill="none" opacity="0.55" stroke-linecap="round"/></svg>`;

  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    @keyframes ko-illuminate {
      0%   { background-position: -60% 0; opacity: 0; }
      18%  { opacity: 1; }
      82%  { opacity: 1; }
      100% { background-position: 160% 0; opacity: 0; }
    }
    @keyframes ko-sparkle-drift {
      0%   { transform: translate(0,0);   opacity: 0; }
      20%  { opacity: 0.7; }
      100% { transform: translate(var(--dx, 20px), var(--dy, -70px)); opacity: 0; }
    }
    @keyframes ko-ribbon-sway {
      0%, 100% { transform: rotate(-1.5deg); }
      50%      { transform: rotate(1.2deg); }
    }
    @keyframes ko-now-fade {
      0%   { opacity: 0; transform: translateY(-6px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes ko-line-rise {
      0%   { opacity: 0; transform: translateY(6px); filter: blur(1px); }
      100% { opacity: 1; transform: translateY(0); filter: blur(0); }
    }

    #karaoke-root {
      position: fixed; inset: 0; pointer-events: none;
      z-index: 2147483000;
    }
    #karaoke-root, #ko-lyrics {
      --ko-cream:      ${THEME.cream};
      --ko-cream-deep: ${THEME.creamDeep};
      --ko-parchment:  ${THEME.parchment};
      --ko-rose:       ${THEME.rose};
      --ko-rose-deep:  ${THEME.roseDeep};
      --ko-plum:       ${THEME.plum};
      --ko-plum-deep:  ${THEME.plumDeep};
      --ko-gold:       ${THEME.gold};
      --ko-gold-light: ${THEME.goldLight};
      --ko-gold-deep:  ${THEME.goldDeep};
      --ko-ruby:       ${THEME.ruby};
      --ko-mint:       ${THEME.mint};
      --ko-ink:        ${THEME.ink};
      --ko-ink-soft:   ${THEME.inkSoft};
      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-script:  ${THEME.fontScript};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ==== Now-playing storybook plate (top-left) ==== */
    #ko-nowplaying {
      position: absolute;
      top: 22px; left: 24px;
      min-width: 280px; max-width: 360px;
      padding: 18px 24px 18px;
      background:
        radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.55), transparent 70%),
        linear-gradient(180deg, var(--ko-cream) 0%, var(--ko-cream-deep) 100%);
      color: var(--ko-ink);
      border: 1px solid rgba(194, 154, 74, 0.45);
      box-shadow:
        0 0 0 3px var(--ko-cream),
        0 0 0 4px rgba(142, 106, 36, 0.38),
        0 10px 28px -8px rgba(59, 25, 48, 0.6),
        0 2px 6px rgba(59, 25, 48, 0.2);
      border-radius: 4px;
      animation: ko-now-fade 900ms cubic-bezier(.2,.7,.3,1) both;
    }
    #ko-nowplaying::before, #ko-nowplaying::after {
      content: '';
      position: absolute;
      width: 34px; height: 34px;
      color: var(--ko-gold-deep);
      background: url('data:image/svg+xml;utf8,${encodeURIComponent(filigreeCornerSVG)}') center/contain no-repeat;
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.8));
    }
    #ko-nowplaying::before { top: -3px; left: -3px; }
    #ko-nowplaying::after  { top: -3px; right: -3px; transform: scaleX(-1); }
    #ko-nowplaying .np-eyebrow {
      font-family: var(--ko-font-display);
      font-size: 10px;
      letter-spacing: 0.42em;
      text-transform: uppercase;
      color: var(--ko-gold-deep);
      font-weight: 600;
      display: flex; align-items: center; gap: 8px;
    }
    #ko-nowplaying .np-eyebrow::before,
    #ko-nowplaying .np-eyebrow::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--ko-gold) 50%, transparent);
    }
    #ko-nowplaying .np-title {
      font-family: var(--ko-font-jp);
      font-size: 26px;
      font-weight: 700;
      color: var(--ko-plum-deep);
      margin-top: 9px;
      line-height: 1.15;
      letter-spacing: 0.06em;
    }
    #ko-nowplaying .np-sub {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-size: 15px;
      color: var(--ko-rose-deep);
      margin-top: 4px;
      letter-spacing: 0.02em;
      display: flex; align-items: center; gap: 7px;
    }
    #ko-nowplaying .np-sub svg { width: 13px; height: 14px; flex: 0 0 auto; filter: drop-shadow(0 1px 0 rgba(255,255,255,0.7)); }
    #ko-nowplaying .np-divider {
      margin: 11px 0 9px;
      color: var(--ko-gold-deep);
      height: 12px;
      background: url('data:image/svg+xml;utf8,${encodeURIComponent(dividerSVG)}') center/100% 100% no-repeat;
      opacity: 0.75;
    }
    #ko-nowplaying .np-credit {
      font-family: var(--ko-font-body);
      font-size: 13px;
      color: var(--ko-ink-soft);
      letter-spacing: 0.03em;
      line-height: 1.4;
    }
    #ko-nowplaying .np-credit b {
      font-weight: 600;
      color: var(--ko-plum);
      font-style: normal;
    }
    #ko-nowplaying .np-sig {
      position: absolute;
      right: 20px; bottom: 6px;
      font-family: var(--ko-font-script);
      font-size: 22px;
      color: var(--ko-rose);
      line-height: 1;
      transform: rotate(-4deg);
      text-shadow: 0 1px 0 rgba(255,255,255,0.8);
    }

    /* ==== Lyric parchment card ==== */
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
      align-items: stretch;
      gap: 0;
      padding: 30px 54px 28px;
      background:
        radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.45), transparent 60%),
        radial-gradient(ellipse at 85% 100%, rgba(214,123,160,0.14), transparent 60%),
        linear-gradient(168deg, var(--ko-cream) 0%, var(--ko-parchment) 55%, var(--ko-cream-deep) 100%);
      border: 1px solid rgba(194, 154, 74, 0.55);
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,0.4),
        inset 0 0 36px rgba(167, 65, 104, 0.08),
        0 0 0 4px var(--ko-cream),
        0 0 0 5px rgba(142, 106, 36, 0.42),
        0 18px 42px -10px rgba(59, 25, 48, 0.65),
        0 4px 10px rgba(59, 25, 48, 0.22);
      border-radius: 3px;
      overflow: visible;
    }
    /* Rose-filigree watermark beneath the text */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      inset: 8px;
      pointer-events: none;
      background-image:
        radial-gradient(circle at 15% 20%, rgba(167,65,104,0.08) 0, transparent 26%),
        radial-gradient(circle at 85% 80%, rgba(167,65,104,0.08) 0, transparent 26%),
        radial-gradient(circle at 50% 50%, rgba(194,154,74,0.06) 0, transparent 40%);
      border-radius: 2px;
      z-index: 0;
    }
    /* Illumination shimmer — runs once per new lyric line */
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(115deg,
        transparent 40%,
        rgba(226, 190, 104, 0.35) 48%,
        rgba(255, 250, 220, 0.55) 50%,
        rgba(226, 190, 104, 0.35) 52%,
        transparent 60%);
      background-size: 200% 100%;
      background-repeat: no-repeat;
      background-position: -60% 0;
      mix-blend-mode: overlay;
      opacity: 0;
      border-radius: 3px;
      z-index: 2;
    }
    #ko-lyrics .ko-slot.fresh::after {
      animation: ko-illuminate 950ms ease-out;
    }

    /* Gold filigree on all four corners */
    #ko-lyrics .corner {
      position: absolute;
      width: 44px; height: 44px;
      color: var(--ko-gold-deep);
      background: url('data:image/svg+xml;utf8,${encodeURIComponent(filigreeCornerSVG)}') center/contain no-repeat;
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.7));
      z-index: 3;
      pointer-events: none;
    }
    #ko-lyrics .corner.tl { top: -6px; left: -6px; }
    #ko-lyrics .corner.tr { top: -6px; right: -6px; transform: scaleX(-1); }
    #ko-lyrics .corner.bl { bottom: -6px; left: -6px; transform: scaleY(-1); }
    #ko-lyrics .corner.br { bottom: -6px; right: -6px; transform: scale(-1, -1); }

    /* Pink silk bookmark ribbon — draped from top */
    #ko-lyrics .ribbon {
      position: absolute;
      top: -20px; right: 64px;
      width: 30px; height: 94px;
      z-index: 4;
      transform-origin: top center;
      animation: ko-ribbon-sway 6s ease-in-out infinite;
      pointer-events: none;
    }
    #ko-lyrics .ribbon::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, transparent 0, transparent 6px, rgba(0,0,0,0.12) 6px, rgba(0,0,0,0.12) 7px, transparent 7px),
        linear-gradient(95deg, #D67BA0 0%, #EDA4C2 45%, #D67BA0 50%, #B8568A 100%);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%);
      box-shadow: 0 6px 14px -4px rgba(167,65,104,0.55);
    }
    #ko-lyrics .ribbon::after {
      content: '';
      position: absolute;
      top: 4px; left: 50%;
      width: 10px; height: 82px;
      transform: translateX(-50%);
      background: linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%);
      border-radius: 6px;
      pointer-events: none;
    }

    /* Sparkle particles drifting up around the card */
    #ko-sparkles {
      position: absolute;
      inset: -30px;
      pointer-events: none;
      overflow: visible;
      z-index: 1;
    }
    #ko-sparkles .spk {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,240,200,0.95), rgba(226,190,104,0.2) 60%, transparent 70%);
      filter: blur(0.3px);
      animation: ko-sparkle-drift var(--d, 4.5s) linear infinite;
      animation-delay: var(--delay, 0s);
      opacity: 0;
    }

    /* ==== Lyric typography ==== */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.3;
      padding-top: 0.3em;
      letter-spacing: 0.05em;
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
      font-family: var(--ko-font-body);
      font-style: italic;
      font-size: 22px;
      font-weight: 500;
      letter-spacing: 0.015em;
      line-height: 1.05;
      padding-bottom: 8px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 1px 0 rgba(255,248,232,0.95), 0 0 6px rgba(251,242,226,0.85);
      user-select: none;
      opacity: 0.9;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* Ornamental divider between JP and EN rows */
    #ko-lyrics .ko-line-en::before {
      content: '';
      display: block;
      height: 14px;
      margin: 6px auto 12px;
      width: 78%;
      color: var(--ko-gold-deep);
      background: url('data:image/svg+xml;utf8,${encodeURIComponent(dividerSVG)}') center/100% 100% no-repeat;
      opacity: 0.72;
    }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.25;
      letter-spacing: 0.02em;
      text-shadow: ${THEME.lyricShadowEN};
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
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 500; }
    #ko-lyrics .ko-line-en.en-song::before { display: none; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
    #ko-lyrics .ko-line-jp.hidden + .ko-line-en::before { display: none; }

    #ko-lyrics .ko-line-jp.ko-line-rise { animation: ko-line-rise 420ms cubic-bezier(.2,.7,.3,1) both; }
    #ko-lyrics .ko-line-en.ko-line-rise { animation: ko-line-rise 480ms 60ms cubic-bezier(.2,.7,.3,1) both; }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // ---- Now-playing storybook plate ----
  const song0 = (window.__setlist && window.__setlist[0]) || {};
  const titleJP = song0.originalTitle || 'ロミオとシンデレラ';
  const titleEN = song0.nameEn || song0.name || 'Romeo and Cinderella';
  setHTML(root, `
    <div id="ko-nowplaying">
      <div class="np-eyebrow">Now Playing</div>
      <div class="np-title">${escHTML(titleJP)}</div>
      <div class="np-sub">${appleSVG}<span>${escHTML(titleEN)}</span></div>
      <div class="np-divider"></div>
      <div class="np-credit">cover by <b>Moon Jelly</b><br>original by doriko feat. 初音ミク</div>
      <div class="np-sig">&#9835;</div>
    </div>
  `);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div id="ko-sparkles"></div>
      <span class="corner tl"></span>
      <span class="corner tr"></span>
      <span class="corner bl"></span>
      <span class="corner br"></span>
      <div class="ribbon"></div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  // Seed fairytale-dust sparkles
  {
    const spk = lyrics.querySelector('#ko-sparkles');
    if (spk) {
      const n = 8;
      let html = '';
      for (let i = 0; i < n; i++) {
        const left = 3 + Math.random() * 94;
        const bot = -20 + Math.random() * 80;
        const dx = (Math.random() - 0.5) * 50;
        const dy = -(50 + Math.random() * 100);
        const d = 3.2 + Math.random() * 4;
        const delay = Math.random() * 4.5;
        const size = 3 + Math.random() * 6;
        html += `<span class="spk" style="left:${left}%;bottom:${bot}px;width:${size}px;height:${size}px;--dx:${dx}px;--dy:${dy}px;--d:${d}s;--delay:${delay}s"></span>`;
      }
      setHTML(spk, html);
    }
  }

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

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

  const triggerFresh = () => {
    const slot = lyrics.querySelector('.ko-slot');
    if (!slot) return;
    slot.classList.remove('fresh');
    void slot.offsetWidth;
    slot.classList.add('fresh');
  };
  const triggerRise = (el) => {
    if (!el) return;
    el.classList.remove('ko-line-rise');
    void el.offsetWidth;
    el.classList.add('ko-line-rise');
  };

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
        curLineIdx = lineIdx;
        const enEl = document.getElementById('ko-line-en');
        const jpEl = document.getElementById('ko-line-jp');
        if (song.lang === 'en') {
          if (enEl && showText !== lastEnText) {
            enEl.textContent = showText;
            lastEnText = showText;
            if (showText) { triggerRise(enEl); triggerFresh(); }
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
            if (en) triggerRise(enEl);
          }
          if (jpEl && showText !== lastJpText) {
            jpEl.textContent = showText;
            lastJpText = showText;
            if (showText) { triggerRise(jpEl); triggerFresh(); }
          }
        }
      }
    } else if (!song || !song.lrcId) {
      if (lastEnText !== '') { document.getElementById('ko-line-en').textContent = ''; lastEnText = ''; }
      if (lastJpText !== '') { document.getElementById('ko-line-jp').textContent = ''; lastJpText = ''; }
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
