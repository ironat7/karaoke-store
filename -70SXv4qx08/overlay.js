// ============================================================================
// KARAOKE OVERLAY — Magnet / Moon Jelly × Miori Celesta
// ----------------------------------------------------------------------------
// The MV's central visual is a glowing orb/moon the two characters hold
// between them (frame 20); the title-card interlude centers a cursive
// "Magnet" wordmark against a full moon surrounded by starfield and light
// streaks (frame 150). This overlay IS that moon: lyrics sit inside a
// soft-edged halo of moonlight, crowned by a small cursive wordmark that
// echoes the MV's own calligraphic signature, with a fine starfield drift
// behind the text and a warm pink undercurrent at the halo's lower edge.
// ============================================================================

(() => {

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

  // Six MV-derived hues, all legible against the moonlit-dark card backdrop:
  // Moon Jelly cyan / warm rose / auburn / honey gold / sage teal / magenta
  const CHUNK_COLORS = ['#6FD5F2', '#FF8CAE', '#D48B6D', '#F0C573', '#8BD4B3', '#E06BA0'];

  window.__wordAlign = window.__wordAlign || { colors: CHUNK_COLORS.slice(), data: {} };
  window.__wordAlign.colors = CHUNK_COLORS.slice();
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // Halo sits centered-wide, clear of the MV's top-right mirrored title
  // card, bottom-left normal title card, and bottom-center persistent mark.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.74, widthFrac: 0.66 },
    window.__koPosition || {}
  );

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // Italianno: the MV's own cursive "Magnet" wordmark uses this exact
  // register. Shippori Mincho: echoes the thin-weight burned-in JP mincho
  // in frames 45/110/215. Cormorant Garamond small-caps italic: mirrors
  // the MV's persistent "MAGNET / MIORI CELESTA & MOON JELLY" title mark.
  const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Italianno&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Shippori+Mincho:wght@400;500;600&display=swap';
  if (!document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = FONTS_HREF;
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

    /* ==== LOCKED PLUMBING ================================================ */
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
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== MOONLIT HALO — soft-edged orb containing the lyrics.
           NO hard rectangle, NO border, NO tilt. The container is a radial
           atmosphere that fades to transparent at the edges. Two layers
           stacked via pseudo-elements: moonlight wash (::before) and
           starfield dust (::after). Both follow the oval halo shape.     */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 58px 72px 56px;
      isolation: isolate;
      transition: opacity 480ms ease;
    }
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
    }

    /* Moonlight wash: deep navy at center softening to transparent edges,
       warmed with a pink undercurrent at the bottom-right (the MV's warm-
       stage lighting) and a cyan bloom at the top-left (Moon Jelly's side). */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      inset: -30px -40px;
      background:
        radial-gradient(ellipse 70% 55% at 28% 35%, rgba(111, 213, 242, 0.18) 0%, transparent 60%),
        radial-gradient(ellipse 55% 45% at 78% 78%, rgba(224, 107, 160, 0.16) 0%, transparent 55%),
        radial-gradient(ellipse 88% 70% at 50% 50%, rgba(14, 24, 48, 0.82) 0%, rgba(14, 24, 48, 0.58) 45%, rgba(14, 24, 48, 0.12) 80%, transparent 100%);
      filter: blur(2px);
      pointer-events: none;
      z-index: -2;
    }

    /* Starfield dust: tiny pale dots scattered via layered gradients.
       Six different dot positions at four sizes give a natural distribution
       without any texture file or animation loop. */
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      inset: -30px -40px;
      background:
        radial-gradient(circle at 12% 22%, rgba(255,255,255,0.85) 0.6px, transparent 1.2px),
        radial-gradient(circle at 28% 68%, rgba(255,255,255,0.7)  0.5px, transparent 1.1px),
        radial-gradient(circle at 44% 14%, rgba(255,255,255,0.55) 0.4px, transparent 0.9px),
        radial-gradient(circle at 62% 82%, rgba(255,255,255,0.85) 0.7px, transparent 1.4px),
        radial-gradient(circle at 78% 40%, rgba(255,255,255,0.6)  0.5px, transparent 1px),
        radial-gradient(circle at 90% 72%, rgba(255,255,255,0.5)  0.4px, transparent 0.9px),
        radial-gradient(circle at 18% 88%, rgba(255,255,255,0.7)  0.5px, transparent 1.1px),
        radial-gradient(circle at 54% 52%, rgba(255,255,255,0.4)  0.4px, transparent 0.8px),
        radial-gradient(circle at 72% 16%, rgba(255,255,255,0.8)  0.6px, transparent 1.3px);
      background-size:
        130px 120px, 110px 140px, 95px 105px, 155px 130px, 125px 115px,
        140px 125px, 105px 135px, 85px 95px, 120px 110px;
      background-position:
        0 0, 30px 50px, 65px 20px, 20px 60px, 50px 10px,
        10px 30px, 70px 40px, 40px 70px, 15px 25px;
      mask-image: radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 55%, transparent 95%);
      -webkit-mask-image: radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 55%, transparent 95%);
      mix-blend-mode: screen;
      opacity: 0.85;
      pointer-events: none;
      z-index: -1;
    }

    /* ==== CURSIVE WORDMARK — echoes the MV's own "Magnet" calligraphy.
           Small, above the lyrics, in a pale silver-cyan. Static. It's
           a fixed piece of the card identity, not animated.             */
    #ko-lyrics .ko-wordmark {
      font-family: "Italianno", cursive;
      font-size: 34px;
      font-weight: 400;
      line-height: 1;
      letter-spacing: 0.02em;
      color: rgba(230, 240, 250, 0.78);
      text-shadow:
        0 1px 0 rgba(14, 24, 48, 0.7),
        0 0 12px rgba(111, 213, 242, 0.4);
      margin-bottom: 14px;
      order: 0;
    }

    /* ==== JP LINE — thin-weight mincho, matching the MV's burned-in
           lyric treatment. Legibility via cream fill + multi-layer soft
           dark halo that survives cyan-bright AND magenta-peak frames.  */
    #ko-lyrics .ko-line-jp {
      font-family: "Shippori Mincho", "Noto Serif JP", serif;
      font-weight: 500;
      color: #F8F4EA;
      font-size: 44px;
      line-height: 1.85;
      letter-spacing: 0.1em;
      text-shadow:
        0 1px 0 rgba(10, 18, 36, 0.95),
        0 2px 6px rgba(10, 18, 36, 0.85),
        0 0 18px rgba(10, 18, 36, 0.7),
        0 0 44px rgba(10, 18, 36, 0.45);
      padding-top: 0.4em;
      min-height: 1em;
      order: 1;
    }
    /* Ruby gloss: tiny italic serif, echoes the credits-grid treatment */
    #ko-lyrics .ko-line-jp rt {
      font-family: "Cormorant Garamond", Garamond, serif;
      font-size: 15px;
      font-weight: 500;
      font-style: italic;
      line-height: 1.1;
      padding-bottom: 4px;
      letter-spacing: 0.03em;
      color: inherit;
      text-shadow:
        0 1px 0 rgba(10, 18, 36, 0.95),
        0 0 8px rgba(10, 18, 36, 0.7);
      user-select: none;
      opacity: 0.95;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* ==== THREE-DOT DIVIDER between JP and EN — tiny ornamental row
           (matches the "· · ·" treatment that appears on the thumbnail
           and in frame 20 over the bottom title mark).                   */
    #ko-lyrics .ko-divider {
      font-family: "Cormorant Garamond", serif;
      font-size: 14px;
      line-height: 1;
      letter-spacing: 0.5em;
      color: rgba(230, 240, 250, 0.5);
      text-shadow: 0 1px 0 rgba(10, 18, 36, 0.8);
      margin: 4px 0 10px;
      order: 2;
    }
    /* Hide the divider when the EN line is empty (instrumental / no translation) */
    #ko-lyrics .ko-slot:has(.ko-line-en:empty) .ko-divider { opacity: 0; }

    /* ==== EN LINE — italic serif matching the MV's persistent title mark. */
    #ko-lyrics .ko-line-en {
      font-family: "Cormorant Garamond", Garamond, serif;
      font-weight: 500;
      font-style: italic;
      color: #F2ECDF;
      font-size: 24px;
      line-height: 1.35;
      letter-spacing: 0.055em;
      text-shadow:
        0 1px 0 rgba(10, 18, 36, 0.95),
        0 2px 5px rgba(10, 18, 36, 0.7),
        0 0 14px rgba(10, 18, 36, 0.5);
      max-width: 100%;
      min-height: 1em;
      order: 3;
    }
    /* EN-original songs: regular (non-italic), smaller */
    #ko-lyrics .ko-line-en.en-song {
      font-size: 21px;
      font-style: normal;
      font-weight: 400;
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
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-wordmark">magnet</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-divider">·&nbsp;&nbsp;·&nbsp;&nbsp;·</div>
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
        if (d && d.syncedLyrics) window.__parsedLyrics[id] = parseLRC(d.syncedLyrics);
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
        if (elapsed < endAt) showText = line.text;
      }

      if (lineIdx !== curLineIdx || showText !== lastJpText) {
        curLineIdx = lineIdx;
        const enEl = document.getElementById('ko-line-en');
        const jpEl = document.getElementById('ko-line-jp');
        if (song.lang === 'en') {
          if (enEl && showText !== lastEnText) { enEl.textContent = showText; lastEnText = showText; }
          if (jpEl && lastJpText !== '')        { jpEl.textContent = '';      lastJpText = ''; }
        } else {
          const posEn = (lineIdx >= 0 && showText && lrc[lineIdx].en) || '';
          const en = posEn || (showText && window.__transCache[showText]) || '';
          if (enEl && en !== lastEnText)       { enEl.textContent = en;       lastEnText = en; }
          if (jpEl && showText !== lastJpText) { jpEl.textContent = showText; lastJpText = showText; }
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
