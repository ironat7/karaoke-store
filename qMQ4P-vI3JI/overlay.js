// ============================================================================
// KARAOKE OVERLAY — SKELETON (SINGLE-SONG FLAVOR)
// ----------------------------------------------------------------------------
// Skeleton for single-song MV overlays. Ships the locked lyric-rendering
// plumbing and a lyric card floating at 66% down the video. #karaoke-root is
// an empty canvas — the builder fills it with whatever composition the MV
// calls for.
//
// LOCKED — do not rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; CSP requires it)
//   • window.__koGen + MY_GEN closure capture for loop termination
//   • window.__setlist, __parsedLyrics, __transCache, __plainLyrics,
//     __lyricOffsets, __wordAlign, __karaokeLyricsHidden, __karaokeRebuild
//   • RAF + setInterval(tick, 30) dual loop with MY_GEN bail
//   • COLOR_POLL setInterval at ~150ms (JP textContent → colored spans + ruby gloss)
//   • positionTick posKey cache
//   • curLineIdx = -1 reset on song transition
//   • Per-write cache guards before every DOM write
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • JP line above EN line in DOM (learner reads JP first)
//   • __mergeTranslations expects `{en, align: {jp, gloss, en}}`
//   • Hard DOM contract: `#ko-line-jp` and `#ko-line-en` must exist inside
//     `#ko-lyrics > .ko-slot`
//   • Offset hotkeys `[` `]` `\` via document-level keydown listener, with
//     postMessage broadcast for extension persistence
//
// FREE — heavily modify per-song:
//
//   THEME, CSS rules, @keyframes, pseudo-elements, HTML structure added inside
//   #karaoke-root, decorative wrappers around .ko-slot, animations, composition,
//   layout. Typography and color of the lyric lines themselves. Everything is
//   your canvas once the locked plumbing is in place.
//
//   `window.__karaokeLyricsHidden = true` hides lyrics. If your design warrants
//   a toggle button for that (or anything else), build it yourself.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — fonts + palette + lyric-line typography defaults.
  // Exposed as CSS custom properties on #karaoke-root and #ko-lyrics so any
  // HTML the builder inserts can consume them consistently with the lyrics.
  // ==========================================================================
  const THEME = {
    // Cartoon-doodle pop. Bold display sans + chunky-friendly JP.
    fontsHref: 'https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Fredoka:wght@500;600;700&family=Mochiy+Pop+One&family=M+PLUS+Rounded+1c:wght@700;800;900&display=swap',
    fontDisplay: '"Bowlby One SC", system-ui, sans-serif',
    fontBody:    '"Fredoka", system-ui, sans-serif',
    fontJP:      '"Mochiy Pop One", "M PLUS Rounded 1c", sans-serif',
    fontJPAlt:   '"M PLUS Rounded 1c", sans-serif',

    // Palette pulled directly from the MV.
    sky:        '#5DB7E7',
    skyDeep:    '#3a8fc4',
    cream:      '#FBF6E9',
    creamEdge:  '#F0E6CC',
    ink:        '#1B2330',
    inkSoft:    '#3a4555',
    red:        '#D63A3A',
    yellow:     '#F8C73E',
    navy:       '#2E5273',
    orange:     '#E89160',
    pink:       '#F4B0AC',

    // Lyrics: dark ink on cream card, no stroke, soft cream halo.
    lyricColorEN:  '#1B2330',
    lyricColorJP:  '#1B2330',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(255,255,255,0.85), 0 0 14px rgba(251,246,233,0.95)',
    lyricShadowJP: '0 1px 0 rgba(255,255,255,0.85), 0 0 14px rgba(251,246,233,0.95)',
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
  window.__wordAlign = window.__wordAlign || {
    // MV palette: red hat, navy skirt, orange shrimp, deep teal, magenta, gold tank.
    colors: ['#D63A3A','#2E5273','#E5733C','#0F8C5E','#B6469E','#C99214'],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // --- Generation counter: bumps so prior tick closures self-terminate ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  // --- Runtime knobs ---
  window.__koMaxHold    = window.__koMaxHold    || 10;

  // --- Clean up any prior injection's leftover DOM ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Load Google Fonts via <link> (CSP blocks @import inside <style>) ---
  if (!document.querySelector('link[data-karaoke-font]')) {
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

    /* Theme vars shared between #karaoke-root and #ko-lyrics — sibling, not descendant. */
    #karaoke-root, #ko-lyrics {
      --ko-sky:        ${THEME.sky};
      --ko-sky-deep:   ${THEME.skyDeep};
      --ko-cream:      ${THEME.cream};
      --ko-cream-edge: ${THEME.creamEdge};
      --ko-ink:        ${THEME.ink};
      --ko-ink-soft:   ${THEME.inkSoft};
      --ko-red:        ${THEME.red};
      --ko-yellow:     ${THEME.yellow};
      --ko-navy:       ${THEME.navy};
      --ko-orange:     ${THEME.orange};
      --ko-pink:       ${THEME.pink};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ==== LYRIC CARD — cream sticker pinned to the cyan world ==== */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    /* Outer wrapper holds tilt + drop-shadow so animation transforms inside
       don't fight the sticker pose. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 26px 36px 24px;
      background: var(--ko-cream);
      border: 4px solid var(--ko-ink);
      border-radius: 22px;
      box-shadow:
        6px 6px 0 var(--ko-ink),
        6px 6px 0 4px rgba(27,35,48,0.0),
        0 14px 38px rgba(27,35,48,0.28);
      transform: rotate(-1.2deg);
    }
    /* Inner clip wrapper hosts the wind/grain so the slot itself can keep
       overflow visible (badge + mascot extend beyond the card edges). */
    #ko-lyrics .ko-slot .ko-wind {
      position: absolute;
      inset: 0;
      border-radius: 18px;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }
    /* Wind speed-lines drifting right-to-left across the card backdrop —
       SIGNATURE: continuous "kyoufuu" gust visible behind every line. */
    #ko-lyrics .ko-slot .ko-wind::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        repeating-linear-gradient(
          80deg,
          transparent 0 28px,
          rgba(46,82,115,0.10) 28px 30px,
          transparent 30px 70px,
          rgba(46,82,115,0.07) 70px 71px,
          transparent 71px 130px,
          rgba(46,82,115,0.05) 130px 131px,
          transparent 131px 200px
        );
      background-size: 220px 100%;
      animation: koWind 2.6s linear infinite;
      mix-blend-mode: multiply;
      opacity: 0.55;
    }
    /* Cream paper grain on top of wind for depth. */
    #ko-lyrics .ko-slot .ko-wind::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.7) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(240,230,204,0.6) 0%, transparent 55%);
      mix-blend-mode: screen;
      opacity: 0.6;
    }
    @keyframes koWind {
      from { background-position:    0 0; }
      to   { background-position: -220px 0; }
    }

    /* KYOUFUU badge — red sticker tucked top-left, like a doodle label. */
    #ko-lyrics .ko-badge {
      position: absolute;
      top: -14px;
      left: 22px;
      z-index: 3;
      padding: 6px 14px 5px;
      background: var(--ko-red);
      color: #fff;
      border: 3px solid var(--ko-ink);
      border-radius: 10px;
      font-family: var(--ko-font-display);
      font-size: 14px;
      letter-spacing: 0.14em;
      line-height: 1;
      transform: rotate(-3deg);
      box-shadow: 3px 3px 0 var(--ko-ink);
      white-space: nowrap;
    }
    #ko-lyrics .ko-badge .jp {
      font-family: var(--ko-font-jp);
      font-size: 14px;
      letter-spacing: 0.05em;
      margin-right: 6px;
    }
    /* A tiny hat-pigeon doodle peeking from the bottom-right corner. */
    #ko-lyrics .ko-mascot {
      position: absolute;
      right: -10px;
      bottom: -16px;
      width: 56px;
      height: 56px;
      z-index: 3;
      transform: rotate(8deg);
      filter: drop-shadow(2px 2px 0 var(--ko-ink));
    }

    /* Lyric stack — gloss(top via ruby) → JP → EN, all on cream. */
    #ko-lyrics .ko-line-jp,
    #ko-lyrics .ko-line-en {
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      font-size: 44px;
      line-height: 2.05;
      padding-top: 0.45em;
      letter-spacing: 0.02em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp.ko-fresh {
      animation: koBlowIn 0.42s cubic-bezier(.16,.9,.3,1) both;
    }
    /* Per-chunk colored spans — slight lift + sticker-style outline keeps them
       readable against the cream + wind streaks. */
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: 0.5px rgba(27,35,48,0.55);
      text-shadow:
        0 1px 0 rgba(255,255,255,0.95),
        0 0 8px rgba(251,246,233,0.95);
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-body);
      font-size: 21px;
      font-weight: 700;
      letter-spacing: 0.01em;
      line-height: 1.05;
      padding-bottom: 5px;
      color: var(--ko-ink-soft);
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow:
        0 0 3px rgba(255,255,255,1),
        0 0 6px rgba(255,255,255,0.9);
      user-select: none;
      opacity: 0.92;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-body);
      font-weight: 600;
      color: ${THEME.lyricColorEN};
      font-size: 38px;
      line-height: 1.18;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      margin-top: 4px;
    }
    #ko-lyrics .ko-line-en.ko-fresh {
      animation: koBlowIn 0.46s cubic-bezier(.16,.9,.3,1) 0.05s both;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: 0.4px rgba(27,35,48,0.45);
      text-shadow:
        0 1px 0 rgba(255,255,255,0.95),
        0 0 6px rgba(251,246,233,0.95);
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 30px;
      font-weight: 500;
      font-family: var(--ko-font-body);
    }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* Wind blow-in: lyric sweeps in from the right with a quick motion-blur
       smear, settling into place. The card's wind streaks make this feel like
       the line was literally blown onto the paper. */
    @keyframes koBlowIn {
      0% {
        opacity: 0;
        transform: translateX(60px) skewX(-12deg);
        filter: blur(3px);
      }
      55% {
        opacity: 1;
        filter: blur(0px);
      }
      80% {
        transform: translateX(-3px) skewX(0deg);
      }
      100% {
        opacity: 1;
        transform: translateX(0) skewX(0deg);
        filter: none;
      }
    }
    /* Chorus accent: when the JP line ENDS in オールバック (the title hook),
       the whole card gets a quick wind-shake. Toggled by JS via .ko-gust. */
    #ko-lyrics .ko-slot.ko-gust {
      animation: koGust 0.55s ease-out;
    }
    @keyframes koGust {
      0%   { transform: rotate(-1.2deg) translateX(0); }
      18%  { transform: rotate(-2.4deg) translateX(-6px) scale(1.015); }
      36%  { transform: rotate(-0.4deg) translateX(4px); }
      55%  { transform: rotate(-1.8deg) translateX(-3px); }
      75%  { transform: rotate(-1.0deg) translateX(2px); }
      100% { transform: rotate(-1.2deg) translateX(0); }
    }
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  // Attach to <body>, NOT #movie_player — YouTube detaches #movie_player from
  // the tree on scroll/resize events and the overlay would vanish.
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // Lyric card: the one thing this skeleton renders. Everything else — panels,
  // headers, title cards, ctrl buttons — is added per-MV in overlay.js.
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-wind"></div>
      <div class="ko-badge"><span class="jp">強風</span>KYOUFUU</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <svg class="ko-mascot" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse cx="30" cy="34" rx="22" ry="18" fill="#3a5f8a" stroke="#1B2330" stroke-width="2.5"/>
        <path d="M52 34 L60 30 L58 38 Z" fill="#3a5f8a" stroke="#1B2330" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M14 18 Q30 8 46 18 L46 24 Q30 16 14 24 Z" fill="#D63A3A" stroke="#1B2330" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="10" y1="33" x2="18" y2="36" stroke="#1B2330" stroke-width="2" stroke-linecap="round"/>
        <line x1="42" y1="33" x2="50" y2="36" stroke="#1B2330" stroke-width="2" stroke-linecap="round"/>
        <line x1="13" y1="38" x2="20" y2="38" stroke="#1B2330" stroke-width="2" stroke-linecap="round"/>
        <line x1="40" y1="38" x2="47" y2="38" stroke="#1B2330" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
  `);
  document.body.appendChild(lyrics);

  // Apply persisted hide-lyrics state. No button exists — toggle via console
  // (`window.__karaokeLyricsHidden = true; ...`) or wire your own UI. The
  // state survives re-injection via the preserved window flag.
  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + LRCLib fetching (in-browser fallback) ---
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

  // --- Cached state for DOM-write guards ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';

  // --- Position tick: re-anchor the lyric card to the video rect ---
  // posKey cache is LOAD-BEARING — without it every 250ms writes to style.left/top
  // unconditionally, cascading through YouTube's MutationObservers.
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

  // --- Main tick: update lyric text only ---
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

    // ---- Song change block ----
    if (idx !== curSongIdx) {
      curSongIdx = idx;
      // CRITICAL: reset curLineIdx so the new song's line 0 can fire.
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    // ---- LRC line lookup + display ----
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

  // --- Dual loop: RAF for smoothness, setInterval for background-tab coverage ---
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

  // --- Offset hotkeys: [ ] \ ---
  // Positive offset = lyrics LAG (appear later than audio); negative = LEAD.
  // `[` subtracts (pulls lyrics earlier on screen), `]` adds (pushes later).
  // Tick uses `elapsed = inSong - offset`, so subtracting from offset makes
  // the current line advance sooner.
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

  // --- Rebuild hook: call after merging new translation data ---
  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

  // --- Timestamp-keyed translation merge ---
  // Accepts two per-line shapes:
  //   1. String: "<en line>" — plain translation, no color alignment
  //   2. Object: {en, align: {jp, gloss, en}} — translation + alignment + gloss
  // Keys are LRC timestamps as (m*60+s).toFixed(2).
  window.__mergeTranslations = (data) => {
    const parsed = window.__parsedLyrics;
    for (const id in data) {
      if (!data.hasOwnProperty(id)) continue;
      const lines = parsed[id];
      if (!lines) continue;
      const map = data[id];
      for (const line of lines) {
        // Tolerate both "44.2" and "44.20" — Python's default str() drops trailing zeros.
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
            // Field-level merge — a follow-up batch carrying only `gloss` must
            // not wipe existing `jp`/`en`. Replacing the whole align object is
            // a silent-data-loss footgun.
            const existing = window.__wordAlign.data[line.text] || {};
            window.__wordAlign.data[line.text] = Object.assign(existing, val.align);
          }
        }
      }
    }
    window.__karaokeRebuild();
  };

  // --- Wind-blown line entry: retrigger slide-in animation on every line
  //     change, and shake the card on the chorus hook (オールバック lines). ---
  let _lastAnimJp = '\u0000';
  const ANIM_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(ANIM_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    const slot = document.getElementById('ko-slot');
    if (!jpEl || !enEl || !slot) return;
    const jp = jpEl.textContent;
    if (jp === _lastAnimJp) return;
    _lastAnimJp = jp;
    if (!jp.trim()) {
      jpEl.classList.remove('ko-fresh');
      enEl.classList.remove('ko-fresh');
      return;
    }
    jpEl.classList.remove('ko-fresh');
    enEl.classList.remove('ko-fresh');
    void jpEl.offsetWidth;
    jpEl.classList.add('ko-fresh');
    enEl.classList.add('ko-fresh');
    if (jp.endsWith('オールバック')) {
      slot.classList.remove('ko-gust');
      void slot.offsetWidth;
      slot.classList.add('ko-gust');
    }
  }, 80);

  // --- Color + gloss colorizer (polling, NOT MutationObserver — observer
  //     creates a feedback loop with the tick's textContent writes). ---
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
