// ============================================================================
// KARAOKE OVERLAY — SKELETON (SINGLE-SONG FLAVOR)
// ----------------------------------------------------------------------------
// Pure plumbing skeleton for single-song MV overlays. Ships the extension
// contract, the sync tick, the colorizer, and the offset-persist channel.
// Ships ZERO visual defaults — you write 100% of the CSS. Everything below
// is either (a) the extension / runtime contract you must not break, or
// (b) runtime knobs you can set to taste.
//
// LOCKED — correctness-load-bearing. Don't rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; YouTube CSP requires it)
//   • window.__koGen + MY_GEN closure capture for loop termination
//   • window.__setlist, __parsedLyrics, __transCache, __plainLyrics,
//     __lyricOffsets, __wordAlign, __karaokeLyricsHidden, __karaokeRebuild,
//     __mergeTranslations (extension contract — bootstrap calls them by name)
//   • RAF + setInterval(tick, 30) dual loop with MY_GEN bail
//   • COLOR_POLL setInterval at ~150ms (JP textContent → colored spans + ruby)
//   • positionTick posKey cache (without it: style.left/top writes cascade
//     through YouTube's 50K-node DOM every 250ms, tab gets hot)
//   • curLineIdx = -1 reset on song transition
//   • Per-write cache guards before every DOM write
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • DOM order: JP line BEFORE EN line (a11y reading order). Flip VISUAL
//     order with flex order / grid — don't touch the DOM.
//   • Hard DOM contract: #ko-line-jp and #ko-line-en must exist inside
//     #ko-lyrics > .ko-slot. Wrap, decorate, reorder visually — but those
//     IDs must be in that slot.
//   • Offset hotkeys [ ] \ + window.postMessage broadcast (extension persists
//     tuned offsets via this channel)
//
// FREE — design space. Anything not in the list above:
//
//   • FONTS_HREF — Google Fonts URL (empty = no preload; add your own
//     <link>s elsewhere if you want a non-Google source)
//   • __koPosition.{anchorX, anchorY, widthFrac} — anchor point on the
//     <video> rect + zone width. Defaults (0.5, 0.66, 0.62) mean
//     "horizontally centered, 66% down, 62% wide." Change to pin the zone
//     bottom, make it full-width, push it off to one side, whatever.
//     positionTick writes left/top/width/maxWidth as INLINE styles, so to
//     override them in CSS you need !important.
//   • __wordAlign.colors — the six chunk colors used by the colorizer.
//     Override with six MV-derived hex values; leaving the gray placeholder
//     is a visible tell that you forgot.
//   • ALL CSS — lyric typography, layout, card backdrop, colors, shadows,
//     strokes, animations, decorative ornaments. The skeleton ships five
//     rules: one hides Claude's glow border, three set the structural
//     position/z-index/pointer-events of the two root elements + a reset,
//     one makes the tick's `.hidden` toggle actually hide. Everything else
//     is up to you.
//   • HTML inside #karaoke-root and around .ko-slot (decorative wrappers,
//     inline SVG, extra panels, ornamental layers)
//
// GOTCHAS (see SKILL.md "Technical gotchas" for the full set):
//
//   • Use __karaokePolicy.createHTML() for all innerHTML writes (CSP)
//   • Use <link rel="stylesheet"> for fonts, NOT @import (CSP)
//   • CSS vars declared only on #karaoke-root don't cascade to #ko-lyrics
//     (it's a body sibling, not a descendant) — declare on BOTH selectors
//   • Keying "new line arrived" off jpEl.textContent double-fires once
//     ruby gloss is injected (textContent expands to include <rt> text).
//     Stamp the raw plain line on a data attribute and check for
//     [data-wc] descendants instead.
// ============================================================================

