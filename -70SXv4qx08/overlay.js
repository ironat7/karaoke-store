// ============================================================================
// KARAOKE OVERLAY — Magnet / Moon Jelly × Miori Celesta
// ----------------------------------------------------------------------------
// The MV's own subtitle treatment (frame 215) frames a JP lyric on a
// tapered horizontal black matte bar. This overlay continues that language:
// a cinematic matte bar carries the JP line like a film subtitle, the EN
// translation reads below it in the MV's own small-caps serif voice, and a
// small cursive "magnet" wordmark sits above with sparkle ✦ flanks — the
// same motif the MV uses around its persistent title mark and at frame 20.
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

  // Six MV-derived chunks: Moon Jelly cyan, warm rose, honey gold, auburn,
  // sage teal, magenta peak. Picked to read on the black matte bar (bright
  // saturated mid-tones) and on cream EN zone (slightly deeper values).
  const CHUNK_COLORS = ['#7FDCFB', '#FF9CBA', '#F3CC7C', '#D89A7D', '#A0E0C4', '#E87BB3'];

  window.__wordAlign = window.__wordAlign || { colors: CHUNK_COLORS.slice(), data: {} };
  window.__wordAlign.colors = CHUNK_COLORS.slice();
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.76, widthFrac: 0.72 },
    window.__koPosition || {}
  );

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // Italianno: matches the MV's own cursive "Magnet" wordmark (frame 150).
  // Shippori Mincho thin-weight: matches the MV's burned-in JP lyrics
  // (frames 45/110/215). Cormorant Garamond italic small-caps: matches the
  // MV's persistent "MAGNET / MIORI CELESTA & MOON JELLY" title mark.
  const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Italianno&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Shippori+Mincho:wght@400;500;600;700&display=swap';
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

    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      transition: opacity 480ms ease;
    }
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
    }

    /* ==== HEADER STRIP — wordmark flanked by ✦ sparkles ================== */
    #ko-lyrics .ko-head {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 18px;
      margin-bottom: 16px;
      order: 0;
    }
    #ko-lyrics .ko-head .ko-rule {
      height: 1px;
      width: 68px;
      background: linear-gradient(90deg, transparent 0%, rgba(127, 220, 251, 0.6) 35%, rgba(127, 220, 251, 0.85) 50%, rgba(127, 220, 251, 0.6) 65%, transparent 100%);
    }
    #ko-lyrics .ko-head .ko-spark {
      font-family: "Cormorant Garamond", serif;
      font-size: 13px;
      color: rgba(230, 245, 255, 0.85);
      letter-spacing: 0.4em;
      line-height: 1;
      text-shadow: 0 0 10px rgba(127, 220, 251, 0.55);
    }
    #ko-lyrics .ko-wordmark {
      font-family: "Italianno", cursive;
      font-size: 42px;
      font-weight: 400;
      line-height: 0.9;
      letter-spacing: 0.02em;
      color: rgba(240, 250, 255, 0.95);
      text-shadow:
        0 1px 0 rgba(6, 12, 28, 0.85),
        0 0 14px rgba(127, 220, 251, 0.5),
        0 0 28px rgba(127, 220, 251, 0.3);
      transform: translateY(2px);
    }

    /* ==== JP BAR — black cinematic matte subtitle bar with tapered ends.
           Directly echoes the MV's frame-215 subtitle treatment (black
           horizontal bar framing a JP lyric line). The bar is wider than
           the text zone, fades to transparency at both ends via mask. */
    #ko-lyrics .ko-jp-wrap {
      position: relative;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 22px 56px 24px;
      order: 1;
    }
    #ko-lyrics .ko-jp-wrap::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(4, 8, 20, 0.0) 0%,
        rgba(4, 8, 20, 0.82) 16%,
        rgba(4, 8, 20, 0.94) 50%,
        rgba(4, 8, 20, 0.82) 84%,
        rgba(4, 8, 20, 0.0) 100%
      );
      mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 12%, #000 32%, #000 68%, rgba(0,0,0,0.85) 88%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 12%, #000 32%, #000 68%, rgba(0,0,0,0.85) 88%, transparent 100%);
      pointer-events: none;
      z-index: 0;
    }
    /* Hairline top and bottom edges of the bar — very subtle cyan glow */
    #ko-lyrics .ko-jp-wrap::after {
      content: '';
      position: absolute;
      left: 10%;
      right: 10%;
      top: 50%;
      transform: translateY(-50%);
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, rgba(127, 220, 251, 0.0) 15%, rgba(127, 220, 251, 0.28) 50%, rgba(127, 220, 251, 0.0) 85%, transparent 100%);
      pointer-events: none;
      z-index: 0;
      opacity: 0;  /* hidden by default; reserved hook for future accent */
    }

    /* ==== JP LINE — thin-weight mincho, white, letter-spaced cinematic */
    #ko-lyrics .ko-line-jp {
      position: relative;
      z-index: 1;
      font-family: "Shippori Mincho", "Noto Serif JP", serif;
      font-weight: 500;
      color: #FBFAF2;
      font-size: 42px;
      line-height: 1.6;
      letter-spacing: 0.13em;
      text-shadow:
        0 1px 0 rgba(0, 0, 0, 0.9),
        0 2px 8px rgba(0, 0, 0, 0.7);
      padding-top: 0.25em;
      padding-bottom: 0.12em;
      min-height: 1em;
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: "Cormorant Garamond", Garamond, serif;
      font-size: 14px;
      font-weight: 500;
      font-style: italic;
      line-height: 1.1;
      padding-bottom: 5px;
      letter-spacing: 0.04em;
      color: inherit;
      text-shadow:
        0 1px 0 rgba(0, 0, 0, 0.9),
        0 0 6px rgba(0, 0, 0, 0.65);
      user-select: none;
      opacity: 0.95;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* ==== EN LINE — small-caps italic serif below the bar, no background.
           Echoes the MV's persistent title-mark typography.               */
    #ko-lyrics .ko-line-en {
      font-family: "Cormorant Garamond", Garamond, serif;
      font-weight: 500;
      font-style: italic;
      font-variant: small-caps;
      color: #F0E9D8;
      font-size: 22px;
      line-height: 1.35;
      letter-spacing: 0.14em;
      text-shadow:
        0 1px 0 rgba(4, 8, 20, 0.95),
        0 2px 6px rgba(4, 8, 20, 0.75),
        0 0 14px rgba(4, 8, 20, 0.55);
      max-width: 100%;
      min-height: 1em;
      margin-top: 14px;
      order: 2;
    }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 20px;
      font-style: normal;
      font-variant: normal;
      font-weight: 400;
    }

    /* Credit pair under EN — tiny small-caps label referencing the MV's
       own credit strip (frame 150).                                    */
    #ko-lyrics .ko-credit {
      font-family: "Cormorant Garamond", serif;
      font-weight: 600;
      font-variant: small-caps;
      font-size: 10px;
      letter-spacing: 0.42em;
      line-height: 1;
      color: rgba(230, 245, 255, 0.42);
      text-shadow: 0 1px 0 rgba(4, 8, 20, 0.75);
      margin-top: 14px;
      padding-left: 0.42em;
      order: 3;
    }
    #ko-lyrics .ko-slot:has(.ko-line-en:empty):has(.ko-line-jp:empty) .ko-credit { opacity: 0; }
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
      <div class="ko-head">
        <span class="ko-rule"></span>
        <span class="ko-spark">✦</span>
        <span class="ko-wordmark">magnet</span>
        <span class="ko-spark">✦</span>
        <span class="ko-rule"></span>
      </div>
      <div class="ko-jp-wrap">
        <div class="ko-line-jp" id="ko-line-jp"></div>
      </div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="ko-credit">minato · miori celesta × moon jelly</div>
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
