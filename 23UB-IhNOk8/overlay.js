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
  // MV vocabulary: halftone CMYK print texture, chromatic aberration, caution-
  // tape diagonal stripes, burning paper with ember particles, crystalline
  // shatters with cold cyan accents. The title literally describes the piece
  // coming apart. Overlay echoes: a scorched paper card for the lyrics with
  // halftone dots + torn burning edge, a top hazard-tape banner, thin vertical
  // "UNRAVELLING" rails on the margins (sibling to the MV's own persistent UI),
  // drifting embers rising from the card, and a signature RGB-split glitch on
  // every new line — text "tuning in" from static.
  const THEME = {
    fontsHref:   'https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Special+Elite&family=Archivo+Black&display=swap',
    fontDisplay: '"Archivo Black", "Oswald", system-ui, sans-serif',
    fontBody:    '"Special Elite", "Courier New", monospace',
    fontJP:      'system-ui, sans-serif',

    paper:     '#ecd9b0',
    paperDeep: '#c9a56c',
    ember:     '#ff5d1f',
    emberHot:  '#ff9a3f',
    hazard:    '#f2a81a',
    blood:     '#d62828',
    cyan:      '#6fd6d9',
    ink:       '#241610',
    inkSoft:   '#5a3a2a',
    black:     '#0a0708',

    lyricColorEN:  '#1a0f0a',
    lyricColorJP:  '#1a0f0a',
    lyricStrokeEN: '0px transparent',
    lyricStrokeJP: '0px transparent',
    lyricShadowEN: '0 1px 0 rgba(255,240,210,0.7), 0 0 10px rgba(255,120,40,0.18)',
    lyricShadowJP: '0 1px 0 rgba(255,240,210,0.7), 0 0 10px rgba(255,120,40,0.18)',
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
    // PLACEHOLDER — override with 6 MV-derived colors. Gray on purpose so
    // forgetting to override is obvious. See SKILL.md "Chunk colors are
    // part of the design".
    colors: ['#888888','#888888','#888888','#888888','#888888','#888888'],
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
  if (THEME.fontsHref && !document.querySelector('link[data-karaoke-font]')) {
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

    /* Theme vars shared between #karaoke-root and #ko-lyrics — #ko-lyrics is a
       body sibling (not descendant), so vars defined only on #karaoke-root
       wouldn't cascade to .ko-line-*. Past bug: lyric fonts silently fell back
       to YouTube's Roboto while color-literal interpolations still worked. */
    #karaoke-root, #ko-lyrics {
      --ko-paper:      ${THEME.paper};
      --ko-paper-deep: ${THEME.paperDeep};
      --ko-ember:      ${THEME.ember};
      --ko-ember-hot:  ${THEME.emberHot};
      --ko-hazard:     ${THEME.hazard};
      --ko-blood:      ${THEME.blood};
      --ko-cyan:       ${THEME.cyan};
      --ko-ink:        ${THEME.ink};
      --ko-ink-soft:   ${THEME.inkSoft};
      --ko-black:      ${THEME.black};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* #karaoke-root is an empty canvas sized to the viewport. Builder fills
       it with whatever composition the MV calls for; CSS vars above are
       available to any HTML added inside. */

    /* ===== ROOT-WIDE ENVIRONMENT (hazard banner, rails, halftone veil) ===== */
    #karaoke-root {
      font-family: var(--ko-font-body);
    }

    /* Full-viewport halftone veil over the whole composition — extremely
       subtle, mirrors the MV's signature CMYK print-degradation look. */
    .uk-halftone {
      position: fixed; inset: 0;
      pointer-events: none;
      background-image: radial-gradient(circle, rgba(255,145,60,0.08) 0.8px, transparent 1.4px);
      background-size: 5px 5px;
      mix-blend-mode: screen;
      opacity: 0.55;
      z-index: 1;
    }

    /* Top hazard-tape banner — black/orange diagonal stripes echoing the
       "CAUTION" bands that frame every chorus in the MV. */
    .uk-hazard {
      position: fixed; top: 0; left: 0; right: 0;
      height: 44px;
      z-index: 2;
      display: flex;
      align-items: center;
      background: var(--ko-black);
      border-bottom: 1px solid rgba(242,168,26,0.5);
      box-shadow: 0 2px 12px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .uk-hazard::before {
      content: '';
      position: absolute; inset: 0;
      background: repeating-linear-gradient(
        -55deg,
        var(--ko-hazard) 0 18px,
        var(--ko-black)  18px 36px
      );
      opacity: 0.85;
    }
    .uk-hazard::after {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(90deg,
        rgba(10,7,8,0.9) 0%,
        rgba(10,7,8,0.45) 20%,
        rgba(10,7,8,0.45) 80%,
        rgba(10,7,8,0.9) 100%);
    }
    .uk-hazard-text {
      position: relative;
      z-index: 1;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 22px;
      font-family: var(--ko-font-display);
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 0.32em;
      color: var(--ko-paper);
      text-shadow: 0 1px 0 rgba(0,0,0,0.9), 0 0 8px rgba(255,120,40,0.4);
      text-transform: uppercase;
    }
    .uk-hazard-text .uk-dot {
      color: var(--ko-ember);
      font-size: 10px;
      letter-spacing: normal;
      opacity: 0.9;
    }
    .uk-hazard-text .uk-title {
      color: var(--ko-hazard);
      font-size: 17px;
      letter-spacing: 0.38em;
    }

    /* Vertical rails on each side — mirror the MV's persistent margin UI
       (thin line, ♪ note, tick dots, rotated "UNRAVELLING" text). */
    .uk-rail {
      position: fixed;
      top: 60px; bottom: 40px;
      width: 40px;
      z-index: 2;
      color: var(--ko-paper);
      font-family: var(--ko-font-display);
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .uk-rail-l { left: 10px; }
    .uk-rail-r { right: 10px; }
    .uk-rail .uk-rail-line {
      width: 1px;
      flex: 1;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(236,217,176,0.55) 8%,
        rgba(236,217,176,0.55) 92%,
        transparent 100%);
    }
    .uk-rail .uk-rail-note {
      font-size: 14px;
      color: var(--ko-paper);
      opacity: 0.75;
      margin: 6px 0;
      text-shadow: 0 0 6px rgba(0,0,0,0.8);
    }
    .uk-rail .uk-rail-ticks {
      display: flex; flex-direction: column; gap: 8px;
      font-size: 6px;
      line-height: 1;
      color: rgba(236,217,176,0.55);
      margin-bottom: 10px;
    }
    .uk-rail .uk-rail-text {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 9px;
      letter-spacing: 0.55em;
      font-weight: 900;
      color: rgba(236,217,176,0.72);
      margin-top: 14px;
      text-shadow: 0 0 6px rgba(0,0,0,0.8);
    }
    .uk-rail-r .uk-rail-text { transform: rotate(0deg); }

    /* ==== LYRIC DISPLAY ====
       Scorched-paper card: aged cream face, halftone dot texture, torn-burning
       bottom edge with an ember glow ring. Text is dark burnt ink. On every
       new line the text runs a brief RGB-split glitch — "tuning in" from
       static — which is the overlay's signature gesture. */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
      padding: 36px 48px 48px 48px;
      color: var(--ko-ink);
      font-family: var(--ko-font-display);
      isolation: isolate;
      filter: drop-shadow(0 22px 40px rgba(0,0,0,0.55))
              drop-shadow(0 0 48px rgba(255,93,31,0.35));
    }
    /* Paper card face */
    #ko-lyrics::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -2;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(255,255,230,0.18), transparent 60%),
        radial-gradient(ellipse at 50% 120%, rgba(255,93,31,0.55), transparent 65%),
        linear-gradient(180deg, var(--ko-paper) 0%, var(--ko-paper) 55%, var(--ko-paper-deep) 88%, #6a3418 100%);
      /* Halftone dot texture printed onto the paper */
      background-blend-mode: normal;
      box-shadow:
        inset 0 0 0 1px rgba(36,22,16,0.4),
        inset 0 2px 0 rgba(255,255,220,0.35),
        inset 0 -30px 50px rgba(120,40,10,0.45);
      /* Torn top + burning bottom */
      clip-path: polygon(
        0% 6%,   3% 4%,   7% 7%,  11% 3%, 15% 6%, 20% 4%, 25% 7%, 30% 3%,
        35% 5%, 40% 2%, 46% 6%, 52% 3%, 58% 6%, 63% 3%, 68% 6%, 73% 4%,
        78% 7%, 83% 3%, 88% 6%, 93% 4%, 97% 7%, 100% 5%,
        100% 88%, 98% 92%, 95% 88%, 92% 94%, 88% 89%, 84% 93%, 80% 87%,
        76% 95%, 72% 88%, 68% 94%, 64% 90%, 60% 96%, 56% 91%, 52% 94%,
        48% 90%, 44% 95%, 40% 92%, 36% 95%, 32% 89%, 28% 94%, 24% 91%,
        20% 95%, 16% 90%, 12% 94%, 8% 89%, 4% 93%, 0% 90%
      );
    }
    /* Halftone dot overlay over the paper face */
    #ko-lyrics::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      background-image:
        radial-gradient(circle, rgba(36,22,16,0.22) 0.9px, transparent 1.5px);
      background-size: 6px 6px;
      mix-blend-mode: multiply;
      opacity: 0.9;
      clip-path: polygon(
        0% 6%,   3% 4%,   7% 7%,  11% 3%, 15% 6%, 20% 4%, 25% 7%, 30% 3%,
        35% 5%, 40% 2%, 46% 6%, 52% 3%, 58% 6%, 63% 3%, 68% 6%, 73% 4%,
        78% 7%, 83% 3%, 88% 6%, 93% 4%, 97% 7%, 100% 5%,
        100% 88%, 98% 92%, 95% 88%, 92% 94%, 88% 89%, 84% 93%, 80% 87%,
        76% 95%, 72% 88%, 68% 94%, 64% 90%, 60% 96%, 56% 91%, 52% 94%,
        48% 90%, 44% 95%, 40% 92%, 36% 95%, 32% 89%, 28% 94%, 24% 91%,
        20% 95%, 16% 90%, 12% 94%, 8% 89%, 4% 93%, 0% 90%
      );
    }
    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      position: relative;
    }
    /* Card header: "TRACK 01 — UNRAVELLING" evidence-tag strip */
    .uk-card-tag {
      font-family: var(--ko-font-display);
      font-weight: 900;
      font-size: 10px;
      letter-spacing: 0.5em;
      color: var(--ko-ember);
      text-shadow: 0 1px 0 rgba(255,255,220,0.4);
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 2px;
      opacity: 0.9;
    }
    .uk-card-tag::before,
    .uk-card-tag::after {
      content: '';
      display: inline-block;
      width: 28px; height: 1px;
      background: linear-gradient(90deg, transparent, var(--ko-ink), transparent);
      opacity: 0.6;
    }
    .uk-card-sub {
      font-family: var(--ko-font-body);
      font-size: 11px;
      letter-spacing: 0.18em;
      color: var(--ko-ink-soft);
      opacity: 0.75;
      margin-top: -4px;
      text-transform: uppercase;
    }

    /* Embers rising from the burning bottom edge of the card */
    .uk-embers {
      position: absolute;
      left: 0; right: 0;
      bottom: -14px;
      height: 120px;
      pointer-events: none;
      z-index: 1;
    }
    .uk-ember {
      position: absolute;
      bottom: 0;
      width: 3px; height: 3px;
      border-radius: 50%;
      background: var(--ko-ember-hot);
      box-shadow: 0 0 6px var(--ko-ember), 0 0 12px var(--ko-ember-hot);
      opacity: 0;
      animation: uk-ember-rise var(--dur, 3s) linear var(--del, 0s) infinite;
      left: var(--left, 50%);
    }
    @keyframes uk-ember-rise {
      0%   { opacity: 0; transform: translate(0, 0) scale(0.6); }
      15%  { opacity: 1; }
      60%  { opacity: 0.8; }
      100% { opacity: 0; transform: translate(calc(var(--dx, 0) * 40px), -110px) scale(0.2); }
    }

    /* ---- Lyric lines (this MV is English-only; .en-song path is the one
            that renders. .ko-line-jp kept styled for plumbing completeness) */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      font-size: 42px;
      line-height: 2.4;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      color: ${THEME.lyricColorJP};
      text-shadow: 0 1px 0 rgba(255,240,210,0.7);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 900;
      color: ${THEME.lyricColorEN};
      font-size: 40px;
      line-height: 1.25;
      letter-spacing: 0.045em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      position: relative;
      text-transform: uppercase;
      padding: 2px 4px;
    }
    /* English-cover sizing tuned larger than the skeleton default — the card
       is the composition's centerpiece, text should own it. */
    #ko-lyrics .ko-line-en.en-song {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 0.06em;
    }

    /* Signature: RGB-split glitch on every line change. Pseudo-elements
       duplicate the text in red + cyan, offset, and fade in over 550ms. */
    #ko-lyrics .ko-line-en::before,
    #ko-lyrics .ko-line-en::after {
      content: attr(data-text);
      position: absolute;
      inset: 2px 4px;
      pointer-events: none;
      font: inherit;
      letter-spacing: inherit;
      text-transform: inherit;
      text-align: center;
      opacity: 0;
      mix-blend-mode: multiply;
      text-shadow: none;
      -webkit-text-stroke: 0;
    }
    #ko-lyrics .ko-line-en::before {
      color: var(--ko-blood);
    }
    #ko-lyrics .ko-line-en::after {
      color: var(--ko-cyan);
    }
    #ko-lyrics .ko-line-en.uk-glitch-in::before {
      animation: uk-glitch-r 0.55s cubic-bezier(.2,.75,.25,1) forwards;
    }
    #ko-lyrics .ko-line-en.uk-glitch-in::after {
      animation: uk-glitch-c 0.55s cubic-bezier(.2,.75,.25,1) forwards;
    }
    @keyframes uk-glitch-r {
      0%   { opacity: 0.95; transform: translate(-8px, -2px); }
      30%  { opacity: 0.85; transform: translate(-5px, -1px); }
      70%  { opacity: 0.4;  transform: translate(-2px,  0); }
      100% { opacity: 0;    transform: translate(0, 0); }
    }
    @keyframes uk-glitch-c {
      0%   { opacity: 0.95; transform: translate(8px, 2px); }
      30%  { opacity: 0.85; transform: translate(5px, 1px); }
      70%  { opacity: 0.4;  transform: translate(2px, 0); }
      100% { opacity: 0;    transform: translate(0, 0); }
    }

    /* Subtle card-settle animation on line change — paper "breathes" as new
       text arrives, echoing the embers flaring. */
    #ko-lyrics.uk-pulse::before {
      animation: uk-pulse 0.8s ease-out;
    }
    @keyframes uk-pulse {
      0%   { filter: brightness(1.08) saturate(1.15); }
      100% { filter: brightness(1)    saturate(1); }
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

  // ---- Environment decor inside #karaoke-root (banner, rails, halftone) ----
  setHTML(root, `
    <div class="uk-halftone"></div>
    <div class="uk-hazard">
      <div class="uk-hazard-text">
        <span>MUSE</span><span class="uk-dot">✕</span>
        <span class="uk-title">UNRAVELLING</span>
        <span class="uk-dot">✕</span><span>COVER BY JELLY HOSHIUMI</span>
      </div>
    </div>
    <div class="uk-rail uk-rail-l">
      <div class="uk-rail-note">♪</div>
      <div class="uk-rail-line"></div>
      <div class="uk-rail-ticks"><span>○</span><span>●</span><span>○</span></div>
      <div class="uk-rail-text">UNRAVELLING</div>
    </div>
    <div class="uk-rail uk-rail-r">
      <div class="uk-rail-note">♫</div>
      <div class="uk-rail-line"></div>
      <div class="uk-rail-ticks"><span>○</span><span>●</span><span>○</span></div>
      <div class="uk-rail-text">TRACK 01</div>
    </div>
  `);

  // Lyric card. Skeleton's slot + an evidence-tag header, a subtitle strip
  // with the current phase-connect cover credit, and the ember particle field
  // below the card's burning bottom edge.
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  const emberTemplate = (() => {
    let html = '';
    for (let i = 0; i < 18; i++) {
      const left = Math.round(Math.random() * 100);
      const dx   = (Math.random() * 2 - 1).toFixed(2);
      const dur  = (2.4 + Math.random() * 2.6).toFixed(2);
      const del  = (Math.random() * 4).toFixed(2);
      const size = (2 + Math.random() * 2).toFixed(1);
      html += `<span class="uk-ember" style="--left:${left}%;--dx:${dx};--dur:${dur}s;--del:${del}s;width:${size}px;height:${size}px;"></span>`;
    }
    return html;
  })();
  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="uk-card-tag">TRACK 01 — UNRAVELLING</div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="uk-card-sub">muse · cover by jelly hoshiumi</div>
    </div>
    <div class="uk-embers">${emberTemplate}</div>
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

  // --- Signature glitch: RGB-split tune-in on every new lyric line ---
  // Polling (not MutationObserver) — the skeleton's tick writes textContent
  // frequently, observer would thrash. We sync `data-text` with the pseudo-
  // element `content: attr(data-text)` readers, and retrigger the animation
  // via class-toggle + reflow.
  let _lastGlitchEn = '';
  let _lastGlitchJp = '';
  const GLITCH_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(GLITCH_POLL); return; }
    const enEl = document.getElementById('ko-line-en');
    const jpEl = document.getElementById('ko-line-jp');
    const lyricsRoot = document.getElementById('ko-lyrics');
    if (!enEl) return;

    const enText = enEl.textContent || '';
    if (enText !== _lastGlitchEn) {
      _lastGlitchEn = enText;
      enEl.setAttribute('data-text', enText);
      enEl.classList.remove('uk-glitch-in');
      // force reflow so removing + re-adding the class restarts the animation
      void enEl.offsetWidth;
      if (enText.trim()) enEl.classList.add('uk-glitch-in');

      if (lyricsRoot && enText.trim()) {
        lyricsRoot.classList.remove('uk-pulse');
        void lyricsRoot.offsetWidth;
        lyricsRoot.classList.add('uk-pulse');
      }
    }

    // Keep JP in sync too for the (unused here but plumbing-complete) path
    const jpText = jpEl ? jpEl.textContent || '' : '';
    if (jpText !== _lastGlitchJp) {
      _lastGlitchJp = jpText;
      if (jpEl) jpEl.setAttribute('data-text', jpText);
    }
  }, 80);

})();
