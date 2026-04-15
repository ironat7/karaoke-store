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
    streamTag:       'PANEL Nº 01',
    crestSymbol:     '⌖',
    streamTitle:     'KAI<br>BUTSU',
    streamSubtitle:  'monster · yoasobi · fuwamoco cover',
    setlistTabIcon:  '怪',
    plainTag:        'Full Lyrics',
    plainSubtitle:   'untimed · scroll',
    plainTabIcon:    '怪',

    // Kaisei Tokumin = sharp cut-stone kanji (monster gravity).
    // Unica One = condensed geometric display (comic-title feel).
    // Crimson Pro italic = literary narration captions.
    // IBM Plex Mono = gloss (terse, technical).
    fontsHref: 'https://fonts.googleapis.com/css2?family=Kaisei+Tokumin:wght@500;700;800&family=Unica+One&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400;1,500;1,700&family=IBM+Plex+Mono:wght@300;400;500&family=Archivo:wght@500;700;800;900&display=swap',
    fontDisplay: '"Unica One", "Archivo", sans-serif',
    fontBody:    '"Archivo", "IBM Plex Mono", sans-serif',
    fontSerif:   '"Crimson Pro", serif',
    fontJP:      '"Kaisei Tokumin", serif',

    cream:      '#F5EAE8',   // bone white
    accent:     '#E41B4D',   // crimson
    accentDeep: '#9F0E36',   // dried blood
    accentInk:  '#FF2B6E',   // neon crimson (on dark)
    ink:        '#F5EAE8',   // primary text (light, on dark panels)
    inkSoft:    '#8A6670',   // muted dusty rose
    gold:       '#D4A24B',

    // Black void with crimson vignette + halftone overlay painted in CSS
    panelBackground: `
      radial-gradient(ellipse 140% 70% at 50% 0%, rgba(228, 27, 77, 0.22), transparent 60%),
      radial-gradient(ellipse 100% 60% at 50% 100%, rgba(237, 62, 159, 0.14), transparent 70%),
      linear-gradient(172deg, #0E0509 0%, #160614 52%, #0B030A 100%)
    `,
    panelBorder:      '1px solid rgba(228, 27, 77, 0.42)',
    panelRadius:      '2px',
    panelShadow:      '8px 8px 0 0 rgba(228, 27, 77, 0.55), 0 40px 80px -30px #000, 0 0 0 1px rgba(245, 234, 232, 0.06)',

    tabBackground: 'linear-gradient(180deg, #E41B4D, #7A0A2A)',
    tabTextColor:  '#F5EAE8',
    tabShadow:     '4px 0 0 0 rgba(237, 62, 159, 0.35), 0 6px 22px -6px rgba(228, 27, 77, 0.7)',

    nowCardBackground: 'linear-gradient(155deg, rgba(20, 8, 18, 0.92), rgba(10, 3, 8, 0.94))',
    nowCardBorder:     '1px solid rgba(228, 27, 77, 0.35)',
    nowCardShadow:     '3px 3px 0 0 rgba(228, 27, 77, 0.5), inset 0 0 0 1px rgba(245, 234, 232, 0.04)',
    nowFillGradient:   'linear-gradient(90deg, #3AD6E5 0%, #ED3E9F 50%, #E41B4D 100%)',

    rowHoverBg:   'rgba(228, 27, 77, 0.12)',
    rowActiveBg:  'linear-gradient(100deg, rgba(228, 27, 77, 0.32), rgba(237, 62, 159, 0.08))',
    rowActiveBar: '#E41B4D',

    ctrlBackground: 'rgba(20, 8, 14, 0.78)',

    // Lyric colors live on black — fill must read bright; stroke is the dark
    // hard edge. Shadow carries a crimson+cyan chromatic-aberration bleed so
    // every line has the giallo-manga split-print look, amplified by the
    // .chromatic-fire animation on new lines.
    lyricColorEN:  '#F5EAE8',
    lyricColorJP:  '#F5EAE8',
    lyricStrokeEN: '5px #07040A',
    lyricStrokeJP: '5px #07040A',
    lyricShadowEN: '-2px 0 0 rgba(237, 62, 159, 0.85), 2px 0 0 rgba(58, 214, 229, 0.7), 0 0 24px rgba(228, 27, 77, 0.45), 0 0 60px rgba(7, 4, 10, 0.85)',
    lyricShadowJP: '-2px 0 0 rgba(237, 62, 159, 0.9), 2px 0 0 rgba(58, 214, 229, 0.75), 0 0 22px rgba(228, 27, 77, 0.5), 0 0 48px rgba(7, 4, 10, 0.9)',
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
    colors: ['#FF2B6E','#3AD6E5','#FFCC3F','#6FE0A1','#C084FF','#FF8648'],
    data: {}
  };
  // Force override on re-inject — older builds may have cached a different palette.
  window.__wordAlign.colors = ['#FF2B6E','#3AD6E5','#FFCC3F','#6FE0A1','#C084FF','#FF8648'];
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

    /* ========== KAIBUTSU CUSTOM ========== */

    /* Single-song: hide the side panels entirely. DOM stays so the tick's
       element writes don't throw, but nothing renders in the pillarboxes. */
    .ko-setlist, .ko-plain { display: none !important; }

    /* Halftone dot overlay — giallo manga print texture.
       Painted as two offset radial-gradient tiles for a richer dot field. */
    #karaoke-root::before {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
      background:
        radial-gradient(circle at 50% 50%, rgba(245,234,232,0.045) 0.7px, transparent 1.4px) 0 0 / 5px 5px,
        radial-gradient(circle at 50% 50%, rgba(228,27,77,0.04) 0.6px, transparent 1.2px) 2.5px 2.5px / 5px 5px;
      mix-blend-mode: screen;
      opacity: 0.6;
    }

    /* ===== Lyric card: the MANGA PANEL =====
       Rotated 2px white-bordered panel on black void, with a 6px crimson
       "ink-bleed" offset shadow and an interior halftone dot field.
       Four corner brackets pinned to the corners like comic page registration
       marks. A "PANEL Nº <n>" index tag sits at the top-left, counting LRC
       line index — the lyric line literally becomes the next panel each fire. */
    #ko-lyrics .ko-slot {
      position: relative;
      padding: 36px 56px 40px;
      background:
        radial-gradient(circle at 20% 20%, rgba(237, 62, 159, 0.08) 0.8px, transparent 1.6px) 0 0 / 7px 7px,
        radial-gradient(circle at 80% 80%, rgba(58, 214, 229, 0.06) 0.8px, transparent 1.6px) 3.5px 3.5px / 7px 7px,
        linear-gradient(155deg, rgba(14, 5, 9, 0.92), rgba(7, 3, 10, 0.94));
      border: 2px solid #F5EAE8;
      backdrop-filter: blur(2px) saturate(1.1);
      -webkit-backdrop-filter: blur(2px) saturate(1.1);
      box-shadow:
        6px 6px 0 0 rgba(228, 27, 77, 0.9),
        12px 12px 0 0 rgba(237, 62, 159, 0.35),
        0 30px 60px -20px rgba(0, 0, 0, 0.9),
        inset 0 0 0 1px rgba(245, 234, 232, 0.08);
      transform: rotate(-0.8deg);
      transition: transform 260ms cubic-bezier(.2,.7,.3,1);
      isolation: isolate;
    }
    /* Empty-state: collapse the panel so instrumental gaps aren't awkward */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0;
      transform: rotate(-0.8deg) scale(0.92);
      transition: opacity 400ms, transform 400ms;
    }
    /* Corner registration brackets (manga page marks) */
    #ko-lyrics .ko-slot::before,
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      width: 18px; height: 18px;
      border: 2px solid #E41B4D;
      pointer-events: none;
    }
    #ko-lyrics .ko-slot::before {
      top: -2px; left: -2px;
      border-right: none; border-bottom: none;
      box-shadow: -3px -3px 0 rgba(237, 62, 159, 0.5);
    }
    #ko-lyrics .ko-slot::after {
      bottom: -2px; right: -2px;
      border-left: none; border-top: none;
      box-shadow: 3px 3px 0 rgba(58, 214, 229, 0.5);
    }
    .ko-slot-corner-tr, .ko-slot-corner-bl {
      position: absolute;
      width: 18px; height: 18px;
      border: 2px solid #E41B4D;
      pointer-events: none;
    }
    .ko-slot-corner-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; box-shadow: 3px -3px 0 rgba(58, 214, 229, 0.5); }
    .ko-slot-corner-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; box-shadow: -3px 3px 0 rgba(237, 62, 159, 0.5); }

    /* Panel index tag — tiny comic-page reference label, top-left outside the frame */
    .ko-slot-tag {
      position: absolute;
      top: -14px;
      left: 16px;
      padding: 3px 10px;
      background: #E41B4D;
      color: #F5EAE8;
      font-family: "Unica One", sans-serif;
      font-size: 11px;
      font-weight: 400;
      letter-spacing: 0.28em;
      white-space: nowrap;
      box-shadow: 2px 2px 0 rgba(7, 3, 10, 0.85);
      z-index: 2;
      transform: rotate(-1.6deg);
    }
    .ko-slot-stamp {
      position: absolute;
      bottom: -11px;
      right: 20px;
      padding: 2px 8px;
      background: #07040A;
      color: #3AD6E5;
      font-family: "IBM Plex Mono", monospace;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.18em;
      border: 1px solid rgba(58, 214, 229, 0.45);
      z-index: 2;
      transform: rotate(0.8deg);
    }

    /* JP line — Kaisei Tokumin 800 on black. Gloss above in IBM Plex Mono. */
    #ko-lyrics .ko-line-jp {
      font-family: "Kaisei Tokumin", serif !important;
      font-weight: 800 !important;
      font-size: 44px !important;
      line-height: 2.3 !important;
      letter-spacing: 0.06em !important;
      padding-top: 0.55em !important;
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: "IBM Plex Mono", monospace !important;
      font-size: 13px !important;
      font-weight: 400 !important;
      letter-spacing: 0.04em !important;
      padding-bottom: 7px !important;
      -webkit-text-stroke: 2px #07040A !important;
      text-transform: lowercase;
      opacity: 0.96;
    }
    /* EN natural-flow line — Crimson Pro italic, narration caption */
    #ko-lyrics .ko-line-en {
      font-family: "Crimson Pro", serif !important;
      font-weight: 500 !important;
      font-style: italic !important;
      font-size: 34px !important;
      line-height: 1.25 !important;
      letter-spacing: 0.005em !important;
    }
    /* Subtle crimson flourish under the EN narration */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 6px;
      background: linear-gradient(90deg, transparent 4%, rgba(228, 27, 77, 0.35) 50%, transparent 96%) bottom / 100% 1px no-repeat;
    }

    /* ===== Chromatic glitch fire — triggered on every new JP line =====
       Two conic/offset color phantom layers snap apart then slam into their
       final chromatic-aberration positions. 380ms, cubic-bezier snap. */
    @keyframes kfire-jp {
      0%   { text-shadow: -12px 0 0 rgba(237, 62, 159, 1), 12px 0 0 rgba(58, 214, 229, 1), 0 0 0 rgba(228, 27, 77, 0); transform: translateX(0); filter: brightness(1.3); }
      20%  { text-shadow: -8px -1px 0 rgba(237, 62, 159, 1), 8px 1px 0 rgba(58, 214, 229, 1), 0 0 30px rgba(228, 27, 77, 0.8); transform: translateX(-2px); filter: brightness(1.15); }
      60%  { text-shadow: -3px 0 0 rgba(237, 62, 159, 0.95), 3px 0 0 rgba(58, 214, 229, 0.8), 0 0 26px rgba(228, 27, 77, 0.55); transform: translateX(0.5px); filter: brightness(1.05); }
      100% { text-shadow: ${THEME.lyricShadowJP}; transform: translateX(0); filter: brightness(1); }
    }
    @keyframes kfire-en {
      0%   { text-shadow: -10px 0 0 rgba(237, 62, 159, 0.9), 10px 0 0 rgba(58, 214, 229, 0.9), 0 0 0 rgba(228, 27, 77, 0); transform: translateX(0); filter: brightness(1.2); }
      30%  { text-shadow: -5px 0 0 rgba(237, 62, 159, 0.85), 5px 0 0 rgba(58, 214, 229, 0.75), 0 0 22px rgba(228, 27, 77, 0.5); transform: translateX(-1px); }
      100% { text-shadow: ${THEME.lyricShadowEN}; transform: translateX(0); filter: brightness(1); }
    }
    @keyframes kfire-slot {
      0%   { box-shadow: 0 0 0 2px rgba(245, 234, 232, 1), 12px 12px 0 0 rgba(228, 27, 77, 1), 24px 24px 0 0 rgba(237, 62, 159, 0.6), 0 30px 60px -20px rgba(0, 0, 0, 0.9); filter: contrast(1.18); }
      60%  { box-shadow: 6px 6px 0 0 rgba(228, 27, 77, 0.95), 12px 12px 0 0 rgba(237, 62, 159, 0.5), 0 30px 60px -20px rgba(0, 0, 0, 0.9); filter: contrast(1.05); }
      100% { box-shadow: 6px 6px 0 0 rgba(228, 27, 77, 0.9), 12px 12px 0 0 rgba(237, 62, 159, 0.35), 0 30px 60px -20px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(245, 234, 232, 0.08); filter: contrast(1); }
    }
    #ko-lyrics .ko-slot.kfire              { animation: kfire-slot 420ms cubic-bezier(.1,.8,.3,1) both; }
    #ko-lyrics .ko-slot.kfire .ko-line-jp  { animation: kfire-jp   380ms cubic-bezier(.1,.8,.3,1) both; }
    #ko-lyrics .ko-slot.kfire .ko-line-en  { animation: kfire-en   420ms cubic-bezier(.2,.7,.3,1) 60ms both; }

    /* Floating JP-character "ghost" squares — echo the MV's scattered
       white-boxed chars. They drift slowly in the margins of the lyric card. */
    .ko-ghost {
      position: absolute;
      font-family: "Kaisei Tokumin", serif;
      font-weight: 700;
      font-size: 22px;
      color: rgba(245, 234, 232, 0.22);
      border: 1.5px solid rgba(245, 234, 232, 0.28);
      padding: 3px 7px 2px;
      pointer-events: none;
      user-select: none;
      background: rgba(7, 3, 10, 0.5);
      backdrop-filter: blur(1px);
      box-shadow: 2px 2px 0 rgba(228, 27, 77, 0.25);
    }
    .ko-ghost.g1 { top: -28px; left: 22%; transform: rotate(-6deg); animation: drift1 9s ease-in-out infinite; }
    .ko-ghost.g2 { top: 35%;  right: -42px; transform: rotate(4deg); animation: drift2 11s ease-in-out infinite; }
    .ko-ghost.g3 { bottom: -26px; right: 28%; transform: rotate(8deg); animation: drift3 13s ease-in-out infinite; }
    .ko-ghost.g4 { top: 20%;  left: -44px; transform: rotate(-4deg); animation: drift1 12s ease-in-out -3s infinite; }
    @keyframes drift1 {
      0%,100% { transform: rotate(-6deg) translateY(0); opacity: 0.55; }
      50%     { transform: rotate(-7deg) translateY(-5px); opacity: 0.9; }
    }
    @keyframes drift2 {
      0%,100% { transform: rotate(4deg) translateX(0); opacity: 0.5; }
      50%     { transform: rotate(5deg) translateX(-4px); opacity: 0.85; }
    }
    @keyframes drift3 {
      0%,100% { transform: rotate(8deg) translateY(0); opacity: 0.45; }
      50%     { transform: rotate(9deg) translateY(4px); opacity: 0.8; }
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
    <div class="ko-slot" id="ko-slot">
      <div class="ko-slot-corner-tr"></div>
      <div class="ko-slot-corner-bl"></div>
      <div class="ko-slot-tag" id="ko-slot-tag">PANEL Nº 00</div>
      <div class="ko-slot-stamp">KAIBUTSU · SIDE A</div>
      <div class="ko-ghost g1">笑</div>
      <div class="ko-ghost g2">怪</div>
      <div class="ko-ghost g3">物</div>
      <div class="ko-ghost g4">僕</div>
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

  // ===== Chromatic-fire trigger + panel index counter =====
  // Watches #ko-line-jp textContent. Each change: re-triggers the .kfire
  // animation via class remove + forced reflow + add, and bumps the panel
  // index tag. The tag counts LRC lines since song start, not clock time —
  // panel N of the ongoing manga page.
  let _fireLastJp = null;
  let _fireLineCount = 0;
  let _fireLastSongIdx = -2;
  const FIRE_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(FIRE_POLL); return; }
    const slot = document.getElementById('ko-slot');
    const jpEl = document.getElementById('ko-line-jp');
    const tag  = document.getElementById('ko-slot-tag');
    if (!slot || !jpEl) return;
    const jp = jpEl.textContent;
    if (jp === _fireLastJp) return;
    _fireLastJp = jp;
    // Reset counter when song changes (single-song build always idx 0,
    // but the generalization keeps it honest)
    const sl = window.__setlist || [];
    const v = document.querySelector('video');
    let sIdx = -1;
    if (v && isFinite(v.currentTime)) {
      const t = v.currentTime;
      for (let i = 0; i < sl.length; i++) {
        if (t >= sl[i].s && t < sl[i].end) { sIdx = i; break; }
      }
    }
    if (sIdx !== _fireLastSongIdx) {
      _fireLastSongIdx = sIdx;
      _fireLineCount = 0;
    }
    // Only fire on non-empty content (skip clearing/empty-state)
    if (jp.trim()) {
      _fireLineCount++;
      if (tag) tag.textContent = 'PANEL Nº ' + String(_fireLineCount).padStart(2, '0');
      slot.classList.remove('kfire');
      void slot.offsetWidth;
      slot.classList.add('kfire');
    }
  }, 60);

})();
