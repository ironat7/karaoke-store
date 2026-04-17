// ============================================================================
// KARAOKE OVERLAY — DECO*27「ラビットホール」feat. 初音ミク (2023)
// ----------------------------------------------------------------------------
// Concept: the card IS a Windows-98-era kawaii installer popup titled
// "Rabbit_Hole.exe" — the MV literally stacks cascading pink popup dialogs
// saying "Rabbit_Hole / Install" with YES/SORRY buttons, telling the viewer
// that obsession is malware installing itself in your brain. The lyrics
// appear inside this popup, the status bar tracks the install progress
// (which == song progress), and the close X is permanently disabled because
// you can't uninstall the rabbit hole once you're in.
//
// Signature features:
//   • Install-progress status bar with evolving milestone text that mirrors
//     the song's escalation — "Installing Rabbit_Hole.exe..." → "Extracting
//     love archive..." → "Locking your heart..." → "Removing escape paths..."
//     → "Completing obsession..." → "Installed. ✗ Cannot uninstall."
//   • A pixel bunny rides the leading edge of a Win98-segmented progress bar.
//   • The close (✕) button is visually struck through in red — "cannot close",
//     encoding the song's core metaphor (addiction, the rabbit hole you can't
//     leave).
//   • Two ghost dialog copies stack behind the main card (tilted, faded), a
//     direct quote of the MV's cascading-popups scene.
//   • An Ace-of-Hearts playing card peeks out from the corner — Miku wears
//     one tucked into her bunnygirl bodice.
//   • The chunk-colorized JP carries a subtle magenta-radiant text-shadow
//     evoking the MV's thick burned-in kanji typography (厭厭 / 愛して /
//     死にたくなって / 誰) without fighting legibility.
//
// The palette is pulled straight from MV frames: hot magenta backdrop,
// cream-rose card body, plum / cherry / Miku-blue accents, black chrome.
// Font stack: Silkscreen (pixel chrome), Zen Maru Gothic (round chunky JP
// lyric), Quicksand (rounded EN), Noto Sans JP (gloss rt).
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Rabbit_Hole.exe palette
  // ==========================================================================
  const THEME = {
    trackTag:   'Rabbit_Hole.exe',
    artistTag:  'DECO*27 × 初音ミク',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=Silkscreen:wght@400;700&' +
      'family=Zen+Maru+Gothic:wght@500;700;900&' +
      'family=Quicksand:wght@500;600;700&' +
      'family=Noto+Sans+JP:wght@500;700&' +
      'display=swap',
    fontPixel:    '"Silkscreen", "Courier New", monospace',
    fontJP:       '"Zen Maru Gothic", "Noto Sans JP", sans-serif',
    fontEN:       '"Quicksand", "Zen Maru Gothic", sans-serif',
    fontGloss:    '"Noto Sans JP", system-ui, sans-serif',

    // Palette — every hex taken from MV frames.
    //
    // The card body is a cream-rose (#FFF3F8) laced with a subtle
    // cross-dither that nods to the MV's X/cross motif (the black
    // cross-band-aid over Miku's eye, the X charm on her bow, the
    // crossed-out close buttons). Chrome is hot magenta → deep
    // magenta gradient on the title bar, matching the burned-in kanji
    // of "厭厭 愛し 死にたくなって" from the MV.
    cream:        '#FFF3F8',  // card body base
    creamEdge:    '#FDE0EC',  // card body edge tone
    creamWarm:    '#FFF8EC',  // highlights
    pinkMain:     '#E81B85',  // hot magenta (titlebar gradient top)
    pinkDeep:     '#A9154E',  // deep magenta (titlebar gradient bottom)
    pinkSoft:     '#F8A5D0',  // soft candy pink (dither highlights)
    pinkGlow:     'rgba(232, 27, 133, 0.38)',  // for burned-in JP glow
    violet:       '#5C2A96',  // plum (ghost dialog shadow)
    violetDeep:   '#2E1554',  // deep violet (deep shadow)
    blueMiku:     '#7DC9E8',  // Miku hair accent
    crimson:      '#D61437',  // choker red / disabled-X strike
    black:        '#140A1E',  // chrome ink / deep text
    ashGray:      '#8D7A9A',  // greyed-out window controls

    // Typography
    lyricFontSizeJP:     '46px',
    lyricLineHeightJP:   '2.0',
    lyricLetterSpacingJP:'0.03em',
    lyricFontSizeEN:     '26px',
    lyricLineHeightEN:   '1.28',
    lyricLetterSpacingEN:'0.005em',
    glossFontSize:       '16px',
    glossFontWeight:     '500',

    // Card shape — Win98 dialog proportions
    cardRadius:  '4px',       // dialogs had hard corners; 4px is a whisper of softness
    cardPadding: '0',         // chrome/body handle padding internally
    cardTilt:    '-0.4deg',   // barely tilted; MV dialogs are tight-stacked

    // chunkColors: 6 slots. Dark+saturated enough to read on the cream
    // body. Pulled from MV: hot magenta (narrator), cherry red (desire),
    // plum (dark subtext), Miku-blue (concrete nouns), amber (time),
    // near-black (final assertions / punchlines).
    chunkColors: [
      '#D11577',  // 0 — hot magenta / narrator voice, dominant
      '#D41E3D',  // 1 — cherry red / love verbs, desire, heat
      '#5B278F',  // 2 — plum violet / dark subtext, inner voice
      '#2561B8',  // 3 — Miku-ink blue / concrete nouns, objects
      '#B55419',  // 4 — amber / time, motion
      '#1C0F38',  // 5 — deep noir / final assertions, punchlines
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

  // Position — the popup sits mid-low. The ghost-stack tilts out to both
  // sides so it needs a touch of vertical breathing room above/below.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.74, widthFrac: 0.58 },
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
    #claude-agent-glow-border { display: none !important; }

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
    /* CSS vars on BOTH #karaoke-root and #ko-lyrics (sibling scopes). */
    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-cream-edge:  ${THEME.creamEdge};
      --ko-cream-warm:  ${THEME.creamWarm};
      --ko-pink:        ${THEME.pinkMain};
      --ko-pink-deep:   ${THEME.pinkDeep};
      --ko-pink-soft:   ${THEME.pinkSoft};
      --ko-pink-glow:   ${THEME.pinkGlow};
      --ko-violet:      ${THEME.violet};
      --ko-violet-deep: ${THEME.violetDeep};
      --ko-blue:        ${THEME.blueMiku};
      --ko-crimson:     ${THEME.crimson};
      --ko-black:       ${THEME.black};
      --ko-ash:         ${THEME.ashGray};

      --ko-font-pixel:  ${THEME.fontPixel};
      --ko-font-jp:     ${THEME.fontJP};
      --ko-font-en:     ${THEME.fontEN};
      --ko-font-gloss:  ${THEME.fontGloss};

      /* Runtime vars written by the main tick ~7×/sec. */
      --ko-progress: 0;   /* 0.0 → 1.0 song position */
      --ko-pct: 0;        /* 0 → 100 integer percentage */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== THE POPUP DIALOG =================================================
       Slot is the Win98 popup window: chunky 3D border, hard shadow beneath,
       tilted a whisper off-axis. Two ghost-stack dialogs sit behind it
       (absolute-positioned siblings layered by z-index) to quote the MV's
       cascading-popups visual. */
    #ko-lyrics .ko-slot {
      position: relative;
      padding: ${THEME.cardPadding};
      background: var(--ko-cream);
      border-radius: ${THEME.cardRadius};
      /* Multi-layer Win98-style bevel:
         - inset 2px white top/left + 2px pink-deep bottom/right = inner 3D chrome
         - 0 0 0 1.8px black = outer ink frame
         - hard 6px/6px pink-deep offset = "dropped-on-screen" shadow
         - large soft violet drop for depth on the video behind */
      box-shadow:
        inset 2px 2px 0 rgba(255, 255, 255, 0.95),
        inset -2px -2px 0 rgba(169, 21, 78, 0.22),
        0 0 0 1.8px var(--ko-black),
        6px 6px 0 0 var(--ko-pink-deep),
        0 14px 36px -10px rgba(46, 21, 84, 0.58),
        0 30px 60px -20px rgba(232, 27, 133, 0.45);
      transform: rotate(${THEME.cardTilt});
      transition: transform 320ms cubic-bezier(.2,.7,.3,1), opacity 380ms;
      isolation: isolate;
      overflow: visible;
      display: flex;
      flex-direction: column;
    }

    /* Empty-state collapse during instrumental gaps. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0.78;
      transform: rotate(${THEME.cardTilt}) scale(0.985);
    }

    /* ==== GHOST-STACK — two cascaded dialog shadows ========================
       Direct quote of the MV's cascading-popups scene. Each ghost is an
       empty-framed mini-dialog positioned behind .ko-slot with z-index -1,
       tilted and faded. They imply the rabbit-hole is a stack of install
       prompts; the main popup is just the one you can see right now. */
    #ko-lyrics .ko-ghost {
      position: absolute;
      left: 0; right: 0; top: 0; bottom: 0;
      background: var(--ko-cream);
      border-radius: ${THEME.cardRadius};
      box-shadow:
        inset 2px 2px 0 rgba(255, 255, 255, 0.8),
        0 0 0 1.5px var(--ko-black),
        4px 4px 0 0 var(--ko-pink-deep);
      z-index: -1;
      pointer-events: none;
    }
    #ko-lyrics .ko-ghost.g1 {
      transform: rotate(3.1deg) translate(16px, 10px);
      opacity: 0.42;
    }
    #ko-lyrics .ko-ghost.g2 {
      transform: rotate(-5.2deg) translate(-22px, 14px);
      opacity: 0.28;
    }
    /* Tiny fake-titlebar stripe on each ghost — they read as "other
       dialogs" and not just empty cards. */
    #ko-lyrics .ko-ghost::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 22px;
      background: linear-gradient(
        to bottom,
        var(--ko-pink) 0%,
        var(--ko-pink-deep) 100%
      );
      border-top-left-radius: ${THEME.cardRadius};
      border-top-right-radius: ${THEME.cardRadius};
      border-bottom: 1px solid var(--ko-black);
    }

    /* ==== TITLE BAR — pink gradient, pixel font, window controls =========== */
    #ko-lyrics .ko-titlebar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px 6px 10px;
      background: linear-gradient(
        180deg,
        var(--ko-pink) 0%,
        #D4166F 55%,
        var(--ko-pink-deep) 100%
      );
      border-bottom: 1.5px solid var(--ko-black);
      border-top-left-radius: ${THEME.cardRadius};
      border-top-right-radius: ${THEME.cardRadius};
      font-family: var(--ko-font-pixel);
      color: var(--ko-cream-warm);
      position: relative;
      z-index: 2;
    }
    /* Glossy highlight along the top of the titlebar — Win98 always had one. */
    #ko-lyrics .ko-titlebar::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 2px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.75) 30%,
        rgba(255, 255, 255, 0.85) 50%,
        rgba(255, 255, 255, 0.75) 70%,
        rgba(255, 255, 255, 0) 100%
      );
    }

    #ko-lyrics .ko-tbar-icon {
      width: 20px; height: 20px;
      flex: 0 0 auto;
      filter: drop-shadow(0 0 3px rgba(255, 224, 240, 0.7));
    }
    #ko-lyrics .ko-tbar-title {
      font-family: var(--ko-font-pixel);
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.04em;
      color: var(--ko-cream-warm);
      text-shadow:
        1px 1px 0 var(--ko-pink-deep),
        0 0 6px rgba(255, 240, 248, 0.45);
      flex: 1 1 auto;
      text-align: left;
      line-height: 1;
      padding-top: 2px;
    }
    #ko-lyrics .ko-tbar-ctrls {
      display: flex;
      gap: 4px;
      flex: 0 0 auto;
    }
    #ko-lyrics .ko-tbar-btn {
      width: 18px; height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #FFE0EC 0%, #F4B8D2 100%);
      border: 1px solid var(--ko-black);
      box-shadow:
        inset 1px 1px 0 rgba(255, 255, 255, 0.9),
        inset -1px -1px 0 rgba(169, 21, 78, 0.35);
      font-family: var(--ko-font-pixel);
      font-weight: 400;
      font-size: 10px;
      color: var(--ko-black);
      line-height: 1;
      position: relative;
    }
    #ko-lyrics .ko-tbar-btn.greyed {
      background: linear-gradient(180deg, #E8DEE8 0%, #B5A5BE 100%);
      color: var(--ko-ash);
    }
    /* Disabled CLOSE — a visible red strike-through. The button is never
       clickable (parent has pointer-events: none) — the visual alone
       tells the story: "this dialog cannot be closed". */
    #ko-lyrics .ko-tbar-btn.close {
      background: linear-gradient(180deg, #FFD3DD 0%, #F09EB2 100%);
      color: var(--ko-black);
      position: relative;
      overflow: visible;
    }
    #ko-lyrics .ko-tbar-btn.close::after {
      content: '';
      position: absolute;
      left: -3px; right: -3px;
      top: 50%;
      height: 2px;
      background: var(--ko-crimson);
      box-shadow:
        0 0 3px rgba(214, 20, 55, 0.85),
        0 1px 0 rgba(65, 5, 18, 0.8);
      transform: translateY(-50%) rotate(-8deg);
      pointer-events: none;
    }

    /* ==== BODY — lyric area =============================================== */
    #ko-lyrics .ko-body {
      position: relative;
      padding: 26px 36px 24px;
      background:
        /* subtle cross-dither nodding to the MV's X/cross motif */
        repeating-linear-gradient(
          45deg,
          transparent 0, transparent 8px,
          rgba(232, 27, 133, 0.05) 8px, rgba(232, 27, 133, 0.05) 9px
        ),
        repeating-linear-gradient(
          -45deg,
          transparent 0, transparent 8px,
          rgba(92, 42, 150, 0.04) 8px, rgba(92, 42, 150, 0.04) 9px
        ),
        radial-gradient(
          ellipse at 50% 40%,
          var(--ko-cream) 0%,
          var(--ko-cream-edge) 100%
        );
      z-index: 1;
      overflow: hidden;
    }

    /* Four floating drift-heart glyphs as a subtle background texture.
       A nod to the MV's everywhere-hearts-falling visual. Clip to .ko-body. */
    #ko-lyrics .ko-heart-drift {
      position: absolute;
      pointer-events: none;
      color: var(--ko-pink-soft);
      font-family: serif;
      font-size: 18px;
      opacity: 0.38;
      user-select: none;
      text-shadow: 0 0 6px rgba(232, 27, 133, 0.35);
      z-index: 0;
    }
    #ko-lyrics .ko-heart-drift.h1 {
      left: 8%; top: 0%;
      animation: koHeartDrift1 11s linear infinite;
    }
    #ko-lyrics .ko-heart-drift.h2 {
      left: 84%; top: 0%;
      animation: koHeartDrift2 14s linear infinite;
      animation-delay: -5s;
      font-size: 14px;
    }
    #ko-lyrics .ko-heart-drift.h3 {
      left: 62%; top: 0%;
      animation: koHeartDrift3 9s linear infinite;
      animation-delay: -2s;
      font-size: 12px;
    }
    #ko-lyrics .ko-heart-drift.h4 {
      left: 22%; top: 0%;
      animation: koHeartDrift1 13s linear infinite;
      animation-delay: -8s;
      font-size: 10px;
      opacity: 0.28;
    }
    @keyframes koHeartDrift1 {
      0%   { transform: translateY(140%) rotate(-10deg); opacity: 0; }
      15%  { opacity: 0.38; }
      85%  { opacity: 0.38; }
      100% { transform: translateY(-30%) rotate(8deg); opacity: 0; }
    }
    @keyframes koHeartDrift2 {
      0%   { transform: translateY(140%) translateX(0) rotate(8deg); opacity: 0; }
      20%  { opacity: 0.32; }
      80%  { opacity: 0.32; }
      100% { transform: translateY(-30%) translateX(-10px) rotate(-6deg); opacity: 0; }
    }
    @keyframes koHeartDrift3 {
      0%   { transform: translateY(140%) translateX(0) rotate(-6deg); opacity: 0; }
      25%  { opacity: 0.36; }
      75%  { opacity: 0.36; }
      100% { transform: translateY(-30%) translateX(8px) rotate(10deg); opacity: 0; }
    }

    /* ==== ACE-OF-HEARTS CORNER STICKER ====================================
       Tucked behind the bottom-right corner — Miku has this exact card in
       her bunnygirl bodice in every MV frame. Small cream rectangle with
       a centered red heart, rotated and half-clipped by the card edge. */
    #ko-lyrics .ko-ace {
      position: absolute;
      right: -18px;
      bottom: 18px;
      width: 44px;
      height: 60px;
      background: var(--ko-cream-warm);
      border: 1.5px solid var(--ko-black);
      border-radius: 3px;
      transform: rotate(15deg);
      box-shadow:
        inset 0 0 0 2px rgba(214, 20, 55, 0.12),
        0 4px 10px -2px rgba(46, 21, 84, 0.42);
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: serif;
      font-size: 28px;
      color: var(--ko-crimson);
      line-height: 1;
      text-shadow: 0 0 6px rgba(214, 20, 55, 0.45);
    }
    #ko-lyrics .ko-ace::before {
      content: 'A';
      position: absolute;
      top: 2px; left: 4px;
      font-family: var(--ko-font-pixel);
      font-size: 10px;
      color: var(--ko-crimson);
      text-shadow: none;
    }
    #ko-lyrics .ko-ace::after {
      content: 'A';
      position: absolute;
      bottom: 2px; right: 4px;
      font-family: var(--ko-font-pixel);
      font-size: 10px;
      color: var(--ko-crimson);
      text-shadow: none;
      transform: rotate(180deg);
    }

    /* ==== LYRICS — chunky burned-in JP + rounded EN ======================= */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: var(--ko-black);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.4em;
      min-height: 1em;
      position: relative;
      z-index: 2;
      /* The "burned-in kanji" feel from the MV: white inner halo + pink
         radiant glow outer + soft pink drop. Gives JP characters a
         printed-on-the-card weight without fighting the chunk colors. */
      text-shadow:
        0 1px 0 rgba(255, 255, 255, 0.9),
        0 0 14px var(--ko-pink-glow),
        0 0 30px rgba(232, 27, 133, 0.18),
        0 2px 0 rgba(169, 21, 78, 0.22);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — small, clean, magenta-ish on cream. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: var(--ko-pink-deep);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.92;
      text-shadow:
        0 1px 0 rgba(255, 255, 255, 0.85),
        0 0 8px rgba(232, 27, 133, 0.22);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Quicksand rounded, dark violet on cream. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 600;
      color: var(--ko-violet-deep);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      padding-top: 0.2em;
      text-shadow:
        0 1px 0 rgba(255, 255, 255, 0.75),
        0 0 8px rgba(255, 255, 255, 0.55);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.92);
      font-weight: 500;
    }
    /* Thin magenta-fade hairline under EN line, like a dialog input field. */
    #ko-lyrics .ko-line-en:not(:empty) {
      padding-bottom: 4px;
      margin-top: 2px;
      background:
        linear-gradient(90deg, transparent 10%, rgba(209, 21, 119, 0.42) 50%, transparent 90%)
        bottom / 100% 1.3px no-repeat;
    }

    /* ==== STATUS BAR — install progress + milestone text =================== */
    #ko-lyrics .ko-statusbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px 7px;
      background: linear-gradient(
        180deg,
        #EBD9E8 0%,
        #C8B0C6 100%
      );
      border-top: 1.5px solid var(--ko-black);
      border-bottom-left-radius: ${THEME.cardRadius};
      border-bottom-right-radius: ${THEME.cardRadius};
      font-family: var(--ko-font-pixel);
      color: var(--ko-black);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-status-text {
      font-family: var(--ko-font-pixel);
      font-weight: 400;
      font-size: 11px;
      color: var(--ko-violet-deep);
      letter-spacing: 0.03em;
      flex: 0 0 auto;
      white-space: nowrap;
      line-height: 1;
      padding-top: 2px;
      transition: color 600ms ease;
    }
    #ko-lyrics .ko-status-text.done {
      color: var(--ko-crimson);
      animation: koStatusDone 900ms ease-out;
    }
    @keyframes koStatusDone {
      0%   { letter-spacing: 0.16em; opacity: 0.5; color: var(--ko-pink); }
      60%  { letter-spacing: 0.06em; opacity: 1; }
      100% { letter-spacing: 0.03em; color: var(--ko-crimson); }
    }

    /* The progress track — Win98 inset bar. The fill is a chunky segmented
       magenta gradient (alternating stripes, classic Win98 progress-meter
       look). A pixel bunny sprite rides the leading edge. */
    #ko-lyrics .ko-progress-track {
      flex: 1 1 auto;
      height: 14px;
      background: #F8EEF4;
      border: 1px solid var(--ko-black);
      box-shadow:
        inset 1px 1px 0 rgba(169, 21, 78, 0.25),
        inset -1px -1px 0 rgba(255, 255, 255, 0.7);
      position: relative;
      overflow: hidden;
    }
    #ko-lyrics .ko-progress-fill {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: calc(var(--ko-progress) * 100%);
      background:
        /* Win98 segmented fill: vertical stripe repeats create chunked blocks */
        repeating-linear-gradient(
          to right,
          transparent 0, transparent 5px,
          rgba(255, 255, 255, 0.35) 5px, rgba(255, 255, 255, 0.35) 6px
        ),
        linear-gradient(
          180deg,
          #F749A3 0%,
          var(--ko-pink) 45%,
          var(--ko-pink-deep) 100%
        );
      transition: width 160ms linear;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.45),
        inset 0 -1px 0 rgba(65, 5, 25, 0.3);
      will-change: width;
    }
    /* Pixel bunny rides the leading edge of the fill. At progress 0 it
       sits at the track's left edge; at progress 1 at the right edge.
       The (100% - 14px) math keeps the full bunny sprite inside the track
       at all progress values so it never clips into the track border. */
    #ko-lyrics .ko-progress-bunny {
      position: absolute;
      top: -3px;
      left: calc(var(--ko-progress) * (100% - 14px));
      width: 14px; height: 16px;
      transition: left 160ms linear;
      filter: drop-shadow(0 0 3px rgba(255, 220, 235, 0.95));
      pointer-events: none;
      animation: koBunnyHop 700ms ease-in-out infinite alternate;
    }
    @keyframes koBunnyHop {
      0%   { transform: translateY(0); }
      100% { transform: translateY(-1.5px); }
    }

    #ko-lyrics .ko-pct {
      font-family: var(--ko-font-pixel);
      font-weight: 700;
      font-size: 11px;
      color: var(--ko-pink-deep);
      letter-spacing: 0.02em;
      flex: 0 0 auto;
      min-width: 32px;
      text-align: right;
      line-height: 1;
      padding-top: 2px;
      white-space: nowrap;
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

  // Pixel-bunny SVG for the titlebar (20×20). Two-tone pink with darker
  // outline, X cross-eye on the left (echoing Miku's X-band-aid) and a
  // single-dot right eye, blush on both cheeks. Hand-placed pixel grid.
  const bunnyIcon = `
    <svg class="ko-tbar-icon" viewBox="0 0 20 20" shape-rendering="crispEdges">
      <!-- ears (outline + fill) -->
      <rect x="4" y="2" width="2" height="6" fill="#FFD0E2"/>
      <rect x="3" y="3" width="1" height="4" fill="#E57AAA"/>
      <rect x="6" y="3" width="1" height="4" fill="#E57AAA"/>
      <rect x="5" y="4" width="1" height="3" fill="#FF96C4"/>
      <rect x="13" y="2" width="2" height="6" fill="#FFD0E2"/>
      <rect x="12" y="3" width="1" height="4" fill="#E57AAA"/>
      <rect x="15" y="3" width="1" height="4" fill="#E57AAA"/>
      <rect x="14" y="4" width="1" height="3" fill="#FF96C4"/>
      <!-- head/body -->
      <rect x="4" y="8" width="12" height="8" fill="#FFD0E2"/>
      <rect x="3" y="9" width="1" height="6" fill="#E57AAA"/>
      <rect x="16" y="9" width="1" height="6" fill="#E57AAA"/>
      <rect x="4" y="7" width="12" height="1" fill="#E57AAA"/>
      <rect x="4" y="16" width="12" height="1" fill="#E57AAA"/>
      <!-- X cross-eye (left eye) — quotes Miku's X band-aid -->
      <rect x="7" y="10" width="1" height="1" fill="#2E1554"/>
      <rect x="8" y="11" width="1" height="1" fill="#2E1554"/>
      <rect x="9" y="10" width="1" height="1" fill="#2E1554"/>
      <rect x="7" y="12" width="1" height="1" fill="#2E1554"/>
      <rect x="9" y="12" width="1" height="1" fill="#2E1554"/>
      <!-- right eye (single dot) -->
      <rect x="13" y="11" width="1" height="1" fill="#2E1554"/>
      <!-- cheek blush -->
      <rect x="11" y="13" width="2" height="1" fill="#FF6FB0"/>
      <rect x="6" y="13" width="2" height="1" fill="#FF6FB0"/>
      <!-- mouth tick -->
      <rect x="10" y="14" width="1" height="1" fill="#D61437"/>
    </svg>`;

  // Pixel-bunny rider for the progress bar (14×16). Smaller silhouette of
  // the same critter, two-dot eyes for readability at this size.
  const bunnyRider = `
    <svg viewBox="0 0 14 16" shape-rendering="crispEdges" style="width:100%;height:100%">
      <!-- ears -->
      <rect x="3" y="0" width="2" height="4" fill="#FF96C4"/>
      <rect x="2" y="1" width="1" height="3" fill="#A9154E"/>
      <rect x="5" y="1" width="1" height="3" fill="#A9154E"/>
      <rect x="9" y="0" width="2" height="4" fill="#FF96C4"/>
      <rect x="8" y="1" width="1" height="3" fill="#A9154E"/>
      <rect x="11" y="1" width="1" height="3" fill="#A9154E"/>
      <!-- body -->
      <rect x="3" y="4" width="8" height="8" fill="#FF96C4"/>
      <rect x="2" y="5" width="1" height="6" fill="#A9154E"/>
      <rect x="11" y="5" width="1" height="6" fill="#A9154E"/>
      <rect x="3" y="3" width="8" height="1" fill="#A9154E"/>
      <rect x="3" y="12" width="8" height="1" fill="#A9154E"/>
      <!-- eyes -->
      <rect x="5" y="7" width="1" height="1" fill="#2E1554"/>
      <rect x="8" y="7" width="1" height="1" fill="#2E1554"/>
      <!-- feet -->
      <rect x="3" y="13" width="2" height="2" fill="#FFD0E2"/>
      <rect x="9" y="13" width="2" height="2" fill="#FFD0E2"/>
      <rect x="2" y="14" width="1" height="1" fill="#A9154E"/>
      <rect x="11" y="14" width="1" height="1" fill="#A9154E"/>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-ghost g1"></div>
      <div class="ko-ghost g2"></div>
      <div class="ko-titlebar">
        ${bunnyIcon}
        <div class="ko-tbar-title">${escHTML(THEME.trackTag)}</div>
        <div class="ko-tbar-ctrls">
          <div class="ko-tbar-btn">_</div>
          <div class="ko-tbar-btn greyed">▢</div>
          <div class="ko-tbar-btn close">✕</div>
        </div>
      </div>
      <div class="ko-body">
        <div class="ko-heart-drift h1">♥</div>
        <div class="ko-heart-drift h2">♡</div>
        <div class="ko-heart-drift h3">♥</div>
        <div class="ko-heart-drift h4">♡</div>
        <div class="ko-ace" aria-hidden="true">♥</div>
        <div class="ko-line-jp" id="ko-line-jp"></div>
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>
      <div class="ko-statusbar">
        <div class="ko-status-text" id="ko-status-text">Installing Rabbit_Hole.exe...</div>
        <div class="ko-progress-track">
          <div class="ko-progress-fill"></div>
          <div class="ko-progress-bunny">${bunnyRider}</div>
        </div>
        <div class="ko-pct" id="ko-pct">0%</div>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // Install-milestone schedule: the status-bar text evolves as progress
  // climbs, mirroring the song's narrative arc — playful appeal, commitment,
  // resignation, completion. Last entry flags 'done' (red + flash).
  const INSTALL_MILESTONES = [
    [ 0, 'Installing Rabbit_Hole.exe...',        false],
    [15, 'Extracting love archive...',           false],
    [38, 'Locking your heart...',                false],
    [62, 'Removing escape paths...',             false],
    [83, 'Completing obsession...',              false],
    [98, 'Installed. \u2717 Cannot uninstall.',  true ],
  ];
  const pickMilestone = (pct) => {
    for (let i = INSTALL_MILESTONES.length - 1; i >= 0; i--) {
      if (pct >= INSTALL_MILESTONES[i][0]) return INSTALL_MILESTONES[i];
    }
    return INSTALL_MILESTONES[0];
  };

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
  let lastProgWriteAt = 0;
  let lastStatusText = '';
  let lastPctText = '';
  let lastStatusDone = false;

  // --- Position tick: re-anchor the lyric zone to the video rect ---
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
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + install progress + milestone text ---
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

    // ---- Progress + milestone update (rate-limited to ~140ms) ----
    // CSS transitions on .ko-progress-fill width + .ko-progress-bunny left
    // are 160ms linear, so each write chains into the next at ~7 writes/sec.
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        const pctInt = Math.floor(progFrac * 100);
        lyrics.style.setProperty('--ko-progress', progFrac.toFixed(4));
        lyrics.style.setProperty('--ko-pct', pctInt);

        const pctEl = document.getElementById('ko-pct');
        const pctStr = pctInt + '%';
        if (pctEl && pctStr !== lastPctText) {
          pctEl.textContent = pctStr;
          lastPctText = pctStr;
        }

        // Milestone text — swap when threshold is crossed. When the
        // 'done' milestone trips, apply the done-class for the flash.
        const [, label, done] = pickMilestone(pctInt);
        const statusEl = document.getElementById('ko-status-text');
        if (statusEl) {
          if (label !== lastStatusText) {
            statusEl.textContent = label;
            lastStatusText = label;
          }
          if (done !== lastStatusDone) {
            statusEl.classList.toggle('done', done);
            lastStatusDone = done;
          }
        }
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
