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
    streamTag:       'BELL.SYS · TX/24',
    crestSymbol:     '⌖',
    streamTitle:     '<span class="ko-title-kanji">恋</span><span class="ko-title-rom">KOI</span>',
    streamSubtitle:  'evening transmission · vesperbell',
    setlistTabIcon:  '⌖',
    plainTag:        'PLAIN-TX BUFFER',
    plainSubtitle:   'untimed · raw lyric feed',
    plainTabIcon:    '≡',

    // Cool industrial typography — modern grotesk display + variable serif
    // accent for the now-card title (gives the love-themed song titles
    // warmth against the tactical chrome) + clean modern JP gothic that
    // matches Yomi's stream readouts + tactical mono for numerals.
    fontsHref:   'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=M+PLUS+1:wght@400;500;700;900&family=Geist+Mono:wght@400;500;700&display=swap',
    fontDisplay: '"Manrope", system-ui, sans-serif',
    fontBody:    '"Manrope", system-ui, sans-serif',
    fontSerif:   '"Fraunces", "Manrope", system-ui, serif',
    fontJP:      '"M PLUS 1", "Manrope", system-ui, sans-serif',

    // ----- Color palette — sampled from Yomi's design + her stream graphics -----
    // pale industrial gray walls, white-cream panels, cobalt blue (her hair
    // streaks/sleeves), amber (her single eye + dangling earring), navy ink
    cream:      '#F4F2EC',
    accent:     '#E89A35',
    accentDeep: '#1F3A7A',
    accentInk:  '#0F1A33',
    ink:        '#161B26',
    inkSoft:    '#5C6373',
    gold:       '#C77919',

    panelBackground: `
      radial-gradient(ellipse 95% 60% at 50% 110%, rgba(31, 58, 122, 0.07), transparent 55%),
      radial-gradient(ellipse 110% 70% at 50% -10%, rgba(232, 154, 53, 0.08), transparent 60%),
      linear-gradient(178deg, rgba(248, 246, 240, 0.96) 0%, rgba(238, 236, 230, 0.94) 100%)
    `,
    panelBorder:      '1px solid rgba(22, 27, 38, 0.18)',
    panelRadius:      '18px',
    panelShadow:      '0 22px 48px -28px rgba(15, 26, 51, 0.55), 0 1px 0 rgba(255,255,255,0.6) inset',

    tabBackground: 'linear-gradient(180deg, #2A4A8C 0%, #1F3A7A 60%, #16285A 100%)',
    tabTextColor:  '#F4F2EC',
    tabShadow:     '0 6px 18px -6px rgba(15, 26, 51, 0.55)',

    nowCardBackground: 'linear-gradient(168deg, rgba(252, 250, 244, 0.98) 0%, rgba(240, 238, 230, 0.95) 100%)',
    nowCardBorder:     '1px solid rgba(31, 58, 122, 0.16)',
    nowCardShadow:     '0 8px 18px -12px rgba(15, 26, 51, 0.32), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(31, 58, 122, 0.08)',
    nowFillGradient:   'linear-gradient(90deg, #1F3A7A 0%, #2A4A8C 50%, #E89A35 100%)',

    rowHoverBg:   'rgba(31, 58, 122, 0.06)',
    rowActiveBg:  'linear-gradient(100deg, rgba(31, 58, 122, 0.14), rgba(232, 154, 53, 0.08))',
    rowActiveBar: '#E89A35',

    ctrlBackground: 'rgba(252, 250, 244, 0.7)',

    lyricColorEN:  '#161B26',
    lyricColorJP:  '#161B26',
    lyricHazeBlur: 'blur(10px) saturate(1.05)',
    lyricHazeTint: 'rgba(244, 242, 236, 0.20)',
    lyricHazePad:  '170px',
    lyricShadowEN: '0 0 14px rgba(244, 242, 236, 0.92), 0 0 4px rgba(244, 242, 236, 0.7)',
    lyricShadowJP: '0 0 14px rgba(244, 242, 236, 0.92), 0 0 4px rgba(244, 242, 236, 0.7)',
  };

  // ==========================================================================
  // SIGNATURE FEATURE — Per-song "harmonic band" classification
  // Each transmission gets a band (genre cluster) that retunes the panel's
  // accent, LED chroma, lyric-haze warmth, and lyric ink color. The setlist
  // becomes a tuned broadcast log. Plus the bell-resonance ring on the
  // now-card pulses on every lyric line change (see lyric-strike below).
  // ==========================================================================
  const HARMONIC_BANDS = {
    A: { code: 'VOC', name: 'VOCALOID',    accent: '#E89A35', deep: '#1F3A7A', warm: 'rgba(31, 58, 122, 0.10)',  led: '#6FB7F0' },
    B: { code: 'TRX', name: 'TRANSMIT',    accent: '#C77919', deep: '#1F3A7A', warm: 'rgba(232, 154, 53, 0.10)', led: '#E89A35' },
    C: { code: 'BAL', name: 'BALLAD',      accent: '#A35C8A', deep: '#5A2549', warm: 'rgba(163, 92, 138, 0.10)', led: '#D88BB8' },
    D: { code: 'IDL', name: 'IDOL',        accent: '#E47AA0', deep: '#A33968', warm: 'rgba(228, 122, 160, 0.10)', led: '#F5B0CC' },
  };
  // Setlist idx (1-based) → band key. Handcrafted from the actual song genres.
  const SONG_BAND = {
     1:'A',  2:'A',  3:'B',  4:'A',  5:'A',  6:'A',  7:'A',  8:'A',  9:'A',
    10:'B', 11:'B', 12:'B', 13:'B', 14:'C', 15:'B', 16:'B', 17:'C', 18:'B',
    19:'C', 20:'D', 21:'C', 22:'C', 23:'C', 24:'D'
  };
  const bandFor = idx1 => HARMONIC_BANDS[SONG_BAND[idx1] || 'B'];
  const txCode  = idx1 => 'TX-' + String(idx1).padStart(3, '0');

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
    // 6 stream-derived chunk colors, all dark enough to read on the cream
    // haze. Sampled from Yomi's character + stream graphics:
    //   0 cobalt  — her hair streaks / sleeve gradient (deep)
    //   1 amber   — her single eye + dangling earring (deep)
    //   2 wine    — love-theme accent (恋 / VESPERBELL evening)
    //   3 teal    — cool industrial midtone (her outfit shadows)
    //   4 moss    — warm contrast for grouping verbs/aspects
    //   5 char    — near-black ink (her hair root tones / outfit black)
    colors: ['#1F3A7A', '#C77919', '#7A2F4D', '#2D5969', '#3F5538', '#1F232E'],
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
    /* @property registration so per-song accent shifts can transition smoothly */
    @property --ko-band-accent { syntax: '<color>'; inherits: true; initial-value: ${THEME.accent}; }
    @property --ko-band-deep   { syntax: '<color>'; inherits: true; initial-value: ${THEME.accentDeep}; }
    @property --ko-band-led    { syntax: '<color>'; inherits: true; initial-value: ${THEME.accent}; }
    @property --ko-band-warm   { syntax: '<color>'; inherits: true; initial-value: rgba(232, 154, 53, 0.10); }

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
      --ko-font-mono:    "Geist Mono", ui-monospace, "SF Mono", monospace;

      /* Per-band channel — set inline by JS on song change, transitions smoothly */
      --ko-band-accent: ${THEME.accent};
      --ko-band-deep:   ${THEME.accentDeep};
      --ko-band-led:    ${THEME.accent};
      --ko-band-warm:   rgba(232, 154, 53, 0.10);

      transition:
        --ko-band-accent 0.9s cubic-bezier(.4,0,.2,1),
        --ko-band-deep   0.9s cubic-bezier(.4,0,.2,1),
        --ko-band-led    0.9s cubic-bezier(.4,0,.2,1),
        --ko-band-warm   0.9s cubic-bezier(.4,0,.2,1);
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ====================== PANEL ====================== */
    .ko-panel {
      position: absolute;
      width: 340px;
      max-height: 86vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(22px) saturate(1.05);
      -webkit-backdrop-filter: blur(22px) saturate(1.05);
      border: ${THEME.panelBorder};
      border-radius: ${THEME.panelRadius};
      box-shadow: ${THEME.panelShadow};
      color: var(--ko-ink);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.5s cubic-bezier(.77,0,.18,1);
    }
    /* Subtle hairline grid texture on panel — reads like graph paper / blueprint */
    .ko-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right,  rgba(22,27,38,0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(22,27,38,0.035) 1px, transparent 1px);
      background-size: 22px 22px;
      pointer-events: none;
      mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
      opacity: 0.7;
    }
    /* Cobalt edge stripe on the inside of the panel — left for setlist, right for plain */
    .ko-setlist::after {
      content: '';
      position: absolute;
      left: 0; top: 8%; bottom: 8%; width: 3px;
      background: linear-gradient(180deg, transparent 0%, var(--ko-band-deep) 25%, var(--ko-band-deep) 75%, transparent 100%);
      opacity: 0.55;
    }
    .ko-plain::after {
      content: '';
      position: absolute;
      right: 0; top: 8%; bottom: 8%; width: 3px;
      background: linear-gradient(180deg, transparent 0%, var(--ko-band-deep) 25%, var(--ko-band-deep) 75%, transparent 100%);
      opacity: 0.55;
    }

    .ko-setlist.collapsed { transform: translate(calc(100% - 40px), -50%); }
    .ko-plain.collapsed   { transform: translate(calc(-100% + 40px), -50%); }
    .ko-plain.hidden      { display: none; }

    /* Vertical edge labels — mimics Yomi's "DESIGNED BY ROURUA / SINCE 2020"
       tactical readouts running vertically along her panel edges. */
    .ko-edgelabel {
      position: absolute;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      font-family: var(--ko-font-mono);
      font-size: 8.5px;
      font-weight: 500;
      letter-spacing: 0.45em;
      color: var(--ko-ink-soft);
      opacity: 0.55;
      text-transform: uppercase;
      white-space: nowrap;
      pointer-events: none;
      z-index: 1;
    }
    .ko-setlist .ko-edgelabel-l { top: 22px; left: 10px; bottom: 22px; }
    .ko-setlist .ko-edgelabel-r { top: 22px; right: 10px; bottom: 22px; transform: rotate(0deg); writing-mode: vertical-rl; }
    .ko-plain   .ko-edgelabel-l { top: 22px; left: 10px; bottom: 22px; }
    .ko-plain   .ko-edgelabel-r { top: 22px; right: 10px; bottom: 22px; transform: rotate(0deg); writing-mode: vertical-rl; }

    /* ====================== TAB ====================== */
    .ko-tab {
      position: absolute;
      top: 50%;
      margin-top: -42px;
      width: 38px;
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
      font-weight: 800;
      font-size: 18px;
      line-height: 1;
      transition: transform 0.2s, filter 0.2s;
      box-shadow: ${THEME.tabShadow}, inset 0 1px 0 rgba(255,255,255,0.18);
      z-index: 2;
      position: relative;
      overflow: hidden;
    }
    /* Amber LED stripe down the tab — matches stream's status LED motif */
    .ko-tab::before {
      content: '';
      position: absolute;
      top: 12px; bottom: 12px;
      width: 2px;
      background: var(--ko-band-led);
      box-shadow: 0 0 6px var(--ko-band-led), 0 0 2px var(--ko-band-led);
      opacity: 0.85;
    }
    .ko-setlist .ko-tab::before { left: 5px; }
    .ko-plain   .ko-tab::before { right: 5px; }
    .ko-tab:hover { filter: brightness(1.12); transform: scale(1.04); }
    .ko-setlist .ko-tab { left: -36px; border-radius: 14px 0 0 14px; }
    .ko-plain   .ko-tab { right: -36px; border-radius: 0 14px 14px 0; }

    /* ====================== HEAD ====================== */
    .ko-head {
      padding: 22px 24px 12px;
      position: relative;
      flex-shrink: 0;
    }
    /* Tactical readout strip across the very top — mimics stream's bottom readouts */
    .ko-head::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 22px;
      background:
        linear-gradient(180deg, rgba(31,58,122,0.06) 0%, transparent 100%),
        repeating-linear-gradient(90deg, transparent 0 14px, rgba(22,27,38,0.06) 14px 15px);
      border-bottom: 1px dashed rgba(22,27,38,0.10);
    }
    .ko-crest {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 14px;
      margin-bottom: 12px;
      font-family: var(--ko-font-mono);
    }
    .ko-crest-mark {
      font-family: var(--ko-font-display);
      font-weight: 800;
      font-size: 18px;
      color: var(--ko-band-accent);
      line-height: 1;
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--ko-band-accent);
      border-radius: 50%;
      transform: translateY(0);
      box-shadow: 0 0 8px color-mix(in srgb, var(--ko-band-accent) 35%, transparent);
    }
    .ko-crest-label {
      font-family: var(--ko-font-mono);
      font-size: 9.5px;
      font-weight: 500;
      letter-spacing: 0.22em;
      color: var(--ko-accent-ink);
      text-transform: uppercase;
    }
    .ko-crest-led {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }
    .ko-crest-led i {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--ko-ink-soft);
      opacity: 0.35;
    }
    .ko-crest-led i:nth-child(1) { background: var(--ko-band-led); opacity: 0.95; box-shadow: 0 0 4px var(--ko-band-led); }
    .ko-crest-led i:nth-child(2) { background: var(--ko-band-deep); opacity: 0.85; }
    .ko-crest-led i:nth-child(3) { background: var(--ko-ink-soft); opacity: 0.4; }
    .ko-crest-led i:nth-child(4) { background: var(--ko-ink-soft); opacity: 0.4; }

    .ko-title {
      font-family: var(--ko-font-display);
      font-weight: 800;
      font-size: 38px;
      line-height: 0.95;
      color: var(--ko-ink);
      margin: 4px 0 8px;
      letter-spacing: -0.02em;
      display: flex;
      align-items: baseline;
      gap: 14px;
    }
    .ko-title-kanji {
      font-family: var(--ko-font-jp);
      font-weight: 900;
      font-size: 56px;
      line-height: 0.85;
      color: var(--ko-band-deep);
      letter-spacing: -0.02em;
      position: relative;
    }
    .ko-title-kanji::after {
      content: '';
      position: absolute;
      left: -4px; right: -4px; bottom: -4px;
      height: 2px;
      background: linear-gradient(90deg, var(--ko-band-accent), transparent);
    }
    .ko-title-rom {
      font-family: var(--ko-font-mono);
      font-weight: 500;
      font-size: 13px;
      letter-spacing: 0.5em;
      color: var(--ko-ink-soft);
      text-transform: uppercase;
    }
    .ko-subtitle {
      font-family: var(--ko-font-mono);
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-subtitle::before {
      content: '◢';
      color: var(--ko-band-accent);
      font-size: 7px;
    }
    .ko-subtitle::after {
      content: '';
      height: 1px;
      flex: 1;
      background: linear-gradient(90deg, var(--ko-ink-soft), transparent);
      opacity: 0.45;
    }

    /* ====================== NOW-PLAYING CARD ====================== */
    .ko-now {
      margin: 16px 22px 14px;
      padding: 14px 16px 14px;
      background: ${THEME.nowCardBackground};
      border: ${THEME.nowCardBorder};
      border-radius: 12px;
      box-shadow: ${THEME.nowCardShadow};
      position: relative;
      overflow: hidden;
    }
    /* Cobalt corner-cut tactical brackets at all 4 corners */
    .ko-now::before, .ko-now::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      border: 1.5px solid var(--ko-band-deep);
      opacity: 0.45;
      pointer-events: none;
    }
    .ko-now::before {
      top: 4px; left: 4px;
      border-right: none;
      border-bottom: none;
    }
    .ko-now::after {
      bottom: 4px; right: 4px;
      border-left: none;
      border-top: none;
    }

    /* Header row inside now-card: TX-code + harmonic band + bell ring */
    .ko-now-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--ko-font-mono);
      font-size: 9px;
      font-weight: 500;
      color: var(--ko-ink-soft);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .ko-now-tx {
      color: var(--ko-band-accent);
      font-weight: 700;
      letter-spacing: 0.18em;
    }
    .ko-now-band {
      padding: 1px 6px;
      border: 1px solid var(--ko-band-deep);
      border-radius: 3px;
      color: var(--ko-band-deep);
      font-weight: 600;
      font-size: 8px;
      background: var(--ko-band-warm);
    }
    .ko-now-meta-spacer { flex: 1; }
    .ko-now-status {
      color: var(--ko-band-led);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .ko-now-status::before {
      content: '';
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--ko-band-led);
      box-shadow: 0 0 6px var(--ko-band-led);
      animation: ko-pulse 1.6s ease-in-out infinite;
    }
    @keyframes ko-pulse {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 1; }
    }

    .ko-now-title {
      font-family: var(--ko-font-serif);
      font-weight: 600;
      font-size: 23px;
      line-height: 1.1;
      color: var(--ko-ink);
      margin: 4px 0 4px;
      font-variation-settings: "opsz" 80;
      word-break: keep-all;
      overflow-wrap: normal;
      letter-spacing: -0.01em;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), var(--ko-font-display), serif;
      font-size: 12px;
      line-height: 1.4;
      color: var(--ko-ink-soft);
      margin: 0 0 8px;
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
      font-family: var(--ko-font-mono);
      font-size: 10px;
      font-weight: 500;
      color: var(--ko-band-deep);
      margin-bottom: 12px;
      letter-spacing: 0.06em;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ko-now-artist::before {
      content: 'SRC';
      font-size: 8px;
      padding: 1px 5px;
      background: rgba(22,27,38,0.06);
      color: var(--ko-ink-soft);
      border-radius: 2px;
      letter-spacing: 0.18em;
      font-weight: 600;
    }
    .ko-now-progress {
      position: relative;
      height: 4px;
      background: rgba(22,27,38,0.08);
      border-radius: 0;
      overflow: hidden;
    }
    /* Repeating tick marks on progress track — feels like a meter, not a bar */
    .ko-now-progress::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: repeating-linear-gradient(90deg, transparent 0 9px, rgba(22,27,38,0.10) 9px 10px);
      pointer-events: none;
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: linear-gradient(90deg, var(--ko-band-deep) 0%, var(--ko-band-accent) 100%);
      box-shadow: 0 0 8px color-mix(in srgb, var(--ko-band-accent) 50%, transparent);
      transition: width 0.3s linear;
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-family: var(--ko-font-mono);
      font-size: 9px;
      font-weight: 500;
      color: var(--ko-ink-soft);
      letter-spacing: 0.12em;
      font-variant-numeric: tabular-nums;
    }
    .ko-now-times span:first-child::before {
      content: '◀ ';
      color: var(--ko-band-accent);
    }
    .ko-now-times span:last-child::after {
      content: ' ▶';
      color: var(--ko-band-accent);
    }

    /* ====================== BELL RESONANCE RING ====================== */
    /* Floating circular sigil top-right of now-card — strikes on each lyric line */
    .ko-bell {
      position: absolute;
      top: -16px;
      right: -16px;
      width: 64px;
      height: 64px;
      pointer-events: none;
      z-index: 3;
    }
    .ko-bell svg { width: 100%; height: 100%; display: block; }
    .ko-bell .bell-bg {
      fill: ${THEME.cream};
      stroke: var(--ko-band-deep);
      stroke-width: 1;
      opacity: 0.95;
    }
    .ko-bell .bell-glyph {
      fill: var(--ko-band-deep);
    }
    .ko-bell .bell-ring {
      fill: none;
      stroke: var(--ko-band-accent);
      stroke-width: 1.5;
      transform-origin: center;
      transform-box: fill-box;
      opacity: 0;
    }
    .ko-bell.struck .bell-ring {
      animation: ko-bell-strike 1.6s cubic-bezier(.2,.7,.3,1) forwards;
    }
    @keyframes ko-bell-strike {
      0%   { opacity: 0.85; r: 16; stroke-width: 2; }
      100% { opacity: 0;    r: 38; stroke-width: 0.5; }
    }
    .ko-bell .bell-ring.delay { animation-delay: 0.3s; }

    /* ====================== CONTROLS ====================== */
    .ko-ctrls {
      display: flex;
      gap: 6px;
      margin: 0 22px 14px;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 8px;
      background: ${THEME.ctrlBackground};
      border: 1px solid rgba(22,27,38,0.14);
      border-radius: 4px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      position: relative;
      transition: background 0.15s, border-color 0.15s;
    }
    .ko-ctrl::before {
      content: '';
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--ko-ink-soft);
      opacity: 0.35;
      flex-shrink: 0;
      box-shadow: none;
      transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
    }
    .ko-ctrl:hover { background: rgba(252, 250, 244, 0.95); border-color: var(--ko-band-deep); }
    .ko-ctrl.is-on {
      background: var(--ko-band-warm);
      border-color: var(--ko-band-accent);
    }
    .ko-ctrl.is-on::before {
      background: var(--ko-band-led);
      opacity: 1;
      box-shadow: 0 0 6px var(--ko-band-led);
    }
    .ko-ctrl-label {
      font-family: var(--ko-font-mono);
      font-size: 8.5px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--ko-font-mono);
      font-size: 9.5px;
      font-weight: 600;
      color: var(--ko-band-deep);
      letter-spacing: 0.04em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ====================== SETLIST ROWS ====================== */
    .ko-list {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 16px 22px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(22,27,38,0.25) transparent;
    }
    .ko-list::-webkit-scrollbar { width: 5px; }
    .ko-list::-webkit-scrollbar-thumb {
      background: rgba(22,27,38,0.25);
      border-radius: 0;
    }
    /* Tactical "log" header before the rows */
    .ko-list-head {
      display: flex;
      gap: 8px;
      padding: 6px 10px 8px;
      margin-bottom: 4px;
      font-family: var(--ko-font-mono);
      font-size: 8px;
      font-weight: 500;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ko-ink-soft);
      border-bottom: 1px dashed rgba(22,27,38,0.18);
    }
    .ko-list-head-tx { color: var(--ko-band-accent); }
    .ko-list-head-spacer { flex: 1; }

    .ko-row {
      display: flex;
      align-items: stretch;
      gap: 0;
      padding: 0;
      margin: 1px 0;
      border-radius: 0;
      cursor: pointer;
      position: relative;
      transition: background 0.18s, transform 0.18s;
      border-bottom: 1px solid transparent;
    }
    .ko-row:not(:last-child) { border-bottom: 1px dotted rgba(22,27,38,0.10); }
    .ko-row:hover {
      background: ${THEME.rowHoverBg};
    }
    .ko-row.active {
      background: ${THEME.rowActiveBg};
    }
    .ko-row.active::before {
      content: '';
      position: absolute;
      left: -16px;
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      height: 8px;
      background: var(--ko-band-accent);
      box-shadow: 0 0 8px var(--ko-band-accent), 0 0 2px var(--ko-band-accent);
      animation: ko-row-pulse 1.4s ease-in-out infinite;
      border-radius: 50%;
    }
    @keyframes ko-row-pulse {
      0%, 100% { transform: translateY(-50%) scale(1); opacity: 1; }
      50%      { transform: translateY(-50%) scale(1.25); opacity: 0.7; }
    }
    .ko-row.active::after {
      content: '';
      position: absolute;
      left: 0; top: 6px; bottom: 6px;
      width: 2px;
      background: var(--ko-band-accent);
    }
    /* Left col — TX code + idx number stacked */
    .ko-row-tx {
      flex-shrink: 0;
      width: 44px;
      padding: 8px 6px 8px 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      border-right: 1px dashed rgba(22,27,38,0.12);
    }
    .ko-row-tx-code {
      font-family: var(--ko-font-mono);
      font-size: 8px;
      font-weight: 500;
      letter-spacing: 0.08em;
      color: var(--ko-ink-soft);
      opacity: 0.65;
    }
    .ko-row.active .ko-row-tx-code { color: var(--ko-band-accent); opacity: 1; }
    .ko-row-band-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ko-row-band-color, var(--ko-band-accent));
      box-shadow: 0 0 0 1px rgba(22,27,38,0.12);
      margin-top: 1px;
    }
    /* Right body */
    .ko-row-body {
      flex: 1;
      min-width: 0;
      padding: 8px 6px 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .ko-row-title {
      font-family: var(--ko-font-display);
      font-weight: 600;
      font-size: 13px;
      line-height: 1.25;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.005em;
    }
    .ko-row.active .ko-row-title { font-weight: 700; }
    .ko-row-meta {
      display: flex;
      gap: 8px;
      margin-top: 2px;
      font-family: var(--ko-font-mono);
      font-size: 8.5px;
      font-weight: 500;
      color: var(--ko-ink-soft);
      letter-spacing: 0.06em;
      white-space: nowrap;
      overflow: hidden;
    }
    .ko-row-time {
      color: var(--ko-band-deep);
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      flex-shrink: 0;
      letter-spacing: 0.04em;
    }
    .ko-row-artist {
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0.85;
    }
    /* .no-sync subtle muted state for rows without synced lyrics */
    .ko-row.no-sync .ko-row-title { color: rgba(22,27,38,0.50); font-style: italic; }
    .ko-row.no-sync .ko-row-time  { opacity: 0.55; }
    .ko-row.no-sync .ko-row-tx-code { opacity: 0.40; }
    .ko-row.no-sync .ko-row-band-dot { opacity: 0.40; }
    .ko-row.no-sync .ko-row-title::after {
      content: ' · plain';
      font-family: var(--ko-font-mono);
      font-size: 8px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--ko-gold);
      opacity: 0.85;
      font-style: normal;
      font-weight: 600;
    }

    /* ====================== PLAIN PANEL ====================== */
    .ko-plain .ko-title { font-size: 24px; }
    .ko-plain .ko-title-kanji { font-size: 30px; }
    .ko-plain .ko-title-rom { font-size: 11px; letter-spacing: 0.4em; }
    .ko-plain-body {
      overflow-y: auto;
      padding: 6px 24px 24px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(22,27,38,0.25) transparent;
    }
    .ko-plain-body::-webkit-scrollbar { width: 5px; }
    .ko-plain-body::-webkit-scrollbar-thumb { background: rgba(22,27,38,0.25); }
    .ko-plain-section { margin-bottom: 22px; }
    .ko-plain-label {
      font-family: var(--ko-font-mono);
      font-size: 8.5px;
      font-weight: 500;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ko-band-deep);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-plain-label::before {
      content: '◢';
      color: var(--ko-band-accent);
      font-size: 7px;
    }
    .ko-plain-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: repeating-linear-gradient(90deg, var(--ko-band-deep) 0 4px, transparent 4px 7px);
      opacity: 0.4;
    }
    .ko-plain-en {
      font-family: var(--ko-font-display);
      font-style: normal;
      font-weight: 400;
      font-size: 13px;
      line-height: 1.65;
      color: var(--ko-ink);
    }
    .ko-plain-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      font-size: 13px;
      line-height: 1.95;
      color: var(--ko-ink-soft);
    }
    .ko-plain-line  { margin-bottom: 2px; }
    .ko-plain-blank { height: 12px; }

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

      background: ${THEME.lyricHazeTint};
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

  // SVG bell sigil — sits on top-right of now-card, strikes per lyric line
  const BELL_SVG = `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle class="bell-bg" cx="32" cy="32" r="22"/>
      <circle class="bell-ring"       cx="32" cy="32" r="18"/>
      <circle class="bell-ring delay" cx="32" cy="32" r="18"/>
      <path class="bell-glyph" d="M32 21c-4.4 0-8 3.6-8 8v4l-2 4h20l-2-4v-4c0-4.4-3.6-8-8-8zm0-2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-2 19h4c0 1.1-.9 2-2 2s-2-.9-2-2z"/>
    </svg>`;

  const setlistPanel = document.createElement('div');
  setlistPanel.className = 'ko-panel ko-setlist';
  if (window.__karaokeCollapsed) setlistPanel.classList.add('collapsed');
  setHTML(setlistPanel, `
    <div class="ko-edgelabel ko-edgelabel-l">VESPERBELL · OVERLAY ROUTINE · BELL.SYS v1</div>
    <div class="ko-edgelabel ko-edgelabel-r">EVENING TRANSMISSION 24 · KOI</div>
    <div class="ko-tab" id="ko-setlist-tab" title="Collapse">${escHTML(THEME.setlistTabIcon)}</div>
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.streamTag)}</span>
        <span class="ko-crest-led"><i></i><i></i><i></i><i></i></span>
      </div>
      <div class="ko-title">${THEME.streamTitle}</div>
      <div class="ko-subtitle">${escHTML(THEME.streamSubtitle)}</div>
    </div>
    <div class="ko-now">
      <div class="ko-bell" id="ko-bell">${BELL_SVG}</div>
      <div class="ko-now-meta">
        <span class="ko-now-tx" id="ko-now-tx">TX-000</span>
        <span class="ko-now-band" id="ko-now-band">—</span>
        <span class="ko-now-meta-spacer"></span>
        <span class="ko-now-status">ON AIR</span>
      </div>
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
      <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
    </div>
    <div class="ko-ctrls">
      <div class="ko-ctrl" id="ko-skip-btn">
        <div class="ko-ctrl-label">Skip talk</div>
      </div>
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">Hide lyrics</div>
      </div>
    </div>
    <div class="ko-list-head">
      <span class="ko-list-head-tx">TX</span>
      <span>TRACK</span>
      <span class="ko-list-head-spacer"></span>
      <span>T+</span>
    </div>
    <div class="ko-list" id="ko-list"></div>
  `);
  root.appendChild(setlistPanel);

  const plainPanel = document.createElement('div');
  plainPanel.className = 'ko-panel ko-plain hidden';
  if (window.__karaokePlainCollapsed) plainPanel.classList.add('collapsed');
  setHTML(plainPanel, `
    <div class="ko-edgelabel ko-edgelabel-l">PLAIN-TX BUFFER</div>
    <div class="ko-edgelabel ko-edgelabel-r">RAW LYRIC FEED · UNTIMED</div>
    <div class="ko-tab" id="ko-plain-tab" title="Collapse">${escHTML(THEME.plainTabIcon)}</div>
    <div class="ko-head">
      <div class="ko-crest">
        <span class="ko-crest-mark">${escHTML(THEME.crestSymbol)}</span>
        <span class="ko-crest-label">${escHTML(THEME.plainTag)}</span>
        <span class="ko-crest-led"><i></i><i></i><i></i><i></i></span>
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
    const idx1 = i + 1;
    const band = bandFor(idx1);
    return `<div class="ko-row${noSync}" data-idx="${i}" style="--ko-row-band-color:${band.accent}">
      <div class="ko-row-tx">
        <div class="ko-row-tx-code">${txCode(idx1)}</div>
        <div class="ko-row-band-dot" title="${band.name}"></div>
      </div>
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

      // ---- Per-song harmonic band theming (signature feature) ----
      // Apply per-song accent palette by setting CSS custom properties on
      // both #karaoke-root and #ko-lyrics. The @property registrations make
      // these transitions interpolated rather than stepped.
      const idx1   = song ? song.idx : 0;
      const band   = song ? bandFor(idx1) : HARMONIC_BANDS.B;
      const apply  = (el) => {
        if (!el) return;
        el.style.setProperty('--ko-band-accent', band.accent);
        el.style.setProperty('--ko-band-deep',   band.deep);
        el.style.setProperty('--ko-band-led',    band.led);
        el.style.setProperty('--ko-band-warm',   band.warm);
      };
      apply(document.getElementById('karaoke-root'));
      apply(document.getElementById('ko-lyrics'));

      // Update TX code + band label inside now-card
      const txEl   = document.getElementById('ko-now-tx');
      const bandEl = document.getElementById('ko-now-band');
      if (txEl)   txEl.textContent   = song ? txCode(idx1) : 'TX-000';
      if (bandEl) bandEl.textContent = song ? `${band.code} · ${band.name}` : '—';

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
        const wasNewLine = (lineIdx !== curLineIdx) && lineIdx >= 0 && showText;
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
        // Bell-resonance strike on each new lyric line — re-trigger by
        // toggling the .struck class. Restart the animation by removing,
        // forcing reflow, then re-adding.
        if (wasNewLine) {
          const bell = document.getElementById('ko-bell');
          if (bell) {
            bell.classList.remove('struck');
            void bell.offsetWidth;  // reflow to restart animation
            bell.classList.add('struck');
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
