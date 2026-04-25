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
    // ----- Stream identity -----
    streamTag:       'BROADCAST · 0530',
    crestSymbol:     '◉',
    streamTitle:     'WAKE-UP<br>CALL',
    streamSubtitle:  'VESPERBELL · YOMI · 16TRX',
    setlistTabIcon:  '▶',
    plainTag:        'TRACK SHEET',
    plainSubtitle:   'unsynced · scroll',
    plainTabIcon:    '♬',

    // ----- Fonts -----
    fontsHref:   'https://fonts.googleapis.com/css2?family=DotGothic16&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=M+PLUS+1+Code:wght@400;500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap',
    fontDisplay: '"DotGothic16", "Space Mono", monospace',
    fontBody:    '"Space Grotesk", system-ui, sans-serif',
    fontSerif:   '"Space Mono", "DotGothic16", monospace',
    fontJP:      '"M PLUS 1 Code", "Zen Kaku Gothic New", "DotGothic16", sans-serif',

    // ----- Color palette (sampled from VESPERBELL stream graphics) -----
    cream:      '#dde0e3',  // soft silver-gray panel base
    accent:     '#1e3df0',  // electric royal blue (her outfit accents, dot beats)
    accentDeep: '#0f23a8',  // deep royal blue (active states)
    accentInk:  '#e85e1f',  // amber-orange (her eye, earring, cable, accent dots)
    ink:        '#0d1019',  // deep navy text
    inkSoft:    '#3a4258',  // softer steel-navy text
    gold:       '#f5b73c',  // amber-gold for no-sync marker (still in palette family)

    // ----- Panel visual -----
    // Layered industrial card: subtle dot-grid, soft inner gradient, hairline
    // electric-blue rule, deep amber edge accent. Echoes the streamer's own
    // angular cream cards with embossed sidebar text.
    panelBackground: `
      repeating-linear-gradient(0deg, transparent 0 3px, rgba(15,35,168,0.025) 3px 4px),
      radial-gradient(circle at 24% 8%, rgba(255,255,255,0.85), transparent 38%),
      radial-gradient(circle at 76% 92%, rgba(232,94,31,0.05), transparent 45%),
      linear-gradient(172deg, #e8eaee 0%, #d6d9dd 50%, #c5c8cd 100%)
    `,
    panelBorder:      '1px solid rgba(13, 16, 25, 0.35)',
    panelRadius:      '4px',
    panelShadow:      '0 18px 44px -16px rgba(13,16,25,0.55), 0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(13,16,25,0.15) inset',

    // ----- Side tabs (panel collapse buttons) -----
    // Industrial deck tabs — angular, with embossed text feel.
    tabBackground: 'linear-gradient(180deg, #1a1f2e 0%, #0d1019 50%, #1a1f2e 100%)',
    tabTextColor:  '#e85e1f',
    tabShadow:     '0 4px 14px -4px rgba(13,16,25,0.7), 0 1px 0 rgba(232,94,31,0.4) inset',

    // ----- Now-playing card -----
    // Cream deck panel with cool blue stripe, amber rule, and the spinning vinyl.
    nowCardBackground: 'linear-gradient(180deg, #f0f1f4 0%, #e2e5ea 100%)',
    nowCardBorder:     '1px solid rgba(13, 16, 25, 0.45)',
    nowCardShadow:     '0 6px 18px -8px rgba(13,16,25,0.4), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(13,16,25,0.18)',
    nowFillGradient:   'linear-gradient(90deg, #e85e1f 0%, #f5b73c 35%, #1e3df0 100%)',

    // ----- Setlist rows -----
    rowHoverBg:   'rgba(30, 61, 240, 0.08)',
    rowActiveBg:  'linear-gradient(100deg, rgba(232,94,31,0.16), rgba(30,61,240,0.06) 80%, transparent)',
    rowActiveBar: '#e85e1f',

    // ----- Ctrl buttons -----
    ctrlBackground: 'linear-gradient(180deg, #f0f1f4 0%, #d8dbe0 100%)',

    // ----- Lyrics (haze-based readability) -----
    // Dark navy haze that matches the streamer's chat strip. Cream lyric text
    // with amber halo so it reads on Yomi's pale dress AND the dark navy
    // collar/speakers/turntables.
    lyricColorEN:  '#f4f1e8',
    lyricColorJP:  '#f4f1e8',
    lyricHazeBlur: 'blur(10px) saturate(1.05)',
    lyricHazeTint: 'rgba(13, 16, 25, 0.42)',
    lyricHazePad:  '160px',
    lyricShadowEN: '0 0 14px rgba(13,16,25,0.95), 0 0 28px rgba(232,94,31,0.35)',
    lyricShadowJP: '0 0 14px rgba(13,16,25,0.95), 0 0 28px rgba(232,94,31,0.35)',
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
    // PLACEHOLDER — MUST be replaced with 6 colors SAMPLED FROM THE STREAM.
    // Open the thumbnail + a couple of live frames in a color picker and
    // pull real hex values from character designs, overlay graphics, and
    // stage lighting. Don't eyeball "something in the vibe" and don't use
    // generic web palettes (Tailwind, Material) — the learner's eye uses
    // these colors to tell morphemes apart, so they must be perceptually
    // distinct AND visibly belong to THIS stream. Gray placeholders on
    // purpose so forgetting to override is obvious. See SKILL.md "Theme".
    // Sampled from VESPERBELL Yomi stream — sky-blue + amber + cream pop on the dark navy lyric haze.
    colors: ['#5db8ff','#ffaa55','#ffe066','#a8c5ff','#ff6b3d','#f0f0e8'],
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

    /* ---- Broadcast deck panel ---- */
    .ko-panel {
      position: absolute;
      width: 340px;
      max-height: 86vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(14px) saturate(1.15);
      -webkit-backdrop-filter: blur(14px) saturate(1.15);
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-ink);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.5s cubic-bezier(.77,0,.18,1);
    }
    /* Embossed sidebar text — runs vertically inside the panel edge,
       echoing VESPERBELL's actual on-stream "DESIGNED BY KONOM SINCE 2009"
       sidebar legend. Two strips, top + bottom, on the inner edge. */
    .ko-panel::before {
      content: 'BROADCAST DECK · YOMI · 0530';
      position: absolute;
      top: 14px;
      bottom: 14px;
      width: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.42em;
      color: rgba(13,16,25,0.42);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      text-transform: uppercase;
      pointer-events: none;
      z-index: 0;
    }
    .ko-setlist::before { right: 4px; }
    .ko-plain::before   { left: 4px; content: 'TRACK SHEET · UNSYNCED · ARCHIVE'; }
    /* Right edge marker dots — three small accent dots in stream's color triad. */
    .ko-panel::after {
      content: '';
      position: absolute;
      width: 4px;
      height: 32px;
      top: 16px;
      background:
        radial-gradient(circle at 50% 14%, var(--ko-accent) 1.5px, transparent 2.5px),
        radial-gradient(circle at 50% 50%, var(--ko-accent-ink) 1.5px, transparent 2.5px),
        radial-gradient(circle at 50% 86%, var(--ko-gold) 1.5px, transparent 2.5px);
      pointer-events: none;
    }
    .ko-setlist::after { left: 8px; }
    .ko-plain::after   { right: 8px; }

    .ko-setlist.collapsed { transform: translate(calc(100% - 40px), -50%); }
    .ko-plain.collapsed   { transform: translate(calc(-100% + 40px), -50%); }
    .ko-plain.hidden      { display: none; }

    /* ---- Industrial deck tab ---- */
    .ko-tab {
      position: absolute;
      top: 50%;
      margin-top: -42px;
      width: 32px;
      height: 84px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      background: ${THEME.tabBackground};
      color: ${THEME.tabTextColor};
      font-family: var(--ko-font-display);
      font-size: 16px;
      line-height: 1;
      letter-spacing: 0.05em;
      transition: transform 0.2s, filter 0.2s;
      box-shadow: ${THEME.tabShadow};
      z-index: 4;
      border: 1px solid rgba(13,16,25,0.7);
      border-radius: 2px;
    }
    .ko-tab::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ko-accent-ink);
      box-shadow: 0 0 8px var(--ko-accent-ink);
    }
    .ko-tab:hover { filter: brightness(1.15); transform: scale(1.05); }
    .ko-setlist .ko-tab { left: -28px; }
    .ko-plain   .ko-tab { right: -28px; }
    .ko-setlist.collapsed .ko-tab { animation: ko-tab-pulse 2s ease-in-out infinite; }
    .ko-plain.collapsed .ko-tab { animation: ko-tab-pulse 2s ease-in-out infinite; }
    @keyframes ko-tab-pulse {
      0%, 100% { box-shadow: ${THEME.tabShadow}, 0 0 0 0 rgba(232,94,31,0.5); }
      50%      { box-shadow: ${THEME.tabShadow}, 0 0 0 6px rgba(232,94,31,0); }
    }

    /* ---- Tape-strip header — echoes the stream's intro tape rings ---- */
    /* Bold ticker at the top of the panel: rotating "VESPERBELL ▶ YOMI ▶ KARAOKE"
       text on a wide tape-strip background. Loops via translateX keyframes. */
    .ko-tape {
      height: 22px;
      overflow: hidden;
      position: relative;
      background: linear-gradient(180deg, #f5f7f9 0%, #d6d9de 100%);
      border-bottom: 1px solid rgba(13,16,25,0.45);
      border-top: 1px solid rgba(255,255,255,0.7);
      flex-shrink: 0;
      mask-image: linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%);
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%);
    }
    .ko-tape-track {
      display: inline-flex;
      align-items: center;
      height: 100%;
      white-space: nowrap;
      animation: ko-tape-slide 38s linear infinite;
      will-change: transform;
    }
    .ko-tape-cell {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 0 14px;
      font-family: var(--ko-font-display);
      font-size: 12px;
      letter-spacing: 0.18em;
      color: var(--ko-ink);
      text-transform: uppercase;
    }
    .ko-tape-cell::after {
      content: '▶';
      font-size: 9px;
      color: var(--ko-accent);
    }
    @keyframes ko-tape-slide {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* ---- Header crest row ---- */
    .ko-head {
      padding: 18px 24px 12px 26px;
      position: relative;
      flex-shrink: 0;
      z-index: 1;
    }
    .ko-crest {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .ko-crest-mark {
      font-family: var(--ko-font-display);
      font-size: 14px;
      color: var(--ko-accent-ink);
      line-height: 1;
      filter: drop-shadow(0 0 6px rgba(232,94,31,0.5));
    }
    .ko-crest-label {
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.34em;
      color: var(--ko-ink);
      text-transform: uppercase;
      flex: 1;
    }
    .ko-crest-led {
      display: inline-flex;
      gap: 2px;
    }
    .ko-crest-led span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--ko-accent);
      box-shadow: 0 0 4px var(--ko-accent);
    }
    .ko-crest-led span:nth-child(2) { background: var(--ko-accent-ink); box-shadow: 0 0 4px var(--ko-accent-ink); animation: ko-led-blink 1.4s ease-in-out infinite; }
    .ko-crest-led span:nth-child(3) { background: var(--ko-gold); box-shadow: 0 0 4px var(--ko-gold); }
    @keyframes ko-led-blink {
      0%, 60%, 100% { opacity: 1; }
      70%, 90% { opacity: 0.25; }
    }

    .ko-title {
      font-family: var(--ko-font-display);
      font-weight: 400;
      font-size: 34px;
      line-height: 0.92;
      color: var(--ko-ink);
      margin: 4px 0 6px;
      letter-spacing: -0.005em;
      /* Dot-matrix LED feel: subtle inner amber halo */
      text-shadow: 0 0 1px rgba(232,94,31,0.18);
    }
    .ko-subtitle {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 600;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ko-subtitle::before {
      content: '';
      width: 14px;
      height: 1px;
      background: var(--ko-accent-ink);
      flex-shrink: 0;
    }
    .ko-subtitle::after {
      content: '';
      height: 1px;
      flex: 1;
      background: linear-gradient(90deg, var(--ko-accent), transparent);
      opacity: 0.5;
    }

    /* ---- Now-playing card: DJ deck with spinning vinyl + tonearm ---- */
    .ko-now {
      margin: 4px 18px 14px;
      padding: 14px 14px 12px;
      background: ${THEME.nowCardBackground};
      border: ${THEME.nowCardBorder};
      border-radius: 3px;
      box-shadow: ${THEME.nowCardShadow};
      position: relative;
    }
    /* Top metadata strip: TRACK NN · NOW PLAYING with LED indicator */
    .ko-now-strip {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--ko-font-body);
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--ko-accent-ink);
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px dashed rgba(13,16,25,0.25);
    }
    .ko-now-strip-led {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ko-accent-ink);
      box-shadow: 0 0 6px var(--ko-accent-ink);
      animation: ko-led-pulse 1.6s ease-in-out infinite;
    }
    @keyframes ko-led-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.45; transform: scale(0.85); }
    }
    .ko-now-strip-track {
      font-family: var(--ko-font-display);
      font-size: 10px;
      letter-spacing: 0.18em;
      color: var(--ko-ink);
      margin-right: auto;
    }

    /* Vinyl-record + content layout: vinyl on left, title block on right */
    .ko-now-deck {
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: 12px;
      align-items: start;
      margin-bottom: 10px;
    }
    .ko-vinyl {
      position: relative;
      width: 64px;
      height: 64px;
      flex-shrink: 0;
    }
    /* The disc — concentric grooves, colored center label */
    .ko-vinyl-disc {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background:
        radial-gradient(circle at 50% 50%, var(--ko-accent-ink) 0 6px, transparent 6px 7px),
        radial-gradient(circle at 50% 50%, #f4f1e8 7px 8px, transparent 8px),
        radial-gradient(circle at 50% 50%, transparent 0 8px, #1e3df0 8px 14px),
        radial-gradient(circle at 50% 50%, transparent 0 14px, #f4f1e8 14px 15px),
        repeating-radial-gradient(circle at 50% 50%, #0d1019 15px, #1a1f2e 15.6px, #0d1019 16.2px),
        #0d1019;
      box-shadow:
        0 2px 8px rgba(13,16,25,0.5),
        inset 0 0 8px rgba(0,0,0,0.6),
        0 0 0 1px rgba(13,16,25,0.6);
      animation: ko-vinyl-spin 4s linear infinite;
    }
    /* Center spindle dot */
    .ko-vinyl-disc::after {
      content: '';
      position: absolute;
      inset: 31px;
      width: 2px;
      height: 2px;
      background: #f4f1e8;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(13,16,25,0.4);
    }
    @keyframes ko-vinyl-spin {
      to { transform: rotate(360deg); }
    }
    /* Pause vinyl when not in a song (the JS toggles .ko-vinyl.idle) */
    .ko-vinyl.idle .ko-vinyl-disc { animation-play-state: paused; opacity: 0.4; }
    /* Tonearm — pivots from upper-right; angle interpolated by JS via --arm-deg */
    .ko-vinyl-arm {
      position: absolute;
      top: -6px;
      right: -10px;
      width: 38px;
      height: 38px;
      transform-origin: 92% 8%;
      transform: rotate(var(--arm-deg, 12deg));
      transition: transform 0.6s cubic-bezier(.4,0,.2,1);
      pointer-events: none;
    }
    .ko-vinyl-arm::before {
      /* The arm shaft */
      content: '';
      position: absolute;
      top: 4px;
      right: 4px;
      width: 32px;
      height: 4px;
      background: linear-gradient(180deg, #5a6172 0%, #2c3140 100%);
      border-radius: 1px;
      transform-origin: right center;
      transform: rotate(38deg);
      box-shadow: 0 1px 1px rgba(0,0,0,0.4);
    }
    .ko-vinyl-arm::after {
      /* The arm pivot */
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background: radial-gradient(circle, #2c3140 30%, #0d1019 70%);
      border-radius: 50%;
      box-shadow: 0 1px 2px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(232,94,31,0.4);
    }

    .ko-now-titleblock { min-width: 0; }
    .ko-now-title {
      font-family: var(--ko-font-serif);
      font-weight: 700;
      font-size: 19px;
      line-height: 1.12;
      color: var(--ko-ink);
      margin: -2px 0 4px;
      letter-spacing: -0.01em;
      word-break: keep-all;
      overflow-wrap: normal;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), var(--ko-font-display);
      font-size: 11.5px;
      font-weight: 500;
      line-height: 1.3;
      color: var(--ko-ink-soft);
      margin: 0 0 5px;
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
      font-size: 10px;
      font-weight: 600;
      color: var(--ko-accent);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .ko-now-artist::before {
      content: '◆ ';
      color: var(--ko-accent-ink);
    }

    /* Progress bar styled as a VU meter — fine ticks behind a glowing fill */
    .ko-now-progress {
      position: relative;
      height: 8px;
      background: #0d1019;
      border: 1px solid rgba(13,16,25,0.6);
      border-radius: 1px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.6);
    }
    /* Tick marks behind the fill */
    .ko-now-progress::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(90deg, transparent 0 7px, rgba(244,241,232,0.18) 7px 8px);
      pointer-events: none;
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: ${THEME.nowFillGradient};
      box-shadow: 0 0 8px rgba(232,94,31,0.6), inset 0 1px 0 rgba(255,255,255,0.3);
      transition: width 0.3s linear;
    }
    .ko-now-fill::after {
      /* Bright leading edge */
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 2px;
      background: #f4f1e8;
      box-shadow: 0 0 6px #f4f1e8, 0 0 12px var(--ko-accent-ink);
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-display);
      font-size: 10px;
      font-weight: 400;
      color: var(--ko-accent-ink);
      letter-spacing: 0.1em;
      font-variant-numeric: tabular-nums;
    }
    .ko-now-times span:first-child::before {
      content: '▸ ';
      color: var(--ko-accent);
    }

    /* ---- Deck control buttons ---- */
    .ko-ctrls {
      display: flex;
      gap: 4px;
      margin: 0 18px 10px;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 7px 8px;
      background: ${THEME.ctrlBackground};
      border: 1px solid rgba(13,16,25,0.4);
      border-radius: 2px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      position: relative;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(13,16,25,0.15), 0 1px 2px rgba(13,16,25,0.18);
      transition: filter 0.15s, transform 0.1s;
    }
    .ko-ctrl::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--ko-ink-soft);
      opacity: 0.4;
    }
    .ko-ctrl:hover { filter: brightness(1.06); }
    .ko-ctrl:active { transform: translateY(1px); box-shadow: inset 0 1px 2px rgba(13,16,25,0.3); }
    .ko-ctrl.is-on {
      background: linear-gradient(180deg, #1e3df0 0%, #0f23a8 100%);
      border-color: var(--ko-accent-deep);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 0 12px rgba(30,61,240,0.6), 0 1px 2px rgba(13,16,25,0.4);
    }
    .ko-ctrl.is-on::before {
      background: var(--ko-accent-ink);
      opacity: 1;
      box-shadow: 0 0 6px var(--ko-accent-ink);
    }
    .ko-ctrl.is-on .ko-ctrl-label { color: #f0f0e8; }
    .ko-ctrl-label {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ko-offset {
      font-family: var(--ko-font-display);
      font-size: 11px;
      font-weight: 400;
      color: var(--ko-accent-ink);
      letter-spacing: 0.04em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .ko-ctrl.is-on .ko-offset { color: var(--ko-gold); }

    /* ---- Track-sheet log: each row = a broadcast-log line entry ---- */
    .ko-list {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 6px 14px 18px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(232,94,31,0.35) transparent;
    }
    .ko-list::-webkit-scrollbar { width: 6px; }
    .ko-list::-webkit-scrollbar-thumb {
      background: rgba(232,94,31,0.35);
      border-radius: 1px;
    }
    .ko-row {
      display: grid;
      grid-template-columns: 26px 1fr;
      align-items: start;
      gap: 10px;
      padding: 8px 8px 8px 6px;
      margin: 1px 0;
      cursor: pointer;
      position: relative;
      border-left: 2px solid transparent;
      transition: background 0.15s, border-color 0.15s, padding 0.15s;
    }
    .ko-row::before {
      /* Ledger-style row separator */
      content: '';
      position: absolute;
      left: 36px;
      right: 4px;
      bottom: 0;
      height: 1px;
      background: repeating-linear-gradient(90deg, rgba(13,16,25,0.18) 0 4px, transparent 4px 8px);
    }
    .ko-row:last-child::before { display: none; }
    .ko-row:hover {
      background: ${THEME.rowHoverBg};
      border-left-color: var(--ko-accent);
      padding-left: 8px;
    }
    .ko-row.active {
      background: ${THEME.rowActiveBg};
      border-left-color: ${THEME.rowActiveBar};
      padding-left: 10px;
    }
    .ko-row.active::after {
      /* Active row gets a small "▶ ON AIR" tag at the right */
      content: 'ON AIR';
      position: absolute;
      top: 8px;
      right: 8px;
      font-family: var(--ko-font-display);
      font-size: 8px;
      letter-spacing: 0.18em;
      color: var(--ko-accent-ink);
      background: rgba(232,94,31,0.12);
      border: 1px solid rgba(232,94,31,0.4);
      padding: 1px 5px;
      border-radius: 1px;
      animation: ko-onair-blink 1.6s ease-in-out infinite;
    }
    @keyframes ko-onair-blink {
      0%, 60%, 100% { opacity: 1; }
      70%, 90% { opacity: 0.45; }
    }
    .ko-row-idx {
      font-family: var(--ko-font-display);
      font-weight: 400;
      font-size: 16px;
      color: var(--ko-accent);
      text-align: right;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;
      padding-top: 1px;
      letter-spacing: 0.02em;
    }
    .ko-row.active .ko-row-idx {
      color: var(--ko-accent-ink);
      text-shadow: 0 0 8px rgba(232,94,31,0.5);
    }
    .ko-row-body { min-width: 0; padding-right: 50px; }
    .ko-row.active .ko-row-body { padding-right: 60px; }
    .ko-row-title {
      font-family: var(--ko-font-serif);
      font-weight: 700;
      font-size: 13.5px;
      line-height: 1.2;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.01em;
    }
    .ko-row.active .ko-row-title {
      color: var(--ko-accent-deep);
    }
    .ko-row-meta {
      display: flex;
      gap: 8px;
      margin-top: 3px;
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 600;
      color: var(--ko-ink-soft);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
    }
    .ko-row-time {
      font-family: var(--ko-font-display);
      color: var(--ko-accent-ink);
      font-variant-numeric: tabular-nums;
      font-weight: 400;
      font-size: 9.5px;
      letter-spacing: 0.06em;
      flex-shrink: 0;
    }
    .ko-row-time::before { content: '› '; opacity: 0.6; }
    .ko-row-artist {
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: 0.04em;
    }
    /* No-sync rows: muted, with tape-strip diagonal stripe */
    .ko-row.no-sync {
      background: repeating-linear-gradient(135deg, transparent 0 4px, rgba(245,183,60,0.06) 4px 8px);
    }
    .ko-row.no-sync .ko-row-title { color: rgba(13,16,25,0.55); }
    .ko-row.no-sync .ko-row-time  { color: rgba(232,94,31,0.5); }
    .ko-row.no-sync .ko-row-idx   { color: rgba(30,61,240,0.5); }
    .ko-row.no-sync .ko-row-title::after {
      content: ' ◦';
      color: var(--ko-gold);
      opacity: 0.85;
    }

    .ko-plain .ko-title {
      font-size: 22px;
      letter-spacing: 0;
    }
    .ko-plain-body {
      overflow-y: auto;
      padding: 4px 22px 22px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(30,61,240,0.35) transparent;
    }
    .ko-plain-body::-webkit-scrollbar { width: 6px; }
    .ko-plain-body::-webkit-scrollbar-thumb {
      background: rgba(30,61,240,0.35);
      border-radius: 1px;
    }
    .ko-plain-section { margin-bottom: 22px; }
    .ko-plain-label {
      font-family: var(--ko-font-display);
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ko-accent-deep);
      margin-bottom: 10px;
      padding: 4px 8px;
      background: rgba(30,61,240,0.08);
      border-left: 3px solid var(--ko-accent-deep);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ko-plain-label::before {
      content: '◉';
      color: var(--ko-accent-ink);
      font-size: 8px;
    }
    .ko-plain-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: repeating-linear-gradient(90deg, var(--ko-accent-deep) 0 3px, transparent 3px 6px);
      opacity: 0.6;
    }
    .ko-plain-en {
      font-family: var(--ko-font-body);
      font-weight: 400;
      font-size: 13px;
      line-height: 1.65;
      color: var(--ko-ink);
      padding-left: 11px;
      border-left: 1px solid rgba(13,16,25,0.18);
    }
    .ko-plain-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      font-size: 13px;
      line-height: 1.85;
      color: var(--ko-ink);
      padding-left: 11px;
      border-left: 1px solid rgba(232,94,31,0.3);
    }
    .ko-plain-line  { margin-bottom: 2px; }
    .ko-plain-blank { height: 10px; }

    /* ==== LYRIC DISPLAY ====
       #ko-lyrics is positioned via the position tick (see positionTick).
       Position is structural — do not change. Typography and color are theme.

       Readability surface: a flat tinted rect (THEME.lyricHazeTint) cropped
       by a composite mask that fades equally on every side. The same 8-stop
       feather curve is applied horizontally AND vertically and intersected,
       so pixels only render where BOTH axes are opaque — soft edge all four
       sides, no visible rectangle. Curve stored in --ko-feather so it's
       declared once and referenced at all 4 use sites. */
    #ko-lyrics {
      --ko-feather:
        transparent 0%,
        rgba(0,0,0,0.25) 7%,
        rgba(0,0,0,0.65) 16%,
        #000 32%,
        #000 68%,
        rgba(0,0,0,0.65) 84%,
        rgba(0,0,0,0.25) 93%,
        transparent 100%;

      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
      padding: ${THEME.lyricHazePad};

      /* Layered haze: dark navy base + faint scanline pattern echoes the
         broadcast deck aesthetic. The mask handles the soft 4-side fade. */
      background:
        repeating-linear-gradient(0deg, transparent 0 2px, rgba(13,16,25,0.08) 2px 3px),
        ${THEME.lyricHazeTint};
      backdrop-filter: ${THEME.lyricHazeBlur};
      -webkit-backdrop-filter: ${THEME.lyricHazeBlur};

              mask-image: linear-gradient(180deg, var(--ko-feather)),
                          linear-gradient(90deg,  var(--ko-feather));
      -webkit-mask-image: linear-gradient(180deg, var(--ko-feather)),
                          linear-gradient(90deg,  var(--ko-feather));
              mask-composite: intersect;
      -webkit-mask-composite: source-in;
    }
    /* Empty state: drop the haze so the panel doesn't hang in frame
       between songs or during instrumental breaks. */
    #ko-lyrics.ko-empty {
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
              mask-image: none;
      -webkit-mask-image: none;
      padding: 0;
    }
    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    /* JP line — on top (learner reads JP first), with ruby gloss above each morpheme.
       Dark ink on the haze; soft halo catches letter edges where the haze thins. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      font-size: 42px;
      line-height: 2.4;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: ${THEME.lyricColorJP};
      text-shadow: ${THEME.lyricShadowJP};
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    /* Natural-flow EN — below JP, same visual weight, color-segmented. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 600;
      color: ${THEME.lyricColorEN};
      font-size: 40px;
      line-height: 1.2;
      letter-spacing: 0.01em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 500; }
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
  // Tape-strip cells repeated twice (animation translates -50%) — gives a seamless loop.
  const tapeText = ['VESPERBELL', 'YOMI', 'KARAOKE STREAMER', 'JOYSOUND', 'WAKE-UP CALL', 'BROADCAST 0530'];
  const tapeCells = tapeText.concat(tapeText).map(t => `<span class="ko-tape-cell">${escHTML(t)}</span>`).join('');
  setHTML(setlistPanel, `
    <div class="ko-tab" id="ko-setlist-tab" title="Collapse">${escHTML(THEME.setlistTabIcon)}</div>
    <div class="ko-tape"><div class="ko-tape-track">${tapeCells}</div></div>
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.streamTag)}</span>
        <span class="ko-crest-led"><span></span><span></span><span></span></span>
      </div>
      <div class="ko-title">${THEME.streamTitle}</div>
      <div class="ko-subtitle">${escHTML(THEME.streamSubtitle)}</div>
    </div>
    <div class="ko-now">
      <div class="ko-now-strip">
        <span class="ko-now-strip-led"></span>
        <span class="ko-now-strip-track" id="ko-now-tracknum">TRACK 00</span>
        <span>NOW PLAYING</span>
      </div>
      <div class="ko-now-deck">
        <div class="ko-vinyl idle" id="ko-vinyl">
          <div class="ko-vinyl-disc"></div>
          <div class="ko-vinyl-arm" id="ko-vinyl-arm"></div>
        </div>
        <div class="ko-now-titleblock">
          <div class="ko-now-title" id="ko-now-title">—</div>
          <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
          <div class="ko-now-artist" id="ko-now-artist">—</div>
        </div>
      </div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-skip-btn">
        <div class="ko-ctrl-label">SKIP TALK</div>
      </div>
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">OFFSET</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">HIDE LYRICS</div>
      </div>
    </div>
    <div class="ko-list" id="ko-list"></div>
  `);
  root.appendChild(setlistPanel);

  const plainPanel = document.createElement('div');
  plainPanel.className = 'ko-panel ko-plain hidden';
  if (window.__karaokePlainCollapsed) plainPanel.classList.add('collapsed');
  const plainTapeText = ['TRACK SHEET', 'UNSYNCED', 'SCROLL · LYRICS', 'ARCHIVE'];
  const plainTapeCells = plainTapeText.concat(plainTapeText).concat(plainTapeText).map(t => `<span class="ko-tape-cell">${escHTML(t)}</span>`).join('');
  setHTML(plainPanel, `
    <div class="ko-tab" id="ko-plain-tab" title="Collapse">${escHTML(THEME.plainTabIcon)}</div>
    <div class="ko-tape"><div class="ko-tape-track">${plainTapeCells}</div></div>
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.plainTag)}</span>
        <span class="ko-crest-led"><span></span><span></span><span></span></span>
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
        if (s.lrcId) {
          delete window.__lyricOffsets[s.lrcId];
          // Broadcast deletion so the karaoke-enabler extension can strip it
          // from chrome.storage.sync. Without this, the offset comes back on
          // the next page load.
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
  let lastLyricsEmpty = null;
  let lastTrackNum = '';
  let lastArmDeg = -999;
  let lastVinylIdle = null;

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
      const trackNum = song ? `TRACK ${String(song.idx).padStart(2, '0')} / 16` : 'TRACK -- / 16';
      if (trackNum !== lastTrackNum) {
        const tnEl = document.getElementById('ko-now-tracknum');
        if (tnEl) tnEl.textContent = trackNum;
        lastTrackNum = trackNum;
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

    // ---- Progress bar update + vinyl/tonearm sync ----
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
      // Vinyl is playing — disc spins (CSS keyframes), arm pivots from outer (12deg) to inner (38deg) as song progresses.
      const armDeg = Math.round(12 + (pct / 100) * 26);
      if (armDeg !== lastArmDeg) {
        const armEl = document.getElementById('ko-vinyl-arm');
        if (armEl) armEl.style.setProperty('--arm-deg', armDeg + 'deg');
        lastArmDeg = armDeg;
      }
      if (lastVinylIdle !== false) {
        const vEl = document.getElementById('ko-vinyl');
        if (vEl) vEl.classList.remove('idle');
        lastVinylIdle = false;
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
      if (lastVinylIdle !== true) {
        const vEl = document.getElementById('ko-vinyl');
        if (vEl) vEl.classList.add('idle');
        lastVinylIdle = true;
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

    // ---- Empty-state toggle on the lyric haze ----
    // Drop the haze entirely when neither JP nor EN has text (between
    // songs, instrumentals) so a cream rectangle doesn't hang in frame.
    const lyricsEmpty = !lastEnText && !lastJpText;
    if (lyricsEmpty !== lastLyricsEmpty) {
      lyrics.classList.toggle('ko-empty', lyricsEmpty);
      lastLyricsEmpty = lyricsEmpty;
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
