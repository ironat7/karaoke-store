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
    streamTag:       'CH 01—20 / SIGNAL CHAIN',
    crestSymbol:     '◈',
    streamTitle:     'VESPER<span style="font-weight:400;font-style:italic;opacity:0.7">/</span>BELL',
    streamSubtitle:  'YOMI · SOLO UTAWAKU · VRF.2026',
    setlistTabIcon:  '◈',
    plainTag:        'Full Lyrics',
    plainSubtitle:   'untimed · scroll',
    plainTabIcon:    '♫',

    // ----- Fonts — Industrial / console typography.
    //       Chakra Petch: engineered semi-technical display face
    //       Share Tech Mono: 7-segment-style readout numerics
    //       Rajdhani: geometric body face, engineering UI feel
    //       Zen Kaku Gothic New: JP face at matching weight -----
    fontsHref:   'https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,500;0,600;0,700;1,500;1,700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap',
    fontDisplay: '"Chakra Petch", system-ui, sans-serif',
    fontBody:    '"Rajdhani", system-ui, sans-serif',
    fontSerif:   '"Share Tech Mono", ui-monospace, monospace',
    fontJP:      '"Zen Kaku Gothic New", system-ui, sans-serif',

    // ----- Color palette — pulled from Yomi's frame: chrome armor,
    //       electric blue hair tips, signature orange earring, amber eye glow -----
    cream:      '#d5dce6',  // chrome highlight
    accent:     '#ff8a2e',  // signature orange (Yomi's drop earring)
    accentDeep: '#e55a0e',  // deeper orange
    accentInk:  '#ffad63',  // amber tint for text on accent
    ink:        '#e7edf5',  // primary text (light silver on dark panels)
    inkSoft:    '#8a9bb0',  // secondary text (mid gunmetal)
    gold:       '#f4b54e',  // Yomi's amber eye glow — "no-sync" marker

    // ----- Panel visual — dark gunmetal console face -----
    panelBackground: `
      linear-gradient(180deg, rgba(22,30,44,0.96) 0%, rgba(14,20,32,0.97) 100%)
    `,
    panelBorder:      '1px solid rgba(255, 138, 46, 0.28)',
    panelRadius:      '4px',
    panelShadow:      '0 24px 70px -24px rgba(0,0,0,0.88), 0 0 0 1px rgba(14,20,32,0.55), inset 0 1px 0 rgba(170,195,225,0.1)',

    // ----- Side tabs (rack-handle shape) -----
    tabBackground: 'linear-gradient(180deg, #1e2a3b 0%, #0f1520 100%)',
    tabTextColor:  '#ff8a2e',
    tabShadow:     '0 4px 14px -4px rgba(0,0,0,0.85), inset 0 1px 0 rgba(170,195,225,0.15)',

    // ----- Now-playing card — the MASTER OUT module -----
    nowCardBackground: 'linear-gradient(180deg, rgba(30,42,58,0.92) 0%, rgba(18,26,38,0.92) 100%)',
    nowCardBorder:     '1px solid rgba(71, 150, 255, 0.32)',
    nowCardShadow:     'inset 0 1px 0 rgba(170,195,225,0.14), inset 0 0 0 1px rgba(14,20,32,0.7), 0 8px 20px -8px rgba(0,0,0,0.55)',
    nowFillGradient:   'linear-gradient(90deg, #ff8a2e 0%, #ffc070 50%, #ff8a2e 100%)',

    // ----- Setlist rows (channel strips) -----
    rowHoverBg:   'rgba(71, 150, 255, 0.08)',
    rowActiveBg:  'linear-gradient(90deg, rgba(255,138,46,0.18) 0%, rgba(255,138,46,0.02) 100%)',
    rowActiveBar: '#ff8a2e',

    // ----- Ctrl buttons — illuminated rack toggles -----
    ctrlBackground: 'linear-gradient(180deg, rgba(28,40,56,0.9), rgba(16,24,36,0.92))',

    // ----- Lyrics — cream fill + deep ink stroke for max contrast on video.
    //       Keep stroke + ink dark enough to survive chrome/light frames;
    //       glow stays warm so text feels like it emits its own light. -----
    lyricColorEN:  '#ffecd2',
    lyricColorJP:  '#ffecd2',
    lyricStrokeEN: '5px #060a14',
    lyricStrokeJP: '5px #060a14',
    lyricShadowEN: '0 0 14px rgba(255, 138, 46, 0.45), 0 0 36px rgba(0, 0, 0, 0.5)',
    lyricShadowJP: '0 0 14px rgba(255, 138, 46, 0.45), 0 0 32px rgba(0, 0, 0, 0.5)',
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
    // 6 colors pulled from Yomi's frame: chrome armor, electric-blue hair
    // tips, signature orange earring, amber eye glow, soft cyan secondary
    // hair tone, warning-red LED dots in her scene.
    colors: [
      '#ff9a4a',  // 0 — signature orange (her earring)
      '#5aa3ff',  // 1 — electric blue (hair highlight)
      '#ffd07a',  // 2 — amber gold (her eye glow)
      '#9fd4ff',  // 3 — soft cyan (secondary hair tone)
      '#ff6d85',  // 4 — warning red/coral (LED dots)
      '#d8e1ee',  // 5 — chrome silver (armor)
    ],
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

    /* ==== PANEL — console face ====
       Riveted industrial rack module with a thin LED strip across the top,
       a vertical "IKONIA / SINCE 2008"-style marginalia stripe on the outer
       edge, and a 1px etched inner border. Backdrop-filter gives it that
       real-glass screen-over-metal feel even against bright frames. */
    .ko-panel {
      position: absolute;
      width: 340px;
      max-height: 86vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(18px) saturate(1.15);
      -webkit-backdrop-filter: blur(18px) saturate(1.15);
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-ink);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.5s cubic-bezier(.77,0,.18,1);
    }
    /* Tiny orange LED bar across the very top of the panel — the
       "power on" indicator. */
    .ko-panel::before {
      content: '';
      position: absolute;
      top: 0; left: 14px; right: 14px;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--ko-accent) 12%, var(--ko-accent) 88%, transparent);
      box-shadow: 0 0 10px var(--ko-accent), 0 0 20px rgba(255, 138, 46, 0.4);
      pointer-events: none;
      z-index: 3;
    }
    /* Four corner brackets — rack-panel industrial look. */
    .ko-panel::after {
      content: '';
      position: absolute;
      inset: 6px;
      pointer-events: none;
      background:
        /* top-left */
        linear-gradient(var(--ko-accent), var(--ko-accent)) top left / 8px 1px no-repeat,
        linear-gradient(var(--ko-accent), var(--ko-accent)) top left / 1px 8px no-repeat,
        /* top-right */
        linear-gradient(var(--ko-accent), var(--ko-accent)) top right / 8px 1px no-repeat,
        linear-gradient(var(--ko-accent), var(--ko-accent)) top right / 1px 8px no-repeat,
        /* bottom-left */
        linear-gradient(var(--ko-accent), var(--ko-accent)) bottom left / 8px 1px no-repeat,
        linear-gradient(var(--ko-accent), var(--ko-accent)) bottom left / 1px 8px no-repeat,
        /* bottom-right */
        linear-gradient(var(--ko-accent), var(--ko-accent)) bottom right / 8px 1px no-repeat,
        linear-gradient(var(--ko-accent), var(--ko-accent)) bottom right / 1px 8px no-repeat;
      opacity: 0.6;
      z-index: 3;
    }

    .ko-setlist.collapsed { transform: translate(calc(100% - 42px), -50%); }
    .ko-plain.collapsed   { transform: translate(calc(-100% + 42px), -50%); }
    .ko-plain.hidden      { display: none; }

    /* ==== TAB — rack handle. Square edges, rivet dots, vertical label. ==== */
    .ko-tab {
      position: absolute;
      top: 50%;
      margin-top: -44px;
      width: 38px;
      height: 88px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      background: ${THEME.tabBackground};
      color: ${THEME.tabTextColor};
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 13px;
      line-height: 1;
      letter-spacing: 0.15em;
      transition: transform 0.2s, filter 0.2s;
      box-shadow: ${THEME.tabShadow};
      border: 1px solid rgba(255, 138, 46, 0.35);
      z-index: 2;
    }
    /* Small orange LED at the top of the tab — "EXPAND" indicator. */
    .ko-tab::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ko-accent);
      box-shadow: 0 0 6px var(--ko-accent), inset 0 0 2px #fff6e5;
      animation: ko-blink 2.6s ease-in-out infinite;
    }
    @keyframes ko-blink {
      0%, 78%, 100% { opacity: 1; }
      80%, 94%      { opacity: 0.18; }
    }
    .ko-tab:hover { filter: brightness(1.2); transform: scale(1.04); }
    .ko-setlist .ko-tab { left: -38px; border-right: none; border-radius: 3px 0 0 3px; }
    .ko-plain   .ko-tab { right: -38px; border-left: none; border-radius: 0 3px 3px 0; }

    /* ==== HEADER — console identity block ==== */
    .ko-head {
      padding: 18px 20px 12px;
      position: relative;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(71, 150, 255, 0.14);
    }
    /* Vertical marginalia strip like the stream's "DESIGNED BY IKONIA / SINCE 2008".
       Sits on the outer edge of the panel. */
    .ko-setlist .ko-head::before {
      content: 'VESPERBELL · VRF.2026 · UNIT/02';
      position: absolute;
      right: -2px;
      top: 18px;
      bottom: 18px;
      writing-mode: vertical-rl;
      font-family: var(--ko-font-serif);
      font-size: 7.5px;
      font-weight: 400;
      letter-spacing: 0.4em;
      color: var(--ko-accent);
      opacity: 0.55;
      text-transform: uppercase;
      pointer-events: none;
    }
    .ko-crest {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .ko-crest-mark {
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 16px;
      color: var(--ko-accent);
      line-height: 0.9;
      transform: translateY(-1px);
      text-shadow: 0 0 8px rgba(255, 138, 46, 0.55);
    }
    .ko-crest-label {
      font-family: var(--ko-font-serif);
      font-size: 9px;
      font-weight: 400;
      letter-spacing: 0.2em;
      color: var(--ko-accent-ink);
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ko-crest-label::after {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d971;
      box-shadow: 0 0 6px rgba(52, 217, 113, 0.7);
      animation: ko-blink 3.4s ease-in-out infinite;
      animation-delay: 0.8s;
    }
    .ko-title {
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-style: italic;
      font-size: 36px;
      line-height: 0.92;
      color: var(--ko-ink);
      margin: 8px 0 6px;
      letter-spacing: -0.015em;
      /* subtle amber stroke ghost */
      text-shadow: 0 0 12px rgba(71, 150, 255, 0.08);
    }
    .ko-subtitle {
      font-family: var(--ko-font-serif);
      font-size: 8.5px;
      font-weight: 400;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-subtitle::before {
      content: '▌';
      color: var(--ko-accent);
      font-size: 11px;
      letter-spacing: 0;
      flex: 0 0 auto;
      opacity: 0.85;
    }

    /* ==== NOW PLAYING — MASTER OUT module ==== */
    .ko-now {
      margin: 10px 16px 14px;
      padding: 14px 14px 12px;
      background: ${THEME.nowCardBackground};
      border: ${THEME.nowCardBorder};
      border-radius: 3px;
      box-shadow: ${THEME.nowCardShadow};
      position: relative;
    }
    /* "MASTER OUT" micro-label across the top of the module. */
    .ko-now::before {
      content: 'MASTER · OUT';
      position: absolute;
      top: -7px;
      left: 12px;
      padding: 0 7px;
      background: linear-gradient(180deg, #12192a 0%, #0d131f 100%);
      font-family: var(--ko-font-serif);
      font-size: 8.5px;
      font-weight: 400;
      letter-spacing: 0.3em;
      color: var(--ko-accent);
      text-shadow: 0 0 6px rgba(255, 138, 46, 0.45);
    }
    /* LIVE indicator dot top-right of module */
    .ko-now::after {
      content: '';
      position: absolute;
      top: 12px; right: 12px;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #ff4560;
      box-shadow: 0 0 8px rgba(255, 69, 96, 0.75), 0 0 2px rgba(255, 255, 255, 0.6);
      animation: ko-live-pulse 1.3s ease-in-out infinite;
    }
    @keyframes ko-live-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.45; transform: scale(0.82); }
    }
    .ko-now-title {
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 20px;
      line-height: 1.12;
      color: var(--ko-ink);
      margin: 6px 0 2px;
      letter-spacing: -0.008em;
      word-break: keep-all;
      overflow-wrap: normal;
      /* subtle signal glow */
      text-shadow: 0 0 14px rgba(71, 150, 255, 0.18);
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), var(--ko-font-display), serif;
      font-size: 12.5px;
      font-weight: 500;
      line-height: 1.35;
      color: var(--ko-ink-soft);
      margin: 0 0 4px;
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
      font-family: var(--ko-font-serif);
      font-size: 10px;
      font-weight: 400;
      color: var(--ko-accent-ink);
      margin-bottom: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    /* The progress bar — an LED ladder built from a repeating gradient
       atop the fill. Unlike a smooth bar, this reads as discrete segments. */
    .ko-now-progress {
      position: relative;
      height: 8px;
      background: rgba(14, 20, 32, 0.8);
      border: 1px solid rgba(71, 150, 255, 0.22);
      border-radius: 1px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: ${THEME.nowFillGradient};
      box-shadow: 0 0 8px rgba(255, 138, 46, 0.65);
      transition: width 0.3s linear;
    }
    /* LED-segment overlay — a repeating dark bar over the fill so it reads
       as a discrete 20-segment ladder instead of a smooth bar. */
    .ko-now-progress::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        90deg,
        transparent 0, transparent 9px,
        rgba(14, 20, 32, 0.9) 9px, rgba(14, 20, 32, 0.9) 11px
      );
      pointer-events: none;
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-family: var(--ko-font-serif);
      font-size: 10.5px;
      font-weight: 400;
      color: var(--ko-accent);
      letter-spacing: 0.12em;
      font-variant-numeric: tabular-nums;
    }
    .ko-now-times span::before {
      content: '▸ ';
      opacity: 0.55;
    }

    /* ==== CTRLS — illuminated rack toggles ==== */
    .ko-ctrls {
      display: flex;
      gap: 6px;
      margin: 0 16px 14px;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 7px;
      background: ${THEME.ctrlBackground};
      border: 1px solid rgba(71, 150, 255, 0.2);
      border-radius: 2px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      position: relative;
      transition: border-color 0.15s, background 0.15s;
    }
    .ko-ctrl:hover { border-color: rgba(255, 138, 46, 0.4); }
    /* Tiny LED at the top-left of every ctrl button. Off by default, lit
       when .is-on. Becomes amber glowing for skip-talking ("active"),
       red for lyrics-hidden, white/off for offset (which has its numeric). */
    .ko-ctrl::before {
      content: '';
      position: absolute;
      top: 5px; left: 6px;
      width: 4px; height: 4px;
      border-radius: 50%;
      background: rgba(71, 150, 255, 0.22);
      transition: box-shadow 0.2s, background 0.2s;
    }
    .ko-ctrl.is-on {
      border-color: var(--ko-accent);
      background: linear-gradient(180deg, rgba(255,138,46,0.18), rgba(255,138,46,0.06));
    }
    .ko-ctrl.is-on::before {
      background: var(--ko-accent);
      box-shadow: 0 0 5px var(--ko-accent), 0 0 10px rgba(255, 138, 46, 0.5);
    }
    .ko-ctrl-label {
      font-family: var(--ko-font-serif);
      font-size: 8.5px;
      font-weight: 400;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-ctrl.is-on .ko-ctrl-label { color: var(--ko-accent-ink); }

    .ko-offset {
      font-family: var(--ko-font-serif);
      font-size: 10px;
      font-weight: 400;
      color: var(--ko-accent);
      letter-spacing: 0.08em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ==== CHANNEL STRIPS (setlist rows) ====
       Each row is a channel strip. Left column holds the channel number +
       status LED. Right column has the title, artist, time, and a thin LED
       progress ladder below the meta line that doubles as a per-song
       progress bar when the song is active. Rows in PLAYED / LIVE / QUEUED
       states render differently. */
    .ko-list-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 18px 6px;
      font-family: var(--ko-font-serif);
      font-size: 7.5px;
      font-weight: 400;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ko-inkSoft, var(--ko-ink-soft));
      opacity: 0.65;
      border-top: 1px dashed rgba(71, 150, 255, 0.15);
      margin-top: 4px;
    }
    .ko-list-head span { display: flex; gap: 6px; align-items: center; }
    .ko-list-head span::before {
      content: '';
      width: 4px; height: 4px;
      background: var(--ko-accent);
      opacity: 0.6;
    }
    .ko-list {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 6px 10px 18px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 138, 46, 0.3) transparent;
    }
    .ko-list::-webkit-scrollbar { width: 4px; }
    .ko-list::-webkit-scrollbar-thumb {
      background: rgba(255, 138, 46, 0.35);
      border-radius: 0;
    }
    .ko-row {
      display: grid;
      grid-template-columns: 36px 1fr;
      gap: 10px;
      padding: 8px 10px 10px;
      margin: 2px 0;
      border-radius: 2px;
      cursor: pointer;
      position: relative;
      transition: background 0.2s, transform 0.2s;
      /* faint bottom rule separating channel strips */
      border-bottom: 1px solid rgba(71, 150, 255, 0.06);
    }
    .ko-row:hover {
      background: ${THEME.rowHoverBg};
    }
    .ko-row.active {
      background: ${THEME.rowActiveBg};
      box-shadow: inset 2px 0 0 ${THEME.rowActiveBar}, inset 0 0 30px rgba(255, 138, 46, 0.06);
    }
    /* Left column: channel number + status label + LED dot */
    .ko-row-col-l {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      padding-top: 1px;
    }
    .ko-row-idx {
      font-family: var(--ko-font-serif);
      font-weight: 400;
      font-size: 14px;
      color: var(--ko-accent);
      line-height: 1;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }
    .ko-row-idx::before {
      content: 'CH';
      font-size: 8px;
      letter-spacing: 0.16em;
      opacity: 0.6;
      margin-right: 3px;
    }
    .ko-row-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(71, 150, 255, 0.25);
      transition: background 0.25s, box-shadow 0.25s;
      margin-top: 2px;
    }
    .ko-row.played .ko-row-dot {
      background: #34d971;
      box-shadow: 0 0 4px rgba(52, 217, 113, 0.55);
    }
    .ko-row.active .ko-row-dot {
      background: var(--ko-accent);
      box-shadow: 0 0 6px var(--ko-accent), 0 0 12px rgba(255, 138, 46, 0.55);
      animation: ko-live-pulse 1.3s ease-in-out infinite;
    }
    .ko-row.active .ko-row-idx { color: var(--ko-accent-ink); }
    .ko-row.played .ko-row-idx { color: var(--ko-ink-soft); opacity: 0.7; }
    .ko-row.no-sync:not(.active):not(.played) .ko-row-idx { color: var(--ko-gold); opacity: 0.75; }

    .ko-row-body { min-width: 0; }
    .ko-row-title {
      font-family: var(--ko-font-display);
      font-weight: 500;
      font-size: 13.5px;
      line-height: 1.2;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.003em;
    }
    .ko-row.active .ko-row-title { color: var(--ko-ink); font-weight: 600; }
    .ko-row.played .ko-row-title { color: var(--ko-ink-soft); font-weight: 400; }
    .ko-row-meta {
      display: flex;
      gap: 10px;
      margin-top: 2px;
      font-family: var(--ko-font-serif);
      font-size: 8.5px;
      font-weight: 400;
      color: var(--ko-ink-soft);
      letter-spacing: 0.1em;
      white-space: nowrap;
      overflow: hidden;
    }
    .ko-row-time {
      color: var(--ko-accent);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
      opacity: 0.8;
    }
    .ko-row.played .ko-row-time { color: var(--ko-ink-soft); opacity: 0.55; }
    .ko-row-artist {
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      opacity: 0.8;
    }
    /* The per-row LED ladder — the signature feature. Thin horizontal LED
       segment bar below the meta line, showing per-song progress. Each row
       has its own ladder; the currently-playing row's ladder fills in real
       time, played rows are full (dim green), queued rows are empty. */
    .ko-row-ladder {
      position: relative;
      height: 3px;
      margin-top: 5px;
      background: rgba(14, 20, 32, 0.75);
      border-top: 1px solid rgba(71, 150, 255, 0.12);
      overflow: hidden;
    }
    .ko-row-ladder-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: linear-gradient(90deg, var(--ko-accent) 0%, var(--ko-accent-ink) 100%);
      box-shadow: 0 0 4px rgba(255, 138, 46, 0.7);
      transition: width 0.25s linear, background 0.3s, box-shadow 0.3s;
    }
    .ko-row.played .ko-row-ladder-fill {
      width: 100% !important;
      background: #27754a;
      box-shadow: none;
      opacity: 0.6;
    }
    /* Segmented overlay — turns smooth fill into discrete LEDs. 14px period
       reads as ~20 segments across a 280px row. */
    .ko-row-ladder::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        90deg,
        transparent 0, transparent 12px,
        rgba(14, 20, 32, 0.88) 12px, rgba(14, 20, 32, 0.88) 14px
      );
      pointer-events: none;
    }
    .ko-row.no-sync .ko-row-title::after {
      content: '  ◦ UNSYNCED';
      color: var(--ko-gold);
      opacity: 0.7;
      font-size: 7.5px;
      letter-spacing: 0.18em;
      font-weight: 400;
    }

    /* ==== PLAIN-LYRICS PANEL (left pillarbox) ==== */
    .ko-plain .ko-title { font-size: 22px; }
    /* Mirror the right-panel marginalia on this panel's outer edge too. */
    .ko-plain .ko-head::before {
      content: 'UNSYNCED · PLAIN · TRANSCRIPT';
      position: absolute;
      left: -2px;
      top: 18px;
      bottom: 18px;
      writing-mode: vertical-lr;
      transform: rotate(180deg);
      font-family: var(--ko-font-serif);
      font-size: 7.5px;
      font-weight: 400;
      letter-spacing: 0.4em;
      color: var(--ko-accent);
      opacity: 0.55;
      text-transform: uppercase;
      pointer-events: none;
    }
    .ko-plain-body {
      overflow-y: auto;
      padding: 10px 20px 20px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 138, 46, 0.3) transparent;
    }
    .ko-plain-body::-webkit-scrollbar { width: 4px; }
    .ko-plain-body::-webkit-scrollbar-thumb {
      background: rgba(255, 138, 46, 0.35);
    }
    .ko-plain-section { margin-bottom: 22px; }
    .ko-plain-label {
      font-family: var(--ko-font-serif);
      font-size: 8px;
      font-weight: 400;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--ko-accent);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ko-plain-label::before {
      content: '▌';
      color: var(--ko-accent);
      font-size: 10px;
      letter-spacing: 0;
    }
    .ko-plain-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, rgba(255, 138, 46, 0.4), transparent);
    }
    .ko-plain-en {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 400;
      font-size: 13.5px;
      line-height: 1.55;
      color: var(--ko-ink);
    }
    .ko-plain-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      font-size: 13px;
      line-height: 1.85;
      color: var(--ko-ink);
      opacity: 0.85;
    }
    .ko-plain-line  { margin-bottom: 3px; }
    .ko-plain-blank { height: 10px; }

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
  `);
  document.body.appendChild(lyrics);

  // --- Setlist row rendering ---
  const listEl = document.getElementById('ko-list');
  // Channel-strip rendering. Each row has:
  //   - Left col: "CH NN" label + status-LED dot
  //   - Right col: song title, artist + time meta line, LED progress ladder
  // The per-row ladder fills in real time via a separate tick below.
  const rowsHeadHTML = `
    <div class="ko-list-head">
      <span>SIGNAL CHAIN · 20 CH</span>
      <span>FADER</span>
    </div>`;
  const rowsHTML = window.__setlist.map((song, i) => {
    const noSync = !song.lrcId ? ' no-sync' : '';
    const num = String(i + 1).padStart(2, '0');
    return `<div class="ko-row${noSync}" data-idx="${i}">
      <div class="ko-row-col-l">
        <div class="ko-row-idx">${num}</div>
        <div class="ko-row-dot"></div>
      </div>
      <div class="ko-row-body">
        <div class="ko-row-title">${escHTML(song.name)}</div>
        <div class="ko-row-meta">
          <span class="ko-row-time">${escHTML(song.t)}</span>
          <span class="ko-row-artist">${escHTML(song.artist)}</span>
        </div>
        <div class="ko-row-ladder"><div class="ko-row-ladder-fill"></div></div>
      </div>
    </div>`;
  }).join('');
  setHTML(listEl, rowsHeadHTML + rowsHTML);

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

  // ==========================================================================
  // SIGNATURE FEATURE — Per-channel LED ladder + status progression.
  //
  // Every channel strip in the setlist carries its own LED progress ladder.
  // As the stream plays through, each row fills its ladder in real time while
  // the song is active, then locks at 100% in a dim-green "PLAYED" state after
  // the song ends, while queued rows stay empty. The net effect is the rack
  // visually filling up across the 20-channel signal chain — a "fuel gauge"
  // for the whole stream that no generic karaoke overlay carries.
  //
  // Structured as its own polling loop (guarded by MY_GEN + per-row cached
  // width) so the skeleton's locked tick isn't touched. ~220ms cadence is
  // smooth enough for progress bars without flooding YouTube's DOM.
  // ==========================================================================
  const rowEls = Array.from(document.querySelectorAll('.ko-row'));
  const ladderFills = rowEls.map(r => r.querySelector('.ko-row-ladder-fill'));
  // Per-row cached width strings and class state, for DOM-write guards.
  const lastRowFill  = new Array(rowEls.length).fill('');
  const lastRowState = new Array(rowEls.length).fill('');  // 'played' | 'active' | 'queued'
  const LADDER_TICK = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(LADDER_TICK); return; }
    const v = document.querySelector('video');
    if (!v) return;
    const t = v.currentTime;
    if (!isFinite(t)) return;
    const sl = window.__setlist;
    for (let i = 0; i < rowEls.length; i++) {
      const s = sl[i];
      if (!s) continue;
      let state, fillW;
      if (t >= s.end) {
        state = 'played';
        fillW = '100%';
      } else if (t >= s.s) {
        state = 'active';
        const dur = s.dur || (s.end - s.s) || 1;
        const pct = Math.max(0, Math.min(100, (t - s.s) / dur * 100));
        fillW = pct.toFixed(1) + '%';
      } else {
        state = 'queued';
        fillW = '0%';
      }
      if (state !== lastRowState[i]) {
        rowEls[i].classList.toggle('played', state === 'played');
        lastRowState[i] = state;
      }
      // CSS forces 100% width on .played via !important so we don't have to
      // fight the transition — we only write to queued/active rows.
      if (state !== 'played' && fillW !== lastRowFill[i]) {
        ladderFills[i].style.width = fillW;
        lastRowFill[i] = fillW;
      }
    }
  }, 220);

})();
