// ============================================================================
// KARAOKE OVERLAY — 天天天国地獄国 / Ten Ten Tengoku Jigoku Koku
//   Cover by ヰ世界情緒 × 花譜
//
// Concept: a single playing card lying flat on a dealer's table, cracked open
// along its middle seam. The top half is heaven-gold, the bottom half is
// hell-crimson; the rift between them is the gate referenced in the spoken
// narration ("the gate between heaven and hell is opening"). A small luminous
// gate-star ornament inlaid at the seam's center represents the crystal the
// two singers hold in the MV. Rotationally-opposed corner rank pips (天 top-
// left gold, 獄 bottom-right crimson 180°) mirror the MV's head-to-head
// character symmetry and repurpose classical playing-card pip placement.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME
  // ==========================================================================
  const THEME = {
    fontsHref: 'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@700;800&family=Reggae+One&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Cormorant+SC:wght@500;600&display=swap',

    // Card surface (warm ivory, NOT pure cream — the card is card-stock, not paper)
    cream:       '#f2e6d2',
    creamDeep:   '#e6d5ba',
    cardInk:     '#1a0a10',    // main text — near-black with a red warmth
    cardInkSoft: '#4a2432',    // secondary

    // Heaven half (top)
    heavenTint:   '#f9ecc9',   // pale gold wash
    heavenFoil:   '#c9a355',   // gold hairline
    heavenDeep:   '#8a6a1d',   // shadow gold

    // Hell half (bottom)
    hellTint:     '#f0cfbe',   // pale rose wash (bottom-facing)
    hellFoil:     '#a42b3d',   // crimson hairline
    hellDeep:     '#5a0f20',   // shadow crimson

    // The gate (seam + inlaid star)
    gateGlow:     '#fff3c2',   // warm white-gold
    gateShadow:   'rgba(201, 163, 85, 0.55)',

    // Chunk color palette (6 slots) — sampled directly from the MV's radial
    // burst: magenta-crimson rays (0), central canary sun (1), violet outer
    // halo (2), ember-orange flame licks (3), electric teal edges (4), deep
    // crimson-rose hell side (5).
    chunkColors: ['#d43f6a','#c8901f','#7d3aa8','#e25a29','#2e8fa6','#b0212f'],
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
    colors: THEME.chunkColors.slice(),
    data: {}
  };
  window.__wordAlign.colors = THEME.chunkColors.slice();
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.68, widthFrac: 0.64 },
    window.__koPosition || {}
  );

  // --- Generation counter + runtime knobs ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Clean up any prior injection's leftover DOM ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Load Google Fonts via <link> (CSP blocks @import inside <style>) ---
  if (THEME.fontsHref && !document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
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

    /* ==== LOCKED PLUMBING ============================================== */
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
    #karaoke-root, #ko-lyrics {
      --ko-cream:        ${THEME.cream};
      --ko-cream-deep:   ${THEME.creamDeep};
      --ko-ink:          ${THEME.cardInk};
      --ko-ink-soft:     ${THEME.cardInkSoft};
      --ko-heaven-tint:  ${THEME.heavenTint};
      --ko-heaven-foil:  ${THEME.heavenFoil};
      --ko-heaven-deep:  ${THEME.heavenDeep};
      --ko-hell-tint:    ${THEME.hellTint};
      --ko-hell-foil:    ${THEME.hellFoil};
      --ko-hell-deep:    ${THEME.hellDeep};
      --ko-gate-glow:    ${THEME.gateGlow};
      --ko-gate-shadow:  ${THEME.gateShadow};
      --ko-f-jp:         "Shippori Mincho B1", "Noto Serif JP", serif;
      --ko-f-rank:       "Reggae One", "Shippori Mincho B1", serif;
      --ko-f-en:         "Cormorant Garamond", "EB Garamond", serif;
      --ko-f-gloss:      "Cormorant SC", "Cormorant Garamond", serif;
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — a single playing card cracked open ==================== */
    #ko-lyrics .ko-card {
      position: relative;
      display: grid;
      grid-template-rows: 1fr auto 1fr;
      min-height: 168px;
      padding: 2px;            /* outer gold hairline eats 2px */
      border-radius: 3px;
      isolation: isolate;
      overflow: visible;

      /* Double foil border: outer gold, inner crimson thread */
      background:
        linear-gradient(180deg,
          var(--ko-heaven-foil) 0%,
          var(--ko-heaven-foil) 49.4%,
          var(--ko-hell-foil)   50.6%,
          var(--ko-hell-foil)   100%
        );

      /* Seat on velvet: a soft vertical shadow + thin rim */
      box-shadow:
        0  1px  0 rgba(255,255,255,0.24) inset,
        0 24px 52px -14px rgba(12, 4, 10, 0.68),
        0 8px 22px -8px rgba(20, 6, 14, 0.42);

      transition: opacity 380ms ease;
    }
    /* Inner crimson hairline — sits inside the gold outer via a second layer */
    #ko-lyrics .ko-card::before {
      content: '';
      position: absolute;
      inset: 2px;
      border-radius: 2px;
      pointer-events: none;
      background:
        linear-gradient(180deg,
          var(--ko-hell-foil) 0%,
          var(--ko-hell-foil) 49.2%,
          var(--ko-heaven-foil) 50.8%,
          var(--ko-heaven-foil) 100%
        );
      z-index: 0;
    }

    /* Empty-state collapse — card softly fades during instrumental gaps */
    #ko-lyrics .ko-card:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
    }

    /* ==== TOP HALF — HEAVEN ============================================= */
    #ko-lyrics .ko-half-heaven {
      position: relative;
      padding: 26px 56px 18px 56px;
      background:
        radial-gradient(ellipse at 50% 120%,
          rgba(255, 243, 194, 0.55) 0%,
          rgba(249, 236, 201, 0.0) 70%),
        linear-gradient(180deg,
          var(--ko-heaven-tint) 0%,
          var(--ko-cream) 65%,
          var(--ko-cream) 100%);
      margin: 2px 2px 0 2px;  /* sits inside the crimson hairline layer */
      border-radius: 1px 1px 0 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 66px;
    }

    /* ==== BOTTOM HALF — HELL ============================================ */
    #ko-lyrics .ko-half-hell {
      position: relative;
      padding: 18px 56px 26px 56px;
      background:
        radial-gradient(ellipse at 50% -20%,
          rgba(255, 225, 188, 0.5) 0%,
          rgba(240, 207, 190, 0.0) 70%),
        linear-gradient(180deg,
          var(--ko-cream) 0%,
          var(--ko-cream) 35%,
          var(--ko-hell-tint) 100%);
      margin: 0 2px 2px 2px;
      border-radius: 0 0 1px 1px;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 58px;
    }

    /* ==== THE RIFT — seam between the two halves ======================= */
    /* Jagged sawtooth clip made from a thin strip, so the two halves look
       literally cracked open. The strip is purely decorative; the halves'
       own borders meet beneath it. */
    #ko-lyrics .ko-rift {
      position: relative;
      height: 11px;
      margin: 0 2px;
      z-index: 2;
      background:
        linear-gradient(90deg,
          var(--ko-heaven-foil) 0%,
          var(--ko-heaven-deep) 22%,
          #2c0a14 48%,
          #2c0a14 52%,
          var(--ko-hell-deep) 78%,
          var(--ko-hell-foil) 100%);
      /* Serrated top & bottom edges — "cracked" not "cut" */
      clip-path: polygon(
        0% 40%, 3% 30%, 6% 42%, 9% 32%, 12% 44%, 15% 30%, 18% 42%,
        22% 32%, 25% 44%, 28% 30%, 31% 42%, 34% 32%, 37% 44%, 40% 30%,
        43% 42%, 46% 32%, 50% 44%, 54% 32%, 57% 42%, 60% 30%, 63% 44%,
        66% 32%, 69% 42%, 72% 30%, 75% 44%, 78% 32%, 82% 42%, 85% 30%,
        88% 44%, 91% 32%, 94% 42%, 97% 30%, 100% 40%,
        100% 60%, 97% 70%, 94% 58%, 91% 68%, 88% 56%, 85% 70%, 82% 58%,
        78% 68%, 75% 56%, 72% 70%, 69% 58%, 66% 68%, 63% 56%, 60% 70%,
        57% 58%, 54% 68%, 50% 56%, 46% 68%, 43% 58%, 40% 70%, 37% 56%,
        34% 68%, 31% 58%, 28% 70%, 25% 56%, 22% 68%, 18% 58%, 15% 70%,
        12% 56%, 9% 68%, 6% 58%, 3% 70%, 0% 60%);
      box-shadow:
        0  -6px 18px -4px rgba(201, 163, 85, 0.28),
        0   6px 18px -4px rgba(164,  43, 61, 0.26);
    }
    /* Soft bloom around the rift — light leaking from the gate */
    #ko-lyrics .ko-card::after {
      content: '';
      position: absolute;
      left: 14px;
      right: 14px;
      top: 50%;
      height: 46px;
      transform: translateY(-50%);
      background:
        radial-gradient(ellipse at 50% 50%,
          rgba(255, 243, 194, 0.35) 0%,
          rgba(255, 243, 194, 0.15) 28%,
          rgba(255, 243, 194, 0)    64%);
      filter: blur(1.4px);
      pointer-events: none;
      z-index: 1;
      mix-blend-mode: screen;
    }

    /* ==== THE GATE-STAR — inlaid ornament at the rift's center ========== */
    /* An 8-pointed star (star-of-regulus) made from two rotated squares.
       Represents the crystal held between the two singers in the MV. */
    #ko-lyrics .ko-gate {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 14px;
      height: 14px;
      transform: translate(-50%, -50%);
      z-index: 5;
      pointer-events: none;
      animation: ko-gate-shimmer 5.2s ease-in-out infinite;
    }
    #ko-lyrics .ko-gate::before,
    #ko-lyrics .ko-gate::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--ko-gate-glow);
      /* 4-pointed diamond via clip-path; two rotated 45° form an 8-point star */
      clip-path: polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%);
      box-shadow:
        0 0 6px  rgba(255, 243, 194, 0.95),
        0 0 14px rgba(230, 180, 80, 0.65),
        0 0 30px rgba(230, 180, 80, 0.35);
    }
    #ko-lyrics .ko-gate::after {
      transform: rotate(22.5deg) scale(0.72);
      opacity: 0.85;
      filter: brightness(1.15);
    }
    @keyframes ko-gate-shimmer {
      0%, 100% { opacity: 0.72; transform: translate(-50%, -50%) scale(1.00) rotate(0deg); }
      50%      { opacity: 1.00; transform: translate(-50%, -50%) scale(1.14) rotate(12deg); }
    }

    /* ==== CORNER RANK PIPS — 天 (top-left) & 獄 (bottom-right) ========== */
    /* Classical playing-card rank placement: two rotationally-opposed
       corners. NOT four ornaments; the other two corners stay clean. */
    #ko-lyrics .ko-rank {
      position: absolute;
      font-family: var(--ko-f-rank);
      font-weight: 400;   /* Reggae One is already display-weight */
      font-size: 24px;
      line-height: 1;
      letter-spacing: 0;
      z-index: 4;
      pointer-events: none;
      user-select: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    #ko-lyrics .ko-rank .ko-rank-char {
      line-height: 0.9;
    }
    #ko-lyrics .ko-rank .ko-rank-pip {
      width: 9px; height: 9px;
      display: block;
    }
    /* Heaven pip: 4-point star */
    #ko-lyrics .ko-rank-heaven {
      top: 14px; left: 18px;
      color: var(--ko-heaven-deep);
      text-shadow:
        0 1px 0 rgba(255, 243, 194, 0.7),
        0 0 10px rgba(201, 163, 85, 0.35);
    }
    #ko-lyrics .ko-rank-heaven .ko-rank-pip {
      background: currentColor;
      clip-path: polygon(50% 0%, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0% 50%, 42% 42%);
    }
    /* Hell pip: flame tongue (rotated 180° with the whole rank) */
    #ko-lyrics .ko-rank-hell {
      bottom: 14px; right: 18px;
      color: var(--ko-hell-deep);
      transform: rotate(180deg);
      text-shadow:
        0 1px 0 rgba(240, 207, 190, 0.6),
        0 0 10px rgba(164, 43, 61, 0.35);
    }
    #ko-lyrics .ko-rank-hell .ko-rank-pip {
      background: currentColor;
      clip-path: polygon(50% 0%, 65% 25%, 80% 14%, 82% 38%, 100% 48%, 78% 62%, 90% 90%, 60% 76%, 50% 100%, 40% 76%, 10% 90%, 22% 62%, 0% 48%, 18% 38%, 20% 14%, 35% 25%);
    }

    /* ==== JP LYRIC (top half — heaven) ================================= */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-f-jp);
      font-weight: 800;
      color: var(--ko-ink);
      font-size: 34px;
      line-height: 1.35;
      letter-spacing: 0.03em;
      min-height: 1em;
      padding-top: 0.5em;
      text-shadow:
        0 1px 0 rgba(255, 243, 194, 0.55),
        0 0 18px rgba(201, 163, 85, 0.18);
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-jp span { /* chunk spans */
      text-shadow:
        0 1px 0 rgba(255, 243, 194, 0.35),
        0 0 10px rgba(0, 0, 0, 0.08);
    }
    /* Ruby gloss — per-morpheme English ABOVE the JP */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-f-gloss);
      font-weight: 500;
      font-size: 14px;
      line-height: 1.05;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      padding-bottom: 4px;
      user-select: none;
      opacity: 0.9;
      text-shadow: 0 1px 0 rgba(255, 243, 194, 0.6);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* ==== EN LYRIC (bottom half — hell) =============================== */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-f-en);
      font-weight: 500;
      font-style: italic;
      color: var(--ko-ink);
      font-size: 22px;
      line-height: 1.28;
      letter-spacing: 0.015em;
      max-width: 100%;
      min-height: 1em;
      text-shadow:
        0 1px 0 rgba(240, 207, 190, 0.55),
        0 0 14px rgba(164, 43, 61, 0.12);
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-en span {
      text-shadow: 0 1px 0 rgba(240, 207, 190, 0.4);
    }
    /* English-original songs: a touch smaller, no italic */
    #ko-lyrics .ko-line-en.en-song {
      font-size: 18px;
      font-style: normal;
      font-weight: 500;
    }
    /* English-only pure-chant lines ("Dead, alive, dead, alive"): subtle
       small-caps spacing — an echo of ritual repetition. Applies when JP
       hidden is NOT set but the line reads as pure latin. Handled via
       text-only styling; the colorizer still runs. */
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-card" id="ko-slot">
      <div class="ko-rank ko-rank-heaven">
        <span class="ko-rank-char">天</span>
        <span class="ko-rank-pip"></span>
      </div>
      <div class="ko-rank ko-rank-hell">
        <span class="ko-rank-char">獄</span>
        <span class="ko-rank-pip"></span>
      </div>

      <div class="ko-half-heaven">
        <div class="ko-line-jp" id="ko-line-jp"></div>
      </div>

      <div class="ko-rift">
        <div class="ko-gate"></div>
      </div>

      <div class="ko-half-hell">
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

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

  // --- Position tick: re-anchor the lyric zone to the video rect ---
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

  // --- Offset hotkeys: [ ] \ ---
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

  // --- Timestamp-keyed translation merge ---
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

  // --- Color + gloss colorizer (polling, NOT MutationObserver) ---
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
