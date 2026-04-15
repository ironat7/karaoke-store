// ============================================================================
// KARAOKE OVERLAY — SKELETON
// ----------------------------------------------------------------------------
// Starting point for the karaoke-mode overlay. Copy to the session working
// directory as overlay.js, edit, upload, inject. See SKILL.md for the full
// hard-lock list and session workflow.
//
// LOCKED — do not rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; CSP requires it)
//   • window.__koGen + MY_GEN closure capture (prior tick self-terminates
//     on re-inject; resetting gen does not revive old closures — re-inject)
//   • window.__setlist, __parsedLyrics, __transCache, __plainLyrics,
//     __lyricOffsets, __wordAlign, __karaokeCollapsed, __karaokePlainCollapsed,
//     __karaokeSkipEnabled, __karaokeLyricsHidden, __karaokeRebuild —
//     state preservation uses the `= window.__X || default` pattern and
//     must survive re-injection
//   • RAF + setInterval(tick, 30) dual loop with MY_GEN bail (RAF throttles
//     to ~1Hz on background tabs; the interval keeps lyrics updating)
//   • COLOR_POLL setInterval at ~150ms that reads textContent of #ko-line-jp,
//     looks up __wordAlign.data[jpText], and rewrites JP+EN with colored spans
//     plus ruby gloss (when align.gloss present). NOT MutationObserver — the
//     tick's textContent writes would fire the observer and loop.
//   • positionTick's posKey cache (unguarded per-frame style.left/top writes
//     cascade through YouTube's MutationObservers and cause jank)
//   • curLineIdx = -1 reset inside the song-change branch (without it,
//     line 0 of the next song silently fails to fire)
//   • Per-write cache guards (newVal !== lastVal before every DOM write)
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • JP line above EN line in the DOM (learner reads JP first; the layout
//     depends on flow order since no flex `order` is set)
//   • The three lyric data layers (`jp` coarse chunks, `gloss` fine morphemes,
//     `en` natural flow) — __mergeTranslations expects `{en, align: {jp, gloss, en}}`
//   • Element IDs the tick writes to and classes the tick toggles — the
//     full list is in SKILL.md under "Hard locks"
//
// FREE — and expected to be HEAVILY modified:
//
//   Everything else. THEME values, CSS rules, @keyframes, pseudo-elements,
//   HTML structure, decorative wrappers, animations, composition, layout —
//   all of it.
//
//   THEME is the starting palette, NOT the finish line. Changing THEME
//   values alone produces cookie-cutter overlays that all look alike.
//   The real design work is in the CSS and HTML beneath it:
//
//     • Reshape panel components — different border treatments, shadows,
//       header layouts, decorative elements the stream calls for
//     • Add stream-specific CSS — textures, gradients, glows, motifs
//       derived from what you actually see in the frames
//     • Restructure HTML — custom headers, decorative wrappers, layout
//       changes that fit this specific stream's identity
//     • Change typography hierarchies — weight, size, spacing, style
//       combinations that speak the stream's visual language
//
//   An overlay that only differs from the baseline by THEME swaps is a
//   failure. The skeleton gives you a quality floor so you don't waste
//   effort on mechanical plumbing — spend that effort on design instead.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — starting defaults. Customize ALL of these for the stream.
  // Then go further — THEME is ~20% of the creative work. Checklist:
  //
  //   □ All THEME values customized (palette, fonts, panels, lyrics)
  //   □ CSS rules modified (border treatments, shadows, backgrounds)
  //   □ Typography tuned (sizes, weights, spacing for chosen fonts)
  //   □ Row styling changed (active treatment, hover, index, metadata)
  //   □ At least one stream-specific decorative touch (motif, pattern,
  //     gradient, animation derived from what you see in the frames)
  //   □ HTML restructured where the stream calls for it (headers,
  //     decorative wrappers, card layouts, tab shapes)
  //
  // The goal: someone seeing this overlay assumes it was made by the
  // same team that produced the stream. Not "it looks nice" — "it
  // looks like it BELONGS here."
  // ==========================================================================
  const THEME = {
    streamTag:       'GURAMARINE × CITY POP',
    crestSymbol:     '🍒',
    streamTitle:     '<em>Shinkiro</em>',
    streamSubtitle:  'side a · summer mirage',
    setlistTabIcon:  '◆',
    plainTag:        'Full Lyrics',
    plainSubtitle:   'untimed · scroll',
    plainTabIcon:    '♫',

    // City-pop fonts: condensed editorial italic display + warm geometric sans
    // + Cormorant for the cassette label + Shippori Mincho for JP.
    fontsHref: 'https://fonts.googleapis.com/css2?family=Italiana&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Caveat:wght@500;700&family=Shippori+Mincho:wght@400;500;700;800&family=Major+Mono+Display&display=swap',
    fontDisplay: '"Italiana", "Cormorant Garamond", serif',
    fontBody:    '"DM Sans", sans-serif',
    fontSerif:   '"Cormorant Garamond", serif',
    fontJP:      '"Shippori Mincho", serif',

    // Sunset palette pulled from frame-230 (palms at sunset) +
    // frame-30 (cabbie hat plum) + frame-130 (melon soda accent).
    cream:      '#FBE7C9',
    accent:     '#E0556C',
    accentDeep: '#B33E5A',
    accentInk:  '#3E1A35',
    ink:        '#2A0E22',
    inkSoft:    '#6B3A52',
    gold:       '#D9A85A',

    // Sunset sky gradient: cream top, sunset peach, coral, lavender, deep night.
    panelBackground: `
      radial-gradient(ellipse 120% 70% at 80% -10%, rgba(255,221,180,0.55), transparent 55%),
      radial-gradient(ellipse 60% 40% at 18% 110%, rgba(123,217,163,0.18), transparent 60%),
      linear-gradient(178deg,
        #FBE7C9 0%,
        #F6A687 18%,
        #E0556C 38%,
        #8C4574 58%,
        #3A5C8A 80%,
        #1B1235 100%)
    `,
    panelBorder:      '1px solid rgba(251, 231, 201, 0.28)',
    panelRadius:      '4px',
    panelShadow:      '0 30px 70px -22px rgba(11, 5, 18, 0.7), 0 0 0 1px rgba(0,0,0,0.25)',

    tabBackground: 'linear-gradient(180deg, #F6A687 0%, #E0556C 100%)',
    tabTextColor:  '#FBE7C9',
    tabShadow:     '0 6px 20px -6px rgba(11,5,18,0.55)',

    // Now-card replaced entirely by cassette markup; these stay only because
    // a few skeleton CSS rules interpolate them — kept inert.
    nowCardBackground: 'transparent',
    nowCardBorder:     '0',
    nowCardShadow:     'none',
    nowFillGradient:   'linear-gradient(90deg, #FBE7C9 0%, #F6A687 40%, #E0556C 100%)',

    rowHoverBg:   'rgba(251,231,201,0.08)',
    rowActiveBg:  'linear-gradient(100deg, rgba(251,231,201,0.18), rgba(251,231,201,0.04))',
    rowActiveBar: '#F6A687',

    ctrlBackground: 'linear-gradient(180deg, rgba(251,231,201,0.92), rgba(247,222,182,0.82))',

    // Cream lyric on deep-plum stroke — matches the cassette label, so the
    // lyric reads as part of the same world as the panel.
    lyricColorEN:  '#FBE7C9',
    lyricColorJP:  '#FBE7C9',
    lyricStrokeEN: '5px #1B0712',
    lyricStrokeJP: '5px #1B0712',
    lyricShadowEN: '0 0 18px rgba(251,231,201,0.55), 0 0 38px rgba(11,5,18,0.65)',
    lyricShadowJP: '0 0 16px rgba(251,231,201,0.55), 0 0 32px rgba(11,5,18,0.65)',
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
  // Word-level color alignment + per-morpheme gloss (always on).
  // data shape: {<jpText>: {jp: [[chunk, colorIdx], ...], gloss: [[subtoken, colorIdx, label], ...], en: [[chunk, colorIdx], ...]}}
  window.__wordAlign = window.__wordAlign || {
    colors: ['#FF4B8C','#3EC7F0','#FFB830','#7BE08F','#C58BFF','#FF8E5E'],
    data: {}
  };
  if (typeof window.__karaokeCollapsed      !== 'boolean') window.__karaokeCollapsed      = false;
  if (typeof window.__karaokePlainCollapsed !== 'boolean') window.__karaokePlainCollapsed = false;
  if (typeof window.__karaokeSkipEnabled    !== 'boolean') window.__karaokeSkipEnabled    = false;
  if (typeof window.__karaokeLyricsHidden   !== 'boolean') window.__karaokeLyricsHidden   = false;

  // --- Generation counter: bumps so prior tick closures self-terminate ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  // --- Runtime knobs (tweakable from a javascript_tool call without re-upload) ---
  window.__koMaxHold    = window.__koMaxHold    || 10;   // max seconds a line hangs before clear
  window.__koPanelWidth = window.__koPanelWidth || 340;  // panel width in px
  window.__koPanelPad   = window.__koPanelPad   || 20;   // panel padding from video edge

  // --- Clean up any prior injection's leftover DOM ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Load Google Fonts via a <link> (CSP blocks @import inside <style>) ---
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
    /* Hide the Claude Code "agent in use" border so it doesn't bleed through the overlay */
    #claude-agent-glow-border { display: none !important; }

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    /* Theme variables are shared between #karaoke-root and #ko-lyrics because
       #ko-lyrics is appended to <body> directly (sibling of #karaoke-root, not
       a descendant), so custom properties defined only on #karaoke-root would
       never reach .ko-line-en / .ko-line-jp. Past bug: lyric fonts silently
       fell back to YouTube's Roboto while colors and text-shadows — which are
       baked in as literal THEME.xxx interpolations — still themed correctly.
       If you move #ko-lyrics inside #karaoke-root later, this selector can be
       collapsed back to just #karaoke-root. */
    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    .ko-panel {
      position: absolute;
      width: 340px;
      max-height: 86vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(22px) saturate(1.3);
      -webkit-backdrop-filter: blur(22px) saturate(1.3);
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-ink);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.5s cubic-bezier(.77,0,.18,1);
    }

    .ko-setlist.collapsed { transform: translate(calc(100% - 40px), -50%); }
    .ko-plain.collapsed   { transform: translate(calc(-100% + 40px), -50%); }
    .ko-plain.hidden      { display: none; }

    .ko-tab {
      position: absolute;
      top: 50%;
      margin-top: -38px;
      width: 38px;
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: ${THEME.tabBackground};
      color: ${THEME.tabTextColor};
      font-family: var(--ko-font-display);
      font-style: italic;
      font-size: 22px;
      line-height: 1;
      text-shadow: 0 1px 2px color-mix(in srgb, var(--ko-accent-ink) 45%, transparent);
      transition: transform 0.2s, filter 0.2s;
      box-shadow: ${THEME.tabShadow};
      z-index: 2;
    }
    .ko-tab:hover { filter: brightness(1.08); transform: scale(1.05); }
    .ko-setlist .ko-tab { left: -36px; border-radius: 22px 0 0 22px; }
    .ko-plain   .ko-tab { right: -36px; border-radius: 0 22px 22px 0; }

    .ko-head {
      padding: 26px 26px 14px;
      position: relative;
      flex-shrink: 0;
    }
    .ko-crest {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 2px;
    }
    .ko-crest-mark {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 900;
      font-size: 24px;
      color: var(--ko-accent);
      line-height: 0.9;
      transform: translateY(-1px);
    }
    .ko-crest-label {
      font-family: var(--ko-font-body);
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.34em;
      color: var(--ko-accent-ink);
      text-transform: uppercase;
    }
    .ko-title {
      font-family: var(--ko-font-display);
      font-weight: 900;
      font-style: italic;
      font-size: 34px;
      line-height: 0.9;
      color: var(--ko-ink);
      margin: 10px 0 8px;
      letter-spacing: -0.012em;
    }
    .ko-subtitle {
      font-family: var(--ko-font-body);
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-subtitle::before, .ko-subtitle::after {
      content: '';
      height: 1px;
      flex: 1;
      background: linear-gradient(90deg, transparent, var(--ko-accent-deep), transparent);
      opacity: 0.55;
    }

    .ko-now {
      margin: 6px 22px 16px;
      padding: 16px 18px 14px;
      background: ${THEME.nowCardBackground};
      border: ${THEME.nowCardBorder};
      border-radius: 16px;
      box-shadow: ${THEME.nowCardShadow};
      position: relative;
    }
    .ko-now-title {
      font-family: var(--ko-font-serif), var(--ko-font-display);
      font-weight: 900;
      font-style: italic;
      font-size: 22px;
      line-height: 1.1;
      color: var(--ko-ink);
      margin: 8px 0 2px;
      font-variation-settings: "opsz" 80;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    .ko-now-meaning {
      /* JP glyphs fall through the JP font, Latin glyphs cascade to the
         display font — so "JP · English" renders both halves appropriately. */
      font-family: var(--ko-font-jp), var(--ko-font-display), serif;
      font-size: 13px;
      line-height: 1.35;
      color: var(--ko-ink-soft);
      margin: 0 0 6px;
      max-height: 3em;
      overflow: hidden;
      transition: opacity 0.3s, max-height 0.3s;
    }
    .ko-now-meaning.empty {
      max-height: 0;
      margin: 0;
      opacity: 0;
    }
    .ko-now-artist {
      font-family: var(--ko-font-body);
      font-size: 11px;
      font-weight: 500;
      color: var(--ko-ink-soft);
      margin-bottom: 12px;
      letter-spacing: 0.02em;
    }
    .ko-now-progress {
      position: relative;
      height: 6px;
      background: color-mix(in srgb, var(--ko-accent-deep) 15%, transparent);
      border-radius: 999px;
      overflow: hidden;
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: ${THEME.nowFillGradient};
      border-radius: 999px;
      box-shadow: 0 0 10px color-mix(in srgb, var(--ko-accent) 50%, transparent);
      transition: width 0.3s linear;
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 700;
      color: var(--ko-ink-soft);
      letter-spacing: 0.08em;
      font-variant-numeric: tabular-nums;
    }

    .ko-ctrls {
      display: flex;
      gap: 6px;
      margin: 0 22px 12px;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 8px 9px;
      background: ${THEME.ctrlBackground};
      border: 1px solid color-mix(in srgb, var(--ko-accent) 22%, transparent);
      border-radius: 12px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
    }
    /* Active/engaged state — JS toggles .is-on on the button div. The
       baseline below is a functional default only; restyle freely. */
    .ko-ctrl.is-on { border-color: var(--ko-accent); }
    .ko-ctrl-label {
      font-family: var(--ko-font-body);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ko-offset {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 800;
      color: var(--ko-accent-deep);
      letter-spacing: 0.05em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    .ko-list {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 16px 22px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--ko-accent-deep) 35%, transparent) transparent;
    }
    .ko-list::-webkit-scrollbar { width: 7px; }
    .ko-list::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--ko-accent-deep) 35%, transparent);
      border-radius: 4px;
    }
    .ko-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 10px 10px 10px;
      margin: 2px 0;
      border-radius: 12px;
      cursor: pointer;
      position: relative;
      transition: background 0.2s, transform 0.2s;
    }
    .ko-row:hover {
      background: ${THEME.rowHoverBg};
      transform: translateX(1px);
    }
    .ko-row.active {
      background: ${THEME.rowActiveBg};
      box-shadow: inset 3px 0 0 ${THEME.rowActiveBar};
    }
    .ko-row-idx {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 900;
      font-size: 18px;
      color: var(--ko-accent);
      min-width: 24px;
      text-align: right;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
    }
    .ko-row.active .ko-row-idx { color: var(--ko-accent-deep); }
    .ko-row-body { flex: 1; min-width: 0; }
    .ko-row-title {
      font-family: var(--ko-font-serif);
      font-weight: 700;
      font-size: 14px;
      line-height: 1.22;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-variation-settings: "opsz" 60;
    }
    .ko-row-meta {
      display: flex;
      gap: 10px;
      margin-top: 3px;
      font-family: var(--ko-font-body);
      font-size: 9.5px;
      font-weight: 600;
      color: var(--ko-ink-soft);
      letter-spacing: 0.04em;
      white-space: nowrap;
      overflow: hidden;
    }
    .ko-row-time {
      color: var(--ko-accent-deep);
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      flex-shrink: 0;
    }
    .ko-row-artist {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* .no-sync subtle muted state for rows without synced lyrics */
    .ko-row.no-sync .ko-row-title { color: color-mix(in srgb, var(--ko-ink) 48%, transparent); }
    .ko-row.no-sync .ko-row-time  { color: color-mix(in srgb, var(--ko-accent-deep) 50%, transparent); }
    .ko-row.no-sync .ko-row-idx   { color: color-mix(in srgb, var(--ko-accent) 50%, transparent); }
    .ko-row.no-sync .ko-row-title::after {
      content: ' ◦';
      color: var(--ko-gold);
      opacity: 0.75;
    }

    .ko-plain .ko-title { font-size: 24px; }
    .ko-plain-body {
      overflow-y: auto;
      padding: 6px 26px 24px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--ko-accent-deep) 35%, transparent) transparent;
    }
    .ko-plain-body::-webkit-scrollbar { width: 7px; }
    .ko-plain-body::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--ko-accent-deep) 35%, transparent);
      border-radius: 4px;
    }
    .ko-plain-section { margin-bottom: 24px; }
    .ko-plain-label {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ko-accent-deep);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-plain-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, var(--ko-accent-deep), transparent);
      opacity: 0.4;
    }
    .ko-plain-en {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.65;
      color: var(--ko-ink);
    }
    .ko-plain-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      font-size: 12.5px;
      line-height: 1.9;
      color: var(--ko-ink-soft);
    }
    .ko-plain-line  { margin-bottom: 3px; }
    .ko-plain-blank { height: 12px; }

    /* ==== LYRIC DISPLAY ====
       #ko-lyrics is positioned via the position tick (see positionTick below).
       Position is structural — do not change. Typography and color are theme. */
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
      gap: 14px;
    }
    /* JP line — on top (learner reads JP first), with ruby gloss labels above each morpheme */
    /* Stroke is drawn BEHIND the fill via paint-order, so the letter shape
       stays crisp even at 5px thickness. text-shadow is reserved for glow. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 42px;
      line-height: 2.4;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    /* Colorizer spans inherit stroke so recolored chunks keep the same outline */
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    /* Gloss labels (ruby <rt>) — small per-morpheme English sitting above JP tokens */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 3px ${THEME.lyricStrokeJP.split(' ').slice(1).join(' ')};
      text-shadow: 0 0 8px rgba(255, 244, 210, 0.55), 0 0 16px rgba(0, 0, 0, 0.4);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    /* Natural-flow EN — below JP, same visual weight, color-segmented */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.2;
      letter-spacing: 0.01em;
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

    /* ============================================================
       SHINKIRO — single-song city-pop cassette overlay
       ============================================================ */

    /* Single-song variant: no setlist list, no plain panel.
       Hide via CSS (DOM still present so the tick can write to IDs). */
    .ko-list, .ko-plain { display: none !important; }

    /* Panel sizing: a touch wider for the cassette */
    .ko-setlist {
      width: 380px !important;
      max-height: 88vh;
    }

    /* Sunset-sky panel — texture overlays added on top of the gradient.
       Layered scan-lines + soft grain bring out the analog-video feel. */
    .ko-panel {
      position: absolute;
      width: 380px;
      max-height: 88vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-cream);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.5s cubic-bezier(.77,0,.18,1);
    }
    .ko-panel::before {
      /* Faint horizontal scan-lines — VHS reference */
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: repeating-linear-gradient(
        0deg,
        rgba(255,255,255,0.018) 0,
        rgba(255,255,255,0.018) 1px,
        transparent 1px,
        transparent 3px
      );
      mix-blend-mode: overlay;
      z-index: 1;
    }
    .ko-panel::after {
      /* Subtle film-grain noise via SVG turbulence */
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.99 0 0 0 0 0.91 0 0 0 0 0.79 0 0 0 0.45 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.32'/></svg>");
      mix-blend-mode: soft-light;
      opacity: 0.55;
      z-index: 1;
    }
    /* All foreground content sits above the texture layers.
       Exclude .ko-tab — it has its own position: absolute + z-index. */
    .ko-panel > .ko-head,
    .ko-panel > .ko-runtime-strip,
    .ko-panel > .ko-now,
    .ko-panel > .ko-ctrls,
    .ko-panel > .ko-cas-footer,
    .ko-panel > .ko-list { position: relative; z-index: 2; }

    /* Side tab — soft sunset wedge, hand-cornered like a record sleeve */
    .ko-tab {
      width: 42px !important;
      height: 92px !important;
      margin-top: -46px !important;
      border-radius: 2px 0 0 2px !important;
      box-shadow:
        ${THEME.tabShadow},
        inset 0 1px 0 rgba(255,255,255,0.35),
        inset 0 -1px 0 rgba(11,5,18,0.4) !important;
      font-family: var(--ko-font-display) !important;
      font-style: normal !important;
      font-size: 20px !important;
      letter-spacing: 0.18em;
    }
    .ko-setlist .ko-tab { left: -40px !important; }

    /* ===== Header ===== */
    .ko-head {
      padding: 22px 24px 6px !important;
      flex-shrink: 0;
    }
    .ko-crest {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-bottom: 8px;
    }
    .ko-crest-mark {
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif !important;
      font-size: 16px !important;
      font-style: normal !important;
      color: inherit !important;
      filter: drop-shadow(0 1px 2px rgba(11,5,18,0.45));
      transform: translateY(-1px) rotate(-12deg);
    }
    .ko-crest-label {
      font-family: var(--ko-font-body) !important;
      font-size: 8.5px !important;
      font-weight: 700 !important;
      letter-spacing: 0.42em !important;
      color: rgba(251,231,201,0.78) !important;
      text-transform: uppercase;
    }
    .ko-title {
      font-family: var(--ko-font-display) !important;
      font-weight: 400 !important;
      font-style: normal !important;
      font-size: 76px !important;
      line-height: 0.78 !important;
      color: var(--ko-cream) !important;
      margin: 4px 0 6px !important;
      letter-spacing: -0.01em !important;
      text-shadow: 0 2px 24px rgba(11,5,18,0.55), 0 0 1px rgba(11,5,18,0.5);
    }
    .ko-title em {
      font-style: italic;
      font-family: "Cormorant Garamond", serif;
      font-weight: 500;
      letter-spacing: 0.005em;
    }
    .ko-subtitle {
      font-family: var(--ko-font-body) !important;
      font-size: 8.5px !important;
      font-weight: 600 !important;
      letter-spacing: 0.32em !important;
      color: rgba(251,231,201,0.66) !important;
      margin-top: 4px !important;
    }
    .ko-subtitle::before, .ko-subtitle::after {
      background: linear-gradient(90deg, transparent, rgba(251,231,201,0.45), transparent) !important;
    }
    /* Decorative track-listing strip below the header (anchors the eye
       between the giant title and the cassette card below) */
    .ko-runtime-strip {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 24px 0;
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 600;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: rgba(251,231,201,0.62);
    }
    .ko-runtime-strip .dot {
      width: 4px; height: 4px;
      border-radius: 999px;
      background: var(--ko-cream);
      box-shadow: 0 0 6px rgba(251,231,201,0.7);
    }
    .ko-runtime-strip .grow { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(251,231,201,0.4), transparent); }
    .ko-runtime-strip .stamp {
      padding: 2px 6px;
      border: 1px solid rgba(251,231,201,0.45);
      border-radius: 1px;
      letter-spacing: 0.22em;
    }

    /* ===== CASSETTE NOW-PLAYING CARD (signature) =====
       The .ko-now element from the skeleton is recycled as the cassette shell.
       Inside: cream paper "j-card" label, two rotating reels in a transparent
       window, magnetic-tape strip below. The skeleton's #ko-now-fill becomes
       the "tape used" indicator inside that strip. */
    .ko-now {
      margin: 16px 22px 14px !important;
      padding: 0 !important;
      background: linear-gradient(180deg, #FBE7C9 0%, #F2D2A2 50%, #E0B47A 100%) !important;
      border: 1px solid rgba(45,15,28,0.6) !important;
      border-radius: 6px !important;
      box-shadow:
        0 14px 32px -14px rgba(11,5,18,0.7),
        inset 0 1px 0 rgba(255,247,225,0.8),
        inset 0 -1px 0 rgba(45,15,28,0.35) !important;
      overflow: hidden;
      color: var(--ko-plum, #3E1A35);
    }
    .ko-cas-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 12px 6px;
      background: linear-gradient(180deg, #2A0E22 0%, #1B0712 100%);
      color: #FBE7C9;
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      font-weight: 700;
      border-bottom: 1px solid rgba(251,231,201,0.18);
    }
    .ko-cas-top .side {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .ko-cas-top .side-letter {
      width: 17px;
      height: 17px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #E0556C;
      color: #FBE7C9;
      font-family: var(--ko-font-display);
      font-size: 13px;
      letter-spacing: 0;
      box-shadow: inset 0 -1px 0 rgba(11,5,18,0.4), 0 0 0 1px rgba(11,5,18,0.5);
    }
    .ko-cas-top .meta {
      color: rgba(251,231,201,0.62);
      letter-spacing: 0.32em;
    }
    .ko-cas-shell {
      position: relative;
      padding: 14px 16px 12px;
      display: grid;
      grid-template-columns: 64px 1fr 64px;
      align-items: center;
      gap: 10px;
    }
    /* Rotating reels — central hub with 6 spokes, hub stays still while the
       spokes spin. Conic gradient gives a subtle metallic flicker. */
    .ko-reel {
      position: relative;
      width: 64px;
      height: 64px;
      border-radius: 999px;
      background:
        radial-gradient(circle at 50% 50%,
          #1B0712 0 16%,
          #2A0E22 16% 22%,
          #4B2138 22% 36%,
          #2A0E22 36% 88%,
          #1B0712 88% 100%);
      box-shadow:
        inset 0 0 0 1px rgba(11,5,18,0.6),
        inset 0 0 18px rgba(11,5,18,0.7),
        0 1px 2px rgba(11,5,18,0.45);
    }
    .ko-reel::before {
      /* Six spokes via repeating conic — rotates */
      content: '';
      position: absolute;
      inset: 6px;
      border-radius: 999px;
      background:
        conic-gradient(
          from 0deg,
          transparent 0deg, transparent 12deg,
          rgba(251,231,201,0.55) 12deg, rgba(251,231,201,0.55) 18deg,
          transparent 18deg, transparent 60deg,
          rgba(251,231,201,0.55) 60deg, rgba(251,231,201,0.55) 66deg,
          transparent 66deg, transparent 108deg,
          rgba(251,231,201,0.55) 108deg, rgba(251,231,201,0.55) 114deg,
          transparent 114deg, transparent 156deg,
          rgba(251,231,201,0.55) 156deg, rgba(251,231,201,0.55) 162deg,
          transparent 162deg, transparent 204deg,
          rgba(251,231,201,0.55) 204deg, rgba(251,231,201,0.55) 210deg,
          transparent 210deg, transparent 252deg,
          rgba(251,231,201,0.55) 252deg, rgba(251,231,201,0.55) 258deg,
          transparent 258deg, transparent 300deg,
          rgba(251,231,201,0.55) 300deg, rgba(251,231,201,0.55) 306deg,
          transparent 306deg, transparent 360deg
        );
      mask: radial-gradient(circle, transparent 22%, #000 24%, #000 86%, transparent 88%);
      -webkit-mask: radial-gradient(circle, transparent 22%, #000 24%, #000 86%, transparent 86%);
      animation: ko-reel-spin 3.4s linear infinite;
    }
    .ko-reel-r::before { animation-duration: 4.2s; }
    .ko-reel::after {
      /* Center hub: tiny screw */
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      width: 8px; height: 8px;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      background: #FBE7C9;
      box-shadow: 0 0 0 1px #1B0712, inset 0 -1px 0 rgba(11,5,18,0.5);
    }
    @keyframes ko-reel-spin { to { transform: rotate(360deg); } }

    /* Cassette label — middle column, the "j-card" insert with handwritten title */
    .ko-cas-label {
      position: relative;
      padding: 8px 10px 6px;
      background:
        repeating-linear-gradient(0deg,
          rgba(45,15,28,0.04) 0 1px,
          transparent 1px 18px),
        linear-gradient(180deg, #FBE7C9, #F4D4A6);
      border: 1px solid rgba(45,15,28,0.45);
      border-radius: 2px;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.6),
        0 1px 0 rgba(11,5,18,0.2);
      text-align: center;
      min-height: 64px;
    }
    .ko-cas-label::before {
      /* Coral-red label band across the top — the typical mixtape stripe */
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 9px;
      background: linear-gradient(180deg, #E0556C, #B33E5A);
      border-bottom: 1px solid rgba(11,5,18,0.4);
    }
    .ko-cas-label::after {
      /* Tiny serial number top-left */
      content: 'No. 01 · MM-' attr(data-side);
      position: absolute;
      top: 11px;
      left: 6px;
      font-family: var(--ko-font-body);
      font-size: 6.5px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: rgba(45,15,28,0.55);
      text-transform: uppercase;
    }
    .ko-now-title {
      font-family: var(--ko-font-display) !important;
      font-style: normal !important;
      font-weight: 400 !important;
      font-size: 28px !important;
      line-height: 1.05 !important;
      color: #2A0E22 !important;
      margin: 14px 0 1px !important;
      letter-spacing: 0.06em !important;
      text-transform: uppercase;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), var(--ko-font-serif), serif !important;
      font-size: 12px !important;
      font-style: italic;
      line-height: 1.2 !important;
      color: rgba(45,15,28,0.78) !important;
      margin: 0 0 4px !important;
    }
    .ko-now-artist {
      font-family: var(--ko-font-body) !important;
      font-size: 8.5px !important;
      font-weight: 700 !important;
      letter-spacing: 0.32em !important;
      color: rgba(45,15,28,0.6) !important;
      text-transform: uppercase;
      margin: 0 0 4px !important;
    }
    /* Magnetic-tape strip — runs full width below the shell. The skeleton's
       #ko-now-fill becomes the "used tape" portion. */
    .ko-cas-tape {
      position: relative;
      padding: 8px 14px 12px;
      background: linear-gradient(180deg, #E0B47A, #C99358);
      border-top: 1px solid rgba(45,15,28,0.45);
    }
    .ko-cas-tape-window {
      position: relative;
      height: 7px;
      background:
        linear-gradient(180deg, #1B0712 0%, #2A0E22 100%);
      border-radius: 1px;
      border: 1px solid rgba(11,5,18,0.55);
      box-shadow: inset 0 1px 1px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .ko-now-progress {
      position: absolute !important;
      inset: 0 !important;
      height: auto !important;
      background: transparent !important;
      border-radius: 0 !important;
      overflow: visible !important;
    }
    .ko-now-fill {
      position: absolute !important;
      top: 0 !important; left: 0 !important; bottom: 0 !important;
      width: 0%;
      background: linear-gradient(180deg, #F6A687 0%, #E0556C 50%, #B33E5A 100%) !important;
      border-radius: 0 !important;
      box-shadow:
        0 0 8px rgba(224,85,108,0.55),
        inset 0 1px 0 rgba(255,200,170,0.7) !important;
      transition: width 0.3s linear;
    }
    .ko-now-times {
      display: flex !important;
      justify-content: space-between !important;
      margin-top: 7px !important;
      font-family: var(--ko-font-body) !important;
      font-size: 9px !important;
      font-weight: 700 !important;
      color: #2A0E22 !important;
      letter-spacing: 0.18em !important;
      font-variant-numeric: tabular-nums;
    }

    /* ===== Controls — restyled as a deck control row ===== */
    .ko-ctrls {
      margin: 4px 22px 16px !important;
      padding: 8px 10px !important;
      background:
        linear-gradient(180deg, rgba(11,5,18,0.32), rgba(11,5,18,0.18));
      border: 1px solid rgba(251,231,201,0.18);
      border-radius: 4px;
      box-shadow:
        inset 0 1px 0 rgba(251,231,201,0.12),
        inset 0 -1px 0 rgba(0,0,0,0.4);
      gap: 7px !important;
    }
    .ko-ctrl {
      background: linear-gradient(180deg, #F6A687, #E0556C) !important;
      border: 1px solid rgba(11,5,18,0.6) !important;
      border-radius: 2px !important;
      padding: 7px 8px !important;
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.4),
        inset 0 -1px 0 rgba(11,5,18,0.45),
        0 1px 2px rgba(11,5,18,0.4);
      transition: filter 0.15s, transform 0.1s;
    }
    .ko-ctrl:hover { filter: brightness(1.06); }
    .ko-ctrl:active { transform: translateY(1px); box-shadow: inset 0 1px 2px rgba(11,5,18,0.5); }
    .ko-ctrl.is-on {
      background: linear-gradient(180deg, #FBE7C9, #F2D2A2) !important;
      border-color: #FBE7C9 !important;
    }
    .ko-ctrl-label {
      color: #1B0712 !important;
      font-weight: 700 !important;
      letter-spacing: 0.12em !important;
    }
    .ko-offset {
      color: #2A0E22 !important;
      font-weight: 800 !important;
    }

    /* Footer credit strip — fixed below ctrls, tiny "side B / runtime" data */
    .ko-cas-footer {
      margin: -8px 22px 18px;
      padding-top: 10px;
      border-top: 1px dashed rgba(251,231,201,0.25);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--ko-font-body);
      font-size: 8px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: rgba(251,231,201,0.5);
    }
    .ko-cas-footer .credit {
      font-family: var(--ko-font-serif);
      font-style: italic;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: none;
      color: rgba(251,231,201,0.75);
    }

    /* ===== Lyric display — refine for this specific MV =====
       The MV is busy and saturated. Use a slightly larger JP and a
       cream-on-deep-plum stroke that matches the cassette label palette. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp) !important;
      font-weight: 700 !important;
      font-size: 46px !important;
      line-height: 2.55 !important;
      letter-spacing: 0.04em !important;
    }
    #ko-lyrics .ko-line-en {
      font-family: "Cormorant Garamond", "Italiana", serif !important;
      font-style: italic !important;
      font-weight: 500 !important;
      font-size: 42px !important;
      line-height: 1.18 !important;
      letter-spacing: 0.005em !important;
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: "Cormorant Garamond", serif !important;
      font-style: italic !important;
      font-size: 23px !important;
      font-weight: 600 !important;
    }
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  // Attach to <body>, NOT #movie_player — YouTube detaches #movie_player
  // from the tree on scroll/resize events and the overlay would vanish.
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const setlistPanel = document.createElement('div');
  setlistPanel.className = 'ko-panel ko-setlist';
  if (window.__karaokeCollapsed) setlistPanel.classList.add('collapsed');
  setHTML(setlistPanel, `
    <div class="ko-tab" id="ko-setlist-tab" title="Collapse">${escHTML(THEME.setlistTabIcon)}</div>
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.streamTag)}</span>
      </div>
      <div class="ko-title">${THEME.streamTitle}</div>
      <div class="ko-subtitle">${escHTML(THEME.streamSubtitle)}</div>
    </div>
    <div class="ko-runtime-strip">
      <span class="dot"></span>
      <span class="stamp">5:04</span>
      <span>Hololive Original MV</span>
      <span class="grow"></span>
      <span>'24</span>
    </div>
    <div class="ko-now">
      <div class="ko-cas-top">
        <div class="side"><span class="side-letter">A</span> <span>Side A</span></div>
        <div class="meta">Type II · 60min</div>
      </div>
      <div class="ko-cas-shell">
        <div class="ko-reel ko-reel-l"></div>
        <div class="ko-cas-label" data-side="A01">
          <div class="ko-now-title" id="ko-now-title">—</div>
          <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
          <div class="ko-now-artist" id="ko-now-artist">—</div>
        </div>
        <div class="ko-reel ko-reel-r"></div>
      </div>
      <div class="ko-cas-tape">
        <div class="ko-cas-tape-window">
          <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
        </div>
        <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
      </div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-skip-btn">
        <div class="ko-ctrl-label">Skip end</div>
      </div>
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">Hide lyrics</div>
      </div>
    </div>
    <div class="ko-cas-footer">
      <span>Lyrics · 松本武史</span>
      <span class="credit"><em>カンケ</em></span>
      <span>Mix · 青海川</span>
    </div>
    <div class="ko-list" id="ko-list"></div>
  `);
  root.appendChild(setlistPanel);

  const plainPanel = document.createElement('div');
  plainPanel.className = 'ko-panel ko-plain hidden';
  if (window.__karaokePlainCollapsed) plainPanel.classList.add('collapsed');
  setHTML(plainPanel, `
    <div class="ko-tab" id="ko-plain-tab" title="Collapse">${escHTML(THEME.plainTabIcon)}</div>
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.plainTag)}</span>
      </div>
      <div class="ko-title" id="ko-plain-title">—</div>
      <div class="ko-subtitle">${escHTML(THEME.plainSubtitle)}</div>
    </div>
    <div class="ko-plain-body" id="ko-plain-body"></div>
  `);
  root.appendChild(plainPanel);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  // --- Setlist row rendering ---
  const listEl = document.getElementById('ko-list');
  const rowsHTML = window.__setlist.map((song, i) => {
    const noSync = !song.lrcId ? ' no-sync' : '';
    return `<div class="ko-row${noSync}" data-idx="${i}">
      <div class="ko-row-idx">${String(i + 1).padStart(2, '0')}</div>
      <div class="ko-row-body">
        <div class="ko-row-title">${escHTML(song.name)}</div>
        <div class="ko-row-meta">
          <span class="ko-row-time">${escHTML(song.t)}</span>
          <span class="ko-row-artist">${escHTML(song.artist)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
  setHTML(listEl, rowsHTML);

  // --- Event listeners ---
  listEl.addEventListener('click', e => {
    const row = e.target.closest('.ko-row');
    if (!row) return;
    const idx = Number(row.dataset.idx);
    const song = window.__setlist[idx];
    const v = document.querySelector('video');
    if (v && song) v.currentTime = song.s;
  });

  const skipBtn = document.getElementById('ko-skip-btn');
  skipBtn.classList.toggle('is-on', !!window.__karaokeSkipEnabled);
  skipBtn.addEventListener('click', () => {
    window.__karaokeSkipEnabled = !window.__karaokeSkipEnabled;
    skipBtn.classList.toggle('is-on', window.__karaokeSkipEnabled);
  });

  // Lyrics button: label flips between Hide/Show based on current state.
  // Hides #ko-lyrics via display:none; positionTick only writes left/top/
  // width, so the hide is not overwritten.
  const lyricsBtn   = document.getElementById('ko-lyrics-btn');
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

  // Offset button: click clears the current song's hand-tuned offset.
  // The main tick re-renders the display text from __lyricOffsets on the
  // next frame, so we don't need to write it here.
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

  document.getElementById('ko-setlist-tab').addEventListener('click', () => {
    window.__karaokeCollapsed = !window.__karaokeCollapsed;
    setlistPanel.classList.toggle('collapsed', window.__karaokeCollapsed);
  });
  document.getElementById('ko-plain-tab').addEventListener('click', () => {
    window.__karaokePlainCollapsed = !window.__karaokePlainCollapsed;
    plainPanel.classList.toggle('collapsed', window.__karaokePlainCollapsed);
  });

  // --- LRC parsing + LRCLib fetching (in-browser) ---
  const parseLRC = (txt) => {
    const lines = [];
    for (const line of txt.split('\n')) {
      const m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
      if (!m) continue;
      const sec = Number(m[1]) * 60 + Number(m[2]);
      let text = m[3].trim();
      // Some LRCLib entries bake translations as JP^EN on the same line.
      // Split on ^ — use JP as display text, auto-populate transCache with EN.
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

  // --- Cached state for DOM-write guards (avoids cascading reflows on YouTube's heavy DOM) ---
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

  // --- Position tick: re-anchor panels to the video rect ---
  // posKey cache is LOAD-BEARING: without it, every 250ms we'd write to
  // style.left/top unconditionally and cascade through YouTube's MutationObservers.
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
      let sLeft = r.right + PAD;
      if (sLeft + PW > window.innerWidth - 8) sLeft = window.innerWidth - PW - 8;
      setlistPanel.style.left = sLeft + 'px';
      setlistPanel.style.top = (r.top + r.height / 2) + 'px';
      setlistPanel.style.width = PW + 'px';

      let pLeft = r.left - PW - PAD;
      if (pLeft < 8) pLeft = 8;
      plainPanel.style.left = pLeft + 'px';
      plainPanel.style.top = (r.top + r.height / 2) + 'px';
      plainPanel.style.width = PW + 'px';

      lyrics.style.left     = (r.left + r.width / 2) + 'px';
      lyrics.style.top      = (r.top + r.height * 0.66) + 'px';
      lyrics.style.width    = (r.width * 0.62) + 'px';
      lyrics.style.maxWidth = (r.width * 0.62) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyrics, now-playing card, active row ---
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
      // Without this, the closure still thinks we're past line N of
      // the previous song and line 0 silently fails to display.
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      const title = song ? song.name : '—';
      // Second line: JP original + optional English title translation, joined
      // with ' · '. Either half is omitted if missing or identical to primary.
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

      document.querySelectorAll('.ko-row').forEach((row, i) => {
        row.classList.toggle('active', i === idx);
      });
      if (idx >= 0) {
        const row = document.querySelectorAll('.ko-row')[idx];
        if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }

      // ---- Plain-lyrics panel auto-show/hide ----
      const plainData = song ? window.__plainLyrics[song.idx] : null;
      if (plainData) {
        plainPanel.classList.remove('hidden');
        document.getElementById('ko-plain-title').textContent = song.name;
        const body = document.getElementById('ko-plain-body');
        const jpLines = plainData.jp || [];
        const enLines = plainData.en || [];
        const mkLines = (lines) => lines.map(l =>
          l === '' ? '<div class="ko-plain-blank"></div>' : `<div class="ko-plain-line">${escHTML(l)}</div>`
        ).join('');
        setHTML(body, `
          <div class="ko-plain-section">
            <div class="ko-plain-label">English</div>
            <div class="ko-plain-en">${mkLines(enLines)}</div>
          </div>
          <div class="ko-plain-section">
            <div class="ko-plain-label">日本語</div>
            <div class="ko-plain-jp">${mkLines(jpLines)}</div>
          </div>
        `);
        body.scrollTop = 0;
      } else {
        plainPanel.classList.add('hidden');
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

    // ---- Auto-skip talking gap ----
    if (window.__karaokeSkipEnabled && song && inSong >= songDur && idx < sl.length - 1) {
      const next = sl[idx + 1];
      if (next && v.currentTime < next.s - 0.5) {
        v.currentTime = next.s;
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
  // Sign convention: positive offset = lyrics LAG (appear later than audio),
  // negative = lyrics LEAD. `[` subtracts (pulls lyrics earlier on screen),
  // `]` adds (pushes lyrics later). Mnemonic: left bracket points left.
  // Tick uses `elapsed = inSong - offset`, so subtracting from offset makes
  // the current line index advance sooner. Don't invert this without also
  // flipping the tick.
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
    curLineIdx = -2;  // force next tick to re-evaluate
    // Broadcast for the karaoke-enabler extension to persist into chrome.storage.
    // No-op if no extension content script is listening.
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
  //   1. String: "<en line>"  — plain translation only, no color alignment
  //   2. Object: {en: "<en line>", align: {jp, gloss, en}}  — translation + color alignment + per-morpheme gloss
  // Keys are LRC timestamps as (m*60+s).toFixed(2). Position-independent,
  // text-independent — every LRC line has a unique timestamp.
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
            // Field-level merge — a follow-up batch that carries only `gloss`
            // must not wipe the existing `jp`/`en` arrays (and vice versa).
            // Replacing the whole align object is a silent-data-loss footgun.
            const existing = window.__wordAlign.data[line.text] || {};
            window.__wordAlign.data[line.text] = Object.assign(existing, val.align);
          }
        }
      }
    }
    window.__karaokeRebuild();
  };

  // --- Color + gloss colorizer (polling, not MutationObserver — observer-based
  //     approach creates a feedback loop with the tick's textContent writes).
  //     Reads the text the tick set, looks up alignment, paints JP chunks with
  //     colors + ruby gloss labels, paints EN chunks with matching colors.
  //     No-ops on lines with no alignment entry. ---
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
