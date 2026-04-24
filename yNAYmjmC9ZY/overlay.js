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
  // Per-song stamp glyphs — appear on setlist rows AND in the now-playing wax seal.
  // Mapped by song.idx (1-based). Each is a small refined unicode that suggests the song.
  const SONG_STAMPS = [
    null,
    '♡',  // 1. Hajimete no Chuu — first kiss
    '✿',  // 2. Akai Sweet Pea — flower
    '☆',  // 3. Lum no Love Song — Urusei Yatsura star
    '◉',  // 4. Orange — citrus
    '♦',  // 5. Pretender — formal diamond
    '❀',  // 6. CHE.R.RY — cherry blossom
    '♪',  // 7. Galge — chiptune
    '❤',  // 8. Valentine Kiss
    '❋',  // 9. Demo Sayonara — goodbye flake
    '❥',  // 10. Feeling Heart
  ];

  // Paw-print SVG — used in wax seal, setlist crest, progress bar pattern.
  // Encoded as data URI so we can use it via background-image without extra requests.
  const PAW_SVG = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='20' cy='38' rx='9' ry='13'/%3E%3Cellipse cx='42' cy='22' rx='9' ry='13'/%3E%3Cellipse cx='68' cy='22' rx='9' ry='13'/%3E%3Cellipse cx='88' cy='38' rx='9' ry='13'/%3E%3Cpath d='M22 68 Q26 48 54 52 Q82 48 88 68 Q88 92 54 92 Q22 92 22 68 Z'/%3E%3C/svg%3E";

  const THEME = {
    // ----- Stream identity -----
    streamTag:       'FWMC · VALENTINES',
    crestSymbol:     '❦',                    // aldus leaf — love-letter flourish
    streamTitle:     'Love Songs<br><em class="ko-script">from the Hounds</em>',
    streamSubtitle:  'ラブソング縛り · 10 letters',
    setlistTabIcon:  '❦',
    plainTag:        'Full Letter',
    plainSubtitle:   'stationery · scroll',
    plainTabIcon:    '✉',

    // ----- Fonts -----
    // DM Serif Display   — romantic Valentine-book display
    // Pinyon Script      — handwritten love-letter flourish (accent only)
    // Cormorant Garamond — refined serif for song titles + EN lyrics
    // Quicksand          — rounded soft sans (puppy-warm) for labels + metadata
    // Shippori Mincho    — elegant vintage JP serif for JP lyrics
    fontsHref:   'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Quicksand:wght@400;500;600;700&family=Shippori+Mincho:wght@400;500;600;700;800&display=swap',
    fontDisplay: '"DM Serif Display", "Playfair Display", Georgia, serif',
    fontBody:    '"Quicksand", "Nunito", system-ui, sans-serif',
    fontSerif:   '"Cormorant Garamond", "Playfair Display", Georgia, serif',
    fontJP:      '"Shippori Mincho", "Yu Mincho", "Hiragino Mincho ProN", serif',
    fontScript:  '"Pinyon Script", "Petit Formal Script", cursive',

    // ----- Color palette — Valentine stationery -----
    cream:      '#FDF4E7',   // stationery paper
    accent:     '#E1457A',   // rose ink
    accentDeep: '#B82D5D',   // deeper rose (active states)
    accentInk:  '#7D1F43',   // wine — text on accent
    ink:        '#3B1825',   // deep wine (primary text)
    inkSoft:    '#7A4B5C',   // muted wine (secondary text)
    gold:       '#C69653',   // wax-seal gold (no-sync marker)
    teal:       '#5FB6A8',   // Fuwawa mint accent

    // ----- Panel visual — stationery paper -----
    panelBackground: `
      radial-gradient(ellipse 160% 100% at 50% -10%, rgba(245,153,176,0.30) 0%, transparent 55%),
      radial-gradient(circle at 18% 108%, rgba(95,182,168,0.16) 0%, transparent 50%),
      radial-gradient(circle at 85% 92%, rgba(198,150,83,0.12) 0%, transparent 45%),
      linear-gradient(172deg, #FDF4E7 0%, #F9EAD6 55%, #F3DDC6 100%)
    `,
    panelBorder:      '1px solid rgba(180, 125, 100, 0.32)',
    panelRadius:      '4px 4px 22px 22px',
    panelShadow:      '0 24px 56px -24px rgba(125, 31, 67, 0.55), 0 6px 14px -6px rgba(180, 105, 120, 0.3)',

    // ----- Side tabs (ribbon-tag) -----
    tabBackground: 'linear-gradient(180deg, #F5A2B6 0%, #E1457A 55%, #B82D5D 100%)',
    tabTextColor:  '#FDF4E7',
    tabShadow:     '0 6px 18px -4px rgba(184, 45, 93, 0.55), inset 0 1px 0 rgba(255,255,255,0.35)',

    // ----- Now-playing card (the "letter") -----
    nowCardBackground: 'linear-gradient(168deg, #FFFBF4 0%, #FFF5E8 100%)',
    nowCardBorder:     '1px solid rgba(180, 125, 100, 0.22)',
    nowCardShadow:     '0 4px 14px -4px rgba(100, 20, 45, 0.22), 0 2px 5px -2px rgba(180, 105, 120, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    nowFillGradient:   'linear-gradient(90deg, #F5A2B6 0%, #E1457A 50%, #B82D5D 100%)',

    // ----- Setlist rows -----
    rowHoverBg:   'rgba(225, 69, 122, 0.07)',
    rowActiveBg:  'linear-gradient(100deg, rgba(225, 69, 122, 0.20), rgba(198, 150, 83, 0.06))',
    rowActiveBar: '#E1457A',

    // ----- Ctrl buttons -----
    ctrlBackground: 'rgba(255, 250, 240, 0.78)',

    // ----- Lyrics — cream ink on deep-wine stroke (love-letter calligraphy) -----
    lyricColorEN:  '#FFF2E4',
    lyricColorJP:  '#FFF2E4',
    lyricStrokeEN: '5px #4B0E22',
    lyricStrokeJP: '5px #4B0E22',
    lyricShadowEN: '0 0 18px rgba(255, 240, 224, 0.55), 0 0 38px rgba(75, 14, 34, 0.5)',
    lyricShadowJP: '0 0 16px rgba(255, 240, 224, 0.55), 0 0 34px rgba(75, 14, 34, 0.5)',
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
    // FUWAMOCO duality palette — 6 hues sampled from the stream's actual
    // character designs and on-screen overlay art. Three warms (Mococo:
    // ruby eye, carnation hoodie, peach hair-tips) + three cools (Fuwawa:
    // mint dress, ocean-cyan eyes, navy ribbon accent). Colors paired so
    // each lyric line gets a balanced warm/cool distribution of chunks.
    colors: ['#C8325C', '#E86A8B', '#D47A4E', '#3E9583', '#2772AC', '#5B6FA8'],
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
      --ko-teal:        ${THEME.teal};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-script:  ${THEME.fontScript};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ============ PANEL (stationery letter card — borderless, fog-edge) ============ */
    /* No hard border + no deckle: the panel surface is defined by backdrop-blur
       and a top/bottom feather mask that fades the card's edges into the video
       so the stationery gradient reads as luminous paper haze, not a boxed
       rectangle with a line around it. */
    .ko-panel {
      position: absolute;
      width: 340px;
      max-height: 88vh;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: ${THEME.panelBackground};
      backdrop-filter: blur(28px) saturate(1.35);
      -webkit-backdrop-filter: blur(28px) saturate(1.35);
      border-radius: ${THEME.panelRadius};
      box-shadow: 0 30px 80px -40px rgba(125, 31, 67, 0.5), 0 6px 18px -10px rgba(180, 105, 120, 0.28);
      color: var(--ko-ink);
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      transition: transform 0.55s cubic-bezier(.77,0,.18,1);
      -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 28px, #000 calc(100% - 28px), transparent 100%);
              mask-image: linear-gradient(180deg, transparent 0, #000 28px, #000 calc(100% - 28px), transparent 100%);
    }
    .ko-panel > * { position: relative; z-index: 1; }

    .ko-setlist.collapsed { transform: translate(calc(100% - 40px), -50%); }
    .ko-plain.collapsed   { transform: translate(calc(-100% + 40px), -50%); }
    .ko-plain.hidden      { display: none; }

    /* ============ SIDE TAB (ribbon + wax-seal dot) ============ */
    .ko-tab {
      position: absolute;
      top: 50%;
      margin-top: -42px;
      width: 40px;
      height: 84px;
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
      text-shadow: 0 1px 2px rgba(124, 20, 52, 0.5);
      transition: transform 0.25s cubic-bezier(.34, 1.56, .64, 1), filter 0.2s;
      box-shadow: ${THEME.tabShadow};
      z-index: 3;
    }
    /* Hand-stitched dashed "binding" edge along the inner side of the tab */
    .ko-tab::after {
      content: '';
      position: absolute;
      top: 10px; bottom: 10px;
      border-right: 1px dashed rgba(253, 244, 231, 0.55);
    }
    .ko-setlist .ko-tab::after { right: 6px; }
    .ko-plain   .ko-tab::after { left: 6px; border-right: 0; border-left: 1px dashed rgba(253, 244, 231, 0.55); }
    .ko-tab:hover { filter: brightness(1.08); transform: scale(1.06); }
    .ko-setlist .ko-tab {
      left: -38px;
      border-radius: 22px 0 0 22px;
      clip-path: polygon(0 0, 100% 0, 100% 42%, 78% 50%, 100% 58%, 100% 100%, 0 100%);
    }
    .ko-plain .ko-tab {
      right: -38px;
      border-radius: 0 22px 22px 0;
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 58%, 22% 50%, 0 42%);
    }

    /* ============ HEAD (letterhead) ============ */
    .ko-head {
      padding: 26px 26px 14px;
      position: relative;
      flex-shrink: 0;
    }
    /* Decorative underline: thin double rule with diamond in center */
    .ko-head::after {
      content: '';
      position: absolute;
      left: 26px; right: 26px;
      bottom: 0;
      height: 10px;
      background:
        linear-gradient(90deg, transparent 0%, rgba(184, 45, 93, 0.35) 22%, rgba(184, 45, 93, 0.35) 78%, transparent 100%) 0 40% / 100% 1px no-repeat,
        linear-gradient(90deg, transparent 0%, rgba(184, 45, 93, 0.2) 22%, rgba(184, 45, 93, 0.2) 78%, transparent 100%) 0 80% / 100% 1px no-repeat;
    }
    .ko-crest {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }
    .ko-crest-mark {
      font-family: var(--ko-font-display);
      font-size: 22px;
      color: var(--ko-accent);
      line-height: 0.9;
      transform: translateY(-1px);
    }
    .ko-crest-label {
      font-family: var(--ko-font-body);
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.38em;
      color: var(--ko-accent-ink);
      text-transform: uppercase;
    }
    .ko-title {
      font-family: var(--ko-font-display);
      font-weight: 400;
      font-size: 32px;
      line-height: 1;
      color: var(--ko-ink);
      margin: 8px 0 10px;
      letter-spacing: -0.005em;
    }
    /* Inline love-letter script — used inside ko-title via <em class="ko-script"> */
    .ko-title .ko-script,
    .ko-script {
      font-family: var(--ko-font-script);
      font-style: normal;
      font-weight: 400;
      font-size: 1.25em;
      color: var(--ko-accent-deep);
      display: inline-block;
      transform: translateY(2px);
      margin-left: 4px;
      letter-spacing: 0.01em;
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
      background: linear-gradient(90deg, transparent, rgba(184, 45, 93, 0.45), transparent);
    }

    /* ============ NOW-PLAYING (ENVELOPE + WAX SEAL + PAW TRAIL) ============ */
    /* A pastel ENVELOPE with the flap folded up revealing a cream letter inside.
       The flap is a triangular ::before pseudo. A wax seal (rotated disc with
       the current song's stamp glyph) pins it at the top-right. Below the
       song info sits a paw-print trail that lights up as the song progresses. */
    .ko-now {
      position: relative;
      margin: 20px 22px 18px;
      padding: 22px 20px 14px;
      background: ${THEME.nowCardBackground};
      border: ${THEME.nowCardBorder};
      border-radius: 3px 3px 14px 14px;
      box-shadow: ${THEME.nowCardShadow};
      overflow: visible;
    }
    /* Envelope flap — folded up, pointing up, pastel pink */
    .ko-now::before {
      content: '';
      position: absolute;
      left: 18%; right: 18%;
      top: -16px;
      height: 16px;
      background: linear-gradient(180deg, #F8B5C6 0%, #E1457A 100%);
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
      filter: drop-shadow(0 -2px 4px rgba(184, 45, 93, 0.35));
      pointer-events: none;
    }
    /* Subtle paper fold-line at the top of the letter inside the envelope */
    .ko-now::after {
      content: '';
      position: absolute;
      top: 0; left: 18%; right: 18%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(184, 45, 93, 0.25), transparent);
      pointer-events: none;
    }
    .ko-letter-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      gap: 8px;
    }
    .ko-letter-no {
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--ko-accent-deep);
    }
    .ko-letter-dash {
      flex: 1;
      height: 1px;
      background: repeating-linear-gradient(90deg, rgba(184, 45, 93, 0.4) 0 3px, transparent 3px 6px);
    }
    /* Wax seal — a circular "stamped" disc pinned to the top-right of the letter */
    .ko-wax-seal {
      position: absolute;
      top: -14px;
      right: 14px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 30% 28%, #F599B0 0%, #E1457A 35%, #8A1F3E 100%);
      color: #FDF4E7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ko-font-display);
      font-size: 22px;
      line-height: 1;
      box-shadow:
        0 4px 8px rgba(100, 20, 45, 0.45),
        inset 0 -3px 5px rgba(0, 0, 0, 0.28),
        inset 0 2px 1px rgba(255, 255, 255, 0.4);
      text-shadow: 0 1px 1px rgba(100, 20, 45, 0.6);
      transform: rotate(-8deg);
      transition: transform 0.6s cubic-bezier(.34, 1.56, .64, 1);
      z-index: 4;
    }
    /* Tiny drip of wax at the bottom of the seal */
    .ko-wax-seal::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -4px;
      transform: translateX(-50%);
      width: 6px; height: 6px;
      background: radial-gradient(circle at 30% 30%, #E1457A, #8A1F3E);
      border-radius: 50%;
    }
    .ko-wax-seal.pulse { transform: rotate(0deg) scale(1.15); }
    .ko-now-title {
      font-family: var(--ko-font-serif);
      font-weight: 700;
      font-style: italic;
      font-size: 25px;
      line-height: 1.08;
      color: var(--ko-ink);
      margin: 4px 40px 3px 0;
      word-break: keep-all;
      overflow-wrap: normal;
      letter-spacing: 0.003em;
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp), var(--ko-font-serif), serif;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      color: var(--ko-ink-soft);
      margin: 0 0 8px;
      max-height: 3em;
      overflow: hidden;
      transition: opacity 0.3s, max-height 0.3s;
      font-style: italic;
    }
    .ko-now-meaning.empty {
      max-height: 0;
      margin: 0;
      opacity: 0;
    }
    .ko-now-artist {
      font-family: var(--ko-font-body);
      font-size: 10.5px;
      font-weight: 600;
      color: var(--ko-ink-soft);
      margin-bottom: 10px;
      letter-spacing: 0.04em;
    }
    .ko-now-artist::before {
      content: '— ';
      color: var(--ko-accent);
      font-weight: 700;
    }
    /* Paw-print trail — 10 pink paws stamped along the letter, lighting up as time advances */
    .ko-paw-trail {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 6px 0 4px;
      padding: 0 2px;
      height: 18px;
    }
    .ko-paw-stamp {
      width: 15px;
      height: 15px;
      background-color: var(--ko-ink-soft);
      opacity: 0.22;
      -webkit-mask-image: url("${PAW_SVG}");
              mask-image: url("${PAW_SVG}");
      -webkit-mask-repeat: no-repeat;
              mask-repeat: no-repeat;
      -webkit-mask-size: contain;
              mask-size: contain;
      -webkit-mask-position: center;
              mask-position: center;
      transition: background-color 0.35s, opacity 0.35s, transform 0.35s cubic-bezier(.34, 1.56, .64, 1);
      transform: rotate(var(--paw-r, -6deg));
    }
    .ko-paw-stamp:nth-child(2n)  { --paw-r: 8deg; }
    .ko-paw-stamp:nth-child(3n)  { --paw-r: -12deg; }
    .ko-paw-stamp:nth-child(5n)  { --paw-r: 14deg; }
    .ko-paw-stamp.lit {
      background-color: var(--ko-accent);
      opacity: 1;
      transform: rotate(var(--paw-r, -6deg)) scale(1.18);
    }
    .ko-paw-stamp.cur {
      background-color: var(--ko-accent-deep);
      opacity: 1;
      transform: rotate(var(--paw-r, -6deg)) scale(1.35);
      filter: drop-shadow(0 0 4px rgba(225, 69, 122, 0.55));
    }
    .ko-now-progress {
      position: relative;
      height: 3px;
      background: color-mix(in srgb, var(--ko-accent-deep) 18%, transparent);
      border-radius: 999px;
      overflow: hidden;
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: ${THEME.nowFillGradient};
      border-radius: 999px;
      box-shadow: 0 0 10px color-mix(in srgb, var(--ko-accent) 60%, transparent);
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
      letter-spacing: 0.1em;
      font-variant-numeric: tabular-nums;
    }

    /* ============ CTRL BUTTONS (stationery postage chips) ============ */
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
      padding: 9px 10px;
      background: ${THEME.ctrlBackground};
      border: 1px dashed rgba(184, 45, 93, 0.4);
      border-radius: 3px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
      position: relative;
    }
    .ko-ctrl:hover {
      background: rgba(255, 245, 225, 0.95);
      transform: translateY(-1px);
    }
    .ko-ctrl.is-on {
      background: linear-gradient(180deg, rgba(245, 162, 182, 0.25), rgba(225, 69, 122, 0.18));
      border: 1px solid var(--ko-accent);
      border-style: solid;
    }
    .ko-ctrl-label {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-ctrl.is-on .ko-ctrl-label { color: var(--ko-accent-ink); }
    .ko-offset {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 800;
      color: var(--ko-accent-deep);
      letter-spacing: 0.05em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    /* ============ LIST (letter stack) ============ */
    .ko-list-header {
      font-family: var(--ko-font-body);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.34em;
      text-transform: uppercase;
      color: var(--ko-accent-deep);
      padding: 6px 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .ko-list-header::before, .ko-list-header::after {
      content: '';
      flex: 1;
      height: 1px;
      background: repeating-linear-gradient(90deg, rgba(184, 45, 93, 0.35) 0 3px, transparent 3px 6px);
    }
    .ko-list {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 14px 22px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--ko-accent-deep) 40%, transparent) transparent;
    }
    .ko-list::-webkit-scrollbar { width: 7px; }
    .ko-list::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--ko-accent-deep) 40%, transparent);
      border-radius: 4px;
    }
    .ko-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 12px;
      margin: 4px 0;
      border-radius: 2px 2px 10px 10px;
      cursor: pointer;
      position: relative;
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
      background: rgba(255, 251, 244, 0.45);
      border: 1px solid rgba(180, 125, 100, 0.2);
    }
    .ko-row::before {
      /* mini envelope-flap indicator on each row */
      content: '';
      position: absolute;
      top: 0;
      left: 44%; right: 44%;
      height: 4px;
      background: linear-gradient(180deg, rgba(245, 162, 182, 0.7), transparent);
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
      opacity: 0.7;
      transition: opacity 0.2s, height 0.2s;
    }
    .ko-row:hover {
      background: ${THEME.rowHoverBg};
      transform: translateX(1px);
    }
    .ko-row.active {
      background: ${THEME.rowActiveBg};
      box-shadow: inset 3px 0 0 ${THEME.rowActiveBar}, 0 3px 10px -3px rgba(184, 45, 93, 0.25);
      border-color: rgba(225, 69, 122, 0.4);
    }
    .ko-row.active::before {
      height: 7px;
      opacity: 1;
      left: 30%; right: 30%;
      background: linear-gradient(180deg, #F5A2B6, #E1457A);
    }
    .ko-row-idx {
      font-family: var(--ko-font-display);
      font-style: italic;
      font-weight: 400;
      font-size: 24px;
      color: var(--ko-accent);
      min-width: 30px;
      text-align: center;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }
    .ko-row.active .ko-row-idx { color: var(--ko-accent-deep); }
    .ko-row-body { flex: 1; min-width: 0; }
    .ko-row-title {
      font-family: var(--ko-font-serif);
      font-weight: 600;
      font-style: italic;
      font-size: 15px;
      line-height: 1.2;
      color: var(--ko-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-row.active .ko-row-title { font-weight: 700; }
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
      font-style: italic;
    }
    /* Per-song stamp chip — a little postal stamp with the song's unicode glyph */
    .ko-row-stamp {
      flex-shrink: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ko-font-display);
      font-size: 14px;
      color: var(--ko-accent);
      background: rgba(225, 69, 122, 0.07);
      border: 1px dashed rgba(225, 69, 122, 0.4);
      border-radius: 50%;
      transition: background 0.25s, color 0.25s, transform 0.25s, border-color 0.25s;
      line-height: 1;
    }
    .ko-row:hover .ko-row-stamp {
      background: rgba(225, 69, 122, 0.14);
      transform: rotate(-8deg);
    }
    .ko-row.active .ko-row-stamp {
      background: linear-gradient(160deg, #F5A2B6, #E1457A);
      color: #FDF4E7;
      border: 1px solid var(--ko-accent-deep);
      box-shadow: 0 3px 8px rgba(184, 45, 93, 0.45), inset 0 -2px 3px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.35);
      transform: rotate(-10deg) scale(1.08);
      text-shadow: 0 1px 1px rgba(100, 20, 45, 0.45);
    }
    /* .no-sync subtle muted state */
    .ko-row.no-sync .ko-row-title { color: color-mix(in srgb, var(--ko-ink) 52%, transparent); }
    .ko-row.no-sync .ko-row-time  { color: color-mix(in srgb, var(--ko-accent-deep) 55%, transparent); }
    .ko-row.no-sync .ko-row-idx   { color: color-mix(in srgb, var(--ko-accent) 55%, transparent); }
    .ko-row.no-sync .ko-row-stamp { color: var(--ko-gold); border-color: color-mix(in srgb, var(--ko-gold) 50%, transparent); }
    .ko-row.no-sync .ko-row-title::after {
      content: ' ◦';
      color: var(--ko-gold);
      opacity: 0.75;
    }

    /* ============ PLAIN LYRICS (letter pages) ============ */
    .ko-plain .ko-title { font-size: 22px; line-height: 1.1; }
    .ko-plain-body {
      overflow-y: auto;
      padding: 10px 26px 24px;
      flex: 1 1 auto;
      min-height: 0;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, var(--ko-accent-deep) 40%, transparent) transparent;
    }
    .ko-plain-body::-webkit-scrollbar { width: 7px; }
    .ko-plain-body::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--ko-accent-deep) 40%, transparent);
      border-radius: 4px;
    }
    .ko-plain-section { margin-bottom: 26px; }
    .ko-plain-label {
      font-family: var(--ko-font-body);
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.36em;
      text-transform: uppercase;
      color: var(--ko-accent-deep);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-plain-label::before {
      content: '❦';
      font-family: var(--ko-font-display);
      font-size: 12px;
      color: var(--ko-accent);
      letter-spacing: 0;
    }
    .ko-plain-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: repeating-linear-gradient(90deg, rgba(184, 45, 93, 0.4) 0 3px, transparent 3px 6px);
    }
    .ko-plain-en {
      font-family: var(--ko-font-serif);
      font-style: italic;
      font-weight: 400;
      font-size: 15px;
      line-height: 1.7;
      color: var(--ko-ink);
    }
    .ko-plain-jp {
      font-family: var(--ko-font-jp);
      font-weight: 500;
      font-size: 13.5px;
      line-height: 2;
      color: var(--ko-ink-soft);
    }
    .ko-plain-line  { margin-bottom: 4px; }
    .ko-plain-blank { height: 14px; }

    /* ==== LYRIC DISPLAY ====
       #ko-lyrics is positioned via the position tick (see positionTick below).
       Position is structural — do not change. Typography and color are theme. */
    /* Lyric haze: strong smooth top-bottom fade + gentler horizontal feather.
       Composite mask — layer 1 is a long vertical linear gradient with
       multiple stops for a pillowy top-down dissolve; layer 2 is a wide
       radial that keeps the left/right edges from being hard rectangles.
       Intersect so BOTH masks have to be opaque for pixels to show —
       gives the emphasized top-bottom fade Jerry asked for without losing
       the four-way feather character. */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
      padding: 160px 96px;
      background:
        radial-gradient(ellipse 65% 80% at 50% 50%, rgba(253, 244, 231, 0.26) 0%, rgba(253, 244, 231, 0.14) 45%, rgba(253, 244, 231, 0.04) 80%, transparent 100%);
      backdrop-filter: blur(14px) saturate(1.2);
      -webkit-backdrop-filter: blur(14px) saturate(1.2);
      -webkit-mask-image:
        linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 7%, rgba(0,0,0,0.65) 16%, #000 32%, #000 68%, rgba(0,0,0,0.65) 84%, rgba(0,0,0,0.25) 93%, transparent 100%),
        radial-gradient(ellipse 80% 100% at 50% 50%, #000 40%, rgba(0,0,0,0.85) 75%, transparent 100%);
      -webkit-mask-composite: source-in;
              mask-image:
        linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 7%, rgba(0,0,0,0.65) 16%, #000 32%, #000 68%, rgba(0,0,0,0.65) 84%, rgba(0,0,0,0.25) 93%, transparent 100%),
        radial-gradient(ellipse 80% 100% at 50% 50%, #000 40%, rgba(0,0,0,0.85) 75%, transparent 100%);
              mask-composite: intersect;
    }
    #ko-lyrics.ko-empty {
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      -webkit-mask-image: none;
              mask-image: none;
      padding: 0;
    }
    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    /* JP line — dark wine ink on the cream fog. No heavy stroke: the fog
       surface handles readability. Soft cream halo keeps edges crisp when
       the fog thins out over bright video. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: var(--ko-ink);
      font-size: 42px;
      line-height: 2.4;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow: 0 0 12px rgba(253, 244, 231, 0.95), 0 0 24px rgba(253, 244, 231, 0.6);
      min-height: 1em;
      order: 1;
    }
    /* Gloss labels (ruby <rt>) — small per-morpheme English above JP tokens */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1.1;
      padding-bottom: 4px;
      color: var(--ko-ink);
      text-shadow: 0 0 8px rgba(253, 244, 231, 0.95);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    /* Natural-flow EN — below JP, color-segmented */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 600;
      color: var(--ko-ink);
      font-size: 40px;
      line-height: 1.2;
      letter-spacing: 0.01em;
      text-shadow: 0 0 12px rgba(253, 244, 231, 0.95), 0 0 24px rgba(253, 244, 231, 0.6);
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
  // Build 10 paw-stamp spans for the progress trail
  const pawTrailHTML = Array.from({ length: 10 }, () => '<span class="ko-paw-stamp"></span>').join('');

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
      <div class="ko-wax-seal" id="ko-wax-seal">${escHTML(SONG_STAMPS[1] || '❤')}</div>
      <div class="ko-letter-hdr">
        <span class="ko-letter-no">letter № <span id="ko-now-no">01</span></span>
        <span class="ko-letter-dash"></span>
      </div>
      <div class="ko-now-title" id="ko-now-title">—</div>
      <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
      <div class="ko-now-artist" id="ko-now-artist">—</div>
      <div class="ko-paw-trail" id="ko-paw-trail">${pawTrailHTML}</div>
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
    <div class="ko-list-header">setlist · love letters</div>
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
    const stamp = SONG_STAMPS[song.idx] || '♡';
    return `<div class="ko-row${noSync}" data-idx="${i}">
      <div class="ko-row-idx">${String(i + 1).padStart(2, '0')}</div>
      <div class="ko-row-body">
        <div class="ko-row-title">${escHTML(song.name)}</div>
        <div class="ko-row-meta">
          <span class="ko-row-time">${escHTML(song.t)}</span>
          <span class="ko-row-artist">${escHTML(song.artist)}</span>
        </div>
      </div>
      <div class="ko-row-stamp">${escHTML(stamp)}</div>
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
  let lastNowNo = '', lastNowStamp = '', lastPawLit = -1;
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

      // ---- Letter № + wax-seal stamp (stream-specific) ----
      const noStr = song ? String(song.idx).padStart(2, '0') : '—';
      if (noStr !== lastNowNo) {
        const noEl = document.getElementById('ko-now-no');
        if (noEl) noEl.textContent = noStr;
        lastNowNo = noStr;
      }
      const stampGlyph = song ? (SONG_STAMPS[song.idx] || '❤') : '❦';
      if (stampGlyph !== lastNowStamp) {
        const sealEl = document.getElementById('ko-wax-seal');
        if (sealEl) {
          sealEl.textContent = stampGlyph;
          // Trigger the pulse animation by toggling the class
          sealEl.classList.remove('pulse');
          // Force reflow so the class re-add fires the transition.
          void sealEl.offsetWidth;
          sealEl.classList.add('pulse');
          setTimeout(() => {
            if (window.__koGen === MY_GEN) sealEl.classList.remove('pulse');
          }, 600);
        }
        lastNowStamp = stampGlyph;
      }
      // Reset paw trail on song change
      if (lastPawLit !== 0) {
        document.querySelectorAll('.ko-paw-stamp').forEach(p => {
          p.classList.remove('lit');
          p.classList.remove('cur');
        });
        lastPawLit = 0;
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

    // ---- Progress bar + paw-trail update ----
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
      // Paw-print trail: 10 paws, one lights per 10% of the song.
      const lit = Math.min(10, Math.floor(pct / 10));
      if (lit !== lastPawLit) {
        const paws = document.querySelectorAll('.ko-paw-stamp');
        paws.forEach((p, i) => {
          const isLit = i < lit;
          const isCur = (i === lit && lit < 10);
          if (isLit !== p.classList.contains('lit')) p.classList.toggle('lit', isLit);
          if (isCur !== p.classList.contains('cur')) p.classList.toggle('cur', isCur);
        });
        lastPawLit = lit;
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

    // ---- Empty-state toggle on the lyric fog (hide the panel when no text) ----
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
