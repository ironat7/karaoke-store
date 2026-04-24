// ============================================================================
// KARAOKE OVERLAY — SKELETON (SINGLE-SONG FLAVOR)
// ----------------------------------------------------------------------------
// Two parts: LOCKED PLUMBING (below) which you inherit verbatim, and a
// FULLY WORKED CHERRY POP DESIGN (THEME block + CSS + DOM below the delete
// marker) which belongs to DECO*27「チェリーポップ」feat. 初音ミク only.
// Study the Cherry Pop design to see how a finished overlay looks, then
// delete it — every THEME field, every CSS selector below the delete marker,
// every Cherry-Pop-specific DOM element — before designing your MV from
// empty selectors. Tweaking values inside Cherry Pop's filled selectors is
// the #1 slop source on this skill.
//
// ----------------------------------------------------------------------------
// LOCKED — correctness-load-bearing. Don't rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; YouTube CSP requires it)
//   • window.__koGen + MY_GEN closure capture for loop termination
//   • window.__setlist, __parsedLyrics, __transCache, __plainLyrics,
//     __lyricOffsets, __wordAlign, __karaokeLyricsHidden, __karaokeRebuild,
//     __mergeTranslations (extension contract — bootstrap calls them by name)
//   • RAF + setInterval(tick, 30) dual loop with MY_GEN bail
//   • COLOR_POLL setInterval at ~150ms (JP textContent → colored spans + ruby)
//   • positionTick posKey cache (without it: style.left/top writes cascade
//     through YouTube's 50K-node DOM every 250ms, tab gets hot)
//   • curLineIdx = -1 reset on song transition
//   • Per-write cache guards before every DOM write
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • DOM order: JP line BEFORE EN line (a11y reading order). Flip VISUAL
//     order with flex order / grid — don't touch the DOM.
//   • Hard DOM contract: #ko-line-jp and #ko-line-en must exist inside
//     #ko-lyrics > .ko-slot. Wrap, decorate, reorder visually — but those
//     IDs must be in that slot.
//   • Offset hotkeys [ ] \ + window.postMessage broadcast (extension persists
//     tuned offsets via this channel)
//
// ----------------------------------------------------------------------------
// MECHANICAL PATTERNS WORTH KEEPING (non-visual bits that aren't Cherry-Pop-
// specific — useful regardless of what your MV looks like):
//
//   • :has(:empty) empty-state collapse — card fades during instrumental gaps
//   • Chunk-color + ruby-gloss rendering in COLOR_POLL (the learning tool)
//   • positionTick anchoring to <video> with posKey cache
//   • --ko-stem-w resize snap: when a signature element's size depends on a
//     JS-written CSS var, clear the consumer's transition before updating
//     the var so fullscreen/theater toggles snap instead of animating across.
//     Cherry Pop uses this on .ko-cherry — see positionTick.
//   • Rate-limited CSS-var writes (~7/sec) + matching CSS transition: slow
//     motion driven from JS doesn't need RAF-rate writes. Quantize to 140ms
//     steps with `transition: transform 160ms linear` on the consumer —
//     each step's transition chains seamlessly into the next. Cherry Pop
//     uses this for --ko-progress.
//   • color-mix(in oklab, paleColor, deepColor calc(var(--x) * 100%)) to
//     interpolate a color driven by a 0→1 CSS var. Cherry Pop uses this
//     on the cherry fills, driven by --ko-ripe.
//
// ----------------------------------------------------------------------------
// GOTCHAS (see SKILL.md "Technical gotchas" for the full set):
//
//   • Use __karaokePolicy.createHTML() for all innerHTML writes (CSP)
//   • Use <link rel="stylesheet"> for fonts, NOT @import (CSP)
//   • CSS vars declared only on #karaoke-root don't cascade to #ko-lyrics
//     (it's a body sibling, not a descendant) — declare on BOTH selectors
//   • preserveAspectRatio="none" on an SVG stretches everything inside,
//     including ellipses/circles/rects — keep shapes that must stay
//     undistorted in SEPARATE SVG elements with a normal preserveAspectRatio,
//     or as CSS-positioned sibling elements.
//
// ----------------------------------------------------------------------------
// CHERRY POP DESIGN — the example you're looking at.
//
// Aesthetic: the MV is a pink-gingham scrapbook of Miku stickers with chunky
// dark-teal burned-in kana punching across the backdrop (迷子 / ちね / すきすき? /
// ベイビー / 愛していい感). Red-gingham bow, cherry earrings, mint stem hairband,
// chibi speech bubbles. The overlay is a washi-taped card torn from that same
// scrapbook page — same gingham, same teal, same chunky sans, same cherry.
//
// Signature: a cherry-stem progress bar arches above the card top edge.
// Two cherries on a Y-stem ride left→right along the main branch as the
// song plays and ripen via color-mix — pale cream-pink at 0% through deep
// cherry-red at 100%. Functional (encodes time) AND thematic (the song's
// literal metaphor: "cherry pop" = first love, ripening). The stem extends
// under the washi tapes at each end so it doesn't terminate in mid-air.
//
// Line changes are deliberately motionless. The card is quietly alive
// through the cherry's travel and the empty-state collapse — nothing else.
// See SKILL.md on line-change effects if your MV wants one.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — 洗脳 / VESPERBELL cover
  // ==========================================================================
  const THEME = {
    trackTag:   '洗脳',
    artistTag:  'VESPERBELL ヨミ × 龍ヶ崎リン',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Dela+Gothic+One&' +
      'family=Noto+Sans+JP:wght@500;700;900&' +
      'family=Oswald:wght@500;600;700&' +
      'display=swap',
    fontJP:       '"Noto Sans JP", "Dela Gothic One", sans-serif',
    fontJPHeavy:  '"Dela Gothic One", "Noto Sans JP", sans-serif',
    fontEN:       '"Oswald", system-ui, sans-serif',
    fontGloss:    '"Noto Sans JP", system-ui, sans-serif',

    bgPinkLight:  '#11141B',
    hatchPink:    'rgba(255,255,255,0.055)',
    teal:         '#F3EADB',
    tealDeep:     '#080A0F',
    tealInk:      '#AEB8C5',
    cream:        '#F3EADB',
    cherry:       '#F00642',
    cherryDeep:   '#650018',
    cherryPale:   '#E8DCC6',
    leafGreen:    '#2448FF',

    lyricFontSizeJP:      '44px',
    lyricLineHeightJP:    '2.02',
    lyricLetterSpacingJP: '0',
    lyricFontSizeEN:      '24px',
    lyricLineHeightEN:    '1.15',
    lyricLetterSpacingEN: '0',
    glossFontSize:        '13px',
    glossFontWeight:      '700',

    cardRadius:  '6px',
    cardPadding: '28px 42px 26px',
    cardTilt:    '0deg',

    chunkColors: [
      '#FF174F',
      '#3152FF',
      '#F3EADB',
      '#C3A35B',
      '#8B5CFF',
      '#55D6FF',
    ],
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

  // Position — Cherry Pop sits slightly lower (0.72) to leave space for the
  // cherry stem progress bar above the card.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.74, widthFrac: 0.72 },
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
    /* ==== LOCKED PLUMBING ===================================================*/
    #karaoke-root {
      position: fixed; inset: 0;
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
    /* CSS vars declared on BOTH #karaoke-root AND #ko-lyrics — #ko-lyrics
       is a body sibling of #karaoke-root, not a descendant, so vars on
       #karaoke-root alone wouldn't cascade to it. */
    #karaoke-root, #ko-lyrics {
      --ko-teal:       ${THEME.teal};
      --ko-teal-deep:  ${THEME.tealDeep};
      --ko-teal-ink:   ${THEME.tealInk};
      --ko-cream:      ${THEME.cream};
      --ko-cherry:     ${THEME.cherry};
      --ko-cherry-deep:${THEME.cherryDeep};
      --ko-leaf:       ${THEME.leafGreen};
      --ko-pink-lt:    ${THEME.bgPinkLight};
      --ko-hatch:      ${THEME.hatchPink};

      --ko-font-jp:    ${THEME.fontJP};
      --ko-font-jp-hv: ${THEME.fontJPHeavy};
      --ko-font-en:    ${THEME.fontEN};
      --ko-font-gloss: ${THEME.fontGloss};

      /* Runtime vars written by the main tick ~7×/sec. CSS uses them
         inside calc() and color-mix() to drive the cherry's position
         and ripening without per-frame JS DOM writes. */
      --ko-ripe:     0;  /* 0.0 (unripe/pale) → 1.0 (ripe/deep)     */
      --ko-progress: 0;  /* 0.0 → 1.0 horizontal fraction of stem   */
      --ko-stem-w: 0px;  /* stem pixel width — written on resize    */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== 洗脳 — CONCRETE / BRUSH / GLITCH ============================= */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: ${THEME.cardPadding};
      min-height: 154px;
      border-radius: ${THEME.cardRadius};
      border: 1px solid rgba(243, 234, 219, 0.38);
      background:
        linear-gradient(90deg, rgba(240, 6, 66, 0.16), transparent 18%, transparent 82%, rgba(36, 72, 255, 0.18)),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 5px),
        repeating-linear-gradient(115deg, transparent 0, transparent 12px, var(--ko-hatch) 12px, var(--ko-hatch) 14px),
        radial-gradient(circle at 15% 0%, rgba(240, 6, 66, 0.24), transparent 36%),
        radial-gradient(circle at 88% 18%, rgba(36, 72, 255, 0.28), transparent 34%),
        var(--ko-pink-lt);
      box-shadow:
        -8px 0 0 rgba(240, 6, 66, 0.76),
        8px 0 0 rgba(36, 72, 255, 0.72),
        0 22px 42px -18px rgba(0, 0, 0, 0.9),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08),
        inset 0 -34px 64px rgba(0, 0, 0, 0.32);
      transform: rotate(${THEME.cardTilt});
      transition: opacity 260ms ease, transform 260ms ease;
      isolation: isolate;
      overflow: visible;
    }

    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: translateY(8px) scale(0.985);
    }

    #ko-lyrics .ko-slot::before,
    #ko-lyrics .ko-slot::after {
      position: absolute;
      z-index: 0;
      font-family: var(--ko-font-jp-hv);
      font-weight: 900;
      font-size: 104px;
      line-height: 1;
      color: var(--ko-cherry);
      opacity: 0.34;
      filter: drop-shadow(4px 0 0 rgba(36, 72, 255, 0.40));
      pointer-events: none;
    }
    #ko-lyrics .ko-slot::before {
      content: '洗';
      left: -34px;
      top: -28px;
      transform: rotate(-8deg) skewX(-5deg);
    }
    #ko-lyrics .ko-slot::after {
      content: '脳';
      right: -34px;
      bottom: -22px;
      transform: rotate(7deg) skewX(4deg);
    }

    #ko-lyrics .ko-scanline {
      position: absolute;
      left: 16px;
      right: 16px;
      top: 13px;
      height: 6px;
      z-index: 1;
      background: rgba(243, 234, 219, 0.14);
      overflow: hidden;
      box-shadow: 0 0 0 1px rgba(243, 234, 219, 0.12);
    }
    #ko-lyrics .ko-scanline::before {
      content: '';
      position: absolute;
      inset: 0;
      transform: scaleX(var(--ko-progress));
      transform-origin: left center;
      background: linear-gradient(90deg, var(--ko-cherry), #FF6B8D 48%, var(--ko-leaf));
      transition: transform 160ms linear;
      box-shadow: 0 0 18px rgba(240, 6, 66, 0.75);
    }
    #ko-lyrics .ko-scanline::after {
      content: '';
      position: absolute;
      top: -3px;
      left: calc(var(--ko-progress) * 100%);
      width: 18px;
      height: 12px;
      transform: translateX(-50%);
      background: var(--ko-leaf);
      box-shadow: -10px 0 0 rgba(240, 6, 66, 0.80), 0 0 16px rgba(36, 72, 255, 0.9);
      transition: left 160ms linear;
    }

    #ko-lyrics .ko-tag {
      position: absolute;
      top: -28px;
      left: 22px;
      z-index: 3;
      font-family: var(--ko-font-jp-hv);
      font-size: 30px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 0;
      color: var(--ko-cherry);
      text-shadow: 3px 0 0 var(--ko-leaf), 0 3px 18px rgba(240, 6, 66, 0.55);
      transform: rotate(-4deg);
      white-space: nowrap;
    }
    #ko-lyrics .ko-credit {
      position: absolute;
      right: 20px;
      bottom: -15px;
      z-index: 3;
      padding: 4px 9px 5px;
      font-family: var(--ko-font-en);
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ko-cream);
      background: var(--ko-leaf);
      box-shadow: -5px 4px 0 rgba(240, 6, 66, 0.88);
      white-space: nowrap;
    }

    #ko-lyrics .ko-line-jp,
    #ko-lyrics .ko-line-en {
      position: relative;
      z-index: 2;
      max-width: 100%;
      overflow-wrap: anywhere;
      text-wrap: balance;
    }
    #ko-lyrics .ko-line-jp {
      order: 1;
      min-height: 1em;
      padding-top: 0.72em;
      font-family: var(--ko-font-jp);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      font-weight: 900;
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      color: var(--ko-cream);
      text-shadow: 2px 0 0 var(--ko-cherry-deep), -2px 0 0 rgba(36, 72, 255, 0.85), 0 0 16px rgba(0,0,0,0.72);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      line-height: 1.05;
      letter-spacing: 0;
      color: var(--ko-teal-ink);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.96;
      text-shadow: 0 1px 3px rgba(0,0,0,0.95);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      order: 2;
      min-height: 1em;
      padding: 4px 10px 0;
      font-family: var(--ko-font-en);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      font-weight: 700;
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      color: var(--ko-cream);
      text-transform: uppercase;
      text-shadow: 0 0 14px rgba(0, 0, 0, 0.9);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.92);
      font-weight: 600;
    }
    #ko-lyrics .ko-line-en:not(:empty) {
      background: linear-gradient(90deg, transparent, rgba(8,10,15,0.72) 18%, rgba(8,10,15,0.72) 82%, transparent);
    }


  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // --- DOM construction: concrete slab, red brush title, blue glitch meter ---
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-scanline" id="ko-scanline"></div>
      <div class="ko-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
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
  let lastProgWriteAt = 0;  // ms timestamp of last --ko-progress/--ko-ripe write

  // --- Position tick: re-anchor the lyric zone to the video rect ---
  // Also writes --ko-stem-w in pixels so the cherry's transform math knows
  // how far to travel. Updated only when video rect changes.
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
      const cardW = r.width * p.widthFrac;
      lyrics.style.left     = (r.left + r.width * p.anchorX) + 'px';
      lyrics.style.top      = (r.top  + r.height * p.anchorY) + 'px';
      lyrics.style.width    = cardW + 'px';
      lyrics.style.maxWidth = cardW + 'px';
      // Resize snap: --ko-stem-w feeds into the cherry's transform calc,
      // and the cherry has `transition: transform 160ms` for smooth song
      // progress. Without suppression, a video resize would animate the
      // cherry to its new proportional position — visible "slide". We
      // kill the transition, update the var, force reflow, restore.
      const cherry = document.getElementById('ko-cherry');
      if (cherry) cherry.style.transition = 'none';
      // .ko-stem extends -8px past each card edge (under the washi tapes),
      // so its width = cardW + 16.
      lyrics.style.setProperty('--ko-stem-w', (cardW + 16) + 'px');
      if (cherry) {
        void cherry.offsetWidth;  // force reflow to flush the transition off
        cherry.style.transition = '';
      }
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + cherry progress ---
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
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    // ---- Cherry progress update (rate-limited) ----
    // Write at most every PROG_WRITE_MS. The CSS matches that cadence with
    // `transition: transform 160ms linear` on .ko-cherry, so each write's
    // transition chains seamlessly into the next one — visually continuous
    // motion with only ~7 writes/sec. Running this at RAF rate is wasteful
    // (the cherry moves ~5 px/sec; per-frame precision is invisible).
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        // Ripening ramp: pale for the first ~12% (intro), fully ripe by
        // ~92% (gives the cherry a moment to sit at full-red at the end).
        const ripe = Math.max(0, Math.min(1, (progFrac - 0.12) / 0.80));
        lyrics.style.setProperty('--ko-progress', progFrac.toFixed(4));
        lyrics.style.setProperty('--ko-ripe',     ripe.toFixed(4));
      }
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

  // --- Color + gloss colorizer (polling) ---
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
      // Empty/missing gloss renders a non-breaking space so the rt row
      // keeps its line height — an empty <rt> can collapse to zero on
      // some browsers and make the JP baseline jump between rubied and
      // un-rubied chunks on the same line. The agent emits "" as the
      // sentinel for "no label needed" (English-in-JP tokens, pure
      // punctuation, parenthetical refrain tags).
      const glossHTML = g ? escHTML(g) : '\u00a0';
      return `<span data-wc="${ci}" style="color:${col}"><ruby>${escHTML(text)}<rt style="color:${col}">${glossHTML}</rt></ruby></span>`;
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
