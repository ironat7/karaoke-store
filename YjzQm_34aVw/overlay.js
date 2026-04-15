// ============================================================================
// KARAOKE OVERLAY — GIVE UP 今世 壊 (Gura cover of DYES IWASAKI · FAKE TYPE.)
// ----------------------------------------------------------------------------
// Design: manga scan-page. Cream halftone panel, heavy inked border, sticker
// tilt, scanline texture, neon-pink & mint chunk colors pulled from the MV.
// Signature: a row of crushed Bloop cans accumulates along the card's bottom
// as the song progresses — matches the thumbnail's punchline of Gura face-down
// in empties. The refrain hook ("Give up 今世 …") triggers a chromatic
// kanji-bleed shadow on the card.
// ============================================================================

(() => {

  const THEME = {
    fontsHref:
      'https://fonts.googleapis.com/css2?family=Reggae+One&family=Bowlby+One&family=M+PLUS+Rounded+1c:wght@500;700;800&family=JetBrains+Mono:wght@600;800&display=swap',
    fontDisplay: '"Bowlby One","M PLUS Rounded 1c",system-ui,sans-serif',
    fontBody:    '"M PLUS Rounded 1c","Bowlby One",system-ui,sans-serif',
    fontJP:      '"Reggae One","M PLUS Rounded 1c",system-ui,sans-serif',
    fontMono:    '"JetBrains Mono",ui-monospace,monospace',

    // Palette pulled from the MV: hot pink shout text, mint/cyan hair, acid
    // chartreuse panels, warm peach phone, cream manga paper, deep ink.
    cream:      '#f6efe4',
    creamDeep:  '#e9dfcc',
    pink:       '#ff2d87',
    pinkDeep:   '#c9155f',
    mint:       '#3fd9bf',
    cyan:       '#1fd4ff',
    chartreuse: '#c7e625',
    peach:      '#ff8a47',
    ink:        '#141821',
    accent:     '#ff2d87',
    accentDeep: '#c9155f',
    accentInk:  '#141821',
    gold:       '#ffc94b',

    // Dark ink on cream card — no stroke, just a soft cream halo for depth.
    lyricColorEN:  '#141821',
    lyricColorJP:  '#141821',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(255,255,255,0.6), 0 0 10px rgba(246,239,228,0.6)',
    lyricShadowJP: '0 1px 0 rgba(255,255,255,0.6), 0 0 10px rgba(246,239,228,0.6)',
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
  // Six MV-derived colors for the interlinear gloss + line chunking.
  // 0 pink (shout text), 1 mint (hair), 2 cyan (eyes), 3 chartreuse (panels),
  // 4 peach (phone / face warmth), 5 deep ink (sketchy outline).
  window.__wordAlign = window.__wordAlign || { colors: [], data: {} };
  window.__wordAlign.colors = ['#ff2d87','#2ec6a9','#1fd4ff','#b8d820','#ff7a3b','#141821'];
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold    = window.__koMaxHold    || 10;

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
    }

    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-cream-deep:  ${THEME.creamDeep};
      --ko-pink:        ${THEME.pink};
      --ko-pink-deep:   ${THEME.pinkDeep};
      --ko-mint:        ${THEME.mint};
      --ko-cyan:        ${THEME.cyan};
      --ko-chartreuse:  ${THEME.chartreuse};
      --ko-peach:       ${THEME.peach};
      --ko-ink:         ${THEME.ink};
      --ko-gold:        ${THEME.gold};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-mono:    ${THEME.fontMono};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ====  LYRIC CARD — manga scan page  ============================== */

    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      z-index: 2147483100;
      transform: translate(-50%, -50%) rotate(-1.1deg);

      background:
        /* halftone dots */
        radial-gradient(circle at 2px 2px, rgba(20,24,33,0.10) 1px, transparent 1.2px) 0 0 / 7px 7px,
        /* subtle paper texture */
        radial-gradient(ellipse at 30% 10%, rgba(255,255,255,0.55), rgba(0,0,0,0) 65%),
        linear-gradient(180deg, ${THEME.cream} 0%, ${THEME.creamDeep} 100%);
      background-blend-mode: multiply, normal, normal;

      border: 4px solid ${THEME.ink};
      border-radius: 4px;
      padding: 18px 34px 56px 34px;
      box-shadow:
        8px 8px 0 0 ${THEME.ink},
        8px 8px 0 2px ${THEME.pink},
        0 24px 60px rgba(0,0,0,0.45);

      text-align: center;

      transition: box-shadow 200ms ease, transform 200ms ease;
    }
    #ko-lyrics.ko-chorus {
      transform: translate(-50%, -50%) rotate(-1.1deg) scale(1.012);
      box-shadow:
        8px 8px 0 0 ${THEME.ink},
        8px 8px 0 2px ${THEME.pink},
        -4px 0 0 0 rgba(255,45,135,0.55),
         4px 0 0 0 rgba(31,212,255,0.45),
        0 0 40px rgba(255,45,135,0.35),
        0 24px 60px rgba(0,0,0,0.45);
    }

    #ko-lyrics::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        repeating-linear-gradient(
          0deg,
          rgba(20,24,33,0.045) 0 1px,
          transparent 1px 3px
        );
      mix-blend-mode: multiply;
      border-radius: 2px;
    }
    #ko-lyrics::after {
      content: '';
      position: absolute;
      top: -12px;
      right: 38px;
      width: 68px;
      height: 22px;
      background: ${THEME.chartreuse};
      border: 2px solid ${THEME.ink};
      transform: rotate(4deg);
      box-shadow: 2px 2px 0 ${THEME.ink};
      opacity: 0.95;
    }

    #ko-lyrics .ko-track-tag {
      position: absolute;
      top: -18px;
      left: 18px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px 7px 14px;
      background: ${THEME.ink};
      color: ${THEME.cream};
      font-family: var(--ko-font-mono);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transform: rotate(-2deg);
      box-shadow: 3px 3px 0 ${THEME.pink};
      white-space: nowrap;
    }
    #ko-lyrics .ko-track-tag .ko-track-num {
      background: ${THEME.pink};
      color: ${THEME.ink};
      padding: 1px 8px;
      margin-right: 2px;
      font-weight: 800;
    }
    #ko-lyrics .ko-track-tag .ko-track-title {
      color: ${THEME.chartreuse};
      letter-spacing: 0.04em;
    }
    #ko-lyrics .ko-track-tag .ko-track-artist {
      color: ${THEME.cream};
      opacity: 0.75;
      font-weight: 600;
      font-size: 11px;
    }

    /* ====  LYRIC LINES  ============================================== */

    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      position: relative;
    }
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.35;
      padding-top: 0.45em;
      letter-spacing: 0.02em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-body);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding-bottom: 5px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 0px transparent;
      text-shadow: 0 1px 0 rgba(246,239,228,0.9), 0 0 6px rgba(246,239,228,0.85);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 400;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.22;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ====  BLOOP CAN ACCUMULATOR  ===================================== */

    #ko-cans {
      position: absolute;
      left: 16px;
      right: 16px;
      bottom: 8px;
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      justify-content: flex-start;
      gap: 2px;
      height: 38px;
      pointer-events: none;
    }
    #ko-cans .ko-can {
      flex: 0 0 auto;
      width: 22px;
      height: 34px;
      opacity: 0;
      transform: translateY(14px) rotate(0deg);
      transition: opacity 260ms ease, transform 320ms cubic-bezier(.2,.9,.35,1.3);
      filter: drop-shadow(1px 1px 0 rgba(20,24,33,0.5));
    }
    #ko-cans .ko-can.on {
      opacity: 1;
      transform: translateY(0) var(--tilt, rotate(-6deg));
    }
    #ko-cans .ko-count {
      position: absolute;
      right: 4px;
      bottom: 2px;
      font-family: var(--ko-font-mono);
      font-size: 11px;
      font-weight: 800;
      color: ${THEME.ink};
      background: ${THEME.chartreuse};
      border: 1.5px solid ${THEME.ink};
      padding: 1px 6px;
      letter-spacing: 0.04em;
      box-shadow: 1.5px 1.5px 0 ${THEME.ink};
    }

    /* ====  ON-SCREEN HOTKEY HINT  ===================================== */

    #ko-hint {
      position: absolute;
      left: 20px;
      bottom: -30px;
      font-family: var(--ko-font-mono);
      font-size: 11px;
      font-weight: 600;
      color: ${THEME.cream};
      letter-spacing: 0.08em;
      opacity: 0.72;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      pointer-events: none;
    }
    #ko-hint kbd {
      display: inline-block;
      padding: 1px 5px;
      margin: 0 1px;
      background: ${THEME.ink};
      color: ${THEME.chartreuse};
      border: 1px solid ${THEME.chartreuse};
      border-radius: 2px;
      font-family: inherit;
      font-size: 10px;
    }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // Crushed Bloop can — tiny SVG. White/silver can with a blue shark-mouth
  // gash (a nod to Gura's Bloop brand), body dented from the crushing.
  const canSVG = (i) => {
    const tilt = [-8, 6, -3, 10, -6, 4, -11, 2][i % 8];
    return `
      <svg class="ko-can" style="--tilt:rotate(${tilt}deg)" viewBox="0 0 22 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 4 L18 4 L19 10 L17 16 L18 22 L16 30 L6 30 L4 22 L5 16 L3 10 Z"
              fill="#efeee8" stroke="#141821" stroke-width="1.6" stroke-linejoin="round"/>
        <ellipse cx="11" cy="4" rx="7" ry="2.2" fill="#cfcfc8" stroke="#141821" stroke-width="1.2"/>
        <path d="M6 13 L9 11.5 L10 13.5 L12 11.5 L13 13.5 L15 11.5 L17 13"
              fill="none" stroke="#1ea2d8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6.5 18 Q11 19.5 15 17.5" fill="none" stroke="#141821" stroke-width="0.8" opacity="0.6"/>
        <circle cx="8" cy="24" r="1.1" fill="#ff2d87"/>
      </svg>
    `;
  };

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-track-tag">
      <span class="ko-track-num">TRACK 01</span>
      <span class="ko-track-title">GIVE UP 今世 壊</span>
      <span class="ko-track-artist">DYES IWASAKI × GURA</span>
    </div>
    <div class="ko-slot">
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
    <div id="ko-cans">
      ${Array.from({length: 36}, (_, i) => canSVG(i)).join('')}
      <div class="ko-count" id="ko-can-count">0 / 36</div>
    </div>
    <div id="ko-hint">
      <kbd>[</kbd><kbd>]</kbd> offset &nbsp;·&nbsp; <kbd>\\</kbd> reset
    </div>
  `);
  document.body.appendChild(lyrics);

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
  let lastChorus = false;
  let lastCanCount = -1;

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
      lyrics.style.width    = (r.width * 0.64) + 'px';
      lyrics.style.maxWidth = (r.width * 0.64) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  const isChorusText = (t) => !!(t && /Give up\s*今世/.test(t));

  const updateCans = (lineIdx) => {
    const count = Math.max(0, Math.min(36, lineIdx + 1));
    if (count === lastCanCount) return;
    lastCanCount = count;
    const cansWrap = document.getElementById('ko-cans');
    if (!cansWrap) return;
    const cans = cansWrap.querySelectorAll('.ko-can');
    cans.forEach((c, i) => {
      if (i < count) c.classList.add('on');
      else c.classList.remove('on');
    });
    const lbl = document.getElementById('ko-can-count');
    if (lbl) lbl.textContent = `${count} / 36`;
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

      updateCans(-1);
      lyrics.classList.remove('ko-chorus');
      lastChorus = false;
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
        updateCans(lineIdx);

        const chorusNow = isChorusText(showText);
        if (chorusNow !== lastChorus) {
          lyrics.classList.toggle('ko-chorus', chorusNow);
          lastChorus = chorusNow;
        }

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
    lastCanCount = -1;
    lastChorus = false;
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
