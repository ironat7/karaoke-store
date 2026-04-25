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
    streamTag:       'FEELING HEART',
    crestSymbol:     '\u275B',
    streamTitle:     'Feeling<br>Heart',
    streamSubtitle:  'spring 1999 \u00B7 a fuwamoco keepsake',
    setlistTabIcon:  '\u275B',
    plainTag:        'Full Lyrics',
    plainSubtitle:   'untimed \u00B7 scroll',
    plainTabIcon:    '\u266A',

    fontsHref: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;0,9..144,900;1,9..144,700&family=Shippori+Mincho:wght@400;500;700;800&display=swap',
    fontDisplay: '"Fraunces", serif',
    fontBody:    '"DM Sans", sans-serif',
    fontSerif:   '"Fraunces", serif',
    fontJP:      '"Shippori Mincho", serif',

    cream:      '#FAEFD6',
    accent:     '#E48AA9',
    accentDeep: '#C14978',
    accentInk:  '#8D3656',
    ink:        '#3C2E2A',
    inkSoft:    '#6B4F43',
    gold:       '#B8863E',

    panelBackground: 'linear-gradient(172deg, rgba(250,239,214,0.96) 0%, rgba(248,225,224,0.92) 100%)',
    panelBorder:     '1px solid rgba(193, 73, 120, 0.2)',
    panelRadius:     '6px',
    panelShadow:     '0 30px 64px -28px rgba(74, 52, 40, 0.55)',

    tabBackground: 'linear-gradient(180deg, #E48AA9, #C14978)',
    tabTextColor:  '#fff',
    tabShadow:     '0 6px 20px -6px rgba(193, 73, 120, 0.5)',

    nowCardBackground: 'rgba(250,239,214,0.6)',
    nowCardBorder:     '1px dashed rgba(141, 54, 86, 0.3)',
    nowCardShadow:     '0 10px 22px -14px rgba(74,52,40,0.35)',
    nowFillGradient:   'linear-gradient(90deg, #E48AA9 0%, #C14978 100%)',

    rowHoverBg:   'rgba(193, 73, 120, 0.08)',
    rowActiveBg:  'rgba(193, 73, 120, 0.14)',
    rowActiveBar: '#C14978',

    ctrlBackground: 'rgba(250, 239, 214, 0.6)',

    // Lyrics sit INSIDE a cream polaroid card with backdrop-blur, so the ink
    // reads on cream paper, not on the raw video. Stroke is a subtle cream
    // halo that softens edges against the paper texture without fighting it.
    lyricColorEN:  '#3C2E2A',
    lyricColorJP:  '#3C2E2A',
    lyricStrokeEN: '1.5px rgba(250, 239, 214, 0.9)',
    lyricStrokeJP: '1.5px rgba(250, 239, 214, 0.9)',
    lyricShadowEN: '0 1px 3px rgba(74, 52, 40, 0.18)',
    lyricShadowJP: '0 1px 2px rgba(74, 52, 40, 0.15)',
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
  // Scrapbook-earthy palette — mid-dark saturations so colored ink reads on
  // cream paper (the polaroid card). Pastels would vanish into the background.
  window.__wordAlign = window.__wordAlign || { data: {} };
  window.__wordAlign.colors = ['#C13860', '#2F8B77', '#B8753A', '#7A3F68', '#3B5080', '#C8633C'];
  if (!window.__wordAlign.data) window.__wordAlign.data = {};
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

    /* ==== SINGLE-SONG MODE — hide the side panels entirely. DOM nodes remain
       so the tick's textContent writes to #ko-now-title etc. never throw. ==== */
    .ko-setlist, .ko-plain { display: none !important; }

    /* ==== LYRIC DISPLAY — the polaroid
       #ko-lyrics is positioned via the position tick. Position is structural.
       Inside it, .ko-slot is the polaroid card: cream paper backdrop, washi-
       tape corners, slight rotation, drifting sakura petals. When a new line
       arrives the card re-runs a "develop-in" animation, like a Polaroid
       photo. ==== */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    /* Petals floating around the card — absolute positioned siblings of .ko-slot */
    #ko-lyrics .ko-petal {
      position: absolute;
      font-family: serif;
      font-size: 22px;
      color: rgba(228, 138, 169, 0.55);
      text-shadow: 0 1px 3px rgba(141, 54, 86, 0.25);
      pointer-events: none;
      user-select: none;
      will-change: transform, opacity;
    }
    #ko-lyrics .ko-petal.p1 { top: -18px; left: -38px; font-size: 28px; color: rgba(228, 138, 169, 0.6); animation: kfloat1 9s ease-in-out infinite; }
    #ko-lyrics .ko-petal.p2 { top: 8px; right: -44px; font-size: 20px; color: rgba(168, 216, 202, 0.55); animation: kfloat2 11s ease-in-out infinite 1.2s; }
    #ko-lyrics .ko-petal.p3 { bottom: -12px; left: 6%; font-size: 18px; color: rgba(228, 138, 169, 0.5); animation: kfloat3 8.5s ease-in-out infinite 0.6s; }
    #ko-lyrics .ko-petal.p4 { bottom: -24px; right: 8%; font-size: 24px; color: rgba(193, 73, 120, 0.45); animation: kfloat1 10.5s ease-in-out infinite 2.4s; }
    #ko-lyrics .ko-petal.p5 { top: 42%; left: -56px; font-size: 16px; color: rgba(168, 216, 202, 0.5); animation: kfloat2 9.5s ease-in-out infinite 3.8s; }
    #ko-lyrics .ko-petal.p6 { top: 38%; right: -52px; font-size: 19px; color: rgba(228, 138, 169, 0.5); animation: kfloat3 12s ease-in-out infinite 1.8s; }
    @keyframes kfloat1 {
      0%,100% { transform: translate(0, 0) rotate(-8deg); opacity: 0.85; }
      50%     { transform: translate(-6px, 10px) rotate(12deg); opacity: 1; }
    }
    @keyframes kfloat2 {
      0%,100% { transform: translate(0, 0) rotate(14deg); opacity: 0.8; }
      50%     { transform: translate(8px, 12px) rotate(-6deg); opacity: 1; }
    }
    @keyframes kfloat3 {
      0%,100% { transform: translate(0, 0) rotate(-18deg); opacity: 0.75; }
      50%     { transform: translate(4px, -10px) rotate(8deg); opacity: 1; }
    }

    /* The polaroid card itself */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 26px 42px 32px;
      background:
        radial-gradient(ellipse 120% 85% at 50% 30%, rgba(255,251,232,0.88) 0%, rgba(250,239,214,0.82) 60%, rgba(243,225,200,0.8) 100%);
      backdrop-filter: blur(14px) saturate(1.1);
      -webkit-backdrop-filter: blur(14px) saturate(1.1);
      border: 1px solid rgba(220, 198, 170, 0.55);
      border-radius: 4px;
      box-shadow:
        0 28px 56px -22px rgba(74, 52, 40, 0.55),
        0 4px 12px -6px rgba(74, 52, 40, 0.35),
        inset 0 0 0 6px rgba(255, 251, 235, 0.55),
        inset 0 0 60px rgba(243, 225, 200, 0.3);
      transform: rotate(-0.6deg);
      min-width: 340px;
    }
    /* Washi tape — two pieces pinning the polaroid */
    #ko-lyrics .ko-slot::before,
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      top: -14px;
      width: 86px;
      height: 22px;
      background:
        repeating-linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.0) 0 6px,
          rgba(255, 255, 255, 0.25) 6px 12px
        ),
        linear-gradient(180deg, rgba(228, 138, 169, 0.78), rgba(228, 138, 169, 0.58));
      box-shadow: 0 2px 6px -2px rgba(74, 52, 40, 0.4);
      mix-blend-mode: multiply;
      border-radius: 1px;
    }
    #ko-lyrics .ko-slot::before { left: 28px; transform: rotate(-8deg); }
    #ko-lyrics .ko-slot::after  {
      right: 28px; transform: rotate(7deg);
      background:
        repeating-linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.0) 0 6px,
          rgba(255, 255, 255, 0.3) 6px 12px
        ),
        linear-gradient(180deg, rgba(168, 216, 202, 0.78), rgba(168, 216, 202, 0.58));
    }

    /* Develop-in animation — the photo emerges from pale/desaturated to full
       color when the line changes. The custom develop-poll (below) toggles
       the .developing class. This is the signature feature. */
    @keyframes develop {
      0%   { filter: brightness(1.28) saturate(0.15) sepia(0.35) contrast(0.82); opacity: 0.35; transform: rotate(-0.6deg) translateY(-2px) scale(0.985); }
      28%  { filter: brightness(1.16) saturate(0.42) sepia(0.22) contrast(0.9); opacity: 0.72; }
      65%  { filter: brightness(1.05) saturate(0.78) sepia(0.08) contrast(0.96); opacity: 0.94; }
      100% { filter: brightness(1) saturate(1) sepia(0) contrast(1); opacity: 1; transform: rotate(-0.6deg) translateY(0) scale(1); }
    }
    #ko-lyrics .ko-slot.developing {
      animation: develop 0.82s cubic-bezier(.2, .72, .28, 1);
    }

    /* Hide the card when both lines are empty (instrumental gaps) */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transition: opacity 0.35s;
    }

    /* ---- The three lyric layers inside the polaroid ---- */

    /* JP line — elegant Shippori Mincho on cream, with ruby gloss above */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 42px;
      line-height: 2.4;
      padding-top: 0.3em;
      letter-spacing: 0.05em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    /* Gloss labels in Caveat — handwritten margin notes above each morpheme */
    #ko-lyrics .ko-line-jp rt {
      font-family: "Caveat", cursive;
      font-size: 26px;
      font-weight: 600;
      letter-spacing: 0.01em;
      line-height: 1.05;
      padding-bottom: 4px;
      color: #6B4F43;
      paint-order: stroke fill;
      -webkit-text-stroke: 1px rgba(250, 239, 214, 0.9);
      text-shadow: 0 1px 2px rgba(250, 239, 214, 0.9);
      user-select: none;
      opacity: 0.92;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* Natural-flow EN — Caveat handwriting, like a penciled translation under the photo */
    #ko-lyrics .ko-line-en {
      font-family: "Caveat", cursive;
      font-weight: 500;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 46px;
      line-height: 1.08;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      padding-top: 2px;
      /* Wavy underline beneath the EN line, like ink on journal paper */
      background-image: linear-gradient(90deg, transparent 0, transparent 8%, rgba(193, 73, 120, 0.22) 8%, rgba(193, 73, 120, 0.22) 92%, transparent 92%);
      background-repeat: no-repeat;
      background-position: center 98%;
      background-size: 100% 1.5px;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 36px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
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
    <div class="ko-now">
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-skip-btn">
        <div class="ko-ctrl-label">Skip talking</div>
      </div>
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">Hide lyrics</div>
      </div>
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
    <div class="ko-petal p1">\u2741</div>
    <div class="ko-petal p2">\u273F</div>
    <div class="ko-petal p3">\u2740</div>
    <div class="ko-petal p4">\u2741</div>
    <div class="ko-petal p5">\u273F</div>
    <div class="ko-petal p6">\u2740</div>
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
        if (s.lrcId) {
          delete window.__lyricOffsets[s.lrcId];
          try {
            const vid = new URL(location.href).searchParams.get('v');
            window.postMessage({
              __ko: true, type: 'offset',
              videoId: vid, lrcId: s.lrcId,
              offset: null
            }, location.origin);
          } catch {}
        }
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

  // --- Develop-in animation: re-trigger the polaroid "develop" keyframe on
  //     each new lyric line. Polling (not MutationObserver) for the same
  //     reason COLOR_POLL polls — observers would loop on tick textContent
  //     writes. Using the JP line's textContent as the change signal.
  let _lastDevelopJp = '';
  const DEVELOP_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(DEVELOP_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    if (!jpEl) return;
    const jp = jpEl.textContent;
    if (jp === _lastDevelopJp) return;
    _lastDevelopJp = jp;
    if (!jp.trim()) return;
    const slot = document.querySelector('#ko-lyrics .ko-slot');
    if (!slot) return;
    slot.classList.remove('developing');
    // Force reflow so the animation restart takes effect (otherwise the
    // class add/remove in the same tick is a no-op).
    void slot.offsetWidth;
    slot.classList.add('developing');
  }, 60);

})();