(() => {

  // Google Fonts URL — load via <link rel="stylesheet"> below. CSP blocks
  // @import inside <style>. Empty = skip the link insertion.
  const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Cormorant+SC:wght@400;500&display=swap';

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
    // Six color slots — derived from the MV's palette:
    //  0: apple red          (the forbidden fruit she holds)
    //  1: teal               (her distinctive eye color)
    //  2: amethyst velvet    (the jewel-tone cushion she reclines on)
    //  3: champagne bronze   (her rococo jewelry, hair ornaments)
    //  4: dusty rose         (her pink ribbon accents)
    //  5: indigo shadow      (deep mauve underside of the bed)
    colors: ['#c03a54', '#1a6d7e', '#71418d', '#8f4f1a', '#b94771', '#3c3160'],
    data: {}
  };
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // Position of the lyric zone within the video rect — anchor fractions +
  // width fraction. Design knob; see header comment.
  // Bottom-center placement. The MV's burned-in vertical JP text lives on
  // the right 10% of frame and the burned-in italic EN subs hug the bottom
  // 6%; a 70%-wide card at 77% vertical clears both while sitting comfortably
  // below the central illustration of her body.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.77, widthFrac: 0.70 },
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
  if (FONTS_HREF && !document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = FONTS_HREF;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  // ==========================================================================
  // CSS — PLUMBING MINIMUM ONLY.
  // Everything below sets up structural position/z-index/event-passthrough
  // required for the overlay to work at all. It expresses ZERO visual
  // opinions: no fonts, no sizes, no colors, no layout direction, no text
  // alignment, no spacing. Add all of that yourself below "YOUR STYLES BELOW"
  // — or append a separate CSS string. Without your styles, the lyrics
  // render as browser-default black text on nothing, which is the correct
  // "you haven't designed this yet" signal.
  // ==========================================================================
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    /* Hide Claude's agent glow-border, if present (dev-mode cleanup). */
    #claude-agent-glow-border { display: none !important; }

    /* Root overlay layer: viewport-sized, click-through, above YouTube UI. */
    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    /* Lyric zone: positionTick writes left/top/width/maxWidth inline every
       time the video rect changes (theater/fullscreen/resize). position:
       fixed is required for those inline values to place the element. */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      z-index: 2147483100;
    }

    /* Sensible reset for anything you build inside. Drop if it conflicts. */
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* The tick toggles .hidden on #ko-line-jp for EN-only songs; this rule
       makes the toggle do something. */
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ========================================================================
       ROMEO AND CINDERELLA — storybook confessional
       A cream vellum page lifted out of her diary. Pink ribbon trim top and
       bottom; a single red apple illuminates the left margin — the fruit she
       holds in every frame of the MV, the forbidden taste the song is built
       around. At the moment the midnight bells toll, a crescent bite appears.
       ======================================================================== */

    /* CSS vars must live on BOTH #karaoke-root AND #ko-lyrics because
       #ko-lyrics is a body sibling of #karaoke-root, not a descendant. */
    #karaoke-root, #ko-lyrics {
      --ink: #2d1e36;
      --ink-soft: #4d3859;
      --apple-red: #c03a54;
      --apple-red-deep: #7e1d32;
      --apple-red-light: #f6bac2;
      --teal: #1a6d7e;
      --amethyst: #71418d;
      --amethyst-soft: #7c5a95;
      --bronze: #8f4f1a;
      --rose: #b94771;
      --rose-soft: #d98ba5;
      --rose-pale: #f3c0d0;
      --indigo: #3c3160;
      --cream: #fef6ee;
      --cream-deep: #f4e3d4;
      --ribbon: #d98ba5;
      --ribbon-deep: #b85877;
      --gold: #c9a555;
    }

    /* ---- Zone container ---- */
    #ko-lyrics {
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      color: var(--ink);
      pointer-events: none;
      filter:
        drop-shadow(0 8px 24px rgba(40,25,55,0.45))
        drop-shadow(0 0 38px rgba(217,139,165,0.28));
    }

    /* ---- The card (vellum page) ---- */
    #ko-lyrics .ko-slot {
      position: relative;
      padding: 22px 34px 26px 96px;
      border-radius: 3px;
      text-align: center;
      /* Layered fills: top ribbon, bottom ribbon, paper grain, cream base. */
      background:
        /* top ribbon: fades at edges, saturated at middle */
        linear-gradient(90deg,
          transparent 0%,
          rgba(184,88,119,0.18) 10%,
          var(--ribbon-deep) 22%,
          var(--ribbon) 45%,
          var(--rose-pale) 52%,
          var(--ribbon) 58%,
          var(--ribbon-deep) 78%,
          rgba(184,88,119,0.18) 90%,
          transparent 100%) top/96% 2px no-repeat,
        /* bottom ribbon: mirror of top */
        linear-gradient(90deg,
          transparent 0%,
          rgba(184,88,119,0.18) 10%,
          var(--ribbon-deep) 22%,
          var(--ribbon) 45%,
          var(--rose-pale) 52%,
          var(--ribbon) 58%,
          var(--ribbon-deep) 78%,
          rgba(184,88,119,0.18) 90%,
          transparent 100%) bottom/96% 2px no-repeat,
        /* paper grain: delicate cross-hatched tint */
        repeating-linear-gradient(123deg,
          rgba(143, 79, 26, 0.018) 0px,
          transparent 1.3px,
          rgba(185, 71, 113, 0.024) 2.6px,
          transparent 4px),
        /* cream vellum base */
        linear-gradient(180deg,
          rgba(254,246,238,0.94) 0%,
          rgba(249,232,222,0.93) 100%);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.85),
        inset 0 -1px 0 rgba(185,71,113,0.14),
        inset 0 0 60px rgba(255,224,230,0.35),
        0 0 0 1px rgba(185,71,113,0.20);
      overflow: visible;
      animation: ko-card-in 1.05s cubic-bezier(.2,.65,.25,1) both;
    }

    /* Tiny pearl-dot corners (echo her hair jewelry) */
    #ko-lyrics .ko-slot .ko-corner {
      position: absolute;
      width: 5px; height: 5px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%,
        rgba(255,255,255,0.95) 0%,
        var(--rose-soft) 55%,
        var(--ribbon-deep) 100%);
      box-shadow: 0 0 4px rgba(217,139,165,0.6);
    }
    #ko-lyrics .ko-slot .ko-corner-tl { top: -2.5px; left: -2.5px; }
    #ko-lyrics .ko-slot .ko-corner-tr { top: -2.5px; right: -2.5px; }
    #ko-lyrics .ko-slot .ko-corner-bl { bottom: -2.5px; left: -2.5px; }
    #ko-lyrics .ko-slot .ko-corner-br { bottom: -2.5px; right: -2.5px; }

    /* ---- The apple illumination ---- */
    #ko-lyrics .ko-apple {
      position: absolute;
      left: 22px;
      top: 50%;
      width: 52px;
      height: 58px;
      transform: translateY(-50%);
      pointer-events: none;
    }

    #ko-lyrics .ko-apple-img {
      position: absolute; inset: 0;
      background: center/contain no-repeat
        url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 54'><defs><radialGradient id='a' cx='38%25' cy='30%25' r='62%25'><stop offset='0%25' stop-color='%23f9c8ce'/><stop offset='38%25' stop-color='%23db4c62'/><stop offset='100%25' stop-color='%237e1d32'/></radialGradient><linearGradient id='l' x1='0' y1='0' x2='1' y2='1'><stop offset='0%25' stop-color='%23a5d369'/><stop offset='100%25' stop-color='%233e6b1f'/></linearGradient></defs><path d='M24 11 C13.5 11 5.5 18 5.5 31 C5.5 44 12.5 51.5 18 51.5 C21 51.5 22.5 50 24 50 C25.5 50 27 51.5 30 51.5 C35.5 51.5 42.5 44 42.5 31 C42.5 18 34.5 11 24 11 Z' fill='url(%23a)'/><path d='M23 11 C23 8.5 23 5.5 24.8 3.8' stroke='%234c3018' stroke-width='2.1' fill='none' stroke-linecap='round'/><path d='M25 6.5 C30.5 2.8 38 5 37.5 9 C31.5 10.8 26 10 25 8.8 Z' fill='url(%23l)'/><ellipse cx='15.5' cy='23' rx='4.2' ry='5.8' fill='%23fff' opacity='0.32' transform='rotate(-28 15.5 23)'/><ellipse cx='17.5' cy='19' rx='1.4' ry='2.2' fill='%23fff' opacity='0.6' transform='rotate(-28 17.5 19)'/></svg>");
      filter: drop-shadow(0 3px 8px rgba(126,29,50,0.45));
      animation: ko-apple-breathe 5.5s ease-in-out infinite;
    }

    /* The crescent bite — appears only after [data-bitten="1"] is set on the slot.
       It's a cream-colored crescent matching the card fill, so it reads as a
       chunk missing from the apple's top-right edge. */
    #ko-lyrics .ko-apple-bite {
      position: absolute;
      top: 6px; right: 3px;
      width: 20px; height: 20px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 55% 55%,
          rgba(254,246,238,0.99) 0%,
          rgba(254,246,238,0.99) 50%,
          rgba(251,235,228,0.92) 80%,
          rgba(251,235,228,0.0) 100%);
      box-shadow:
        inset 2px 3px 5px rgba(126,29,50,0.45),
        inset -1px -1px 3px rgba(192,58,84,0.25);
      clip-path: polygon(100% 0, 100% 100%, 30% 100%, 0 60%, 15% 15%);
      opacity: 0;
      transform: scale(0.25) translate(8px, -8px);
      transition:
        opacity 1.4s cubic-bezier(.2,.9,.25,1),
        transform 2.0s cubic-bezier(.2,.9,.25,1);
    }
    #ko-lyrics .ko-slot[data-bitten="1"] .ko-apple-bite {
      opacity: 1;
      transform: scale(1) translate(0,0);
    }

    /* Tiny sparkle dots near the apple (MV has floating light particles) */
    #ko-lyrics .ko-sparkle {
      position: absolute;
      width: 4px; height: 4px;
      border-radius: 50%;
      background: radial-gradient(circle,
        rgba(255,255,255,0.95) 0%,
        var(--rose-pale) 50%,
        transparent 100%);
      pointer-events: none;
      opacity: 0;
    }
    #ko-lyrics .ko-sparkle-1 { left: 70px; top: 18px; animation: ko-sparkle 4.2s ease-in-out infinite; }
    #ko-lyrics .ko-sparkle-2 { left: 12px; top: 14px; animation: ko-sparkle 5.4s ease-in-out infinite 1.3s; width: 3px; height: 3px; }
    #ko-lyrics .ko-sparkle-3 { left: 62px; bottom: 14px; animation: ko-sparkle 6.1s ease-in-out infinite 2.7s; width: 3px; height: 3px; }

    /* Ambient rose petals drifting behind the text */
    #ko-lyrics .ko-petal {
      position: absolute;
      top: -28px;
      width: 9px; height: 11px;
      border-radius: 70% 30% 60% 40%;
      background: linear-gradient(135deg,
        var(--rose-pale) 0%,
        var(--rose-soft) 60%,
        var(--ribbon-deep) 100%);
      filter: blur(0.3px);
      pointer-events: none;
      opacity: 0;
      z-index: 0;
    }
    #ko-lyrics .ko-petal-1 { left: 14%; animation: ko-petal-drift 9.5s linear infinite; }
    #ko-lyrics .ko-petal-2 { left: 37%; animation: ko-petal-drift 12.2s linear infinite 2.8s; transform: scale(0.8); }
    #ko-lyrics .ko-petal-3 { left: 63%; animation: ko-petal-drift 10.6s linear infinite 5.4s; transform: scale(1.1); }
    #ko-lyrics .ko-petal-4 { left: 86%; animation: ko-petal-drift 11.1s linear infinite 1.2s; transform: scale(0.7); }

    /* ---- JP lyric line ---- */
    #ko-lyrics #ko-line-jp {
      font-family: 'Shippori Mincho B1', 'Yu Mincho', 'Noto Serif JP', serif;
      font-weight: 600;
      font-size: 29px;
      color: var(--ink);
      line-height: 1.38;
      letter-spacing: 0.035em;
      margin-bottom: 10px;
      min-height: 1.35em;
      position: relative;
      z-index: 2;
      text-shadow: 0 1px 0 rgba(255,250,245,0.7);
    }

    #ko-lyrics #ko-line-jp ruby {
      ruby-position: over;
      ruby-align: center;
    }

    #ko-lyrics #ko-line-jp rt {
      font-family: 'Cormorant SC', 'Cormorant Garamond', serif;
      font-weight: 400;
      font-size: 10px;
      letter-spacing: 0.1em;
      line-height: 1;
      margin-bottom: 2.5px;
      opacity: 0.85;
      font-style: normal;
      text-transform: lowercase;
    }

    /* ---- EN natural line ---- */
    #ko-lyrics #ko-line-en {
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      font-style: italic;
      font-weight: 500;
      font-size: 20px;
      color: var(--amethyst);
      line-height: 1.45;
      letter-spacing: 0.015em;
      min-height: 1.4em;
      position: relative;
      z-index: 2;
      text-shadow: 0 1px 0 rgba(255,250,245,0.5);
    }

    /* EN-only song style — unused for this JP song, but defensive default. */
    #ko-lyrics #ko-line-en.en-song {
      font-size: 24px;
      font-style: italic;
      font-weight: 500;
    }

    /* ---- Chunk-by-chunk stagger fade on line change ----
       The COLOR_POLL rewrites innerHTML on each new JP line, which re-triggers
       child animations. Each [data-wc] span fades in with a soft stagger.   */
    #ko-lyrics #ko-line-jp [data-wc] {
      display: inline-block;
      animation: ko-chunk-in 0.45s cubic-bezier(.2,.6,.2,1) both;
    }
    #ko-lyrics #ko-line-en [data-wc] {
      display: inline;
      animation: ko-chunk-in 0.55s cubic-bezier(.2,.6,.2,1) both;
      animation-delay: 0.12s;
    }
    #ko-lyrics #ko-line-jp [data-wc]:nth-child(1) { animation-delay: 0s; }
    #ko-lyrics #ko-line-jp [data-wc]:nth-child(2) { animation-delay: 0.05s; }
    #ko-lyrics #ko-line-jp [data-wc]:nth-child(3) { animation-delay: 0.10s; }
    #ko-lyrics #ko-line-jp [data-wc]:nth-child(4) { animation-delay: 0.15s; }
    #ko-lyrics #ko-line-jp [data-wc]:nth-child(5) { animation-delay: 0.20s; }
    #ko-lyrics #ko-line-jp [data-wc]:nth-child(6) { animation-delay: 0.25s; }
    #ko-lyrics #ko-line-en [data-wc]:nth-child(1) { animation-delay: 0.14s; }
    #ko-lyrics #ko-line-en [data-wc]:nth-child(2) { animation-delay: 0.19s; }
    #ko-lyrics #ko-line-en [data-wc]:nth-child(3) { animation-delay: 0.24s; }
    #ko-lyrics #ko-line-en [data-wc]:nth-child(4) { animation-delay: 0.29s; }
    #ko-lyrics #ko-line-en [data-wc]:nth-child(5) { animation-delay: 0.34s; }
    #ko-lyrics #ko-line-en [data-wc]:nth-child(6) { animation-delay: 0.39s; }

    /* ---- Keyframes ---- */
    @keyframes ko-card-in {
      from { opacity: 0; transform: translateY(14px) scale(0.985); }
      to   { opacity: 1; transform: translateY(0)    scale(1);     }
    }

    @keyframes ko-chunk-in {
      from { opacity: 0; transform: translateY(4px); filter: blur(2.5px); }
      to   { opacity: 1; transform: translateY(0);   filter: blur(0);     }
    }

    @keyframes ko-apple-breathe {
      0%, 100% {
        transform: scale(1);
        filter: drop-shadow(0 3px 8px rgba(126,29,50,0.45));
      }
      50% {
        transform: scale(1.045);
        filter: drop-shadow(0 4px 12px rgba(192,58,84,0.65));
      }
    }

    @keyframes ko-sparkle {
      0%, 100% { opacity: 0; transform: scale(0.4); }
      45%, 55% { opacity: 0.95; transform: scale(1); }
    }

    @keyframes ko-petal-drift {
      0%   { transform: translateY(-28px) rotate(0deg)   translateX(0)   scale(var(--s, 1)); opacity: 0; }
      12%  { opacity: 0.55; }
      50%  { transform: translateY(55px)  rotate(170deg) translateX(14px) scale(var(--s, 1)); opacity: 0.45; }
      85%  { opacity: 0.2; }
      100% { transform: translateY(140px) rotate(360deg) translateX(-8px) scale(var(--s, 1)); opacity: 0; }
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

  // The one structural HTML this skeleton renders: a slot with the two IDs
  // the tick writes to. Wrap, decorate, nest freely — just keep the IDs
  // inside #ko-lyrics > .ko-slot.
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot">
      <span class="ko-corner ko-corner-tl"></span>
      <span class="ko-corner ko-corner-tr"></span>
      <span class="ko-corner ko-corner-bl"></span>
      <span class="ko-corner ko-corner-br"></span>
      <div class="ko-apple">
        <span class="ko-apple-img"></span>
        <span class="ko-apple-bite"></span>
      </div>
      <span class="ko-sparkle ko-sparkle-1"></span>
      <span class="ko-sparkle ko-sparkle-2"></span>
      <span class="ko-sparkle ko-sparkle-3"></span>
      <span class="ko-petal ko-petal-1"></span>
      <span class="ko-petal ko-petal-2"></span>
      <span class="ko-petal ko-petal-3"></span>
      <span class="ko-petal ko-petal-4"></span>
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

  // --- Position tick: re-anchor the lyric zone to the video rect ---
  // Anchoring to the <video> rect (vs. viewport or #movie_player) IS
  // structural: YouTube detaches #movie_player on scroll/theater/fullscreen
  // toggles, so we recompute from the video element every 250ms. The
  // specific anchor fractions come from window.__koPosition — those are
  // taste, not plumbing.
  //
  // posKey cache is LOAD-BEARING — without it every 250ms writes to
  // style.left/top unconditionally, cascading through YouTube's
  // MutationObservers on a 50K-node DOM.
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
      lyrics.style.left     = (r.left + r.width * p.anchorX) + 'px';
      lyrics.style.top      = (r.top  + r.height * p.anchorY) + 'px';
      lyrics.style.width    = (r.width * p.widthFrac) + 'px';
      lyrics.style.maxWidth = (r.width * p.widthFrac) + 'px';
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

  // --- Signature: the apple gets bitten at midnight ---
  // At t = 156s, the line "鐘が鳴り響くシンデレラ" hits — the bells are ringing,
  // Cinderella's spell breaks, fate turns. A crescent bite appears on the
  // apple's top-right. Before this: whole. After: bitten. Once bitten, the
  // mark stays; we track the raw inSong value so seeking backward restores
  // the whole apple. Low cadence (700ms) — this is decor, not sync.
  const APPLE_BITE_AT = 156.0;
  let lastBittenState = -1;
  const biteTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    const sl = window.__setlist;
    const song = (curSongIdx >= 0 && sl[curSongIdx]) || sl[0];
    if (v && song) {
      const inSong = Math.max(0, v.currentTime - (song.s || 0));
      const state = inSong >= APPLE_BITE_AT ? 1 : 0;
      if (state !== lastBittenState) {
        const slot = document.querySelector('#ko-lyrics .ko-slot');
        if (slot) {
          slot.setAttribute('data-bitten', String(state));
          lastBittenState = state;
        }
      }
    }
    setTimeout(biteTick, 700);
  };
  biteTick();

})();
