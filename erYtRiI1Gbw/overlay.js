// ============================================================================
// KARAOKE OVERLAY — SKELETON (SINGLE-SONG FLAVOR)
// ----------------------------------------------------------------------------
// Dedicated skeleton for single-song MV overlays. The sibling `skeleton.js`
// handles multi-song karaoke streams. Both share identical locked plumbing
// (Trusted Types, __koGen closure bail, tick+RAF, COLOR_POLL, translation
// merge); this one trims panels the single-song shape doesn't need.
//
//   DROPPED vs skeleton.js:
//     • Setlist panel + collapse tab + row renderer + row click seek
//     • Plain-lyrics side panel + collapse tab + auto-show/hide logic
//     • "Skip talking" control (nothing to skip in a single song)
//     • __karaokeSkipEnabled / __karaokeCollapsed / __karaokePlainCollapsed state
//
//   KEPT (same as stream skeleton, same names, same semantics):
//     • Trusted Types policy, __koGen + MY_GEN generation bail
//     • __setlist, __parsedLyrics, __transCache, __plainLyrics, __lyricOffsets,
//       __wordAlign, __karaokeLyricsHidden, __karaokeRebuild, __mergeTranslations
//     • Dual RAF + setInterval(tick, 30) loop
//     • positionTick posKey cache (anti-jank), curLineIdx = -1 song-change reset,
//       per-write cache guards, #ko-lyrics sibling-of-root selector dual-define
//     • Offset hotkeys `[` `]` `\` + postMessage broadcast for extension persistence
//     • COLOR_POLL 150ms colorizer (NOT MutationObserver — feedback loop)
//     • All element IDs the tick writes to:
//       #ko-line-jp, #ko-line-en, #ko-now-title, #ko-now-meaning, #ko-now-artist,
//       #ko-now-cur, #ko-now-dur, #ko-now-fill, #ko-offset-display
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
//   • curLineIdx = -1 reset on song transition (harmless for single-song, but kept
//     so the skeleton stays parallel — if you later extend to two-song bundles
//     that re-use this skeleton, line 0 of song 2 will still fire)
//   • Per-write cache guards before every DOM write
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • JP line above EN line in DOM (learner reads JP first)
//   • __mergeTranslations expects `{en, align: {jp, gloss, en}}`
//
// FREE — heavily modify per-song:
//
//   THEME, CSS rules, @keyframes, pseudo-elements, HTML structure, decorative
//   wrappers, animations, composition, layout, the .ko-header panel shape and
//   placement. The only DOM contract is the element-ID list above — everything
//   wrapping those IDs is yours to redesign.
//
//   SINGLE-SONG DESIGN PRESSURE: with no setlist or plain panel carrying
//   creative load, the lyric card is where the signature feature lives. A
//   single-song overlay without a bespoke per-line animation or transformation
//   is a failure. See SKILL.md "Signature-feature gallery" for proven patterns
//   as jumping-off points — they're not templates. Invent one.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — simpler than the stream skeleton: no setlist/plain panel fields,
  // no collapse tabs, no row styling. Just song-identity strings, fonts, palette,
  // header card, now-card, ctrl buttons, and lyric rendering.
  //
  // The song NAME/ARTIST/etc. come from setlist.json at runtime — do not bake
  // them into THEME. THEME.headerTag / headerSubtitle are for stream-context
  // labels ("MV · COVER", "OFFICIAL MV · 2023", "BEASTARS S2 OP", etc.).
  // ==========================================================================
  const THEME = {
    headerTag:       'HONEY CITRON · ED',
    crestSymbol:     '🍋',
    headerSubtitle:  'love is indivisible by twins',

    fontsHref: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Zen+Maru+Gothic:wght@400;500;700;900&family=Klee+One:wght@400;600&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900&family=Caveat:wght@500;700&display=swap',
    fontDisplay: '"Fredoka", "DM Sans", sans-serif',
    fontBody:    '"DM Sans", sans-serif',
    fontSerif:   '"Klee One", "Fredoka", serif',
    fontJP:      '"Zen Maru Gothic", "Klee One", serif',
    fontScript:  '"Caveat", cursive',

    cream:      '#fff8f4',
    peach:      '#fde1e3',
    pinkSoft:   '#f2b6c8',
    pink:       '#ea8daf',
    pinkDeep:   '#c96788',
    pinkInk:    '#8a3f5e',
    blueSoft:   '#cfdfee',
    blue:       '#8fbad9',
    blueDeep:   '#5a87a8',
    lavender:   '#c3b5d4',
    ink:        '#4a2d3c',
    inkSoft:    '#7a5668',
    gold:       '#e8c86b',

    panelBackground: `
      radial-gradient(circle at 20% 0%, rgba(255,255,255,0.75), transparent 55%),
      radial-gradient(circle at 100% 100%, rgba(207,223,238,0.55), transparent 60%),
      linear-gradient(120deg, #f9ced9 0%, #f4d5da 28%, #e8d2de 55%, #d4d7e8 78%, #c3d4e5 100%)
    `,
    panelBorder:      '1.5px solid rgba(234, 141, 175, 0.45)',
    panelRadius:      '22px',
    panelShadow:      '0 34px 74px -28px rgba(138, 63, 94, 0.5), 0 0 0 1px rgba(255,255,255,0.5) inset',

    nowCardBackground: `
      radial-gradient(ellipse at 0% 50%, rgba(242,182,200,0.6), transparent 60%),
      radial-gradient(ellipse at 100% 50%, rgba(143,186,217,0.5), transparent 60%),
      linear-gradient(175deg, rgba(255,255,255,0.88), rgba(253,225,227,0.7) 50%, rgba(207,223,238,0.78))
    `,
    nowCardBorder:     '1.5px solid rgba(234, 141, 175, 0.35)',
    nowCardShadow:     'inset 0 0 0 3px rgba(255,255,255,0.85), inset 0 0 0 4.5px rgba(234,141,175,0.38), 0 14px 30px -16px rgba(138,63,94,0.4)',
    nowFillGradient:   'linear-gradient(90deg, #ea8daf 0%, #e8c86b 50%, #8fbad9 100%)',

    ctrlBackground: 'rgba(255, 248, 244, 0.72)',

    // MV-replica: hollow-outlined bubbly white letters. paint-order puts the
    // dark stroke behind a white fill so letters stay crisp over the video.
    lyricColorEN:  '#fffaf0',
    lyricColorJP:  '#ffffff',
    lyricStrokeEN: '4px rgba(74, 45, 60, 0.9)',
    lyricStrokeJP: '5px rgba(74, 45, 60, 0.95)',
    lyricShadowEN: '0 0 18px rgba(255,232,235,0.65), 0 0 34px rgba(90,30,60,0.45), 0 3px 0 rgba(234,141,175,0.35)',
    lyricShadowJP: '0 0 22px rgba(255,232,235,0.7), 0 0 40px rgba(90,30,60,0.5), 0 4px 0 rgba(234,141,175,0.4)',
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
  window.__wordAlign = window.__wordAlign || {
    colors: ['#FF4B8C','#3EC7F0','#FFB830','#7BE08F','#C58BFF','#FF8E5E'],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // --- Generation counter: bumps so prior tick closures self-terminate ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  // --- Runtime knobs ---
  window.__koMaxHold    = window.__koMaxHold    || 10;
  window.__koPanelWidth = window.__koPanelWidth || 340;
  window.__koPanelPad   = window.__koPanelPad   || 20;

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

    /* Theme vars shared between #karaoke-root and #ko-lyrics — #ko-lyrics is a
       body sibling (not descendant), so vars defined only on #karaoke-root
       wouldn't cascade to .ko-line-*. Past bug: lyric fonts silently fell back
       to YouTube's Roboto while color-literal interpolations still worked. */
    #karaoke-root, #ko-lyrics {
      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-ink:          ${THEME.ink};
      --ko-ink-soft:     ${THEME.inkSoft};
      --ko-cream: ${THEME.cream};
      --ko-peach: ${THEME.peach};
      --ko-pink-soft: ${THEME.pinkSoft};
      --ko-pink: ${THEME.pink};
      --ko-pink-deep: ${THEME.pinkDeep};
      --ko-pink-ink: ${THEME.pinkInk};
      --ko-blue-soft: ${THEME.blueSoft};
      --ko-blue: ${THEME.blue};
      --ko-blue-deep: ${THEME.blueDeep};
      --ko-gold: ${THEME.gold};
      --ko-lavender: ${THEME.lavender};
      --ko-font-script: ${THEME.fontScript};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ============================================================
       HEADER PANEL — an MV-replica lyric card transposed to the pillarbox.
       - thin inner stroke border echoes the gradient-card frame from the MV
       - "honey citron" text stamps at top and bottom edges
       - rotating citron slice in top-right corner
       - donut-with-sprinkles in bottom-left
       - soft floating flame accents
       ============================================================ */
    .ko-header {
      position: absolute;
      width: 340px;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(24px) saturate(1.35);
      -webkit-backdrop-filter: blur(24px) saturate(1.35);
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-pink-ink);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      isolation: isolate;
    }
    .ko-header::before {
      /* Inner stroke-frame: thin pink/blue split line, the MV's signature card border. */
      content: '';
      position: absolute;
      inset: 9px;
      border-radius: 15px;
      border: 1px solid transparent;
      background:
        linear-gradient(var(--ko-cream), var(--ko-cream)) padding-box,
        linear-gradient(120deg, rgba(234,141,175,0.75), rgba(143,186,217,0.7)) border-box;
      -webkit-mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
      -webkit-mask-composite: xor;
              mask-composite: exclude;
      pointer-events: none;
      opacity: 0.85;
      z-index: 0;
    }
    .ko-header::after {
      /* "honey citron" letter-spaced stamps at top+bottom, echoing the MV frame. */
      content: 'h o n e y   c i t r o n';
      position: absolute;
      left: 0; right: 0;
      top: 4px;
      text-align: center;
      font-family: var(--ko-font-body);
      font-size: 7.5px;
      font-weight: 600;
      letter-spacing: 0.6em;
      color: rgba(138, 63, 94, 0.55);
      text-transform: lowercase;
      pointer-events: none;
      z-index: 1;
    }
    .ko-header .ko-header-stamp-btm {
      position: absolute;
      left: 0; right: 0;
      bottom: 4px;
      text-align: center;
      font-family: var(--ko-font-body);
      font-size: 7.5px;
      font-weight: 600;
      letter-spacing: 0.6em;
      color: rgba(90, 135, 168, 0.55);
      text-transform: lowercase;
      pointer-events: none;
      z-index: 1;
    }
    /* Citron slice — SVG wheel rotated via CSS var so the signature animation
       can re-target the same element without tearing down the image. */
    .ko-citron {
      position: absolute;
      width: 68px; height: 68px;
      top: -18px; right: -16px;
      pointer-events: none;
      z-index: 2;
      filter: drop-shadow(0 2px 4px rgba(138,63,94,0.22));
      transform: rotate(var(--citron-rot, 0deg));
      transition: transform 900ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ko-citron-btm {
      top: auto;
      bottom: -22px;
      right: auto;
      left: -18px;
      width: 58px; height: 58px;
      transform: rotate(calc(var(--citron-rot, 0deg) * -0.6 + 20deg));
      opacity: 0.85;
    }
    /* Donut with sprinkles — secondary accent bottom-right */
    .ko-donut {
      position: absolute;
      width: 44px; height: 44px;
      bottom: 32px;
      right: 14px;
      pointer-events: none;
      z-index: 2;
      opacity: 0.82;
      animation: honeyFloat 6s ease-in-out infinite;
    }
    /* Flame motif (tiny, decorative) — echoes the interlude frame */
    .ko-flame {
      position: absolute;
      width: 18px; height: 22px;
      top: 48%;
      left: -8px;
      pointer-events: none;
      z-index: 2;
      opacity: 0.75;
      animation: honeyFloat 4.5s ease-in-out infinite reverse;
    }
    @keyframes honeyFloat {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50%      { transform: translateY(-6px) rotate(6deg); }
    }

    .ko-head {
      padding: 30px 26px 10px;
      position: relative;
      z-index: 3;
    }
    .ko-crest {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 14px 4px 10px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(234, 141, 175, 0.35);
      border-radius: 999px;
      box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset;
    }
    .ko-crest-mark {
      font-size: 15px;
      filter: drop-shadow(0 1px 0 rgba(232, 200, 107, 0.6));
      line-height: 1;
    }
    .ko-crest-label {
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.28em;
      color: var(--ko-pink-ink);
      text-transform: uppercase;
    }
    .ko-subtitle {
      font-family: var(--ko-font-script);
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.01em;
      text-transform: none;
      color: var(--ko-blue-deep);
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 12px;
      font-style: italic;
    }
    .ko-subtitle::before, .ko-subtitle::after {
      content: '';
      height: 1px;
      flex: 1;
      background: linear-gradient(90deg, transparent, rgba(234,141,175,0.7), rgba(143,186,217,0.7), transparent);
      opacity: 0.75;
    }

    .ko-now {
      margin: 8px 22px 14px;
      padding: 18px 20px 16px;
      background: ${THEME.nowCardBackground};
      border: ${THEME.nowCardBorder};
      border-radius: 18px;
      box-shadow: ${THEME.nowCardShadow};
      position: relative;
      z-index: 3;
      overflow: hidden;
    }
    .ko-now::before {
      /* tiny lemon-slice watermark behind the song title */
      content: '';
      position: absolute;
      width: 90px; height: 90px;
      top: -38px; right: -28px;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='none' stroke='%23ffffff' stroke-width='2.5' opacity='0.9'/><circle cx='50' cy='50' r='34' fill='none' stroke='%23ffffff' stroke-width='1.5' opacity='0.75'/><line x1='50' y1='6' x2='50' y2='94' stroke='%23ffffff' stroke-width='1.5' opacity='0.75'/><line x1='6' y1='50' x2='94' y2='50' stroke='%23ffffff' stroke-width='1.5' opacity='0.75'/><line x1='18' y1='18' x2='82' y2='82' stroke='%23ffffff' stroke-width='1.5' opacity='0.75'/><line x1='82' y1='18' x2='18' y2='82' stroke='%23ffffff' stroke-width='1.5' opacity='0.75'/><circle cx='50' cy='50' r='5' fill='%23ffffff' opacity='0.95'/></svg>");
      background-repeat: no-repeat;
      background-size: contain;
      opacity: 0.55;
      pointer-events: none;
    }
    .ko-now-title {
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-style: normal;
      font-size: 30px;
      line-height: 1.02;
      color: var(--ko-pink-ink);
      margin: 2px 0 4px;
      letter-spacing: -0.01em;
      word-break: keep-all;
      overflow-wrap: normal;
      position: relative;
      z-index: 1;
      text-shadow: 0 1px 0 rgba(255,255,255,0.7);
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp);
      font-size: 13px;
      font-weight: 500;
      line-height: 1.35;
      color: var(--ko-blue-deep);
      margin: 0 0 8px;
      max-height: 3em;
      overflow: hidden;
      transition: opacity 0.3s, max-height 0.3s;
      letter-spacing: 0.03em;
    }
    .ko-now-meaning.empty { max-height: 0; margin: 0; opacity: 0; }
    .ko-now-artist {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 500;
      color: var(--ko-pink-ink);
      margin-bottom: 12px;
      letter-spacing: 0.04em;
      opacity: 0.85;
    }
    .ko-now-progress {
      position: relative;
      height: 5px;
      background: rgba(234,141,175,0.18);
      border-radius: 999px;
      overflow: hidden;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(234,141,175,0.25);
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: ${THEME.nowFillGradient};
      border-radius: 999px;
      box-shadow: 0 0 10px rgba(234,141,175,0.55);
      transition: width 0.3s linear;
    }
    .ko-now-fill::after {
      /* tiny honey droplet at the progress head */
      content: '';
      position: absolute;
      right: -3px; top: 50%;
      width: 9px; height: 9px;
      transform: translateY(-50%);
      background: radial-gradient(circle at 30% 30%, #ffe8a0, #e8c86b 60%, #c99a37 100%);
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(232,200,107,0.9);
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 700;
      color: var(--ko-pink-ink);
      letter-spacing: 0.12em;
      font-variant-numeric: tabular-nums;
      opacity: 0.75;
    }

    /* Ctrls — pill buttons matching the MV palette */
    .ko-ctrls {
      display: flex;
      gap: 8px;
      margin: 0 22px 22px;
      position: relative;
      z-index: 3;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 10px;
      background: ${THEME.ctrlBackground};
      border: 1.5px solid rgba(234, 141, 175, 0.35);
      border-radius: 999px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s, border-color 0.2s, transform 0.12s;
      box-shadow: 0 2px 6px -3px rgba(138,63,94,0.25), inset 0 1px 0 rgba(255,255,255,0.7);
    }
    .ko-ctrl:hover { background: rgba(255, 255, 255, 0.9); transform: translateY(-1px); }
    .ko-ctrl.is-on {
      background: linear-gradient(120deg, rgba(234,141,175,0.2), rgba(143,186,217,0.2));
      border-color: var(--ko-pink);
    }
    .ko-ctrl-label {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ko-pink-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 800;
      color: var(--ko-blue-deep);
      letter-spacing: 0.05em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ==== LYRIC DISPLAY — "CITRON BLOOM" signature feature ====
       The ko-slot is an MV-replica lyric card: soft pink-to-blue gradient pad,
       thin inner pink/blue border, corner citron wheels, a diagonal gold
       shimmer that sweeps across on each new JP line, and the JP text
       "blooms" — stroke-width and opacity pulse on line change. */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px 40px 22px;
      position: relative;
      isolation: isolate;
    }
    #ko-lyrics .ko-slot::before {
      /* Soft pink-to-blue gradient backing behind text (subtle, not obstructive) */
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse at 12% 50%, rgba(242,182,200,0.32), transparent 55%),
        radial-gradient(ellipse at 88% 50%, rgba(143,186,217,0.28), transparent 55%);
      border-radius: 26px;
      pointer-events: none;
      z-index: -1;
      opacity: 0;
      transition: opacity 0.6s ease;
    }
    #ko-lyrics .ko-slot.bloom::before { opacity: 1; }
    #ko-lyrics .ko-slot::after {
      /* Diagonal honey-gold shimmer sweep — fires on .bloom class toggle */
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      left: -60%;
      width: 40%;
      background: linear-gradient(110deg,
        transparent 0%,
        rgba(255, 240, 200, 0.55) 45%,
        rgba(232, 200, 107, 0.75) 50%,
        rgba(255, 240, 200, 0.55) 55%,
        transparent 100%);
      filter: blur(3px);
      pointer-events: none;
      z-index: -1;
      transform: skewX(-18deg);
      opacity: 0;
    }
    #ko-lyrics .ko-slot.bloom::after {
      animation: honeyShimmer 900ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes honeyShimmer {
      0%   { left: -60%; opacity: 0; }
      20%  { opacity: 1; }
      80%  { opacity: 1; }
      100% { left: 120%; opacity: 0; }
    }

    /* JP line — hollow bubbly outlined letters (MV style).
       Stroke is painted BEHIND the white fill via paint-order, so the letter
       form stays crisp at 5px thickness. Font stack prefers Zen Maru Gothic
       (soft rounded JP). */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 900;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 46px;
      line-height: 2.3;
      padding-top: 0.4em;
      letter-spacing: 0.06em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      transform-origin: 50% 60%;
    }
    #ko-lyrics .ko-slot.bloom .ko-line-jp {
      animation: citronBloomJp 620ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes citronBloomJp {
      0%   { transform: scale(0.82); opacity: 0.2; letter-spacing: 0.16em; filter: blur(3px); }
      55%  { transform: scale(1.035); opacity: 1; filter: blur(0); }
      100% { transform: scale(1); opacity: 1; letter-spacing: 0.06em; }
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding-bottom: 8px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 2.5px rgba(74, 45, 60, 0.9);
      text-shadow: 0 0 10px rgba(255, 240, 200, 0.6), 0 0 18px rgba(90, 30, 60, 0.4);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 38px;
      line-height: 1.2;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      opacity: 1;
    }
    #ko-lyrics .ko-slot.bloom .ko-line-en {
      animation: citronBloomEn 700ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both;
    }
    @keyframes citronBloomEn {
      0%   { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
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

  // --- SVG citron wheel, donut with sprinkles, flame motif ---
  // These are the MV's three signature shape motifs; donut and flame float
  // gently (CSS keyframes), citron rotates on each new lyric line (BLOOM_POLL).
  const CITRON_SVG = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#ffffff" stroke-width="2.8" opacity="0.96"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.85"/>
      <line x1="50" y1="6" x2="50" y2="94" stroke="#ffffff" stroke-width="1.6" opacity="0.85"/>
      <line x1="6" y1="50" x2="94" y2="50" stroke="#ffffff" stroke-width="1.6" opacity="0.85"/>
      <line x1="18" y1="18" x2="82" y2="82" stroke="#ffffff" stroke-width="1.6" opacity="0.85"/>
      <line x1="82" y1="18" x2="18" y2="82" stroke="#ffffff" stroke-width="1.6" opacity="0.85"/>
      <circle cx="50" cy="50" r="5" fill="#ffffff" opacity="0.98"/>
    </svg>`;
  const DONUT_SVG = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.9"/>
      <line x1="32" y1="30" x2="38" y2="26" stroke="#ea8daf" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="68" y1="34" x2="74" y2="30" stroke="#8fbad9" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="28" y1="58" x2="34" y2="62" stroke="#e8c86b" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="64" y1="64" x2="70" y2="68" stroke="#ea8daf" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="48" y1="22" x2="54" y2="22" stroke="#8fbad9" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="46" y1="78" x2="52" y2="78" stroke="#e8c86b" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
  const FLAME_SVG = `
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M50,8 C62,30 76,38 76,62 C76,88 64,108 50,108 C36,108 24,88 24,62 C24,46 38,38 44,24 C46,36 54,44 50,8 Z"
            fill="#ffffff" opacity="0.9"/>
    </svg>`;

  const headerPanel = document.createElement('div');
  headerPanel.className = 'ko-header';
  setHTML(headerPanel, `
    <div class="ko-citron ko-citron-top">${CITRON_SVG}</div>
    <div class="ko-citron ko-citron-btm">${CITRON_SVG}</div>
    <div class="ko-donut">${DONUT_SVG}</div>
    <div class="ko-flame">${FLAME_SVG}</div>
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.headerTag)}</span>
      </div>
      <div class="ko-subtitle">${escHTML(THEME.headerSubtitle)}</div>
    </div>
    <div class="ko-now">
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">Hide lyrics</div>
      </div>
    </div>
    <div class="ko-header-stamp-btm">h o n e y   c i t r o n</div>
  `);
  root.appendChild(headerPanel);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  // --- Event listeners (Offset reset + Hide lyrics toggle) ---
  const lyricsBtn    = document.getElementById('ko-lyrics-btn');
  const lyricsBtnLbl = lyricsBtn.querySelector('.ko-ctrl-label');
  const applyLyricsState = () => {
    lyricsBtnLbl.textContent = window.__karaokeLyricsHidden ? 'Show lyrics' : 'Hide lyrics';
    lyrics.style.display     = window.__karaokeLyricsHidden ? 'none' : '';
  };
  applyLyricsState();
  lyricsBtn.addEventListener('click', () => {
    window.__karaokeLyricsHidden = !window.__karaokeLyricsHidden;
    applyLyricsState();
  });

  const offsetBtn = document.getElementById('ko-offset-btn');
  offsetBtn.addEventListener('click', () => {
    const v = document.querySelector('video');
    if (!v) return;
    const t = v.currentTime;
    const sl = window.__setlist || [];
    for (const s of sl) {
      if (t >= s.s && t < s.end) {
        if (s.lrcId) delete window.__lyricOffsets[s.lrcId];
        break;
      }
    }
  });

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
  let lastPanelPos = '';
  let lastNowTitle = '', lastNowMeaning = '', lastNowArtist = '', lastNowCur = '', lastNowDur = '', lastFill = '';
  let lastEnText = '', lastJpText = '';
  let lastOffsetStr = '';

  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  };

  // --- Position tick: re-anchor panel + lyrics to the video rect ---
  // posKey cache is LOAD-BEARING — without it every 250ms writes to style.left/top
  // unconditionally, cascading through YouTube's MutationObservers.
  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const PW = window.__koPanelWidth;
    const PAD = window.__koPanelPad;
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}|${PW}|${PAD}`;
    if (posKey !== lastPanelPos) {
      lastPanelPos = posKey;
      let hLeft = r.right + PAD;
      if (hLeft + PW > window.innerWidth - 8) hLeft = window.innerWidth - PW - 8;
      headerPanel.style.left = hLeft + 'px';
      headerPanel.style.top = (r.top + r.height / 2) + 'px';
      headerPanel.style.width = PW + 'px';

      lyrics.style.left     = (r.left + r.width / 2) + 'px';
      lyrics.style.top      = (r.top + r.height * 0.66) + 'px';
      lyrics.style.width    = (r.width * 0.62) + 'px';
      lyrics.style.maxWidth = (r.width * 0.62) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyrics + now-playing card ---
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

      const title = song ? song.name : '—';
      let meaning = '';
      if (song) {
        const jpPart = (song.originalTitle && song.originalTitle !== song.name) ? song.originalTitle : '';
        const enPart = (song.nameEn && song.nameEn !== song.name) ? song.nameEn : '';
        meaning = jpPart && enPart ? `${jpPart} · ${enPart}` : (jpPart || enPart || '');
      }
      const artist = song ? song.artist : '—';
      const durS   = fmt(songDur);
      if (title !== lastNowTitle) {
        document.getElementById('ko-now-title').textContent = title;
        lastNowTitle = title;
      }
      if (meaning !== lastNowMeaning) {
        const mEl = document.getElementById('ko-now-meaning');
        if (mEl) {
          mEl.textContent = meaning;
          mEl.classList.toggle('empty', meaning === '');
        }
        lastNowMeaning = meaning;
      }
      if (artist !== lastNowArtist) {
        document.getElementById('ko-now-artist').textContent = artist;
        lastNowArtist = artist;
      }
      if (durS !== lastNowDur) {
        document.getElementById('ko-now-dur').textContent = durS;
        lastNowDur = durS;
      }

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    // ---- Progress bar update ----
    if (song && songDur > 0) {
      const pct = Math.max(0, Math.min(100, inSong / songDur * 100));
      const fillStr = pct.toFixed(1) + '%';
      const curS = fmt(Math.min(inSong, songDur));
      if (fillStr !== lastFill) {
        document.getElementById('ko-now-fill').style.width = fillStr;
        lastFill = fillStr;
      }
      if (curS !== lastNowCur) {
        document.getElementById('ko-now-cur').textContent = curS;
        lastNowCur = curS;
      }
    } else {
      if (lastFill !== '0.0%') {
        document.getElementById('ko-now-fill').style.width = '0%';
        lastFill = '0.0%';
      }
      if (lastNowCur !== '0:00') {
        document.getElementById('ko-now-cur').textContent = '0:00';
        lastNowCur = '0:00';
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

    // ---- Offset display ----
    const curOffset = song && song.lrcId ? (window.__lyricOffsets[song.lrcId] || 0) : 0;
    const sign = curOffset >= 0 ? '+' : '';
    const offsetStr = sign + curOffset.toFixed(1) + 's';
    if (offsetStr !== lastOffsetStr) {
      const el = document.getElementById('ko-offset-display');
      if (el) el.textContent = offsetStr;
      lastOffsetStr = offsetStr;
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
        const val = map[line.t.toFixed(2)];
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

  // ==========================================================================
  // BLOOM_POLL — "Citron Bloom" signature feature.
  //
  // Polls the JP line every 140ms. When its textContent changes (and isn't
  // empty), fires the bloom animation by:
  //   1. Bumping a CSS --citron-rot variable on header → rotates both corner
  //      lemon slices (CSS transition handles the spring curve).
  //   2. Toggling the .bloom class on .ko-slot with a forced reflow — this
  //      re-plays the citronBloomJp + citronBloomEn keyframes (letters puff
  //      in, EN fades up from below) AND triggers the honey-gold shimmer
  //      sweep across the card via .ko-slot::after.
  //
  // Polling (not MutationObserver): the colorizer loop above writes innerHTML
  // on a 150ms tick; an observer here would form a feedback loop with that
  // loop. Polling cleanly decouples.
  // ==========================================================================
  let _lastBloomJp = '';
  let _citronRot = 0;
  const BLOOM_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(BLOOM_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    if (!jpEl) return;
    const jp = jpEl.textContent;
    if (jp === _lastBloomJp) return;
    _lastBloomJp = jp;
    if (!jp.trim()) return;

    const slot = document.querySelector('#ko-lyrics .ko-slot');
    if (slot) {
      slot.classList.remove('bloom');
      // Force reflow so the animation actually re-plays on consecutive triggers.
      void slot.offsetWidth;
      slot.classList.add('bloom');
    }

    _citronRot += 62;
    if (headerPanel) headerPanel.style.setProperty('--citron-rot', _citronRot + 'deg');
  }, 140);

})();
