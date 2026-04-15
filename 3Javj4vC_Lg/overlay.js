// ============================================================================
// KARAOKE OVERLAY — SKELETON (SINGLE-SONG FLAVOR)
// ----------------------------------------------------------------------------
// Dedicated skeleton for single-song MV overlays. The sibling `skeleton.js`
// handles multi-song karaoke streams. Both share identical locked plumbing
// (Trusted Types, __koGen closure bail, tick+RAF, COLOR_POLL, translation
// merge); this one ships ZERO chrome by default — just the lyric card floating
// at 66% down the video. Everything else is the builder's canvas.
//
//   DROPPED vs skeleton.js:
//     • Setlist panel + collapse tab + row renderer + row click seek
//     • Plain-lyrics side panel + collapse tab + auto-show/hide logic
//     • Now-playing card (song title / artist / progress bar / times)
//     • Ctrl buttons (Offset reset, Hide lyrics, Skip talking)
//     • All collapse-tab state (__karaokeCollapsed, __karaokePlainCollapsed,
//       __karaokeSkipEnabled)
//
//   KEPT (same as stream skeleton, same names, same semantics):
//     • Trusted Types policy, __koGen + MY_GEN generation bail
//     • __setlist, __parsedLyrics, __transCache, __plainLyrics, __lyricOffsets,
//       __wordAlign, __karaokeLyricsHidden, __karaokeRebuild, __mergeTranslations
//     • Dual RAF + setInterval(tick, 30) loop
//     • positionTick posKey cache (anti-jank)
//     • curLineIdx = -1 reset on song-change (harmless for single-song but kept
//       so the skeleton stays parallel)
//     • Per-write cache guards before every DOM write
//     • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//     • #ko-lyrics sibling-of-root selector dual-define
//     • Offset hotkeys `[` `]` `\` + postMessage broadcast for extension persistence
//     • COLOR_POLL 150ms colorizer (NOT MutationObserver — feedback loop)
//     • Element IDs the tick writes to — #ko-line-jp, #ko-line-en ONLY.
//       No #ko-now-* IDs exist in this skeleton.
//     • Three lyric data layers: jp coarse chunks, gloss morphemes, en natural
//
// LOCKED — do not rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; CSP requires it)
//   • window.__koGen + MY_GEN closure capture
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
//
// FREE — heavily modify per-song:
//
//   THEME, CSS rules, @keyframes, pseudo-elements, HTML structure added to
//   #karaoke-root, decorative wrappers around .ko-slot, animations, composition,
//   layout. The only hard DOM contract: `#ko-line-jp` and `#ko-line-en` must
//   exist inside `#ko-lyrics > .ko-slot`. Everything else is your canvas.
//
//   SINGLE-SONG DESIGN PRESSURE: this skeleton ships NO panel, NO now-playing
//   card, NO ctrl buttons. The whole stream-identity surface is yours to design
//   from scratch — a poster header, a corner stamp, a full-bleed title card,
//   nothing at all, whatever the MV calls for. The lyric card itself must carry
//   a bespoke per-line animation or transformation. A single-song overlay
//   without a signature visual feature is a failure. See SKILL.md "Signature-
//   feature gallery" for proven patterns as jumping-off points — they're not
//   templates. Invent one.
//
//   Offset hotkeys `[` `]` `\` still work via the document-level listener.
//   `window.__karaokeLyricsHidden = true` still hides lyrics. You don't need
//   buttons for these — but if your design warrants them, build them yourself.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — lyric rendering only. No panel, no now-card, no ctrls exist by
  // default in this skeleton; the overlay builder adds whatever chrome the MV
  // calls for (poster header, corner stamp, full-bleed title, nothing at all).
  //
  // Fonts + palette are available as CSS custom properties on #karaoke-root +
  // #ko-lyrics so any HTML the builder inserts can consume them consistently
  // with the lyric card.
  // ==========================================================================
  // MV aesthetic: celestial observatory / meteor-tracking HUD. Navy starfield
  // base, electric cyan glow, magenta character accent, white starlight, amber
  // meteor trails. Framed by HUD brackets, barcode ticks, crescent-dot icons,
  // thin radial ray scaffolding — lifted directly from the MV's frame design.
  const THEME = {
    fontsHref: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=JetBrains+Mono:wght@300;400;600&family=Inter:wght@300;400;500;700&family=Shippori+Mincho+B1:wght@500;700;800;900&family=Klee+One:wght@400;600&display=swap',
    fontDisplay: '"Cinzel", serif',
    fontMono:    '"JetBrains Mono", monospace',
    fontBody:    '"Inter", sans-serif',
    fontJP:      '"Shippori Mincho B1", serif',
    fontJPScript:'"Klee One", serif',

    // Celestial-observatory palette
    nightDeep:   '#030915',
    night:       '#0a1a35',
    cyanCore:    '#3EDCFF',
    cyanSoft:    'rgba(62, 220, 255, 0.8)',
    cyanDim:     'rgba(62, 220, 255, 0.18)',
    magenta:     '#FF5F9C',
    magentaDim:  'rgba(255, 95, 156, 0.5)',
    amber:       '#FFD66B',
    starlight:   '#F5FBFF',
    hudLine:     'rgba(200, 232, 255, 0.35)',
    hudLineSoft: 'rgba(200, 232, 255, 0.14)',

    lyricColorJP:  '#F5FBFF',
    lyricColorEN:  '#F5FBFF',
    lyricStrokeJP: '4px #030915',
    lyricStrokeEN: '4px #030915',
    lyricShadowJP: '0 0 12px rgba(62, 220, 255, 0.55), 0 0 32px rgba(3, 14, 40, 0.9), 0 2px 2px rgba(3, 14, 40, 1)',
    lyricShadowEN: '0 0 10px rgba(62, 220, 255, 0.45), 0 0 26px rgba(3, 14, 40, 0.9), 0 2px 2px rgba(3, 14, 40, 1)',
  };

  // --- Trusted Types policy (YouTube CSP requires this for innerHTML) ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  // --- State preservation (survives re-injection) ---
  // __plainLyrics retained for schema parity with stream flavor even though
  // this skeleton doesn't render a plain panel. If a single-song build ships
  // plain_lyrics.json, the extension will populate the object; future
  // overlay.js edits can opt to render it inline.
  window.__setlist         = window.__setlist         || [];
  window.__parsedLyrics    = window.__parsedLyrics    || {};
  window.__transCache      = window.__transCache      || {};
  window.__plainLyrics     = window.__plainLyrics     || {};
  window.__lyricOffsets    = window.__lyricOffsets    || {};
  // Celestial meteor-track palette: magenta (Malice hair), cyan (HUD/rings),
  // amber (meteor trail), aqua (cosmic secondary), lavender (violet atmosphere),
  // coral (warm starlight). Tuned for visibility against the MV's navy base.
  window.__wordAlign = window.__wordAlign || {
    colors: ['#FF5F9C','#3EDCFF','#FFD66B','#6EF0D1','#B79BFF','#FF9877'],
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

    @property --meteor-x { syntax: '<percentage>'; initial-value: -30%; inherits: false; }
    @property --pulse-r  { syntax: '<length>';     initial-value: 0px;  inherits: false; }

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    #karaoke-root, #ko-lyrics {
      --ko-night-deep:  ${THEME.nightDeep};
      --ko-night:       ${THEME.night};
      --ko-cyan:        ${THEME.cyanCore};
      --ko-cyan-soft:   ${THEME.cyanSoft};
      --ko-cyan-dim:    ${THEME.cyanDim};
      --ko-magenta:     ${THEME.magenta};
      --ko-magenta-dim: ${THEME.magentaDim};
      --ko-amber:       ${THEME.amber};
      --ko-starlight:   ${THEME.starlight};
      --ko-hud-line:    ${THEME.hudLine};
      --ko-hud-soft:    ${THEME.hudLineSoft};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-mono:    ${THEME.fontMono};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-jp-script: ${THEME.fontJPScript};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ========== TITLE STAMP: top-center observatory header ========== */
    .ko-stamp {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 28px 9px;
      color: var(--ko-starlight);
      font-family: var(--ko-font-mono);
      text-shadow: 0 0 10px rgba(62, 220, 255, 0.4), 0 2px 4px rgba(3, 14, 40, 0.8);
      pointer-events: none;
      mix-blend-mode: screen;
    }
    .ko-stamp::before, .ko-stamp::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      width: 18px;
      border: 1px solid var(--ko-cyan-soft);
      border-top-width: 2px;
      border-bottom-width: 2px;
    }
    .ko-stamp::before { left: 0;  border-right: none;  border-radius: 6px 0 0 6px; }
    .ko-stamp::after  { right: 0; border-left: none;   border-radius: 0 6px 6px 0; }
    .ko-stamp-meta {
      display: flex; align-items: center; gap: 10px;
      font-size: 10px; font-weight: 400;
      letter-spacing: 0.28em; text-transform: uppercase;
      color: var(--ko-cyan);
      opacity: 0.88;
    }
    .ko-stamp-meta .dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--ko-cyan);
      box-shadow: 0 0 6px var(--ko-cyan);
      animation: ko-pulse-dot 1.8s ease-in-out infinite;
    }
    .ko-stamp-meta .coord {
      font-weight: 300; letter-spacing: 0.18em;
      color: var(--ko-starlight); opacity: 0.7;
    }
    .ko-stamp-title {
      display: flex; align-items: baseline; gap: 14px;
      font-family: var(--ko-font-jp);
      font-size: 28px; font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--ko-starlight);
      text-shadow:
        0 0 12px rgba(62, 220, 255, 0.6),
        0 0 28px rgba(62, 220, 255, 0.25),
        0 2px 4px rgba(3, 14, 40, 1);
    }
    .ko-stamp-title .en {
      font-family: var(--ko-font-display);
      font-size: 14px; font-weight: 500;
      letter-spacing: 0.32em;
      color: var(--ko-cyan);
      opacity: 0.85;
    }
    .ko-stamp-credit {
      font-family: var(--ko-font-mono);
      font-size: 10px; font-weight: 300;
      letter-spacing: 0.22em; text-transform: uppercase;
      color: rgba(245, 251, 255, 0.7);
      margin-top: 3px;
    }
    .ko-stamp-credit .sep {
      display: inline-block; margin: 0 10px;
      color: var(--ko-magenta); opacity: 0.9;
    }
    .ko-stamp-credit .cover {
      color: var(--ko-magenta);
      font-weight: 400;
    }

    /* ========== CORNER HUD BRACKETS on viewport ========== */
    .ko-corner {
      position: absolute;
      width: 58px; height: 58px;
      border: 1px solid var(--ko-hud-line);
      opacity: 0.8;
    }
    .ko-corner::after {
      content: ''; position: absolute;
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--ko-cyan);
      box-shadow: 0 0 8px var(--ko-cyan), 0 0 2px var(--ko-starlight);
    }
    .ko-corner.tl { top: 16px;  left: 20px;  border-right: none; border-bottom: none; border-top-left-radius: 4px; }
    .ko-corner.tr { top: 16px;  right: 20px; border-left: none;  border-bottom: none; border-top-right-radius: 4px; }
    .ko-corner.bl { bottom: 16px; left: 20px;  border-right: none; border-top: none;   border-bottom-left-radius: 4px; }
    .ko-corner.br { bottom: 16px; right: 20px; border-left: none;  border-top: none;   border-bottom-right-radius: 4px; }
    .ko-corner.tl::after { top: 10px;   left: 10px; }
    .ko-corner.tr::after { top: 10px;   right: 10px; }
    .ko-corner.bl::after { bottom: 10px; left: 10px; }
    .ko-corner.br::after { bottom: 10px; right: 10px; }

    /* ========== BARCODE STRIPS (top-right MV motif) ========== */
    .ko-barcode {
      position: absolute;
      display: flex; gap: 1px;
      opacity: 0.6;
      height: 12px;
    }
    .ko-barcode span {
      display: block;
      height: 100%;
      background: var(--ko-starlight);
    }
    .ko-barcode.tr { top: 22px; right: 92px; }
    .ko-barcode.bl { bottom: 22px; left: 92px; transform: scaleX(-1); }

    /* ========== CREDIT STRIP (bottom of composition) ========== */
    .ko-credit-strip {
      position: absolute;
      bottom: 5.5%;
      left: 50%;
      transform: translateX(-50%);
      display: flex; align-items: center; gap: 14px;
      font-family: var(--ko-font-display);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.48em;
      text-transform: lowercase;
      color: var(--ko-starlight);
      opacity: 0.72;
      text-shadow: 0 0 10px rgba(62, 220, 255, 0.35), 0 2px 4px rgba(3, 14, 40, 0.8);
    }
    .ko-credit-strip .hair {
      width: 40px; height: 1px;
      background: linear-gradient(to right, transparent, var(--ko-cyan-soft), transparent);
    }

    /* ========== LYRIC VIEWPORT CARD ========== */
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
      align-items: center;
      gap: 14px;
      padding: 26px 44px 30px;
      isolation: isolate;
    }

    /* Viewport back-plate: subtle darkening + cyan frame halo behind text */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 50% 55%, rgba(3, 14, 40, 0.55), rgba(3, 14, 40, 0.1) 70%, transparent 100%);
      z-index: -2;
      opacity: 0.85;
      pointer-events: none;
    }

    /* Meteor-impact streak: diagonal gradient that sweeps across on each new line */
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      inset: -20px 0;
      background:
        linear-gradient(110deg,
          transparent 0%,
          transparent calc(var(--meteor-x) - 12%),
          rgba(62, 220, 255, 0.0) calc(var(--meteor-x) - 8%),
          rgba(62, 220, 255, 0.55) calc(var(--meteor-x) - 2%),
          rgba(245, 251, 255, 0.9) var(--meteor-x),
          rgba(255, 214, 107, 0.45) calc(var(--meteor-x) + 2%),
          rgba(62, 220, 255, 0.0) calc(var(--meteor-x) + 8%),
          transparent calc(var(--meteor-x) + 12%),
          transparent 100%);
      mix-blend-mode: screen;
      opacity: 0.75;
      filter: blur(1px);
      pointer-events: none;
      z-index: -1;
    }
    #ko-lyrics .ko-slot.ko-impact::after {
      animation: ko-meteor-sweep 0.85s cubic-bezier(.32, .02, .22, 1) 1;
    }

    /* Pulse ring — expands outward from center on impact (Pulse of the Meteor) */
    #ko-lyrics .ko-ring {
      position: absolute;
      top: 50%; left: 50%;
      width: 4px; height: 4px;
      border: 1.5px solid var(--ko-cyan);
      border-radius: 999px;
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
      box-shadow:
        0 0 12px rgba(62, 220, 255, 0.8),
        inset 0 0 10px rgba(62, 220, 255, 0.5);
      pointer-events: none;
      z-index: -1;
    }
    #ko-lyrics .ko-slot.ko-impact .ko-ring {
      animation: ko-pulse-ring 1.2s cubic-bezier(.22, .61, .36, 1) 1;
    }
    #ko-lyrics .ko-slot.ko-impact .ko-ring.d2 {
      animation: ko-pulse-ring 1.4s cubic-bezier(.22, .61, .36, 1) 0.12s 1;
      border-color: var(--ko-magenta);
      box-shadow:
        0 0 14px rgba(255, 95, 156, 0.6),
        inset 0 0 8px rgba(255, 95, 156, 0.4);
    }

    /* Radial ray scaffolding behind the card — thin white rays like MV */
    #ko-lyrics .ko-rays {
      position: absolute;
      top: 50%; left: 50%;
      width: 700px; height: 700px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: -3;
      opacity: 0;
      background:
        conic-gradient(from 90deg at 50% 50%,
          transparent 0deg,   rgba(245, 251, 255, 0.08) 1.5deg,  transparent 3deg,
          transparent 22deg,  rgba(245, 251, 255, 0.06) 23deg,   transparent 24deg,
          transparent 44deg,  rgba(62, 220, 255, 0.08) 45.5deg,  transparent 47deg,
          transparent 68deg,  rgba(245, 251, 255, 0.05) 69deg,   transparent 70deg,
          transparent 90deg,  rgba(245, 251, 255, 0.07) 91.5deg, transparent 93deg,
          transparent 116deg, rgba(62, 220, 255, 0.06) 117deg,   transparent 118deg,
          transparent 138deg, rgba(245, 251, 255, 0.05) 139.5deg,transparent 141deg,
          transparent 162deg, rgba(245, 251, 255, 0.07) 163deg,  transparent 164deg,
          transparent 184deg, rgba(62, 220, 255, 0.06) 185.5deg, transparent 187deg,
          transparent 208deg, rgba(245, 251, 255, 0.05) 209deg,  transparent 210deg,
          transparent 230deg, rgba(245, 251, 255, 0.07) 231.5deg,transparent 233deg,
          transparent 254deg, rgba(62, 220, 255, 0.08) 255deg,   transparent 256deg,
          transparent 278deg, rgba(245, 251, 255, 0.06) 279.5deg,transparent 281deg,
          transparent 302deg, rgba(245, 251, 255, 0.05) 303deg,  transparent 304deg,
          transparent 322deg, rgba(62, 220, 255, 0.07) 323.5deg, transparent 325deg,
          transparent 346deg, rgba(245, 251, 255, 0.08) 347deg,  transparent 348deg,
          transparent 360deg);
      mask-image: radial-gradient(circle, transparent 110px, black 170px, black 75%, transparent 100%);
      -webkit-mask-image: radial-gradient(circle, transparent 110px, black 170px, black 75%, transparent 100%);
      mix-blend-mode: screen;
    }
    #ko-lyrics .ko-slot.ko-impact .ko-rays {
      animation: ko-ray-flash 1.1s cubic-bezier(.22, .61, .36, 1) 1;
    }

    /* JP line — large, brush serif with cyan halo */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 800;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 46px;
      line-height: 2.3;
      padding-top: 0.4em;
      letter-spacing: 0.055em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      filter: drop-shadow(0 0 8px rgba(62, 220, 255, 0.25));
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    /* Gloss ruby: small monospaced-ish label above morphemes */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-mono);
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      line-height: 1.1;
      padding-bottom: 6px;
      color: var(--ko-starlight);
      opacity: 0.95;
      paint-order: stroke fill;
      -webkit-text-stroke: 2.5px #030915;
      text-shadow:
        0 0 7px rgba(62, 220, 255, 0.55),
        0 0 14px rgba(3, 14, 40, 1),
        0 1px 2px rgba(3, 14, 40, 1);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — clean display serif, slightly smaller than JP */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 30px;
      line-height: 1.25;
      letter-spacing: 0.035em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      filter: drop-shadow(0 0 6px rgba(62, 220, 255, 0.2));
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 24px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* === ANIMATIONS === */
    @keyframes ko-meteor-sweep {
      0%   { --meteor-x: -20%; opacity: 0; }
      15%  { opacity: 0.9; }
      100% { --meteor-x: 130%; opacity: 0; }
    }
    @keyframes ko-pulse-ring {
      0%   { width: 4px;   height: 4px;   opacity: 0.95; border-width: 2px; }
      100% { width: 820px; height: 820px; opacity: 0;    border-width: 0.5px; }
    }
    @keyframes ko-ray-flash {
      0%, 100% { opacity: 0; }
      30%      { opacity: 0.9; }
    }
    @keyframes ko-pulse-dot {
      0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--ko-cyan); }
      50%      { opacity: 0.35; box-shadow: 0 0 2px var(--ko-cyan); }
    }
    @keyframes ko-drift-star {
      0%   { transform: translate(0, 0); opacity: 0; }
      20%  { opacity: 1; }
      80%  { opacity: 1; }
      100% { transform: translate(var(--dx, 40px), var(--dy, 10px)); opacity: 0; }
    }

    /* === AMBIENT STARFIELD (subtle, behind everything) === */
    .ko-starfield {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      opacity: 0.55;
    }
    .ko-starfield i {
      position: absolute;
      width: 2px; height: 2px;
      background: var(--ko-starlight);
      border-radius: 50%;
      box-shadow: 0 0 4px var(--ko-starlight);
      animation: ko-pulse-dot 3.5s ease-in-out infinite;
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

  // Observatory chrome inside #karaoke-root. #ko-chrome is an absolutely-
  // positioned wrapper re-anchored every 250ms to the video rect — so it sits
  // inside the video and moves with fullscreen/theater/resize.
  const chrome = document.createElement('div');
  chrome.id = 'ko-chrome';
  chrome.style.cssText = 'position: absolute; pointer-events: none;';

  // Starfield — 40 tiny twinkling dots behind everything
  let starHTML = '<div class="ko-starfield" aria-hidden="true">';
  const SEED = [];
  for (let i = 0; i < 40; i++) {
    const x = (i * 37 + 13) % 100;
    const y = (i * 53 + 7)  % 100;
    const size = 1 + ((i * 11) % 3);
    const delay = ((i * 41) % 35) / 10;
    const dur = 2.5 + ((i * 13) % 25) / 10;
    starHTML += `<i style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:-${delay}s"></i>`;
    SEED.push([x, y]);
  }
  starHTML += '</div>';

  // Top-center title stamp — observatory HUD header:
  //   [•] OBSERVATION POST · METEOR TRACK 004 · N 34°42′ E 135°30′
  //   流星のパルス  ——  PULSE OF THE METEOR
  //   *LUNA feat. 鏡音レン  ◇  MALICE EVERMORE COVER
  const stampHTML = `
    <div class="ko-stamp">
      <div class="ko-stamp-meta">
        <span class="dot"></span>
        <span>OBS · METEOR TRACK 004</span>
        <span class="coord">N 34°42′ E 135°30′</span>
      </div>
      <div class="ko-stamp-title">
        <span>流星のパルス</span>
        <span class="en">PULSE · OF · THE · METEOR</span>
      </div>
      <div class="ko-stamp-credit">
        *LUNA <span class="sep">◇</span> 鏡音レン <span class="sep">◇</span>
        <span class="cover">MALICE EVERMORE — COVER</span>
      </div>
    </div>`;

  // Corner HUD brackets (4)
  const cornersHTML = `
    <div class="ko-corner tl"></div>
    <div class="ko-corner tr"></div>
    <div class="ko-corner bl"></div>
    <div class="ko-corner br"></div>`;

  // Barcode strips (top-right, bottom-left — echoes MV frame)
  let barcodeHTML = '<div class="ko-barcode tr">';
  const BARS = [2,1,3,1,2,1,1,2,1,3,1,2,1,1,2,3,1,1,2,1];
  for (const w of BARS) barcodeHTML += `<span style="width:${w}px"></span>`;
  barcodeHTML += '</div><div class="ko-barcode bl">';
  for (const w of BARS) barcodeHTML += `<span style="width:${w}px"></span>`;
  barcodeHTML += '</div>';

  // Bottom credit strip — matches MV's "malice evermore" thin typographic band
  const creditHTML = `
    <div class="ko-credit-strip">
      <span class="hair"></span>
      <span>m a l i c e&nbsp;&nbsp;e v e r m o r e</span>
      <span class="hair"></span>
    </div>`;

  setHTML(chrome, starHTML + stampHTML + cornersHTML + barcodeHTML + creditHTML);
  root.appendChild(chrome);

  // Anchor the stamp to the top of the chrome with a fixed inset (stamp is
  // absolutely-positioned inside chrome, chrome is itself anchored to video).
  const stampEl = chrome.querySelector('.ko-stamp');
  stampEl.style.top = '5%';

  // Lyric card: JP + EN lines, plus meteor-pulse ring decorations
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="ko-rays"></div>
      <div class="ko-ring"></div>
      <div class="ko-ring d2"></div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
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
      // Anchor chrome to the video rect so stamp/corners/barcodes scale with it
      chrome.style.left   = r.left + 'px';
      chrome.style.top    = r.top + 'px';
      chrome.style.width  = r.width + 'px';
      chrome.style.height = r.height + 'px';
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

  // --- Signature feature: meteor-impact transition on every new JP line ---
  // Polls #ko-line-jp.textContent at 80ms; when it changes to non-empty, adds
  // .ko-impact to .ko-slot with a forced reflow so the @keyframes restart
  // cleanly. The animation runs once (~1.1s) then we strip the class. The
  // streak sweep, pulse rings, and ray flash are all on the .ko-impact state.
  let _lastImpactJp = '';
  let _impactTimeout = null;
  const IMPACT_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(IMPACT_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const slot = document.querySelector('#ko-lyrics .ko-slot');
    if (!jpEl || !slot) return;
    const jp = jpEl.textContent.trim();
    if (jp === _lastImpactJp) return;
    _lastImpactJp = jp;
    if (!jp) return;
    // Remove, force reflow, re-add — makes @keyframes restart reliably
    slot.classList.remove('ko-impact');
    void slot.offsetWidth;
    slot.classList.add('ko-impact');
    if (_impactTimeout) clearTimeout(_impactTimeout);
    _impactTimeout = setTimeout(() => {
      if (window.__koGen !== MY_GEN) return;
      slot.classList.remove('ko-impact');
    }, 1500);
  }, 80);

})();
